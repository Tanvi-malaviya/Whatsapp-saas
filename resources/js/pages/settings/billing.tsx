import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    Wallet as WalletIcon,
    Sparkles,
    CheckCircle2,
    Clock,
    AlertCircle,
    Copy,
    Check,
    CreditCard,
    ArrowUpRight,
    ArrowDownLeft,
    RefreshCw,
    Shield,
    Bot,
    Send,
    Users,
    Gift,
    FileText,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import SettingsLayout from '@/layouts/settings/layout';

type Plan = {
    name: string;
    amount_paise: number | null;
    validity_days?: number;
    messages: any;
    seats: number;
    channels?: number;
    features?: string[];
};

type WalletTx = {
    id: string;
    type: string;
    amount_formatted: string;
    balance_type: string;
    description: string;
    reference_id?: string;
    date: string;
};

type ReferralHistory = {
    id: string;
    user_name: string;
    org_name: string;
    amount_formatted: string;
    status: string;
    date: string;
};

type Props = {
    currentPlan: string;
    subscriptionStatus: string;
    subscriptionExpiresAt: string | null;
    daysUntilExpiry: number | null;
    plans: Record<string, Plan>;
    wallet: {
        paid_balance_paise: number;
        promotional_balance_paise: number;
        total_balance_paise: number;
        paid_balance_formatted: string;
        promotional_balance_formatted: string;
        total_balance_formatted: string;
        transactions: WalletTx[];
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
        history: ReferralHistory[];
    };
    usage: Record<string, number>;
    limits: Record<string, number>;
    invoices: any[];
    profile: any;
    checkoutReady: boolean;
};

