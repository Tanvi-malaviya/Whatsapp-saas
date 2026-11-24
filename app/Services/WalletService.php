<?php

namespace App\Services;

use App\Models\PlatformSetting;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use App\Modules\Foundation\Models\AuditLog;
use App\Modules\Foundation\Models\Organization;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class WalletService
{
    public function getOrCreateWallet(Organization $org): Wallet
    {
        return $org->getOrCreateWallet();
    }

    public function getBalances(Organization $org): array
    {
        $wallet = $this->getOrCreateWallet($org);

        return [
            'paid_balance_paise' => (int) $wallet->paid_balance_paise,
            'promotional_balance_paise' => (int) $wallet->promotional_balance_paise,
            'total_balance_paise' => $wallet->totalBalancePaise(),
            'paid_balance_formatted' => '₹' . number_format($wallet->paid_balance_paise / 100, 2),
            'promotional_balance_formatted' => '₹' . number_format($wallet->promotional_balance_paise / 100, 2),
            'total_balance_formatted' => '₹' . number_format($wallet->totalBalancePaise() / 100, 2),
        ];
    }

    public function credit(
        Organization $org,
        int $amountPaise,
        string $type,
        string $balanceType = 'paid',
        ?string $description = null,
        ?string $referenceId = null,
        array $metadata = []
    ): WalletTransaction {
        if ($amountPaise <= 0) {
            throw new RuntimeException('Credit amount must be greater than zero.');
        }

        return DB::transaction(function () use ($org, $amountPaise, $type, $balanceType, $description, $referenceId, $metadata) {
            $wallet = Wallet::where('organization_id', $org->id)->lockForUpdate()->first();
            if (! $wallet) {
                $wallet = Wallet::create([
                    'organization_id' => $org->id,
                    'paid_balance_paise' => 0,
                    'promotional_balance_paise' => 0,
                ]);
            }

            if ($balanceType === 'promotional') {
                $wallet->promotional_balance_paise += $amountPaise;
            } else {
                $wallet->paid_balance_paise += $amountPaise;
            }
            $wallet->save();

            $transaction = WalletTransaction::create([
                'wallet_id' => $wallet->id,
                'organization_id' => $org->id,
                'type' => $type,
                'amount_paise' => $amountPaise,
                'balance_type' => $balanceType,
                'reference_id' => $referenceId,
                'description' => $description,
                'metadata' => $metadata,
            ]);

            AuditLog::record('wallet.credit', null, [
                'organization_id' => $org->id,
                'amount_paise' => $amountPaise,
                'type' => $type,
                'balance_type' => $balanceType,
                'transaction_id' => $transaction->id,
            ]);

            return $transaction;
        });
    }

    public function debit(
        Organization $org,
        int $amountPaise,
        string $description,
        ?string $referenceId = null,
        array $metadata = []
    ): WalletTransaction {
        if ($amountPaise <= 0) {
            throw new RuntimeException('Debit amount must be greater than zero.');
        }

        return DB::transaction(function () use ($org, $amountPaise, $description, $referenceId, $metadata) {
            $wallet = Wallet::where('organization_id', $org->id)->lockForUpdate()->first();
            if (! $wallet || ! $wallet->hasSufficientBalance($amountPaise)) {
                $available = $wallet ? $wallet->totalBalancePaise() : 0;
                throw new RuntimeException("Insufficient wallet balance. Required: ₹" . number_format($amountPaise / 100, 2) . ", Available: ₹" . number_format($available / 100, 2));
            }

            // Deduct promotional balance first, then paid balance
            $promoDeduct = min($wallet->promotional_balance_paise, $amountPaise);
            $paidDeduct = $amountPaise - $promoDeduct;

            $wallet->promotional_balance_paise -= $promoDeduct;
            $wallet->paid_balance_paise -= $paidDeduct;
            $wallet->save();

            $balanceType = ($promoDeduct > 0 && $paidDeduct > 0) ? 'mixed' : ($promoDeduct > 0 ? 'promotional' : 'paid');

            $transaction = WalletTransaction::create([
                'wallet_id' => $wallet->id,
                'organization_id' => $org->id,
                'type' => 'message_deduction',
                'amount_paise' => -$amountPaise,
                'balance_type' => $balanceType,
                'reference_id' => $referenceId,
                'description' => $description,
                'metadata' => [
                    ...$metadata,
                    'promo_deducted_paise' => $promoDeduct,
                    'paid_deducted_paise' => $paidDeduct,
                ],
            ]);

            AuditLog::record('wallet.debit', null, [
                'organization_id' => $org->id,
                'amount_paise' => $amountPaise,
                'balance_type' => $balanceType,
                'transaction_id' => $transaction->id,
            ]);

            return $transaction;
        });
    }

    public function refund(
        Organization $org,
        int $amountPaise,
        string $description,
        ?string $referenceId = null,
        array $metadata = []
    ): WalletTransaction {
        return $this->credit(
            org: $org,
            amountPaise: $amountPaise,
            type: 'refund',
            balanceType: 'paid',
            description: $description,
            referenceId: $referenceId,
            metadata: $metadata
        );
    }

    public function creditWelcomeBonus(Organization $org): ?WalletTransaction
    {
        return DB::transaction(function () use ($org) {
            $freshOrg = Organization::whereKey($org->id)->lockForUpdate()->first();
            if (! $freshOrg || $freshOrg->welcome_bonus_claimed) {
                return null;
            }

            $bonusPaise = (int) PlatformSetting::read('welcome_bonus_paise', 50000); // Default ₹500
            if ($bonusPaise <= 0) {
                return null;
            }

            $freshOrg->update(['welcome_bonus_claimed' => true]);

            return $this->credit(
                org: $freshOrg,
                amountPaise: $bonusPaise,
                type: 'welcome_bonus',
                balanceType: 'promotional',
                description: 'Welcome Bonus: ₹' . number_format($bonusPaise / 100, 2) . ' credited for WhatsApp messaging',
                referenceId: 'BONUS-' . $freshOrg->id
            );
        });
    }

    public function getRatePerMessage(string $category = 'MARKETING', string $countryCode = 'IN'): int
    {
        $category = strtoupper($category);
        return match ($category) {
            'UTILITY' => (int) PlatformSetting::read('meta_rate_utility_paise', 14),
            'AUTHENTICATION' => (int) PlatformSetting::read('meta_rate_authentication_paise', 14),
            'SERVICE' => (int) PlatformSetting::read('meta_rate_service_paise', 0),
            default => (int) PlatformSetting::read('meta_rate_marketing_paise', 88),
        };
    }

    public function estimateCost(int $recipientCount, string $category = 'MARKETING', string $countryCode = 'IN'): int
    {
        $ratePaise = $this->getRatePerMessage($category, $countryCode);
        return (int) max(0, $recipientCount * $ratePaise);
    }
}
