<?php

namespace Tests\Feature;

use App\Models\PlatformSetting;
use App\Models\ReferralReward;
use App\Models\User;
use App\Modules\Foundation\Models\Organization;
use App\Services\ReferralService;
use App\Services\WalletService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AgentAndReferralTest extends TestCase
{
    use RefreshDatabase;

    public function test_referral_reward_credited_on_subscription(): void
    {
        $referrer = User::factory()->create();
        $refCode = $referrer->generateReferralCode();

        $referrerOrg = Organization::create([
            'name' => 'Referrer Workspace',
            'slug' => 'referrer-ws',
            'subscription_plan' => 'annual',
            'status' => 'active',
        ]);
        $referrer->organizations()->attach($referrerOrg->id, ['role' => 'Owner']);
        $referrer->update(['current_organization_id' => $referrerOrg->id]);

        // Referred user signs up with referral code
        $referredUser = User::factory()->create([
            'referred_by_id' => $referrer->id,
        ]);

        $referredOrg = Organization::create([
            'name' => 'Referred Workspace',
            'slug' => 'referred-ws',
            'subscription_plan' => 'annual',
            'status' => 'active',
        ]);
        $referredUser->organizations()->attach($referredOrg->id, ['role' => 'Owner']);

        $referralService = app(ReferralService::class);
        $reward = $referralService->rewardOnSubscription($referredUser, $referredOrg);

        $this->assertNotNull($reward);
        $this->assertEquals(50000, $reward->reward_amount_paise); // ₹500
        $this->assertEquals('rewarded', $reward->status);

        // Check that referrer's wallet received the promotional bonus credit
        $referrerWallet = $referrerOrg->wallet()->first();
        $this->assertEquals(50000, $referrerWallet->promotional_balance_paise);
    }

    public function test_self_referral_is_prevented(): void
    {
        $user = User::factory()->create();
        $code = $user->generateReferralCode();

        $referralService = app(ReferralService::class);
        $applied = $referralService->applyReferralCode($user, $code);

        $this->assertFalse($applied);
        $this->assertNull($user->referred_by_id);
    }

    public function test_b2b_agent_cannot_access_unassigned_customers(): void
    {
        $agent = User::factory()->create(['is_b2b_agent' => true]);
        $otherAgent = User::factory()->create(['is_b2b_agent' => true]);

        $assignedOrg = Organization::create([
            'name' => 'Assigned Org',
            'slug' => 'assigned-org',
            'b2b_agent_id' => $agent->id,
            'status' => 'active',
        ]);

        $unassignedOrg = Organization::create([
            'name' => 'Other Org',
            'slug' => 'other-org',
            'b2b_agent_id' => $otherAgent->id,
            'status' => 'active',
        ]);

        // Agent can assist their assigned org
        $response = $this->actingAs($agent)->post("/agent/customers/{$assignedOrg->id}/assist");
        $response->assertRedirect(route('dashboard'));

        // Agent cannot assist another agent's org
        $unauthorizedResponse = $this->actingAs($agent)->post("/agent/customers/{$unassignedOrg->id}/assist");
        $unauthorizedResponse->assertStatus(404);
    }

    public function test_regular_user_cannot_access_agent_portal(): void
    {
        $regularUser = User::factory()->create(['is_b2b_agent' => false, 'is_super_admin' => false]);
        $org = Organization::create(['name' => 'User Org', 'slug' => 'user-org']);
        $regularUser->organizations()->attach($org->id, ['role' => 'Owner']);
        $regularUser->update(['current_organization_id' => $org->id]);

        $response = $this->actingAs($regularUser)->get('/agent/dashboard');
        $response->assertRedirect(route('dashboard'));
    }
}
