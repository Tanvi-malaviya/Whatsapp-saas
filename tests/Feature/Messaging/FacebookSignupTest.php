<?php

use App\Models\User;
use App\Modules\Foundation\Models\Organization;
use App\Modules\MetaConnection\Models\WhatsAppChannel;
use App\Shared\TenantContext;
use Illuminate\Http\Client\Factory;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia;

beforeEach(function () {
    TenantContext::clear();
    $this->withoutVite();
    config(['release.meta.app_id' => 'test-app', 'release.meta.app_secret' => 'test-secret', 'release.meta.config_id' => 'test-config']);
    $this->org = Organization::create(['name' => 'Signup customer', 'slug' => 'signup-customer', 'status' => 'active', 'subscription_plan' => 'annual', 'max_channels' => 2]);
    $this->user = User::factory()->create(['current_organization_id' => $this->org->id]);
    $this->org->users()->attach($this->user, ['role' => 'Owner']);
    $this->actingAs($this->user);
    $this->phone = ['id' => '111111111111111', 'display_phone_number' => '+91 98765 43210', 'verified_name' => 'Customer Support', 'quality_rating' => 'GREEN', 'platform_type' => 'CLOUD_API', 'is_on_biz_app' => true];
    $this->fakeMeta = function (array $overrides = []) {
        Http::swap(new Factory);
        Http::preventStrayRequests();
        Http::fake([
            'graph.facebook.com/*/oauth/access_token*' => Http::response(['access_token' => 'customer-scoped-token']),
            'graph.facebook.com/*/debug_token*' => Http::response(['data' => ['is_valid' => true, 'app_id' => 'test-app', 'granular_scopes' => [['scope' => 'whatsapp_business_management', 'target_ids' => ['222222222222222']]]]]),
            'graph.facebook.com/*/222222222222222/phone_numbers*' => Http::response(['data' => [$this->phone]]),
            'graph.facebook.com/*/111111111111111?*' => Http::response($this->phone),
            'graph.facebook.com/*/222222222222222/subscribed_apps' => Http::response(['success' => true]),
            'graph.facebook.com/*/111111111111111/register' => Http::response(['success' => true]),
            'graph.facebook.com/*/111111111111111/whatsapp_commerce_settings' => Http::response(['success' => true]),
            ...$overrides,
        ]);
    };
    ($this->fakeMeta)();
    $this->start = fn () => $this->postJson('/channels/signup')->assertOk()->json('state');
    $this->callback = fn ($state) => $this->get('/whatsapp/connect?'.http_build_query(['code' => 'facebook-code', 'state' => $state]));
});
afterEach(fn () => TenantContext::clear());

test('signup starts with a workspace bound session and the exact redirect URI', function () {
    $response = $this->postJson('/channels/signup')->assertOk();
    parse_str(parse_url($response->json('url'), PHP_URL_QUERY), $query);
    expect($query['state'])->toBe($response->json('state'))->and($query['redirect_uri'])->toBe(url('/whatsapp/connect'));
    $response->assertSessionHas('meta_signup.organization_id', $this->org->id);
    Http::assertNothingSent();
});

test('successful Facebook callback saves the number and the panel displays it', function () {
    ($this->callback)(($this->start)())->assertOk()->assertViewHas('error', null)->assertSee('WhatsApp Connected!');
    $channel = WhatsAppChannel::withoutGlobalScopes()->sole();
    expect($channel->organization_id)->toBe($this->org->id)->and($channel->phone_number)->toBe($this->phone['display_phone_number'])->and($channel->status)->toBe('connected')->and($channel->is_default)->toBeTrue()->and($channel->webhook_verified_at)->toBeNull()->and($channel->access_token)->toBe('customer-scoped-token');
    expect(DB::table('whatsapp_channels')->value('access_token'))->not->toBe('customer-scoped-token');
    $this->get('/whatsapp/connect')->assertInertia(fn (AssertableInertia $page) => $page->component('whatsapp/connect')->has('channels', 1)->where('channels.0.phone_number_id', $this->phone['id'])->missing('channels.0.access_token')->missing('channels.0.app_secret')->where('channelsCount', 1)->where('canAddMore', true));
    Http::assertNotSent(fn ($r) => str_ends_with($r->url(), '/register'));
});

