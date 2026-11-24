import { useState, useMemo } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import {
    Building2,
    Sliders,
    Search,
    ArrowRightLeft,
    CheckCircle2,
    Lock,
    Sparkles,
    Crown,
    Users,
    X,
    Radio,
    Shield,
    ExternalLink,
    AlertCircle,
    Check,
    Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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

type WhatsAppNumber = {
    id: string;
    name: string;
    phone_number: string;
    phone_number_id: string;
    quality_rating: string;
    status: string;
    is_default: boolean;
};

type OrgItem = {
    id: string;
    name: string;
    slug: string;
    billing_email: string | null;
    subscription_plan: string;
    max_channels: number;
    channels_count: number;
    users_count: number;
    status: string;
    created_at: string;
    channels: WhatsAppNumber[];
    owner: {
        id: number;
        name: string;
        email: string;
    } | null;
    b2b_agent?: {
        id: number;
        name: string;
        email: string;
    } | null;
    b2b_agent_id?: number | null;
};

type Props = {
    organizations: OrgItem[];
    b2bAgents?: Array<{ id: number; name: string; email: string }>;
    currentOrgId?: string;
};

export default function AdminOrganizations({
    organizations = [],
    b2bAgents = [],
    currentOrgId,
}: Props) {
    const { flash } = usePage().props as any;

    const [search, setSearch] = useState('');
    const [filterPlan, setFilterPlan] = useState<'all' | 'single' | 'multi' | 'unlimited'>('all');
    const [selectedOrg, setSelectedOrg] = useState<OrgItem | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Delete workspace state
    const [deleteOrgTarget, setDeleteOrgTarget] = useState<OrgItem | null>(null);
    const [isDeletingOrg, setIsDeletingOrg] = useState(false);

    const openDeleteOrgModal = (org: OrgItem) => {
        setDeleteOrgTarget(org);
    };

    const confirmDeleteOrg = () => {
        if (!deleteOrgTarget) return;
        setIsDeletingOrg(true);
        router.delete(`/admin/organizations/${deleteOrgTarget.id}`, {
            onSuccess: () => {
                setIsDeletingOrg(false);
                setDeleteOrgTarget(null);
            },
            onError: () => {
                setIsDeletingOrg(false);
            },
        });
    };

    // Form state
    const [formMaxChannels, setFormMaxChannels] = useState<number>(1);
    const [formPlan, setFormPlan] = useState<string>('starter');
    const [formStatus, setFormStatus] = useState<string>('active');
    const [formB2bAgentId, setFormB2bAgentId] = useState<number | null>(null);

    // Filter count metrics
    const singleCount = useMemo(() => {
        return organizations.filter((o) => o.max_channels === 1).length;
    }, [organizations]);

    const multiCount = useMemo(() => {
        return organizations.filter((o) => o.max_channels > 1 || o.max_channels <= 0).length;
    }, [organizations]);

    const openEditModal = (org: OrgItem) => {
        setSelectedOrg(org);
        setFormMaxChannels(org.max_channels);
        setFormPlan(org.subscription_plan || 'starter');
        setFormStatus(org.status || 'active');
        setFormB2bAgentId(org.b2b_agent_id ?? null);
        setIsEditModalOpen(true);
    };

    const handleSaveLimit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedOrg) return;

        setIsSubmitting(true);
        router.post(
            `/admin/organizations/${selectedOrg.id}/limit`,
            {
                max_channels: Number(formMaxChannels),
                subscription_plan: formPlan,
                status: formStatus,
                b2b_agent_id: formB2bAgentId,
            },
            {
                onFinish: () => {
                    setIsSubmitting(false);
                    setIsEditModalOpen(false);
                },
            }
        );
    };

    const handleSwitchWorkspace = (orgId: string) => {
        window.open(`/admin/organizations/${orgId}/switch`, '_blank');
    };

    const filteredOrgs = useMemo(() => {
        return organizations.filter((org) => {
            const matchesSearch =
                org.name.toLowerCase().includes(search.toLowerCase()) ||
                org.slug.toLowerCase().includes(search.toLowerCase()) ||
                (org.owner?.email && org.owner.email.toLowerCase().includes(search.toLowerCase())) ||
                org.channels.some((c) => c.phone_number.includes(search));

            if (!matchesSearch) return false;

            if (filterPlan === 'single') return org.max_channels === 1;
            if (filterPlan === 'multi') return org.max_channels > 1;
            if (filterPlan === 'unlimited') return org.max_channels <= 0;

            return true;
        });
    }, [organizations, search, filterPlan]);

    return (
        <>
            <Head title="Client Workspaces & Quotas - Super Admin" />

            <div className="space-y-6">
                {/* Flash Message */}
                {flash?.success && (
                    <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-sm text-emerald-600 dark:text-emerald-400 shadow-2xs">
                        <CheckCircle2 className="size-4 shrink-0" />
                        <span className="font-medium">{flash.success}</span>
                    </div>
                )}

                {/* Search Bar & Filter Segmented Controls */}
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-1">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by client name, email, or phone number..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 pr-8 text-sm h-9 border-border/80 bg-background"
                        />
                        {search && (
                            <button
                                onClick={() => setSearch('')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                <X className="size-3.5" />
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                            type="button"
                            onClick={() => setFilterPlan('all')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 border ${
                                filterPlan === 'all'
                                    ? 'bg-foreground text-background border-foreground shadow-2xs'
                                    : 'bg-card text-muted-foreground border-border/70 hover:bg-muted/70 hover:text-foreground'
                            }`}
                        >
                            <span>All Workspaces</span>
                            <span className="rounded-full bg-muted/40 px-1.5 py-0.2 text-[10px]">
                                {organizations.length}
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setFilterPlan('single')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 border ${
                                filterPlan === 'single'
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                                    : 'bg-card text-muted-foreground border-border/70 hover:bg-muted/70 hover:text-foreground'
                            }`}
                        >
                            <Lock className="size-3" />
                            <span>Single (1)</span>
                            <span className="rounded-full bg-muted/40 px-1.5 py-0.2 text-[10px]">
                                {singleCount}
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setFilterPlan('multi')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 border ${
                                filterPlan === 'multi'
                                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                                    : 'bg-card text-muted-foreground border-border/70 hover:bg-muted/70 hover:text-foreground'
                            }`}
                        >
                            <Sparkles className="size-3" />
                            <span>Multi (2+)</span>
                            <span className="rounded-full bg-muted/40 px-1.5 py-0.2 text-[10px]">
                                {multiCount}
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setFilterPlan('unlimited')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 border ${
                                filterPlan === 'unlimited'
                                    ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                                    : 'bg-card text-muted-foreground border-border/70 hover:bg-muted/70 hover:text-foreground'
                            }`}
                        >
                            <Crown className="size-3" />
                            <span>Unlimited</span>
                        </button>
                    </div>
                </div>

                {/* Workspaces Master Table */}
                <Card className="border-border/70 shadow-2xs overflow-hidden rounded-xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-muted/40 border-b border-border text-[11px] uppercase font-bold text-muted-foreground tracking-wider">
                                <tr>
                                    <th className="py-2.5 px-3">Workspace</th>
                                    <th className="py-2.5 px-3">Owner</th>
                                    <th className="py-2.5 px-3">WhatsApp Quota</th>
                                    <th className="py-2.5 px-3">Connected Numbers</th>
                                    <th className="py-2.5 px-3">Status</th>
                                    <th className="py-2.5 px-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60">
                                {filteredOrgs.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-10 text-center text-muted-foreground text-xs">
                                            <Building2 className="size-7 mx-auto text-muted-foreground/40 mb-1.5" />
                                            <p className="font-semibold text-foreground">No organizations found</p>
                                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                                Try adjusting your search query or filter.
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredOrgs.map((org) => {
                                        const isCurrent = org.id === currentOrgId;
                                        const isUnlimited = org.max_channels <= 0;
                                        const isAtLimit = !isUnlimited && org.channels_count >= org.max_channels;
                                        const usagePercent = isUnlimited
                                            ? 100
                                            : Math.min(100, Math.round((org.channels_count / org.max_channels) * 100));

                                        // Initial letter for workspace avatar
                                        const initial = org.name ? org.name.charAt(0).toUpperCase() : 'W';

                                        return (
                                            <tr key={org.id} className="hover:bg-muted/30 transition-colors group">
                                                {/* Workspace Column with Avatar */}
                                                <td className="py-2 px-3">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <div className="size-7 rounded-md bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 border border-primary/20 text-primary font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                                                            {initial}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="font-semibold text-xs text-foreground flex items-center gap-1.5 leading-tight">
                                                                <span className="truncate max-w-[130px] sm:max-w-[200px]">{org.name}</span>
                                                                {isCurrent && (
                                                                    <Badge
                                                                        variant="outline"
                                                                        className="text-[9px] bg-primary/15 text-primary border-primary/30 font-bold px-1 py-0 shrink-0"
                                                                    >
                                                                        ACTIVE
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono leading-tight mt-0.5 truncate">
                                                                <span>/{org.slug}</span>
                                                                <span className="text-muted-foreground/40">•</span>
                                                                <span className="font-sans">{org.created_at}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Owner Column */}
                                                <td className="py-2 px-3">
                                                    {org.owner ? (
                                                        <div className="flex items-center gap-1.5 min-w-0">
                                                            <div className="size-5 rounded-full bg-muted flex items-center justify-center text-[9px] font-bold text-foreground shrink-0 border border-border">
                                                                {org.owner.name.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="text-xs font-medium text-foreground truncate max-w-[120px] leading-tight">
                                                                    {org.owner.name}
                                                                </div>
                                                                <div className="text-[10px] text-muted-foreground truncate max-w-[120px] leading-tight mt-0.5" title={org.owner.email}>
                                                                    {org.owner.email}
                                                                </div>
                                                                {org.b2b_agent && (
                                                                    <div className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5 mt-0.5 truncate max-w-[120px]" title={`B2B Partner: ${org.b2b_agent.name}`}>
                                                                        <span>Partner: {org.b2b_agent.name}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[11px] text-muted-foreground italic">None assigned</span>
                                                    )}
                                                </td>

                                                {/* Plan & Quota Column */}
                                                <td className="py-2 px-3">
                                                    <div className="space-y-0.5">
                                                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                                                            {isUnlimited ? (
                                                                <span className="inline-flex items-center gap-1 rounded bg-purple-500/10 px-1.5 py-0.5 text-[10px] font-bold text-purple-600 dark:text-purple-400 border border-purple-500/20 whitespace-nowrap leading-none">
                                                                    <Crown className="size-2.5 shrink-0" />
                                                                    <span>Unlimited</span>
                                                                </span>
                                                            ) : org.max_channels === 1 ? (
                                                                <span className="inline-flex items-center gap-1 rounded bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400 border border-blue-500/20 whitespace-nowrap leading-none">
                                                                    <Lock className="size-2.5 shrink-0" />
                                                                    <span>Single (1)</span>
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 whitespace-nowrap leading-none">
                                                                    <Sparkles className="size-2.5 shrink-0" />
                                                                    <span>Multi ({org.max_channels})</span>
                                                                </span>
                                                            )}
                                                            <span className="text-[10px] text-muted-foreground capitalize truncate">
                                                                ({org.subscription_plan})
                                                            </span>
                                                        </div>

                                                        {/* Usage Progress bar */}
                                                        <div className="w-20 sm:w-24 space-y-0.5">
                                                            <div className="flex items-center justify-between text-[9px] text-muted-foreground leading-none">
                                                                <span>Used</span>
                                                                <span className="font-semibold text-foreground">
                                                                    {org.channels_count} / {isUnlimited ? '∞' : org.max_channels}
                                                                </span>
                                                            </div>
                                                            <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                                                                <div
                                                                    className={`h-full rounded-full transition-all ${
                                                                        isAtLimit
                                                                            ? 'bg-amber-500'
                                                                            : 'bg-emerald-500'
                                                                    }`}
                                                                    style={{ width: `${usagePercent}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Connected Numbers List */}
                                                <td className="py-2 px-3">
                                                    {org.channels.length === 0 ? (
                                                        <span className="text-xs text-muted-foreground italic">
                                                            No numbers
                                                        </span>
                                                    ) : (
                                                        <div className="flex items-center gap-1 whitespace-nowrap">
                                                            <span
                                                                className="inline-flex items-center gap-1 text-[11px] font-mono bg-muted/80 px-1.5 py-0.5 rounded border border-border text-foreground whitespace-nowrap shadow-2xs"
                                                                title={`Name: ${org.channels[0].name} | Phone ID: ${org.channels[0].phone_number_id}`}
                                                            >
                                                                <span className="size-1.5 rounded-full bg-emerald-500 shrink-0" />
                                                                <span className="whitespace-nowrap">{org.channels[0].phone_number || org.channels[0].name}</span>
                                                            </span>
                                                            {org.channels.length > 1 && (
                                                                <span
                                                                    className="text-[10px] font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded border border-primary/20 shrink-0"
                                                                    title={org.channels.slice(1).map((c) => c.phone_number || c.name).join(', ')}
                                                                >
                                                                    +{org.channels.length - 1}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>

                                                {/* Status Column */}
                                                <td className="py-2 px-3 whitespace-nowrap">
                                                    {org.status === 'active' ? (
                                                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                                            <span className="size-1.5 rounded-full bg-emerald-500" />
                                                            <span>Active</span>
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 dark:text-rose-400">
                                                            <span className="size-1.5 rounded-full bg-rose-500" />
                                                            <span>Suspended</span>
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Actions Column */}
                                                <td className="py-2 px-3 text-right whitespace-nowrap">
                                                    <div className="flex items-center justify-end gap-1 whitespace-nowrap">
                                                        <Button
                                                            size="sm"
                                                            variant="default"
                                                            onClick={() => openEditModal(org)}
                                                            className="h-7 px-2 text-xs font-semibold gap-1 bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xs"
                                                        >
                                                            <Sliders className="size-3" />
                                                            <span>Set Quota</span>
                                                        </Button>

                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            asChild
                                                            className="h-7 px-2 text-xs font-medium gap-1 text-muted-foreground hover:text-foreground border-border hover:bg-muted"
                                                            title={isCurrent ? "Open current workspace in new tab" : "Switch and open workspace in new tab"}
                                                        >
                                                            <a
                                                                href={`/admin/organizations/${org.id}/switch`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                            >
                                                                <ArrowRightLeft className="size-3 text-primary" />
                                                                <span>{isCurrent ? 'Open' : 'Switch'}</span>
                                                                <ExternalLink className="size-2.5 text-muted-foreground" />
                                                            </a>
                                                        </Button>

                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => openDeleteOrgModal(org)}
                                                            className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10"
                                                            title="Delete Workspace"
                                                        >
                                                            <Trash2 className="size-3.5" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

            {/* Set WhatsApp Quota Limit Modal Dialog */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="max-w-sm p-4 gap-3">
                    <DialogHeader className="pb-1">
                        <div className="flex items-center gap-2.5">
                            <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shrink-0">
                                <Sliders className="size-4" />
                            </div>
                            <div>
                                <DialogTitle className="text-sm font-bold text-foreground">
                                    Configure WhatsApp Quota
                                </DialogTitle>
                                <DialogDescription className="text-xs text-muted-foreground truncate max-w-[250px]">
                                    Workspace: <strong className="text-foreground">{selectedOrg?.name}</strong>
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    {selectedOrg && (
                        <form onSubmit={handleSaveLimit} className="space-y-3">
                            {/* Numbers Quota Limit */}
                            <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="max_channels" className="text-xs font-semibold text-foreground">
                                        WhatsApp Numbers Limit
                                    </Label>
                                    <span className="text-[11px] text-muted-foreground font-mono">
                                        (0 = Unlimited)
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Input
                                        id="max_channels"
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={formMaxChannels}
                                        onChange={(e) => setFormMaxChannels(parseInt(e.target.value) || 0)}
                                        className="font-mono text-sm font-bold h-8 flex-1"
                                        required
                                    />
                                    {/* 4 small inline shortcut chips */}
                                    <div className="flex items-center gap-1 shrink-0">
                                        {[
                                            { val: 1, label: '1' },
                                            { val: 2, label: '2' },
                                            { val: 5, label: '5' },
                                            { val: 0, label: '∞' },
                                        ].map((opt) => (
                                            <button
                                                key={opt.val}
                                                type="button"
                                                onClick={() => setFormMaxChannels(opt.val)}
                                                className={`size-7 rounded-md text-xs font-bold transition-all border ${
                                                    formMaxChannels === opt.val
                                                        ? 'bg-primary text-primary-foreground border-primary shadow-2xs'
                                                        : 'bg-muted/50 text-muted-foreground border-border/80 hover:bg-muted hover:text-foreground'
                                                }`}
                                                title={opt.val === 0 ? 'Unlimited' : `${opt.val} Numbers`}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <p className="text-[11px] text-muted-foreground leading-tight">
                                    {formMaxChannels === 1
                                        ? 'Single WhatsApp number allowed.'
                                        : formMaxChannels === 0
                                        ? 'Unlimited numbers allowed.'
                                        : `Up to ${formMaxChannels} WhatsApp numbers allowed.`}
                                </p>
                            </div>

                            {/* Plan Tier & Status in 2-column grid */}
                            <div className="grid grid-cols-2 gap-2.5">
                                <div className="space-y-1">
                                    <Label htmlFor="subscription_plan" className="text-xs font-semibold">
                                        Plan Tier
                                    </Label>
                                    <Input
                                        id="subscription_plan"
                                        type="text"
                                        value={formPlan}
                                        onChange={(e) => setFormPlan(e.target.value)}
                                        placeholder="starter, growth..."
                                        className="h-8 text-xs"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor="status" className="text-xs font-semibold">
                                        Status
                                    </Label>
                                    <select
                                        id="status"
                                        value={formStatus}
                                        onChange={(e) => setFormStatus(e.target.value)}
                                        className="w-full rounded-md border border-input bg-background px-2 h-8 text-xs font-medium shadow-2xs"
                                    >
                                        <option value="active">Active</option>
                                        <option value="suspended">Suspended</option>
                                    </select>
                                </div>
                            </div>

                            {/* Assigned B2B Partner */}
                            <div className="space-y-1">
                                <Label htmlFor="b2b_agent" className="text-xs font-semibold">
                                    Assigned B2B Partner / Reseller
                                </Label>
                                <select
                                    id="b2b_agent"
                                    value={formB2bAgentId ?? ''}
                                    onChange={(e) => setFormB2bAgentId(e.target.value ? Number(e.target.value) : null)}
                                    className="w-full rounded-md border border-input bg-background px-2 h-8 text-xs font-medium shadow-2xs"
                                >
                                    <option value="">None (Direct Platform Customer)</option>
                                    {b2bAgents.map((agent) => (
                                        <option key={agent.id} value={agent.id}>
                                            {agent.name} ({agent.email})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <DialogFooter className="pt-2 gap-2 border-t border-border/70 mt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsEditModalOpen(false)}
                                    disabled={isSubmitting}
                                    className="h-8 text-xs px-3"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="h-8 text-xs px-3.5 font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-2xs"
                                >
                                    {isSubmitting ? 'Saving...' : 'Save Limit Changes'}
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Client Workspace Confirmation Modal */}
            <Dialog open={!!deleteOrgTarget} onOpenChange={(open) => !open && setDeleteOrgTarget(null)}>
                <DialogContent className="max-w-md p-5 gap-4">
                    <DialogHeader className="pb-1">
                        <div className="flex items-center gap-2.5">
                            <div className="size-8 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0 border border-rose-500/20">
                                <Trash2 className="size-4" />
                            </div>
                            <div>
                                <DialogTitle className="text-base font-bold text-foreground">
                                    Delete Client Workspace
                                </DialogTitle>
                                <DialogDescription className="text-xs text-muted-foreground">
                                    Confirm workspace removal.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    {deleteOrgTarget && (
                        <div className="space-y-3">
                            <div className="rounded-lg bg-muted/60 border border-border/80 p-3 text-xs space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Workspace Name:</span>
                                    <span className="font-semibold text-foreground">{deleteOrgTarget.name}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Slug / URL:</span>
                                    <span className="font-mono text-foreground">/{deleteOrgTarget.slug}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Account Owner:</span>
                                    <span className="text-foreground">
                                        {deleteOrgTarget.owner ? deleteOrgTarget.owner.name : 'None assigned'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between pt-1 border-t border-border/60">
                                    <span className="text-muted-foreground">WhatsApp Numbers:</span>
                                    <span className="text-foreground font-semibold">
                                        {deleteOrgTarget.channels_count} connected
                                    </span>
                                </div>
                            </div>

                            <p className="text-xs text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg p-2.5">
                                ⚠️ Are you sure you want to delete this workspace? All connected WhatsApp numbers and team access for this workspace will be deleted.
                            </p>

                            <DialogFooter className="gap-2 pt-2 border-t border-border/70 mt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setDeleteOrgTarget(null)}
                                    disabled={isDeletingOrg}
                                    className="h-8 text-xs px-3"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    variant="destructive"
                                    disabled={isDeletingOrg}
                                    onClick={confirmDeleteOrg}
                                    className="h-8 text-xs px-3.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-2xs gap-1.5"
                                >
                                    <Trash2 className="size-3.5" />
                                    <span>{isDeletingOrg ? 'Deleting...' : 'Yes, Delete Workspace'}</span>
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
