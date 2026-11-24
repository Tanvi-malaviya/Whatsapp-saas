<?php

namespace App\Modules\Billing\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\BillingInvoice;
use App\Models\PlatformSetting;
use App\Modules\Foundation\Models\Organization;
use App\Modules\Foundation\Models\AuditLog;
use App\Modules\Messaging\Models\Message;
use App\Services\ReferralService;
use App\Services\WalletService;
use App\Shared\TenantContext;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia;

class BillingController extends Controller
{
    public function __construct(
        protected WalletService $walletService,
        protected ReferralService $referralService
    ) {}

    public function index(Request $request)
    {
        $org = TenantContext::get();
        $user = $request->user();
        $plans = config('release.plans');

        // Dynamic annual price from admin platform settings
        $annualPricePaise = (int) PlatformSetting::read('subscription_annual_price_paise', 999900);
        $annualValidityDays = (int) PlatformSetting::read('subscription_validity_days', 365);
        if (isset($plans['annual'])) {
            $plans['annual']['amount_paise'] = $annualPricePaise;
            $plans['annual']['validity_days'] = $annualValidityDays;
        }

        $wallet = $this->walletService->getOrCreateWallet($org);
        $walletBalances = $this->walletService->getBalances($org);
        $walletTransactions = $wallet->transactions()->take(50)->get()->map(fn ($tx) => [
            'id' => $tx->id,
            'type' => $tx->type,
            'amount_paise' => $tx->amount_paise,
            'amount_formatted' => ($tx->amount_paise >= 0 ? '+' : '-') . '₹' . number_format(abs($tx->amount_paise) / 100, 2),
            'balance_type' => $tx->balance_type,
            'description' => $tx->description,
            'reference_id' => $tx->reference_id,
            'date' => $tx->created_at->format('d M Y, h:i A'),
        ]);

        $referralStats = $this->referralService->getReferralStats($user);

        $rates = [
            'marketing' => (int) PlatformSetting::read('meta_rate_marketing_paise', 88),
            'utility' => (int) PlatformSetting::read('meta_rate_utility_paise', 14),
            'authentication' => (int) PlatformSetting::read('meta_rate_authentication_paise', 14),
            'min_messages' => (int) PlatformSetting::read('min_message_purchase_count', 500),
        ];

        return Inertia::render('settings/billing', [
            'currentPlan' => $org->subscription_plan ?: 'annual',
            'subscriptionStatus' => $org->status ?: 'active',
            'subscriptionExpiresAt' => $org->subscription_expires_at?->toIso8601String(),
            'daysUntilExpiry' => $org->daysUntilExpiry(),
            'plans' => $plans,
            'wallet' => [
                ...$walletBalances,
                'transactions' => $walletTransactions,
            ],
            'rates' => $rates,
            'referral' => $referralStats,
            'usage' => [
                'messages' => Message::where('direction', 'outbound')->where('created_at', '>=', now()->startOfMonth())->count(),
                'channels' => $org->channels()->count(),
                'seats' => $org->users()->count(),
            ],
            'limits' => [
                'channels' => $org->getMaxChannels(),
            ],
            'invoices' => BillingInvoice::latest()->limit(50)->get(),
            'profile' => ['name' => $org->name, 'billing_email' => $org->billing_email, ...($org->metadata['billing_profile'] ?? [])],
            'checkoutReady' => (bool) (PlatformSetting::read('razorpay_key_id', config('release.razorpay.key_id')) && PlatformSetting::read('razorpay_key_secret', config('release.razorpay.key_secret'))),
        ]);
    }

    public function profile(Request $request)
    {
        $data = $request->validate([
            'billing_email' => 'required|email|max:255',
            'address' => 'nullable|string|max:1000',
            'gstin' => 'nullable|regex:/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]Z[0-9A-Z]$/',
        ]);

        $org = TenantContext::get();
        $meta = $org->metadata ?? [];
        $meta['billing_profile'] = $data;
        $org->update(['billing_email' => $data['billing_email'], 'metadata' => $meta]);

        return response()->json(['success' => true]);
    }

