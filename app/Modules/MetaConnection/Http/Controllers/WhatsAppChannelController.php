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
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

class WhatsAppChannelController extends Controller
{
    private function org(): Organization
    {
        return TenantContext::get() ?? abort(403, 'Select an authorized workspace.');
    }

    public function index(Request $request)
    {
        if ($request->hasAny(['code', 'error'])) {
            try {
                $attempt = $this->consumeAttempt($request);
                if ($request->has('error')) {
                    throw ValidationException::withMessages(['signup' => 'Facebook signup was cancelled or permission was declined. Please try again.']);
                }
                $result = $this->connectOAuth((string) $request->query('code'), $attempt, $request);

                return response()->view('meta-connected', $result);
            } catch (\Throwable $error) {
                return response()->view('meta-connected', ['channel' => null, 'error' => $this->errorMessage($error)]);
            }
        }
        $org = $this->org();
        $channels = WhatsAppChannel::where('organization_id', $org->id)->orderByDesc('is_default')->latest()->get();

        return Inertia::render('whatsapp/connect', [
            'channels' => $channels, 'maxChannels' => $org->getMaxChannels(),
            'channelsCount' => $org->channels()->withoutGlobalScopes()->whereNull('deleted_at')->count(), 'canAddMore' => $org->canAddMoreChannels(),
            'defaultWebhookUrl' => url('/webhooks/meta'), 'defaultVerifyToken' => '',
            'metaAppId' => MetaApi::setting('app_id') ?? '', 'metaConfigId' => MetaApi::setting('config_id') ?? '',
            'graphVersion' => config('release.meta.graph_version'),
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
            'graphVersion' => config('release.meta.graph_version'),
        ]);
    }

    public function beginSignup(Request $request)
    {
        abort_unless($this->org()->canAddMoreChannels(), 422, 'Number allowance reached. Contact your administrator.');
        $app = MetaApi::setting('app_id');
        $config = MetaApi::setting('config_id');
        abort_unless($app && $config && MetaApi::setting('app_secret'), 422, 'The administrator must configure Meta app credentials and Embedded Signup first.');
        $state = Str::random(48);
        // Bind signup to its starting workspace, user, redirect URI and lifetime.
        $attempt = ['state' => $state, 'organization_id' => $this->org()->id, 'user_id' => $request->user()->id,
            'redirect_uri' => url('/whatsapp/connect'), 'expires_at' => now()->addMinutes(10)->timestamp];
        $request->session()->put('meta_signup', $attempt);
        $request->session()->forget('meta_signup_pending');

        return response()->json(['state' => $state, 'app_id' => $app, 'config_id' => $config, 'graph_version' => config('release.meta.graph_version'),
            'url' => 'https://www.facebook.com/'.config('release.meta.graph_version').'/dialog/oauth?'.http_build_query([
                'client_id' => $app, 'config_id' => $config, 'redirect_uri' => $attempt['redirect_uri'],
                'response_type' => 'code', 'state' => $state, 'override_default_response_type' => 'true',
                'extras' => json_encode(['featureType' => 'whatsapp_business_app_onboarding']),
            ]),
        ]);
    }

    private function consumeAttempt(Request $request): array
    {
        $attempt = $request->session()->get('meta_signup');
        abort_unless(is_array($attempt) && $request->filled('state') && hash_equals($attempt['state'], (string) $request->input('state'))
            && $attempt['organization_id'] === $this->org()->id && $attempt['user_id'] === $request->user()->id
            && $attempt['expires_at'] >= now()->timestamp, 403, 'The Facebook signup session expired or does not match this workspace. Start again.');
        $request->session()->forget('meta_signup');

        return $attempt;
    }

