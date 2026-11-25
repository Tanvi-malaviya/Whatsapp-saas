import { Head } from '@inertiajs/react';
import {
    ArrowDownLeft,
    ArrowUpRight,
    Check,
    Copy,
    Gift,
    Plus,
    Wallet as WalletIcon,
} from 'lucide-react';
import { useState } from 'react';
import { BillingNotice } from '@/components/billing/billing-notice';
import { InvoiceList } from '@/components/billing/invoice-list';
import { money } from '@/components/billing/types';
import type { Invoice } from '@/components/billing/types';
import { useCheckout } from '@/components/billing/use-checkout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Transaction = {
    id: string;
    type: string;
    amount_formatted: string;
    balance_type: string;
    description: string;
    date: string;
};
type Props = {
    wallet: {
        paid_balance_formatted: string;
        promotional_balance_formatted: string;
        total_balance_formatted: string;
        transactions: Transaction[];
    };
    rates: {
        marketing: number;
        utility: number;
        authentication: number;
        min_messages: number;
    };
    referral: {
        referral_code: string;
        referral_link: string;
        total_referrals: number;
        successful_conversions: number;
        total_earned_formatted: string;
    };
    invoices: Invoice[];
    checkoutReady: boolean;
};

const categories = [
    { value: 'MARKETING', label: 'Marketing', rate: 'marketing' },
    { value: 'UTILITY', label: 'Utility', rate: 'utility' },
    {
        value: 'AUTHENTICATION',
        label: 'Authentication',
        rate: 'authentication',
    },
] as const;

