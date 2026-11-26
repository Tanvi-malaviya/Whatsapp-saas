<?php

use App\Models\BillingInvoice;
use App\Models\PlatformSetting;
use App\Models\User;
use App\Modules\Foundation\Models\Organization;
use App\Services\WalletService;
use App\Shared\TenantContext;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia;

beforeEach(function () {
    $this->withoutVite();
    TenantContext::clear();
    Http::preventStrayRequests();
    config(['release.razorpay.key_id' => null, 'release.razorpay.key_secret' => null]);
    $this->owner = User::factory()->create();
    $this->org = Organization::create(['name' => 'Billing Workspace', 'slug' => 'billing-workspace', 'billing_email' => 'billing@example.test', 'status' => 'active', 'subscription_plan' => 'annual', 'subscription_expires_at' => now()->addDays(30)]);
    $this->org->users()->attach($this->owner->id, ['role' => 'Owner']);
    $this->owner->update(['current_organization_id' => $this->org->id]);
});

afterEach(fn () => TenantContext::clear());

test('wallet and subscription have separate pages and invoice histories', function () {
    TenantContext::set($this->org);
    $subscription = BillingInvoice::create(['plan' => 'annual', 'amount_paise' => 999900, 'currency' => 'INR', 'status' => 'pending']);
    $recharge = BillingInvoice::create(['plan' => 'wallet_recharge', 'amount_paise' => 44000, 'currency' => 'INR', 'status' => 'pending']);
    $other = Organization::create(['name' => 'Other', 'slug' => 'other', 'status' => 'active']);
    TenantContext::set($other);
    BillingInvoice::create(['plan' => 'annual', 'amount_paise' => 10000, 'currency' => 'INR', 'status' => 'pending']);
    BillingInvoice::create(['plan' => 'wallet_recharge', 'amount_paise' => 10000, 'currency' => 'INR', 'status' => 'pending']);
    TenantContext::clear();
    app(WalletService::class)->credit($this->org, 25000, 'recharge', 'paid', 'Test recharge');

    $this->actingAs($this->owner)->get('/wallet')->assertOk()->assertInertia(fn (AssertableInertia $page) => $page
        ->component('wallet/index')
        ->where('wallet.total_balance_paise', 25000)
        ->has('wallet.transactions', 1)
        ->has('invoices', 1)
        ->where('invoices.0.id', $recharge->id)
        ->where('checkoutReady', false)
        ->missing('plans')->missing('profile'));

    $this->get('/subscription')->assertOk()->assertInertia(fn (AssertableInertia $page) => $page
        ->component('subscription/index')
        ->where('currentPlan', 'annual')
        ->where('profile.billing_email', 'billing@example.test')
        ->has('invoices', 1)
        ->where('invoices.0.id', $subscription->id)
        ->missing('wallet.transactions')->missing('referral'));

    Http::assertNothingSent();
});

test('old billing bookmarks redirect to subscription', function () {
    $this->actingAs($this->owner)->get('/settings/billing')->assertRedirect('/subscription');
});

test('billing pages use the current platform pricing and recharge settings', function () {
    foreach (['subscription_annual_price_paise' => '1499900', 'subscription_validity_days' => '180', 'min_message_purchase_count' => '750', 'meta_rate_marketing_paise' => '95', 'razorpay_key_id' => 'test-key', 'razorpay_key_secret' => 'test-secret'] as $key => $value) {
        PlatformSetting::write($key, $value);
    }
    $this->actingAs($this->owner)->get('/wallet')->assertOk()->assertInertia(fn (AssertableInertia $page) => $page
        ->where('rates.min_messages', 750)->where('rates.marketing', 95)->where('checkoutReady', true));
    $this->get('/subscription')->assertOk()->assertInertia(fn (AssertableInertia $page) => $page
        ->where('plans.annual.amount_paise', 1499900)->where('plans.annual.validity_days', 180)->where('checkoutReady', true));
});

test('wallet checkout enforces the same configured minimum shown on the page', function () {
    PlatformSetting::write('min_message_purchase_count', '750');
    PlatformSetting::write('razorpay_key_id', 'test-key');
    PlatformSetting::write('razorpay_key_secret', 'test-secret');
    $this->actingAs($this->owner)->postJson('/settings/billing/checkout', ['plan' => 'wallet_recharge', 'messages_count' => 500, 'category' => 'MARKETING'])->assertUnprocessable();
    Http::assertNothingSent();
});

test('expired subscriptions are displayed as expired', function () {
    $this->org->update(['subscription_expires_at' => now()->subDays(3)]);
    $this->actingAs($this->owner)->get('/subscription')->assertOk()->assertInertia(fn (AssertableInertia $page) => $page->where('subscriptionStatus', 'expired'));
});

test('billing profile updates persist and use the current organization email', function () {
    $this->actingAs($this->owner)->putJson('/settings/billing/profile', ['billing_email' => 'new@example.test', 'address' => 'Ahmedabad, Gujarat', 'gstin' => null])->assertOk();
    $this->org->refresh();
    expect($this->org->billing_email)->toBe('new@example.test');
    expect($this->org->metadata['billing_profile']['address'])->toBe('Ahmedabad, Gujarat');
    $this->get('/subscription')->assertOk()->assertInertia(fn (AssertableInertia $page) => $page->where('profile.billing_email', 'new@example.test'));
});

test('workspace settings updates are reflected in subscription billing details', function () {
    $this->actingAs($this->owner)->put('/settings/organization', ['name' => 'Updated Workspace', 'slug' => 'updated-workspace', 'billing_email' => 'workspace@example.test', 'timezone' => 'UTC', 'currency' => 'USD'])->assertSessionHasNoErrors()->assertRedirect();
    $this->get('/subscription')->assertOk()->assertInertia(fn (AssertableInertia $page) => $page->where('profile.name', 'Updated Workspace')->where('profile.billing_email', 'workspace@example.test'));
});

test('new billing pages preserve billing view permissions', function (string $path) {
    $viewer = User::factory()->create(['current_organization_id' => $this->org->id]);
    $this->org->users()->attach($viewer->id, ['role' => 'Viewer']);
    $this->actingAs($viewer)->get($path)->assertForbidden();
})->with(['/wallet', '/subscription']);

test('billing pages require login', function (string $path) {
    $this->get($path)->assertRedirect('/login');
})->with(['/wallet', '/subscription']);
