import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    Building2,
    Smartphone,
    Users,
    MessageSquare,
    ArrowRight,
    ExternalLink,
    Activity,
    ShieldAlert,
    ShieldCheck,
    CheckCircle2,
    AlertTriangle,
    RefreshCw,
    IndianRupee,
    TrendingUp,
    Wallet,
    Send,
    CheckCheck,
    Eye,
    XCircle,
    Sparkles,
    Briefcase,
    Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type Props = {
    metrics: {
        totalClients: number;
        totalChannels: number;
        totalUsers: number;
        totalMessages: number;
        singleNumberClients: number;
        multiNumberClients: number;
    };
    financials?: {
        total_revenue_formatted: string;
        subscription_revenue_formatted: string;
        recharge_revenue_formatted: string;
        monthly_revenue_formatted: string;
        total_wallet_paid_formatted: string;
        total_wallet_promo_formatted: string;
        active_subscriptions: number;
        expired_subscriptions: number;
    };
    messagingAnalytics?: {
        total_outbound: number;
        total_inbound: number;
        total_delivered: number;
        total_read: number;
        total_failed: number;
        delivery_rate: number;
        read_rate: number;
        failure_rate: number;
    };
    channelHealth?: {
        green: number;
        yellow: number;
        red: number;
        connected: number;
        disconnected: number;
    };
    partnerMetrics?: {
        total_b2b_agents: number;
        managed_workspaces: number;
        referral_rewards_paid_formatted: string;
    };
    diagnostics?: {
        health_score: number;
        status: 'healthy' | 'warning' | 'critical';
        total_issues: number;
        issues: Array<{
            id: string;
            severity: 'high' | 'medium' | 'low';
            title: string;
            description: string;
            count: number;
            autofixable: boolean;
        }>;
        scanned_at: string;
    };
    recentOrganizations: Array<{
        id: string;
        name: string;
        slug: string;
        subscription_plan: string;
        max_channels: number;
        channels_count: number;
        status: string;
        created_at: string;
    }>;
    recentChannels: Array<{
        id: string;
        name: string;
        phone_number: string;
        phone_number_id: string;
        organization_name: string;
        quality_rating: string;
        status: string;
        is_default: boolean;
        created_at: string;
    }>;
};

