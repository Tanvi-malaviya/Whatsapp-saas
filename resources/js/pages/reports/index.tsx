import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    BarChart3,
    ArrowLeft,
    TrendingUp,
    MessageSquare,
    Zap,
    Download,
    PieChart,
    Send,
    Eye,
    Percent,
    ShieldCheck,
    RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type CampaignMetric = {
    id: string;
    name: string;
    category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
    total_contacts: number;
    sent_count: number;
    delivered_count: number;
    read_count: number;
    delivery_rate: number;
    read_rate: number;
    cost_inr: number;
    status: string;
    created_at: string;
};

type DailyTrend = {
    day: string;
    date: string;
    marketingCost: number;
    utilityCost: number;
    sent: number;
};

type Props = {
    metrics: {
        total_sent: number;
        total_delivered: number;
        total_read: number;
        overall_delivery_rate: number;
        overall_read_rate: number;
        total_cost_inr: number;
        marketing_cost_inr: number;
        utility_cost_inr: number;
        currency: string;
        active_tier: string;
    };
    rates: {
        marketing: number;
        utility: number;
        auth: number;
        service: number;
    };
    dailyTrends: DailyTrend[];
    campaigns: CampaignMetric[];
    last_synced_at?: string;
};

export default function ReportsIndex({
    metrics,
    rates,
    dailyTrends = [],
    campaigns = [],
    last_synced_at,
}: Props) {
    const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'MARKETING' | 'UTILITY'>('ALL');
    const [isSyncing, setIsSyncing] = useState(false);

    const handleSync = () => {
        setIsSyncing(true);
        router.post('/reports/sync', {}, {
            preserveScroll: true,
            onFinish: () => {
                setIsSyncing(false);
            },
        });
    };

    // Filter campaigns
    const filteredCampaigns = campaigns.filter(
        (c) => selectedCategory === 'ALL' || c.category === selectedCategory
    );

    const maxDailyCost = Math.max(
        ...dailyTrends.map((d) => d.marketingCost + d.utilityCost),
        1
    );

    const peakDay = dailyTrends.reduce(
        (max, cur) => (cur.marketingCost + cur.utilityCost > max.marketingCost + max.utilityCost ? cur : max),
        dailyTrends[0]
    );
    const peakDayCost = peakDay ? peakDay.marketingCost + peakDay.utilityCost : 0;

    const marketingPercentage =
        metrics.total_cost_inr > 0
            ? Math.round((metrics.marketing_cost_inr / metrics.total_cost_inr) * 100)
            : 0;
    const utilityPercentage = metrics.total_cost_inr > 0 ? (100 - marketingPercentage) : 0;

    const handleExportCSV = () => {
        const headers = ['Campaign Name', 'Category', 'Sent', 'Delivered', 'Read', 'Delivery Rate (%)', 'Read Rate (%)', 'Meta Cost (INR)', 'Date'];
        const rows = campaigns.map((c) => [
            `"${c.name.replace(/"/g, '""')}"`,
            c.category,
            c.sent_count,
            c.delivered_count,
            c.read_count,
            c.delivery_rate,
            c.read_rate,
            c.cost_inr,
            c.created_at,
        ]);

        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `meta_whatsapp_cost_report_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <>
            <Head title="Meta Template Cost & Analytics | WhatsApp SaaS" />

            <div className="flex flex-1 flex-col gap-3 p-3 sm:p-4 md:p-5 max-w-7xl mx-auto w-full font-sans">
                {/* 1. Sleek Compact Header */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2 border-b border-border/60">
                    <div className="flex items-center gap-2 flex-wrap">
                        <Button variant="ghost" size="sm" asChild className="h-7 text-xs text-muted-foreground px-1.5 hover:text-foreground">
                            <Link href="/dashboard">
                                <ArrowLeft className="size-3.5 mr-1" />
                                Dashboard
                            </Link>
                        </Button>
                        <span className="text-muted-foreground/40 text-xs">/</span>
                        <div className="flex items-center gap-1.5">
                            <div className="flex size-6 items-center justify-center rounded-md bg-primary text-white">
                                <BarChart3 className="size-3.5" />
                            </div>
                            <h1 className="text-sm sm:text-base font-bold text-foreground tracking-tight">
                                Meta Template Cost &amp; Analytics
                            </h1>
                        </div>
                        <Badge variant="outline" className="text-[10px] h-5 py-0 px-1.5 font-medium border-primary/30 bg-primary/5 text-primary">
                            Meta India Pricing
                        </Badge>
                    </div>

                    <div className="flex items-center gap-2">
                        {last_synced_at && (
                            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                                <span className="inline-block size-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                Synced: <span className="font-medium text-foreground">{last_synced_at}</span>
                            </span>
                        )}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleSync}
                            disabled={isSyncing}
                            className="h-7 text-xs px-2.5 border-emerald-500/30 bg-emerald-50/60 hover:bg-emerald-100/60 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 gap-1.5 font-medium shadow-none transition-all"
                        >
                            <RefreshCw className={`size-3 ${isSyncing ? 'animate-spin' : ''}`} />
                            {isSyncing ? 'Syncing...' : 'Real-Time Meta Sync'}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleExportCSV}
                            className="h-7 text-xs px-2.5 border-border gap-1 font-medium shadow-none hover:bg-muted"
                        >
                            <Download className="size-3" />
                            Export CSV
                        </Button>
                    </div>
                </div>

                {/* 2. Top Summary KPI Cards (Ultra-Compact Sleek Row) */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                    {/* Total Meta Cost */}
                    <div className="border border-border/60 bg-card/90 hover:bg-card px-2.5 py-1.5 rounded-md flex items-center justify-between transition-colors shadow-none">
                        <div className="min-w-0">
                            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide truncate">
                                Total Meta Spent
                            </div>
                            <div className="text-base font-bold text-foreground leading-tight">
                                ₹{metrics.total_cost_inr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </div>
                            <div className="text-[9.5px] text-muted-foreground leading-none mt-0.5 truncate">
                                <span className="text-emerald-600 font-semibold">Mkt: ₹{metrics.marketing_cost_inr}</span>
                                <span className="mx-1">•</span>
                                <span className="text-blue-600 font-semibold">Util: ₹{metrics.utility_cost_inr}</span>
                            </div>
                        </div>
                        <div className="flex size-6 shrink-0 items-center justify-center rounded bg-amber-500/10 text-amber-600 ml-2">
                            <Zap className="size-3" />
                        </div>
                    </div>

                    {/* Messages Delivered */}
                    <div className="border border-border/60 bg-card/90 hover:bg-card px-2.5 py-1.5 rounded-md flex items-center justify-between transition-colors shadow-none">
                        <div className="min-w-0">
                            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide truncate">
                                Delivered
                            </div>
                            <div className="text-base font-bold text-foreground leading-tight">
                                {metrics.total_delivered.toLocaleString('en-IN')}{' '}
                                <span className="text-[11px] font-normal text-muted-foreground">/ {metrics.total_sent}</span>
                            </div>
                            <div className="text-[9.5px] text-primary font-semibold leading-none mt-0.5 flex items-center gap-0.5 truncate">
                                <TrendingUp className="size-2.5 shrink-0" />
                                {metrics.overall_delivery_rate}% Success
                            </div>
                        </div>
                        <div className="flex size-6 shrink-0 items-center justify-center rounded bg-primary/10 text-primary ml-2">
                            <Send className="size-3" />
                        </div>
                    </div>

                    {/* Read Rate */}
                    <div className="border border-border/60 bg-card/90 hover:bg-card px-2.5 py-1.5 rounded-md flex items-center justify-between transition-colors shadow-none">
                        <div className="min-w-0">
                            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide truncate">
                                Read Rate
                            </div>
                            <div className="text-base font-bold text-foreground leading-tight">
                                {metrics.overall_read_rate}%
                            </div>
                            <div className="text-[9.5px] text-muted-foreground leading-none mt-0.5 truncate">
                                {metrics.total_read} chats opened
                            </div>
                        </div>
                        <div className="flex size-6 shrink-0 items-center justify-center rounded bg-purple-500/10 text-purple-600 ml-2">
                            <Eye className="size-3" />
                        </div>
                    </div>

                    {/* Average Cost per Convo */}
                    <div className="border border-border/60 bg-card/90 hover:bg-card px-2.5 py-1.5 rounded-md flex items-center justify-between transition-colors shadow-none">
                        <div className="min-w-0">
                            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide truncate">
                                Avg Cost / Convo
                            </div>
                            <div className="text-base font-bold text-foreground leading-tight">
                                ₹{(metrics.total_cost_inr / Math.max(metrics.total_sent, 1)).toFixed(2)}
                            </div>
                            <div className="text-[9.5px] text-primary font-semibold leading-none mt-0.5 truncate">
                                ₹0.12 - ₹0.85 / msg
                            </div>
                        </div>
                        <div className="flex size-6 shrink-0 items-center justify-center rounded bg-blue-500/10 text-blue-600 ml-2">
                            <Percent className="size-3" />
                        </div>
                    </div>
                </div>

                {/* 3. Compact Visual Charts Grid (7-Day Cost Trend + Spend Breakdown) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 items-stretch">
                    {/* Left: 7-Day Meta Cost Trend Stacked Bar Chart (8 Cols) */}
                    <Card className="lg:col-span-8 border-border/70 bg-card p-3 rounded-lg shadow-none flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between border-b border-border/50 pb-2">
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="size-3.5 text-primary" />
                                    <h3 className="text-xs font-bold text-foreground">
                                        7-Day Cost Trend (INR)
                                    </h3>
                                    <span className="hidden sm:inline text-[10px] text-muted-foreground">
                                        (Mkt: ₹0.85 • Util: ₹0.12)
                                    </span>
                                </div>
                                <div className="flex items-center gap-2.5 text-[11px] font-medium">
                                    <div className="flex items-center gap-1">
                                        <div className="size-2 rounded-xs bg-primary" />
                                        <span className="text-muted-foreground text-[10px]">Marketing</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <div className="size-2 rounded-xs bg-[#0081FB]" />
                                        <span className="text-muted-foreground text-[10px]">Utility</span>
                                    </div>
                                </div>
                            </div>

                            {/* Graphical Bars (Compact Height: h-28) */}
                            <div className="pt-3 pb-1">
                                <div className="grid grid-cols-7 gap-2 sm:gap-4 items-end h-28 border-b border-border/50 pb-1.5">
                                    {dailyTrends.map((d, i) => {
                                        const dayTotal = d.marketingCost + d.utilityCost;
                                        const marketingHeightPct = Math.round((d.marketingCost / maxDailyCost) * 100);
                                        const utilityHeightPct = Math.round((d.utilityCost / maxDailyCost) * 100);

                                        return (
                                            <div key={i} className="flex flex-col items-center gap-1.5 h-full justify-end group">
                                                {/* Tooltip on Hover */}
                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-neutral-900 text-white text-[9px] font-semibold py-0.5 px-1.5 rounded shadow text-center pointer-events-none whitespace-nowrap z-10">
                                                    <div>₹{dayTotal.toFixed(2)}</div>
                                                    <div className="text-neutral-400 font-normal">{d.sent} msgs</div>
                                                </div>

                                                {/* Bar Stack */}
                                                <div className="w-full max-w-[24px] sm:max-w-[28px] flex flex-col justify-end rounded-t-sm overflow-hidden bg-muted/40 h-20">
                                                    {/* Utility portion (Top) */}
                                                    {d.utilityCost > 0 && (
                                                        <div
                                                            style={{ height: `${Math.max(utilityHeightPct, 12)}%` }}
                                                            className="w-full bg-[#0081FB] transition-all group-hover:brightness-110"
                                                        />
                                                    )}
                                                    {/* Marketing portion (Bottom) */}
                                                    {d.marketingCost > 0 && (
                                                        <div
                                                            style={{ height: `${Math.max(marketingHeightPct, 12)}%` }}
                                                            className="w-full bg-primary transition-all group-hover:brightness-110"
                                                        />
                                                    )}
                                                    {dayTotal === 0 && (
                                                        <div className="h-0.5 w-full bg-border/40" />
                                                    )}
                                                </div>

                                                {/* Day Label */}
                                                <div className="text-center leading-tight">
                                                    <div className="text-[11px] font-bold text-foreground">{d.day}</div>
                                                    <div className="text-[9px] text-muted-foreground">{d.date}</div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Chart Bottom Note */}
                        <div className="pt-2 flex items-center justify-between text-[10px] text-muted-foreground">
                            <span>24-Hour Conversation Window Billing</span>
                            <span className="font-semibold text-foreground">
                                {peakDayCost > 0 ? `Peak: ${peakDay.day} (₹${peakDayCost.toFixed(2)})` : 'No spend in last 7 days'}
                            </span>
                        </div>
                    </Card>

                    {/* Right: Spend Breakdown & Meta Rates (4 Cols) */}
                    <Card className="lg:col-span-4 border-border/70 bg-card p-3 rounded-lg shadow-none flex flex-col justify-between gap-2.5">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between border-b border-border/50 pb-2">
                                <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                    <PieChart className="size-3.5 text-primary" />
                                    Spend Breakdown
                                </h3>
                                <span className="text-[10px] text-muted-foreground">Meta Category</span>
                            </div>

                            {/* Proportion Bar */}
                            <div className="space-y-1">
                                <div className="flex justify-between text-[11px] font-semibold">
                                    <span className="text-primary">Marketing ({marketingPercentage}%)</span>
                                    <span className="text-[#0081FB]">Utility ({utilityPercentage}%)</span>
                                </div>
                                <div className="h-2 w-full bg-muted rounded-full overflow-hidden flex">
                                    <div style={{ width: `${marketingPercentage}%` }} className="bg-primary" />
                                    <div style={{ width: `${utilityPercentage}%` }} className="bg-[#0081FB]" />
                                </div>
                            </div>
                        </div>

                        {/* Meta Official India Pricing Pills (Clean & Compact) */}
                        <div className="space-y-1.5 pt-1">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                Meta India Official Rates
                            </div>

                            <div className="px-2.5 py-1.5 rounded-md bg-muted/40 border border-border/50 flex items-center justify-between text-[11px]">
                                <div className="flex items-center gap-1.5 font-medium">
                                    <div className="size-2 rounded-full bg-primary" />
                                    <span>Marketing</span>
                                </div>
                                <span className="font-bold text-foreground">₹{rates.marketing} / conv</span>
                            </div>

                            <div className="px-2.5 py-1.5 rounded-md bg-muted/40 border border-border/50 flex items-center justify-between text-[11px]">
                                <div className="flex items-center gap-1.5 font-medium">
                                    <div className="size-2 rounded-full bg-[#0081FB]" />
                                    <span>Utility</span>
                                </div>
                                <span className="font-bold text-foreground">₹{rates.utility} / conv</span>
                            </div>

                            <div className="px-2.5 py-1.5 rounded-md bg-muted/40 border border-border/50 flex items-center justify-between text-[11px]">
                                <div className="flex items-center gap-1.5 font-medium">
                                    <div className="size-2 rounded-full bg-purple-500" />
                                    <span>Service (Incoming)</span>
                                </div>
                                <span className="font-bold text-emerald-600">FREE (1,000/mo)</span>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* 4. Compact Campaign Performance & Billing Table */}
                <Card className="border-border/70 bg-card overflow-hidden shadow-none rounded-lg">
                    <div className="px-3.5 py-2.5 border-b border-border/60 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <MessageSquare className="size-3.5 text-primary" />
                            <h2 className="text-xs font-bold text-foreground">
                                Campaign Performance &amp; Meta Billing
                            </h2>
                            <Badge variant="secondary" className="text-[10px] h-4 py-0 px-1 font-mono">
                                {filteredCampaigns.length}
                            </Badge>
                        </div>

                        {/* Category Filter Pills */}
                        <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-md border border-border/40">
                            {(['ALL', 'MARKETING', 'UTILITY'] as const).map((cat) => (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-2 py-0.5 text-[11px] rounded font-medium transition-all ${
                                        selectedCategory === cat
                                            ? 'bg-background text-foreground shadow-xs font-semibold'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    {cat === 'ALL' ? 'All' : cat === 'MARKETING' ? 'Marketing' : 'Utility'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-muted/40 border-b border-border/50 text-muted-foreground uppercase text-[9px] font-bold tracking-wider">
                                    <tr>
                                        <th className="px-3.5 py-2">Campaign</th>
                                        <th className="px-3 py-2">Category</th>
                                        <th className="px-3 py-2 text-right">Sent</th>
                                        <th className="px-3 py-2 text-right">Delivery</th>
                                        <th className="px-3 py-2 text-right">Reads</th>
                                        <th className="px-3.5 py-2 text-right">Meta Cost</th>
                                        <th className="px-3 py-2 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/40">
                                    {filteredCampaigns.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-4 py-8 text-center text-xs text-muted-foreground">
                                                No broadcast campaigns found.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredCampaigns.map((c) => (
                                            <tr key={c.id} className="hover:bg-muted/20 transition-colors">
                                                <td className="px-3.5 py-2">
                                                    <div className="font-semibold text-foreground text-xs">{c.name}</div>
                                                    <div className="text-[10px] text-muted-foreground">
                                                        {new Date(c.created_at).toLocaleDateString('en-IN', {
                                                            day: 'numeric',
                                                            month: 'short',
                                                            year: 'numeric',
                                                        })}
                                                    </div>
                                                </td>
                                                <td className="px-3 py-2">
                                                    {c.category === 'MARKETING' ? (
                                                        <Badge className="bg-primary/10 text-primary text-[9px] py-0 h-4 font-semibold border-0">
                                                            MARKETING (₹0.85)
                                                        </Badge>
                                                    ) : (
                                                        <Badge className="bg-[#0081FB]/15 text-[#0081FB] text-[9px] py-0 h-4 font-semibold border-0">
                                                            UTILITY (₹0.12)
                                                        </Badge>
                                                    )}
                                                </td>
                                                <td className="px-3 py-2 text-right font-mono text-xs text-foreground">
                                                    {c.sent_count.toLocaleString('en-IN')}
                                                </td>
                                                <td className="px-3 py-2 text-right">
                                                    <span className="font-bold text-foreground text-xs">{c.delivery_rate}%</span>
                                                    <span className="text-[10px] text-muted-foreground font-mono ml-1">
                                                        ({c.delivered_count})
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2 text-right">
                                                    <span className="font-bold text-emerald-600 text-xs">{c.read_rate}%</span>
                                                    <span className="text-[10px] text-muted-foreground font-mono ml-1">
                                                        ({c.read_count})
                                                    </span>
                                                </td>
                                                <td className="px-3.5 py-2 text-right font-bold text-xs text-foreground font-mono">
                                                    ₹{c.cost_inr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-3 py-2 text-center">
                                                    <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] py-0 h-4 font-medium border-0 capitalize">
                                                        {c.status}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
