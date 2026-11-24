<?php

namespace App\Services;

use App\Models\PlatformSetting;
use App\Models\ReferralReward;
use App\Models\User;
use App\Modules\Foundation\Models\AuditLog;
use App\Modules\Foundation\Models\Organization;
use Illuminate\Support\Facades\DB;

class ReferralService
{
    public function __construct(
        protected WalletService $walletService
    ) {}

    public function applyReferralCode(User $user, ?string $code): bool
    {
        if (! $code) {
            return false;
        }

        $code = strtoupper(trim($code));
        $referrer = User::where('referral_code', $code)->first();

        // Prevent self-referral or invalid code
        if (! $referrer || $referrer->id === $user->id) {
            return false;
        }

        $user->update(['referred_by_id' => $referrer->id]);

        AuditLog::record('referral.code_applied', null, [
            'user_id' => $user->id,
            'referrer_id' => $referrer->id,
            'code' => $code,
        ]);

        return true;
    }

    public function rewardOnSubscription(User $referredUser, Organization $referredOrg): ?ReferralReward
    {
        if (! $referredUser->referred_by_id) {
            return null;
        }

        $referrer = User::find($referredUser->referred_by_id);
        if (! $referrer || $referrer->id === $referredUser->id) {
            return null; // Prevent self-referral
        }

        return DB::transaction(function () use ($referrer, $referredUser, $referredOrg) {
            // Check if already rewarded for this organization
            $existing = ReferralReward::where('referred_organization_id', $referredOrg->id)->first();
            if ($existing) {
                return $existing;
            }

            $rewardAmountPaise = (int) PlatformSetting::read('referral_reward_paise', 50000); // Default ₹500
            if ($rewardAmountPaise <= 0) {
                return null;
            }

            // Find referrer's active organization to credit reward
            $referrerOrg = $referrer->currentOrganization ?? $referrer->organizations()->first();
            if ($referrerOrg) {
                $this->walletService->credit(
                    org: $referrerOrg,
                    amountPaise: $rewardAmountPaise,
                    type: 'referral_reward',
                    balanceType: 'promotional',
                    description: "Referral reward: ₹" . number_format($rewardAmountPaise / 100, 2) . " for referring {$referredUser->name} ({$referredOrg->name})",
                    referenceId: 'REF-ORG-' . $referredOrg->id
                );
            }

            $reward = ReferralReward::create([
                'referrer_user_id' => $referrer->id,
                'referred_user_id' => $referredUser->id,
                'referred_organization_id' => $referredOrg->id,
                'reward_amount_paise' => $rewardAmountPaise,
                'status' => 'rewarded',
                'rewarded_at' => now(),
            ]);

            AuditLog::record('referral.rewarded', null, [
                'referrer_id' => $referrer->id,
                'referred_user_id' => $referredUser->id,
                'referred_org_id' => $referredOrg->id,
                'reward_paise' => $rewardAmountPaise,
            ]);

            return $reward;
        });
    }

    public function getReferralStats(User $user): array
    {
        $code = $user->generateReferralCode();
        $rewards = ReferralReward::with(['referredUser', 'referredOrganization'])
            ->where('referrer_user_id', $user->id)
            ->latest()
            ->get();

        $totalEarnedPaise = $rewards->where('status', 'rewarded')->sum('reward_amount_paise');
        $totalReferrals = User::where('referred_by_id', $user->id)->count();

        return [
            'referral_code' => $code,
            'referral_link' => url('/register?ref=' . $code),
            'total_referrals' => $totalReferrals,
            'successful_conversions' => $rewards->where('status', 'rewarded')->count(),
            'total_earned_paise' => $totalEarnedPaise,
            'total_earned_formatted' => '₹' . number_format($totalEarnedPaise / 100, 2),
            'history' => $rewards->map(fn ($r) => [
                'id' => $r->id,
                'user_name' => $r->referredUser?->name ?? 'Customer',
                'org_name' => $r->referredOrganization?->name ?? 'Workspace',
                'amount_paise' => $r->reward_amount_paise,
                'amount_formatted' => '₹' . number_format($r->reward_amount_paise / 100, 2),
                'status' => $r->status,
                'date' => $r->rewarded_at?->format('d M Y, h:i A') ?? $r->created_at->format('d M Y'),
            ]),
        ];
    }
}
