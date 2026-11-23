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
};

type Props = {
    organizations: OrgItem[];
    currentOrgId?: string;
};

export default function AdminOrganizations({
    organizations = [],
    currentOrgId,
}: Props) {
    const { flash } = usePage().props as any;

    const [search, setSearch] = useState('');
    const [filterPlan, setFilterPlan] = useState<'all' | 'single' | 'multi' | 'unlimited'>('all');
    const [selectedOrg, setSelectedOrg] = useState<OrgItem | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state
    const [formMaxChannels, setFormMaxChannels] = useState<number>(1);
    const [formPlan, setFormPlan] = useState<string>('starter');
    const [formStatus, setFormStatus] = useState<string>('active');

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
        router.post(`/admin/organizations/${orgId}/switch`);
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
                    <div className="w-full">
                        <table className="w-full text-left text-sm border-collapse table-auto">
                            <thead className="bg-muted/40 border-b border-border text-[11px] uppercase font-bold text-muted-foreground tracking-wider">
                                <tr>
                                    <th className="py-2.5 px-3">Workspace / Organization</th>
                                    <th className="py-2.5 px-3">Account Owner</th>
                                    <th className="py-2.5 px-3">WhatsApp Quota &amp; Plan</th>
                                    <th className="py-2.5 px-3">Connected Numbers</th>
                                    <th className="py-2.5 px-3">Status</th>
                                    <th className="py-2.5 px-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60">
                                {filteredOrgs.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-12 text-center text-muted-foreground text-sm">
                                            <Building2 className="size-8 mx-auto text-muted-foreground/40 mb-2" />
                                            <p className="font-semibold text-foreground">No organizations found</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">
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
                                                <td className="py-2.5 px-3">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="size-8.5 rounded-lg bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 border border-primary/20 text-primary font-bold text-sm flex items-center justify-center shrink-0 shadow-2xs">
                                                            {initial}
                                                        </div>
                                                        <div className="min-w-0 max-w-[200px]">
                                                            <div className="font-semibold text-xs sm:text-sm text-foreground flex items-center gap-1.5 truncate">
                                                                <span className="truncate">{org.name}</span>
                                                                {isCurrent && (
                                                                    <Badge
                                                                        variant="outline"
                                                                        className="text-[9px] bg-primary/15 text-primary border-primary/30 font-bold px-1 py-0 shrink-0"
                                                                    >
                                                                        ACTIVE
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-mono mt-0.5 truncate">
                                                                <span>/{org.slug}</span>
                                                                <span className="text-muted-foreground/40">•</span>
                                                                <span className="font-sans">{org.created_at}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Owner Column */}
                                                <td className="py-2.5 px-3">
                                                    {org.owner ? (
                                                        <div className="flex items-center gap-2">
                                                            <div className="size-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-foreground shrink-0 border border-border">
                                                                {org.owner.name.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div className="min-w-0 max-w-[150px]">
                                                                <div className="text-xs font-semibold text-foreground truncate">
                                                                    {org.owner.name}
                                                                </div>
                                                                <div className="text-[11px] text-muted-foreground truncate" title={org.owner.email}>
                                                                    {org.owner.email}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground italic">None assigned</span>
                                                    )}
                                                </td>

                                                {/* Plan & Quota Column */}
                                                <td className="py-2.5 px-3">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-1.5">
                                                            {isUnlimited ? (
                                                                <span className="inline-flex items-center gap-1 rounded bg-purple-500/10 px-1.5 py-0.5 text-[11px] font-bold text-purple-600 dark:text-purple-400 border border-purple-500/20">
                                                                    <Crown className="size-3" />
                                                                    Unlimited
                                                                </span>
                                                            ) : org.max_channels === 1 ? (
                                                                <span className="inline-flex items-center gap-1 rounded bg-blue-500/10 px-1.5 py-0.5 text-[11px] font-bold text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                                                    <Lock className="size-3" />
                                                                    Single (1 Max)
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                                                    <Sparkles className="size-3" />
                                                                    Multi ({org.max_channels} Max)
                                                                </span>
                                                            )}
                                                            <span className="text-[10px] text-muted-foreground capitalize">
                                                                ({org.subscription_plan})
                                                            </span>
                                                        </div>

                                                        {/* Usage Progress bar */}
                                                        <div className="w-28 space-y-0.5">
                                                            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                                                                <span>Used</span>
                                                                <span className="font-semibold text-foreground">
                                                                    {org.channels_count} / {isUnlimited ? '∞' : org.max_channels}
                                                                </span>
                                                            </div>
                                                            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
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
                                                <td className="py-2.5 px-3">
                                                    {org.channels.length === 0 ? (
                                                        <span className="text-xs text-muted-foreground italic">
                                                            No numbers
                                                        </span>
                                                    ) : (
                                                        <div className="flex items-center gap-1 flex-wrap">
                                                            <span
                                                                className="inline-flex items-center gap-1 text-[11px] font-mono bg-muted/80 px-1.5 py-0.5 rounded border border-border text-foreground shadow-2xs"
                                                                title={`Name: ${org.channels[0].name} | Phone ID: ${org.channels[0].phone_number_id}`}
                                                            >
                                                                <span className="size-1.5 rounded-full bg-emerald-500"></span>
                                                                <span>{org.channels[0].phone_number || org.channels[0].name}</span>
                                                            </span>
                                                            {org.channels.length > 1 && (
                                                                <span
                                                                    className="text-[10px] font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded border border-primary/20"
                                                                    title={org.channels.slice(1).map((c) => c.phone_number || c.name).join(', ')}
                                                                >
                                                                    +{org.channels.length - 1}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>

                                                {/* Status Column */}
                                                <td className="py-2.5 px-3">
                                                    {org.status === 'active' ? (
                                                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                                            <span className="size-1.5 rounded-full bg-emerald-500"></span>
                                                            <span>Active</span>
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400">
                                                            <span className="size-1.5 rounded-full bg-rose-500"></span>
                                                            <span>Suspended</span>
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Actions Column */}
                                                <td className="py-2.5 px-3 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <Button
                                                            size="sm"
                                                            variant="default"
                                                            onClick={() => openEditModal(org)}
                                                            className="h-7.5 px-2.5 text-xs font-semibold gap-1 bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xs"
                                                        >
                                                            <Sliders className="size-3" />
                                                            <span>Set Quota</span>
                                                        </Button>

                                                        {!isCurrent && (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => handleSwitchWorkspace(org.id)}
                                                                className="h-7.5 px-2 text-xs font-medium gap-1 text-muted-foreground hover:text-foreground border-border"
                                                                title="Switch into this client's workspace"
                                                            >
                                                                <ArrowRightLeft className="size-3 text-primary" />
                                                                <span>Switch</span>
                                                            </Button>
                                                        )}
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
                <DialogContent className="max-w-md p-6">
                    <DialogHeader>
                        <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 mb-2">
                            <Sliders className="size-5" />
                        </div>
                        <DialogTitle className="text-lg font-bold">
                            Configure WhatsApp Quota Limit
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Select single or multiple WhatsApp numbers allowed for{' '}
                            <strong className="text-foreground">{selectedOrg?.name}</strong>.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedOrg && (
                        <form onSubmit={handleSaveLimit} className="space-y-4 pt-2">
                            {/* Preset Buttons */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                                    Quick Presets
                                </Label>
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setFormMaxChannels(1);
                                            setFormPlan('single');
                                        }}
                                        className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-medium transition-all ${
                                            formMaxChannels === 1
                                                ? 'bg-blue-500/10 border-blue-500 text-blue-600 dark:text-blue-400 font-bold ring-2 ring-blue-500/20'
                                                : 'border-border/70 hover:bg-muted/50 text-foreground'
                                        }`}
                                    >
                                        <span className="text-lg font-extrabold">1</span>
                                        <span className="text-[11px]">Single Number</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setFormMaxChannels(2);
                                            setFormPlan('dual');
                                        }}
                                        className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-medium transition-all ${
                                            formMaxChannels === 2
                                                ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold ring-2 ring-emerald-500/20'
                                                : 'border-border/70 hover:bg-muted/50 text-foreground'
                                        }`}
                                    >
                                        <span className="text-lg font-extrabold">2</span>
                                        <span className="text-[11px]">Dual Numbers</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setFormMaxChannels(5);
                                            setFormPlan('multi');
                                        }}
                                        className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-medium transition-all ${
                                            formMaxChannels === 5
                                                ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold ring-2 ring-emerald-500/20'
                                                : 'border-border/70 hover:bg-muted/50 text-foreground'
                                        }`}
                                    >
                                        <span className="text-lg font-extrabold">5</span>
                                        <span className="text-[11px]">Multi (5 Nos)</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setFormMaxChannels(10);
                                            setFormPlan('enterprise');
                                        }}
                                        className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-medium transition-all ${
                                            formMaxChannels === 10
                                                ? 'bg-purple-500/10 border-purple-500 text-purple-600 dark:text-purple-400 font-bold ring-2 ring-purple-500/20'
                                                : 'border-border/70 hover:bg-muted/50 text-foreground'
                                        }`}
                                    >
                                        <span className="text-lg font-extrabold">10</span>
                                        <span className="text-[11px]">Enterprise (10)</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setFormMaxChannels(0);
                                            setFormPlan('unlimited');
                                        }}
                                        className={`col-span-2 flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-medium transition-all ${
                                            formMaxChannels === 0
                                                ? 'bg-purple-500/10 border-purple-500 text-purple-600 dark:text-purple-400 font-bold ring-2 ring-purple-500/20'
                                                : 'border-border/70 hover:bg-muted/50 text-foreground'
                                        }`}
                                    >
                                        <span className="text-lg font-extrabold">∞</span>
                                        <span className="text-[11px]">Unlimited Numbers (Master)</span>
                                    </button>
                                </div>
                            </div>

                            {/* Max Allowed Numbers Custom Input */}
                            <div className="space-y-1.5">
                                <Label htmlFor="max_channels" className="text-xs font-semibold">
                                    Custom WhatsApp Numbers Count
                                </Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        id="max_channels"
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={formMaxChannels}
                                        onChange={(e) => setFormMaxChannels(parseInt(e.target.value) || 0)}
                                        className="font-mono text-base font-bold"
                                        required
                                    />
                                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                                        (0 = Unlimited)
                                    </span>
                                </div>
                                <p className="text-[11px] text-muted-foreground">
                                    {formMaxChannels === 1
                                        ? 'Client is strictly locked to 1 WhatsApp number.'
                                        : formMaxChannels === 0
                                        ? 'Client can connect unlimited WhatsApp numbers.'
                                        : `Client can connect up to ${formMaxChannels} WhatsApp numbers.`}
                                </p>
                            </div>

                            {/* Subscription Plan Name */}
                            <div className="space-y-1.5">
                                <Label htmlFor="subscription_plan" className="text-xs font-semibold">
                                    Plan Tier Label
                                </Label>
                                <Input
                                    id="subscription_plan"
                                    type="text"
                                    value={formPlan}
                                    onChange={(e) => setFormPlan(e.target.value)}
                                    placeholder="starter, growth, enterprise..."
                                />
                            </div>

                            {/* Workspace Status */}
                            <div className="space-y-1.5">
                                <Label htmlFor="status" className="text-xs font-semibold">
                                    Workspace Status
                                </Label>
                                <select
                                    id="status"
                                    value={formStatus}
                                    onChange={(e) => setFormStatus(e.target.value)}
                                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-2xs font-medium"
                                >
                                    <option value="active">Active (Full Access)</option>
                                    <option value="suspended">Suspended (Access Disabled)</option>
                                </select>
                            </div>

                            <DialogFooter className="pt-3 gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsEditModalOpen(false)}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="font-bold bg-primary hover:bg-primary/90 text-primary-foreground"
                                >
                                    {isSubmitting ? 'Saving Changes...' : 'Save Limit Changes'}
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