export default function Billing({
    currentPlan,
    subscriptionStatus,
    subscriptionExpiresAt,
    daysUntilExpiry,
    plans,
    wallet,
    rates,
    referral,
    usage,
    limits,
    invoices,
    profile,
    checkoutReady,
}: Props) {
    const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [busy, setBusy] = useState(false);
    const [details, setDetails] = useState(profile);
    const [copied, setCopied] = useState(false);

    // Recharge Wallet Modal State
    const [showRechargeModal, setShowRechargeModal] = useState(false);
    const [rechargeCategory, setRechargeCategory] = useState<'MARKETING' | 'UTILITY' | 'AUTHENTICATION'>('MARKETING');
    const [rechargeCount, setRechargeCount] = useState<number>(500);

    const activeRate = rechargeCategory === 'MARKETING'
        ? (rates.marketing / 100)
        : rechargeCategory === 'UTILITY'
        ? (rates.utility / 100)
        : (rates.authentication / 100);

    const calculatedRechargeAmount = (rechargeCount * activeRate).toFixed(2);

    const copyReferral = () => {
        navigator.clipboard.writeText(referral.referral_link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const triggerCheckout = async (payload: { plan: string; messages_count?: number; category?: string; amount_paise?: number }) => {
        setBusy(true);
        setNotice(null);
        try {
            const order = await api('/settings/billing/checkout', 'POST', payload);
            if (order.requested) {
                setNotice({ type: 'success', message: order.message });
                setBusy(false);
                return;
            }

            if (!(window as any).Razorpay) {
                await new Promise<void>((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
                    script.onload = () => resolve();
                    script.onerror = () => reject(new Error('Could not load checkout. Try again.'));
                    document.body.appendChild(script);
                });
            }

            const widget = new (window as any).Razorpay({
                ...order,
                handler: async (result: any) => {
                    try {
                        await api('/settings/billing/verify', 'POST', result);
                        setNotice({ type: 'success', message: 'Payment verified and credited successfully!' });
                        setShowRechargeModal(false);
                        router.reload();
                    } catch (e) {
                        setNotice({ type: 'error', message: (e as Error).message });
                    } finally {
                        setBusy(false);
                    }
                },
                modal: { ondismiss: () => setBusy(false) },
            });

            widget.on('payment.failed', (result: any) => {
                setNotice({ type: 'error', message: result.error?.description ?? 'Payment failed.' });
                setBusy(false);
            });

            widget.open();
        } catch (e) {
            setNotice({ type: 'error', message: (e as Error).message });
            setBusy(false);
        }
    };

    const saveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setBusy(true);
        try {
            await api('/settings/billing/profile', 'PUT', details);
            setNotice({ type: 'success', message: 'Billing profile saved successfully.' });
        } catch (e) {
            setNotice({ type: 'error', message: (e as Error).message });
        } finally {
            setBusy(false);
        }
    };

    const annualPlan = plans.annual || plans.starter;

    return (
        <SettingsLayout>
            <Head title="Subscription & Messaging Wallet" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-foreground">Subscription & Wallet</h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Manage your annual business plan, prepaid WhatsApp messaging credits, and referral rewards.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            onClick={() => setShowRechargeModal(true)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 h-9"
                        >
                            <WalletIcon className="size-3.5" />
                            Recharge Wallet
                        </Button>
                    </div>
                </div>

                {/* Notifications Alert */}
                {notice && (
                    <div
                        className={`rounded-lg border p-3 text-xs flex items-center gap-2 ${
                            notice.type === 'success'
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                                : 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300'
                        }`}
                    >
                        {notice.type === 'success' ? <CheckCircle2 className="size-4 shrink-0" /> : <AlertCircle className="size-4 shrink-0" />}
                        <span>{notice.message}</span>
                    </div>
                )}

                {/* Section 1: Annual Subscription Plan Card */}
                <Card className="border-border bg-gradient-to-br from-card via-card to-emerald-950/10 shadow-xs">
                    <CardHeader className="pb-3">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                                <div className="size-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                    <Sparkles className="size-4" />
                                </div>
                                <div>
                                    <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                                        Annual WhatsApp Business Plan
                                        <Badge
                                            variant="outline"
                                            className={`text-[10px] uppercase font-bold ${
                                                subscriptionStatus === 'active'
                                                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                                    : 'border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                            }`}
                                        >
                                            {subscriptionStatus}
                                        </Badge>
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                        Official Meta Cloud API & Coexistence Support • 365 Days Validity
                                    </CardDescription>
                                </div>
                            </div>

                            <div className="text-right">
                                <div className="text-xl font-bold text-foreground">₹9,999<span className="text-xs font-normal text-muted-foreground"> / year</span></div>
                                <div className="text-[11px] text-muted-foreground">
                                    {daysUntilExpiry !== null ? (
                                        daysUntilExpiry > 0 ? (
                                            <span className="text-emerald-600 dark:text-emerald-400 font-medium">{daysUntilExpiry} days remaining</span>
                                        ) : (
                                            <span className="text-red-500 font-medium">Expired ({Math.abs(daysUntilExpiry)} days ago)</span>
                                        )
                                    ) : (
                                        <span>365 days validity</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-4 pt-1">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-2 border-t border-border/60">
                            {[
                                '1 WhatsApp Number per Subscription',
                                'Official Meta Cloud API & Coexistence',
                                'AI Chatbot & Knowledge Base Access',
                                'Automatic Customer Data CRM Storage',
                                'Broadcasts (up to 2,000 contacts/campaign)',
                                '₹500 Welcome Bonus Messaging Credit',
                                'Referral Rewards (₹500 per friend referred)',
                                'Real-time Analytics & Delivery Reports',
                                'Dedicated Setup & Customer Support',
                            ].map((benefit, i) => (
                                <div key={i} className="flex items-center gap-2 text-xs text-foreground/90">
                                    <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                    <span>{benefit}</span>
                                </div>
                            ))}
                        </div>

                        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 bg-muted/40 p-3 rounded-lg border border-border/50">
                            <div className="text-xs text-muted-foreground">
                                {subscriptionStatus === 'active' && daysUntilExpiry !== null && daysUntilExpiry > 30 ? (
                                    <span>Your subscription is active until {subscriptionExpiresAt ? new Date(subscriptionExpiresAt).toLocaleDateString() : 'one year'}.</span>
                                ) : (
                                    <span className="text-amber-600 dark:text-amber-400 font-medium">
                                        Renew your subscription now to ensure uninterrupted campaigns and AI chatbot replies.
                                    </span>
                                )}
                            </div>

                            <Button
                                disabled={busy || !checkoutReady}
                                onClick={() => triggerCheckout({ plan: 'annual' })}
                                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 px-4"
                            >
                                {subscriptionStatus === 'active' ? 'Renew Annual Plan (₹9,999)' : 'Activate Annual Plan (₹9,999)'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Section 2: Prepaid Messaging Wallet Card */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Wallet Balances Card (1 col) */}
                    <Card className="border-border bg-card">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-semibold flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <WalletIcon className="size-4 text-emerald-600 dark:text-emerald-400" />
                                    Prepaid Messaging Wallet
                                </span>
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Live Meta messaging balance
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20">
                                <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                    Total Available Balance
                                </div>
                                <div className="text-3xl font-extrabold text-foreground mt-1">
                                    {wallet.total_balance_formatted}
                                </div>

                                <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-border/50 text-xs">
                                    <div>
                                        <div className="text-muted-foreground text-[10px] uppercase font-semibold">Paid Balance</div>
                                        <div className="font-semibold text-foreground mt-0.5">{wallet.paid_balance_formatted}</div>
                                    </div>
                                    <div>
                                        <div className="text-emerald-600 dark:text-emerald-400 text-[10px] uppercase font-semibold flex items-center gap-1">
                                            <Gift className="size-2.5" /> Bonus Balance
                                        </div>
                                        <div className="font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">{wallet.promotional_balance_formatted}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="text-[11px] text-muted-foreground space-y-1 bg-muted/30 p-2.5 rounded-lg border border-border/40">
                                <div className="font-semibold text-foreground">Meta Official Messaging Rates:</div>
                                <div className="flex justify-between"><span>Marketing:</span> <span className="font-medium text-foreground">₹{(rates.marketing / 100).toFixed(2)} / msg</span></div>
                                <div className="flex justify-between"><span>Utility:</span> <span className="font-medium text-foreground">₹{(rates.utility / 100).toFixed(2)} / msg</span></div>
                                <div className="flex justify-between"><span>Authentication:</span> <span className="font-medium text-foreground">₹{(rates.authentication / 100).toFixed(2)} / msg</span></div>
                            </div>

                            <Button
                                onClick={() => setShowRechargeModal(true)}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9"
                            >
                                <WalletIcon className="size-3.5 mr-1.5" />
                                Purchase Messages (Min 500)
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Wallet Transactions Ledger (2 cols) */}
                    <Card className="border-border bg-card lg:col-span-2">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-semibold flex items-center justify-between">
                                <span>Wallet Transaction History</span>
                                <Badge variant="secondary" className="text-[10px]">
                                    {wallet.transactions.length} records
                                </Badge>
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Transparent ledger of recharges, welcome bonus, and campaign deductions
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {wallet.transactions.length > 0 ? (
                                <div className="max-h-[280px] overflow-y-auto divide-y divide-border/60">
                                    {wallet.transactions.map((tx) => (
                                        <div key={tx.id} className="py-2.5 flex items-center justify-between text-xs">
                                            <div className="flex items-center gap-2.5">
                                                <div
                                                    className={`size-7 rounded-full flex items-center justify-center shrink-0 ${
                                                        tx.amount_formatted.startsWith('+')
                                                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                                            : 'bg-muted text-muted-foreground'
                                                    }`}
                                                >
                                                    {tx.amount_formatted.startsWith('+') ? (
                                                        <ArrowDownLeft className="size-3.5" />
                                                    ) : (
                                                        <ArrowUpRight className="size-3.5" />
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-foreground">{tx.description || tx.type}</div>
                                                    <div className="text-[10px] text-muted-foreground flex items-center gap-2 mt-0.5">
                                                        <span>{tx.date}</span>
                                                        <span className="capitalize px-1.5 py-0.2 rounded-sm bg-muted text-foreground/80 text-[9px]">
                                                            {tx.balance_type}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div
                                                className={`font-semibold text-xs text-right ${
                                                    tx.amount_formatted.startsWith('+')
                                                        ? 'text-emerald-600 dark:text-emerald-400'
                                                        : 'text-foreground'
                                                }`}
                                            >
                                                {tx.amount_formatted}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-xs text-muted-foreground">
                                    No wallet transactions recorded yet.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Section 3: Referral Program Card */}
                <Card className="border-border bg-gradient-to-br from-card via-card to-amber-950/5">
                    <CardHeader className="pb-3">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                                <div className="size-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                                    <Gift className="size-4" />
                                </div>
                                <div>
                                    <CardTitle className="text-base font-semibold text-foreground">
                                        Referral Program — Earn ₹500 per Customer
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                        Invite other businesses. When they subscribe, you both receive ₹500 in messaging wallet credits.
                                    </CardDescription>
                                </div>
                            </div>

                            <div className="text-right">
                                <div className="text-xl font-bold text-amber-600 dark:text-amber-400">
                                    {referral.total_earned_formatted}
                                </div>
                                <div className="text-[11px] text-muted-foreground">Total Bonus Earned</div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="p-3 rounded-lg border border-border bg-card">
                                <div className="text-[11px] text-muted-foreground">Total Referred</div>
                                <div className="text-xl font-bold text-foreground mt-0.5">{referral.total_referrals}</div>
                            </div>
                            <div className="p-3 rounded-lg border border-border bg-card">
                                <div className="text-[11px] text-muted-foreground">Conversions</div>
                                <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{referral.successful_conversions}</div>
                            </div>
                            <div className="p-3 rounded-lg border border-border bg-card">
                                <div className="text-[11px] text-muted-foreground">Your Referral Code</div>
                                <div className="text-base font-mono font-bold text-foreground mt-1">{referral.referral_code}</div>
                            </div>
                        </div>

                        {/* Copy Link Input */}
                        <div className="flex items-center gap-2 pt-1">
                            <Input
                                readOnly
                                value={referral.referral_link}
                                className="text-xs font-mono bg-muted/40 h-9"
                            />
                            <Button
                                onClick={copyReferral}
                                variant="outline"
                                className="h-9 px-3 gap-1.5 text-xs shrink-0 cursor-pointer"
                            >
                                {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
                                {copied ? 'Copied' : 'Copy Link'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Section 4: Billing Details & Invoices */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="border-border bg-card">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-semibold">Billing Profile</CardTitle>
                            <CardDescription className="text-xs">GST and organization invoice profile</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={saveProfile} className="space-y-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium">Billing Email</label>
                                    <Input
                                        type="email"
                                        required
                                        value={details.billing_email ?? ''}
                                        onChange={(e) => setDetails({ ...details, billing_email: e.target.value })}
                                        className="h-8 text-xs"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium">GSTIN (Optional)</label>
                                    <Input
                                        value={details.gstin ?? ''}
                                        onChange={(e) => setDetails({ ...details, gstin: e.target.value.toUpperCase() })}
                                        placeholder="e.g. 24AAAAA0000A1Z5"
                                        className="h-8 text-xs font-mono uppercase"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium">Billing Address</label>
                                    <Input
                                        value={details.address ?? ''}
                                        onChange={(e) => setDetails({ ...details, address: e.target.value })}
                                        placeholder="Address line, City, State, PIN"
                                        className="h-8 text-xs"
                                    />
                                </div>
                                <Button disabled={busy} type="submit" className="w-full text-xs h-8">
                                    Save Billing Profile
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    <Card className="border-border bg-card">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-semibold">Invoices & Receipts</CardTitle>
                            <CardDescription className="text-xs">Download payment receipts</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {invoices.length ? (
                                <div className="max-h-[220px] overflow-y-auto divide-y divide-border/60">
                                    {invoices.map((inv) => (
                                        <div key={inv.id} className="py-2 flex items-center justify-between text-xs">
                                            <div>
                                                <div className="font-medium text-foreground">{inv.plan}</div>
                                                <div className="text-[10px] text-muted-foreground">{new Date(inv.created_at).toLocaleDateString()}</div>
                                            </div>
                                            <div className="text-right flex items-center gap-2">
                                                <div className="font-semibold">₹{(inv.amount_paise / 100).toLocaleString()}</div>
                                                {inv.status === 'paid' ? (
                                                    <a
                                                        href={`/settings/billing/invoices/${inv.id}`}
                                                        className="text-[11px] text-emerald-600 dark:text-emerald-400 underline"
                                                    >
                                                        PDF
                                                    </a>
                                                ) : (
                                                    <Badge variant="outline" className="text-[9px] uppercase">{inv.status}</Badge>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-xs text-muted-foreground">
                                    No invoices generated yet.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Recharge Wallet Modal */}
            {showRechargeModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-card border border-border w-full max-w-md rounded-xl p-5 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-border/60">
                            <div className="flex items-center gap-2">
                                <WalletIcon className="size-4 text-emerald-600 dark:text-emerald-400" />
                                <h3 className="text-sm font-bold text-foreground">Recharge Messaging Wallet</h3>
                            </div>
                            <button
                                onClick={() => setShowRechargeModal(false)}
                                className="text-muted-foreground hover:text-foreground text-xs"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-3">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-foreground">Select Message Category</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {(['MARKETING', 'UTILITY', 'AUTHENTICATION'] as const).map((cat) => (
                                        <button
                                            key={cat}
                                            type="button"
                                            onClick={() => setRechargeCategory(cat)}
                                            className={`py-2 px-2 text-center rounded-lg border text-xs font-medium transition-all ${
                                                rechargeCategory === cat
                                                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold'
                                                    : 'border-border bg-card hover:bg-muted text-muted-foreground'
                                            }`}
                                        >
                                            {cat === 'MARKETING' ? 'Marketing' : cat === 'UTILITY' ? 'Utility' : 'Auth'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-foreground flex justify-between">
                                    <span>Number of Messages</span>
                                    <span className="text-[10px] text-muted-foreground">Min 500 messages</span>
                                </label>
                                <Input
                                    type="number"
                                    min={500}
                                    step={100}
                                    value={rechargeCount}
                                    onChange={(e) => setRechargeCount(Math.max(500, parseInt(e.target.value) || 500))}
                                    className="h-9 text-xs"
                                />
                            </div>

                            {/* Cost Preview */}
                            <div className="p-3 bg-muted/40 rounded-lg border border-border/60 space-y-1 text-xs">
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Rate per message:</span>
                                    <span className="font-medium text-foreground">₹{activeRate.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Quantity:</span>
                                    <span className="font-medium text-foreground">{rechargeCount.toLocaleString()} msgs</span>
                                </div>
                                <div className="flex justify-between font-bold text-foreground pt-1 border-t border-border/50 text-sm">
                                    <span>Total Amount:</span>
                                    <span className="text-emerald-600 dark:text-emerald-400">₹{calculatedRechargeAmount}</span>
                                </div>
                            </div>

                            <Button
                                disabled={busy || rechargeCount < 500}
                                onClick={() =>
                                    triggerCheckout({
                                        plan: 'wallet_recharge',
                                        messages_count: rechargeCount,
                                        category: rechargeCategory,
                                    })
                                }
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9"
                            >
                                Pay ₹{calculatedRechargeAmount} via Razorpay
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </SettingsLayout>
    );
}
