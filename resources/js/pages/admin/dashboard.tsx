import { Head, Link } from '@inertiajs/react';
import {
    Building2,
    Smartphone,
    Users,
    MessageSquare,
    Radio,
    Crown,
    ArrowRight,
    Sliders,
    Sparkles,
    ShieldCheck,
    CheckCircle2,
    ExternalLink,
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
    recentOrganizations = [],
    recentChannels = [],
}: Props) {
    return (
        <>
            <Head title="Super Admin Dashboard" />

            <div className="space-y-6">
                {/* Header Welcome Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white shadow-lg border border-slate-700/50">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-300 border border-rose-500/30 uppercase tracking-wider">
                                Standalone Admin Portal
                            </span>
                            <span className="text-xs text-slate-400">• Sathwara InfoTech Cloud</span>
                        </div>
                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                            Master Control Center
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
                            Configure client WhatsApp number quotas (Single vs Multi-Number plans), monitor Meta API connections, and oversee all platform accounts.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <Button
                            asChild
                            className="bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-md shadow-rose-600/30"
                        >
                            <Link href="/admin/organizations">
                                <Sliders className="size-3.5 mr-1.5" />
                                <span>Configure Client Quotas</span>
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* KPI Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    <Card className="border-border/70 shadow-2xs">
                        <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0 p-3">
                            <CardTitle className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                Total Clients
                            </CardTitle>
                            <Building2 className="size-3.5 text-primary" />
                        </CardHeader>
                        <CardContent className="p-3 pt-0">
                            <div className="text-xl font-bold text-foreground">{metrics.totalClients}</div>
                            <p className="text-[10px] text-muted-foreground mt-0.5">Workspaces</p>
                        </CardContent>
                    </Card>

                    <Card className="border-border/70 shadow-2xs">
                        <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0 p-3">
                            <CardTitle className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                Numbers Live
                            </CardTitle>
                            <Smartphone className="size-3.5 text-emerald-600" />
                        </CardHeader>
                        <CardContent className="p-3 pt-0">
                            <div className="text-xl font-bold text-emerald-600">{metrics.totalChannels}</div>
                            <p className="text-[10px] text-muted-foreground mt-0.5">Cloud API Channels</p>
                        </CardContent>
                    </Card>

                    <Card className="border-border/70 shadow-2xs">
                        <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0 p-3">
                            <CardTitle className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                Single Number
                            </CardTitle>
                            <Radio className="size-3.5 text-blue-600" />
                        </CardHeader>
                        <CardContent className="p-3 pt-0">
                            <div className="text-xl font-bold text-blue-600">{metrics.singleNumberClients}</div>
                            <p className="text-[10px] text-muted-foreground mt-0.5">1-Number Limit</p>
                        </CardContent>
                    </Card>

                    <Card className="border-border/70 shadow-2xs">
                        <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0 p-3">
                            <CardTitle className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                Multi Number
                            </CardTitle>
                            <Crown className="size-3.5 text-amber-500" />
                        </CardHeader>
                        <CardContent className="p-3 pt-0">
                            <div className="text-xl font-bold text-amber-500">{metrics.multiNumberClients}</div>
                            <p className="text-[10px] text-muted-foreground mt-0.5">2+ or Unlimited</p>
                        </CardContent>
                    </Card>

                    <Card className="border-border/70 shadow-2xs">
                        <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0 p-3">
                            <CardTitle className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                Total Users
                            </CardTitle>
                            <Users className="size-3.5 text-indigo-500" />
                        </CardHeader>
                        <CardContent className="p-3 pt-0">
                            <div className="text-xl font-bold text-foreground">{metrics.totalUsers}</div>
                            <p className="text-[10px] text-muted-foreground mt-0.5">Registered accounts</p>
                        </CardContent>
                    </Card>

                    <Card className="border-border/70 shadow-2xs">
                        <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0 p-3">
                            <CardTitle className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                Total Chats
                            </CardTitle>
                            <MessageSquare className="size-3.5 text-teal-500" />
                        </CardHeader>
                        <CardContent className="p-3 pt-0">
                            <div className="text-xl font-bold text-foreground">{metrics.totalMessages}</div>
                            <p className="text-[10px] text-muted-foreground mt-0.5">System messages</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Two Column Layout: Recent Clients & Recent Numbers */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Clients */}
                    <Card className="border-border/70 shadow-2xs">
                        <CardHeader className="flex flex-row items-center justify-between pb-3">
                            <div>
                                <CardTitle className="text-base font-bold flex items-center gap-2">
                                    <Building2 className="size-4 text-primary" />
                                    <span>Recent Client Workspaces</span>
                                </CardTitle>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Configured WhatsApp quotas per workspace
                                </p>
                            </div>
                            <Button variant="ghost" size="sm" asChild className="text-xs h-7 gap-1 text-primary">
                                <Link href="/admin/organizations">
                                    <span>View All</span>
                                    <ArrowRight className="size-3" />
                                </Link>
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-border/60">
                                {recentOrganizations.length === 0 ? (
                                    <p className="p-4 text-xs text-muted-foreground text-center">No organizations found.</p>
                                ) : (
                                    recentOrganizations.map((org) => (
                                        <div key={org.id} className="p-3.5 flex items-center justify-between hover:bg-muted/30 transition-colors">
                                            <div>
                                                <div className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                                                    <span>{org.name}</span>
                                                    <span className="text-[10px] text-muted-foreground font-mono">/{org.slug}</span>
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[11px] text-muted-foreground">
                                                        Numbers: <strong>{org.channels_count}</strong>
                                                    </span>
                                                    <span className="text-muted-foreground/40">•</span>
                                                    <span className="text-[11px] text-muted-foreground capitalize">
                                                        Plan: <strong>{org.subscription_plan}</strong>
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {org.max_channels <= 0 ? (
                                                    <Badge variant="outline" className="text-[10px] bg-purple-500/10 text-purple-600 border-purple-500/20">
                                                        Unlimited
                                                    </Badge>
                                                ) : org.max_channels === 1 ? (
                                                    <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-600 border-blue-500/20 font-bold">
                                                        Single Number (1)
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold">
                                                        Multi ({org.max_channels})
                                                    </Badge>
                                                )}
                                                <Button size="sm" variant="outline" asChild className="h-7 text-xs px-2">
                                                    <Link href="/admin/organizations">Edit</Link>
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
                        <CardHeader className="flex flex-row items-center justify-between pb-3">
                            <div>
                                <CardTitle className="text-base font-bold flex items-center gap-2">
                                    <Smartphone className="size-4 text-emerald-600" />
                                    <span>Recent WhatsApp Channels</span>
                                </CardTitle>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Meta Cloud API connected phone numbers
                                </p>
                            </div>
                            <Button variant="ghost" size="sm" asChild className="text-xs h-7 gap-1 text-primary">
                                <Link href="/admin/channels">
                                    <span>View All</span>
                                    <ArrowRight className="size-3" />
                                </Link>
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-border/60">
                                {recentChannels.length === 0 ? (
                                    <p className="p-4 text-xs text-muted-foreground text-center">No WhatsApp numbers connected yet.</p>
                                ) : (
                                    recentChannels.map((ch) => (
                                        <div key={ch.id} className="p-3.5 flex items-center justify-between hover:bg-muted/30 transition-colors">
                                            <div>
                                                <div className="font-semibold text-xs text-foreground flex items-center gap-1.5 font-mono">
                                                    <span className="size-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                                    <span>{ch.phone_number || ch.name}</span>
                                                    {ch.is_default && (
                                                        <span className="text-[9px] bg-primary/10 text-primary px-1 rounded font-sans font-bold">
                                                            DEFAULT
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-[11px] text-muted-foreground mt-1">
                                                    Workspace: <strong className="text-foreground">{ch.organization_name}</strong>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                                    {ch.quality_rating}
                                                </span>
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