    public function checkout(Request $request)
    {
        $data = $request->validate([
            'plan' => 'required|in:annual,starter,growth,business_pro,enterprise,wallet_recharge',
            'amount_paise' => 'nullable|integer|min:100',
            'messages_count' => 'nullable|integer|min:500',
            'category' => 'nullable|string|in:MARKETING,UTILITY,AUTHENTICATION',
        ]);

        $org = TenantContext::get();

        if ($data['plan'] === 'enterprise') {
            AuditLog::record('billing.enterprise_requested', null, ['workspace' => $org->id]);
            return response()->json(['requested' => true, 'message' => 'Your Enterprise request has been recorded for the administrator.']);
        }

        $keyId = PlatformSetting::read('razorpay_key_id', config('release.razorpay.key_id'));
        $keySecret = PlatformSetting::read('razorpay_key_secret', config('release.razorpay.key_secret'));
        abort_unless($keyId && $keySecret, 422, 'Ask the administrator to configure Razorpay before checkout.');

        // Calculate amount
        $amountPaise = 0;
        $description = '';

        if ($data['plan'] === 'wallet_recharge') {
            $minMessages = (int) PlatformSetting::read('min_message_purchase_count', 500);
            $msgCount = (int) ($data['messages_count'] ?? 0);
            if ($msgCount > 0 && $msgCount < $minMessages) {
                abort(422, "Minimum message purchase is {$minMessages} messages.");
            }

            if ($msgCount > 0) {
                $category = $data['category'] ?? 'MARKETING';
                $rate = $this->walletService->getRatePerMessage($category);
                $amountPaise = max(100, $msgCount * $rate);
                $description = "Wallet Recharge: {$msgCount} {$category} messages (₹" . number_format($amountPaise / 100, 2) . ")";
            } elseif (! empty($data['amount_paise'])) {
                $amountPaise = (int) $data['amount_paise'];
                $description = "Wallet Recharge: ₹" . number_format($amountPaise / 100, 2);
            } else {
                abort(422, 'Please specify messages count or recharge amount.');
            }
        } elseif ($data['plan'] === 'annual') {
            $amountPaise = (int) PlatformSetting::read('subscription_annual_price_paise', 999900);
            $description = 'Annual Business Plan (365 Days) — ₹' . number_format($amountPaise / 100, 2);
        } else {
            $planConfig = config('release.plans.' . $data['plan']);
            $amountPaise = (int) ($planConfig['amount_paise'] ?? 99900);
            $description = ($planConfig['name'] ?? 'Plan') . ' — 1 Month';
        }

        $invoice = BillingInvoice::create([
            'organization_id' => $org->id,
            'plan' => $data['plan'],
            'amount_paise' => $amountPaise,
            'currency' => 'INR',
            'status' => 'pending',
        ]);

        try {
            $order = Http::withBasicAuth($keyId, $keySecret)
                ->timeout(20)
                ->post('https://api.razorpay.com/v1/orders', [
                    'amount' => $invoice->amount_paise,
                    'currency' => 'INR',
                    'receipt' => $invoice->id,
                ])
                ->throw()
                ->json();

            $invoice->update(['provider_order_id' => $order['id']]);
        } catch (\Throwable $error) {
            $invoice->update(['status' => 'failed']);
            throw $error;
        }

        return response()->json([
            'key' => $keyId,
            'order_id' => $order['id'],
            'amount' => $invoice->amount_paise,
            'currency' => 'INR',
            'name' => config('app.name'),
            'description' => $description,
            'prefill' => [
                'email' => $org->billing_email ?: $request->user()->email,
            ],
        ]);
    }

    public function verify(Request $request)
    {
        $data = $request->validate([
            'razorpay_order_id' => 'required|string',
            'razorpay_payment_id' => 'required|string',
            'razorpay_signature' => 'required|string',
        ]);

        $invoice = BillingInvoice::where('provider_order_id', $data['razorpay_order_id'])->firstOrFail();
        $secret = PlatformSetting::read('razorpay_key_secret', config('release.razorpay.key_secret'));
        abort_unless($secret && hash_equals(hash_hmac('sha256', $invoice->provider_order_id . '|' . $data['razorpay_payment_id'], $secret), $data['razorpay_signature']), 403, 'Payment signature verification failed.');

        $this->verifyPayment($invoice, $data['razorpay_payment_id'], $request->user());

        return response()->json(['success' => true]);
    }

