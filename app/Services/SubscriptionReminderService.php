<?php

namespace App\Services;

use App\Models\Wallet;
use App\Modules\Foundation\Models\AuditLog;
use App\Modules\Foundation\Models\Organization;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class SubscriptionReminderService
{
    /**
     * Intervals in days before expiration when reminders should be sent.
     */
    public const REMINDER_INTERVALS = [30, 15, 7, 3, 1];

    /**
     * Threshold in paise for low balance alert (₹100.00).
     */
    public const LOW_WALLET_THRESHOLD_PAISE = 10000;

    public function checkExpiringSubscriptions(): array
    {
        $notificationsSent = [];

        // 1. Process active organizations nearing expiration
        foreach (self::REMINDER_INTERVALS as $days) {
            $targetDate = now()->addDays($days)->format('Y-m-d');

            $expiringOrgs = Organization::where('status', 'active')
                ->whereNotNull('subscription_expires_at')
                ->whereDate('subscription_expires_at', $targetDate)
                ->get();

            foreach ($expiringOrgs as $org) {
                AuditLog::record('subscription.reminder_sent', null, [
                    'organization_id' => $org->id,
                    'organization_name' => $org->name,
                    'days_remaining' => $days,
                    'expires_at' => $org->subscription_expires_at->toIso8601String(),
                ]);

                $notificationsSent[] = [
                    'org_id' => $org->id,
                    'org_name' => $org->name,
                    'type' => 'expiry_reminder',
                    'days' => $days,
                ];

                Log::info("Sent {$days}-day subscription expiry reminder to {$org->name} ({$org->billing_email}).");
            }
        }

        // 2. Mark subscriptions that have passed expiration date as 'expired'
        $expiredOrgs = Organization::where('status', 'active')
            ->whereNotNull('subscription_expires_at')
            ->where('subscription_expires_at', '<', now())
            ->get();

        foreach ($expiredOrgs as $org) {
            $org->update(['status' => 'expired']);

            AuditLog::record('subscription.expired', null, [
                'organization_id' => $org->id,
                'organization_name' => $org->name,
                'expired_at' => $org->subscription_expires_at->toIso8601String(),
            ]);

            $notificationsSent[] = [
                'org_id' => $org->id,
                'org_name' => $org->name,
                'type' => 'subscription_expired',
            ];

            Log::warning("Subscription expired for organization {$org->name}. Outbound campaigns and AI bots gated.");
        }

        return $notificationsSent;
    }

    public function checkLowWalletBalances(): array
    {
        $lowBalanceAlerts = [];

        $wallets = Wallet::with('organization')
            ->whereRaw('(paid_balance_paise + promotional_balance_paise) < ?', [self::LOW_WALLET_THRESHOLD_PAISE])
            ->get();

        foreach ($wallets as $wallet) {
            $org = $wallet->organization;
            if (! $org || $org->status !== 'active') {
                continue;
            }

            $balance = $wallet->totalBalancePaise();
            $formatted = '₹' . number_format($balance / 100, 2);

            AuditLog::record('wallet.low_balance_alert', null, [
                'organization_id' => $org->id,
                'balance_paise' => $balance,
                'balance_formatted' => $formatted,
            ]);

            $lowBalanceAlerts[] = [
                'org_id' => $org->id,
                'org_name' => $org->name,
                'balance' => $formatted,
            ];

            Log::info("Low wallet balance alert for {$org->name}: {$formatted} remaining.");
        }

        return $lowBalanceAlerts;
    }
}