test('SDK signup saves only the number selected in Facebook', function () {
    $second = [...$this->phone, 'id' => '333333333333333', 'display_phone_number' => '+91 91234 56789'];
    ($this->fakeMeta)(['graph.facebook.com/*/222222222222222/phone_numbers*' => Http::response(['data' => [$second, $this->phone]])]);
    $state = ($this->start)();
    $this->postJson('/channels/quick-connect', ['code' => 'sdk-code', 'state' => $state, 'phone_number_id' => $this->phone['id'], 'waba_id' => '222222222222222'])->assertOk()->assertJsonPath('success', true)->assertJsonPath('channel.phone_number_id', $this->phone['id'])->assertJsonMissingPath('channel.access_token');
    expect(WhatsAppChannel::withoutGlobalScopes()->count())->toBe(1);
    Http::assertSent(fn ($r) => str_contains($r->url(), '/oauth/access_token') && ! isset($r['redirect_uri']));
});

test('missing mismatched and expired state cannot connect a number', function (string $kind) {
    $state = ($this->start)();
    if ($kind === 'expired') {
        $this->travel(11)->minutes();
    }
    ($this->callback)($kind === 'missing' ? '' : ($kind === 'wrong' ? 'wrong-state' : $state))->assertViewHas('error')->assertSee('Connection Incomplete')->assertDontSee('WhatsApp Connected!');
    Http::assertNothingSent();
    expect(WhatsAppChannel::withoutGlobalScopes()->count())->toBe(0);
})->with(['missing', 'wrong', 'expired']);

test('a consumed Facebook code cannot be replayed', function () {
    $state = ($this->start)();
    ($this->callback)($state)->assertViewHas('error', null);
    ($this->callback)($state)->assertViewHas('error')->assertDontSee('WhatsApp Connected!');
    expect(WhatsAppChannel::withoutGlobalScopes()->count())->toBe(1);
    Http::assertSentCount(6);
});

test('switching workspaces during signup cannot save to the new workspace', function () {
    $state = ($this->start)();
    $other = Organization::create(['name' => 'Other', 'slug' => 'other', 'status' => 'active']);
    $other->users()->attach($this->user, ['role' => 'Owner']);
    $this->user->switchOrganization($other);
    ($this->callback)($state)->assertViewHas('error');
    Http::assertNothingSent();
    expect(WhatsAppChannel::withoutGlobalScopes()->count())->toBe(0);
});

test('Meta exchange failure and invalid token never show successful signup', function (string $failure) {
    $overrides = $failure === 'exchange' ? ['graph.facebook.com/*/oauth/access_token*' => Http::response(['error' => ['message' => 'Expired code']], 400)] : ['graph.facebook.com/*/debug_token*' => Http::response(['data' => ['is_valid' => false, 'app_id' => 'wrong-app']])];
    ($this->fakeMeta)($overrides);
    ($this->callback)(($this->start)())->assertViewHas('error')->assertDontSee('WhatsApp Connected!');
    expect(WhatsAppChannel::withoutGlobalScopes()->count())->toBe(0);
})->with(['exchange', 'invalid-token']);

test('multiple authorized numbers require explicit selection before saving', function () {
    $second = [...$this->phone, 'id' => '333333333333333', 'verified_name' => 'Other Number'];
    ($this->fakeMeta)(['graph.facebook.com/*/222222222222222/phone_numbers*' => Http::response(['data' => [$this->phone, $second]])]);
    ($this->callback)(($this->start)())->assertSee('Choose your WhatsApp number')->assertDontSee('WhatsApp Connected!')->assertDontSee('customer-scoped-token');
    expect(WhatsAppChannel::withoutGlobalScopes()->count())->toBe(0);
    $this->post('/channels/signup/complete', ['phone_number_id' => $this->phone['id'], 'waba_id' => '222222222222222'])->assertViewHas('error', null)->assertSee('WhatsApp Connected!');
    expect(WhatsAppChannel::withoutGlobalScopes()->sole()->phone_number_id)->toBe($this->phone['id']);
});

