<?php

namespace App\Http\Controllers;

use App\Models\PlatformSetting;
use App\Models\User;
use App\Models\Wallet;
use App\Modules\Campaigns\Models\BroadcastCampaign;
use App\Modules\Foundation\Models\AuditLog;
use App\Modules\Foundation\Models\Organization;
use App\Modules\Messaging\Models\Message;
use App\Modules\MetaConnection\Models\WhatsAppChannel;
use App\Services\ReferralService;
use App\Services\WalletService;
use App\Shared\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class AgentController extends Controller
{
    public function __construct(
        protected WalletService $walletService,
        protected ReferralService $referralService
    ) {}

    public function showLogin(Request $request): Response|RedirectResponse
    {
        if ($request->user()) {
            if ($request->user()->isB2BAgent() || $request->user()->isSuperAdmin()) {
                return redirect()->route('agent.dashboard');
            }
            return redirect()->route('dashboard')->with('error', 'Only registered B2B Partners have access to the Partner Portal.');
        }

        return Inertia::render('agent/login', [
            'status' => session('status'),
        ]);
    }

    public function exitAssist(Request $request): RedirectResponse
    {
        $agent = $request->user();
        $ownOrg = $agent->organizations()->first();
        if ($ownOrg) {
            $agent->switchOrganization($ownOrg);
        } else {
            $agent->update(['current_organization_id' => null]);
        }

        return redirect()->route('agent.dashboard')->with('success', 'Returned to B2B Partner Portal.');
    }

    public function dashboard(Request $request): Response
    {
        $agent = $request->user();

        // Scope to organizations assigned to this agent (Super Admin sees all or assigned)
        $query = Organization::query();
        if (! $agent->isSuperAdmin()) {
            $query->where('b2b_agent_id', $agent->id);
        } else {
            // If super admin, display orgs that have a b2b_agent_id assigned, or all
            $query->whereNotNull('b2b_agent_id');
        }

        $customers = $query->with(['channels', 'users'])
            ->latest()
            ->get()
            ->map(function (Organization $org) {
                $wallet = $this->walletService->getBalances($org);
                $owner = $org->users()->wherePivot('role', 'Owner')->first() ?? $org->users()->first();
                $campaignCount = BroadcastCampaign::where('organization_id', $org->id)->count();

                return [
                    'id' => $org->id,
                    'name' => $org->name,
                    'billing_email' => $org->billing_email ?: $owner?->email,
                    'owner_name' => $owner?->name ?? 'Customer Owner',
                    'owner_email' => $owner?->email,
                    'status' => $org->status ?: 'active',
                    'subscription_plan' => $org->subscription_plan ?: 'annual',
                    'subscription_expires_at' => $org->subscription_expires_at?->format('d M Y'),
                    'days_until_expiry' => $org->daysUntilExpiry(),
                    'channels_count' => $org->channels->count(),
                    'campaigns_count' => $campaignCount,
                    'wallet_balance' => $wallet['total_balance_formatted'],
                    'wallet_paid' => $wallet['paid_balance_formatted'],
                    'wallet_promo' => $wallet['promotional_balance_formatted'],
                    'created_at' => $org->created_at->format('d M Y'),
                ];
            });

        $totalCustomers = $customers->count();
        $activeCustomers = $customers->where('status', 'active')->count();

        $orgIds = $customers->pluck('id');
        $totalMessagesSent = Message::whereIn('organization_id', $orgIds)
            ->where('direction', 'outbound')
            ->count();

        $referralStats = $this->referralService->getReferralStats($agent);

        return Inertia::render('agent/dashboard', [
            'agent' => [
                'id' => $agent->id,
                'name' => $agent->name,
                'email' => $agent->email,
                'referral_code' => $agent->generateReferralCode(),
            ],
            'customers' => $customers,
            'stats' => [
                'total_customers' => $totalCustomers,
                'active_customers' => $activeCustomers,
                'total_messages_sent' => $totalMessagesSent,
                'total_referral_rewards' => $referralStats['total_earned_formatted'],
                'conversions' => $referralStats['successful_conversions'],
            ],
            'referral' => $referralStats,
        ]);
    }

    public function createCustomer(Request $request): RedirectResponse
    {
        $agent = $request->user();

        $data = $request->validate([
            'business_name' => 'required|string|max:150',
            'owner_name' => 'required|string|max:100',
            'owner_email' => 'required|email|max:255|unique:users,email',
            'owner_password' => 'required|string|min:8',
            'billing_email' => 'nullable|email|max:255',
        ]);

        DB::transaction(function () use ($agent, $data) {
            // 1. Create owner user
            $user = User::create([
                'name' => $data['owner_name'],
                'email' => $data['owner_email'],
                'password' => Hash::make($data['owner_password']),
                'email_verified_at' => now(),
                'referred_by_id' => $agent->id,
            ]);
            $user->generateReferralCode();

            // 2. Create customer workspace assigned to this B2B agent
            $slug = Str::slug($data['business_name']) . '-' . rand(100, 999);
            $validityDays = (int) PlatformSetting::read('subscription_validity_days', 365);
            $maxChannels = (int) PlatformSetting::read('subscription_max_channels', 1);

            $org = Organization::create([
                'name' => $data['business_name'],
                'slug' => $slug,
                'billing_email' => $data['billing_email'] ?: $data['owner_email'],
                'subscription_plan' => 'annual',
                'subscription_expires_at' => now()->addDays($validityDays),
                'subscription_price_paise' => (int) PlatformSetting::read('subscription_annual_price_paise', 999900),
                'status' => 'active',
                'max_channels' => $maxChannels,
                'b2b_agent_id' => $agent->id,
            ]);

            // 3. Link user to organization
            $user->organizations()->attach($org->id, ['role' => 'Owner']);
            $user->update(['current_organization_id' => $org->id]);

            // 4. Initialize wallet & grant welcome bonus
            $this->walletService->getOrCreateWallet($org);
            $this->walletService->creditWelcomeBonus($org);

            // 5. Grant referral reward to the agent
            $this->referralService->rewardOnSubscription($user, $org);

            AuditLog::record('agent.customer_created', null, [
                'agent_id' => $agent->id,
                'customer_user_id' => $user->id,
                'organization_id' => $org->id,
                'business_name' => $org->name,
            ]);
        });

        return back()->with('success', "Customer workspace '{$data['business_name']}' created successfully.");
    }

    public function assistCustomer(Request $request, string $id): RedirectResponse
    {
        $agent = $request->user();

        $query = Organization::where('id', $id);
        if (! $agent->isSuperAdmin()) {
            $query->where('b2b_agent_id', $agent->id);
        }

        $org = $query->firstOrFail();

        // Switch agent's active workspace to assist customer
        $agent->switchOrganization($org);

        AuditLog::record('agent.assist_customer', null, [
            'agent_id' => $agent->id,
            'organization_id' => $org->id,
            'organization_name' => $org->name,
        ]);

        return redirect()->route('dashboard')->with('success', "Now assisting '{$org->name}'.");
    }

    public function customerDetails(Request $request, string $id): JsonResponse
    {
        $agent = $request->user();

        $query = Organization::where('id', $id);
        if (! $agent->isSuperAdmin()) {
            $query->where('b2b_agent_id', $agent->id);
        }

        $org = $query->firstOrFail();
        $wallet = $this->walletService->getBalances($org);
        $channels = WhatsAppChannel::where('organization_id', $org->id)->get(['id', 'name', 'phone_number', 'status', 'quality_rating']);
        $recentCampaigns = BroadcastCampaign::where('organization_id', $org->id)->latest()->take(10)->get();

        return response()->json([
            'organization' => [
                'id' => $org->id,
                'name' => $org->name,
                'billing_email' => $org->billing_email,
                'status' => $org->status,
                'subscription_plan' => $org->subscription_plan,
                'subscription_expires_at' => $org->subscription_expires_at?->format('d M Y'),
                'days_until_expiry' => $org->daysUntilExpiry(),
            ],
            'wallet' => $wallet,
            'channels' => $channels,
            'recent_campaigns' => $recentCampaigns,
        ]);
    }
}
