<?php

namespace Tests\Feature;

use App\Models\PlatformSetting;
use App\Models\User;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use App\Modules\Campaigns\Models\BroadcastCampaign;
use App\Modules\Foundation\Models\Organization;
use App\Modules\MetaConnection\Models\WhatsAppChannel;
use App\Services\ReferralService;
use App\Services\WalletService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WalletAndSubscriptionTest extends TestCase
{
    use RefreshDatabase;

    public function test_wallet_creation_and_balance_tracking(): void
    {
        $org = Organization::create([
            'name' => 'Acme Corp',
            'slug' => 'acme-corp',
            'subscription_plan' => 'annual',
            'status' => 'active',
        ]);

        $walletService = app(WalletService::class);
        $wallet = $walletService->getOrCreateWallet($org);

        $this->assertEquals(0, $wallet->totalBalancePaise());

        // Credit ₹1000 paid balance
        $walletService->credit($org, 100000, 'recharge', 'paid', 'Initial recharge');
        $wallet->refresh();
        $this->assertEquals(100000, $wallet->paid_balance_paise);
        $this->assertEquals(100000, $wallet->totalBalancePaise());

        // Credit ₹500 welcome bonus (promotional)
        $walletService->creditWelcomeBonus($org);
        $wallet->refresh();
        $this->assertEquals(50000, $wallet->promotional_balance_paise);
        $this->assertEquals(150000, $wallet->totalBalancePaise());

        // Second welcome bonus call should be ignored
        $walletService->creditWelcomeBonus($org);
        $wallet->refresh();
        $this->assertEquals(50000, $wallet->promotional_balance_paise);
    }

    public function test_debit_deducts_promotional_balance_first(): void
    {
        $org = Organization::create([
            'name' => 'Beta Corp',
            'slug' => 'beta-corp',
            'subscription_plan' => 'annual',
            'status' => 'active',
        ]);

        $walletService = app(WalletService::class);
        $walletService->credit($org, 100000, 'recharge', 'paid', 'Recharge');
        $walletService->credit($org, 50000, 'bonus', 'promotional', 'Bonus');

        // Total: 150000 (100000 paid, 50000 promo)
        // Debit 70000 (₹700) -> should consume all 50000 promo and 20000 paid
        $walletService->debit($org, 70000, 'Campaign dispatch');

        $wallet = $org->wallet()->first();
        $this->assertEquals(0, $wallet->promotional_balance_paise);
        $this->assertEquals(80000, $wallet->paid_balance_paise);
        $this->assertEquals(80000, $wallet->totalBalancePaise());
    }

    public function test_insufficient_wallet_balance_throws_exception(): void
    {
        $this->expectException(\RuntimeException::class);

        $org = Organization::create([
            'name' => 'Gamma Corp',
            'slug' => 'gamma-corp',
            'subscription_plan' => 'annual',
            'status' => 'active',
        ]);

        $walletService = app(WalletService::class);
        $walletService->credit($org, 1000, 'recharge', 'paid', 'Small recharge');

        // Attempt to debit more than available
        $walletService->debit($org, 5000, 'Large campaign');
    }

    public function test_subscription_expiry_gating(): void
    {
        $org = Organization::create([
            'name' => 'Delta Corp',
            'slug' => 'delta-corp',
            'subscription_plan' => 'annual',
            'subscription_expires_at' => now()->subDay(),
            'status' => 'active',
        ]);

        $this->assertFalse($org->isSubscriptionActive());
        $this->assertLessThan(0, $org->daysUntilExpiry());

        // Test artisan command
        $this->artisan('subscriptions:check-reminders')->assertExitCode(0);
    }
}
