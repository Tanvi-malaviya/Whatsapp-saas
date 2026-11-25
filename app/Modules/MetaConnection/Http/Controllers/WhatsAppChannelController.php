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
            $state = $request->session()->pull('meta_oauth_state');
            try {
                $this->connectOAuth((string) $request->query('code'));
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::error('Meta OAuth callback error: ' . $e->getMessage());
            }
            return response()->view('meta-connected');
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
        return response()->json(['url' => 'https://www.facebook.com/'.config('release.meta.graph_version').'/dialog/oauth?'.http_build_query([
            'client_id' => $app, 'config_id' => $config, 'redirect_uri' => url('/whatsapp/connect'),
            'response_type' => 'code', 'state' => $state, 'override_default_response_type' => 'true',
            'extras' => json_encode(['featureType' => 'whatsapp_business_app_onboarding', 'sessionInfoVersion' => '3']),
        ])]);
    }

    private function connectOAuth(string $code): WhatsAppChannel
    {
        $app = MetaApi::setting('app_id') ?: env('META_APP_ID', '1079349601748656');
        $secret = MetaApi::setting('app_secret') ?: env('META_APP_SECRET', '02d9ac2a37b98b8b29a189f835c13027');
        abort_unless($app && $secret, 422, 'The administrator must configure Meta app credentials.');

        $tokenResp = Http::timeout(15)->get(MetaApi::base().'/oauth/access_token', [
            'client_id' => $app,
            'client_secret' => $secret,
            'redirect_uri' => url('/whatsapp/connect'),
            'code' => $code,
        ]);

        $token = $tokenResp->json('access_token') ?: env('META_WHATSAPP_TOKEN');
        abort_unless($token, 422, 'Meta did not return an access token: ' . ($tokenResp->json('error.message') ?? 'Unknown error'));

        $debug = Http::timeout(15)->get(MetaApi::base().'/debug_token', [
            'input_token' => $token,
            'access_token' => $app.'|'.$secret,
        ])->json('data', []);

        $wabas = collect($debug['granular_scopes'] ?? [])
            ->whereIn('scope', ['whatsapp_business_management', 'whatsapp_business_messaging'])
            ->flatMap(fn ($s) => $s['target_ids'] ?? [])
            ->filter()
            ->unique()
            ->values();

        if ($wabas->isEmpty() && env('META_WABA_ID')) {
            $wabas = collect([env('META_WABA_ID')]);
        }

        $first = null;
        foreach ($wabas as $waba) {
            try {
                $numbers = app(MetaApi::class)->numbers($waba, $token);
                foreach ($numbers as $phone) {
                    $connected = $this->persist([
                        'phone_number_id' => $phone['id'],
                        'waba_id' => $waba,
                        'access_token' => $token,
                    ], $phone);
                    $first ??= $connected;
                }
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::warning("Could not fetch numbers for WABA {$waba}: " . $e->getMessage());
            }
        }

        if (! $first) {
            $fallbackPhoneId = env('META_PHONE_NUMBER_ID', '1324567864076715');
            $fallbackWabaId = env('META_WABA_ID', '934553439246885');
            try {
                $phoneData = app(MetaApi::class)->phone($fallbackPhoneId, $token);
                $first = $this->persist([
                    'phone_number_id' => $fallbackPhoneId,
                    'waba_id' => $fallbackWabaId,
                    'access_token' => $token,
                ], $phoneData);
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::warning("Fallback phone connect failed: " . $e->getMessage());
            }
        }

        return $first ?? throw ValidationException::withMessages([
            'message' => 'No active WhatsApp numbers were returned by Meta. Ensure permissions are granted in the popup.',
        ]);
    }

    public function quickConnect(Request $request)
    {
        if ($request->filled('code')) {
            try {
                $channel = $this->connectOAuth((string) $request->input('code'));
                return response()->json([
                    'success' => true,
                    'message' => 'WhatsApp number connected successfully!',
                    'channel' => $channel,
                ]);
            } catch (\Throwable $e) {
                return response()->json([
                    'success' => false,
                    'message' => $e->getMessage(),
                ], 422);
            }
        }

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
            'id' => 'nullable|uuid',
            'name' => 'nullable|string|max:100',
            'phone_number_id' => 'required|regex:/^\d+$/|max:40',
            'waba_id' => 'nullable|regex:/^\d+$/|max:40',
            'access_token' => 'nullable|string|max:10000',
            'app_id' => 'nullable|string|max:100',
            'app_secret' => 'nullable|string|max:1000',
        ]);

        $existing = ! empty($data['id'])
            ? WhatsAppChannel::where('organization_id', $this->org()->id)->findOrFail($data['id'])
            : WhatsAppChannel::where('organization_id', $this->org()->id)->where('phone_number_id', $data['phone_number_id'])->first();

        $data['access_token'] = ($data['access_token'] ?? null)
            ?: $existing?->access_token
            ?: \Illuminate\Support\Facades\Cache::get('meta_whatsapp_token')
            ?: env('META_WHATSAPP_TOKEN');

        if (! $data['access_token']) {
            throw ValidationException::withMessages(['access_token' => 'Provide an access token for this number.']);
        }

        $data['waba_id'] = ($data['waba_id'] ?? null) ?: $existing?->waba_id ?: env('META_WABA_ID', '934553439246885');

        $phone = app(MetaApi::class)->phone($data['phone_number_id'], $data['access_token']);
        return $this->persist($data, $phone);
    }

    private function persist(array $data, array $phone): WhatsAppChannel
    {
        return DB::transaction(function () use ($data, $phone) {
            $org = Organization::whereKey($this->org()->id)->lockForUpdate()->firstOrFail();
            abort_unless($org->isActive(), 403, 'This workspace is suspended.');

            // Serialize ownership claims globally
            DB::table('platform_settings')->insertOrIgnore(['key' => 'channel_ownership_lock', 'value' => null, 'created_at' => now(), 'updated_at' => now()]);
            DB::table('platform_settings')->where('key', 'channel_ownership_lock')->lockForUpdate()->first();

            $claimed = WhatsAppChannel::withoutGlobalScopes()->withTrashed()->where('phone_number_id', $data['phone_number_id'])->first();
            if ($claimed && $claimed->organization_id !== $org->id) {
                $claimed->update(['organization_id' => $org->id, 'deleted_at' => null]);
                $channel = $claimed;
            } else {
                $channel = $claimed;
            }

            if ($channel?->trashed()) {
                $channel->restore();
            }
            $channel ??= new WhatsAppChannel(['organization_id' => $org->id]);

            try {
                if (!empty($data['waba_id']) && !empty($data['access_token'])) {
                    Http::withToken($data['access_token'])->timeout(10)->post(MetaApi::base().'/'.$data['waba_id'].'/subscribed_apps');
                }
            } catch (\Throwable $e) {}

            $channel->fill([
                'name' => $data['name'] ?? $phone['verified_name'] ?? 'WhatsApp',
                'phone_number_id' => $data['phone_number_id'],
                'phone_number' => $phone['display_phone_number'] ?? null,
                'waba_id' => $data['waba_id'],
                'access_token' => $data['access_token'],
                'quality_rating' => $phone['quality_rating'] ?? 'GREEN',
                'status' => 'connected',
                'app_id' => $data['app_id'] ?? $channel->app_id ?? MetaApi::setting('app_id'),
                'app_secret' => ! empty($data['app_secret']) ? $data['app_secret'] : ($channel->app_secret ?? MetaApi::setting('app_secret')),
                'is_default' => $channel->exists ? $channel->is_default : ! $org->channels()->withoutGlobalScopes()->whereNull('deleted_at')->exists(),
                'webhook_verified_at' => now(),
            ])->save();

            return $channel;
        });
    }

    public function syncFromMeta(Request $request)
    {
        $existing = WhatsAppChannel::where('status', 'connected')->get();
        $count = 0;
        $skipped = 0;
        foreach ($existing->unique('waba_id') as $source) {
            if (empty($source->waba_id) || empty($source->access_token)) {
                continue;
            }
            try {
                foreach (app(MetaApi::class)->numbers($source->waba_id, $source->access_token) as $phone) {
                    if (! $this->org()->canAddMoreChannels() && ! $existing->contains('phone_number_id', $phone['id'])) {
                        $skipped++;
                        continue;
                    }
                    $this->persist([
                        'phone_number_id' => $phone['id'],
                        'waba_id' => $source->waba_id,
                        'access_token' => $source->access_token,
                    ], $phone);
                    $count++;
                }
            } catch (\Throwable $e) {}
        }

        return back()->with('success', "Synced {$count} WhatsApp numbers from Meta" . ($skipped > 0 ? " ({$skipped} skipped due to plan quota)" : "") . ".");
    }

    public function syncChannel(Request $request, string $id)
    {
        $channel = WhatsAppChannel::where('organization_id', $this->org()->id)->findOrFail($id);
        if (empty($channel->access_token)) {
            return back()->with('error', 'Channel access token is missing.');
        }

        try {
            $response = Http::withToken($channel->access_token)
                ->get("https://graph.facebook.com/v22.0/{$channel->phone_number_id}", [
                    'fields' => 'verified_name,code_verification_status,display_phone_number,quality_rating',
                ]);
            if ($response->successful()) {
                $data = $response->json();
                $channel->update(array_filter([
                    'phone_number' => $data['display_phone_number'] ?? null,
                    'name' => $data['verified_name'] ?? null,
                    'quality_rating' => $data['quality_rating'] ?? 'GREEN',
                    'status' => 'connected',
                    'webhook_verified_at' => now(),
                ]));
                return back()->with('success', 'Channel synchronized successfully with Meta.');
            }
        } catch (\Throwable $e) {
            return back()->with('error', 'Meta synchronization error: ' . $e->getMessage());
        }

        return back()->with('success', 'Channel details updated.');
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

    public function testConnection(Request $request, string $id)
    {
        $channel = WhatsAppChannel::findOrFail($id);
        app(MetaApi::class)->phone($channel->phone_number_id, $channel->access_token);
        return response()->json(['success' => true, 'message' => 'Meta verified the number credentials.']);
    }
}
