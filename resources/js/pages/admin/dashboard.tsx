import { Head, Link } from '@inertiajs/react';
import {
    Building2,
    Smartphone,
    Users,
    MessageSquare,
    ArrowRight,
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
            <Head title="Admin Dashboard - Super Admin" />

            <div className="space-y-3.5 w-full">
                {/* 4 Clickable Low-Profile Stat Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
                    {/* 1. Workspaces */}
                    <Link href="/admin/organizations" className="block group">
                        <Card className="border-border/70 shadow-2xs p-3 hover:border-primary/50 hover:bg-muted/15 transition-all">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
                                    Workspaces
                                </span>
                                <div className="size-6 rounded-md bg-primary/10 text-primary flex items-center justify-center group-hover:scale-105 transition-transform">
                                    <Building2 className="size-3.5" />
                                </div>
                            </div>
                            <div className="flex items-baseline justify-between mt-1">
                                <span className="text-xl font-bold text-foreground tracking-tight leading-none">
                                    {metrics.totalClients}
                                </span>
                                <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
                                    <span className="text-blue-600 font-semibold">{metrics.singleNumberClients} Single</span>
                                    <span className="text-muted-foreground/30">•</span>
                                    <span className="text-amber-600 font-semibold">{metrics.multiNumberClients} Multi</span>
                                </div>
                            </div>
                        </Card>
                    </Link>

                    {/* 2. WhatsApp Numbers */}
                    <Link href="/admin/channels" className="block group">
                        <Card className="border-border/70 shadow-2xs p-3 hover:border-emerald-500/50 hover:bg-muted/15 transition-all">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
                                    WhatsApp Numbers
                                </span>
                                <div className="size-6 rounded-md bg-emerald-500/10 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                                    <Smartphone className="size-3.5" />
                                </div>
                            </div>
                            <div className="flex items-baseline justify-between mt-1">
                                <span className="text-xl font-bold text-emerald-600 tracking-tight leading-none">
                                    {metrics.totalChannels}
                                </span>
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                    Active Live
                                </span>
                            </div>
                        </Card>
                    </Link>

                    {/* 3. Registered Users */}
                    <Link href="/admin/users" className="block group">
                        <Card className="border-border/70 shadow-2xs p-3 hover:border-indigo-500/50 hover:bg-muted/15 transition-all">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
                                    Registered Users
                                </span>
                                <div className="size-6 rounded-md bg-indigo-500/10 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                                    <Users className="size-3.5" />
                                </div>
                            </div>
                            <div className="flex items-baseline justify-between mt-1">
                                <span className="text-xl font-bold text-foreground tracking-tight leading-none">
                                    {metrics.totalUsers}
                                </span>
                                <span className="text-[10px] text-muted-foreground font-medium">All Accounts</span>
                            </div>
                        </Card>
                    </Link>

                    {/* 4. Total Messages */}
                    <div className="block">
                        <Card className="border-border/70 shadow-2xs p-3 hover:border-teal-500/50 hover:bg-muted/15 transition-all">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-muted-foreground">
                                    Total Messages
                                </span>
                                <div className="size-6 rounded-md bg-teal-500/10 text-teal-600 flex items-center justify-center">
                                    <MessageSquare className="size-3.5" />
                                </div>
                            </div>
                            <div className="flex items-baseline justify-between mt-1">
                                <span className="text-xl font-bold text-foreground tracking-tight leading-none">
                                    {metrics.totalMessages}
                                </span>
                                <span className="text-[10px] text-muted-foreground font-medium">Platform Traffic</span>
                            </div>
                        </Card>
                    </div>
                </div>

                {/* Two Column Layout: Recent Workspaces & Recent WhatsApp Numbers */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
                    {/* Recent Workspaces */}
                    <Card className="border-border/70 shadow-2xs">
                        <CardHeader className="flex flex-row items-center justify-between py-2.5 px-3.5 border-b border-border/60">
                            <CardTitle className="text-xs font-bold flex items-center gap-1.5">
                                <Building2 className="size-3.5 text-primary" />
                                <span>Recent Workspaces</span>
                            </CardTitle>
                            <Button variant="ghost" size="sm" asChild className="text-xs h-6 px-2 gap-1 text-primary hover:text-primary">
                                <Link href="/admin/organizations">
                                    <span>View All</span>
                                    <ArrowRight className="size-3" />
                                </Link>
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-border/60">
                                {recentOrganizations.length === 0 ? (
                                    <p className="p-6 text-xs text-muted-foreground text-center">No workspaces found.</p>
                                ) : (
                                    recentOrganizations.map((org) => (
                                        <div key={org.id} className="p-2.5 sm:p-3 flex items-center justify-between hover:bg-muted/30 transition-colors">
                                            <div className="flex items-center gap-2.5 min-w-0 pr-2">
                                                <div className="size-7 rounded-md bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                                                    {org.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-semibold text-xs text-foreground truncate flex items-center gap-1.5">
                                                        <span>{org.name}</span>
                                                        <span className="text-[10px] text-muted-foreground/60 font-mono">/{org.slug}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-muted-foreground">
                                                        <span>{org.channels_count} {org.channels_count === 1 ? 'Number' : 'Numbers'}</span>
                                                        <span className="text-muted-foreground/30">•</span>
                                                        <span className="capitalize">{org.subscription_plan}</span>
                                                        <span className="text-muted-foreground/30">•</span>
                                                        <span>{org.created_at}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1.5 shrink-0">
                                                {org.max_channels <= 0 ? (
                                                    <Badge variant="outline" className="text-[10px] bg-purple-500/10 text-purple-600 border-purple-500/20 font-semibold">
                                                        Unlimited
                                                    </Badge>
                                                ) : org.max_channels === 1 ? (
                                                    <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-600 border-blue-500/20 font-semibold">
                                                        Single (1)
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-semibold">
                                                        Multi ({org.max_channels})
                                                    </Badge>
                                                )}

                                                <Button size="sm" variant="outline" asChild className="h-6 px-2 text-xs font-medium border-border/80 hover:bg-muted">
                                                    <a
                                                        href={`/admin/organizations/${org.id}/switch`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        title="Open workspace in new tab"
                                                        className="gap-1 inline-flex items-center text-muted-foreground hover:text-foreground"
                                                    >
                                                        <span>Open</span>
                                                        <ExternalLink className="size-2.5 text-primary" />
                                                    </a>
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
                        <CardHeader className="flex flex-row items-center justify-between py-2.5 px-3.5 border-b border-border/60">
                            <CardTitle className="text-xs font-bold flex items-center gap-1.5">
                                <Smartphone className="size-3.5 text-emerald-600" />
                                <span>Recent WhatsApp Numbers</span>
                            </CardTitle>
                            <Button variant="ghost" size="sm" asChild className="text-xs h-6 px-2 gap-1 text-primary hover:text-primary">
                                <Link href="/admin/channels">
                                    <span>View All</span>
                                    <ArrowRight className="size-3" />
                                </Link>
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-border/60">
                                {recentChannels.length === 0 ? (
                                    <p className="p-6 text-xs text-muted-foreground text-center">No WhatsApp numbers connected yet.</p>
                                ) : (
                                    recentChannels.map((ch) => (
                                        <div key={ch.id} className="p-2.5 sm:p-3 flex items-center justify-between hover:bg-muted/30 transition-colors">
                                            <div className="flex items-center gap-2.5 min-w-0 pr-2">
                                                <div className="size-7 rounded-md bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                                                    <Smartphone className="size-3.5" />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-semibold text-xs text-foreground flex items-center gap-1.5 font-mono">
                                                        <span className="size-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                                                        <span className="truncate">{ch.phone_number || ch.name}</span>
                                                        {ch.is_default && (
                                                            <span className="text-[9px] bg-primary/10 text-primary px-1 rounded font-sans font-bold shrink-0">
                                                                DEFAULT
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                                                        {ch.organization_name}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <Badge
                                                    variant="outline"
                                                    className={`text-[10px] font-semibold ${
                                                        ch.status === 'connected'
                                                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                                            : 'bg-muted text-muted-foreground border-border'
                                                    }`}
                                                >
                                                    {ch.quality_rating}
                                                </Badge>

                                                <Button size="sm" variant="ghost" asChild className="h-6 px-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">
                                                    <Link href="/admin/channels" className="gap-1 inline-flex items-center">
                                                        <span>View</span>
                                                        <ArrowRight className="size-2.5" />
                                                    </Link>
                                                </Button>
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