export default function AdminDashboard({
    metrics = {
        totalClients: 0,
        totalChannels: 0,
        totalUsers: 0,
        totalMessages: 0,
        singleNumberClients: 0,
        multiNumberClients: 0,
    },
    financials = {
        total_revenue_formatted: '₹0.00',
        subscription_revenue_formatted: '₹0.00',
        recharge_revenue_formatted: '₹0.00',
        monthly_revenue_formatted: '₹0.00',
        total_wallet_paid_formatted: '₹0.00',
        total_wallet_promo_formatted: '₹0.00',
        active_subscriptions: 0,
        expired_subscriptions: 0,
    },
    messagingAnalytics = {
        total_outbound: 0,
        total_inbound: 0,
        total_delivered: 0,
        total_read: 0,
        total_failed: 0,
        delivery_rate: 100,
        read_rate: 0,
        failure_rate: 0,
    },
    channelHealth = {
        green: 0,
        yellow: 0,
        red: 0,
        connected: 0,
        disconnected: 0,
    },
    partnerMetrics = {
        total_b2b_agents: 0,
        managed_workspaces: 0,
        referral_rewards_paid_formatted: '₹0.00',
    },
    diagnostics = {
        health_score: 100,
        status: 'healthy',
        total_issues: 0,
        issues: [],
        scanned_at: 'Just now',
    },
    recentOrganizations = [],
    recentChannels = [],
}: Props) {
    const [isFixing, setIsFixing] = useState(false);

    const handleRunAutoFix = () => {
        setIsFixing(true);
        router.post(
            '/admin/diagnostics/autofix',
            {},
            {
                preserveScroll: true,
                onFinish: () => setIsFixing(false),
            }
        );
    };

    return (
        <>
            <Head title="Admin Dashboard - Super Admin" />

            <div className="space-y-4 w-full">
                {/* 1. Overview Quick-Stat Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
                    {/* Workspaces */}
                    <Link href="/admin/organizations" className="block group">
                        <Card className="border-border/70 shadow-2xs p-3 hover:border-primary/50 hover:bg-muted/15 transition-all">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
                                    Workspaces
                                </span>
                                <div className="size-6 rounded-md bg-primary/10 text-primary flex items-center justify-center group-hover:scale-105 transition-transform">
                                    <Building2 className="size-3.5" />
                                </div>
                            </div>
                            <div className="flex items-baseline justify-between mt-1">
                                <span className="text-xl font-bold text-foreground tracking-tight leading-none">
                                    {metrics.totalClients}
                                </span>
                                <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
                                    <span className="text-blue-600 font-semibold">{metrics.singleNumberClients} Single</span>
                                    <span className="text-muted-foreground/30">•</span>
                                    <span className="text-amber-600 font-semibold">{metrics.multiNumberClients} Multi</span>
                                </div>
                            </div>
                        </Card>
                    </Link>

                    {/* WhatsApp Numbers */}
                    <Link href="/admin/channels" className="block group">
                        <Card className="border-border/70 shadow-2xs p-3 hover:border-emerald-500/50 hover:bg-muted/15 transition-all">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
                                    WhatsApp Numbers
                                </span>
                                <div className="size-6 rounded-md bg-emerald-500/10 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                                    <Smartphone className="size-3.5" />
                                </div>
                            </div>
                            <div className="flex items-baseline justify-between mt-1">
                                <span className="text-xl font-bold text-emerald-600 tracking-tight leading-none">
                                    {metrics.totalChannels}
                                </span>
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                    {channelHealth.connected} Connected
                                </span>
                            </div>
                        </Card>
                    </Link>

                    {/* Registered Users */}
                    <Link href="/admin/users" className="block group">
                        <Card className="border-border/70 shadow-2xs p-3 hover:border-indigo-500/50 hover:bg-muted/15 transition-all">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
                                    Registered Users
                                </span>
                                <div className="size-6 rounded-md bg-indigo-500/10 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                                    <Users className="size-3.5" />
                                </div>
                            </div>
                            <div className="flex items-baseline justify-between mt-1">
                                <span className="text-xl font-bold text-foreground tracking-tight leading-none">
                                    {metrics.totalUsers}
                                </span>
                                <span className="text-[10px] text-muted-foreground font-medium">
                                    {partnerMetrics.total_b2b_agents} B2B Partners
                                </span>
                            </div>
                        </Card>
                    </Link>

                    {/* Total Messages Traffic */}
                    <div className="block">
                        <Card className="border-border/70 shadow-2xs p-3 hover:border-teal-500/50 hover:bg-muted/15 transition-all">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-muted-foreground">
                                    Total Messages
                                </span>
                                <div className="size-6 rounded-md bg-teal-500/10 text-teal-600 flex items-center justify-center">
                                    <MessageSquare className="size-3.5" />
                                </div>
                            </div>
                            <div className="flex items-baseline justify-between mt-1">
                                <span className="text-xl font-bold text-foreground tracking-tight leading-none">
                                    {metrics.totalMessages}
                                </span>
                                <span className="text-[10px] text-teal-600 font-semibold">
                                    {messagingAnalytics.delivery_rate}% Delivery
                                </span>
                            </div>
                        </Card>
                    </div>
                </div>

                {/* 2. Automated Bug Detection & System Health Card */}
                <Card className={`border shadow-2xs ${
                    diagnostics.status === 'healthy'
                        ? 'border-emerald-500/30 bg-emerald-500/5'
                        : diagnostics.status === 'warning'
                        ? 'border-amber-500/30 bg-amber-500/5'
                        : 'border-destructive/30 bg-destructive/5'
                }`}>
                    <CardHeader className="py-3 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/50">
                        <div className="flex items-center gap-2.5">
                            <div className={`size-8 rounded-lg flex items-center justify-center ${
                                diagnostics.status === 'healthy'
                                    ? 'bg-emerald-500/15 text-emerald-600'
                                    : diagnostics.status === 'warning'
                                    ? 'bg-amber-500/15 text-amber-600'
                                    : 'bg-destructive/15 text-destructive'
                            }`}>
                                <Activity className="size-4" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <CardTitle className="text-xs font-bold text-foreground">
                                        Automated Bug Detection & Health Diagnostics
                                    </CardTitle>
                                    <Badge
                                        variant="outline"
                                        className={`text-[10px] font-semibold ${
                                            diagnostics.status === 'healthy'
                                                ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30'
                                                : diagnostics.status === 'warning'
                                                ? 'bg-amber-500/15 text-amber-600 border-amber-500/30'
                                                : 'bg-destructive/15 text-destructive border-destructive/30'
                                        }`}
                                    >
                                        {diagnostics.health_score}% System Healthy
                                    </Badge>
                                </div>
                                <p className="text-[11px] text-muted-foreground mt-0.5">
                                    Auto-scanning database integrity, subscription expirations, orphaned records, and webhook delivery retries.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-auto">
                            <span className="text-[10px] text-muted-foreground font-mono">
                                Scanned: {diagnostics.scanned_at}
                            </span>
                            <Button
                                size="sm"
                                variant={diagnostics.total_issues > 0 ? 'default' : 'outline'}
                                onClick={handleRunAutoFix}
                                disabled={isFixing}
                                className={`h-7 px-2.5 text-xs font-semibold gap-1.5 cursor-pointer ${
                                    diagnostics.total_issues > 0
                                        ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                                        : 'hover:bg-muted'
                                }`}
                            >
                                <RefreshCw className={`size-3 ${isFixing ? 'animate-spin' : ''}`} />
                                <span>{isFixing ? 'Resolving...' : 'Run Auto Bug Fixes'}</span>
                            </Button>
                        </div>
                    </CardHeader>

                    <CardContent className="p-3.5">
                        {diagnostics.total_issues === 0 ? (
                            <div className="flex items-center justify-between text-xs py-1">
                                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
                                    <CheckCircle2 className="size-4 shrink-0" />
                                    <span>All system services operational. Zero database anomalies or stuck queues detected.</span>
                                </div>
                                <Badge variant="outline" className="text-[10px] font-normal text-muted-foreground">
                                    0 Issues
                                </Badge>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                                    {diagnostics.total_issues} Active Diagnostic Anomaly(s) Detected
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {diagnostics.issues.map((issue) => (
                                        <div
                                            key={issue.id}
                                            className="p-2.5 rounded-lg border border-border/70 bg-card/80 flex items-start justify-between gap-2"
                                        >
                                            <div className="flex items-start gap-2 min-w-0">
                                                <div className="mt-0.5 shrink-0">
                                                    {issue.severity === 'high' ? (
                                                        <ShieldAlert className="size-3.5 text-destructive" />
                                                    ) : issue.severity === 'medium' ? (
                                                        <AlertTriangle className="size-3.5 text-amber-500" />
                                                    ) : (
                                                        <Activity className="size-3.5 text-blue-500" />
                                                    )}
                                                </div>
                                                <div className="min-w-0 text-xs">
                                                    <div className="font-semibold text-foreground truncate">
                                                        {issue.title}
                                                    </div>
                                                    <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                                                        {issue.description}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-end gap-1 shrink-0">
                                                <Badge
                                                    variant="outline"
                                                    className={`text-[9px] font-bold uppercase ${
                                                        issue.severity === 'high'
                                                            ? 'bg-destructive/10 text-destructive border-destructive/20'
                                                            : issue.severity === 'medium'
                                                            ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                                            : 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                                                    }`}
                                                >
                                                    {issue.severity}
                                                </Badge>
                                                {issue.autofixable && (
                                                    <span className="text-[9px] text-primary font-medium flex items-center gap-0.5">
                                                        <Sparkles className="size-2.5" />
                                                        Auto-Fixable
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* 3. Financial & Revenue Analytics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5">
                    {/* Total Platform Revenue */}
                    <Card className="border-border/70 shadow-2xs p-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-muted-foreground">
                                Total Platform Revenue
                            </span>
                            <div className="size-6 rounded-md bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                                <IndianRupee className="size-3.5" />
                            </div>
                        </div>
                        <div className="mt-1">
                            <div className="text-xl font-black text-foreground tracking-tight">
                                {financials.total_revenue_formatted}
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                                <span>Sub: {financials.subscription_revenue_formatted}</span>
                                <span>•</span>
                                <span>Recharge: {financials.recharge_revenue_formatted}</span>
                            </div>
                        </div>
                    </Card>

                    {/* Monthly Inflow */}
                    <Card className="border-border/70 shadow-2xs p-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-muted-foreground">
                                Current Month Revenue
                            </span>
                            <div className="size-6 rounded-md bg-blue-500/10 text-blue-600 flex items-center justify-center">
                                <TrendingUp className="size-3.5" />
                            </div>
                        </div>
                        <div className="mt-1">
                            <div className="text-xl font-black text-blue-600 tracking-tight">
                                {financials.monthly_revenue_formatted}
                            </div>
                            <div className="text-[10px] text-muted-foreground mt-1">
                                Subscriptions & top-ups this calendar month
                            </div>
                        </div>
                    </Card>

                    {/* Annual Subscriptions Breakdown */}
                    <Card className="border-border/70 shadow-2xs p-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-muted-foreground">
                                ₹9,999 Subscriptions
                            </span>
                            <div className="size-6 rounded-md bg-purple-500/10 text-purple-600 flex items-center justify-center">
                                <Zap className="size-3.5" />
                            </div>
                        </div>
                        <div className="mt-1">
                            <div className="flex items-baseline gap-2">
                                <span className="text-xl font-black text-purple-600 tracking-tight">
                                    {financials.active_subscriptions}
                                </span>
                                <span className="text-xs text-muted-foreground font-medium">Active</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                                <span className="text-emerald-600 font-semibold">{financials.active_subscriptions} Active</span>
                                <span>•</span>
                                <span className="text-muted-foreground">{financials.expired_subscriptions} Expired</span>
                            </div>
                        </div>
                    </Card>

                    {/* Wallet Liquidity */}
                    <Card className="border-border/70 shadow-2xs p-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-muted-foreground">
                                Wallet Deposits
                            </span>
                            <div className="size-6 rounded-md bg-amber-500/10 text-amber-600 flex items-center justify-center">
                                <Wallet className="size-3.5" />
                            </div>
                        </div>
                        <div className="mt-1">
                            <div className="text-xl font-black text-foreground tracking-tight">
                                {financials.total_wallet_paid_formatted}
                            </div>
                            <div className="text-[10px] text-muted-foreground mt-1">
                                Promo in circulation: {financials.total_wallet_promo_formatted}
                            </div>
                        </div>
                    </Card>
                </div>

                {/* 4. Messaging Performance & B2B Partner Stats Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
                    {/* Global WhatsApp Messaging Performance */}
                    <Card className="border-border/70 shadow-2xs">
                        <CardHeader className="py-2.5 px-3.5 border-b border-border/60">
                            <CardTitle className="text-xs font-bold flex items-center gap-1.5 text-foreground">
                                <Send className="size-3.5 text-primary" />
                                <span>Global Messaging Traffic & Delivery Analytics</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-3.5">
                            <div className="grid grid-cols-3 gap-2 text-center pb-3 border-b border-border/60">
                                <div className="p-2 rounded-lg bg-muted/40">
                                    <div className="text-lg font-bold text-foreground">
                                        {messagingAnalytics.total_outbound}
                                    </div>
                                    <div className="text-[10px] text-muted-foreground mt-0.5">Total Outbound</div>
                                </div>
                                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
                                    <div className="text-lg font-bold">
                                        {messagingAnalytics.delivery_rate}%
                                    </div>
                                    <div className="text-[10px] font-medium mt-0.5">Delivery Rate</div>
                                </div>
                                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600">
                                    <div className="text-lg font-bold">
                                        {messagingAnalytics.read_rate}%
                                    </div>
                                    <div className="text-[10px] font-medium mt-0.5">Read Rate</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-4 gap-2 pt-3 text-xs">
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <CheckCheck className="size-3.5 text-emerald-600 shrink-0" />
                                    <span>Delivered: <strong className="text-foreground">{messagingAnalytics.total_delivered}</strong></span>
                                </div>
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <Eye className="size-3.5 text-blue-600 shrink-0" />
                                    <span>Read: <strong className="text-foreground">{messagingAnalytics.total_read}</strong></span>
                                </div>
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <XCircle className="size-3.5 text-destructive shrink-0" />
                                    <span>Failed: <strong className="text-foreground">{messagingAnalytics.total_failed}</strong></span>
                                </div>
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <MessageSquare className="size-3.5 text-teal-600 shrink-0" />
                                    <span>Inbound: <strong className="text-foreground">{messagingAnalytics.total_inbound}</strong></span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* B2B Partner Network & WhatsApp Channel Quality */}
                    <Card className="border-border/70 shadow-2xs">
                        <CardHeader className="py-2.5 px-3.5 border-b border-border/60">
                            <CardTitle className="text-xs font-bold flex items-center justify-between text-foreground">
                                <div className="flex items-center gap-1.5">
                                    <Briefcase className="size-3.5 text-blue-600" />
                                    <span>B2B Reseller Network & Quality Health</span>
                                </div>
                                <Button variant="ghost" size="sm" asChild className="text-xs h-6 px-2 gap-1 text-primary hover:text-primary">
                                    <Link href="/admin/users">
                                        <span>Manage Partners</span>
                                        <ArrowRight className="size-3" />
                                    </Link>
                                </Button>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-3.5 space-y-3">
                            <div className="grid grid-cols-3 gap-2 text-center pb-2.5 border-b border-border/60">
                                <div className="p-2 rounded-lg bg-blue-500/10">
                                    <div className="text-lg font-bold text-blue-600">
                                        {partnerMetrics.total_b2b_agents}
                                    </div>
                                    <div className="text-[10px] text-muted-foreground mt-0.5">B2B Partners</div>
                                </div>
                                <div className="p-2 rounded-lg bg-indigo-500/10">
                                    <div className="text-lg font-bold text-indigo-600">
                                        {partnerMetrics.managed_workspaces}
                                    </div>
                                    <div className="text-[10px] text-muted-foreground mt-0.5">Managed Clients</div>
                                </div>
                                <div className="p-2 rounded-lg bg-emerald-500/10">
                                    <div className="text-lg font-bold text-emerald-600">
                                        {partnerMetrics.referral_rewards_paid_formatted}
                                    </div>
                                    <div className="text-[10px] text-muted-foreground mt-0.5">Commissions Paid</div>
                                </div>
                            </div>

                            {/* Meta Quality Breakdown */}
                            <div>
                                <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground mb-1.5">
                                    <span>Meta WhatsApp Channel Quality Rating</span>
                                    <span>{metrics.totalChannels} Total Numbers</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-semibold gap-1">
                                        <span className="size-1.5 rounded-full bg-emerald-500"></span>
                                        GREEN: {channelHealth.green}
                                    </Badge>
                                    <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/20 font-semibold gap-1">
                                        <span className="size-1.5 rounded-full bg-amber-500"></span>
                                        YELLOW: {channelHealth.yellow}
                                    </Badge>
                                    <Badge variant="outline" className="text-[10px] bg-destructive/10 text-destructive border-destructive/20 font-semibold gap-1">
                                        <span className="size-1.5 rounded-full bg-destructive"></span>
                                        RED: {channelHealth.red}
                                    </Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* 5. Two Column Layout: Recent Workspaces & Recent WhatsApp Numbers */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
                    {/* Recent Workspaces */}
                    <Card className="border-border/70 shadow-2xs">
                        <CardHeader className="flex flex-row items-center justify-between py-2.5 px-3.5 border-b border-border/60">
                            <CardTitle className="text-xs font-bold flex items-center gap-1.5">
                                <Building2 className="size-3.5 text-primary" />
                                <span>Recent Workspaces</span>
                            </CardTitle>
                            <Button variant="ghost" size="sm" asChild className="text-xs h-6 px-2 gap-1 text-primary hover:text-primary">
                                <Link href="/admin/organizations">
                                    <span>View All</span>
                                    <ArrowRight className="size-3" />
                                </Link>
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-border/60">
                                {recentOrganizations.length === 0 ? (
                                    <p className="p-6 text-xs text-muted-foreground text-center">No workspaces found.</p>
                                ) : (
                                    recentOrganizations.map((org) => (
                                        <div key={org.id} className="p-2.5 sm:p-3 flex items-center justify-between hover:bg-muted/30 transition-colors">
                                            <div className="flex items-center gap-2.5 min-w-0 pr-2">
                                                <div className="size-7 rounded-md bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                                                    {org.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-semibold text-xs text-foreground truncate flex items-center gap-1.5">
                                                        <span>{org.name}</span>
                                                        <span className="text-[10px] text-muted-foreground/60 font-mono">/{org.slug}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-muted-foreground">
                                                        <span>{org.channels_count} {org.channels_count === 1 ? 'Number' : 'Numbers'}</span>
                                                        <span className="text-muted-foreground/30">•</span>
                                                        <span className="capitalize">{org.subscription_plan}</span>
                                                        <span className="text-muted-foreground/30">•</span>
                                                        <span>{org.created_at}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1.5 shrink-0">
                                                {org.max_channels <= 0 ? (
                                                    <Badge variant="outline" className="text-[10px] bg-purple-500/10 text-purple-600 border-purple-500/20 font-semibold">
                                                        Unlimited
                                                    </Badge>
                                                ) : org.max_channels === 1 ? (
                                                    <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-600 border-blue-500/20 font-semibold">
                                                        Single (1)
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-semibold">
                                                        Multi ({org.max_channels})
                                                    </Badge>
                                                )}

                                                <Button size="sm" variant="outline" asChild className="h-6 px-2 text-xs font-medium border-border/80 hover:bg-muted">
                                                    <a
                                                        href={`/admin/organizations/${org.id}/switch`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        title="Open workspace in new tab"
                                                        className="gap-1 inline-flex items-center text-muted-foreground hover:text-foreground"
                                                    >
                                                        <span>Open</span>
                                                        <ExternalLink className="size-2.5 text-primary" />
                                                    </a>
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recent Connected Numbers */}
                    <Card className="border-border/70 shadow-2xs">
                        <CardHeader className="flex flex-row items-center justify-between py-2.5 px-3.5 border-b border-border/60">
                            <CardTitle className="text-xs font-bold flex items-center gap-1.5">
                                <Smartphone className="size-3.5 text-emerald-600" />
                                <span>Recent WhatsApp Numbers</span>
                            </CardTitle>
                            <Button variant="ghost" size="sm" asChild className="text-xs h-6 px-2 gap-1 text-primary hover:text-primary">
                                <Link href="/admin/channels">
                                    <span>View All</span>
                                    <ArrowRight className="size-3" />
                                </Link>
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-border/60">
                                {recentChannels.length === 0 ? (
                                    <p className="p-6 text-xs text-muted-foreground text-center">No WhatsApp numbers connected yet.</p>
                                ) : (
                                    recentChannels.map((ch) => (
                                        <div key={ch.id} className="p-2.5 sm:p-3 flex items-center justify-between hover:bg-muted/30 transition-colors">
                                            <div className="flex items-center gap-2.5 min-w-0 pr-2">
                                                <div className="size-7 rounded-md bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                                                    <Smartphone className="size-3.5" />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-semibold text-xs text-foreground flex items-center gap-1.5 font-mono">
                                                        <span className="size-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                                                        <span className="truncate">{ch.phone_number || ch.name}</span>
                                                        {ch.is_default && (
                                                            <span className="text-[9px] bg-primary/10 text-primary px-1 rounded font-sans font-bold shrink-0">
                                                                DEFAULT
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                                                        {ch.organization_name}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <Badge
                                                    variant="outline"
                                                    className={`text-[10px] font-semibold ${
                                                        ch.status === 'connected'
                                                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                                            : 'bg-muted text-muted-foreground border-border'
                                                    }`}
                                                >
                                                    {ch.quality_rating}
                                                </Badge>

                                                <Button size="sm" variant="ghost" asChild className="h-6 px-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">
                                                    <Link href="/admin/channels" className="gap-1 inline-flex items-center">
                                                        <span>View</span>
                                                        <ArrowRight className="size-2.5" />
                                                    </Link>
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}
