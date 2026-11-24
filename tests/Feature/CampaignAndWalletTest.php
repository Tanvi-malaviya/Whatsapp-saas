<?php

namespace Tests\Feature;

use App\Models\PlatformSetting;
use App\Models\User;
use App\Models\Wallet;
use App\Modules\Campaigns\Models\BroadcastCampaign;
use App\Modules\Foundation\Models\Organization;
use App\Modules\Messaging\Models\Conversation;
use App\Modules\MetaConnection\Models\WhatsAppChannel;
use App\Services\WalletService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class CampaignAndWalletTest extends TestCase
{
    use RefreshDatabase;

    public function test_campaign_estimate_endpoint(): void
    {
        $user = User::factory()->create();
        $org = Organization::create([
            'name' => 'Marketing Workspace',
            'slug' => 'marketing-ws',
            'subscription_plan' => 'annual',
            'status' => 'active',
        ]);
        $user->organizations()->attach($org->id, ['role' => 'Owner']);
        $user->update(['current_organization_id' => $org->id]);

        $walletService = app(WalletService::class);
        $walletService->credit($org, 100000, 'recharge', 'paid', 'Initial deposit');

        $response = $this->actingAs($user)->postJson('/campaigns/estimate', [
            'recipients_count' => 1000,
            'category' => 'MARKETING',
        ]);

        $response->assertOk();
        $response->assertJson([
            'category' => 'MARKETING',
            'recipients_count' => 1000,
            'estimated_cost_paise' => 88000, // 1000 * 88 paise = ₹880
            'has_sufficient_balance' => true,
        ]);
    }

    public function test_campaign_pause_resume_and_cancel_with_refund(): void
    {
        \Illuminate\Support\Facades\Queue::fake([\App\Jobs\SendCampaignRecipient::class]);

        $user = User::factory()->create();
        $org = Organization::create([
            'name' => 'Dispatch Workspace',
            'slug' => 'dispatch-ws',
            'subscription_plan' => 'annual',
            'status' => 'active',
        ]);
        $user->organizations()->attach($org->id, ['role' => 'Owner']);
        $user->update(['current_organization_id' => $org->id]);

        $walletService = app(WalletService::class);
        $walletService->credit($org, 200000, 'recharge', 'paid', 'Recharge');

        $channel = WhatsAppChannel::create([
            'organization_id' => $org->id,
            'name' => 'Official Channel',
            'phone_number' => '+919898696798',
            'phone_number_id' => '100123456789',
            'waba_id' => '999123456789',
            'access_token' => 'test-token',
            'status' => 'connected',
            'is_default' => true,
        ]);

        $campaign = BroadcastCampaign::create([
            'organization_id' => $org->id,
            'channel_id' => $channel->id,
            'name' => 'Spring Sale',
            'template_name' => 'spring_promo',
            'template_language' => 'en_US',
            'recipients_count' => 10,
            'cost_paise' => 880, // 10 * 88 paise
            'category' => 'MARKETING',
            'status' => 'queued',
        ]);

        // Add 10 queued recipients
        for ($i = 1; $i <= 10; $i++) {
            DB::table('campaign_recipients')->insert([
                'campaign_id' => $campaign->id,
                'phone' => "+91980000000{$i}",
                'name' => "Customer {$i}",
                'status' => 'queued',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // 1. Pause campaign
        $pauseResp = $this->actingAs($user)->postJson("/campaigns/{$campaign->id}/pause");
        $pauseResp->assertOk();
        $campaign->refresh();
        $this->assertTrue($campaign->is_paused);
        $this->assertEquals('paused', $campaign->status);

        // 2. Resume campaign
        $resumeResp = $this->actingAs($user)->postJson("/campaigns/{$campaign->id}/resume");
        $resumeResp->assertOk();
        $campaign->refresh();
        $this->assertFalse($campaign->is_paused);
        $this->assertEquals('processing', $campaign->status);

        // 3. Cancel campaign (refunds all 10 unsent messages)
        $balanceBefore = $org->wallet()->first()->totalBalancePaise();
        $cancelResp = $this->actingAs($user)->postJson("/campaigns/{$campaign->id}/cancel");
        $cancelResp->assertOk();
        $campaign->refresh();
        $this->assertEquals('cancelled', $campaign->status);

        $balanceAfter = $org->wallet()->first()->totalBalancePaise();
        $this->assertEquals($balanceBefore + 880, $balanceAfter);
    }

    public function test_campaign_analytics_endpoint(): void
    {
        $user = User::factory()->create();
        $org = Organization::create([
            'name' => 'Analytics Workspace',
            'slug' => 'analytics-ws',
            'subscription_plan' => 'annual',
            'status' => 'active',
        ]);
        $user->organizations()->attach($org->id, ['role' => 'Owner']);
        $user->update(['current_organization_id' => $org->id]);

        $campaign = BroadcastCampaign::create([
            'organization_id' => $org->id,
            'name' => 'Summer Clearance',
            'template_name' => 'summer_sale',
            'template_language' => 'en_US',
            'recipients_count' => 5,
            'cost_paise' => 440,
            'category' => 'MARKETING',
            'status' => 'completed',
        ]);

        DB::table('campaign_recipients')->insert([
            ['campaign_id' => $campaign->id, 'phone' => '+919999900001', 'name' => 'A', 'status' => 'delivered', 'wamid' => 'w1', 'error' => null, 'created_at' => now(), 'updated_at' => now()],
            ['campaign_id' => $campaign->id, 'phone' => '+919999900002', 'name' => 'B', 'status' => 'read', 'wamid' => 'w2', 'error' => null, 'created_at' => now(), 'updated_at' => now()],
            ['campaign_id' => $campaign->id, 'phone' => '+919999900003', 'name' => 'C', 'status' => 'failed', 'wamid' => null, 'error' => 'Code 131026: Undeliverable', 'created_at' => now(), 'updated_at' => now()],
        ]);

        $response = $this->actingAs($user)->getJson("/campaigns/{$campaign->id}/analytics");
        $response->assertOk();
        $response->assertJson([
            'campaign' => [
                'id' => $campaign->id,
                'name' => 'Summer Clearance',
            ],
            'metrics' => [
                'total_selected' => 5,
                'delivered' => 1,
                'read' => 1,
                'failed' => 1,
            ],
        ]);
    }
}