    private function connectOAuth(string $code, array $attempt, Request $request): array
    {
        $app = MetaApi::setting('app_id');
        $secret = MetaApi::setting('app_secret');
        $response = Http::timeout(20)->get(MetaApi::base().'/oauth/access_token', array_filter([
            'client_id' => $app, 'client_secret' => $secret,
            // SDK codes are exchanged without a redirect URI; redirect-flow codes use the exact original URI.
            'redirect_uri' => $request->isMethod('GET') ? $attempt['redirect_uri'] : null, 'code' => $code,
        ]));
        if (! $response->successful() || ! $response->json('access_token')) {
            throw ValidationException::withMessages(['signup' => 'Facebook authorization failed. Restart signup and grant WhatsApp access.']);
        }
        $token = $response->json('access_token');
        $debugResponse = Http::timeout(15)->get(MetaApi::base().'/debug_token', ['input_token' => $token, 'access_token' => $app.'|'.$secret]);
        $debug = $debugResponse->json('data', []);
        abort_unless($debugResponse->successful() && ($debug['is_valid'] ?? false) && (string) ($debug['app_id'] ?? '') === (string) $app, 422, 'Facebook returned an invalid authorization for this app.');
        $wabas = collect($debug['granular_scopes'] ?? [])->whereIn('scope', ['whatsapp_business_management', 'whatsapp_business_messaging'])->flatMap(fn ($scope) => $scope['target_ids'] ?? [])->filter()->unique();
        if ($wabas->isEmpty()) {
            throw ValidationException::withMessages(['signup' => 'Facebook did not share a WhatsApp Business Account. Select your account and grant WhatsApp permissions.']);
        }
        $selectedWaba = $request->input('waba_id');
        $selectedPhone = $request->input('phone_number_id');
        if ($selectedWaba && ! $wabas->contains($selectedWaba)) {
            throw ValidationException::withMessages(['signup' => 'The selected WhatsApp account was not authorized by Facebook.']);
        }
        $choices = [];
        foreach ($selectedWaba ? [$selectedWaba] : $wabas as $waba) {
            foreach (app(MetaApi::class)->numbers($waba, $token) as $phone) {
                if (! $selectedPhone || $phone['id'] === $selectedPhone) {
                    $choices[] = ['waba_id' => $waba, 'phone_number_id' => $phone['id'], 'phone' => $phone];
                }
            }
        }
        if (! $choices) {
            throw ValidationException::withMessages(['signup' => 'Facebook did not return the selected number. Complete number verification in Facebook, then try again.']);
        }
        // Never silently import an unrelated first number when Meta shared several assets.
        if (count($choices) > 1) {
            $request->session()->put('meta_signup_pending', ['token' => $token, 'choices' => $choices, 'organization_id' => $this->org()->id,
                'user_id' => $request->user()->id, 'expires_at' => now()->addMinutes(10)->timestamp]);

            return ['channel' => null, 'error' => null, 'pendingNumbers' => $this->publicChoices($choices)];
        }
        $choice = $choices[0];
        $channel = $this->persist(['phone_number_id' => $choice['phone_number_id'], 'waba_id' => $choice['waba_id'], 'access_token' => $token], $choice['phone']);

        return ['channel' => $channel, 'error' => null];
    }

    private function publicChoices(array $choices): array
    {
        return array_map(fn ($choice) => ['id' => $choice['phone_number_id'], 'waba_id' => $choice['waba_id'], 'name' => $choice['phone']['verified_name'] ?? 'WhatsApp', 'phone' => $choice['phone']['display_phone_number'] ?? $choice['phone_number_id']], $choices);
    }

    public function reviewSignup(Request $request)
    {
        $pending = $this->pendingSignup($request);

        return response()->view('meta-connected', ['channel' => null, 'error' => null, 'pendingNumbers' => $this->publicChoices($pending['choices'])]);
    }

    private function pendingSignup(Request $request): array
    {
        $pending = $request->session()->get('meta_signup_pending');
        abort_unless($pending && $pending['organization_id'] === $this->org()->id && $pending['user_id'] === $request->user()->id && $pending['expires_at'] >= now()->timestamp, 403, 'Signup expired. Start Facebook signup again.');

        return $pending;
    }

    public function completeSignup(Request $request)
    {
        $data = $request->validate(['phone_number_id' => 'required|string', 'waba_id' => 'required|string']);
        try {
            $pending = $this->pendingSignup($request);
            $choice = collect($pending['choices'])->first(fn ($choice) => $choice['phone_number_id'] === $data['phone_number_id'] && $choice['waba_id'] === $data['waba_id']);
            abort_unless($choice, 403, 'Choose a number authorized by Facebook.');
            $channel = $this->persist([...$data, 'access_token' => $pending['token']], $choice['phone']);
            $request->session()->forget('meta_signup_pending');

            return response()->view('meta-connected', ['channel' => $channel, 'error' => null]);
        } catch (\Throwable $error) {
            return response()->view('meta-connected', ['channel' => null, 'error' => $this->errorMessage($error)]);
        }
    }

    public function quickConnect(Request $request)
    {
        if (! $request->filled('code')) {
            $channel = $this->save($request);

            return response()->json(['success' => true, 'channel' => $channel, 'message' => 'WhatsApp number connected.']);
        }
        $request->validate(['code' => 'required|string|max:4096', 'state' => 'required|string|max:100', 'phone_number_id' => 'nullable|regex:/^\d+$/', 'waba_id' => 'nullable|regex:/^\d+$/']);
        $attempt = $this->consumeAttempt($request);
        $result = $this->connectOAuth($request->input('code'), $attempt, $request);

        return response()->json(['success' => ! empty($result['channel']), 'pending' => ! empty($result['pendingNumbers']), 'review_url' => url('/channels/signup/review'), 'channel' => $result['channel']]);
    }

