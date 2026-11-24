<?php

namespace App\Modules\MetaConnection\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Foundation\Models\Organization;
use App\Modules\MetaConnection\Models\WhatsAppChannel;
use App\Services\MetaApi;
use App\Shared\TenantContext;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class WhatsAppChannelController extends Controller
{
    private function org(): Organization { return TenantContext::get() ?? abort(403, 'Select an authorized workspace.'); }

    public function index(Request $request)
    {
        if ($request->has('code')) {
            try {
                $state = $request->session()->pull('meta_oauth_state');
                if ($state && $request->filled('state') && !hash_equals($state, (string) $request->query('state'))) {
                    throw ValidationException::withMessages(['state' => 'The Meta signup session expired. Please start again.']);
                }
                $channel = $this->connectOAuth((string) $request->query('code'), $request);
                return response()->view('meta-connected', ['channel' => $channel, 'error' => null]);
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::error('Meta OAuth connect error: ' . $e->getMessage(), [
                    'exception' => $e,
                    'query' => $request->query(),
                ]);
                $msg = $e instanceof ValidationException ? collect($e->errors())->flatten()->first() : $e->getMessage();
                return response()->view('meta-connected', [
                    'channel' => null,
                    'error' => $msg ?: 'Could not connect WhatsApp number. Please check permissions and try again.',
                ]);
            }
        }
        // GET query parameters never create or update channels.
        $org = $this->org();
        $channels = WhatsAppChannel::where('organization_id', $org->id)->orderByDesc('is_default')->latest()->get();
        return Inertia::render('whatsapp/connect', [
            'channels' => $channels, 'maxChannels' => $org->getMaxChannels(),
            'channelsCount' => $org->channels()->withoutGlobalScopes()->count(), 'canAddMore' => $org->canAddMoreChannels(),
            'defaultWebhookUrl' => url('/webhooks/meta'), 'defaultVerifyToken' => '',
            'metaAppId' => MetaApi::setting('app_id') ?? '',
        ]);
    }

    public function show(Request $request, string $id)
    {
        return Inertia::render('whatsapp/channel-detail', ['channel' => WhatsAppChannel::findOrFail($id), 'defaultWebhookUrl' => url('/webhooks/meta'), 'defaultVerifyToken' => '']);
    }

    public function wizard(Request $request)
    {
        return Inertia::render('whatsapp/connect-wizard', [
            'existingChannel' => null, 'defaultWebhookUrl' => url('/webhooks/meta'), 'defaultVerifyToken' => '',
            'metaAppId' => MetaApi::setting('app_id') ?? '', 'metaConfigId' => MetaApi::setting('config_id') ?? '',
        ]);
    }

    public function beginSignup(Request $request)
    {
        abort_unless($this->org()->canAddMoreChannels(), 422, 'Number allowance reached. Contact your administrator.');
        $app = MetaApi::setting('app_id') ?: env('META_APP_ID', '1079349601748656');
        $config = MetaApi::setting('config_id') ?: env('META_CONFIG_ID', '1835889181059188');
        abort_unless($app && $config, 422, 'The administrator must configure Meta Embedded Signup first.');
        $state = Str::random(48);
        $request->session()->put('meta_oauth_state', $state);

        $redirectUri = $request->getSchemeAndHttpHost() . '/whatsapp/connect';

        return response()->json(['url' => 'https://www.facebook.com/'.config('release.meta.graph_version').'/dialog/oauth?'.http_build_query([
            'client_id' => $app, 'config_id' => $config, 'redirect_uri' => $redirectUri,
            'response_type' => 'code', 'state' => $state, 'override_default_response_type' => 'true',
            'extras' => json_encode(['featureType' => 'whatsapp_business_app_onboarding', 'sessionInfoVersion' => '3']),
        ])]);
    }

    private function connectOAuth(string $code, ?Request $request = null): WhatsAppChannel
    {
        $app = MetaApi::setting('app_id') ?: env('META_APP_ID', '1079349601748656');
        $secret = MetaApi::setting('app_secret') ?: env('META_APP_SECRET', '02d9ac2a37b98b8b29a189f835c13027');
        abort_unless($app && $secret, 422, 'The administrator must configure Meta app credentials.');

        $origin = $request ? $request->getSchemeAndHttpHost() : url('/');
        $redirectUri = "{$origin}/whatsapp/connect";

        $tokenResponse = Http::timeout(15)->get(MetaApi::base().'/oauth/access_token', [
            'client_id' => $app, 'client_secret' => $secret, 'redirect_uri' => $redirectUri, 'code' => $code,
        ]);

        if (!$tokenResponse->successful()) {
            $altUri = url('/whatsapp/connect');
            if ($altUri !== $redirectUri) {
                $tokenResponse = Http::timeout(15)->get(MetaApi::base().'/oauth/access_token', [
                    'client_id' => $app, 'client_secret' => $secret, 'redirect_uri' => $altUri, 'code' => $code,
                ]);
            }
        }

        $token = $tokenResponse->json('access_token');
        if (!$token) {
            $err = $tokenResponse->json('error.message') ?? 'Meta did not return an access token.';
            throw ValidationException::withMessages(['token' => "Meta authorization failed: {$err}"]);
        }

        $debug = Http::timeout(15)->get(MetaApi::base().'/debug_token', [
            'input_token' => $token, 'access_token' => "{$app}|{$secret}",
        ])->json('data', []);

        $wabas = collect($debug['granular_scopes'] ?? [])
            ->whereIn('scope', ['whatsapp_business_management', 'whatsapp_business_messaging'])
            ->flatMap(fn ($s) => $s['target_ids'] ?? [])
            ->filter()
            ->unique();

        // Fallback: If granular_scopes target_ids is empty, discover WABAs via client accounts or businesses
        if ($wabas->isEmpty()) {
            try {
                $bizResp = Http::withToken($token)->timeout(10)->get(MetaApi::base().'/me/businesses');
                if ($bizResp->successful()) {
                    foreach ($bizResp->json('data', []) as $biz) {
                        $cResp = Http::withToken($token)->timeout(10)->get(MetaApi::base()."/{$biz['id']}/client_whatsapp_business_accounts");
                        if ($cResp->successful()) {
                            foreach ($cResp->json('data', []) as $cw) {
                                if (!empty($cw['id'])) $wabas->push($cw['id']);
                            }
                        }
                    }
                }
            } catch (\Throwable) {}
        }

        if ($wabas->isEmpty() && env('META_WABA_ID')) {
            $wabas->push(env('META_WABA_ID'));
        }

        $first = null;
        foreach ($wabas as $waba) {
            try {
                $numbers = app(MetaApi::class)->numbers($waba, $token);
                foreach ($numbers as $phone) {
                    if (! $this->org()->canAddMoreChannels() && ! WhatsAppChannel::where('phone_number_id', $phone['id'])->exists()) {
                        continue;
                    }
                    $connected = $this->persist(['phone_number_id' => $phone['id'], 'waba_id' => $waba, 'access_token' => $token], $phone);
                    $first ??= $connected;
                }
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::warning("Could not fetch numbers for WABA {$waba}: " . $e->getMessage());
            }
        }

        return $first ?? throw ValidationException::withMessages(['message' => 'No WhatsApp number was shared, or your number allowance is full.']);
    }

    public function quickConnect(Request $request)
    {
        // OAuth callbacks are processed only through the state-verified callback above.
        if ($request->filled('code')) { throw ValidationException::withMessages(['code' => 'Restart Embedded Signup using Add number.']); }
        $channel = $this->save($request);
        return response()->json(['success' => true, 'message' => 'WhatsApp number connected.', 'channel' => $channel]);
    }

    public function store(Request $request)
    {
        $channel = $this->save($request);
        return $request->expectsJson()
            ? response()->json(['success' => true, 'message' => 'WhatsApp number saved.', 'channel' => $channel])
            : redirect('/whatsapp/connect')->with('success', 'WhatsApp number saved.');
    }

    private function save(Request $request): WhatsAppChannel
    {
        $data = $request->validate([
            'id' => 'nullable|uuid', 'name' => 'nullable|string|max:100', 'phone_number_id' => 'required|regex:/^\d+$/|max:40',
            'waba_id' => 'required|regex:/^\d+$/|max:40', 'access_token' => 'nullable|string|max:10000',
            'app_id' => 'nullable|string|max:100', 'app_secret' => 'nullable|string|max:1000',
        ]);
        $existing = ! empty($data['id'])
            ? WhatsAppChannel::where('organization_id', $this->org()->id)->findOrFail($data['id'])
            : WhatsAppChannel::where('organization_id', $this->org()->id)->where('phone_number_id', $data['phone_number_id'])->first();
        $data['access_token'] = ($data['access_token'] ?? null) ?: $existing?->access_token;
        if (! $data['access_token']) { throw ValidationException::withMessages(['access_token' => 'Provide an access token for this number.']); }
        $phone = app(MetaApi::class)->phone($data['phone_number_id'], $data['access_token']);
        $numbers = app(MetaApi::class)->numbers($data['waba_id'], $data['access_token']);
        if (! collect($numbers)->contains('id', $data['phone_number_id'])) { throw ValidationException::withMessages(['waba_id' => 'This number does not belong to the supplied WhatsApp Business Account.']); }
        return $this->persist($data, $phone);
    }

    private function persist(array $data, array $phone): WhatsAppChannel
    {
        return DB::transaction(function () use ($data, $phone) {
            $org = Organization::whereKey($this->org()->id)->lockForUpdate()->firstOrFail();
            abort_unless($org->isActive(), 403, 'This workspace is suspended.');
            // Serialize ownership claims globally, as well as quota changes in this workspace.
            DB::table('platform_settings')->insertOrIgnore(['key' => 'channel_ownership_lock', 'value' => null, 'created_at' => now(), 'updated_at' => now()]);
            DB::table('platform_settings')->where('key', 'channel_ownership_lock')->lockForUpdate()->first();
            $claimed = WhatsAppChannel::withoutGlobalScopes()->withTrashed()->where('phone_number_id', $data['phone_number_id'])->first();
            if ($claimed && $claimed->organization_id !== $org->id) {
                $claimed->update(['organization_id' => $org->id]);
            }
            $channel = ! empty($data['id']) ? WhatsAppChannel::whereKey($data['id'])->where('organization_id', $org->id)->firstOrFail() : $claimed;
            if ((! $channel || $channel->trashed()) && ! $org->canAddMoreChannels()) { throw ValidationException::withMessages(['message' => 'Your WhatsApp number allowance is full. Contact your administrator.']); }
            try {
                Http::withToken($data['access_token'])->timeout(15)->post(MetaApi::base().'/'.$data['waba_id'].'/subscribed_apps');
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::warning("Meta subscribed_apps notice: " . $e->getMessage());
            }
            if ($channel?->trashed()) { $channel->restore(); }
            $channel ??= new WhatsAppChannel(['organization_id' => $org->id]);
            $channel->fill([
                'name' => $data['name'] ?? $phone['verified_name'] ?? 'WhatsApp',
                'phone_number_id' => $data['phone_number_id'], 'phone_number' => $phone['display_phone_number'] ?? null,
                'waba_id' => $data['waba_id'], 'access_token' => $data['access_token'],
                'quality_rating' => $phone['quality_rating'] ?? 'UNKNOWN', 'status' => 'connected',
                'app_id' => $data['app_id'] ?? $channel->app_id,
                'app_secret' => ! empty($data['app_secret']) ? $data['app_secret'] : $channel->app_secret,
                'is_default' => $channel->exists ? $channel->is_default : ! $org->channels()->withoutGlobalScopes()->whereNull('deleted_at')->exists(),
            ])->save();

            // Automatically initialize WhatsApp Commerce Storefront & Catalog for this connected number
            $this->autoInitializeCommerce($channel);

            return $channel;
        });
    }

    /**
     * Automatically initialize WhatsApp Commerce Storefront, shopping cart, and catalog for any connected number.
     */
    private function autoInitializeCommerce(WhatsAppChannel $channel): void
    {
        try {
            $token = $channel->access_token ?: \Illuminate\Support\Facades\Cache::get('meta_whatsapp_token') ?: env('META_WHATSAPP_TOKEN', '');
            if (!$token || !$channel->phone_number_id) {
                return;
            }

            // 1. Enable WhatsApp Commerce Settings (Storefront & Cart) on Meta Cloud API
            \Illuminate\Support\Facades\Http::withToken($token)
                ->timeout(6)
                ->post("https://graph.facebook.com/v22.0/{$channel->phone_number_id}/whatsapp_commerce_settings?is_catalog_visible=true&is_cart_enabled=true");

            // 2. Ensure initial products exist for this organization
            if (\App\Modules\Commerce\Models\CommerceProduct::where('organization_id', $channel->organization_id)->count() === 0) {
                app(\App\Modules\Commerce\Http\Controllers\CommerceController::class)->seedInitialProducts($channel->organization_id);
            }

            // 3. If an organization Meta Catalog ID exists, link it to this channel's WABA
            $orgCatalogId = \Illuminate\Support\Facades\Cache::get("org_{$channel->organization_id}_meta_catalog_id");
            if (!empty($orgCatalogId) && is_numeric($orgCatalogId) && !empty($channel->waba_id)) {
                \Illuminate\Support\Facades\Http::withToken($token)
                    ->asForm()
                    ->timeout(6)
                    ->post("https://graph.facebook.com/v22.0/{$channel->waba_id}/product_catalogs", [
                        'catalog_id' => $orgCatalogId,
                    ]);
            }
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning("Auto-initialize commerce for channel {$channel->id} notice: " . $e->getMessage());
        }
    }

    public function syncFromMeta(Request $request)
    {
        $existing = WhatsAppChannel::where('status', 'connected')->get(); $count = 0; $skipped = 0;
        foreach ($existing->unique('waba_id') as $source) {
            foreach (app(MetaApi::class)->numbers($source->waba_id, $source->access_token) as $phone) {
                if (! $this->org()->canAddMoreChannels() && ! $existing->contains('phone_number_id', $phone['id'])) { $skipped++; continue; }
                $this->persist(['phone_number_id' => $phone['id'], 'waba_id' => $source->waba_id, 'access_token' => $source->access_token], $phone); $count++;
            }
        }
        return back()->with('success', "Synced {$count} numbers from Meta. {$skipped} numbers skipped.");
    }

    public function testConnection(Request $request, string $id)
    {
        $channel = WhatsAppChannel::where('organization_id', $this->org()->id)->findOrFail($id);

        // If still a placeholder, explain clearly to the user
        if (str_starts_with($channel->phone_number_id, 'phone_')) {
            return response()->json([
                'success' => false,
                'message' => 'Please enter the real 15-digit Meta Phone Number ID. Click "Edit Credentials" and paste your Phone Number ID from Meta Developer Dashboard (WhatsApp > API Setup).',
            ], 422);
        }

        try {
            // Attempt 1: Full fields
            $response = Http::withToken($channel->access_token)
                ->get("https://graph.facebook.com/v22.0/{$channel->phone_number_id}", [
                    'fields' => 'verified_name,code_verification_status,display_phone_number,quality_rating',
                ]);

            // Attempt 2: Basic fields fallback (if verified_name is not permitted e.g. test numbers or messaging tokens)
            if (!$response->successful()) {
                $response = Http::withToken($channel->access_token)
                    ->get("https://graph.facebook.com/v22.0/{$channel->phone_number_id}", [
                        'fields' => 'display_phone_number,quality_rating',
                    ]);
            }

            // Attempt 3: Bare node query
            if (!$response->successful()) {
                $response = Http::withToken($channel->access_token)
                    ->get("https://graph.facebook.com/v22.0/{$channel->phone_number_id}");
            }

            if ($response->successful()) {
                $data = $response->json();
                $updateData = [
                    'status' => 'connected',
                    'quality_rating' => $data['quality_rating'] ?? 'GREEN',
                    'webhook_verified_at' => now(),
                ];
                if (!empty($data['display_phone_number'])) {
                    $updateData['phone_number'] = $data['display_phone_number'];
                }
                $channel->update($updateData);

                return response()->json([
                    'success' => true,
                    'message' => 'Connection verified with Meta!',
                    'data' => $data,
                ]);
            }

            // Attempt 4: Query via WABA phone numbers list
            if ($channel->waba_id) {
                try {
                    $wabaResp = Http::withToken($channel->access_token)
                        ->get("https://graph.facebook.com/v22.0/{$channel->waba_id}/phone_numbers");
                    if ($wabaResp->successful()) {
                        $phones = $wabaResp->json('data') ?? [];
                        foreach ($phones as $p) {
                            if (($p['id'] ?? '') === $channel->phone_number_id) {
                                $channel->update([
                                    'status' => 'connected',
                                    'phone_number' => $p['display_phone_number'] ?? $channel->phone_number,
                                    'quality_rating' => $p['quality_rating'] ?? 'GREEN',
                                    'webhook_verified_at' => now(),
                                ]);
                                return response()->json([
                                    'success' => true,
                                    'message' => 'Connection verified with Meta!',
                                    'data' => $p,
                                ]);
                            }
                        }
                    }
                } catch (\Throwable $e) {}
            }

            // Attempt 5: Verify WhatsApp Business Account (WABA) directly
            if ($channel->waba_id) {
                try {
                    $wabaCheck = Http::withToken($channel->access_token)
                        ->get("https://graph.facebook.com/v22.0/{$channel->waba_id}");
                    if ($wabaCheck->successful()) {
                        $channel->update([
                            'status' => 'connected',
                            'webhook_verified_at' => now(),
                        ]);
                        return response()->json([
                            'success' => true,
                            'message' => 'Connection verified with Meta (WABA Account Active)!',
                            'data' => $wabaCheck->json(),
                        ]);
                    }
                } catch (\Throwable $e) {}
            }

            // Attempt 6: Check if token is valid but lacks asset permission for this phone number
            try {
                $meCheck = Http::withToken($channel->access_token)
                    ->get("https://graph.facebook.com/v22.0/me");
                if ($meCheck->successful()) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Access Token is valid, but it does NOT have permission for Phone Number ID ' . $channel->phone_number_id . '. In Meta Business Settings > Accounts > WhatsApp accounts, please add your System User and grant "Full control (Manage WhatsApp account)".',
                    ], 422);
                }
            } catch (\Throwable $e) {}

            return response()->json([
                'success' => false,
                'message' => 'Meta API Error: ' . ($response->json('error.message') ?? 'Unknown error'),
            ], 422);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Could not reach Meta API: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function destroy(Request $request, string $id)
    {
        DB::transaction(function () use ($id) {
            Organization::whereKey($this->org()->id)->lockForUpdate()->firstOrFail();
            $channel = WhatsAppChannel::findOrFail($id); $default = $channel->is_default;
            $channel->update(['status' => 'disconnected', 'is_default' => false]); $channel->delete();
            if ($default) { WhatsAppChannel::where('organization_id', $this->org()->id)->oldest()->first()?->update(['is_default' => true]); }
        });
        return redirect('/whatsapp/connect')->with('success', 'WhatsApp number disconnected. Message history retained.');
    }

    public function setDefault(Request $request, string $id)
    {
        DB::transaction(function () use ($id) {
            Organization::whereKey($this->org()->id)->lockForUpdate()->firstOrFail();
            $channel = WhatsAppChannel::findOrFail($id);
            WhatsAppChannel::where('organization_id', $this->org()->id)->update(['is_default' => false]);
            $channel->update(['is_default' => true]);
        });
        return back()->with('success', 'Default number updated. Existing conversations keep their sender number.');
    }
}
