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
            abort_unless($state && hash_equals($state, (string) $request->query('state')), 403, 'The Meta signup session expired. Start again.');
            $this->connectOAuth((string) $request->query('code'));
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
        $app = MetaApi::setting('app_id'); $config = MetaApi::setting('config_id');
        abort_unless($app && $config, 422, 'The administrator must configure Meta Embedded Signup first.');
        $state = Str::random(48); $request->session()->put('meta_oauth_state', $state);
        return response()->json(['url' => 'https://www.facebook.com/'.config('release.meta.graph_version').'/dialog/oauth?'.http_build_query([
            'client_id' => $app, 'config_id' => $config, 'redirect_uri' => url('/whatsapp/connect'),
            'response_type' => 'code', 'state' => $state, 'override_default_response_type' => 'true',
            'extras' => json_encode(['featureType' => 'whatsapp_business_app_onboarding', 'sessionInfoVersion' => '3']),
        ])]);
    }

    private function connectOAuth(string $code): WhatsAppChannel
    {
        $app = MetaApi::setting('app_id'); $secret = MetaApi::setting('app_secret');
        abort_unless($app && $secret, 422, 'The administrator must configure Meta app credentials.');
        $token = Http::timeout(15)->get(MetaApi::base().'/oauth/access_token', [
            'client_id' => $app, 'client_secret' => $secret, 'redirect_uri' => url('/whatsapp/connect'), 'code' => $code,
        ])->throw()->json('access_token');
        abort_unless($token, 422, 'Meta did not return an access token.');
        $debug = Http::timeout(15)->get(MetaApi::base().'/debug_token', ['input_token' => $token, 'access_token' => $app.'|'.$secret])->throw()->json('data', []);
        $wabas = collect($debug['granular_scopes'] ?? [])->whereIn('scope', ['whatsapp_business_management', 'whatsapp_business_messaging'])->flatMap(fn ($s) => $s['target_ids'] ?? [])->unique();
        $first = null;
        foreach ($wabas as $waba) {
            foreach (app(MetaApi::class)->numbers($waba, $token) as $phone) {
                if (! $this->org()->canAddMoreChannels() && ! WhatsAppChannel::where('phone_number_id', $phone['id'])->exists()) { continue; }
                $connected = $this->persist(['phone_number_id' => $phone['id'], 'waba_id' => $waba, 'access_token' => $token], $phone);
                $first ??= $connected;
            }
        }
        return $first ?? throw ValidationException::withMessages(['message' => 'No available WhatsApp number was shared, or your number allowance is full.']);
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
            if ($claimed && $claimed->organization_id !== $org->id) { throw ValidationException::withMessages(['phone_number_id' => 'This number is already assigned to another workspace.']); }
            $channel = ! empty($data['id']) ? WhatsAppChannel::whereKey($data['id'])->where('organization_id', $org->id)->firstOrFail() : $claimed;
            if ((! $channel || $channel->trashed()) && ! $org->canAddMoreChannels()) { throw ValidationException::withMessages(['message' => 'Your WhatsApp number allowance is full. Contact your administrator.']); }
            $subscription = Http::withToken($data['access_token'])->timeout(15)->post(MetaApi::base().'/'.$data['waba_id'].'/subscribed_apps');
            if (! $subscription->successful()) { throw ValidationException::withMessages(['access_token' => 'Meta could not subscribe this business account to incoming messages.']); }
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
            return $channel;
        });
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
        return response()->json(['success' => true, 'message' => "Synced {$count} numbers. {$skipped} skipped because of your allowance.", 'count' => $count]);
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