    private function errorMessage(\Throwable $error): string
    {
        // Do not log OAuth codes, tokens, complete query strings or provider request URLs.
        Log::warning('WhatsApp signup did not complete.', ['exception_type' => $error::class, 'organization_id' => TenantContext::id()]);
        if ($error instanceof ValidationException) {
            return (string) collect($error->errors())->flatten()->first();
        }
        if ($error instanceof HttpExceptionInterface) {
            return $error->getMessage() ?: 'Facebook signup could not be completed.';
        }

        return 'Meta could not complete the connection. Please retry or contact support.';
    }

    public function store(Request $request)
    {
        $channel = $this->save($request);

        return $request->expectsJson() ? response()->json(['success' => true, 'message' => 'WhatsApp number saved.', 'channel' => $channel]) : redirect('/whatsapp/connect')->with('success', 'WhatsApp number saved.');
    }

    private function save(Request $request): WhatsAppChannel
    {
        $data = $request->validate(['id' => 'nullable|uuid', 'name' => 'nullable|string|max:100', 'phone_number_id' => 'required|regex:/^\d+$/|max:40',
            'waba_id' => 'required|regex:/^\d+$/|max:40', 'access_token' => 'nullable|string|max:10000', 'app_id' => 'nullable|string|max:100', 'app_secret' => 'nullable|string|max:1000']);
        $existing = ! empty($data['id']) ? WhatsAppChannel::where('organization_id', $this->org()->id)->findOrFail($data['id']) : WhatsAppChannel::where('phone_number_id', $data['phone_number_id'])->first();
        $data['access_token'] = ($data['access_token'] ?? null) ?: $existing?->access_token;
        if (! $data['access_token']) {
            throw ValidationException::withMessages(['access_token' => 'Provide an access token for this number.']);
        }
        if (! collect(app(MetaApi::class)->numbers($data['waba_id'], $data['access_token']))->contains('id', $data['phone_number_id'])) {
            throw ValidationException::withMessages(['waba_id' => 'This number does not belong to this WhatsApp Business Account.']);
        }

        return $this->persist($data, app(MetaApi::class)->phone($data['phone_number_id'], $data['access_token']));
    }

    private function persist(array $data, array $phone): WhatsAppChannel
    {
        return DB::transaction(function () use ($data, $phone) {
            $org = Organization::whereKey($this->org()->id)->lockForUpdate()->firstOrFail();
            abort_unless($org->isActive(), 403, 'This workspace is suspended.');
            DB::table('platform_settings')->insertOrIgnore(['key' => 'channel_ownership_lock', 'value' => null, 'created_at' => now(), 'updated_at' => now()]);
            DB::table('platform_settings')->where('key', 'channel_ownership_lock')->lockForUpdate()->first();
            $claimed = WhatsAppChannel::withoutGlobalScopes()->withTrashed()->where('phone_number_id', $data['phone_number_id'])->first();
            if ($claimed && $claimed->organization_id !== $org->id) {
                throw ValidationException::withMessages(['phone_number_id' => 'This number belongs to another workspace. Ask the administrator to transfer it.']);
            }
            $channel = ! empty($data['id']) ? WhatsAppChannel::where('organization_id', $org->id)->findOrFail($data['id']) : $claimed;
            if ((! $channel || $channel->trashed()) && ! $org->canAddMoreChannels()) {
                throw ValidationException::withMessages(['message' => 'Your WhatsApp number allowance is full. Contact your administrator.']);
            }
            // Confirm actual Cloud API registration/coexistence state, rather than treating an OAuth code as connection proof.
            $phone = app(MetaApi::class)->phone($data['phone_number_id'], $data['access_token']);
            $subscription = Http::withToken($data['access_token'])->timeout(15)->post(MetaApi::base().'/'.$data['waba_id'].'/subscribed_apps');
            if (! $subscription->successful() || $subscription->json('success') !== true) {
                throw ValidationException::withMessages(['signup' => 'Meta could not enable incoming messages. Check the app’s WhatsApp management permissions and retry.']);
            }
            $registrationPin = $channel?->registration_pin;
            if (($phone['platform_type'] ?? '') !== 'CLOUD_API') {
                if ($phone['is_on_biz_app'] ?? false) {
                    throw ValidationException::withMessages(['signup' => 'WhatsApp Business app linking is still pending in Meta. Finish the app confirmation, then reconnect.']);
                }
                $registrationPin ??= (string) random_int(100000, 999999);
                $registration = Http::withToken($data['access_token'])->timeout(20)->post(MetaApi::base().'/'.$data['phone_number_id'].'/register', ['messaging_product' => 'whatsapp', 'pin' => $registrationPin]);
                if (! $registration->successful() || $registration->json('success') !== true) {
                    throw ValidationException::withMessages(['signup' => 'Meta could not register this phone number for messaging. Complete verification and any required PIN steps in WhatsApp Manager, then retry.']);
                }
            }
            $restoring = $channel?->trashed() ?? false;
            if ($restoring) {
                $channel->restore();
            }
            $channel ??= new WhatsAppChannel(['organization_id' => $org->id]);
            $metadata = $channel->metadata ?? [];
            $metadata['onboarding'] = ['registered_at' => now()->toIso8601String(), 'webhook_subscribed_at' => now()->toIso8601String(), 'coexistence' => (bool) ($phone['is_on_biz_app'] ?? false)];
            $channel->fill(['name' => $data['name'] ?? $phone['verified_name'] ?? 'WhatsApp', 'phone_number_id' => $data['phone_number_id'], 'phone_number' => $phone['display_phone_number'] ?? null,
                'waba_id' => $data['waba_id'], 'access_token' => $data['access_token'], 'registration_pin' => $registrationPin,
                'quality_rating' => $phone['quality_rating'] ?? 'UNKNOWN', 'status' => 'connected',
                'app_id' => $data['app_id'] ?? $channel->app_id ?? MetaApi::setting('app_id'),
                'app_secret' => ! empty($data['app_secret']) ? $data['app_secret'] : $channel->app_secret,
                'is_default' => $channel->exists && ! $restoring ? $channel->is_default : ! $org->channels()->withoutGlobalScopes()->whereNull('deleted_at')->where('is_default', true)->exists(), 'metadata' => $metadata,
            ])->save();
            // Commerce remains available; never create sample products or use another business's catalog during signup.
            DB::afterCommit(fn () => $this->autoInitializeCommerce($channel));

            return $channel;
        });
    }

