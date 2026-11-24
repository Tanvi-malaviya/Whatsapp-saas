<?php

namespace Tests\Feature;

use App\Models\BillingInvoice;
use App\Models\PlatformSetting;
use App\Models\ReferralReward;
use App\Models\User;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use App\Modules\Foundation\Models\Organization;
use App\Modules\Messaging\Models\Message;
use App\Modules\MetaConnection\Models\WhatsAppChannel;
use App\Services\SystemHealthService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminDiagnosticsAndAgentTest extends TestCase
{
    use RefreshDatabase;

    public function test_agent_login_page_renders_cleanly(): void
    {
        $response = $this->get('/agent/login');
        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page->component('agent/login'));
    }

    public function test_b2b_agent_can_login_via_agent_portal(): void
    {
        $password = 'Secret1234!';
        $agent = User::factory()->create([
            'email' => 'partner@agency.com',
            'password' => Hash::make($password),
            'is_b2b_agent' => true,
        ]);

        $response = $this->post('/agent/login', [
            'email' => 'partner@agency.com',
            'password' => $password,
        ]);

        $response->assertRedirect('/agent/dashboard');
        $this->assertAuthenticatedAs($agent);
    }

    public function test_regular_user_cannot_login_via_agent_portal(): void
    {
        $password = 'Secret1234!';
        $user = User::factory()->create([
            'email' => 'regular@client.com',
            'password' => Hash::make($password),
            'is_b2b_agent' => false,
            'is_super_admin' => false,
        ]);

        $response = $this->post('/agent/login', [
            'email' => 'regular@client.com',
            'password' => $password,
        ]);

        // Failed authentication because user is not a B2B agent
        $response->assertSessionHasErrors();
        $this->assertGuest();
    }

    public function test_admin_dashboard_renders_with_analytics_and_diagnostics(): void
    {
        $admin = User::factory()->create(['is_super_admin' => true]);

        // Seed an organization and channel
        $org = Organization::create([
            'name' => 'Acme Corp',
            'slug' => 'acme-corp',
            'status' => 'active',
            'subscription_plan' => 'annual',
        ]);

        $channel = WhatsAppChannel::create([
            'organization_id' => $org->id,
            'name' => 'Support Desk',
            'phone_number' => '+919876543210',
            'phone_number_id' => '10987654321',
            'waba_id' => '20987654321',
            'access_token' => 'EAAG_dummy_test_token',
            'quality_rating' => 'GREEN',
            'status' => 'connected',
            'is_default' => true,
        ]);

        $response = $this->actingAs($admin)->get('/admin/dashboard');

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('admin/dashboard')
            ->has('metrics')
            ->has('financials')
            ->has('messagingAnalytics')
            ->has('channelHealth')
            ->has('partnerMetrics')
            ->has('diagnostics')
            ->where('channelHealth.green', 1)
            ->where('channelHealth.connected', 1)
        );
    }

    public function test_auto_bug_fixes_resolves_anomalies_and_expired_subscriptions(): void
    {
        $admin = User::factory()->create(['is_super_admin' => true]);

        // Create an organization whose subscription expired yesterday but is still marked 'active'
        $expiredOrg = Organization::create([
            'name' => 'Expired Org',
            'slug' => 'expired-org',
            'status' => 'active',
            'subscription_expires_at' => now()->subDay(),
        ]);

        // Trigger Auto Bug Fixes
        $response = $this->actingAs($admin)->post('/admin/diagnostics/autofix');

        $response->assertRedirect();
        $response->assertSessionHas('success');

        // Check that expired org has been transitioned to 'expired'
        $expiredOrg->refresh();
        $this->assertEquals('expired', $expiredOrg->status);
    }

    public function test_admin_diagnostics_report_endpoint(): void
    {
        $admin = User::factory()->create(['is_super_admin' => true]);

        $response = $this->actingAs($admin)->get('/admin/diagnostics');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'health_score',
            'status',
            'total_issues',
            'issues',
            'scanned_at',
        ]);
    }
}
