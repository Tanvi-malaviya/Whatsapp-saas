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
    Sliders,
    Save,
    Check,
    CreditCard,
    BarChart3,
    ArrowUpRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
    pricingSettings?: {
        subscription_annual_price_paise: number;
        subscription_validity_days: number;
        welcome_bonus_paise: number;
        referral_reward_paise: number;
        campaign_max_contacts: number;
        min_message_purchase_count: number;
        meta_rate_marketing_paise: number;
        meta_rate_utility_paise: number;
        meta_rate_authentication_paise: number;
    };
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
    pricingSettings = {
        subscription_annual_price_paise: 999900,
        subscription_validity_days: 365,
        welcome_bonus_paise: 50000,
        referral_reward_paise: 50000,
        campaign_max_contacts: 2000,
        min_message_purchase_count: 200,
        meta_rate_marketing_paise: 88,
        meta_rate_utility_paise: 14,
        meta_rate_authentication_paise: 14,
    },
}: Props) {
    const [activeTab, setActiveTab] = useState<'overview' | 'diagnostics' | 'pricing' | 'workspaces' | 'channels'>('overview');
    const [isFixing, setIsFixing] = useState(false);
    const [fixSuccessMessage, setFixSuccessMessage] = useState<string | null>(null);

    // Pricing form state
    const [annualPrice, setAnnualPrice] = useState((pricingSettings.subscription_annual_price_paise / 100).toString());
    const [validityDays, setValidityDays] = useState(pricingSettings.subscription_validity_days.toString());
    const [welcomeBonus, setWelcomeBonus] = useState((pricingSettings.welcome_bonus_paise / 100).toString());
    const [referralReward, setReferralReward] = useState((pricingSettings.referral_reward_paise / 100).toString());
    const [minPurchase, setMinPurchase] = useState(pricingSettings.min_message_purchase_count.toString());
    const [rateMarketing, setRateMarketing] = useState((pricingSettings.meta_rate_marketing_paise / 100).toString());
    const [rateUtility, setRateUtility] = useState((pricingSettings.meta_rate_utility_paise / 100).toString());
    const [rateAuth, setRateAuth] = useState((pricingSettings.meta_rate_authentication_paise / 100).toString());
    const [isSavingPricing, setIsSavingPricing] = useState(false);
    const [pricingSavedToast, setPricingSavedToast] = useState(false);

    const handleRunAutoFix = () => {
        setIsFixing(true);
        setFixSuccessMessage(null);
        router.post(
            '/admin/diagnostics/autofix',
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    setFixSuccessMessage('All automatic repair routines completed successfully.');
                    setTimeout(() => setFixSuccessMessage(null), 5000);
                },
                onFinish: () => setIsFixing(false),
            }
        );
    };

    const handleSavePricing = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingPricing(true);
        router.post(
            '/admin/settings',
            {
                subscription_annual_price_paise: Math.round(parseFloat(annualPrice || '0') * 100),
                subscription_validity_days: parseInt(validityDays, 10) || 365,
                welcome_bonus_paise: Math.round(parseFloat(welcomeBonus || '0') * 100),
                referral_reward_paise: Math.round(parseFloat(referralReward || '0') * 100),
                min_message_purchase_count: parseInt(minPurchase, 10) || 200,
                meta_rate_marketing_paise: Math.round(parseFloat(rateMarketing || '0') * 100),
                meta_rate_utility_paise: Math.round(parseFloat(rateUtility || '0') * 100),
                meta_rate_authentication_paise: Math.round(parseFloat(rateAuth || '0') * 100),
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsSavingPricing(false);
                    setPricingSavedToast(true);
                    setTimeout(() => setPricingSavedToast(false), 4000);
                },
                onError: () => {
                    setIsSavingPricing(false);
                },
            }
        );
    };

    const tabs = [
        { id: 'overview', label: 'Overview & Metrics', icon: TrendingUp },
        {
            id: 'diagnostics',
            label: 'Health & Bug Fixes',
            icon: Activity,
            badge: diagnostics.total_issues > 0 ? `${diagnostics.total_issues} Anomaly` : null,
            badgeColor: diagnostics.status === 'healthy' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-destructive/10 text-destructive',
        },
        { id: 'pricing', label: 'Subscription & Plans', icon: IndianRupee },
        { id: 'workspaces', label: 'Workspaces & Quotas', icon: Building2, count: metrics.totalClients },
        { id: 'channels', label: 'WhatsApp Channels', icon: Smartphone, count: metrics.totalChannels },
    ];

    return (
        <>
            <Head title="Super Admin Dashboard • Sathwara WhatsApp Suite" />

            <div className="space-y-4 w-full max-w-7xl mx-auto pb-10">
                {/* Header Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card border border-border/70 rounded-2xl p-4 sm:p-5 shadow-2xs">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                                Super Admin Control Portal
                            </h1>
                            <Badge variant="outline" className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25 text-[10px] font-bold uppercase tracking-wider">
                                Enterprise Root
                            </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Real-time platform telemetry, database integrity diagnostics, automated repairs, and billing rate controls.
                        </p>
                    </div>
                </div>

                {fixSuccessMessage && (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
                        <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                        <span>{fixSuccessMessage}</span>
                    </div>
                )}

                {/* Navigation Tabs Bar */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-border/60 scrollbar-none">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                                    isActive
                                        ? 'bg-primary text-primary-foreground shadow-xs'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                                }`}
                            >
                                <Icon className="size-3.5" />
                                <span>{tab.label}</span>
                                {tab.badge && (
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${tab.badgeColor}`}>
                                        {tab.badge}
                                    </span>
                                )}
                                {typeof tab.count === 'number' && (
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                                        isActive ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'
                                    }`}>
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* TAB 1: OVERVIEW & ANALYTICS */}
                {activeTab === 'overview' && (
                    <div className="space-y-4 animate-in fade-in duration-150">
                        {/* Quick Command Direct Access Strip */}
                        {/* Quick Command Direct Access Strip */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                            <Link
                                href="/admin/subscriptions"
                                className="group p-2.5 rounded-xl border border-border/80 bg-gradient-to-br from-emerald-500/5 to-transparent hover:border-emerald-500/40 hover:bg-emerald-500/10 transition-all flex items-center justify-between shadow-2xs"
                            >
                                <div className="flex items-center gap-2.5">
                                    <div className="size-7.5 rounded-lg bg-emerald-500/15 text-emerald-600 flex items-center justify-center font-bold shrink-0">
                                        <CreditCard className="size-3.5" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-xs font-bold text-foreground group-hover:text-emerald-600 flex items-center gap-1 leading-tight">
                                            <span>Subscriptions & Clients</span>
                                            <ArrowUpRight className="size-3" />
                                        </div>
                                        <div className="text-[10px] text-muted-foreground truncate leading-tight mt-0.5">
                                            {financials.active_subscriptions} Active • {financials.total_revenue_formatted}
                                        </div>
                                    </div>
                                </div>
                                <Badge variant="outline" className="text-[9px] px-1.5 py-0.5 bg-emerald-500/10 text-emerald-600 border-emerald-500/25 shrink-0">
                                    Plans
                                </Badge>
                            </Link>

                            <Link
                                href="/admin/wallets"
                                className="group p-2.5 rounded-xl border border-border/80 bg-gradient-to-br from-amber-500/5 to-transparent hover:border-amber-500/40 hover:bg-amber-500/10 transition-all flex items-center justify-between shadow-2xs"
                            >
                                <div className="flex items-center gap-2.5">
                                    <div className="size-7.5 rounded-lg bg-amber-500/15 text-amber-600 flex items-center justify-center font-bold shrink-0">
                                        <Wallet className="size-3.5" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-xs font-bold text-foreground group-hover:text-amber-600 flex items-center gap-1 leading-tight">
                                            <span>Wallets & Manual Credits</span>
                                            <ArrowUpRight className="size-3" />
                                        </div>
                                        <div className="text-[10px] text-muted-foreground truncate leading-tight mt-0.5">
                                            Manual Deposit • {financials.total_wallet_paid_formatted} Paid
                                        </div>
                                    </div>
                                </div>
                                <Badge variant="outline" className="text-[9px] px-1.5 py-0.5 bg-amber-500/10 text-amber-600 border-amber-500/25 shrink-0">
                                    Ledger
                                </Badge>
                            </Link>

                            <Link
                                href="/admin/analytics"
                                className="group p-2.5 rounded-xl border border-border/80 bg-gradient-to-br from-sky-500/5 to-transparent hover:border-sky-500/40 hover:bg-sky-500/10 transition-all flex items-center justify-between shadow-2xs"
                            >
                                <div className="flex items-center gap-2.5">
                                    <div className="size-7.5 rounded-lg bg-sky-500/15 text-sky-600 flex items-center justify-center font-bold shrink-0">
                                        <BarChart3 className="size-3.5" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-xs font-bold text-foreground group-hover:text-sky-600 flex items-center gap-1 leading-tight">
                                            <span>Daily Usage & Telemetry</span>
                                            <ArrowUpRight className="size-3" />
                                        </div>
                                        <div className="text-[10px] text-muted-foreground truncate leading-tight mt-0.5">
                                            {messagingAnalytics.delivery_rate}% Delivery • Day-by-Day
                                        </div>
                                    </div>
                                </div>
                                <Badge variant="outline" className="text-[9px] px-1.5 py-0.5 bg-sky-500/10 text-sky-600 border-sky-500/25 shrink-0">
                                    Telemetry
                                </Badge>
                            </Link>
                        </div>

                        {/* Sleek, Compact Core Platform Metrics */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
                            <div className="flex items-center justify-between rounded-xl border border-border/70 bg-card px-3.5 py-2.5 shadow-2xs">
                                <div className="flex items-center gap-2">
                                    <div className="size-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                                        <Building2 className="size-3.5" />
                                    </div>
                                    <span className="text-xs font-medium text-muted-foreground">Workspaces</span>
                                </div>
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-base font-bold tabular-nums text-foreground">{metrics.totalClients}</span>
                                    <span className="text-[10px] text-muted-foreground hidden sm:inline">
                                        ({metrics.singleNumberClients} single • {metrics.multiNumberClients} multi)
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3.5 py-2.5 shadow-2xs">
                                <div className="flex items-center gap-2">
                                    <div className="size-7 rounded-lg bg-emerald-500/15 text-emerald-600 flex items-center justify-center">
                                        <Smartphone className="size-3.5" />
                                    </div>
                                    <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">WhatsApp Channels</span>
                                </div>
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-base font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{metrics.totalChannels}</span>
                                    <span className="text-[10px] text-emerald-600/80 font-medium hidden sm:inline">
                                        ({channelHealth.connected} live)
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between rounded-xl border border-indigo-500/20 bg-indigo-500/5 px-3.5 py-2.5 shadow-2xs">
                                <div className="flex items-center gap-2">
                                    <div className="size-7 rounded-lg bg-indigo-500/15 text-indigo-600 flex items-center justify-center">
                                        <Users className="size-3.5" />
                                    </div>
                                    <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-400">Registered Users</span>
                                </div>
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-base font-bold tabular-nums text-indigo-600 dark:text-indigo-400">{metrics.totalUsers}</span>
                                    <span className="text-[10px] text-indigo-600/80 font-medium hidden sm:inline">
                                        ({partnerMetrics.total_b2b_agents} partners)
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between rounded-xl border border-teal-500/20 bg-teal-500/5 px-3.5 py-2.5 shadow-2xs">
                                <div className="flex items-center gap-2">
                                    <div className="size-7 rounded-lg bg-teal-500/15 text-teal-600 flex items-center justify-center">
                                        <MessageSquare className="size-3.5" />
                                    </div>
                                    <span className="text-xs font-semibold text-teal-700 dark:text-teal-400">Messages Traffic</span>
                                </div>
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-base font-bold tabular-nums text-teal-600 dark:text-teal-400">{metrics.totalMessages}</span>
                                    <span className="text-[10px] text-teal-600/80 font-medium hidden sm:inline">
                                        ({messagingAnalytics.delivery_rate}%)
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Sleek, Compact Financial & Revenue Strip */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
                            <div className="flex items-center justify-between rounded-xl border border-border/70 bg-card px-3.5 py-2.5 shadow-2xs">
                                <div className="flex items-center gap-2">
                                    <div className="size-7 rounded-lg bg-emerald-500/15 text-emerald-600 flex items-center justify-center">
                                        <IndianRupee className="size-3.5" />
                                    </div>
                                    <span className="text-xs font-medium text-muted-foreground">Total Revenue</span>
                                </div>
                                <span className="text-base font-bold tabular-nums text-foreground">{financials.total_revenue_formatted}</span>
                            </div>

                            <div className="flex items-center justify-between rounded-xl border border-blue-500/20 bg-blue-500/5 px-3.5 py-2.5 shadow-2xs">
                                <div className="flex items-center gap-2">
                                    <div className="size-7 rounded-lg bg-blue-500/15 text-blue-600 flex items-center justify-center">
                                        <TrendingUp className="size-3.5" />
                                    </div>
                                    <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">This Month</span>
                                </div>
                                <span className="text-base font-bold tabular-nums text-blue-600 dark:text-blue-400">{financials.monthly_revenue_formatted}</span>
                            </div>

                            <div className="flex items-center justify-between rounded-xl border border-purple-500/20 bg-purple-500/5 px-3.5 py-2.5 shadow-2xs">
                                <div className="flex items-center gap-2">
                                    <div className="size-7 rounded-lg bg-purple-500/15 text-purple-600 flex items-center justify-center">
                                        <Zap className="size-3.5" />
                                    </div>
                                    <span className="text-xs font-semibold text-purple-700 dark:text-purple-400">Active Plans</span>
                                </div>
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-base font-bold tabular-nums text-purple-600 dark:text-purple-400">{financials.active_subscriptions}</span>
                                    {financials.expired_subscriptions > 0 && (
                                        <span className="text-[10px] text-muted-foreground">({financials.expired_subscriptions} exp)</span>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center justify-between rounded-xl border border-amber-500/20 bg-amber-500/5 px-3.5 py-2.5 shadow-2xs">
                                <div className="flex items-center gap-2">
                                    <div className="size-7 rounded-lg bg-amber-500/15 text-amber-600 flex items-center justify-center">
                                        <Wallet className="size-3.5" />
                                    </div>
                                    <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">Wallet Balance</span>
                                </div>
                                <span className="text-base font-bold tabular-nums text-amber-600 dark:text-amber-400">{financials.total_wallet_paid_formatted}</span>
                            </div>
                        </div>

                        {/* Messaging & Quality Rating Cards */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
                            <Card className="border-border/70 shadow-2xs rounded-xl">
                                <CardHeader className="py-3 px-4 border-b border-border/60">
                                    <CardTitle className="text-xs font-bold flex items-center gap-2">
                                        <Send className="size-3.5 text-primary" />
                                        <span>Global Delivery & Traffic Performance</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 space-y-3">
                                    <div className="grid grid-cols-3 gap-2 text-center pb-3 border-b border-border/60">
                                        <div className="p-2 rounded-lg bg-muted/40">
                                            <div className="text-lg font-bold text-foreground">{messagingAnalytics.total_outbound}</div>
                                            <div className="text-[10px] text-muted-foreground mt-0.5">Total Outbound</div>
                                        </div>
                                        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
                                            <div className="text-lg font-bold">{messagingAnalytics.delivery_rate}%</div>
                                            <div className="text-[10px] font-medium mt-0.5">Delivery Rate</div>
                                        </div>
                                        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600">
                                            <div className="text-lg font-bold">{messagingAnalytics.read_rate}%</div>
                                            <div className="text-[10px] font-medium mt-0.5">Read Rate</div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
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

                            <Card className="border-border/70 shadow-2xs rounded-xl">
                                <CardHeader className="py-3 px-4 border-b border-border/60">
                                    <CardTitle className="text-xs font-bold flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Briefcase className="size-3.5 text-blue-600" />
                                            <span>B2B Reseller Network & Quality Health</span>
                                        </div>
                                        <Button variant="ghost" size="sm" asChild className="text-xs h-6 px-2 text-primary">
                                            <Link href="/admin/users">
                                                <span>Manage</span>
                                                <ArrowRight className="size-3 ml-1" />
                                            </Link>
                                        </Button>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 space-y-3">
                                    <div className="grid grid-cols-3 gap-2 text-center pb-2.5 border-b border-border/60">
                                        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600">
                                            <div className="text-lg font-bold">{partnerMetrics.total_b2b_agents}</div>
                                            <div className="text-[10px] text-muted-foreground mt-0.5">B2B Partners</div>
                                        </div>
                                        <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600">
                                            <div className="text-lg font-bold">{partnerMetrics.managed_workspaces}</div>
                                            <div className="text-[10px] text-muted-foreground mt-0.5">Managed Clients</div>
                                        </div>
                                        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
                                            <div className="text-lg font-bold">{partnerMetrics.referral_rewards_paid_formatted}</div>
                                            <div className="text-[10px] text-muted-foreground mt-0.5">Commissions Paid</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between text-xs pt-1">
                                        <span className="text-muted-foreground font-medium">Meta Quality Ratings:</span>
                                        <div className="flex items-center gap-1.5">
                                            <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold">
                                                GREEN: {channelHealth.green}
                                            </Badge>
                                            <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/20 font-bold">
                                                YELLOW: {channelHealth.yellow}
                                            </Badge>
                                            <Badge variant="outline" className="text-[10px] bg-rose-500/10 text-rose-600 border-rose-500/20 font-bold">
                                                RED: {channelHealth.red}
                                            </Badge>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}

                {/* TAB 2: HEALTH & AUTO BUG FIXES */}
                {activeTab === 'diagnostics' && (
                    <div className="space-y-4 animate-in fade-in duration-150">
                        {/* Health Scanner Banner */}
                        <Card className={`border-2 rounded-2xl shadow-sm ${
                            diagnostics.status === 'healthy'
                                ? 'border-emerald-500/40 bg-emerald-500/5'
                                : diagnostics.status === 'warning'
                                ? 'border-amber-500/40 bg-amber-500/5'
                                : 'border-rose-500/40 bg-rose-500/5'
                        }`}>
                            <CardHeader className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/50">
                                <div className="flex items-start sm:items-center gap-3">
                                    <div className={`size-12 rounded-2xl flex items-center justify-center shrink-0 ${
                                        diagnostics.status === 'healthy'
                                            ? 'bg-emerald-500/20 text-emerald-600'
                                            : diagnostics.status === 'warning'
                                            ? 'bg-amber-500/20 text-amber-600'
                                            : 'bg-rose-500/20 text-rose-600'
                                    }`}>
                                        <Activity className="size-6" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <CardTitle className="text-base sm:text-lg font-bold text-foreground">
                                                Automated Bug Detection & Diagnostics Engine
                                            </CardTitle>
                                            <Badge
                                                variant="outline"
                                                className={`text-xs font-bold px-2 py-0.5 ${
                                                    diagnostics.status === 'healthy'
                                                        ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30'
                                                        : diagnostics.status === 'warning'
                                                        ? 'bg-amber-500/15 text-amber-600 border-amber-500/30'
                                                        : 'bg-rose-500/15 text-rose-600 border-rose-500/30'
                                                }`}
                                            >
                                                {diagnostics.health_score}% Healthy
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            Continuous background monitoring of database schemas, orphaned records, stuck queues, and webhook retry health.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 self-start sm:self-auto">
                                    <span className="text-[11px] text-muted-foreground font-mono">
                                        Last Scanned: {diagnostics.scanned_at}
                                    </span>
                                    <Button
                                        size="sm"
                                        onClick={handleRunAutoFix}
                                        disabled={isFixing}
                                        className="h-9 px-4 text-xs font-bold gap-2 cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl shadow-xs"
                                    >
                                        <RefreshCw className={`size-3.5 ${isFixing ? 'animate-spin' : ''}`} />
                                        <span>{isFixing ? 'Executing Auto-Repair...' : 'Run Auto Bug Fixes'}</span>
                                    </Button>
                                </div>
                            </CardHeader>

                            <CardContent className="p-4 sm:p-5">
                                {diagnostics.total_issues === 0 ? (
                                    <div className="p-6 text-center space-y-2 bg-card rounded-xl border border-border/60">
                                        <div className="size-12 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center mx-auto">
                                            <CheckCircle2 className="size-6" />
                                        </div>
                                        <h3 className="text-sm font-bold text-foreground">System Is Fully Healthy</h3>
                                        <p className="text-xs text-muted-foreground max-w-md mx-auto">
                                            No stuck queues, orphaned channels, or database anomalies were found. All webhooks and subscriptions are aligned.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="text-xs font-bold text-foreground flex items-center justify-between">
                                            <span>Detected Anomaly List ({diagnostics.total_issues})</span>
                                            <span className="text-[11px] text-muted-foreground font-normal">
                                                Click 'Run Auto Bug Fixes' to automatically resolve fixable issues
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {diagnostics.issues.map((issue) => (
                                                <div
                                                    key={issue.id}
                                                    className="p-3.5 rounded-xl border border-border/80 bg-card flex items-start justify-between gap-3 shadow-2xs"
                                                >
                                                    <div className="flex items-start gap-2.5 min-w-0">
                                                        <div className="mt-0.5 shrink-0">
                                                            {issue.severity === 'high' ? (
                                                                <ShieldAlert className="size-4 text-destructive" />
                                                            ) : issue.severity === 'medium' ? (
                                                                <AlertTriangle className="size-4 text-amber-500" />
                                                            ) : (
                                                                <Activity className="size-4 text-blue-500" />
                                                            )}
                                                        </div>
                                                        <div className="min-w-0 text-xs">
                                                            <div className="font-bold text-foreground truncate">
                                                                {issue.title}
                                                            </div>
                                                            <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                                                                {issue.description}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col items-end gap-1.5 shrink-0">
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
                                                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                                                                <Sparkles className="size-3" />
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

                        {/* Health Guide Card */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <Card className="p-4 rounded-xl border-border/70">
                                <div className="font-bold text-xs flex items-center gap-2 text-foreground">
                                    <Sparkles className="size-3.5 text-primary" />
                                    <span>What Auto-Fix Repairs</span>
                                </div>
                                <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">
                                    Synchronizes expired subscriptions, purges orphaned channel foreign keys, re-queues stalled broadcast campaign recipients, and resets stuck webhook attempt counters.
                                </p>
                            </Card>

                            <Card className="p-4 rounded-xl border-border/70">
                                <div className="font-bold text-xs flex items-center gap-2 text-foreground">
                                    <Smartphone className="size-3.5 text-emerald-600" />
                                    <span>Meta Quality Guard</span>
                                </div>
                                <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">
                                    Monitors Meta WhatsApp Quality ratings (Green, Yellow, Red). Numbers with degraded quality are flagged before Meta imposes messaging rate limits.
                                </p>
                            </Card>

                            <Card className="p-4 rounded-xl border-border/70">
                                <div className="font-bold text-xs flex items-center gap-2 text-foreground">
                                    <CheckCircle2 className="size-3.5 text-blue-600" />
                                    <span>Safe Rollback</span>
                                </div>
                                <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">
                                    Every automated repair action writes an immutable audit record in the system audit log, ensuring full traceability for super administrators.
                                </p>
                            </Card>
                        </div>
                    </div>
                )}

                {/* TAB 3: SUBSCRIPTION & WALLET PRICING PLANS */}
                {activeTab === 'pricing' && (
                    <div className="space-y-3 animate-in fade-in duration-150">
                        <Card className="border-border/70 rounded-xl shadow-2xs">
                            <CardHeader className="py-2.5 px-4 sm:px-5 border-b border-border/60">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <div>
                                        <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
                                            <IndianRupee className="size-4 text-emerald-600" />
                                            <span>Subscription & Wallet Recharge Pricing Controls</span>
                                        </CardTitle>
                                        <CardDescription className="text-xs text-muted-foreground mt-0.5">
                                            Configure mandatory annual subscription fee, welcome wallet credit, minimum message purchase thresholds, and per-message Meta tariffs.
                                        </CardDescription>
                                    </div>

                                    {pricingSavedToast && (
                                        <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1.5 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                                            <Check className="size-3.5" />
                                            Changes Saved!
                                        </span>
                                    )}
                                </div>
                            </CardHeader>

                            <CardContent className="p-4 sm:p-5">
                                <form onSubmit={handleSavePricing} className="space-y-4">
                                    {/* Section 1: Annual SaaS License Parameters */}
                                    <div>
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-foreground mb-2.5">
                                            <Zap className="size-3.5 text-primary" />
                                            <span className="tracking-wide uppercase text-[11px] text-muted-foreground">Annual SaaS License Parameters</span>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <Label htmlFor="annual_price" className="text-xs font-semibold text-foreground">
                                                        Annual Subscription Fee
                                                    </Label>
                                                    <span className="text-[10px] text-muted-foreground">Default: ₹9,999/yr</span>
                                                </div>
                                                <div className="relative">
                                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">₹</span>
                                                    <Input
                                                        id="annual_price"
                                                        type="number"
                                                        value={annualPrice}
                                                        onChange={(e) => setAnnualPrice(e.target.value)}
                                                        className="h-8 pl-6 pr-2.5 text-xs font-semibold rounded-lg bg-background"
                                                        placeholder="9999"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <Label htmlFor="validity_days" className="text-xs font-semibold text-foreground">
                                                        License Validity Period
                                                    </Label>
                                                    <span className="text-[10px] text-muted-foreground">Default: 365 calendar days</span>
                                                </div>
                                                <div className="relative">
                                                    <Input
                                                        id="validity_days"
                                                        type="number"
                                                        value={validityDays}
                                                        onChange={(e) => setValidityDays(e.target.value)}
                                                        className="h-8 px-2.5 pr-12 text-xs font-semibold rounded-lg bg-background"
                                                        placeholder="365"
                                                    />
                                                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-medium text-muted-foreground">Days</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border-t border-border/60" />

                                    {/* Section 2: Promotional Wallet Credits & Bonuses */}
                                    <div>
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-foreground mb-2.5">
                                            <Wallet className="size-3.5 text-amber-500" />
                                            <span className="tracking-wide uppercase text-[11px] text-muted-foreground">Promotional Wallet Credits & Bonuses</span>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            <div className="space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <Label htmlFor="welcome_bonus" className="text-xs font-semibold text-foreground">
                                                        Welcome Bonus Credit
                                                    </Label>
                                                    <span className="text-[10px] text-muted-foreground">Default: ₹500</span>
                                                </div>
                                                <div className="relative">
                                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">₹</span>
                                                    <Input
                                                        id="welcome_bonus"
                                                        type="number"
                                                        value={welcomeBonus}
                                                        onChange={(e) => setWelcomeBonus(e.target.value)}
                                                        className="h-8 pl-6 pr-2.5 text-xs font-semibold rounded-lg bg-background"
                                                        placeholder="500"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <Label htmlFor="referral_reward" className="text-xs font-semibold text-foreground">
                                                        B2B Referral Commission
                                                    </Label>
                                                    <span className="text-[10px] text-muted-foreground">Default: ₹500</span>
                                                </div>
                                                <div className="relative">
                                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">₹</span>
                                                    <Input
                                                        id="referral_reward"
                                                        type="number"
                                                        value={referralReward}
                                                        onChange={(e) => setReferralReward(e.target.value)}
                                                        className="h-8 pl-6 pr-2.5 text-xs font-semibold rounded-lg bg-background"
                                                        placeholder="500"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <Label htmlFor="min_purchase" className="text-xs font-semibold text-foreground">
                                                        Min Recharge Quantity
                                                    </Label>
                                                    <span className="text-[10px] text-muted-foreground">Min: 200 msgs</span>
                                                </div>
                                                <div className="relative">
                                                    <Input
                                                        id="min_purchase"
                                                        type="number"
                                                        value={minPurchase}
                                                        onChange={(e) => setMinPurchase(e.target.value)}
                                                        className="h-8 px-2.5 pr-12 text-xs font-semibold rounded-lg bg-background"
                                                        placeholder="200"
                                                    />
                                                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-medium text-muted-foreground">Msgs</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border-t border-border/60" />

                                    {/* Section 3: WhatsApp Meta Message Tariffs */}
                                    <div>
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-foreground mb-2.5">
                                            <Send className="size-3.5 text-emerald-600" />
                                            <span className="tracking-wide uppercase text-[11px] text-muted-foreground">WhatsApp Meta Message Tariffs (Per Message)</span>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            <div className="space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <Label htmlFor="rate_marketing" className="text-xs font-semibold text-foreground">
                                                        Marketing Rate
                                                    </Label>
                                                    <span className="text-[10px] text-muted-foreground">Default: ₹0.88/msg</span>
                                                </div>
                                                <div className="relative">
                                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">₹</span>
                                                    <Input
                                                        id="rate_marketing"
                                                        type="number"
                                                        step="0.01"
                                                        value={rateMarketing}
                                                        onChange={(e) => setRateMarketing(e.target.value)}
                                                        className="h-8 pl-6 pr-2.5 text-xs font-semibold rounded-lg bg-background"
                                                        placeholder="0.88"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <Label htmlFor="rate_utility" className="text-xs font-semibold text-foreground">
                                                        Utility Rate
                                                    </Label>
                                                    <span className="text-[10px] text-muted-foreground">Default: ₹0.14/msg</span>
                                                </div>
                                                <div className="relative">
                                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">₹</span>
                                                    <Input
                                                        id="rate_utility"
                                                        type="number"
                                                        step="0.01"
                                                        value={rateUtility}
                                                        onChange={(e) => setRateUtility(e.target.value)}
                                                        className="h-8 pl-6 pr-2.5 text-xs font-semibold rounded-lg bg-background"
                                                        placeholder="0.14"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <Label htmlFor="rate_auth" className="text-xs font-semibold text-foreground">
                                                        Authentication / OTP Rate
                                                    </Label>
                                                    <span className="text-[10px] text-muted-foreground">Default: ₹0.14/msg</span>
                                                </div>
                                                <div className="relative">
                                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">₹</span>
                                                    <Input
                                                        id="rate_auth"
                                                        type="number"
                                                        step="0.01"
                                                        value={rateAuth}
                                                        onChange={(e) => setRateAuth(e.target.value)}
                                                        className="h-8 pl-6 pr-2.5 text-xs font-semibold rounded-lg bg-background"
                                                        placeholder="0.14"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Bar */}
                                    <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-border/60">
                                        <span className="text-[11px] text-muted-foreground italic">
                                            Changes take effect immediately across all client workspaces upon saving.
                                        </span>
                                        <Button
                                            type="submit"
                                            disabled={isSavingPricing}
                                            size="sm"
                                            className="h-8 px-4 text-xs font-bold gap-1.5 cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-2xs w-full sm:w-auto"
                                        >
                                            <Save className="size-3.5" />
                                            <span>{isSavingPricing ? 'Saving...' : 'Save Pricing Plans'}</span>
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* TAB 4: WORKSPACES & QUOTAS */}
                {activeTab === 'workspaces' && (
                    <div className="space-y-4 animate-in fade-in duration-150">
                        <Card className="border-border/70 rounded-2xl shadow-2xs">
                            <CardHeader className="py-3 px-4 sm:px-5 flex flex-row items-center justify-between border-b border-border/60">
                                <div>
                                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                                        <Building2 className="size-4 text-primary" />
                                        <span>Workspaces & WhatsApp Quotas</span>
                                    </CardTitle>
                                    <CardDescription className="text-xs text-muted-foreground">
                                        Directory of client workspaces, channel allocations, and subscription status.
                                    </CardDescription>
                                </div>
                                <Button variant="outline" size="sm" asChild className="text-xs h-8 px-3 rounded-xl gap-1">
                                    <Link href="/admin/organizations">
                                        <span>Manage All</span>
                                        <ArrowRight className="size-3" />
                                    </Link>
                                </Button>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-border/60">
                                    {recentOrganizations.length === 0 ? (
                                        <p className="p-8 text-xs text-muted-foreground text-center">No client workspaces found.</p>
                                    ) : (
                                        recentOrganizations.map((org) => (
                                            <div key={org.id} className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/30 transition-colors">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                                                        {org.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="font-bold text-xs text-foreground truncate flex items-center gap-1.5">
                                                            <span>{org.name}</span>
                                                            <span className="text-[10px] text-muted-foreground font-mono">/{org.slug}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                                                            <span>{org.channels_count} Number(s)</span>
                                                            <span>•</span>
                                                            <span className="capitalize font-medium">{org.subscription_plan}</span>
                                                            <span>•</span>
                                                            <span>Created {org.created_at}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 shrink-0">
                                                    {org.max_channels <= 0 ? (
                                                        <Badge variant="outline" className="text-[10px] bg-purple-500/10 text-purple-600 border-purple-500/20 font-bold">
                                                            Unlimited Numbers
                                                        </Badge>
                                                    ) : org.max_channels === 1 ? (
                                                        <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-600 border-blue-500/20 font-bold">
                                                            Single Number (1)
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold">
                                                            Multi Number ({org.max_channels})
                                                        </Badge>
                                                    )}

                                                    <Button size="sm" variant="outline" asChild className="h-7 px-2.5 text-xs font-semibold rounded-lg">
                                                        <a
                                                            href={`/admin/organizations/${org.id}/switch`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="gap-1 inline-flex items-center text-muted-foreground hover:text-foreground"
                                                        >
                                                            <span>Open</span>
                                                            <ExternalLink className="size-3 text-primary" />
                                                        </a>
                                                    </Button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* TAB 5: WHATSAPP CHANNELS */}
                {activeTab === 'channels' && (
                    <div className="space-y-4 animate-in fade-in duration-150">
                        <Card className="border-border/70 rounded-2xl shadow-2xs">
                            <CardHeader className="py-3 px-4 sm:px-5 flex flex-row items-center justify-between border-b border-border/60">
                                <div>
                                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                                        <Smartphone className="size-4 text-emerald-600" />
                                        <span>WhatsApp Channels Directory</span>
                                    </CardTitle>
                                    <CardDescription className="text-xs text-muted-foreground">
                                        All registered WhatsApp Business API numbers, connection status, and Meta quality ratings.
                                    </CardDescription>
                                </div>
                                <Button variant="outline" size="sm" asChild className="text-xs h-8 px-3 rounded-xl gap-1">
                                    <Link href="/admin/channels">
                                        <span>Full Directory</span>
                                        <ArrowRight className="size-3" />
                                    </Link>
                                </Button>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-border/60">
                                    {recentChannels.length === 0 ? (
                                        <p className="p-8 text-xs text-muted-foreground text-center">No WhatsApp numbers connected yet.</p>
                                    ) : (
                                        recentChannels.map((ch) => (
                                            <div key={ch.id} className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/30 transition-colors">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="size-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                                                        <Smartphone className="size-4" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="font-bold text-xs text-foreground flex items-center gap-2 font-mono">
                                                            <span className="size-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                                                            <span className="truncate">{ch.phone_number || ch.name}</span>
                                                            {ch.is_default && (
                                                                <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-sans font-bold shrink-0">
                                                                    DEFAULT
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                                                            Workspace: <strong>{ch.organization_name}</strong> • Connected: {ch.created_at}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 shrink-0">
                                                    <Badge
                                                        variant="outline"
                                                        className={`text-[10px] font-bold ${
                                                            ch.quality_rating === 'GREEN'
                                                                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                                                : ch.quality_rating === 'YELLOW'
                                                                ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                                                : 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                                                        }`}
                                                    >
                                                        {ch.quality_rating}
                                                    </Badge>
                                                    <Badge
                                                        variant="outline"
                                                        className={`text-[10px] font-semibold ${
                                                            ch.status === 'connected'
                                                                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                                                : 'bg-muted text-muted-foreground border-border'
                                                        }`}
                                                    >
                                                        {ch.status}
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </>
    );
}
