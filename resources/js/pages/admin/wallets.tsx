import { useState, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    Wallet,
    Plus,
    Search,
    IndianRupee,
    ArrowDownLeft,
    ArrowUpRight,
    Building2,
    RefreshCw,
    ExternalLink,
    Sparkles,
    CheckCircle2,
    Gift,
    Receipt,
    History,
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

type OrganizationWallet = {
    id: string;
    name: string;
    slug: string;
    owner: {
        id: number;
        name: string;
        email: string;
    } | null;
    paid_balance_paise: number;
    promotional_balance_paise: number;
    total_balance_paise: number;
    paid_balance_formatted: string;
    promotional_balance_formatted: string;
    total_balance_formatted: string;
    last_transaction_at: string;
};

type TransactionItem = {
    id: string;
    organization_id: string;
    organization_name: string;
    type: string;
    balance_type: string;
    amount_paise: number;
    amount_formatted: string;
    description: string;
    reference_id: string | null;
    created_at: string;
};

type Props = {
    organizations: OrganizationWallet[];
    transactions: TransactionItem[];
    stats: {
        total_paid_formatted: string;
        total_promo_formatted: string;
        total_platform_balance_formatted: string;
        total_recharges_formatted: string;
        total_manual_credits_formatted: string;
    };
};

export default function AdminWallets({ organizations = [], transactions = [], stats }: Props) {
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState<'workspaces' | 'history'>('workspaces');

    // Credit Modal State
    const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);
    const [selectedOrgId, setSelectedOrgId] = useState<string>('');
    const [amountRupees, setAmountRupees] = useState('500');
    const [balanceType, setBalanceType] = useState<'paid' | 'promotional'>('paid');
    const [note, setNote] = useState('');
    const [referenceId, setReferenceId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const openCreditModalForOrg = (orgId: string) => {
        setSelectedOrgId(orgId);
        setAmountRupees('500');
        setBalanceType('paid');
        setNote('');
        setReferenceId('');
        setIsCreditModalOpen(true);
    };

    const openGenericCreditModal = () => {
        if (organizations.length > 0 && !selectedOrgId) {
            setSelectedOrgId(organizations[0].id);
        }
        setAmountRupees('500');
        setBalanceType('paid');
        setNote('');
        setReferenceId('');
        setIsCreditModalOpen(true);
    };

    const handleQuickAmount = (val: number) => {
        setAmountRupees(val.toString());
    };

    const handleCreditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedOrgId || !amountRupees) return;
        setIsSubmitting(true);

        router.post(
            '/admin/wallets/credit',
            {
                organization_id: selectedOrgId,
                amount_rupees: parseFloat(amountRupees),
                balance_type: balanceType,
                note: note || undefined,
                reference_id: referenceId || undefined,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsCreditModalOpen(false);
                },
                onFinish: () => setIsSubmitting(false),
            }
        );
    };

    const filteredOrganizations = useMemo(() => {
        return organizations.filter((org) => {
            return (
                org.name.toLowerCase().includes(search.toLowerCase()) ||
                org.slug.toLowerCase().includes(search.toLowerCase()) ||
                (org.owner?.name && org.owner.name.toLowerCase().includes(search.toLowerCase())) ||
                (org.owner?.email && org.owner.email.toLowerCase().includes(search.toLowerCase()))
            );
        });
    }, [organizations, search]);

    return (
        <>
            <Head title="Client Wallets & Manual Credits • Super Admin" />

            <div className="space-y-4 w-full max-w-7xl mx-auto pb-10">
                {/* Header Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card border border-border/70 rounded-2xl p-4 sm:p-5 shadow-2xs">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                                Wallets & Manual Credits
                            </h1>
                            <Badge variant="outline" className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25 text-[10px] font-bold uppercase tracking-wider">
                                Direct Ledger
                            </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Manually credit balance to any client wallet (Paid or Promotional), inspect client balances, and monitor transaction audit trails.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            onClick={openGenericCreditModal}
                            className="h-8 px-3 text-xs font-semibold gap-1.5 cursor-pointer rounded-xl bg-primary text-primary-foreground shadow-xs"
                        >
                            <Plus className="size-3.5" />
                            <span>Add Balance Manually</span>
                        </Button>
                    </div>
                </div>

                {/* Sleek, Compact Stat Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
                    <div className="flex items-center justify-between rounded-xl border border-border/70 bg-card px-3.5 py-2.5 shadow-2xs">
                        <div className="flex items-center gap-2">
                            <div className="size-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                                <Wallet className="size-3.5" />
                            </div>
                            <span className="text-xs font-medium text-muted-foreground">Total Balance</span>
                        </div>
                        <span className="text-base font-bold tabular-nums text-foreground">{stats.total_platform_balance_formatted}</span>
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3.5 py-2.5 shadow-2xs">
                        <div className="flex items-center gap-2">
                            <div className="size-7 rounded-lg bg-emerald-500/15 text-emerald-600 flex items-center justify-center">
                                <IndianRupee className="size-3.5" />
                            </div>
                            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Paid Balance</span>
                        </div>
                        <span className="text-base font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{stats.total_paid_formatted}</span>
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-amber-500/20 bg-amber-500/5 px-3.5 py-2.5 shadow-2xs">
                        <div className="flex items-center gap-2">
                            <div className="size-7 rounded-lg bg-amber-500/15 text-amber-600 flex items-center justify-center">
                                <Gift className="size-3.5" />
                            </div>
                            <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">Promotional</span>
                        </div>
                        <span className="text-base font-bold tabular-nums text-amber-600 dark:text-amber-400">{stats.total_promo_formatted}</span>
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-rose-500/20 bg-rose-500/5 px-3.5 py-2.5 shadow-2xs">
                        <div className="flex items-center gap-2">
                            <div className="size-7 rounded-lg bg-rose-500/15 text-rose-500 flex items-center justify-center">
                                <Sparkles className="size-3.5" />
                            </div>
                            <span className="text-xs font-semibold text-rose-700 dark:text-rose-400">Manual Credits</span>
                        </div>
                        <span className="text-base font-bold tabular-nums text-foreground">{stats.total_manual_credits_formatted}</span>
                    </div>
                </div>

                {/* Tab Switcher & Search Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 bg-card border border-border/70 rounded-xl p-2.5 shadow-2xs">
                    {/* Segmented Tab Switcher */}
                    <div className="inline-flex items-center gap-1 p-1 bg-muted/60 border border-border/60 rounded-xl w-full sm:w-auto">
                        <button
                            type="button"
                            onClick={() => setActiveTab('workspaces')}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                activeTab === 'workspaces'
                                    ? 'bg-background text-foreground shadow-xs border border-border/60'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            <Building2 className="size-3.5" />
                            <span>Client Wallets</span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                                activeTab === 'workspaces' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                            }`}>
                                {organizations.length}
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('history')}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                activeTab === 'history'
                                    ? 'bg-primary text-primary-foreground shadow-xs'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            <History className="size-3.5" />
                            <span>Transaction Audit</span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                                activeTab === 'history' ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'
                            }`}>
                                {transactions.length}
                            </span>
                        </button>
                    </div>

                    {activeTab === 'workspaces' && (
                        <div className="relative w-full sm:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                            <Input
                                placeholder="Search client workspace or owner..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9 h-8 text-xs bg-muted/40"
                            />
                        </div>
                    )}
                </div>

                {/* Tab 1: Client Wallets List */}
                {activeTab === 'workspaces' && (
                    <div className="rounded-xl border border-border/70 bg-card overflow-hidden shadow-2xs">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-muted/50 border-b border-border/70 text-muted-foreground uppercase tracking-wider text-[10px] font-semibold">
                                    <tr>
                                        <th className="py-2.5 px-3.5">Client Workspace</th>
                                        <th className="py-2.5 px-3.5">Owner Contact</th>
                                        <th className="py-2.5 px-3.5 whitespace-nowrap">Paid Balance</th>
                                        <th className="py-2.5 px-3.5 whitespace-nowrap">Promotional Balance</th>
                                        <th className="py-2.5 px-3.5 whitespace-nowrap">Total Balance</th>
                                        <th className="py-2.5 px-3.5 whitespace-nowrap">Last Activity</th>
                                        <th className="py-2.5 px-3.5 text-right whitespace-nowrap">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/60">
                                    {filteredOrganizations.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="py-8 text-center text-muted-foreground text-xs">
                                                No workspaces found matching search.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredOrganizations.map((org) => (
                                            <tr key={org.id} className="hover:bg-muted/30 transition-colors">
                                                <td className="py-2.5 px-3.5">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 font-bold text-xs uppercase shrink-0">
                                                            {org.name.slice(0, 2)}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="font-semibold text-foreground text-xs truncate max-w-[200px]">{org.name}</div>
                                                            <div className="text-[11px] text-muted-foreground">/{org.slug}</div>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="py-2.5 px-3.5">
                                                    {org.owner ? (
                                                        <div>
                                                            <div className="font-medium text-foreground text-xs">{org.owner.name}</div>
                                                            <div className="text-[11px] text-muted-foreground truncate max-w-[180px]">{org.owner.email}</div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground">—</span>
                                                    )}
                                                </td>

                                                <td className="py-2.5 px-3.5 whitespace-nowrap">
                                                    <span className="font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                                                        {org.paid_balance_formatted}
                                                    </span>
                                                </td>

                                                <td className="py-2.5 px-3.5 whitespace-nowrap">
                                                    <span className="font-semibold tabular-nums text-amber-600 dark:text-amber-400">
                                                        {org.promotional_balance_formatted}
                                                    </span>
                                                </td>

                                                <td className="py-2.5 px-3.5 font-bold tabular-nums text-foreground whitespace-nowrap">
                                                    {org.total_balance_formatted}
                                                </td>

                                                <td className="py-2.5 px-3.5 text-[11px] text-muted-foreground whitespace-nowrap">
                                                    {org.last_transaction_at || 'No activity'}
                                                </td>

                                                <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <Button
                                                            size="sm"
                                                            onClick={() => openCreditModalForOrg(org.id)}
                                                            className="h-7 text-xs px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1 cursor-pointer shadow-2xs"
                                                        >
                                                            <Plus className="size-3" />
                                                            <span>Add Credit</span>
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => router.post(`/admin/organizations/${org.id}/switch`)}
                                                            className="h-7 text-xs px-2 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
                                                            title="Switch into workspace"
                                                        >
                                                            <ExternalLink className="size-3" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Tab 2: Global Transaction History */}
                {activeTab === 'history' && (
                    <div className="rounded-xl border border-border/70 bg-card overflow-hidden shadow-2xs">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-muted/50 border-b border-border/70 text-muted-foreground uppercase tracking-wider text-[10px] font-semibold">
                                    <tr>
                                        <th className="py-2.5 px-3.5 whitespace-nowrap">Date & Time</th>
                                        <th className="py-2.5 px-3.5">Client Workspace</th>
                                        <th className="py-2.5 px-3.5 whitespace-nowrap">Type</th>
                                        <th className="py-2.5 px-3.5 whitespace-nowrap">Wallet Type</th>
                                        <th className="py-2.5 px-3.5 whitespace-nowrap">Amount</th>
                                        <th className="py-2.5 px-3.5">Description / Note</th>
                                        <th className="py-2.5 px-3.5 text-right whitespace-nowrap">Ref ID</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/60">
                                    {transactions.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="py-8 text-center text-muted-foreground text-xs">
                                                No transactions recorded yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        transactions.map((tx) => {
                                            const isCredit = !tx.type.includes('deduction');
                                            return (
                                                <tr key={tx.id} className="hover:bg-muted/30 transition-colors">
                                                    <td className="py-2.5 px-3.5 whitespace-nowrap text-[11px] text-muted-foreground font-medium">
                                                        {tx.created_at}
                                                    </td>
                                                    <td className="py-2.5 px-3.5">
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-xs uppercase shrink-0">
                                                                {(tx.organization_name || 'WS').slice(0, 2)}
                                                            </div>
                                                            <span className="font-semibold text-foreground text-xs whitespace-nowrap">
                                                                {tx.organization_name}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                                                        <Badge variant="outline" className="text-[10px] capitalize font-medium px-2 py-0.5">
                                                            {tx.type.replace('_', ' ')}
                                                        </Badge>
                                                    </td>
                                                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                                                        <Badge
                                                            variant="secondary"
                                                            className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full ${
                                                                tx.balance_type === 'paid'
                                                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                                                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                                            }`}
                                                        >
                                                            {tx.balance_type}
                                                        </Badge>
                                                    </td>
                                                    <td className="py-2.5 px-3.5 font-bold tabular-nums whitespace-nowrap text-xs">
                                                        <span className={isCredit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}>
                                                            {isCredit ? `+${tx.amount_formatted}` : `-${tx.amount_formatted}`}
                                                        </span>
                                                    </td>
                                                    <td className="py-2.5 px-3.5 text-xs text-muted-foreground max-w-sm truncate">
                                                        {tx.description}
                                                    </td>
                                                    <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                                                        {tx.reference_id ? (
                                                            <span
                                                                className="inline-block font-mono text-[10px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded border border-border/60 select-all"
                                                                title={tx.reference_id}
                                                            >
                                                                {tx.reference_id.length > 20
                                                                    ? `${tx.reference_id.slice(0, 8)}...${tx.reference_id.slice(-6)}`
                                                                    : tx.reference_id}
                                                            </span>
                                                        ) : (
                                                            <span className="text-muted-foreground text-xs">—</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Credit Wallet Manually Modal */}
                <Dialog open={isCreditModalOpen} onOpenChange={setIsCreditModalOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-base font-bold flex items-center gap-2">
                                <Sparkles className="size-4 text-emerald-600" />
                                <span>Credit Wallet Balance Manually</span>
                            </DialogTitle>
                            <DialogDescription className="text-xs">
                                Manually deposit Paid or Promotional credit into any client workspace's messaging wallet.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleCreditSubmit} className="space-y-3 pt-2">
                            <div className="space-y-1">
                                <Label className="text-xs">Select Client Workspace</Label>
                                <select
                                    value={selectedOrgId}
                                    onChange={(e) => setSelectedOrgId(e.target.value)}
                                    className="w-full h-8 text-xs rounded-lg border border-border bg-background px-2 font-medium"
                                    required
                                >
                                    <option value="" disabled>-- Select Workspace --</option>
                                    {organizations.map((org) => (
                                        <option key={org.id} value={org.id}>
                                            {org.name} (Total: {org.total_balance_formatted})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs">Amount in Rupees (₹ INR)</Label>
                                    <div className="flex items-center gap-1 text-[10px]">
                                        <button
                                            type="button"
                                            onClick={() => handleQuickAmount(200)}
                                            className="px-1.5 py-0.5 rounded bg-muted hover:bg-muted/80 text-foreground font-medium"
                                        >
                                            ₹200
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleQuickAmount(500)}
                                            className="px-1.5 py-0.5 rounded bg-muted hover:bg-muted/80 text-foreground font-medium"
                                        >
                                            ₹500
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleQuickAmount(1000)}
                                            className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-bold hover:bg-emerald-500/20"
                                        >
                                            ₹1,000
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleQuickAmount(5000)}
                                            className="px-1.5 py-0.5 rounded bg-muted hover:bg-muted/80 text-foreground font-medium"
                                        >
                                            ₹5,000
                                        </button>
                                    </div>
                                </div>
                                <Input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    max="500000"
                                    value={amountRupees}
                                    onChange={(e) => setAmountRupees(e.target.value)}
                                    placeholder="e.g. 500"
                                    className="h-8 text-xs font-bold"
                                    required
                                />
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs">Balance Type</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setBalanceType('paid')}
                                        className={`p-2.5 rounded-lg border text-left transition-all ${
                                            balanceType === 'paid'
                                                ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold'
                                                : 'border-border bg-card text-muted-foreground hover:bg-muted/40'
                                        }`}
                                    >
                                        <div className="text-xs flex items-center justify-between">
                                            <span>Paid Balance</span>
                                            {balanceType === 'paid' && <CheckCircle2 className="size-3.5" />}
                                        </div>
                                        <div className="text-[10px] font-normal opacity-80 mt-0.5">
                                            Actual payment / Bank transfer
                                        </div>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setBalanceType('promotional')}
                                        className={`p-2.5 rounded-lg border text-left transition-all ${
                                            balanceType === 'promotional'
                                                ? 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-400 font-semibold'
                                                : 'border-border bg-card text-muted-foreground hover:bg-muted/40'
                                        }`}
                                    >
                                        <div className="text-xs flex items-center justify-between">
                                            <span>Promotional</span>
                                            {balanceType === 'promotional' && <CheckCircle2 className="size-3.5" />}
                                        </div>
                                        <div className="text-[10px] font-normal opacity-80 mt-0.5">
                                            Trial / Bonus (used first)
                                        </div>
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs">Reason / Note (Optional)</Label>
                                <Input
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder="e.g. Bank RTGS received / Diwali festival bonus"
                                    className="h-8 text-xs"
                                />
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs">Reference ID / UPI Ref (Optional)</Label>
                                <Input
                                    value={referenceId}
                                    onChange={(e) => setReferenceId(e.target.value)}
                                    placeholder="e.g. UPI-20261126-0049"
                                    className="h-8 text-xs font-mono"
                                />
                            </div>

                            <DialogFooter className="pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsCreditModalOpen(false)}
                                    className="h-8 text-xs"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    size="sm"
                                    disabled={isSubmitting}
                                    className="h-8 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                                >
                                    {isSubmitting ? 'Crediting...' : `Deposit ₹${amountRupees || 0}`}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}
