import { useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    MessageSquare,
    Bot,
    Send,
    CheckCircle2,
    Clock,
    Zap,
    ShieldCheck,
    Smartphone,
    ExternalLink,
    Copy,
    Check,
    QrCode,
    FileText,
    RefreshCw,
    MessageCircle,
    ChevronRight,
    Radio,
    Sparkles,
    Activity,
    ArrowUpRight,
    Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { dashboard } from '@/routes';

interface DashboardProps {
    channel: {
        name: string;
        phone: string;
        phone_id: string;
        waba_id: string;
        status: string;
        quality: string;
        tier: string;
    } | null;
    metrics: {
        total_messages: number;
        inbound_messages: number;
        outbound_messages: number;
        active_24h: number;
        total_conversations: number;
        templates_count: number;
        bot_flows_count: number;
    };
    recentConversations: Array<{
        id: string;
        name: string;
        phone: string;
        lastMessage: string;
        time: string;
        unread: number;
        status: string;
        intent: string;
        windowRemaining: string;
    }>;
    metaTemplates: Array<{
        name: string;
        category: string;
        language: string;
        status: string;
        rating?: string;
    }>;
    botFlows: Array<{
        id: string;
        name: string;
        trigger: string;
        status: string;
        description: string;
    }>;
}

export default function Dashboard({
    channel,
    metrics = {
        total_messages: 0,
        inbound_messages: 0,
        outbound_messages: 0,
        active_24h: 0,
        total_conversations: 0,
        templates_count: 0,
        bot_flows_count: 0,
    },
    recentConversations = [],
    metaTemplates = [],
    botFlows = [],
}: DashboardProps) {
    const { tenant } = usePage().props as any;
    const currentOrg = tenant?.current || {
        name: 'Sathwara InfoTech',
        slug: 'sathwara-infotech',
        role: 'Owner',
        timezone: 'Asia/Kolkata',
    };

    const [copiedField, setCopiedField] = useState<string | null>(null);
    const defaultPhone = channel?.phone ? channel.phone.replace(/[^0-9]/g, '') : '916352709531';
    const [qrPhone, setQrPhone] = useState(defaultPhone);
    const [qrMessage, setQrMessage] = useState(`Hello ${currentOrg.name}, I want to inquire about your services.`);
    const [activeTab, setActiveTab] = useState('overview');

    const copyToClipboard = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const waLink = `https://wa.me/${qrPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(qrMessage)}`;

    return (
        <>
            <Head title={`Dashboard - ${currentOrg.name} | WhatsApp Business SaaS`} />

            <div className="flex flex-1 flex-col gap-3.5 p-3.5 sm:p-5 max-w-7xl mx-auto w-full font-sans">
                {/* 1. Unique Glassmorphic Hero Bar */}
                <div className="relative overflow-hidden rounded-xl border border-emerald-500/25 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-slate-900/5 p-3.5 sm:p-4 shadow-sm backdrop-blur-md">
                    <div className="absolute -top-12 -right-12 size-40 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />
                    <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#10b981] to-[#047857] text-white shadow-md shadow-emerald-600/25">
                                <Activity className="size-5" />
                            </div>
                            <div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-foreground">
                                        WhatsApp Command Center
                                    </h1>
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/25 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                                        <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
                                        Meta Cloud v22.0
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Workspace: <span className="text-foreground font-semibold">/{currentOrg.slug || 'sathwara-infotech'}</span> • Region: <span className="text-foreground font-medium">{currentOrg.timezone || 'Asia/Kolkata'}</span>
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto">
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs font-semibold px-3 gap-1.5 border-border hover:bg-muted/80 shadow-2xs"
                                asChild
                            >
                                <Link href="/inbox">
                                    <MessageSquare className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                                    Shared Inbox
                                </Link>
                            </Button>
                            <Button
                                size="sm"
                                className="h-8 text-xs font-semibold px-3.5 gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-600/20"
                                asChild
                            >
                                <Link href="/campaigns">
                                    <Send className="size-3.5" />
                                    New Broadcast
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* 2. Four Luxury KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* KPI 1 */}
                    <div className="group relative overflow-hidden rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.07] via-card to-card p-3.5 shadow-2xs hover:shadow-md hover:border-emerald-500/40 transition-all duration-300">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                Total Messages
                            </span>
                            <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20 group-hover:scale-110 transition-transform">
                                <MessageSquare className="size-3.5" />
                            </div>
                        </div>
                        <div className="mt-2 flex items-baseline justify-between">
                            <span className="text-2xl font-extrabold tracking-tight text-foreground">{metrics.total_messages}</span>
                            <span className="rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                                100% Synced
                            </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1.5 font-medium">
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{metrics.inbound_messages} Inbound</span>
                            <span>•</span>
                            <span>{metrics.outbound_messages} Outbound</span>
                        </p>
                    </div>

                    {/* KPI 2 */}
                    <div className="group relative overflow-hidden rounded-xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/[0.07] via-card to-card p-3.5 shadow-2xs hover:shadow-md hover:border-cyan-500/40 transition-all duration-300">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                Active 24h Window
                            </span>
                            <div className="flex size-7 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 ring-1 ring-cyan-500/20 group-hover:scale-110 transition-transform">
                                <Clock className="size-3.5" />
                            </div>
                        </div>
                        <div className="mt-2 flex items-baseline justify-between">
                            <span className="text-2xl font-extrabold tracking-tight text-foreground">{metrics.active_24h}</span>
                            <span className="rounded-md bg-cyan-500/10 px-1.5 py-0.5 text-[10px] font-bold text-cyan-700 dark:text-cyan-300">
                                Free Sessions
                            </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1 font-medium">
                            {metrics.total_conversations} total lifetime customer threads
                        </p>
                    </div>

                    {/* KPI 3 */}
                    <div className="group relative overflow-hidden rounded-xl border border-purple-500/20 bg-gradient-to-br from-purple-500/[0.07] via-card to-card p-3.5 shadow-2xs hover:shadow-md hover:border-purple-500/40 transition-all duration-300">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                Meta Templates
                            </span>
                            <div className="flex size-7 items-center justify-center rounded-lg bg-purple-500/15 text-purple-600 dark:text-purple-400 ring-1 ring-purple-500/20 group-hover:scale-110 transition-transform">
                                <FileText className="size-3.5" />
                            </div>
                        </div>
                        <div className="mt-2 flex items-baseline justify-between">
                            <span className="text-2xl font-extrabold tracking-tight text-foreground">{metrics.templates_count}</span>
                            <span className="rounded-md bg-purple-500/10 px-1.5 py-0.5 text-[10px] font-bold text-purple-700 dark:text-purple-300">
                                Meta Approved
                            </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1 font-medium">
                            Ready for High-Volume Campaigns
                        </p>
                    </div>

                    {/* KPI 4 */}
                    <div className="group relative overflow-hidden rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-500/[0.07] via-card to-card p-3.5 shadow-2xs hover:shadow-md hover:border-amber-500/40 transition-all duration-300">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                Bot Automation
                            </span>
                            <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/20 group-hover:scale-110 transition-transform">
                                <Zap className="size-3.5" />
                            </div>
                        </div>
                        <div className="mt-2 flex items-baseline justify-between">
                            <span className="text-2xl font-extrabold tracking-tight text-foreground">{metrics.bot_flows_count}</span>
                            <span className="rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                                Active Rule
                            </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1 font-medium">
                            Instant AI & keyword responders
                        </p>
                    </div>
                </div>

                {/* 3. Modern 2-Column Command Center */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
                    {/* LEFT COLUMN: Activity Command Card (8 cols) */}
                    <div className="lg:col-span-8 space-y-3">
                        <Card className="border-border/80 shadow-sm overflow-hidden rounded-xl bg-card">
                            <Tabs value={activeTab} onValueChange={setActiveTab}>
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/70 px-4 py-2.5 bg-muted/30">
                                    <TabsList className="bg-muted/80 p-0.5 rounded-lg h-7.5">
                                        <TabsTrigger value="overview" className="text-xs font-semibold px-3 py-1 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-2xs">
                                            Live Stream ({recentConversations.length})
                                        </TabsTrigger>
                                        <TabsTrigger value="templates" className="text-xs font-semibold px-3 py-1 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-2xs">
                                            Templates ({metaTemplates.length})
                                        </TabsTrigger>
                                        <TabsTrigger value="bot" className="text-xs font-semibold px-3 py-1 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-2xs">
                                            Bot Flows ({botFlows.length})
                                        </TabsTrigger>
                                    </TabsList>

                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => window.location.reload()}
                                        className="h-7 text-xs font-medium px-2.5 text-muted-foreground hover:text-foreground self-end sm:self-auto gap-1.5"
                                    >
                                        <RefreshCw className="size-3" />
                                        Refresh Feed
                                    </Button>
                                </div>

                                {/* TAB 1: Live Inbound Stream */}
                                <TabsContent value="overview" className="m-0 p-0">
                                    {recentConversations.length > 0 ? (
                                        <div className="divide-y divide-border/60">
                                            {recentConversations.map((chat, idx) => (
                                                <div
                                                    key={chat.id}
                                                    className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
                                                >
                                                    <div className="flex items-start gap-3 min-w-0">
                                                        <div className={`flex size-9 shrink-0 items-center justify-center rounded-xl font-bold text-xs uppercase text-white shadow-xs ${
                                                            idx % 2 === 0
                                                                ? 'bg-gradient-to-br from-emerald-500 to-teal-700'
                                                                : 'bg-gradient-to-br from-blue-600 to-indigo-700'
                                                        }`}>
                                                            {(chat.name || chat.phone).slice(0, 2)}
                                                        </div>
                                                        <div className="min-w-0 space-y-1">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <span className="text-xs font-bold text-foreground truncate max-w-[170px]">{chat.name}</span>
                                                                <span className="text-[11px] font-mono text-muted-foreground">{chat.phone}</span>
                                                                <span className="text-[10px] text-muted-foreground">• {chat.time}</span>
                                                            </div>
                                                            <div className="rounded-md border border-border/60 bg-muted/30 px-2.5 py-1 text-xs text-foreground/90 font-medium line-clamp-1 border-l-2 border-l-emerald-500">
                                                                "{chat.lastMessage}"
                                                            </div>
                                                            <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
                                                                <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                                                                    {chat.intent}
                                                                </span>
                                                                <span className="rounded bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                                                                    24h Window: {chat.windowRemaining}
                                                                </span>
                                                                {chat.status === 'resolved' ? (
                                                                    <span className="rounded bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                                                                        Resolved
                                                                    </span>
                                                                ) : (
                                                                    <span className="rounded bg-teal-500/15 px-2 py-0.5 text-[10px] font-bold text-teal-700 dark:text-teal-300">
                                                                        Open
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <Button size="sm" variant="outline" className="h-7 text-xs font-semibold px-2.5 shrink-0 border-border hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-colors gap-1.5" asChild>
                                                        <Link href="/inbox">
                                                            <MessageCircle className="size-3.5" />
                                                            Reply
                                                        </Link>
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center p-8 text-center space-y-2">
                                            <MessageSquare className="size-8 text-muted-foreground/30" />
                                            <p className="text-sm font-bold text-foreground">No customer conversations yet</p>
                                            <p className="text-xs text-muted-foreground max-w-sm">
                                                Send a message from WhatsApp to <strong className="text-foreground">{channel?.phone || 'your connected number'}</strong> to see live inbound chats appear here.
                                            </p>
                                        </div>
                                    )}
                                </TabsContent>

                                {/* TAB 2: Meta Templates */}
                                <TabsContent value="templates" className="m-0 p-0">
                                    {metaTemplates.length > 0 ? (
                                        <div className="divide-y divide-border/60">
                                            {metaTemplates.map((t) => (
                                                <div key={t.name} className="flex items-center justify-between px-4 py-3 hover:bg-muted/30">
                                                    <div className="space-y-0.5">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-mono text-xs font-bold text-foreground">{t.name}</span>
                                                            <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground uppercase">
                                                                {t.language}
                                                            </span>
                                                        </div>
                                                        <span className="text-xs text-muted-foreground">
                                                            Category: <strong className="text-foreground font-semibold">{t.category}</strong>
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-2.5">
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                                                            <CheckCircle2 className="size-3" /> {t.status}
                                                        </span>
                                                        <Button size="sm" variant="outline" className="h-7 text-xs font-semibold px-2.5 border-border" asChild>
                                                            <Link href="/campaigns">Use Template</Link>
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-8 text-center text-muted-foreground text-xs">
                                            No templates synced. Visit <Link href="/campaigns" className="text-emerald-600 underline font-semibold">Campaigns</Link> to create or sync Meta templates.
                                        </div>
                                    )}
                                </TabsContent>

                                {/* TAB 3: Bot Workflows */}
                                <TabsContent value="bot" className="m-0 p-4">
                                    {botFlows.length > 0 ? (
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            {botFlows.map((flow) => (
                                                <div key={flow.id} className="rounded-xl border border-border/80 p-3.5 space-y-2 bg-muted/20 hover:border-emerald-500/40 transition-colors">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-bold text-foreground">{flow.name}</span>
                                                        <Badge className="bg-emerald-600 text-white text-[10px] font-bold py-0 px-2 uppercase">{flow.status}</Badge>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground line-clamp-2">{flow.description}</p>
                                                    <div className="flex items-center justify-between pt-1 text-xs">
                                                        <span className="text-muted-foreground">Trigger: <strong className="text-foreground">{flow.trigger}</strong></span>
                                                        <Button variant="ghost" size="sm" className="h-6.5 text-xs px-2 text-emerald-600 font-semibold" asChild>
                                                            <Link href="/bot">Configure →</Link>
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-6 text-center">
                                            <Bot className="size-7 mx-auto text-muted-foreground/40 mb-1.5" />
                                            <p className="text-xs font-bold text-foreground">No Bot Workflows Configured Yet</p>
                                            <Button size="sm" className="mt-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold h-7.5 px-3" asChild>
                                                <Link href="/bot">+ Create Bot Workflow</Link>
                                            </Button>
                                        </div>
                                    )}
                                </TabsContent>
                            </Tabs>
                        </Card>
                    </div>

                    {/* RIGHT COLUMN: Official Meta Channel Widget & Test QR (4 cols) */}
                    <div className="lg:col-span-4 space-y-3.5">
                        {/* 1. Official Verified Meta Channel Passport */}
                        {channel ? (
                            <div className="rounded-xl border border-emerald-500/30 bg-gradient-to-b from-emerald-500/[0.08] to-card p-4 shadow-sm space-y-3">
                                <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
                                    <div className="flex items-center gap-2">
                                        <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs">
                                            <ShieldCheck className="size-4" />
                                        </div>
                                        <div>
                                            <h3 className="text-xs font-extrabold text-foreground tracking-tight">
                                                {channel.name}
                                            </h3>
                                            <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold">
                                                Verified Cloud WABA
                                            </span>
                                        </div>
                                    </div>
                                    <Badge className="bg-emerald-600 text-white text-[11px] font-bold border-0 py-0.5 px-2">
                                        {channel.phone}
                                    </Badge>
                                </div>

                                <div className="space-y-2 text-xs">
                                    <div className="flex items-center justify-between border-b border-border/40 pb-1.5">
                                        <span className="text-muted-foreground">Account Health:</span>
                                        <div className="flex items-center gap-1.5">
                                            <span className="rounded bg-emerald-500/20 px-1.5 py-0.2 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase">
                                                Quality: {channel.quality}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground font-semibold">{channel.tier}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between border-b border-border/40 pb-1.5 font-mono">
                                        <span className="text-muted-foreground font-sans">Phone ID:</span>
                                        <div className="flex items-center gap-1.5">
                                            <code className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-foreground">{channel.phone_id}</code>
                                            <button onClick={() => copyToClipboard(channel.phone_id, 'phoneId')} className="text-muted-foreground hover:text-emerald-600 transition-colors p-0.5" title="Copy Phone ID">
                                                {copiedField === 'phoneId' ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between border-b border-border/40 pb-1.5 font-mono">
                                        <span className="text-muted-foreground font-sans">WABA ID:</span>
                                        <div className="flex items-center gap-1.5">
                                            <code className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-foreground">{channel.waba_id}</code>
                                            <button onClick={() => copyToClipboard(channel.waba_id, 'wabaId')} className="text-muted-foreground hover:text-emerald-600 transition-colors p-0.5" title="Copy WABA ID">
                                                {copiedField === 'wabaId' ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-1">
                                        <span className="text-muted-foreground">Webhook Listener:</span>
                                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                            <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
                                            200 OK Listening
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-xl border border-amber-500/30 bg-amber-50/40 dark:bg-amber-950/20 p-4">
                                <div className="flex items-center gap-2.5">
                                    <Radio className="size-5 text-amber-600 animate-pulse shrink-0" />
                                    <div>
                                        <h4 className="text-xs font-bold text-foreground">No Channel Connected</h4>
                                        <p className="text-[11px] text-muted-foreground">Connect a WhatsApp Business number to start receiving live chats.</p>
                                    </div>
                                </div>
                                <Button size="sm" className="w-full mt-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold h-7.5" asChild>
                                    <Link href="/whatsapp/connect">+ Connect WhatsApp Number</Link>
                                </Button>
                            </div>
                        )}

                        {/* 2. Interactive Test QR & Click-to-Chat Widget */}
                        <div className="rounded-xl border border-border/80 bg-card p-4 shadow-sm text-center space-y-3">
                            <div className="flex items-center justify-between border-b border-border/50 pb-2">
                                <div className="flex items-center gap-1.5">
                                    <QrCode className="size-4 text-emerald-600" />
                                    <h4 className="text-xs font-bold text-foreground">
                                        Scan & Test Chat
                                    </h4>
                                </div>
                                <span className="text-[10px] text-muted-foreground font-semibold">Direct wa.me</span>
                            </div>

                            <div className="relative mx-auto size-32 rounded-xl border border-emerald-500/20 bg-white p-2 shadow-xs">
                                <img
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=${encodeURIComponent(waLink)}`}
                                    alt="WhatsApp QR Code"
                                    className="size-full object-contain"
                                    loading="lazy"
                                />
                            </div>

                            <p className="text-[11px] text-muted-foreground max-w-xs mx-auto">
                                Scan with any camera to instantly test inbound chats with <strong className="text-foreground">{channel?.phone || qrPhone}</strong>
                            </p>

                            <div className="flex items-center gap-2 pt-1">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => copyToClipboard(waLink, 'walink')}
                                    className="h-7 text-xs font-semibold flex-1 px-2 gap-1 border-border"
                                >
                                    {copiedField === 'walink' ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
                                    Copy Link
                                </Button>
                                <Button
                                    size="sm"
                                    className="h-7 text-xs font-semibold flex-1 px-2 bg-emerald-600 hover:bg-emerald-500 text-white gap-1 shadow-2xs"
                                    asChild
                                >
                                    <a href={waLink} target="_blank" rel="noreferrer">
                                        <ExternalLink className="size-3" />
                                        Chat Now
                                    </a>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
