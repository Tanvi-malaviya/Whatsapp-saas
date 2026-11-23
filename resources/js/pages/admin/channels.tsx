import { useState, useMemo } from 'react';
import { Head, Link } from '@inertiajs/react';
import {
    Smartphone,
    Search,
    Building2,
    ShieldCheck,
    CheckCircle2,
    AlertCircle,
    Radio,
    Sparkles,
    ExternalLink,
    X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

type ChannelItem = {
    id: string;
    organization_id: string;
    organization_name: string;
    organization_slug: string;
    name: string;
    phone_number: string;
    phone_number_id: string;
    waba_id: string;
    quality_rating: string;
    messaging_limit: string;
    status: string;
    is_default: boolean;
    webhook_verified: boolean;
    created_at: string;
};

type Props = {
    channels: ChannelItem[];
};

export default function AdminChannels({ channels = [] }: Props) {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'connected' | 'other'>('all');

    const connectedCount = useMemo(() => {
        return channels.filter((ch) => ch.status === 'connected').length;
    }, [channels]);

    const filtered = useMemo(() => {
        return channels.filter((ch) => {
            const matchesSearch =
                ch.phone_number.toLowerCase().includes(search.toLowerCase()) ||
                ch.name.toLowerCase().includes(search.toLowerCase()) ||
                ch.organization_name.toLowerCase().includes(search.toLowerCase()) ||
                ch.phone_number_id.includes(search) ||
                ch.waba_id.includes(search);

            if (!matchesSearch) return false;

            if (statusFilter === 'connected') return ch.status === 'connected';
            if (statusFilter === 'other') return ch.status !== 'connected';

            return true;
        });
    }, [channels, search, statusFilter]);

    return (
        <>
            <Head title="All WhatsApp Numbers - Super Admin" />

            <div className="space-y-3 w-full">
                {/* Compact Control Bar: Search & Status Filters */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                        <Input
                            placeholder="Search by phone, name, workspace, ID..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-8 pr-7 text-xs h-8 border-border/80"
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={() => setSearch('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                <X className="size-3.5" />
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-1.5 self-start sm:self-auto">
                        <button
                            type="button"
                            onClick={() => setStatusFilter('all')}
                            className={`h-7 px-2.5 rounded-md text-xs font-medium transition-all ${
                                statusFilter === 'all'
                                    ? 'bg-foreground text-background font-semibold shadow-2xs'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground border border-border/70'
                            }`}
                        >
                            All ({channels.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setStatusFilter('connected')}
                            className={`h-7 px-2.5 rounded-md text-xs font-medium transition-all flex items-center gap-1 ${
                                statusFilter === 'connected'
                                    ? 'bg-emerald-600 text-white font-semibold shadow-2xs'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground border border-border/70'
                            }`}
                        >
                            <span className="size-1.5 rounded-full bg-emerald-500" />
                            <span>Connected ({connectedCount})</span>
                        </button>
                        {channels.length - connectedCount > 0 && (
                            <button
                                type="button"
                                onClick={() => setStatusFilter('other')}
                                className={`h-7 px-2.5 rounded-md text-xs font-medium transition-all ${
                                    statusFilter === 'other'
                                        ? 'bg-amber-600 text-white font-semibold shadow-2xs'
                                        : 'text-muted-foreground hover:bg-muted hover:text-foreground border border-border/70'
                                }`}
                            >
                                Attention ({channels.length - connectedCount})
                            </button>
                        )}
                    </div>
                </div>

                {/* Channels Table */}
                <Card className="border-border/70 shadow-2xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-muted/40 border-b border-border text-[11px] uppercase font-semibold text-muted-foreground">
                                <tr>
                                    <th className="py-2 px-3">WhatsApp Phone Number</th>
                                    <th className="py-2 px-3">Client Workspace</th>
                                    <th className="py-2 px-3">Meta Credentials</th>
                                    <th className="py-2 px-3">Quality &amp; Tier</th>
                                    <th className="py-2 px-3">Status</th>
                                    <th className="py-2 px-3 text-right">Registered</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60">
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-8 text-center text-muted-foreground text-xs">
                                            No WhatsApp channels match your search.
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map((ch) => (
                                        <tr key={ch.id} className="hover:bg-muted/30 transition-colors">
                                            {/* Phone number & name */}
                                            <td className="py-2 px-3">
                                                <div className="font-semibold text-xs text-foreground flex items-center gap-1.5 font-mono leading-tight">
                                                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                                                    <span>{ch.phone_number || ch.name}</span>
                                                    {ch.is_default && (
                                                        <Badge variant="outline" className="text-[9px] px-1 py-0 bg-primary/10 text-primary border-primary/20 font-sans font-semibold">
                                                            DEFAULT
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                                                    {ch.name}
                                                </div>
                                            </td>

                                            {/* Organization */}
                                            <td className="py-2 px-3">
                                                <div className="font-medium text-xs text-foreground flex items-center gap-1 leading-tight">
                                                    <Building2 className="size-3 text-muted-foreground shrink-0" />
                                                    <span>{ch.organization_name}</span>
                                                </div>
                                                <div className="text-[10px] text-muted-foreground font-mono leading-tight mt-0.5">
                                                    /{ch.organization_slug}
                                                </div>
                                            </td>

                                            {/* Meta credentials */}
                                            <td className="py-2 px-3 font-mono text-[11px]">
                                                <div className="leading-tight text-foreground">
                                                    PID: <span className="text-muted-foreground">{ch.phone_number_id}</span>
                                                </div>
                                                <div className="leading-tight text-foreground mt-0.5">
                                                    WABA: <span className="text-muted-foreground">{ch.waba_id}</span>
                                                </div>
                                            </td>

                                            {/* Quality & Tier */}
                                            <td className="py-2 px-3">
                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 leading-none">
                                                    {ch.quality_rating}
                                                </span>
                                                <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                                                    {ch.messaging_limit}
                                                </div>
                                            </td>

                                            {/* Status */}
                                            <td className="py-2 px-3">
                                                {ch.status === 'connected' ? (
                                                    <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                                                        <CheckCircle2 className="size-3.5" />
                                                        Connected
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-semibold">
                                                        <AlertCircle className="size-3.5" />
                                                        {ch.status}
                                                    </span>
                                                )}
                                            </td>

                                            {/* Date */}
                                            <td className="py-2 px-3 text-right text-xs text-muted-foreground whitespace-nowrap">
                                                {ch.created_at}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </>
    );
}
