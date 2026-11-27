<?php

namespace App\Http\Controllers;

use App\Models\BillingInvoice;
use App\Models\ReferralReward;
use App\Models\User;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use App\Modules\Foundation\Models\Organization;
use App\Modules\Messaging\Models\Message;
use App\Modules\MetaConnection\Models\WhatsAppChannel;
use App\Services\SystemHealthService;
use App\Shared\TenantContext;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class AdminController extends Controller
{
    private function ensureSuperAdmin(Request $request): void
    {

        $user = $request->user();
        if (!$user) {
            abort(401, 'Unauthenticated. Please log in.');
        }

        if (!$user->isSuperAdmin()) {
            abort(403, 'Unauthorized access. Super Administrator role required.');
        }
    }

    /**
     * Show Super Admin Login Page
     */
    public function showLogin(Request $request): Response|RedirectResponse
    {

        if ($request->user()) { return redirect(\App\Services\PanelNavigation::home($request->user())); }

        return Inertia::render('admin/login', [
            'status' => session('status'),
        ]);
    }

    /**
     * Process Super Admin Login
     */
    /**
     * Super Admin Logout
     */
    public function logout(Request $request): RedirectResponse
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect($request->is('agent/logout') ? '/agent/login' : '/admin/login')->with('success', 'You have been signed out.');
    }

    /**
     * Super Admin Overview Dashboard
     */
    public function dashboard(Request $request, SystemHealthService $healthService): Response
    {
        $this->ensureSuperAdmin($request);

        $totalClients = Organization::count();
        $totalChannels = WhatsAppChannel::count();
        $totalUsers = User::count();
        $totalMessages = Message::count();

        $hasMaxChannels = Schema::hasColumn('organizations', 'max_channels');

        $singleNumberClients = $hasMaxChannels
            ? Organization::where('max_channels', 1)->count()
            : Organization::all()->filter(fn ($o) => $o->getMaxChannels() === 1)->count();

        $multiNumberClients = $hasMaxChannels
            ? Organization::where(function ($q) {
                $q->where('max_channels', '>', 1)->orWhere('max_channels', '<=', 0);
            })->count()
            : Organization::all()->filter(fn ($o) => $o->getMaxChannels() > 1 || $o->getMaxChannels() <= 0)->count();

        // Financial Analytics
        $subscriptionRevenuePaise = Schema::hasTable('billing_invoices')
            ? (int) BillingInvoice::where('status', 'paid')->sum('amount_paise')
            : 0;

        $rechargeRevenuePaise = Schema::hasTable('wallet_transactions')
            ? (int) WalletTransaction::where('type', 'recharge')->where('amount_paise', '>', 0)->sum('amount_paise')
            : 0;

        $totalRevenuePaise = $subscriptionRevenuePaise + $rechargeRevenuePaise;

        $monthlySubscriptionRevenuePaise = Schema::hasTable('billing_invoices')
            ? (int) BillingInvoice::where('status', 'paid')->where('created_at', '>=', now()->startOfMonth())->sum('amount_paise')
            : 0;

        $monthlyRechargeRevenuePaise = Schema::hasTable('wallet_transactions')
            ? (int) WalletTransaction::where('type', 'recharge')->where('amount_paise', '>', 0)->where('created_at', '>=', now()->startOfMonth())->sum('amount_paise')
            : 0;

        $monthlyTotalRevenuePaise = $monthlySubscriptionRevenuePaise + $monthlyRechargeRevenuePaise;

        $totalWalletPaidPaise = Schema::hasTable('wallets')
            ? (int) Wallet::sum('paid_balance_paise')
            : 0;

        $totalWalletPromoPaise = Schema::hasTable('wallets')
            ? (int) Wallet::sum('promotional_balance_paise')
            : 0;

        $activeSubscriptions = Organization::where('status', 'active')->count();
        $expiredSubscriptions = Organization::where('status', 'expired')->count();

        // Global Messaging Delivery Performance
        $totalOutbound = Message::where('direction', 'outbound')->count();
        $totalInbound = Message::where('direction', 'inbound')->count();
        $totalDelivered = Message::where('direction', 'outbound')->whereIn('status', ['delivered', 'read'])->count();
        $totalRead = Message::where('direction', 'outbound')->where('status', 'read')->count();
        $totalFailed = Message::where('direction', 'outbound')->where('status', 'failed')->count();

        $deliveryRate = $totalOutbound > 0 ? round(($totalDelivered / $totalOutbound) * 100, 1) : 100.0;
        $readRate = $totalDelivered > 0 ? round(($totalRead / $totalDelivered) * 100, 1) : 0.0;
        $failureRate = $totalOutbound > 0 ? round(($totalFailed / $totalOutbound) * 100, 1) : 0.0;

        // WhatsApp Channel Health & Quality Breakdown
        $channelsGreen = WhatsAppChannel::where('quality_rating', 'GREEN')->count();
        $channelsYellow = WhatsAppChannel::where('quality_rating', 'YELLOW')->count();
        $channelsRed = WhatsAppChannel::where('quality_rating', 'RED')->count();
        $channelsConnected = WhatsAppChannel::where('status', 'connected')->count();
        $channelsDisconnected = WhatsAppChannel::where('status', '!=', 'connected')->count();

        // B2B Reseller Partner Network Analytics
        $totalB2BAgents = User::where('is_b2b_agent', true)->count();
        $managedWorkspaces = Organization::whereNotNull('b2b_agent_id')->count();
        $referralRewardsPaise = Schema::hasTable('referral_rewards')
            ? (int) ReferralReward::where('status', 'rewarded')->sum('reward_amount_paise')
            : 0;

        // Automated Bug Detection Diagnostics Scan
        $diagnostics = $healthService->diagnose();

        $recentOrganizations = Organization::withCount('channels')
            ->latest()
            ->take(6)
            ->get()
            ->map(fn ($org) => [
                'id' => (string) $org->id,
                'name' => $org->name,
                'slug' => $org->slug,
                'subscription_plan' => $org->subscription_plan ?: 'starter',
                'max_channels' => $org->getMaxChannels(),
                'channels_count' => (int) $org->channels_count,
                'status' => $org->status ?: 'active',
                'created_at' => $org->created_at ? $org->created_at->format('M d, Y') : '—',
            ]);

        $recentChannels = WhatsAppChannel::with('organization:id,name,slug')
            ->latest()
            ->take(6)
            ->get()
            ->map(fn ($ch) => [
                'id' => (string) $ch->id,
                'name' => $ch->name,
                'phone_number' => $ch->phone_number,
                'phone_number_id' => $ch->phone_number_id,
                'organization_name' => $ch->organization?->name ?: 'Unknown',
                'quality_rating' => $ch->quality_rating ?: 'GREEN',
                'status' => $ch->status,
                'is_default' => (bool) $ch->is_default,
                'created_at' => $ch->created_at ? $ch->created_at->format('M d, Y') : '—',
            ]);

        return Inertia::render('admin/dashboard', [
            'metrics' => [
                'totalClients' => $totalClients,
                'totalChannels' => $totalChannels,
                'totalUsers' => $totalUsers,
                'totalMessages' => $totalMessages,
                'singleNumberClients' => $singleNumberClients,
                'multiNumberClients' => $multiNumberClients,
            ],
            'financials' => [
                'total_revenue_formatted' => '₹' . number_format($totalRevenuePaise / 100, 2),
                'subscription_revenue_formatted' => '₹' . number_format($subscriptionRevenuePaise / 100, 2),
                'recharge_revenue_formatted' => '₹' . number_format($rechargeRevenuePaise / 100, 2),
                'monthly_revenue_formatted' => '₹' . number_format($monthlyTotalRevenuePaise / 100, 2),
                'total_wallet_paid_formatted' => '₹' . number_format($totalWalletPaidPaise / 100, 2),
                'total_wallet_promo_formatted' => '₹' . number_format($totalWalletPromoPaise / 100, 2),
                'active_subscriptions' => $activeSubscriptions,
                'expired_subscriptions' => $expiredSubscriptions,
            ],
            'messagingAnalytics' => [
                'total_outbound' => $totalOutbound,
                'total_inbound' => $totalInbound,
                'total_delivered' => $totalDelivered,
                'total_read' => $totalRead,
                'total_failed' => $totalFailed,
                'delivery_rate' => $deliveryRate,
                'read_rate' => $readRate,
                'failure_rate' => $failureRate,
            ],
            'channelHealth' => [
                'green' => $channelsGreen,
                'yellow' => $channelsYellow,
                'red' => $channelsRed,
                'connected' => $channelsConnected,
                'disconnected' => $channelsDisconnected,
            ],
            'partnerMetrics' => [
                'total_b2b_agents' => $totalB2BAgents,
                'managed_workspaces' => $managedWorkspaces,
                'referral_rewards_paid_formatted' => '₹' . number_format($referralRewardsPaise / 100, 2),
            ],
            'diagnostics' => $diagnostics,
            'recentOrganizations' => $recentOrganizations,
            'recentChannels' => $recentChannels,
            'pricingSettings' => [
                'subscription_annual_price_paise' => (int) \App\Models\PlatformSetting::read('subscription_annual_price_paise', 999900),
                'subscription_validity_days' => (int) \App\Models\PlatformSetting::read('subscription_validity_days', 365),
                'welcome_bonus_paise' => (int) \App\Models\PlatformSetting::read('welcome_bonus_paise', 50000),
                'referral_reward_paise' => (int) \App\Models\PlatformSetting::read('referral_reward_paise', 50000),
                'campaign_max_contacts' => (int) \App\Models\PlatformSetting::read('campaign_max_contacts', 2000),
                'min_message_purchase_count' => (int) \App\Models\PlatformSetting::read('min_message_purchase_count', 200),
                'meta_rate_marketing_paise' => (int) \App\Models\PlatformSetting::read('meta_rate_marketing_paise', 88),
                'meta_rate_utility_paise' => (int) \App\Models\PlatformSetting::read('meta_rate_utility_paise', 14),
                'meta_rate_authentication_paise' => (int) \App\Models\PlatformSetting::read('meta_rate_authentication_paise', 14),
            ],
        ]);
    }

    /**
     * Client Workspaces & WhatsApp Quota Limits Management
     */
    public function organizations(Request $request): Response
    {
        $this->ensureSuperAdmin($request);

        $organizations = Organization::withCount(['channels', 'users'])
            ->with([
                'channels:id,organization_id,name,phone_number,phone_number_id,waba_id,quality_rating,status,is_default',
                'users:id,name,email',
            ])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($org) {
                return [
                    'id' => (string) $org->id,
                    'name' => $org->name,
                    'slug' => $org->slug,
                    'billing_email' => $org->billing_email,
                    'subscription_plan' => $org->subscription_plan ?: 'starter',
                    'max_channels' => $org->getMaxChannels(),
                    'channels_count' => (int) $org->channels_count,
                    'users_count' => (int) $org->users_count,
                    'status' => $org->status ?: 'active',
                    'created_at' => $org->created_at ? $org->created_at->format('M d, Y') : '—',
                    'channels' => $org->channels->map(fn ($c) => [
                        'id' => (string) $c->id,
                        'name' => $c->name,
                        'phone_number' => $c->phone_number,
                        'phone_number_id' => $c->phone_number_id,
                        'quality_rating' => $c->quality_rating ?: 'GREEN',
                        'status' => $c->status,
                        'is_default' => (bool) $c->is_default,
                    ]),
                    'owner' => $org->users->first() ? [
                        'id' => $org->users->first()->id,
                        'name' => $org->users->first()->name,
                        'email' => $org->users->first()->email,
                    ] : null,
                    'b2b_agent' => $org->b2bAgent ? [
                        'id' => $org->b2bAgent->id,
                        'name' => $org->b2bAgent->name,
                        'email' => $org->b2bAgent->email,
                    ] : null,
                    'b2b_agent_id' => $org->b2b_agent_id,
                    'subscription_expires_at' => $org->subscription_expires_at?->format('d M Y'),
                    'subscription_price_paise' => $org->subscription_price_paise,
                    'wallet' => app(\App\Services\WalletService::class)->getBalances($org),
                ];
            });

        $b2bAgents = User::where('is_b2b_agent', true)->get(['id', 'name', 'email']);

        return Inertia::render('admin/organizations', [
            'organizations' => $organizations,
            'b2bAgents' => $b2bAgents,
            'currentOrgId' => TenantContext::id() ?? $request->user()?->current_organization_id,
        ]);
    }

    /**
     * Update an Organization's WhatsApp Quota and Subscription Plan
     */
    public function updateLimit(Request $request, string $id): RedirectResponse
    {
        $this->ensureSuperAdmin($request);

        $validated = $request->validate([
            'max_channels' => 'required|integer|min:0', // 0 = unlimited, 1 = single, 2+ = multi
            'subscription_plan' => 'nullable|string|max:50',
            'status' => 'nullable|string|in:active,suspended',
            'b2b_agent_id' => 'nullable|integer|exists:users,id',
        ]);

        $org = Organization::findOrFail($id);
        $data = [
            'subscription_plan' => $validated['subscription_plan'] ?? $org->subscription_plan,
            'status' => $validated['status'] ?? $org->status,
        ];

        if (array_key_exists('b2b_agent_id', $validated)) {
            $data['b2b_agent_id'] = $validated['b2b_agent_id'];
        }

        if (Schema::hasColumn('organizations', 'max_channels')) {
            $data['max_channels'] = (int) $validated['max_channels'];
        } else {
            $metadata = $org->metadata ?? [];
            $metadata['max_channels'] = (int) $validated['max_channels'];
            $data['metadata'] = $metadata;
        }

        $org->update($data);

        $limitText = $validated['max_channels'] == 0
            ? 'Unlimited numbers'
            : ($validated['max_channels'] == 1 ? 'Single Number (1 max)' : "Multiple Numbers ({$validated['max_channels']} max)");

        return back()->with('success', "Limits updated for {$org->name}: {$limitText}");
    }

    /**
     * Jump / Impersonate directly into a Client's workspace
     */
    public function switchWorkspace(Request $request, string $id): RedirectResponse
    {
        $this->ensureSuperAdmin($request);

        $org = Organization::findOrFail($id);
        $user = $request->user();

        if ($user) {
            // Ensure user has access and is attached as Owner if not already attached
            if (! $user->organizations()->where('organizations.id', $org->id)->exists()) {
                $user->organizations()->attach($org->id, ['role' => 'Owner']);
            }
            $user->switchOrganization($org);
            $request->session()->put('support_workspace_id', $org->id);
            $user->update(['current_organization_id' => $org->id]);
            $request->session()->put('current_organization_id', $org->id);
            \App\Shared\TenantContext::set($org);
        }

        return redirect('/dashboard')->with('success', "Opened workspace: {$org->name}");
    }

    /**
     * Credit Wallet Balance to any workspace manually
     */
    public function creditWallet(Request $request, string $id): RedirectResponse
    {
        $this->ensureSuperAdmin($request);
        $org = Organization::findOrFail($id);
        $validated = $request->validate([
            'amount_rupees' => 'required|numeric|min:0.01|max:50000',
            'type' => 'nullable|string|in:promotional,paid',
            'note' => 'nullable|string|max:255',
        ]);

        $amountPaise = (int) round($validated['amount_rupees'] * 100);
        $balanceType = $validated['type'] ?? 'promotional';
        $note = $validated['note'] ?: "Admin manual credit of ₹{$validated['amount_rupees']}";

        app(\App\Services\WalletService::class)->credit(
            org: $org,
            amountPaise: $amountPaise,
            type: 'manual_credit',
            balanceType: $balanceType,
            description: $note
        );

        return back()->with('success', "Credited ₹{$validated['amount_rupees']} to {$org->name}'s wallet successfully.");
    }

    /**
     * Global Master List of All WhatsApp Channels
     */
    public function channels(Request $request): Response
    {
        $this->ensureSuperAdmin($request);

        $channels = WhatsAppChannel::with('organization:id,name,slug')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn ($ch) => [
                'id' => (string) $ch->id,
                'organization_id' => (string) $ch->organization_id,
                'organization_name' => $ch->organization?->name ?: 'Unknown Organization',
                'organization_slug' => $ch->organization?->slug ?: '',
                'name' => $ch->name,
                'phone_number' => $ch->phone_number,
                'phone_number_id' => $ch->phone_number_id,
                'waba_id' => $ch->waba_id,
                'quality_rating' => $ch->quality_rating ?: 'GREEN',
                'messaging_limit' => $ch->messaging_limit ?: 'TIER_1K',
                'status' => $ch->status,
                'is_default' => (bool) $ch->is_default,
                'webhook_verified' => !empty($ch->webhook_verified_at),
                'created_at' => $ch->created_at ? $ch->created_at->format('M d, Y H:i') : '—',
            ]);

        return Inertia::render('admin/channels', [
            'channels' => $channels,
        ]);
    }

    /**
     * System Users Directory
     */
    public function users(Request $request): Response
    {
        $this->ensureSuperAdmin($request);

        $users = User::with('organizations:id,name,slug')
            ->orderBy('id', 'asc')
            ->get()
            ->map(fn ($u) => [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'is_super_admin' => (bool) $u->is_super_admin,
                'is_b2b_agent' => (bool) $u->is_b2b_agent,
                'referral_code' => $u->referral_code,
                'organizations' => $u->organizations->map(fn ($o) => [
                    'id' => (string) $o->id,
                    'name' => $o->name,
                    'role' => $o->pivot->role ?? 'Member',
                ]),
                'created_at' => $u->created_at ? $u->created_at->format('M d, Y') : '—',
            ]);

        return Inertia::render('admin/users', [
            'users' => $users,
        ]);
    }

    /**
     * Create a New User & Client Workspace from Admin Panel
     */
    public function storeUser(Request $request): RedirectResponse
    {
        $this->ensureSuperAdmin($request);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:12'],
            'workspace_name' => ['nullable', 'string', 'max:255'],
            'max_channels' => ['nullable', 'integer', 'min:0'],
            'is_super_admin' => ['nullable', 'boolean'],
        ]);

        $userData = [
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'email_verified_at' => now(),
        ];

        if (Schema::hasColumn('users', 'is_super_admin')) {
            $userData['is_super_admin'] = (bool) $request->input('is_super_admin', false);
        }

        $user = User::create($userData);
        $user->markEmailAsVerified();

        // Auto-provision Workspace for user
        $wsName = !empty($validated['workspace_name'])
            ? $validated['workspace_name']
            : ($validated['name'] . "'s Workspace");
        $slug = Str::slug($wsName) . '-' . rand(100, 999);

        $validityDays = (int) PlatformSetting::read('subscription_validity_days', 365);
        $annualPricePaise = (int) PlatformSetting::read('subscription_annual_price_paise', 999900);

        $orgData = [
            'name' => $wsName,
            'slug' => $slug,
            'subscription_plan' => 'annual',
            'subscription_expires_at' => now()->addDays($validityDays),
            'subscription_price_paise' => $annualPricePaise,
            'status' => 'active',
        ];

        if (Schema::hasColumn('organizations', 'max_channels')) {
            $orgData['max_channels'] = $request->has('max_channels') ? (int) $request->input('max_channels') : 1;
        }

        $org = Organization::create($orgData);
        $user->organizations()->attach($org->id, ['role' => 'Owner']);
        $user->update(['current_organization_id' => $org->id]);

        return back()->with('success', "New user '{$user->name}' ({$user->email}) and workspace '{$org->name}' created successfully!");
    }

    /**
     * Update User Credentials (Name, Email, Password, Super Admin)
     */
    public function updateUser(Request $request, int $id): RedirectResponse
    {
        $this->ensureSuperAdmin($request);

        $targetUser = User::findOrFail($id);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email,' . $targetUser->id],
            'password' => ['nullable', 'string', 'min:12'],
            'is_super_admin' => ['nullable', 'boolean'],
        ]);

        $updateData = [
            'name' => $validated['name'],
            'email' => $validated['email'],
            'email_verified_at' => $targetUser->email_verified_at ?: now(),
        ];

        if (!empty($validated['password'])) {
            $updateData['password'] = Hash::make($validated['password']);
        }

        if (Schema::hasColumn('users', 'is_super_admin')) {
            abort_if($targetUser->is_super_admin && ! $request->boolean('is_super_admin') && User::where('is_super_admin', true)->count() <= 1, 422, 'Keep at least one super administrator.');
            $updateData['is_super_admin'] = $request->boolean('is_super_admin');
        }

        $targetUser->update($updateData);

        return back()->with('success', "Credentials for '{$targetUser->name}' ({$targetUser->email}) updated successfully!");
    }

    /**
     * Delete a User Account
     */
    public function destroyUser(Request $request, int $id): RedirectResponse
    {
        $this->ensureSuperAdmin($request);

        $targetUser = User::findOrFail($id);

        // Protect primary super admin ID 1
        if ($targetUser->is_super_admin && User::where('is_super_admin', true)->count() <= 1) {
            return back()->with('error', 'Primary Super Administrator (ID 1) cannot be deleted.');
        }

        // Prevent super admin from deleting themselves
        if ($request->user() && $request->user()->id === $targetUser->id) {
            return back()->with('error', 'You cannot delete your own account while logged in.');
        }

        $userName = $targetUser->name;
        $userEmail = $targetUser->email;

        // Auto clean up workspaces where this user was the only member
        $userOrgs = $targetUser->organizations()->get();
        foreach ($userOrgs as $org) {
            if ($org->users()->count() <= 1) {
                $org->channels()->delete();
                $org->delete();
            }
        }

        // Detach from remaining organizations
        $targetUser->organizations()->detach();

        // Delete user
        $targetUser->delete();

        return back()->with('success', "User '{$userName}' ({$userEmail}) has been deleted successfully.");
    }

    /**
     * Delete an Organization / Client Workspace
     */
    public function destroyOrganization(Request $request, string $id): RedirectResponse
    {
        $this->ensureSuperAdmin($request);

        $org = Organization::findOrFail($id);

        // Delete channels
        $org->channels()->delete();

        // Detach all users
        $org->users()->detach();

        // Soft delete the organization
        $org->delete();

        return back()->with('success', "Workspace '{$org->name}' has been deleted successfully.");
    }

    /**
     * Toggle Super Admin Privileges for a User
     */
    public function toggleSuperAdmin(Request $request, int $id): RedirectResponse
    {
        $this->ensureSuperAdmin($request);

        $targetUser = User::findOrFail($id);

        // Protect primary owner from being demoted
        if ($targetUser->is_super_admin && User::where('is_super_admin', true)->count() <= 1) {
            return back()->with('error', 'Primary Super Administrator (ID 1) cannot be revoked.');
        }

        if (Schema::hasColumn('users', 'is_super_admin')) {
            $targetUser->update([
                'is_super_admin' => !$targetUser->is_super_admin,
            ]);
        }

        $status = $targetUser->is_super_admin ? 'granted' : 'revoked';
        return back()->with('success', "Super Admin access {$status} for {$targetUser->name} ({$targetUser->email}).");
    }

    /**
     * Toggle B2B Agent & Partner Role for a User
     */
    public function toggleAgent(Request $request, int $id): RedirectResponse
    {
        $this->ensureSuperAdmin($request);

        $targetUser = User::findOrFail($id);
        $targetUser->update([
            'is_b2b_agent' => ! $targetUser->is_b2b_agent,
        ]);

        $status = $targetUser->is_b2b_agent ? 'granted' : 'revoked';
        return back()->with('success', "B2B Agent & Partner access {$status} for {$targetUser->name} ({$targetUser->email}).");
    }

    /**
     * Global Platform & Meta Cloud API Settings Overview
     */
    public function settings(Request $request): Response
    {
        $this->ensureSuperAdmin($request);
        return Inertia::render('admin/settings', ['settings' => [
            'app_id' => \App\Services\MetaApi::setting('app_id') ?? '',
            'config_id' => \App\Services\MetaApi::setting('config_id') ?? '',
            'permanent_token' => '',
            'verify_token' => \App\Services\MetaApi::setting('verify_token') ?? '',
            'webhook_url' => url('/webhooks/meta'),
            'graph_version' => config('release.meta.graph_version'),
            'php_version' => PHP_VERSION, 'laravel_version' => app()->version(), 'environment' => config('app.env'),
            // Subscription & Financial Configuration
            'subscription_annual_price_paise' => (int) \App\Models\PlatformSetting::read('subscription_annual_price_paise', 999900),
            'subscription_validity_days' => (int) \App\Models\PlatformSetting::read('subscription_validity_days', 365),
            'welcome_bonus_paise' => (int) \App\Models\PlatformSetting::read('welcome_bonus_paise', 50000),
            'referral_reward_paise' => (int) \App\Models\PlatformSetting::read('referral_reward_paise', 50000),
            'campaign_max_contacts' => (int) \App\Models\PlatformSetting::read('campaign_max_contacts', 2000),
            'min_message_purchase_count' => (int) \App\Models\PlatformSetting::read('min_message_purchase_count', 200),
            'meta_rate_marketing_paise' => (int) \App\Models\PlatformSetting::read('meta_rate_marketing_paise', 88),
            'meta_rate_utility_paise' => (int) \App\Models\PlatformSetting::read('meta_rate_utility_paise', 14),
            'meta_rate_authentication_paise' => (int) \App\Models\PlatformSetting::read('meta_rate_authentication_paise', 14),
        ]]);
    }

    public function updateSettings(Request $request): RedirectResponse
    {
        $this->ensureSuperAdmin($request);
        $data = $request->validate([
            'app_id' => 'nullable|string|max:100', 'config_id' => 'nullable|string|max:100',
            'verify_token' => 'nullable|string|min:16|max:255',
            'app_secret' => 'nullable|string|max:1000',
            'openai_api_key' => 'nullable|string|max:1000',
            'razorpay_key_id' => 'nullable|string|max:255', 'razorpay_key_secret' => 'nullable|string|max:1000', 'razorpay_webhook_secret' => 'nullable|string|max:1000',
            // Financial & Subscription settings
            'subscription_annual_price_paise' => 'nullable|integer|min:0',
            'subscription_validity_days' => 'nullable|integer|min:1',
            'welcome_bonus_paise' => 'nullable|integer|min:0',
            'referral_reward_paise' => 'nullable|integer|min:0',
            'campaign_max_contacts' => 'nullable|integer|min:10',
            'min_message_purchase_count' => 'nullable|integer|min:1',
            'meta_rate_marketing_paise' => 'nullable|integer|min:0',
            'meta_rate_utility_paise' => 'nullable|integer|min:0',
            'meta_rate_authentication_paise' => 'nullable|integer|min:0',
        ]);
        foreach ($data as $key => $value) {
            if ($value !== null && $value !== '') {
                $isSystemKey = in_array($key, [
                    'openai_api_key',
                    'subscription_annual_price_paise',
                    'subscription_validity_days',
                    'welcome_bonus_paise',
                    'referral_reward_paise',
                    'campaign_max_contacts',
                    'min_message_purchase_count',
                    'meta_rate_marketing_paise',
                    'meta_rate_utility_paise',
                    'meta_rate_authentication_paise',
                ]) || str_starts_with($key, 'razorpay_');

                \App\Models\PlatformSetting::write($isSystemKey ? $key : 'meta_'.$key, (string) $value);
            }
        }
        \App\Modules\Foundation\Models\AuditLog::record('platform.settings.updated');
        return back()->with('success', 'Platform settings saved successfully.');
    }

    /**
     * Run Automated Bug Fixes across all workspaces and channels
     */
    public function diagnosticsReport(Request $request, SystemHealthService $healthService)
    {
        $this->ensureSuperAdmin($request);
        return response()->json($healthService->diagnose());
    }

    public function autoFixDiagnostics(Request $request, SystemHealthService $healthService)
    {
        $this->ensureSuperAdmin($request);

        $result = $healthService->autoFix();

        // Dynamically sync details from Meta Graph API for all connected channels if token available
        $tokenToUse = Cache::get('meta_whatsapp_token') ?: env('META_WHATSAPP_TOKEN', '');
        if ($tokenToUse) {
            $channels = WhatsAppChannel::withoutGlobalScopes()->get();
            foreach ($channels as $ch) {
                // Always sync the latest access token to all channels
                $ch->update(['access_token' => $tokenToUse]);

                // If channel phone_number is missing or 'Registered', fetch from Meta Graph API!
                if (empty($ch->phone_number) || str_contains($ch->phone_number, 'Registered')) {
                    if (!empty($ch->phone_number_id) && !str_starts_with($ch->phone_number_id, 'phone_')) {
                        try {
                            $resp = Http::withToken($tokenToUse)->get("https://graph.facebook.com/v22.0/{$ch->phone_number_id}", [
                                'fields' => 'display_phone_number,verified_name,quality_rating',
                            ]);
                            if ($resp->successful()) {
                                $data = $resp->json();
                                $ch->update(array_filter([
                                    'phone_number' => $data['display_phone_number'] ?? null,
                                    'name' => $data['verified_name'] ?? null,
                                    'quality_rating' => $data['quality_rating'] ?? 'GREEN',
                                    'access_token' => $tokenToUse,
                                ]));
                            }
                        } catch (\Throwable $e) {}
                    }
                }
            }
        }

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => $result['message'] ?? 'Auto bug fix completed successfully.',
                'diagnostics' => $healthService->diagnose(),
            ]);
        }

        return back()->with('success', $result['message'] ?? 'Auto bug fix completed successfully.');
    }

    /**
     * Subscriptions Management & Client Plan Tracking
     */
    public function subscriptions(Request $request): Response
    {
        $this->ensureSuperAdmin($request);

        $now = now();
        $thirtyDaysFromNow = now()->addDays(30);

        $organizations = Organization::withCount(['channels', 'users'])
            ->with([
                'users:id,name,email,is_super_admin',
                'channels:id,organization_id,name,phone_number',
                'b2bAgent:id,name,email,referral_code',
            ])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($org) use ($now, $thirtyDaysFromNow) {
                $expiry = $org->subscription_expires_at;
                $daysRemaining = null;
                $isExpired = false;
                $isExpiringSoon = false;

                if ($expiry) {
                    $daysRemaining = (int) $now->diffInDays($expiry, false);
                    $isExpired = $daysRemaining < 0;
                    $isExpiringSoon = !$isExpired && $daysRemaining <= 30;
                }

                $invoices = Schema::hasTable('billing_invoices')
                    ? BillingInvoice::where('organization_id', $org->id)
                        ->latest()
                        ->get()
                        ->map(fn ($inv) => [
                            'id' => (string) $inv->id,
                            'plan' => $inv->plan,
                            'amount_paise' => (int) $inv->amount_paise,
                            'amount_formatted' => '₹' . number_format($inv->amount_paise / 100, 2),
                            'status' => $inv->status,
                            'provider_payment_id' => $inv->provider_payment_id,
                            'paid_at' => $inv->paid_at ? $inv->paid_at->format('d M Y, H:i') : null,
                            'created_at' => $inv->created_at ? $inv->created_at->format('d M Y') : '—',
                        ])
                    : collect();

                // Select primary owner: prefer non-superadmin with role Owner, then any with role Owner, then non-superadmin, then first
                $ownerUser = $org->users->first(fn ($u) => ($u->pivot->role ?? '') === 'Owner' && !$u->is_super_admin)
                    ?? $org->users->first(fn ($u) => ($u->pivot->role ?? '') === 'Owner')
                    ?? $org->users->first(fn ($u) => !$u->is_super_admin)
                    ?? $org->users->first();

                return [
                    'id' => (string) $org->id,
                    'name' => $org->name,
                    'slug' => $org->slug,
                    'billing_email' => $org->billing_email,
                    'subscription_plan' => 'Annual Business Plan',
                    'subscription_price_paise' => (int) ($org->subscription_price_paise ?: 999900),
                    'subscription_price_formatted' => '₹' . number_format(((int) ($org->subscription_price_paise ?: 999900)) / 100, 2),
                    'status' => $org->status ?: 'active',
                    'subscription_expires_at' => $expiry ? $expiry->format('Y-m-d') : null,
                    'subscription_expires_at_formatted' => $expiry ? $expiry->format('d M Y') : 'Never (Lifetime)',
                    'days_remaining' => $daysRemaining,
                    'is_expired' => $isExpired,
                    'is_expiring_soon' => $isExpiringSoon,
                    'channels_count' => (int) $org->channels_count,
                    'max_channels' => $org->getMaxChannels(),
                    'channels' => $org->channels->map(fn ($c) => [
                        'id' => (string) $c->id,
                        'name' => $c->name,
                        'phone_number' => $c->phone_number,
                    ])->values()->all(),
                    'owner' => $ownerUser ? [
                        'id' => $ownerUser->id,
                        'name' => $ownerUser->name,
                        'email' => $ownerUser->email,
                    ] : null,
                    'users' => $org->users->map(fn ($u) => [
                        'id' => $u->id,
                        'name' => $u->name,
                        'email' => $u->email,
                    ])->values()->all(),
                    'b2b_agent' => $org->b2bAgent ? [
                        'id' => $org->b2bAgent->id,
                        'name' => $org->b2bAgent->name,
                        'email' => $org->b2bAgent->email,
                        'referral_code' => $org->b2bAgent->referral_code ?? null,
                    ] : null,
                    'invoices' => $invoices,
                    'created_at' => $org->created_at ? $org->created_at->format('d M Y') : '—',
                ];
            });

        $totalOrgs = $organizations->count();
        $activeCount = $organizations->where('status', 'active')->where('is_expired', false)->count();
        $expiredCount = $organizations->filter(fn ($o) => $o['status'] === 'expired' || $o['is_expired'])->count();
        $expiringSoonCount = $organizations->where('is_expiring_soon', true)->count();

        $totalRevenuePaise = Schema::hasTable('billing_invoices')
            ? (int) BillingInvoice::where('status', 'paid')->sum('amount_paise')
            : 0;

        $monthlyRevenuePaise = Schema::hasTable('billing_invoices')
            ? (int) BillingInvoice::where('status', 'paid')->where('created_at', '>=', now()->startOfMonth())->sum('amount_paise')
            : 0;

        return Inertia::render('admin/subscriptions', [
            'organizations' => $organizations,
            'stats' => [
                'total_organizations' => $totalOrgs,
                'active_subscriptions' => $activeCount,
                'expired_subscriptions' => $expiredCount,
                'expiring_soon' => $expiringSoonCount,
                'total_revenue_formatted' => '₹' . number_format($totalRevenuePaise / 100, 2),
                'monthly_revenue_formatted' => '₹' . number_format($monthlyRevenuePaise / 100, 2),
            ],
        ]);
    }

    /**
     * Super Admin: Update or Extend Client Subscription
     */
    public function updateSubscription(Request $request, string $id): RedirectResponse
    {
        $this->ensureSuperAdmin($request);

        $validated = $request->validate([
            'subscription_plan' => 'required|string|max:50',
            'status' => 'required|string|in:active,expired,suspended',
            'subscription_expires_at' => 'nullable|date',
            'subscription_price_rupees' => 'nullable|numeric|min:0',
            'generate_invoice' => 'nullable|boolean',
        ]);

        $org = Organization::findOrFail($id);

        $pricePaise = isset($validated['subscription_price_rupees'])
            ? (int) round($validated['subscription_price_rupees'] * 100)
            : ($org->subscription_price_paise ?: 999900);

        $org->update([
            'subscription_plan' => $validated['subscription_plan'],
            'status' => $validated['status'],
            'subscription_expires_at' => $validated['subscription_expires_at'] ? \Carbon\Carbon::parse($validated['subscription_expires_at']) : null,
            'subscription_price_paise' => $pricePaise,
        ]);

        if (!empty($validated['generate_invoice']) && Schema::hasTable('billing_invoices')) {
            BillingInvoice::create([
                'organization_id' => $org->id,
                'plan' => $validated['subscription_plan'],
                'amount_paise' => $pricePaise,
                'currency' => 'INR',
                'status' => 'paid',
                'provider_order_id' => 'ADMIN_MANUAL_' . strtoupper(Str::random(8)),
                'provider_payment_id' => 'PAY_MANUAL_' . strtoupper(Str::random(10)),
                'paid_at' => now(),
                'period_ends_at' => $validated['subscription_expires_at'] ? \Carbon\Carbon::parse($validated['subscription_expires_at']) : now()->addYear(),
            ]);
        }

        return back()->with('success', "Subscription updated successfully for {$org->name}.");
    }

    /**
     * Super Admin: Wallets Management & Manual Credits Control
     */
    public function wallets(Request $request): Response
    {
        $this->ensureSuperAdmin($request);

        $walletService = app(\App\Services\WalletService::class);

        $organizations = Organization::with(['users:id,name,email'])
            ->orderBy('name', 'asc')
            ->get()
            ->map(function ($org) use ($walletService) {
                $balances = $walletService->getBalances($org);
                $lastTx = WalletTransaction::where('organization_id', $org->id)->latest()->first();

                return [
                    'id' => (string) $org->id,
                    'name' => $org->name,
                    'slug' => $org->slug,
                    'owner' => $org->users->first() ? [
                        'id' => $org->users->first()->id,
                        'name' => $org->users->first()->name,
                        'email' => $org->users->first()->email,
                    ] : null,
                    'paid_balance_paise' => $balances['paid_balance_paise'],
                    'promotional_balance_paise' => $balances['promotional_balance_paise'],
                    'total_balance_paise' => $balances['total_balance_paise'],
                    'paid_balance_formatted' => $balances['paid_balance_formatted'],
                    'promotional_balance_formatted' => $balances['promotional_balance_formatted'],
                    'total_balance_formatted' => $balances['total_balance_formatted'],
                    'last_transaction_at' => $lastTx ? $lastTx->created_at->format('d M Y, H:i') : 'Never',
                ];
            });

        // Global Transaction History (Latest 50 transactions across all organizations)
        $transactions = WalletTransaction::with('organization:id,name,slug')
            ->latest()
            ->take(60)
            ->get()
            ->map(fn ($tx) => [
                'id' => (string) $tx->id,
                'organization_id' => (string) $tx->organization_id,
                'organization_name' => $tx->organization?->name ?: 'System / Unknown',
                'type' => $tx->type,
                'balance_type' => $tx->balance_type,
                'amount_paise' => (int) $tx->amount_paise,
                'amount_formatted' => '₹' . number_format($tx->amount_paise / 100, 2),
                'description' => $tx->description,
                'reference_id' => $tx->reference_id,
                'created_at' => $tx->created_at ? $tx->created_at->format('d M Y, H:i') : '—',
            ]);

        $totalPaidPaise = (int) Wallet::sum('paid_balance_paise');
        $totalPromoPaise = (int) Wallet::sum('promotional_balance_paise');
        $totalRechargePaise = (int) WalletTransaction::where('type', 'recharge')->where('amount_paise', '>', 0)->sum('amount_paise');
        $totalManualCreditsPaise = (int) WalletTransaction::where('type', 'manual_credit')->where('amount_paise', '>', 0)->sum('amount_paise');

        return Inertia::render('admin/wallets', [
            'organizations' => $organizations,
            'transactions' => $transactions,
            'stats' => [
                'total_paid_formatted' => '₹' . number_format($totalPaidPaise / 100, 2),
                'total_promo_formatted' => '₹' . number_format($totalPromoPaise / 100, 2),
                'total_platform_balance_formatted' => '₹' . number_format(($totalPaidPaise + $totalPromoPaise) / 100, 2),
                'total_recharges_formatted' => '₹' . number_format($totalRechargePaise / 100, 2),
                'total_manual_credits_formatted' => '₹' . number_format($totalManualCreditsPaise / 100, 2),
            ],
        ]);
    }

    /**
     * Direct endpoint to credit any organization's wallet
     */
    public function creditWalletDirect(Request $request): RedirectResponse
    {
        $this->ensureSuperAdmin($request);

        $validated = $request->validate([
            'organization_id' => 'required|uuid|exists:organizations,id',
            'amount_rupees' => 'required|numeric|min:0.01|max:500000',
            'balance_type' => 'required|string|in:paid,promotional',
            'note' => 'nullable|string|max:255',
            'reference_id' => 'nullable|string|max:100',
        ]);

        $org = Organization::findOrFail($validated['organization_id']);
        $amountPaise = (int) round($validated['amount_rupees'] * 100);
        $note = $validated['note'] ?: "Super Admin Manual Credit of ₹{$validated['amount_rupees']}";
        $refId = $validated['reference_id'] ?: 'ADMIN-' . strtoupper(Str::random(8));

        app(\App\Services\WalletService::class)->credit(
            org: $org,
            amountPaise: $amountPaise,
            type: 'manual_credit',
            balanceType: $validated['balance_type'],
            description: $note,
            referenceId: $refId
        );

        return back()->with('success', "Successfully credited ₹{$validated['amount_rupees']} ({$validated['balance_type']}) to {$org->name}.");
    }

    /**
     * Super Admin: Deep Analytics & Daily Usage Telemetry
     */
    public function analytics(Request $request): Response
    {
        $this->ensureSuperAdmin($request);

        $totalMessages = Message::count();
        $totalOutbound = Message::where('direction', 'outbound')->count();
        $totalInbound = Message::where('direction', 'inbound')->count();
        $totalDelivered = Message::where('direction', 'outbound')->whereIn('status', ['delivered', 'read'])->count();
        $totalRead = Message::where('direction', 'outbound')->where('status', 'read')->count();
        $totalFailed = Message::where('direction', 'outbound')->where('status', 'failed')->count();

        $deliveryRate = $totalOutbound > 0 ? round(($totalDelivered / $totalOutbound) * 100, 1) : 100.0;
        $readRate = $totalDelivered > 0 ? round(($totalRead / $totalDelivered) * 100, 1) : 0.0;
        $failureRate = $totalOutbound > 0 ? round(($totalFailed / $totalOutbound) * 100, 1) : 0.0;

        // Daily Message Volume for the last 14 days
        $days = collect();
        for ($i = 13; $i >= 0; $i--) {
            $date = now()->subDays($i)->format('Y-m-d');
            $dayStart = \Carbon\Carbon::parse($date)->startOfDay();
            $dayEnd = \Carbon\Carbon::parse($date)->endOfDay();

            $dayOutbound = Message::where('direction', 'outbound')->whereBetween('created_at', [$dayStart, $dayEnd])->count();
            $dayInbound = Message::where('direction', 'inbound')->whereBetween('created_at', [$dayStart, $dayEnd])->count();
            $dayDelivered = Message::where('direction', 'outbound')->whereIn('status', ['delivered', 'read'])->whereBetween('created_at', [$dayStart, $dayEnd])->count();
            $dayRead = Message::where('direction', 'outbound')->where('status', 'read')->whereBetween('created_at', [$dayStart, $dayEnd])->count();
            $dayFailed = Message::where('direction', 'outbound')->where('status', 'failed')->whereBetween('created_at', [$dayStart, $dayEnd])->count();
            $dayTotal = $dayOutbound + $dayInbound;
            $dayRate = $dayOutbound > 0 ? round(($dayDelivered / $dayOutbound) * 100, 1) : 100.0;

            $days->push([
                'date' => $date,
                'label' => $i === 0 ? 'Today' : ($i === 1 ? 'Yesterday' : \Carbon\Carbon::parse($date)->format('d M')),
                'total' => $dayTotal,
                'outbound' => $dayOutbound,
                'inbound' => $dayInbound,
                'delivered' => $dayDelivered,
                'read' => $dayRead,
                'failed' => $dayFailed,
                'delivery_rate' => $dayRate,
            ]);
        }

        // Top 10 Organizations by Message Volume
        $topOrganizations = Organization::withCount([
            'messages as total_messages',
            'messages as outbound_messages' => fn ($q) => $q->where('direction', 'outbound'),
            'messages as delivered_messages' => fn ($q) => $q->where('direction', 'outbound')->whereIn('status', ['delivered', 'read']),
        ])
        ->withCount('channels')
        ->orderBy('total_messages', 'desc')
        ->take(10)
        ->get()
        ->map(function ($org) {
            $outbound = (int) $org->outbound_messages;
            $delivered = (int) $org->delivered_messages;
            $rate = $outbound > 0 ? round(($delivered / $outbound) * 100, 1) : 100.0;

            return [
                'id' => (string) $org->id,
                'name' => $org->name,
                'channels_count' => (int) $org->channels_count,
                'total_messages' => (int) $org->total_messages,
                'outbound_messages' => $outbound,
                'delivered_messages' => $delivered,
                'delivery_rate' => $rate,
            ];
        });

        // Channel Health
        $channelHealth = [
            'green' => WhatsAppChannel::where('quality_rating', 'GREEN')->count(),
            'yellow' => WhatsAppChannel::where('quality_rating', 'YELLOW')->count(),
            'red' => WhatsAppChannel::where('quality_rating', 'RED')->count(),
            'connected' => WhatsAppChannel::where('status', 'connected')->count(),
            'disconnected' => WhatsAppChannel::where('status', '!=', 'connected')->count(),
        ];

        return Inertia::render('admin/analytics', [
            'kpis' => [
                'total_messages' => $totalMessages,
                'total_outbound' => $totalOutbound,
                'total_inbound' => $totalInbound,
                'total_delivered' => $totalDelivered,
                'total_read' => $totalRead,
                'total_failed' => $totalFailed,
                'delivery_rate' => $deliveryRate,
                'read_rate' => $readRate,
                'failure_rate' => $failureRate,
            ],
            'dailyUsage' => $days,
            'topOrganizations' => $topOrganizations,
            'channelHealth' => $channelHealth,
        ]);
    }
}