test('quota is checked again when Facebook returns', function () {
    $state = ($this->start)();
    $this->org->update(['max_channels' => 1]);
    WhatsAppChannel::create(['organization_id' => $this->org->id, 'name' => 'Existing', 'phone_number_id' => '444444444444444', 'waba_id' => '222222222222222', 'access_token' => 'existing-token']);
    ($this->callback)($state)->assertViewHas('error')->assertDontSee('WhatsApp Connected!');
    expect(WhatsAppChannel::withoutGlobalScopes()->count())->toBe(1);
});

test('a number owned by another workspace is never transferred by signup', function () {
    $other = Organization::create(['name' => 'Other', 'slug' => 'other', 'status' => 'active']);
    $existing = WhatsAppChannel::withoutGlobalScopes()->create(['organization_id' => $other->id, 'name' => 'Other number', 'phone_number_id' => $this->phone['id'], 'waba_id' => '222222222222222', 'access_token' => 'other-token']);
    ($this->callback)(($this->start)())->assertViewHas('error')->assertDontSee('WhatsApp Connected!');
    expect($existing->fresh()->organization_id)->toBe($other->id)->and($existing->fresh()->access_token)->toBe('other-token');
});

test('webhook subscription failure does not create a connected number', function () {
    ($this->fakeMeta)(['graph.facebook.com/*/222222222222222/subscribed_apps' => Http::response(['error' => ['message' => 'Missing permission']], 403)]);
    ($this->callback)(($this->start)())->assertViewHas('error')->assertDontSee('WhatsApp Connected!');
    expect(WhatsAppChannel::withoutGlobalScopes()->count())->toBe(0);
});

test('standard Cloud API signup registers a new number and encrypts its PIN', function () {
    ($this->fakeMeta)(['graph.facebook.com/*/111111111111111?*' => Http::response([...$this->phone, 'platform_type' => 'NOT_APPLICABLE', 'is_on_biz_app' => false])]);
    ($this->callback)(($this->start)())->assertViewHas('error', null);
    $channel = WhatsAppChannel::withoutGlobalScopes()->sole();
    expect($channel->registration_pin)->toMatch('/^\d{6}$/');
    expect(DB::table('whatsapp_channels')->value('registration_pin'))->not->toBe($channel->registration_pin);
    expect($channel->toArray())->not->toHaveKey('registration_pin');
    Http::assertSent(fn ($r) => str_ends_with($r->url(), '/register') && $r['pin'] === $channel->registration_pin);
});

test('registration failure does not add the number to the panel', function () {
    ($this->fakeMeta)(['graph.facebook.com/*/111111111111111?*' => Http::response([...$this->phone, 'platform_type' => 'NOT_APPLICABLE', 'is_on_biz_app' => false]), 'graph.facebook.com/*/111111111111111/register' => Http::response(['error' => ['message' => 'Invalid PIN']], 400)]);
    ($this->callback)(($this->start)())->assertViewHas('error')->assertDontSee('WhatsApp Connected!');
    expect(WhatsAppChannel::withoutGlobalScopes()->count())->toBe(0);
});

test('reconnecting the same number refreshes credentials without creating duplicates', function () {
    ($this->callback)(($this->start)())->assertViewHas('error', null);
    ($this->callback)(($this->start)())->assertViewHas('error', null);
    expect(WhatsAppChannel::withoutGlobalScopes()->count())->toBe(1);
});

test('Facebook denial and missing shared accounts produce a visible error', function (string $failure) {
    $state = ($this->start)();
    if ($failure === 'denied') {
        $this->get('/whatsapp/connect?'.http_build_query(['error' => 'access_denied', 'state' => $state]))->assertViewHas('error')->assertDontSee('WhatsApp Connected!');
        Http::assertNothingSent();
    } else {
        ($this->fakeMeta)(['graph.facebook.com/*/debug_token*' => Http::response(['data' => ['is_valid' => true, 'app_id' => 'test-app', 'granular_scopes' => []]])]);
        ($this->callback)($state)->assertViewHas('error')->assertDontSee('WhatsApp Connected!');
    }
    expect(WhatsAppChannel::withoutGlobalScopes()->count())->toBe(0);
})->with(['denied', 'no-accounts']);
