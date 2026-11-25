import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    Briefcase,
    Building2,
    CheckCircle2,
    Copy,
    Check,
    CreditCard,
    ExternalLink,
    Gift,
    Plus,
    Search,
    Send,
    Shield,
    Sparkles,
    UserCheck,
    Users,
    Wallet,
    X,
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { BreadcrumbItem } from '@/types';

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

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'B2B Partner Portal', href: '/agent/dashboard' },
];

export default function AgentDashboard({ agent, customers, stats, referral }: Props) {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired'>('all');
    const [showCreateModal, setShowCreateModal] = useState(false);
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="B2B Partner & Reseller Portal" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 max-w-7xl mx-auto w-full">
                {/* Compact Action Toolbar */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
                    <div className="flex items-center gap-2.5 flex-wrap">
                        <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[10px] uppercase font-bold">
                            Verified Partner
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                            Manage assigned client workspaces, assist onboarding, and track referral commissions.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <Button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 gap-1.5 cursor-pointer shadow-xs"
                        >
                            <Plus className="size-3.5" />
                            Onboard New Client
                        </Button>
                    </div>
                </div>

                {/* Metrics Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="border-border bg-card">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
                                <span>Managed Clients</span>
                                <Building2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-foreground">{stats.total_customers}</div>
                            <p className="text-[11px] text-muted-foreground mt-1">
                                {stats.active_customers} active annual subscriptions
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-border bg-card">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
                                <span>Successful Conversions</span>
                                <UserCheck className="size-4 text-teal-600 dark:text-teal-400" />
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-foreground">{stats.conversions}</div>
                            <p className="text-[11px] text-muted-foreground mt-1">Annual plan activations</p>
                        </CardContent>
                    </Card>

                    <Card className="border-border bg-card">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
                                <span>Messages Dispatched</span>
                                <Send className="size-4 text-emerald-600 dark:text-emerald-400" />
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-foreground">{stats.total_messages_sent.toLocaleString()}</div>
                            <p className="text-[11px] text-muted-foreground mt-1">Across managed workspaces</p>
                        </CardContent>
                    </Card>

                    <Card className="border-border bg-card">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
                                <span>Referral Rewards Earned</span>
                                <Gift className="size-4 text-amber-500" />
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                                {stats.total_referral_rewards}
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-1">₹500 per annual conversion</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Partner Referral Banner */}
                <Card className="border-border bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-transparent">
                    <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="size-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                                <Sparkles className="size-4" />
                            </div>
                            <div>
                                <div className="text-xs font-bold text-foreground flex items-center gap-2">
                                    Your Partner Referral Link
                                    <span className="font-mono text-[10px] text-muted-foreground">({agent.referral_code})</span>
                                </div>
                                <div className="text-[11px] text-muted-foreground">
                                    Share this link with prospective clients. When they sign up, they get automatically assigned to you.
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <Input
                                readOnly
                                value={referral.referral_link}
                                className="text-xs font-mono bg-muted/50 h-8 w-full sm:w-72"
                            />
                            <Button
                                onClick={copyLink}
                                variant="outline"
                                className="h-8 px-3 gap-1 text-xs shrink-0 cursor-pointer"
                            >
                                {copied ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
                                {copied ? 'Copied' : 'Copy'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Managed Clients Directory */}
                <Card className="border-border bg-card">
                    <CardHeader className="pb-3 border-b border-border/50">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div>
                                <CardTitle className="text-sm font-semibold text-foreground">
                                    Assigned Client Workspaces
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Clients assigned to your partner account ({filteredCustomers.length})
                                </CardDescription>
                            </div>

                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <div className="relative flex-1 sm:w-60">
                                    <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder="Search clients..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="h-8 pl-8 text-xs"
                                    />
                                </div>

                                <div className="flex items-center border border-border rounded-lg p-0.5 bg-muted/30">
                                    <button
                                        onClick={() => setStatusFilter('all')}
                                        className={`px-2 py-1 text-[11px] rounded-md transition-colors ${
                                            statusFilter === 'all' ? 'bg-card font-semibold text-foreground shadow-2xs' : 'text-muted-foreground'
                                        }`}
                                    >
                                        All
                                    </button>
                                    <button
                                        onClick={() => setStatusFilter('active')}
                                        className={`px-2 py-1 text-[11px] rounded-md transition-colors ${
                                            statusFilter === 'active' ? 'bg-card font-semibold text-foreground shadow-2xs' : 'text-muted-foreground'
                                        }`}
                                    >
                                        Active
                                    </button>
                                </div>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0">
                        {filteredCustomers.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-muted/40 text-muted-foreground border-b border-border/60">
                                        <tr>
                                            <th className="py-2.5 px-4 font-semibold">Business Workspace</th>
                                            <th className="py-2.5 px-4 font-semibold">Owner Contact</th>
                                            <th className="py-2.5 px-4 font-semibold">Status & Validity</th>
                                            <th className="py-2.5 px-4 font-semibold">Numbers</th>
                                            <th className="py-2.5 px-4 font-semibold">Wallet Balance</th>
                                            <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/60">
                                        {filteredCustomers.map((c) => (
                                            <tr key={c.id} className="hover:bg-muted/20 transition-colors">
                                                <td className="py-3 px-4">
                                                    <div className="font-semibold text-foreground">{c.name}</div>
                                                    <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                                                        Created {c.created_at}
                                                    </div>
                                                </td>

                                                <td className="py-3 px-4">
                                                    <div className="font-medium text-foreground">{c.owner_name}</div>
                                                    <div className="text-[10px] text-muted-foreground">{c.owner_email}</div>
                                                </td>

                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-1.5">
                                                        <Badge
                                                            variant="outline"
                                                            className={`text-[9px] uppercase font-bold ${
                                                                c.status === 'active'
                                                                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                                                    : 'border-amber-500/40 bg-amber-500/10 text-amber-600'
                                                            }`}
                                                        >
                                                            {c.status}
                                                        </Badge>
                                                        <span className="text-[11px] text-muted-foreground">
                                                            {c.subscription_expires_at ? `Exp: ${c.subscription_expires_at}` : 'Annual Plan'}
                                                        </span>
                                                    </div>
                                                </td>

                                                <td className="py-3 px-4">
                                                    <span className="font-medium text-foreground">{c.channels_count}</span>
                                                    <span className="text-muted-foreground text-[10px]"> / 1 connected</span>
                                                </td>

                                                <td className="py-3 px-4">
                                                    <div className="font-bold text-foreground">{c.wallet_balance}</div>
                                                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400">
                                                        Bonus: {c.wallet_promo}
                                                    </div>
                                                </td>

                                                <td className="py-3 px-4 text-right">
                                                    <Button
                                                        onClick={() => assistCustomer(c.id)}
                                                        variant="outline"
                                                        className="h-7 px-2.5 text-[11px] gap-1 hover:bg-emerald-500/10 hover:border-emerald-500/40 hover:text-emerald-600 cursor-pointer"
                                                    >
                                                        <ExternalLink className="size-3" />
                                                        Assist Client
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-12 text-xs text-muted-foreground">
                                <Building2 className="size-8 mx-auto text-muted-foreground/40 mb-2" />
                                <p>No assigned clients found.</p>
                                <Button
                                    onClick={() => setShowCreateModal(true)}
                                    variant="link"
                                    className="text-xs text-emerald-600 mt-1 cursor-pointer"
                                >
                                    Onboard your first client now
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Onboard Customer Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-card border border-border w-full max-w-md rounded-xl p-5 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-border/60">
                            <div className="flex items-center gap-2">
                                <Plus className="size-4 text-emerald-600 dark:text-emerald-400" />
                                <h3 className="text-sm font-bold text-foreground">Onboard Client Workspace</h3>
                            </div>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="text-muted-foreground hover:text-foreground text-xs"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateCustomer} className="space-y-3">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-foreground">Client Business Name</label>
                                <Input
                                    required
                                    placeholder="e.g. Acme Retailers Pvt Ltd"
                                    value={formData.business_name}
                                    onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                                    className="h-8 text-xs"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-foreground">Client Owner Name</label>
                                <Input
                                    required
                                    placeholder="e.g. Ramesh Patel"
                                    value={formData.owner_name}
                                    onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                                    className="h-8 text-xs"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-foreground">Client Login Email</label>
                                <Input
                                    type="email"
                                    required
                                    placeholder="owner@acme.com"
                                    value={formData.owner_email}
                                    onChange={(e) => setFormData({ ...formData, owner_email: e.target.value })}
                                    className="h-8 text-xs"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-foreground">Temporary Password</label>
                                <Input
                                    type="password"
                                    required
                                    minLength={8}
                                    placeholder="Minimum 8 characters"
                                    value={formData.owner_password}
                                    onChange={(e) => setFormData({ ...formData, owner_password: e.target.value })}
                                    className="h-8 text-xs"
                                />
                            </div>

                            <div className="p-3 bg-muted/40 rounded-lg border border-border/60 space-y-1 text-xs">
                                <div className="font-semibold text-foreground">Auto-Provisioned Package:</div>
                                <div className="text-muted-foreground flex items-center gap-1.5">
                                    <CheckCircle2 className="size-3 text-emerald-600" />
                                    Annual Business Plan (365 Days)
                                </div>
                                <div className="text-muted-foreground flex items-center gap-1.5">
                                    <CheckCircle2 className="size-3 text-emerald-600" />
                                    ₹500 Welcome Bonus credited to Client
                                </div>
                                <div className="text-muted-foreground flex items-center gap-1.5">
                                    <CheckCircle2 className="size-3 text-emerald-600" />
                                    ₹500 Referral Reward credited to your Partner Wallet
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowCreateModal(false)}
                                    className="h-8 text-xs"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                                >
                                    {isSubmitting ? 'Provisioning...' : 'Provision Client Workspace'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
