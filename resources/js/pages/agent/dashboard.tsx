import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    Building2,
    CheckCircle2,
    Copy,
    Check,
    ExternalLink,
    Gift,
    Plus,
    Search,
    Send,
    Sparkles,
    UserCheck,
    Smartphone,
    X,
    Eye,
    EyeOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

type Customer = {
    id: string;
    name: string;
    billing_email: string;
    owner_name: string;
    owner_email: string;
    status: string;
    subscription_plan: string;
    subscription_expires_at: string | null;
    days_until_expiry: number | null;
    channels_count: number;
    campaigns_count: number;
    wallet_balance: string;
    wallet_paid: string;
    wallet_promo: string;
    created_at: string;
};

type Props = {
    agent: {
        id: number;
        name: string;
        email: string;
        referral_code: string;
    };
    customers: Customer[];
    stats: {
        total_customers: number;
        active_customers: number;
        total_messages_sent: number;
        total_referral_rewards: string;
        conversions: number;
    };
    referral: {
        referral_code: string;
        referral_link: string;
        total_referrals: number;
        successful_conversions: number;
        total_earned_formatted: string;
    };
};

export default function AgentDashboard({ agent, customers = [], stats, referral }: Props) {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired'>('all');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [copied, setCopied] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form data for creating customer
    const [formData, setFormData] = useState({
        business_name: '',
        owner_name: '',
        owner_email: '',
        owner_password: '',
        billing_email: '',
    });

    const copyLink = () => {
        navigator.clipboard.writeText(referral.referral_link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleCreateCustomer = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        router.post('/agent/customers', formData, {
            onSuccess: () => {
                setShowCreateModal(false);
                setFormData({
                    business_name: '',
                    owner_name: '',
                    owner_email: '',
                    owner_password: '',
                    billing_email: '',
                });
            },
            onFinish: () => setIsSubmitting(false),
        });
    };

    const assistCustomer = (orgId: string) => {
        router.post(`/agent/customers/${orgId}/assist`);
    };

    const filteredCustomers = customers.filter((c) => {
        const matchesSearch =
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.owner_name.toLowerCase().includes(search.toLowerCase()) ||
            c.owner_email.toLowerCase().includes(search.toLowerCase());

        if (statusFilter === 'active') return matchesSearch && c.status === 'active';
        if (statusFilter === 'expired') return matchesSearch && c.status !== 'active';
        return matchesSearch;
    });

    const expiredCount = customers.filter((c) => c.status !== 'active').length;

    return (
        <>
            <Head title="B2B Partner & Reseller Portal" />

            <div className="space-y-4 w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 pb-12">
                {/* Header Banner with Integrated Referral Bar */}
                <div className="bg-card border border-border/70 rounded-2xl p-4 sm:p-5 shadow-2xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                                    B2B Partner & Reseller Portal
                                </h1>
                                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25 text-[10px] font-bold uppercase tracking-wider">
                                    Verified Partner
                                </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Manage assigned client workspaces, assist onboarding, and track referral commissions in real time.
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                onClick={() => setShowCreateModal(true)}
                                className="h-8.5 px-3.5 text-xs font-semibold gap-1.5 cursor-pointer rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs shrink-0"
                            >
                                <Plus className="size-3.5" />
                                <span>Onboard New Client</span>
                            </Button>
                        </div>
                    </div>

                    {/* Integrated Referral Link Strip */}
                    <div className="mt-3.5 pt-3.5 border-t border-border/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Sparkles className="size-3.5 text-emerald-600 shrink-0" />
                            <span className="font-semibold text-foreground">Partner Referral Link:</span>
                            <span className="font-mono text-[10px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded border border-border/60">
                                {agent.referral_code}
                            </span>
                        </div>

                        <div className="flex items-center gap-1.5 w-full sm:w-auto">
                            <div className="relative flex-1 sm:w-96">
                                <Input
                                    readOnly
                                    value={referral.referral_link}
                                    className="h-7.5 text-xs font-mono bg-muted/30 pr-2 select-all"
                                />
                            </div>
                            <Button
                                onClick={copyLink}
                                variant="outline"
                                size="sm"
                                className="h-7.5 px-3 gap-1 text-xs shrink-0 cursor-pointer rounded-lg border-border/80 hover:bg-muted"
                            >
                                {copied ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
                                <span>{copied ? 'Copied!' : 'Copy Link'}</span>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Sleek, Compact KPI Metric Cards (Uniform bg-card styling) */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
                    {/* Card 1: Managed Clients */}
                    <div className="flex items-center justify-between rounded-xl border border-border/70 bg-card px-3.5 py-2.5 shadow-2xs">
                        <div className="flex items-center gap-2.5">
                            <div className="size-7.5 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                                <Building2 className="size-3.5" />
                            </div>
                            <div>
                                <span className="text-xs font-semibold text-foreground block leading-tight">Managed Clients</span>
                                <span className="text-[10px] text-muted-foreground">{stats.active_customers} active plans</span>
                            </div>
                        </div>
                        <span className="text-base font-bold tabular-nums text-foreground">{stats.total_customers}</span>
                    </div>

                    {/* Card 2: Conversions */}
                    <div className="flex items-center justify-between rounded-xl border border-border/70 bg-card px-3.5 py-2.5 shadow-2xs">
                        <div className="flex items-center gap-2.5">
                            <div className="size-7.5 rounded-lg bg-teal-500/10 text-teal-600 flex items-center justify-center shrink-0">
                                <UserCheck className="size-3.5" />
                            </div>
                            <div>
                                <span className="text-xs font-semibold text-foreground block leading-tight">Conversions</span>
                                <span className="text-[10px] text-muted-foreground">Annual activations</span>
                            </div>
                        </div>
                        <span className="text-base font-bold tabular-nums text-foreground">{stats.conversions}</span>
                    </div>

                    {/* Card 3: Messages Dispatched */}
                    <div className="flex items-center justify-between rounded-xl border border-border/70 bg-card px-3.5 py-2.5 shadow-2xs">
                        <div className="flex items-center gap-2.5">
                            <div className="size-7.5 rounded-lg bg-sky-500/10 text-sky-600 flex items-center justify-center shrink-0">
                                <Send className="size-3.5" />
                            </div>
                            <div>
                                <span className="text-xs font-semibold text-foreground block leading-tight">Messages Sent</span>
                                <span className="text-[10px] text-muted-foreground">Across workspaces</span>
                            </div>
                        </div>
                        <span className="text-base font-bold tabular-nums text-foreground">{stats.total_messages_sent.toLocaleString()}</span>
                    </div>

                    {/* Card 4: Referral Rewards */}
                    <div className="flex items-center justify-between rounded-xl border border-border/70 bg-card px-3.5 py-2.5 shadow-2xs">
                        <div className="flex items-center gap-2.5">
                            <div className="size-7.5 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                                <Gift className="size-3.5" />
                            </div>
                            <div>
                                <span className="text-xs font-semibold text-foreground block leading-tight">Partner Rewards</span>
                                <span className="text-[10px] text-muted-foreground">₹500 / conversion</span>
                            </div>
                        </div>
                        <span className="text-base font-bold tabular-nums text-amber-600 dark:text-amber-400">{stats.total_referral_rewards}</span>
                    </div>
                </div>

                {/* Unified Client Directory Card (Toolbar + Table / Empty State) */}
                <div className="rounded-xl border border-border/70 bg-card overflow-hidden shadow-2xs">
                    {/* Integrated Table Toolbar */}
                    <div className="p-3 sm:px-4 border-b border-border/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-muted/20">
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-sm font-bold text-foreground">Assigned Client Workspaces</h2>
                                <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-primary/10 text-primary">
                                    {filteredCustomers.length}
                                </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                Clients linked to your partner account with live status, channel counts, and assist tools.
                            </p>
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            {/* Search */}
                            <div className="relative flex-1 sm:w-56">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
                                <Input
                                    placeholder="Search clients..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-8 h-7.5 text-xs bg-background"
                                />
                            </div>

                            {/* Segmented Filter Pills */}
                            <div className="inline-flex items-center gap-0.5 p-0.5 bg-muted/60 border border-border/60 rounded-lg shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setStatusFilter('all')}
                                    className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                                        statusFilter === 'all'
                                            ? 'bg-background text-foreground shadow-xs'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    All ({customers.length})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStatusFilter('active')}
                                    className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                                        statusFilter === 'active'
                                            ? 'bg-emerald-600 text-white shadow-xs'
                                            : 'text-emerald-600 hover:bg-emerald-500/10'
                                    }`}
                                >
                                    Active ({stats.active_customers})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStatusFilter('expired')}
                                    className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                                        statusFilter === 'expired'
                                            ? 'bg-rose-600 text-white shadow-xs'
                                            : 'text-rose-600 hover:bg-rose-500/10'
                                    }`}
                                >
                                    Expired ({expiredCount})
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Table or Inviting Empty State */}
                    {filteredCustomers.length === 0 ? (
                        <div className="py-14 px-4 text-center">
                            <div className="size-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto mb-3 shadow-2xs">
                                <Building2 className="size-6" />
                            </div>
                            <h3 className="text-sm font-bold text-foreground">
                                {customers.length === 0 ? 'No Client Workspaces Assigned Yet' : 'No Clients Matching Filter'}
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                                {customers.length === 0
                                    ? 'Get started by onboarding your first client workspace directly, or share your referral link to earn commissions automatically.'
                                    : 'No clients match your current search criteria. Try clearing the search or status filter.'}
                            </p>
                            {customers.length === 0 ? (
                                <Button
                                    onClick={() => setShowCreateModal(true)}
                                    className="mt-4 h-8 px-4 text-xs font-semibold gap-1.5 cursor-pointer rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs"
                                >
                                    <Plus className="size-3.5" />
                                    <span>Onboard Your First Client</span>
                                </Button>
                            ) : (
                                <Button
                                    onClick={() => {
                                        setSearch('');
                                        setStatusFilter('all');
                                    }}
                                    variant="outline"
                                    size="sm"
                                    className="mt-4 h-7.5 text-xs rounded-lg cursor-pointer"
                                >
                                    Clear Filters
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-muted/40 border-b border-border/70 text-muted-foreground uppercase tracking-wider text-[10px] font-semibold">
                                    <tr>
                                        <th className="py-2.5 px-3.5">Business Workspace</th>
                                        <th className="py-2.5 px-3.5">Owner Contact</th>
                                        <th className="py-2.5 px-3.5 whitespace-nowrap">Status & Plan</th>
                                        <th className="py-2.5 px-3.5 whitespace-nowrap">WhatsApp Numbers</th>
                                        <th className="py-2.5 px-3.5 whitespace-nowrap">Wallet Balance</th>
                                        <th className="py-2.5 px-3.5 text-right whitespace-nowrap">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/60">
                                    {filteredCustomers.map((c) => (
                                        <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="py-2.5 px-3.5">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex size-7.5 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 font-bold text-xs uppercase shrink-0">
                                                        {c.name.slice(0, 2)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="font-semibold text-foreground text-xs truncate max-w-[200px]">
                                                            {c.name}
                                                        </div>
                                                        <div className="text-[11px] text-muted-foreground">
                                                            Joined {c.created_at}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="py-2.5 px-3.5">
                                                <div className="font-medium text-foreground text-xs">{c.owner_name}</div>
                                                <div className="text-[11px] text-muted-foreground truncate max-w-[180px]">
                                                    {c.owner_email}
                                                </div>
                                            </td>

                                            <td className="py-2.5 px-3.5 whitespace-nowrap">
                                                <div className="flex items-center gap-1.5">
                                                    <Badge
                                                        variant="outline"
                                                        className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full ${
                                                            c.status === 'active'
                                                                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                                                : 'border-rose-500/30 bg-rose-500/10 text-rose-600'
                                                        }`}
                                                    >
                                                        {c.status}
                                                    </Badge>
                                                    <span className="text-[11px] text-muted-foreground font-medium">
                                                        {c.subscription_expires_at ? `Exp: ${c.subscription_expires_at}` : 'Annual Plan'}
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="py-2.5 px-3.5 whitespace-nowrap">
                                                <div className="flex items-center gap-1.5">
                                                    <Smartphone className="size-3 text-muted-foreground" />
                                                    <span className="font-bold tabular-nums text-foreground">{c.channels_count}</span>
                                                    <span className="text-[11px] text-muted-foreground">/ 1 Number</span>
                                                </div>
                                            </td>

                                            <td className="py-2.5 px-3.5 whitespace-nowrap">
                                                <span className="font-bold tabular-nums text-foreground block">
                                                    {c.wallet_balance}
                                                </span>
                                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                                                    Bonus: {c.wallet_promo}
                                                </span>
                                            </td>

                                            <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                                                <Button
                                                    onClick={() => assistCustomer(c.id)}
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-7 px-2.5 text-xs gap-1.5 rounded-lg border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10 font-medium cursor-pointer shadow-2xs"
                                                >
                                                    <ExternalLink className="size-3" />
                                                    <span>Assist Client</span>
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Onboard Customer Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-card border border-border/80 w-full max-w-md rounded-2xl p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between pb-3 border-b border-border/60">
                            <div className="flex items-center gap-2">
                                <div className="size-7.5 rounded-lg bg-emerald-500/15 text-emerald-600 flex items-center justify-center font-bold">
                                    <Plus className="size-4" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-foreground">Onboard Client Workspace</h3>
                                    <p className="text-[11px] text-muted-foreground">Set up a new client account with annual SaaS plan.</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="size-7 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateCustomer} className="space-y-3">
                            <div className="space-y-1">
                                <Label htmlFor="business_name" className="text-xs font-semibold text-foreground">
                                    Client Business Name
                                </Label>
                                <Input
                                    id="business_name"
                                    required
                                    placeholder="e.g. Acme Retailers Pvt Ltd"
                                    value={formData.business_name}
                                    onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                                    className="h-8 text-xs bg-muted/30"
                                />
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="owner_name" className="text-xs font-semibold text-foreground">
                                    Client Owner Full Name
                                </Label>
                                <Input
                                    id="owner_name"
                                    required
                                    placeholder="e.g. Ramesh Patel"
                                    value={formData.owner_name}
                                    onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                                    className="h-8 text-xs bg-muted/30"
                                />
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="owner_email" className="text-xs font-semibold text-foreground">
                                    Client Login Email
                                </Label>
                                <Input
                                    id="owner_email"
                                    type="email"
                                    required
                                    placeholder="owner@acme.com"
                                    value={formData.owner_email}
                                    onChange={(e) => setFormData({ ...formData, owner_email: e.target.value })}
                                    className="h-8 text-xs bg-muted/30"
                                />
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="owner_password" className="text-xs font-semibold text-foreground">
                                    Temporary Password
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="owner_password"
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        minLength={8}
                                        placeholder="Minimum 8 characters"
                                        value={formData.owner_password}
                                        onChange={(e) => setFormData({ ...formData, owner_password: e.target.value })}
                                        className="h-8 text-xs bg-muted/30 pr-8"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 transition-colors cursor-pointer"
                                        title={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                                    </button>
                                </div>
                            </div>

                            {/* Auto-provision package overview */}
                            <div className="p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/20 space-y-1 text-xs">
                                <div className="font-semibold text-emerald-800 dark:text-emerald-300 text-[11px] uppercase tracking-wider">
                                    Auto-Provisioned Package:
                                </div>
                                <div className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
                                    <CheckCircle2 className="size-3 text-emerald-600 shrink-0" />
                                    <span>Annual SaaS License (365 Days validity)</span>
                                </div>
                                <div className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
                                    <CheckCircle2 className="size-3 text-emerald-600 shrink-0" />
                                    <span>₹500 Welcome Bonus credited to Client Wallet</span>
                                </div>
                                <div className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
                                    <CheckCircle2 className="size-3 text-emerald-600 shrink-0" />
                                    <span>₹500 Referral Commission credited to your Partner Ledger</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowCreateModal(false)}
                                    className="h-8 text-xs rounded-lg cursor-pointer"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="h-8 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg cursor-pointer shadow-2xs"
                                >
                                    {isSubmitting ? 'Provisioning...' : 'Provision Client Workspace'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
