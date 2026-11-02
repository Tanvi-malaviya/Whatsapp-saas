import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    CreditCard,
    CheckCircle2,
    Zap,
    Download,
    TrendingUp,
    Shield,
    Radio,
    Users,
    MessageSquare,
    Sparkles,
    Check,
    Clock,
    FileText,
    ArrowUpRight,
    HelpCircle,
    Building2,
    Calendar,
    ChevronRight,
    AlertCircle,
    CheckCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface PlanLimit {
    messages: number;
    channels: number;
    seats: number;
}

interface PlanDetails {
    name: string;
    price: string;
    period: string;
    popular?: boolean;
    description: string;
    features: string[];
    limits: PlanLimit;
}

interface UsageMetric {
    used: number;
    limit: number;
    percentage: number;
}

interface Invoice {
    id: string;
    date: string;
    amount: string;
    plan: string;
    status: string;
}

interface BillingProps {
    currentPlan: string;
    plans: Record<string, PlanDetails>;
    usage: {
        messages: UsageMetric;
        channels: UsageMetric;
        seats: UsageMetric;
    };
    invoices: Invoice[];
    organizationName: string;
}

export default function BillingPage({
    currentPlan = 'growth',
    plans = {},
    usage = {
        messages: { used: 1240, limit: 25000, percentage: 5 },
        channels: { used: 1, limit: 3, percentage: 33 },
        seats: { used: 2, limit: 10, percentage: 20 },
    },
    invoices = [],
    organizationName = 'Sathwara InfoTech',
}: BillingProps) {
    const [isChanging, setIsChanging] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3000);
    };

    const handleSelectPlan = (planKey: string) => {
        if (planKey === currentPlan) return;
        setIsChanging(true);
        router.post(
            '/settings/billing/change-plan',
            { plan: planKey },
            {
                preserveScroll: true,
                onSuccess: () => {
                    showToast(`Successfully switched to ${plans[planKey]?.name || planKey} plan!`);
                },
                onFinish: () => setIsChanging(false),
            }
        );
    };

    const handleDownloadInvoice = (inv: Invoice) => {
        const receiptContent = `
======================================================
           TAX INVOICE / PAYMENT RECEIPT
             SATHWARA INFOTECH (SAAS)
======================================================
Invoice No.     : ${inv.id}
Issue Date      : ${inv.date}
Customer Name   : ${organizationName}
Plan Subscribed : ${inv.plan}
Amount Paid     : ${inv.amount} (INR)
Payment Mode    : Auto-Debit (UPI / Card)
Status          : ${inv.status} (Verified)
GSTIN           : 24AAACS9876F1Z4
State           : Gujarat, India
======================================================
Includes:
- Meta Cloud API Shared Server Infrastructure
- WhatsApp Broadcast Delivery & Webhook Routing
- CRM Pipeline & Team Role Management
======================================================
Thank you for powering your customer engagement with us!
        `;
        const blob = new Blob([receiptContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${inv.id}_invoice.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const activePlanInfo = plans[currentPlan] || plans.growth;
    const remainingMessages = Math.max(0, usage.messages.limit - usage.messages.used);
    const remainingChannels = Math.max(0, usage.channels.limit - usage.channels.used);
    const remainingSeats = Math.max(0, usage.seats.limit - usage.seats.used);

    return (
        <>
            <Head title="Billing & Subscriptions | Sathwara InfoTech" />

            <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-[1500px] mx-auto w-full font-sans">
                {/* 1. Header Hero Card */}
                <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-card p-6 shadow-sm">
                    <div className="absolute -top-16 -right-16 size-48 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
                    
                    <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                        <div className="flex items-start sm:items-center gap-4">
                            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-lg shadow-emerald-600/30">
                                <CreditCard className="size-7" />
                            </div>
                            <div>
                                <div className="flex flex-wrap items-center gap-2.5">
                                    <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                                        Billing &amp; Subscriptions
                                    </h1>
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 px-3 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                                        <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
                                        Active Subscription
                                    </span>
                                </div>
                                <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl">
                                    Workspace: <strong className="text-foreground">{organizationName}</strong> • Manage your plan limits, inspect real-time usage meters, and access GST invoices.
                                </p>
                            </div>
                        </div>

                        {/* Current Plan Overview pill */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-card/80 backdrop-blur-md border border-border/80 rounded-xl p-3.5 shadow-2xs self-start lg:self-auto">
                            <div className="pr-3 sm:border-r border-border/70">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                    Current Tier
                                </p>
                                <p className="text-lg font-black text-foreground">
                                    {activePlanInfo?.name}
                                </p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                    Price / Cycle
                                </p>
                                <p className="text-base font-black text-emerald-600 dark:text-emerald-400">
                                    {activePlanInfo?.price}{activePlanInfo?.period}
                                </p>
                            </div>
                        </div>
                    </div>

                    {toastMessage && (
                        <div className="mt-4 p-2.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                            <CheckCircle className="size-4" />
                            {toastMessage}
                        </div>
                    )}
                </div>

                {/* 2. Real-Time Usage Meters (3 Cards) */}
                <div>
                    <div className="mb-3 flex items-center justify-between">
                        <div>
                            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                                Live Resource Quota &amp; Usage Gauges
                            </h2>
                            <p className="text-xs text-muted-foreground">
                                Track consumption across your monthly marketing quota, connected numbers, and agent seats.
                            </p>
                        </div>
                        <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                            <Clock className="size-3.5 text-primary" />
                            Resets 1st of next month
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Gauge 1: Monthly Messages */}
                        <div className="group relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.05] via-card to-card p-5 shadow-2xs hover:shadow-md transition-all">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                        <MessageSquare className="size-4" />
                                    </div>
                                    <span className="text-xs font-bold text-foreground">
                                        Monthly Messages
                                    </span>
                                </div>
                                <span className="rounded-full bg-primary/15 text-primary px-2 py-0.5 text-xs font-extrabold">
                                    {usage.messages.percentage}% Used
                                </span>
                            </div>

                            <div className="mt-4 flex items-baseline justify-between">
                                <span className="text-3xl font-black text-foreground">
                                    {usage.messages.used.toLocaleString()}
                                </span>
                                <span className="text-xs text-muted-foreground font-medium">
                                    of {usage.messages.limit.toLocaleString()} / mo
                                </span>
                            </div>

                            <div className="mt-3 h-2.5 w-full rounded-full bg-muted overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-500"
                                    style={{ width: `${Math.min(100, Math.max(3, usage.messages.percentage))}%` }}
                                />
                            </div>

                            <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground font-medium pt-2 border-t border-border/50">
                                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                                    {remainingMessages.toLocaleString()} remaining
                                </span>
                                <span>Broadcasts &amp; Auto-replies</span>
                            </div>
                        </div>

                        {/* Gauge 2: WhatsApp Channels */}
                        <div className="group relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.05] via-card to-card p-5 shadow-2xs hover:shadow-md transition-all">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                                        <Radio className="size-4" />
                                    </div>
                                    <span className="text-xs font-bold text-foreground">
                                        Connected Numbers
                                    </span>
                                </div>
                                <span className="rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 text-xs font-extrabold">
                                    {usage.channels.percentage}% Used
                                </span>
                            </div>

                            <div className="mt-4 flex items-baseline justify-between">
                                <span className="text-3xl font-black text-foreground">
                                    {usage.channels.used}
                                </span>
                                <span className="text-xs text-muted-foreground font-medium">
                                    of {usage.channels.limit} Channels
                                </span>
                            </div>

                            <div className="mt-3 h-2.5 w-full rounded-full bg-muted overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                                    style={{ width: `${Math.min(100, Math.max(3, usage.channels.percentage))}%` }}
                                />
                            </div>

                            <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground font-medium pt-2 border-t border-border/50">
                                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                                    {remainingChannels} slot{remainingChannels === 1 ? '' : 's'} available
                                </span>
                                <span>Multi-WABA Routing</span>
                            </div>
                        </div>

                        {/* Gauge 3: Team Seats */}
                        <div className="group relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/[0.05] via-card to-card p-5 shadow-2xs hover:shadow-md transition-all">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600">
                                        <Users className="size-4" />
                                    </div>
                                    <span className="text-xs font-bold text-foreground">
                                        Team Member Seats
                                    </span>
                                </div>
                                <span className="rounded-full bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 text-xs font-extrabold">
                                    {usage.seats.percentage}% Used
                                </span>
                            </div>

                            <div className="mt-4 flex items-baseline justify-between">
                                <span className="text-3xl font-black text-foreground">
                                    {usage.seats.used}
                                </span>
                                <span className="text-xs text-muted-foreground font-medium">
                                    of {usage.seats.limit} Agent Seats
                                </span>
                            </div>

                            <div className="mt-3 h-2.5 w-full rounded-full bg-muted overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                                    style={{ width: `${Math.min(100, Math.max(3, usage.seats.percentage))}%` }}
                                />
                            </div>

                            <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground font-medium pt-2 border-t border-border/50">
                                <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                                    {remainingSeats} seat{remainingSeats === 1 ? '' : 's'} remaining
                                </span>
                                <span>Multi-Agent Shared Inbox</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Pricing Tiers Comparison Grid (4 Cards) */}
                <div>
                    <div className="mb-4">
                        <div className="flex items-center gap-2">
                            <Sparkles className="size-5 text-amber-500" />
                            <h2 className="text-lg font-black tracking-tight text-foreground">
                                Available Subscription Tiers
                            </h2>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Switch tiers at any time. Upgrades take effect immediately with pro-rated billing.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {Object.entries(plans).map(([key, plan]) => {
                            const isCurrent = key === currentPlan;

                            return (
                                <div
                                    key={key}
                                    className={`relative flex flex-col justify-between rounded-2xl border p-5 bg-card transition-all duration-200 ${
                                        isCurrent
                                            ? 'border-emerald-500 ring-2 ring-emerald-500/30 shadow-lg bg-gradient-to-b from-emerald-500/[0.04] to-card'
                                            : plan.popular
                                            ? 'border-primary shadow-sm hover:shadow-md'
                                            : 'border-border hover:border-border/80 hover:shadow-xs'
                                    }`}
                                >
                                    {/* Top floating pill */}
                                    {isCurrent && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-600 px-3 py-0.5 text-[10px] font-extrabold text-white shadow-md uppercase tracking-wider flex items-center gap-1">
                                            <CheckCircle2 className="size-3" />
                                            Active Plan
                                        </div>
                                    )}
                                    {!isCurrent && plan.popular && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-[10px] font-extrabold text-primary-foreground shadow-sm uppercase tracking-wider">
                                            Most Popular
                                        </div>
                                    )}

                                    <div>
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-base font-extrabold text-foreground">{plan.name}</h3>
                                            <Badge variant="outline" className="text-[10px] font-semibold">
                                                {plan.limits.messages.toLocaleString()} msgs
                                            </Badge>
                                        </div>

                                        <p className="text-xs text-muted-foreground mt-1.5 min-h-[34px] leading-relaxed">
                                            {plan.description}
                                        </p>

                                        <div className="mt-4 flex items-baseline gap-1">
                                            <span className="text-3xl font-black text-foreground tracking-tight">
                                                {plan.price}
                                            </span>
                                            <span className="text-xs text-muted-foreground font-bold">
                                                {plan.period}
                                            </span>
                                        </div>

                                        <div className="my-4 border-t border-border/60" />

                                        {/* Features List */}
                                        <ul className="space-y-2.5 text-xs">
                                            {plan.features.map((feat, i) => (
                                                <li key={i} className="flex items-start gap-2 text-foreground/90">
                                                    <Check className="size-3.5 text-emerald-600 shrink-0 mt-0.5 stroke-[2.5]" />
                                                    <span className="leading-snug">{feat}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Action Button */}
                                    <div className="mt-6 pt-4 border-t border-border/50">
                                        <Button
                                            disabled={isCurrent || isChanging}
                                            onClick={() => handleSelectPlan(key)}
                                            className={`w-full text-xs font-bold h-9 shadow-2xs ${
                                                isCurrent
                                                    ? 'bg-emerald-600/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 cursor-default hover:bg-emerald-600/15'
                                                    : plan.popular
                                                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                                                    : 'bg-muted hover:bg-muted/80 text-foreground'
                                            }`}
                                        >
                                            {isCurrent ? 'Current Subscribed Tier' : `Switch to ${plan.name}`}
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 4. Payment Method & Billing Details (2 Columns) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Payment Method Card */}
                    <div className="rounded-2xl border border-border bg-card p-5 shadow-2xs">
                        <div className="flex items-center justify-between pb-3 border-b border-border/60">
                            <div className="flex items-center gap-2">
                                <CreditCard className="size-4 text-primary" />
                                <h3 className="text-sm font-bold text-foreground">
                                    Primary Payment Method
                                </h3>
                            </div>
                            <Badge variant="outline" className="text-[10px] font-bold text-emerald-600 border-emerald-500/30 bg-emerald-500/10">
                                Verified
                            </Badge>
                        </div>

                        <div className="mt-4 flex items-center justify-between p-3.5 rounded-xl border border-border bg-muted/20">
                            <div className="flex items-center gap-3">
                                <div className="flex size-10 items-center justify-center rounded-lg bg-card border border-border shadow-xs font-black text-xs text-primary">
                                    UPI
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-foreground">
                                        Auto-Debit via UPI / Razorpay
                                    </p>
                                    <p className="text-[11px] text-muted-foreground font-mono">
                                        bhavesh@oksbi (Next bill: ₹2,499.00 on Dec 01, 2026)
                                    </p>
                                </div>
                            </div>
                            <span className="text-[11px] font-bold text-emerald-600">
                                Active AutoPay
                            </span>
                        </div>

                        <p className="text-[11px] text-muted-foreground mt-3 flex items-center gap-1.5">
                            <Shield className="size-3 text-muted-foreground" />
                            Payments processed with 256-bit bank-grade encryption via Razorpay Meta Cloud Partner.
                        </p>
                    </div>

                    {/* Tax & Invoicing Profile */}
                    <div className="rounded-2xl border border-border bg-card p-5 shadow-2xs">
                        <div className="flex items-center justify-between pb-3 border-b border-border/60">
                            <div className="flex items-center gap-2">
                                <Building2 className="size-4 text-primary" />
                                <h3 className="text-sm font-bold text-foreground">
                                    Tax &amp; Invoice Details
                                </h3>
                            </div>
                            <span className="text-[11px] text-muted-foreground font-medium">
                                GST Compliant
                            </span>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                            <div className="p-3 rounded-lg border border-border bg-muted/10">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                    Business Name
                                </p>
                                <p className="font-bold text-foreground mt-0.5">{organizationName}</p>
                            </div>

                            <div className="p-3 rounded-lg border border-border bg-muted/10">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                    GSTIN Number
                                </p>
                                <p className="font-mono font-bold text-foreground mt-0.5">24AAACS9876F1Z4</p>
                            </div>

                            <div className="p-3 rounded-lg border border-border bg-muted/10">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                    Billing Email
                                </p>
                                <p className="font-mono text-foreground mt-0.5 truncate">billing@sathwarainfotech.com</p>
                            </div>

                            <div className="p-3 rounded-lg border border-border bg-muted/10">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                    State / Region
                                </p>
                                <p className="font-semibold text-foreground mt-0.5">Gujarat (24), India</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 5. Invoices & Billing History Table */}
                <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-2xs">
                    <div className="p-5 border-b border-border/60 bg-muted/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                                <FileText className="size-4 text-primary" />
                                Tax Invoices &amp; Receipts History
                            </h2>
                            <p className="text-xs text-muted-foreground">
                                Download official monthly invoices with full GST breakdowns for your accounting ledger.
                            </p>
                        </div>
                        <span className="text-xs text-muted-foreground font-medium">
                            {invoices.length} Invoices available
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                            <thead className="bg-muted/40 text-muted-foreground uppercase text-[10px] font-bold tracking-wider border-b border-border/60">
                                <tr>
                                    <th className="px-5 py-3">Invoice Number</th>
                                    <th className="px-4 py-3">Billing Date</th>
                                    <th className="px-4 py-3">Plan Description</th>
                                    <th className="px-4 py-3">Amount (₹)</th>
                                    <th className="px-4 py-3">Payment Status</th>
                                    <th className="px-5 py-3 text-right">Download</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {invoices.map((inv) => (
                                    <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-5 py-3.5 font-mono font-bold text-foreground">
                                            {inv.id}
                                        </td>
                                        <td className="px-4 py-3.5 text-muted-foreground">
                                            {inv.date}
                                        </td>
                                        <td className="px-4 py-3.5 font-semibold text-foreground">
                                            {inv.plan}
                                        </td>
                                        <td className="px-4 py-3.5 font-black text-foreground">
                                            {inv.amount}
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                                                <CheckCircle2 className="size-3" />
                                                {inv.status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-right">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDownloadInvoice(inv)}
                                                className="h-7 px-3 text-xs font-semibold gap-1.5 border-border shadow-2xs hover:bg-muted"
                                            >
                                                <Download className="size-3" />
                                                PDF Receipt
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 6. FAQ Section */}
                <div className="rounded-2xl border border-border bg-card p-5 shadow-2xs">
                    <div className="flex items-center gap-2 mb-3">
                        <HelpCircle className="size-4 text-primary" />
                        <h3 className="text-sm font-bold text-foreground">
                            Billing &amp; Meta Charges FAQ
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                        <div className="p-3.5 rounded-xl border border-border/80 bg-muted/10 space-y-1">
                            <p className="font-bold text-foreground">How do message limits work?</p>
                            <p className="text-muted-foreground leading-relaxed text-[11px]">
                                Your plan includes a fixed monthly allocation for broadcasts, automated bot flows, and manual replies sent from the shared dashboard.
                            </p>
                        </div>

                        <div className="p-3.5 rounded-xl border border-border/80 bg-muted/10 space-y-1">
                            <p className="font-bold text-foreground">Can I upgrade or downgrade anytime?</p>
                            <p className="text-muted-foreground leading-relaxed text-[11px]">
                                Yes! You can upgrade your tier instantly. Your new quota (messages, channels, seats) will become available immediately with pro-rata billing.
                            </p>
                        </div>

                        <div className="p-3.5 rounded-xl border border-border/80 bg-muted/10 space-y-1">
                            <p className="font-bold text-foreground">How are Meta conversation costs handled?</p>
                            <p className="text-muted-foreground leading-relaxed text-[11px]">
                                Customer-initiated service chats within 24 hours are free. Marketing template campaigns are billed according to Meta’s standard country rates.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
