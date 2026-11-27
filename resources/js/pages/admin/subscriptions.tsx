import { useState, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    CreditCard,
    Search,
    Calendar,
    CheckCircle2,
    Clock,
    AlertTriangle,
    XCircle,
    Receipt,
    RefreshCw,
    SlidersHorizontal,
    Plus,
    Building2,
    User as UserIcon,
    ArrowUpRight,
    Sparkles,
    X,
    Phone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

type InvoiceItem = {
    id: string;
    plan: string;
    amount_paise: number;
    amount_formatted: string;
    status: string;
    provider_payment_id: string | null;
    paid_at: string | null;
    created_at: string;
};

type OrganizationSubscription = {
    id: string;
    name: string;
    slug: string;
    billing_email: string | null;
    subscription_plan: string;
    subscription_price_paise: number;
    subscription_price_formatted: string;
    status: string;
    subscription_expires_at: string | null;
    subscription_expires_at_formatted: string;
    days_remaining: number | null;
    is_expired: boolean;
    is_expiring_soon: boolean;
    channels_count: number;
    max_channels: number;
    channels?: Array<{
        id: string;
        name: string;
        phone_number: string | null;
    }>;
    users?: Array<{
        id: number;
        name: string;
        email: string;
    }>;
    owner: {
        id: number;
        name: string;
        email: string;
    } | null;
    b2b_agent: {
        id: number;
        name: string;
        email: string;
        referral_code?: string | null;
    } | null;
    invoices: InvoiceItem[];
    created_at: string;
};

type Props = {
    organizations: OrganizationSubscription[];
    stats: {
        total_organizations: number;
        active_subscriptions: number;
        expired_subscriptions: number;
        expiring_soon: number;
        total_revenue_formatted: string;
        monthly_revenue_formatted: string;
    };
};

export default function AdminSubscriptions({ organizations = [], stats }: Props) {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expiring_soon' | 'expired'>('all');
    const [planFilter, setPlanFilter] = useState<string>('all');

    // Edit / Renew Modal State
    const [editOrg, setEditOrg] = useState<OrganizationSubscription | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [plan, setPlan] = useState('annual');
    const [status, setStatus] = useState('active');
    const [expiryDate, setExpiryDate] = useState('');
    const [priceRupees, setPriceRupees] = useState('9999');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Invoices View Modal State
    const [viewInvoicesOrg, setViewInvoicesOrg] = useState<OrganizationSubscription | null>(null);
    const [isInvoicesModalOpen, setIsInvoicesModalOpen] = useState(false);
    const [activeQuickOption, setActiveQuickOption] = useState<string | null>(null);

    const openEditModal = (org: OrganizationSubscription) => {
        setEditOrg(org);
        setPlan('annual');
        setStatus(org.status || 'active');
        setExpiryDate(org.subscription_expires_at || '');
        setPriceRupees(((org.subscription_price_paise || 999900) / 100).toString());
        setActiveQuickOption(null);
        setIsEditModalOpen(true);
    };

    const handleExtendExpiry = (daysToAdd: number, optionKey: string) => {
        setActiveQuickOption(optionKey);

        let base = new Date();
        if (editOrg?.subscription_expires_at) {
            const existing = new Date(editOrg.subscription_expires_at + 'T00:00:00');
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (existing.getTime() >= today.getTime()) {
                base = existing;
            }
        }

        base.setDate(base.getDate() + daysToAdd);
        const istDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(base);
        setExpiryDate(istDate);
    };

    const handleResetExpiry = () => {
        setActiveQuickOption(null);
        setExpiryDate(editOrg?.subscription_expires_at || '');
    };

    const formatDatePreview = (dateStr: string) => {
        if (!dateStr) return 'No expiry date set (Unlimited validity)';
        try {
            const d = new Date(dateStr + 'T00:00:00');
            return new Intl.DateTimeFormat('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                weekday: 'short',
            }).format(d);
        } catch {
            return dateStr;
        }
    };

    const getDaysRemainingText = (dateStr: string, originalDateStr?: string | null) => {
        if (!dateStr) return 'Never expires';
        try {
            const target = new Date(dateStr + 'T00:00:00');
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            const diffMs = target.getTime() - now.getTime();
            const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

            let note = '';
            if (originalDateStr && originalDateStr !== dateStr) {
                const orig = new Date(originalDateStr + 'T00:00:00');
                const diffFromOrig = Math.round((target.getTime() - orig.getTime()) / (1000 * 60 * 60 * 24));
                if (diffFromOrig > 0) {
                    note = ` • Extended by +${diffFromOrig} days`;
                } else if (diffFromOrig < 0) {
                    note = ` • Shortened by ${Math.abs(diffFromOrig)} days`;
                }
            }

            if (diffDays > 0) {
                return `${diffDays} days left from today${note}`;
            } else if (diffDays === 0) {
                return `Expires today!${note}`;
            } else {
                return `Expired ${Math.abs(diffDays)} days ago${note}`;
            }
        } catch {
            return '';
        }
    };

    const handleSaveSubscription = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editOrg) return;
        setIsSubmitting(true);

        router.post(
            `/admin/subscriptions/${editOrg.id}/update`,
            {
                subscription_plan: plan,
                status: status,
                subscription_expires_at: expiryDate || null,
                subscription_price_rupees: parseFloat(priceRupees || '0'),
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsEditModalOpen(false);
                    setEditOrg(null);
                },
                onFinish: () => setIsSubmitting(false),
            }
        );
    };

    const openInvoicesModal = (org: OrganizationSubscription) => {
        setViewInvoicesOrg(org);
        setIsInvoicesModalOpen(true);
    };

    const trimmedQuery = search.trim().toLowerCase();
    const searchTokens = useMemo(() => {
        return trimmedQuery.length > 0 ? trimmedQuery.split(/\s+/).filter(Boolean) : [];
    }, [trimmedQuery]);

    // Checks whether an organization matches all search query tokens
    const matchesOrgSearch = (org: OrganizationSubscription, tokens: string[]) => {
        if (tokens.length === 0) return true;

        const phoneNumbersRaw = org.channels?.map(c => c.phone_number || '').join(' ') || '';
        const phoneNumbersDigits = phoneNumbersRaw.replace(/\D/g, '');
        const channelNames = org.channels?.map(c => c.name).join(' ') || '';
        const allUserNames = org.users?.map(u => u.name).join(' ') || '';
        const allUserEmails = org.users?.map(u => u.email).join(' ') || '';
        const invoiceDetails = org.invoices?.map(i => `${i.id} ${i.plan} ${i.provider_payment_id || ''} ${i.amount_formatted}`).join(' ') || '';

        const searchableContent = [
            org.name,
            org.slug,
            org.billing_email || '',
            org.subscription_plan,
            org.status,
            org.subscription_price_formatted,
            org.subscription_expires_at_formatted,
            org.owner?.name || '',
            org.owner?.email || '',
            allUserNames,
            allUserEmails,
            channelNames,
            phoneNumbersRaw,
            phoneNumbersDigits,
            org.b2b_agent?.name || '',
            org.b2b_agent?.email || '',
            org.b2b_agent?.referral_code || '',
            invoiceDetails,
        ].join(' ').toLowerCase();

        return tokens.every(token => {
            const tokenDigits = token.replace(/\D/g, '');
            if (tokenDigits.length >= 4 && phoneNumbersDigits.includes(tokenDigits)) {
                return true;
            }
            return searchableContent.includes(token);
        });
    };

    const filteredOrganizations = useMemo(() => {
        return organizations.filter((org) => {
            if (!matchesOrgSearch(org, searchTokens)) return false;

            if (statusFilter === 'active' && (org.is_expired || org.status !== 'active')) return false;
            if (statusFilter === 'expiring_soon' && !org.is_expiring_soon) return false;
            if (statusFilter === 'expired' && (!org.is_expired && org.status !== 'expired')) return false;

            if (planFilter !== 'all' && org.subscription_plan !== planFilter) return false;

            return true;
        });
    }, [organizations, searchTokens, statusFilter, planFilter]);

    // Cross-tab check: find matches across all tabs if currently 0 results in selected tab
    const totalMatchingInOtherTabs = useMemo(() => {
        if (searchTokens.length === 0 || statusFilter === 'all') return 0;
        return organizations.filter(org => matchesOrgSearch(org, searchTokens)).length;
    }, [organizations, searchTokens, statusFilter]);

    return (
        <>
            <Head title="Client Subscriptions & Revenue • Super Admin" />

            <div className="space-y-4 w-full max-w-7xl mx-auto pb-10">
                {/* Header Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card border border-border/70 rounded-2xl p-4 sm:p-5 shadow-2xs">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                                Subscriptions & Client Plans
                            </h1>
                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25 text-[10px] font-bold uppercase tracking-wider">
                                Revenue Engine
                            </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Real-time tracking of who bought subscriptions, active licenses, expiry countdowns, renewals, and official invoices.
                        </p>
                    </div>
                </div>

                {/* Sleek, Compact Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                    <div className="flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3.5 py-2.5 shadow-2xs">
                        <div className="flex items-center gap-2">
                            <div className="size-7 rounded-lg bg-emerald-500/15 text-emerald-600 flex items-center justify-center">
                                <CheckCircle2 className="size-3.5" />
                            </div>
                            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Active Subscriptions</span>
                        </div>
                        <span className="text-base font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                            {stats.active_subscriptions}
                            <span className="text-xs font-normal text-muted-foreground ml-1">/ {stats.total_organizations}</span>
                        </span>
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-amber-500/20 bg-amber-500/5 px-3.5 py-2.5 shadow-2xs">
                        <div className="flex items-center gap-2">
                            <div className="size-7 rounded-lg bg-amber-500/15 text-amber-600 flex items-center justify-center">
                                <Clock className="size-3.5" />
                            </div>
                            <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">Expiring Soon (30d)</span>
                        </div>
                        <span className="text-base font-bold tabular-nums text-amber-600 dark:text-amber-400">{stats.expiring_soon}</span>
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-rose-500/20 bg-rose-500/5 px-3.5 py-2.5 shadow-2xs">
                        <div className="flex items-center gap-2">
                            <div className="size-7 rounded-lg bg-rose-500/15 text-rose-600 flex items-center justify-center">
                                <XCircle className="size-3.5" />
                            </div>
                            <span className="text-xs font-semibold text-rose-700 dark:text-rose-400">Expired</span>
                        </div>
                        <span className="text-base font-bold tabular-nums text-rose-600 dark:text-rose-400">{stats.expired_subscriptions}</span>
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-border/70 bg-card px-3.5 py-2.5 shadow-2xs">
                        <div className="flex items-center gap-2">
                            <div className="size-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                                <CreditCard className="size-3.5" />
                            </div>
                            <span className="text-xs font-medium text-muted-foreground">Total Revenue</span>
                        </div>
                        <span className="text-base font-bold tabular-nums text-foreground">{stats.total_revenue_formatted}</span>
                    </div>
                </div>

                {/* Filters & Search */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-card border border-border/70 rounded-xl p-2.5 shadow-2xs">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                        <Input
                            placeholder="Search workspace, owner, email, phone number, B2B partner, or plan..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 pr-8 h-8.5 text-xs bg-muted/40 focus-visible:bg-background transition-colors"
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={() => setSearch('')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-full hover:bg-muted cursor-pointer transition-colors"
                                title="Clear search"
                            >
                                <X className="size-3.5" />
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Segmented Color-Coded Tabs */}
                        <div className="inline-flex items-center gap-1 p-1 bg-muted/60 border border-border/60 rounded-xl w-full sm:w-auto overflow-x-auto">
                            <button
                                type="button"
                                onClick={() => setStatusFilter('all')}
                                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                    statusFilter === 'all'
                                        ? 'bg-background text-foreground shadow-xs border border-border/60'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                <span>All</span>
                                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                                    statusFilter === 'all' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                                }`}>
                                    {organizations.length}
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setStatusFilter('active')}
                                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                    statusFilter === 'active'
                                        ? 'bg-emerald-600 text-white shadow-xs'
                                        : 'text-emerald-600 hover:bg-emerald-500/10'
                                }`}
                            >
                                <span>Active</span>
                                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                                    statusFilter === 'active' ? 'bg-white/25 text-white' : 'bg-emerald-500/15 text-emerald-600'
                                }`}>
                                    {stats.active_subscriptions}
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setStatusFilter('expiring_soon')}
                                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                    statusFilter === 'expiring_soon'
                                        ? 'bg-amber-600 text-white shadow-xs'
                                        : 'text-amber-600 hover:bg-amber-500/10'
                                }`}
                            >
                                <span>Expiring Soon</span>
                                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                                    statusFilter === 'expiring_soon' ? 'bg-white/25 text-white' : 'bg-amber-500/15 text-amber-600'
                                }`}>
                                    {stats.expiring_soon}
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setStatusFilter('expired')}
                                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                    statusFilter === 'expired'
                                        ? 'bg-rose-600 text-white shadow-xs'
                                        : 'text-rose-600 hover:bg-rose-500/10'
                                }`}
                            >
                                <span>Expired</span>
                                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                                    statusFilter === 'expired' ? 'bg-white/25 text-white' : 'bg-rose-500/15 text-rose-600'
                                }`}>
                                    {stats.expired_subscriptions}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Cross-tab notice when search matches items in other tabs */}
                {searchTokens.length > 0 && filteredOrganizations.length === 0 && totalMatchingInOtherTabs > 0 && (
                    <div className="flex items-center justify-between gap-2 p-2.5 px-3.5 rounded-xl border border-amber-500/25 bg-amber-500/10 text-xs text-amber-800 dark:text-amber-300">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="size-4 text-amber-600 shrink-0" />
                            <span>
                                No matches found under the <strong>{statusFilter}</strong> tab, but <strong>{totalMatchingInOtherTabs}</strong> workspace{totalMatchingInOtherTabs > 1 ? 's match' : ' matches'} in other tabs.
                            </span>
                        </div>
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setStatusFilter('all')}
                            className="h-7 text-xs border-amber-500/30 bg-background/80 hover:bg-background text-amber-800 dark:text-amber-300 font-semibold cursor-pointer shrink-0"
                        >
                            View in All Tabs
                        </Button>
                    </div>
                )}

                {/* Subscriptions Table */}
                <div className="rounded-xl border border-border/70 bg-card overflow-hidden shadow-2xs">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[800px] text-left text-xs">
                            <thead className="bg-muted/50 border-b border-border/70 text-muted-foreground uppercase tracking-wider text-[10px] font-semibold">
                                <tr>
                                    <th className="py-2.5 px-3.5">Client Workspace</th>
                                    <th className="py-2.5 px-3.5">Owner Contact</th>
                                    <th className="py-2.5 px-3.5 whitespace-nowrap">Current Plan</th>
                                    <th className="py-2.5 px-3.5 whitespace-nowrap">Subscription Status</th>
                                    <th className="py-2.5 px-3.5 whitespace-nowrap">Plan Price</th>
                                    <th className="py-2.5 px-3.5 whitespace-nowrap">Expiry / Remaining</th>
                                    <th className="py-2.5 px-3.5 whitespace-nowrap">Invoices</th>
                                    <th className="py-2.5 px-3.5 text-right whitespace-nowrap">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60">
                                {filteredOrganizations.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="py-12 text-center text-xs">
                                            <div className="flex flex-col items-center justify-center space-y-2 max-w-sm mx-auto">
                                                <div className="size-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                                                    <Search className="size-5" />
                                                </div>
                                                <div className="font-semibold text-foreground text-sm">No subscriptions found</div>
                                                <p className="text-muted-foreground text-xs leading-relaxed">
                                                    {search ? (
                                                        <>No subscriptions matching <span className="font-semibold text-foreground">"{search}"</span> in {statusFilter === 'all' ? 'the list' : `the ${statusFilter} tab`}.</>
                                                    ) : (
                                                        `No subscriptions currently listed under the ${statusFilter} tab.`
                                                    )}
                                                </p>
                                                {(search || statusFilter !== 'all') && (
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            setSearch('');
                                                            setStatusFilter('all');
                                                        }}
                                                        className="mt-2 text-xs h-7.5 cursor-pointer"
                                                    >
                                                        Clear Filters & Show All
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredOrganizations.map((org) => {
                                        return (
                                            <tr key={org.id} className="hover:bg-muted/30 transition-colors">
                                                <td className="py-2.5 px-3.5">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-xs uppercase shrink-0">
                                                            {org.name.slice(0, 2)}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="font-semibold text-foreground flex items-center gap-1.5 flex-wrap">
                                                                <span className="truncate">{org.name}</span>
                                                                {org.b2b_agent && (
                                                                    <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5 bg-amber-500/10 text-amber-600 border-amber-500/25 shrink-0">
                                                                        via {org.b2b_agent.name}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 flex-wrap">
                                                                <span>/{org.slug} • Joined {org.created_at}</span>
                                                                {org.channels && org.channels.length > 0 && (
                                                                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-medium">
                                                                        <Phone className="size-2.5" />
                                                                        {org.channels[0].phone_number || org.channels[0].name}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="py-2.5 px-3.5">
                                                    {org.owner ? (
                                                        <div>
                                                            <div className="font-medium text-foreground">{org.owner.name}</div>
                                                            <div className="text-[11px] text-muted-foreground">{org.owner.email}</div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground">—</span>
                                                    )}
                                                </td>

                                                <td className="py-2.5 px-3.5 whitespace-nowrap">
                                                    <Badge variant="outline" className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25 px-2 py-0.5">
                                                        Annual Business Plan
                                                    </Badge>
                                                    <div className="text-[10px] text-muted-foreground mt-0.5">
                                                        {org.channels_count} / {org.max_channels <= 0 ? '∞' : org.max_channels} Numbers
                                                    </div>
                                                </td>

                                                <td className="py-2.5 px-3.5 whitespace-nowrap">
                                                    {org.is_expired || org.status === 'expired' ? (
                                                        <Badge variant="destructive" className="text-[10px] bg-rose-500/10 text-rose-600 border-rose-500/20 font-semibold px-2 py-0.5">
                                                            Expired
                                                        </Badge>
                                                    ) : org.is_expiring_soon ? (
                                                        <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/25 font-semibold px-2 py-0.5">
                                                            Expiring Soon
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25 font-semibold px-2 py-0.5">
                                                            Active
                                                        </Badge>
                                                    )}
                                                </td>

                                                <td className="py-2.5 px-3.5 whitespace-nowrap">
                                                    <span className="font-bold text-foreground">
                                                        {org.subscription_price_formatted}
                                                    </span>
                                                    <span className="text-[10px] font-normal text-muted-foreground block">
                                                        / year
                                                    </span>
                                                </td>

                                                <td className="py-2.5 px-3.5 whitespace-nowrap">
                                                    <div className="font-medium text-foreground">
                                                        {org.subscription_expires_at_formatted}
                                                    </div>
                                                    <div className="text-[10px] mt-0.5">
                                                        {org.days_remaining !== null ? (
                                                            org.days_remaining > 0 ? (
                                                                <span className={org.days_remaining <= 30 ? 'text-amber-600 font-semibold' : 'text-emerald-600 dark:text-emerald-400'}>
                                                                    {org.days_remaining} days left
                                                                </span>
                                                            ) : (
                                                                <span className="text-rose-600 font-semibold">
                                                                    Expired {Math.abs(org.days_remaining)}d ago
                                                                </span>
                                                            )
                                                        ) : (
                                                            <span className="text-muted-foreground">Unlimited validity</span>
                                                        )}
                                                    </div>
                                                </td>

                                                <td className="py-2.5 px-3.5 whitespace-nowrap">
                                                    {org.invoices.length > 0 ? (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => openInvoicesModal(org)}
                                                            className="h-6 text-[11px] px-2 text-primary hover:bg-primary/10 gap-1 rounded-md"
                                                        >
                                                            <Receipt className="size-3" />
                                                            <span>{org.invoices.length} Invoices</span>
                                                        </Button>
                                                    ) : (
                                                        <span className="text-[11px] text-muted-foreground">0 invoices</span>
                                                    )}
                                                </td>

                                                <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => openEditModal(org)}
                                                        className="h-7 text-xs px-2.5 rounded-lg border-border/80 hover:border-primary/40 hover:bg-primary/5 hover:text-primary gap-1 font-medium cursor-pointer shadow-2xs"
                                                    >
                                                        <SlidersHorizontal className="size-3 text-muted-foreground" />
                                                        <span>Edit Plan</span>
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Edit / Renew Subscription Modal */}
                <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-base font-bold flex items-center gap-2">
                                <Sparkles className="size-4 text-primary" />
                                <span>Manage Subscription: {editOrg?.name}</span>
                            </DialogTitle>
                            <DialogDescription className="text-xs">
                                Update the subscription plan, validity period, pricing, or activate an extension for this client.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSaveSubscription} className="space-y-3 pt-2">
                            <div className="grid grid-cols-2 gap-2.5">
                                <div className="space-y-1">
                                    <Label className="text-xs">Subscription Plan</Label>
                                    <div className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-border bg-muted/50 text-xs font-semibold text-foreground">
                                        <Sparkles className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                        <span className="truncate">Annual Business Plan</span>
                                        <Badge variant="outline" className="ml-auto text-[9px] px-1.5 py-0 h-4 bg-emerald-500/10 text-emerald-600 border-emerald-500/25 shrink-0">
                                            365d
                                        </Badge>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs">Status</Label>
                                    <select
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value)}
                                        className="w-full h-8 text-xs rounded-lg border border-border bg-background px-2"
                                    >
                                        <option value="active">Active</option>
                                        <option value="expired">Expired</option>
                                        <option value="suspended">Suspended</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-semibold">Expiry Date & Renewal</Label>
                                    <span className="text-[10px] text-muted-foreground">Click to extend:</span>
                                </div>

                                <div className="grid grid-cols-4 gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => handleExtendExpiry(30, '+30d')}
                                        className={`px-2 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer text-center ${
                                            activeQuickOption === '+30d'
                                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                                : 'bg-muted/50 border-border text-foreground hover:bg-muted'
                                        }`}
                                    >
                                        +30 Days
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleExtendExpiry(180, '+6mo')}
                                        className={`px-2 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer text-center ${
                                            activeQuickOption === '+6mo'
                                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                                : 'bg-muted/50 border-border text-foreground hover:bg-muted'
                                        }`}
                                    >
                                        +6 Months
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleExtendExpiry(365, '+1yr')}
                                        className={`px-2 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer text-center ${
                                            activeQuickOption === '+1yr'
                                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs ring-1 ring-emerald-600'
                                                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20'
                                        }`}
                                    >
                                        +1 Year
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleExtendExpiry(730, '+2yr')}
                                        className={`px-2 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer text-center ${
                                            activeQuickOption === '+2yr'
                                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                                : 'bg-muted/50 border-border text-foreground hover:bg-muted'
                                        }`}
                                    >
                                        +2 Years
                                    </button>
                                </div>

                                <Input
                                    type="date"
                                    value={expiryDate}
                                    onChange={(e) => {
                                        setExpiryDate(e.target.value);
                                        setActiveQuickOption(null);
                                    }}
                                    className="h-8.5 text-xs bg-background"
                                />

                                {/* Live Date & Validity Feedback Card */}
                                <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/60 border border-border/80 text-xs">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className="size-7 rounded-lg bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0">
                                            <Calendar className="size-3.5" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="font-bold text-foreground truncate">
                                                {formatDatePreview(expiryDate)}
                                            </div>
                                            <div className="text-[10px] text-muted-foreground truncate">
                                                {getDaysRemainingText(expiryDate, editOrg?.subscription_expires_at)}
                                            </div>
                                        </div>
                                    </div>

                                    {editOrg?.subscription_expires_at && expiryDate !== editOrg.subscription_expires_at && (
                                        <button
                                            type="button"
                                            onClick={handleResetExpiry}
                                            className="text-[10px] text-muted-foreground hover:text-foreground underline ml-2 shrink-0 cursor-pointer"
                                        >
                                            Reset
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs">Plan Price (₹ INR)</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={priceRupees}
                                    onChange={(e) => setPriceRupees(e.target.value)}
                                    className="h-8 text-xs font-semibold"
                                />
                            </div>

                            <DialogFooter className="pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="h-8 text-xs"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    size="sm"
                                    disabled={isSubmitting}
                                    className="h-8 text-xs font-semibold bg-primary"
                                >
                                    {isSubmitting ? 'Saving...' : 'Save Subscription'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* View Invoices Modal */}
                <Dialog open={isInvoicesModalOpen} onOpenChange={setIsInvoicesModalOpen}>
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="text-base font-bold flex items-center gap-2">
                                <Receipt className="size-4 text-primary" />
                                <span>Invoices for {viewInvoicesOrg?.name}</span>
                            </DialogTitle>
                            <DialogDescription className="text-xs">
                                All recorded billing transactions and payments for this workspace.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-2 max-h-80 overflow-y-auto pt-1">
                            {viewInvoicesOrg?.invoices.map((inv) => (
                                <div
                                    key={inv.id}
                                    className="p-3 bg-muted/40 rounded-xl border border-border/70 flex items-center justify-between text-xs"
                                >
                                    <div>
                                        <div className="font-semibold text-foreground flex items-center gap-1.5">
                                            <span>{inv.amount_formatted}</span>
                                            <Badge variant="outline" className="text-[9px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20 capitalize">
                                                {inv.status}
                                            </Badge>
                                        </div>
                                        <div className="text-[11px] text-muted-foreground mt-0.5">
                                            Plan: {inv.plan} • Ref: {inv.provider_payment_id || inv.id.slice(0, 8)}
                                        </div>
                                    </div>
                                    <div className="text-right text-[11px] text-muted-foreground">
                                        {inv.paid_at || inv.created_at}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setIsInvoicesModalOpen(false)}
                                className="h-8 text-xs"
                            >
                                Close
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}