export default function Wallet({
    wallet,
    rates,
    referral,
    invoices,
    checkoutReady,
}: Props) {
    const minAmountRupees = 200;
    const [open, setOpen] = useState(false);
    const [amountInput, setAmountInput] = useState(String(500));
    const [copied, setCopied] = useState(false);
    const { busy, notice, setNotice, checkout } = useCheckout(() =>
        setOpen(false),
    );
    const parsedAmount = Number(amountInput);
    const validAmount =
        Number.isFinite(parsedAmount) && parsedAmount >= minAmountRupees;
    const totalPaise = validAmount ? Math.round(parsedAmount * 100) : 0;
    const approxMarketing =
        validAmount && rates.marketing > 0
            ? Math.floor(totalPaise / rates.marketing)
            : 0;
    const approxUtility =
        validAmount && rates.utility > 0
            ? Math.floor(totalPaise / rates.utility)
            : 0;
    const presets = [200, 500, 1000, 2500, 5000];

    const copyReferral = async () => {
        try {
            await navigator.clipboard.writeText(referral.referral_link);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            setNotice({
                type: 'error',
                message:
                    'Could not copy the link. Select the referral link and copy it manually.',
            });
        }
    };

    return (
        <>
            <Head title="Messaging wallet" />
            <div className="w-full min-w-0 space-y-6 p-4 [overflow-wrap:anywhere] sm:p-6 lg:p-8">
                <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <p className="text-xs font-semibold tracking-wider text-emerald-700 uppercase dark:text-emerald-400">
                            Messaging credits
                        </p>
                        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
                            Wallet
                        </h1>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Recharge your messaging balance, track transactions,
                            and view referral rewards.
                        </p>
                    </div>
                    <Button
                        onClick={() => setOpen(true)}
                        disabled={!checkoutReady}
                        className="h-11 w-full shrink-0 gap-2 bg-emerald-700 text-white hover:bg-emerald-800 sm:w-auto"
                    >
                        <Plus className="size-4" />
                        Recharge wallet
                    </Button>
                </header>
                <BillingNotice notice={notice} />
                {!checkoutReady && (
                    <BillingNotice
                        notice={{
                            type: 'error',
                            message:
                                'Online recharge is unavailable. Contact your administrator to configure payments.',
                        }}
                    />
                )}
                <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {[
                        {
                            title: 'Available balance',
                            value: wallet.total_balance_formatted,
                            description: 'Paid and promotional credits',
                            featured: true,
                        },
                        {
                            title: 'Paid balance',
                            value: wallet.paid_balance_formatted,
                            description: 'Credits from wallet recharges',
                            featured: false,
                        },
                        {
                            title: 'Promotional balance',
                            value: wallet.promotional_balance_formatted,
                            description: 'Welcome bonuses and referral rewards',
                            featured: false,
                        },
                    ].map((item) => (
                        <Card
                            key={item.title}
                            className={`min-w-0 ${item.featured ? 'border-emerald-500/25 bg-emerald-500/5' : ''}`}
                        >
                            <CardContent className="pt-6">
                                <div className="flex items-start justify-between gap-3">
                                    <p className="text-sm text-muted-foreground">
                                        {item.title}
                                    </p>
                                    <WalletIcon className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <p className="mt-4 text-3xl font-bold tracking-tight tabular-nums">
                                    {item.value}
                                </p>
                                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                                    {item.description}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
                <div className="grid min-w-0 items-start gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                    <Card className="min-w-0">
                        <CardHeader>
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <CardTitle>Transaction history</CardTitle>
                                <Badge variant="secondary">
                                    {wallet.transactions.length} records
                                </Badge>
                            </div>
                            <CardDescription>
                                Wallet recharges, bonuses, and messaging
                                deductions.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {wallet.transactions.length ? (
                                <div className="max-h-[480px] divide-y divide-border overflow-y-auto">
                                    {wallet.transactions.map((tx) => {
                                        const credit =
                                            tx.amount_formatted.startsWith('+');
                                        const Icon = credit
                                            ? ArrowDownLeft
                                            : ArrowUpRight;
                                        return (
                                            <div
                                                key={tx.id}
                                                className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-start gap-3 py-4 sm:grid-cols-[auto_minmax(0,1fr)_auto]"
                                            >
                                                <span
                                                    className={`flex size-9 items-center justify-center rounded-full ${credit ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-muted text-muted-foreground'}`}
                                                >
                                                    <Icon className="size-4" />
                                                </span>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium">
                                                        {tx.description ||
                                                            tx.type}
                                                    </p>
                                                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                                        <span>{tx.date}</span>
                                                        <Badge
                                                            variant="outline"
                                                            className="capitalize"
                                                        >
                                                            {tx.balance_type}
                                                        </Badge>
                                                    </div>
                                                </div>
                                                <p
                                                    className={`col-start-2 text-sm font-semibold tabular-nums sm:col-start-auto sm:text-right ${credit ? 'text-emerald-700 dark:text-emerald-400' : ''}`}
                                                >
                                                    {tx.amount_formatted}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-3 py-12 text-center text-sm text-muted-foreground">
                                    <WalletIcon className="size-8" />
                                    <p>
                                        No transactions yet. Recharge your
                                        wallet to get started.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                    <Card className="min-w-0">
                        <CardHeader>
                            <CardTitle>Messaging rates</CardTitle>
                            <CardDescription>
                                Current rates configured for your messaging
                                wallet.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {categories.map((item) => (
                                <div
                                    key={item.value}
                                    className="flex flex-wrap items-center justify-between gap-2 text-sm"
                                >
                                    <span>{item.label}</span>
                                    <span className="font-semibold tabular-nums">
                                        {money(rates[item.rate])}
                                        <span className="text-xs font-normal text-muted-foreground">
                                            {' '}
                                            / message
                                        </span>
                                    </span>
                                </div>
                            ))}
                            <p className="border-t pt-4 text-xs leading-5 text-muted-foreground">
                                Minimum wallet recharge: ₹{minAmountRupees}.
                                Balance is automatically deducted per message
                                based on whether the sent template is Marketing,
                                Utility, or Authentication. Promotional credits
                                are used before paid credits.
                            </p>
                        </CardContent>
                    </Card>
                </div>
                <Card className="min-w-0">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Gift className="size-5 text-amber-600" />
                            <CardTitle>Referral rewards</CardTitle>
                        </div>
                        <CardDescription>
                            Share your referral link with other businesses and
                            track your rewards.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <div className="grid min-w-0 gap-4 sm:grid-cols-3">
                            {[
                                {
                                    title: 'Total referred',
                                    value: referral.total_referrals,
                                },
                                {
                                    title: 'Conversions',
                                    value: referral.successful_conversions,
                                },
                                {
                                    title: 'Rewards earned',
                                    value: referral.total_earned_formatted,
                                },
                            ].map((item) => (
                                <div
                                    key={item.title}
                                    className="min-w-0 rounded-xl bg-muted/50 p-4"
                                >
                                    <p className="text-xs text-muted-foreground">
                                        {item.title}
                                    </p>
                                    <p className="mt-2 text-2xl font-semibold tabular-nums">
                                        {item.value}
                                    </p>
                                </div>
                            ))}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="referral-link">
                                Your referral link
                            </Label>
                            <div className="flex flex-col gap-2 sm:flex-row">
                                <Input
                                    id="referral-link"
                                    readOnly
                                    value={referral.referral_link}
                                    className="h-11 min-w-0 font-mono text-base md:text-sm"
                                    onFocus={(event) => event.target.select()}
                                />
                                <Button
                                    variant="outline"
                                    onClick={copyReferral}
                                    className="h-11 shrink-0 gap-2"
                                >
                                    {copied ? (
                                        <Check className="size-4" />
                                    ) : (
                                        <Copy className="size-4" />
                                    )}
                                    {copied ? 'Copied' : 'Copy link'}
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Referral code:{' '}
                                <span className="font-mono">
                                    {referral.referral_code}
                                </span>
                            </p>
                        </div>
                    </CardContent>
                </Card>
                <InvoiceList invoices={invoices} title="Recharge receipts" />
            </div>
            <Dialog
                open={open}
                onOpenChange={(value) => {
                    if (!busy) setOpen(value);
                }}
            >
                <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Recharge messaging wallet</DialogTitle>
                        <DialogDescription>
                            Add prepaid balance to your wallet. Charges are
                            deducted automatically per message based on the
                            template category (Marketing or Utility).
                        </DialogDescription>
                    </DialogHeader>
                    <BillingNotice
                        notice={notice?.type === 'error' ? notice : null}
                    />
                    <form
                        className="min-w-0 space-y-5"
                        onSubmit={(event) => {
                            event.preventDefault();
                            if (validAmount && checkoutReady)
                                void checkout({
                                    plan: 'wallet_recharge',
                                    amount_rupees: parsedAmount,
                                });
                        }}
                    >
                        <div className="space-y-2">
                            <Label htmlFor="recharge-amount">
                                Recharge Amount (₹)
                            </Label>
                            <Input
                                id="recharge-amount"
                                type="number"
                                min={minAmountRupees}
                                step="1"
                                required
                                value={amountInput}
                                onChange={(event) =>
                                    setAmountInput(event.target.value)
                                }
                                onBlur={() => {
                                    if (
                                        amountInput.trim() !== '' &&
                                        (!Number.isFinite(parsedAmount) ||
                                            parsedAmount < minAmountRupees)
                                    ) {
                                        setAmountInput(String(minAmountRupees));
                                    }
                                }}
                                disabled={busy}
                                aria-describedby="amount-minimum"
                                className="h-11 text-base md:text-sm"
                                placeholder="Enter amount (min ₹200)"
                            />
                            <p
                                id="amount-minimum"
                                className={`text-xs ${
                                    amountInput.trim() !== '' && !validAmount
                                        ? 'font-medium text-destructive'
                                        : 'text-muted-foreground'
                                }`}
                            >
                                Minimum recharge is ₹{minAmountRupees}.
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {presets.map((preset) => (
                                    <Button
                                        key={preset}
                                        type="button"
                                        disabled={busy}
                                        variant={
                                            parsedAmount === preset
                                                ? 'secondary'
                                                : 'outline'
                                        }
                                        size="sm"
                                        onClick={() =>
                                            setAmountInput(String(preset))
                                        }
                                    >
                                        + ₹{preset.toLocaleString('en-IN')}
                                    </Button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-2.5 rounded-xl bg-muted/60 p-4 text-sm">
                            <div className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
                                <span>Approx. Marketing msgs ({money(rates.marketing)}/msg)</span>
                                <span className="font-medium text-foreground tabular-nums">
                                    ~{approxMarketing.toLocaleString('en-IN')} msgs
                                </span>
                            </div>
                            <div className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
                                <span>Approx. Utility msgs ({money(rates.utility)}/msg)</span>
                                <span className="font-medium text-foreground tabular-nums">
                                    ~{approxUtility.toLocaleString('en-IN')} msgs
                                </span>
                            </div>
                            <div className="flex flex-wrap justify-between gap-2 border-t pt-3 font-semibold">
                                <span>Total recharge</span>
                                <span className="tabular-nums">
                                    {money(totalPaise)}
                                </span>
                            </div>
                        </div>
                        <Button
                            type="submit"
                            disabled={busy || !validAmount || !checkoutReady}
                            className="h-11 w-full bg-emerald-700 text-white hover:bg-emerald-800"
                        >
                            {busy
                                ? 'Processing payment…'
                                : `Pay ${money(totalPaise)} via Razorpay`}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
