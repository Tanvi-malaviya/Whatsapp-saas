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

    const filtered = useMemo(() => {
        return channels.filter((ch) => {
            return (
                ch.phone_number.toLowerCase().includes(search.toLowerCase()) ||
                ch.name.toLowerCase().includes(search.toLowerCase()) ||
                ch.organization_name.toLowerCase().includes(search.toLowerCase()) ||
                ch.phone_number_id.includes(search) ||
                ch.waba_id.includes(search)
            );
        });
    }, [channels, search]);

    return (
        <>
            <Head title="All WhatsApp Numbers - Super Admin" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/70 pb-5">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            <Smartphone className="size-6 text-emerald-600" />
                            <span>Global WhatsApp Numbers</span>
                        </h1>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                            Master directory of all WhatsApp Cloud API numbers connected across all client organizations ({channels.length} Total).
                        </p>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by phone number, name, org, or Phone ID..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 text-sm h-9 border-border/80"
                    />
                </div>

                {/* Channels Table */}
                <Card className="border-border/70 shadow-2xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-muted/40 border-b border-border text-xs uppercase font-semibold text-muted-foreground">
                                <tr>
                                    <th className="py-3 px-4">WhatsApp Phone Number</th>
                                    <th className="py-3 px-4">Client Workspace</th>
                                    <th className="py-3 px-4">Meta Credentials</th>
                                    <th className="py-3 px-4">Quality &amp; Tier</th>
                                    <th className="py-3 px-4">Status</th>
                                    <th className="py-3 px-4 text-right">Registered</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60">
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-8 text-center text-muted-foreground text-sm">
                                            No WhatsApp channels match your search.
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map((ch) => (
                                        <tr key={ch.id} className="hover:bg-muted/30 transition-colors">
                                            {/* Phone number & name */}
                                            <td className="py-3.5 px-4">
                                                <div className="font-semibold text-foreground flex items-center gap-1.5 font-mono">
                                                    <span className="size-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                                    <span>{ch.phone_number || ch.name}</span>
                                                    {ch.is_default && (
                                                        <Badge variant="outline" className="text-[9px] bg-primary/10 text-primary border-primary/20 font-sans">
                                                            DEFAULT
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="text-xs text-muted-foreground mt-0.5">
                                                    {ch.name}
                                                </div>
                                            </td>

                                            {/* Organization */}
                                            <td className="py-3.5 px-4">
                                                <div className="font-medium text-xs text-foreground flex items-center gap-1">
                                                    <Building2 className="size-3 text-muted-foreground" />
                                                    <span>{ch.organization_name}</span>
                                                </div>
                                                <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                                                    /{ch.organization_slug}
                                                </div>
                                            </td>

                                            {/* Meta credentials */}
                                            <td className="py-3.5 px-4 font-mono text-xs">
                                                <div className="text-[11px] text-foreground">
                                                    PID: <span className="text-muted-foreground">{ch.phone_number_id}</span>
                                                </div>
                                                <div className="text-[11px] text-foreground mt-0.5">
                                                    WABA: <span className="text-muted-foreground">{ch.waba_id}</span>
                                                </div>
                                            </td>

                                            {/* Quality & Tier */}
                                            <td className="py-3.5 px-4">
                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                                    {ch.quality_rating}
                                                </span>
                                                <div className="text-[10px] text-muted-foreground mt-1">
                                                    {ch.messaging_limit}
                                                </div>
                                            </td>

                                            {/* Status */}
                                            <td className="py-3.5 px-4">
                                                {ch.status === 'connected' ? (
                                                    <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                                                        <CheckCircle2 className="size-3.5" />
                                                        Connected
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-xs text-amber-600 font-medium">
                                                        <AlertCircle className="size-3.5" />
                                                        {ch.status}
                                                    </span>
                                                )}
                                            </td>

                                            {/* Date */}
                                            <td className="py-3.5 px-4 text-right text-xs text-muted-foreground whitespace-nowrap">
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
