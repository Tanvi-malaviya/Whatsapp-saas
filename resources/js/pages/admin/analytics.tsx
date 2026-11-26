import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    BarChart3,
    TrendingUp,
    Send,
    CheckCheck,
    Eye,
    XCircle,
    Calendar,
    Smartphone,
    Building2,
    RefreshCw,
    ShieldCheck,
    AlertTriangle,
    ArrowUpRight,
    Activity,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type DayMetric = {
    date: string;
    label: string;
    total: number;
    outbound: number;
    inbound: number;
    delivered: number;
    read: number;
    failed: number;
    delivery_rate: number;
};

type TopOrg = {
    id: string;
    name: string;
    channels_count: number;
    total_messages: number;
    outbound_messages: number;
    delivered_messages: number;
    delivery_rate: number;
};

type Props = {
    kpis: {
        total_messages: number;
        total_outbound: number;
        total_inbound: number;
        total_delivered: number;
        total_read: number;
        total_failed: number;
        delivery_rate: number;
        read_rate: number;
        failure_rate: number;
    };
    dailyUsage: DayMetric[];
    topOrganizations: TopOrg[];
    channelHealth: {
        green: number;
        yellow: number;
        red: number;
        connected: number;
        disconnected: number;
    };
};

export default function AdminAnalytics({ kpis, dailyUsage = [], topOrganizations = [], channelHealth }: Props) {
    const maxDayTotal = Math.max(...dailyUsage.map((d) => d.total), 1);

    return (
        <>
            <Head title="Platform Analytics & Daily Usage • Super Admin" />

            <div className="space-y-4 w-full max-w-7xl mx-auto pb-10">
                {/* Header Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card border border-border/70 rounded-2xl p-4 sm:p-5 shadow-2xs">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                                Analytics & Daily Usage Telemetry
                            </h1>
                            <Badge variant="outline" className="bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/25 text-[10px] font-bold uppercase tracking-wider">
                                Live Telemetry
                            </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Real-time platform messaging volume, daily dispatch trends, delivery success percentages, and client activity logs.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.reload()}
                            className="h-8 px-3 text-xs gap-1.5 cursor-pointer rounded-xl border-border/80"
                        >
                            <RefreshCw className="size-3.5" />
                            <span>Refresh Data</span>
                        </Button>
                    </div>
                </div>

                {/* Sleek, Compact Primary KPI Strip */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
                    <div className="flex items-center justify-between rounded-xl border border-border/70 bg-card px-3.5 py-2.5 shadow-2xs">
                        <div className="flex items-center gap-2">
                            <div className="size-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                                <Send className="size-3.5" />
                            </div>
                            <span className="text-xs font-medium text-muted-foreground">Total Outbound</span>
                        </div>
                        <span className="text-base font-bold tabular-nums text-foreground">{kpis.total_outbound.toLocaleString()}</span>
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3.5 py-2.5 shadow-2xs">
                        <div className="flex items-center gap-2">
                            <div className="size-7 rounded-lg bg-emerald-500/15 text-emerald-600 flex items-center justify-center">
                                <TrendingUp className="size-3.5" />
                            </div>
                            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Total Inbound</span>
                        </div>
                        <span className="text-base font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{kpis.total_inbound.toLocaleString()}</span>
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3.5 py-2.5 shadow-2xs">
                        <div className="flex items-center gap-2">
                            <div className="size-7 rounded-lg bg-emerald-500/15 text-emerald-600 flex items-center justify-center">
                                <CheckCheck className="size-3.5" />
                            </div>
                            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Delivery Rate</span>
                        </div>
                        <span className="text-base font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{kpis.delivery_rate}%</span>
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-sky-500/20 bg-sky-500/5 px-3.5 py-2.5 shadow-2xs">
                        <div className="flex items-center gap-2">
                            <div className="size-7 rounded-lg bg-sky-500/15 text-sky-600 flex items-center justify-center">
                                <Eye className="size-3.5" />
                            </div>
                            <span className="text-xs font-semibold text-sky-700 dark:text-sky-400">Read Rate</span>
                        </div>
                        <span className="text-base font-bold tabular-nums text-sky-600 dark:text-sky-400">{kpis.read_rate}%</span>
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-rose-500/20 bg-rose-500/5 px-3.5 py-2.5 shadow-2xs col-span-2 md:col-span-1">
                        <div className="flex items-center gap-2">
                            <div className="size-7 rounded-lg bg-rose-500/15 text-rose-600 flex items-center justify-center">
                                <XCircle className="size-3.5" />
                            </div>
                            <span className="text-xs font-semibold text-rose-700 dark:text-rose-400">Failure Rate</span>
                        </div>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-base font-bold tabular-nums text-rose-600 dark:text-rose-400">{kpis.failure_rate}%</span>
                            {kpis.total_failed > 0 && (
                                <span className="text-[10px] text-muted-foreground">({kpis.total_failed})</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Daily Usage Visual Trend Bar */}
                <Card className="shadow-2xs border-border/70 p-4">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                                <Activity className="size-4 text-primary" />
                                <span>Daily Message Volume (Last 14 Days)</span>
                            </h2>
                            <p className="text-xs text-muted-foreground">
                                Daily dispatch and inbound activity across all workspaces
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-7 sm:grid-cols-14 gap-1.5 pt-2 items-end h-36">
                        {dailyUsage.map((day) => {
                            const barHeightPercent = day.total > 0 ? Math.max(Math.round((day.total / maxDayTotal) * 100), 12) : 4;
                            return (
                                <div key={day.date} className="flex flex-col items-center gap-1.5 h-full justify-end group">
                                    <div className="text-[10px] font-bold text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                                        {day.total}
                                    </div>
                                    <div className="w-full bg-muted/60 rounded-t-md h-24 flex items-end overflow-hidden p-0.5">
                                        <div
                                            className="w-full bg-primary/80 hover:bg-primary rounded-t-sm transition-all"
                                            style={{ height: `${barHeightPercent}%` }}
                                            title={`${day.label} (${day.date}): ${day.total} total (${day.outbound} out, ${day.inbound} in)`}
                                        />
                                    </div>
                                    <span className="text-[10px] font-medium text-muted-foreground truncate w-full text-center">
                                        {day.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </Card>

                {/* Day-by-Day Detailed Table */}
                <Card className="shadow-2xs border-border/70 overflow-hidden">
                    <CardHeader className="p-3.5 pb-2 border-b border-border/70 bg-muted/30">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Day-by-Day Message Dispatch Telemetry
                        </CardTitle>
                    </CardHeader>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-muted/50 border-b border-border/70 text-muted-foreground uppercase tracking-wider text-[10px] font-semibold">
                                <tr>
                                    <th className="py-2.5 px-3">Date</th>
                                    <th className="py-2.5 px-3">Total Messages</th>
                                    <th className="py-2.5 px-3">Outbound Sent</th>
                                    <th className="py-2.5 px-3">Inbound Received</th>
                                    <th className="py-2.5 px-3">Delivered</th>
                                    <th className="py-2.5 px-3">Read</th>
                                    <th className="py-2.5 px-3">Failed</th>
                                    <th className="py-2.5 px-3 text-right">Delivery Rate</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60">
                                {dailyUsage.map((day) => (
                                    <tr key={day.date} className="hover:bg-muted/30 transition-colors">
                                        <td className="py-2.5 px-3 font-semibold text-foreground">
                                            {day.label}
                                            <span className="text-[10px] font-normal text-muted-foreground ml-1.5">
                                                ({day.date})
                                            </span>
                                        </td>
                                        <td className="py-2.5 px-3 font-bold tabular-nums text-foreground">
                                            {day.total}
                                        </td>
                                        <td className="py-2.5 px-3 font-medium tabular-nums text-primary">
                                            {day.outbound}
                                        </td>
                                        <td className="py-2.5 px-3 font-medium tabular-nums text-emerald-600 dark:text-emerald-400">
                                            {day.inbound}
                                        </td>
                                        <td className="py-2.5 px-3 tabular-nums text-muted-foreground">
                                            {day.delivered}
                                        </td>
                                        <td className="py-2.5 px-3 tabular-nums text-muted-foreground">
                                            {day.read}
                                        </td>
                                        <td className="py-2.5 px-3 tabular-nums">
                                            <span className={day.failed > 0 ? 'text-rose-600 font-bold' : 'text-muted-foreground'}>
                                                {day.failed}
                                            </span>
                                        </td>
                                        <td className="py-2.5 px-3 text-right font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                                            {day.delivery_rate}%
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* Bottom Row: Top Workspaces & Channel Health */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                    {/* Top Workspaces Table */}
                    <Card className="shadow-2xs border-border/70 lg:col-span-2 overflow-hidden">
                        <CardHeader className="p-3.5 pb-2 border-b border-border/70 bg-muted/30">
                            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                <Building2 className="size-3.5 text-primary" />
                                <span>Top Active Workspaces by Message Volume</span>
                            </CardTitle>
                        </CardHeader>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-muted/50 border-b border-border/70 text-muted-foreground uppercase tracking-wider text-[10px] font-semibold">
                                    <tr>
                                        <th className="py-2 px-3">Rank</th>
                                        <th className="py-2 px-3">Workspace Name</th>
                                        <th className="py-2 px-3">Numbers</th>
                                        <th className="py-2 px-3">Total Sent</th>
                                        <th className="py-2 px-3">Delivered</th>
                                        <th className="py-2 px-3 text-right">Success Rate</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/60">
                                    {topOrganizations.map((org, index) => (
                                        <tr key={org.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="py-2.5 px-3 text-muted-foreground font-mono text-[11px]">
                                                #{index + 1}
                                            </td>
                                            <td className="py-2.5 px-3 font-semibold text-foreground">
                                                {org.name}
                                            </td>
                                            <td className="py-2.5 px-3 text-muted-foreground">
                                                {org.channels_count}
                                            </td>
                                            <td className="py-2.5 px-3 font-bold tabular-nums text-primary">
                                                {org.outbound_messages}
                                            </td>
                                            <td className="py-2.5 px-3 tabular-nums text-muted-foreground">
                                                {org.delivered_messages}
                                            </td>
                                            <td className="py-2.5 px-3 text-right font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                                                {org.delivery_rate}%
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    {/* WhatsApp Channel Health */}
                    <Card className="shadow-2xs border-border/70 p-4 space-y-3">
                        <div className="flex items-center justify-between border-b border-border/70 pb-2">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                <Smartphone className="size-3.5 text-primary" />
                                <span>Channel Health Matrix</span>
                            </h3>
                        </div>

                        <div className="space-y-2.5 text-xs">
                            <div className="flex items-center justify-between p-2 bg-emerald-500/10 rounded-lg text-emerald-700 dark:text-emerald-400 font-medium">
                                <span className="flex items-center gap-1.5">
                                    <span className="size-2 rounded-full bg-emerald-500" />
                                    Green (High Quality Rating)
                                </span>
                                <span className="font-bold">{channelHealth.green} numbers</span>
                            </div>

                            <div className="flex items-center justify-between p-2 bg-amber-500/10 rounded-lg text-amber-700 dark:text-amber-400 font-medium">
                                <span className="flex items-center gap-1.5">
                                    <span className="size-2 rounded-full bg-amber-500" />
                                    Yellow (Medium Quality Rating)
                                </span>
                                <span className="font-bold">{channelHealth.yellow} numbers</span>
                            </div>

                            <div className="flex items-center justify-between p-2 bg-rose-500/10 rounded-lg text-rose-700 dark:text-rose-400 font-medium">
                                <span className="flex items-center gap-1.5">
                                    <span className="size-2 rounded-full bg-rose-500" />
                                    Red (Low Quality / At Risk)
                                </span>
                                <span className="font-bold">{channelHealth.red} numbers</span>
                            </div>

                            <div className="border-t border-border/70 pt-2.5 flex items-center justify-between text-muted-foreground text-[11px]">
                                <span>Connected Numbers:</span>
                                <span className="font-semibold text-foreground">{channelHealth.connected}</span>
                            </div>

                            <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                                <span>Disconnected Numbers:</span>
                                <span className="font-semibold text-rose-600">{channelHealth.disconnected}</span>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </>
    );
}