    private function autoInitializeCommerce(WhatsAppChannel $channel): void
    {
        try {
            $response = Http::withToken($channel->access_token)->timeout(6)->post(MetaApi::base().'/'.$channel->phone_number_id.'/whatsapp_commerce_settings', ['is_catalog_visible' => true, 'is_cart_enabled' => true]);
            if (! $response->successful()) {
                Log::notice('WhatsApp connected; commerce setup requires attention.', ['channel_id' => $channel->id]);
            }
        } catch (\Throwable) {
            Log::notice('WhatsApp connected; commerce setup can be retried.', ['channel_id' => $channel->id]);
        }
    }

    public function syncFromMeta(Request $request)
    {
        $count = 0;
        $skipped = 0;
        foreach (WhatsAppChannel::where('status', 'connected')->get()->unique('waba_id') as $source) {
            foreach (app(MetaApi::class)->numbers($source->waba_id, $source->access_token) as $phone) {
                if (! $this->org()->canAddMoreChannels() && ! WhatsAppChannel::where('phone_number_id', $phone['id'])->exists()) {
                    $skipped++;

                    continue;
                }
                $this->persist(['phone_number_id' => $phone['id'], 'waba_id' => $source->waba_id, 'access_token' => $source->access_token], $phone);
                $count++;
            }
        }
        $message = "Synced {$count} numbers. {$skipped} skipped because of your allowance.";

        return $request->expectsJson() ? response()->json(['success' => true, 'message' => $message, 'count' => $count]) : back()->with('success', $message);
    }

    public function syncChannel(Request $request, string $id)
    {
        $channel = WhatsAppChannel::findOrFail($id);
        $phone = app(MetaApi::class)->phone($channel->phone_number_id, $channel->access_token);
        $this->persist(['id' => $channel->id, 'phone_number_id' => $channel->phone_number_id, 'waba_id' => $channel->waba_id, 'access_token' => $channel->access_token], $phone);

        return back()->with('success', 'Channel synchronized with Meta.');
    }

    public function testConnection(Request $request, string $id)
    {
        $channel = WhatsAppChannel::findOrFail($id);
        app(MetaApi::class)->phone($channel->phone_number_id, $channel->access_token);

        return response()->json(['success' => true, 'message' => 'Meta verified the number credentials.']);
    }

    public function destroy(Request $request, string $id)
    {
        DB::transaction(function () use ($id) {
            Organization::whereKey($this->org()->id)->lockForUpdate()->firstOrFail();
            $channel = WhatsAppChannel::findOrFail($id);
            $default = $channel->is_default;
            $channel->update(['status' => 'disconnected', 'is_default' => false]);
            $channel->delete();
            if ($default) {
                WhatsAppChannel::oldest()->first()?->update(['is_default' => true]);
            }
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