    private function verifyPayment(BillingInvoice $invoice, string $paymentId, $currentUser = null): void
    {
        $keyId = PlatformSetting::read('razorpay_key_id', config('release.razorpay.key_id'));
        $keySecret = PlatformSetting::read('razorpay_key_secret', config('release.razorpay.key_secret'));

        $payment = Http::withBasicAuth($keyId, $keySecret)
            ->timeout(20)
            ->get('https://api.razorpay.com/v1/payments/' . $paymentId)
            ->throw()
            ->json();

        abort_unless(
            ($payment['order_id'] ?? null) === $invoice->provider_order_id &&
            ($payment['status'] ?? '') === 'captured' &&
            ($payment['amount'] ?? 0) === $invoice->amount_paise &&
            ($payment['currency'] ?? '') === $invoice->currency,
            422,
            'Payment has not been captured for this invoice.'
        );

        DB::transaction(function () use ($invoice, $paymentId, $currentUser) {
            $invoice = BillingInvoice::withoutGlobalScopes()->whereKey($invoice->id)->lockForUpdate()->firstOrFail();
            if ($invoice->status === 'paid') {
                return;
            }

            $validityDays = (int) PlatformSetting::read('subscription_validity_days', 365);
            $endsAt = $invoice->plan === 'annual' ? now()->addDays($validityDays) : now()->addMonthNoOverflow();

            $invoice->update([
                'status' => 'paid',
                'provider_payment_id' => $paymentId,
                'paid_at' => now(),
                'period_ends_at' => $endsAt,
            ]);

            $org = Organization::whereKey($invoice->organization_id)->lockForUpdate()->firstOrFail();

            if ($invoice->plan === 'wallet_recharge') {
                // Credit prepaid messaging wallet
                $this->walletService->credit(
                    org: $org,
                    amountPaise: $invoice->amount_paise,
                    type: 'recharge',
                    balanceType: 'paid',
                    description: "Prepaid wallet recharge of ₹" . number_format($invoice->amount_paise / 100, 2),
                    referenceId: $paymentId
                );
            } else {
                // Subscription purchase / renewal
                $maxChannels = (int) PlatformSetting::read('subscription_max_channels', 1);
                $org->update([
                    'subscription_plan' => $invoice->plan,
                    'subscription_expires_at' => $endsAt,
                    'status' => 'active',
                    'max_channels' => $maxChannels,
                ]);

                // 1. One-time ₹500 welcome bonus on annual subscription
                $this->walletService->creditWelcomeBonus($org);

                // 2. Referral reward: credit ₹500 to referrer if referred
                $user = $currentUser ?? $org->users()->first();
                if ($user) {
                    $this->referralService->rewardOnSubscription($user, $org);
                }
            }
        });
    }

    public function webhook(Request $request)
    {
        $secret = PlatformSetting::read('razorpay_webhook_secret', config('release.razorpay.webhook_secret'));
        abort_unless($secret && hash_equals(hash_hmac('sha256', $request->getContent(), $secret), $request->header('X-Razorpay-Signature', '')), 403);

        if ($request->input('event') === 'payment.captured') {
            $entity = $request->input('payload.payment.entity', []);
            $invoice = BillingInvoice::withoutGlobalScopes()->where('provider_order_id', $entity['order_id'] ?? '')->first();
            if ($invoice) {
                $this->verifyPayment($invoice, $entity['id']);
            }
        }

        return response()->json(['received' => true]);
    }

    public function download(string $id)
    {
        $invoice = BillingInvoice::findOrFail($id);
        abort_unless($invoice->status === 'paid', 422, 'A receipt is available after payment.');
        $org = TenantContext::get();

        $pdf = new \Dompdf\Dompdf();
        $pdf->loadHtml('<h1>Payment receipt</h1><p>' . e(config('app.name')) . '</p><p>Receipt: ' . e($invoice->id) . '</p><p>Customer: ' . e($org->name) . '</p><p>Email: ' . e($org->billing_email) . '</p><p>Plan: ' . e($invoice->plan) . '</p><p>Amount received: INR ' . number_format($invoice->amount_paise / 100, 2) . '</p><p>Paid: ' . e($invoice->paid_at->toIso8601String()) . '</p><p>Payment ID: ' . e($invoice->provider_payment_id) . '</p>');
        $pdf->render();

        return response($pdf->output())
            ->header('Content-Type', 'application/pdf')
            ->header('Content-Disposition', 'attachment; filename="receipt-' . $invoice->id . '.pdf"');
    }
}
