import { useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    MessageSquare,
    Users,
    Bot,
    Send,
    ArrowUpRight,
    CheckCircle2,
    Clock,
    Zap,
    ShieldCheck,
    Smartphone,
    ExternalLink,
    Copy,
    Check,
    QrCode,
    Link2,
    Sparkles,
    BarChart3,
    FileText,
    TrendingUp,
    RefreshCw,
    MessageCircle,
    Sliders,
    Search,
    ChevronRight,
    SendHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { dashboard } from '@/routes';

export default function Dashboard() {
    const { auth, tenant } = usePage().props as any;
    const currentOrg = tenant?.current || {
        name: 'Sathwara InfoTech',
        slug: 'sathwara-infotech',
        role: 'Owner',
        timezone: 'Asia/Kolkata',
    };

    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [qrPhone, setQrPhone] = useState('917997881665');
    const [qrMessage, setQrMessage] = useState('Hello Sathwara InfoTech, I want to inquire about your services.');
    const [activeTab, setActiveTab] = useState('overview');

    const copyToClipboard = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const waLink = `https://wa.me/${qrPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(qrMessage)}`;

    // Sample active conversations matching Xobito team inbox
    const activeConversations = [
        {
            id: 1,
            name: 'Rahul Patel',
            phone: '+91 98251 44321',
            lastMessage: 'Can you share the pricing brochure and schedule?',
            time: '3m ago',
            unread: 1,
            status: 'bot_handled',
            intent: 'Pricing Inquiry',
            windowRemaining: '23h 57m',
        },
        {
            id: 2,
            name: 'Pooja Shah',
            phone: '+91 94280 19876',
            lastMessage: 'Thank you! The automated registration link worked smoothly.',
            time: '28m ago',
            unread: 0,
            status: 'resolved',
            intent: 'Registration',
            windowRemaining: '23h 32m',
        },
        {
            id: 3,
            name: 'Amit Parmar',
            phone: '+91 97234 56123',
            lastMessage: 'I would like to speak to a live support executive please.',
            time: '1h ago',
            unread: 2,
            status: 'needs_agent',
            intent: 'Human Handoff',
            windowRemaining: '22h 45m',
        },
    ];

    // Meta approved templates
    const metaTemplates = [
        {
            name: 'welcome_onboarding_v2',
            category: 'MARKETING',
            language: 'en_US',
            status: 'APPROVED',
            rating: 'HIGH',
            updated: 'Yesterday',
        },
        {
            name: 'order_status_update',
            category: 'UTILITY',
            language: 'en_US',
            status: 'APPROVED',
            rating: 'HIGH',
            updated: '3 days ago',
        },
        {
            name: 'otp_verification_code',
            category: 'AUTHENTICATION',
            language: 'en_US',
            status: 'APPROVED',
            rating: 'HIGH',
            updated: '1 week ago',
        },
    ];

    return (
        <>
            <Head title={`Dashboard - ${currentOrg.name} | WhatsApp Business SaaS`} />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 bg-background max-w-7xl mx-auto w-full">
                {/* 1. Xobito-Style Top Header Banner */}
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-border/70 pb-5">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2.5">
                            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
                                {currentOrg.name}
                            </h1>
                            <span className="inline-flex items-center gap-1 rounded-md bg-[#47b672]/15 px-2 py-0.5 text-xs font-semibold text-[#28804c] dark:text-[#52c480]">
                                <span className="size-1.5 rounded-full bg-[#47b672] animate-pulse"></span>
                                Meta Cloud API v22.0
                            </span>
                        </div>
                        <p className="text-xs md:text-sm text-muted-foreground flex items-center gap-2">
                            <span>Workspace: <strong className="text-foreground font-medium">/{currentOrg.slug || 'sathwara-infotech'}</strong></span>
                            <span>•</span>
                            <span>Region: <strong>Asia/Kolkata (IST)</strong></span>
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-9 gap-1.5 border-border hover:bg-muted text-xs font-medium"
                            asChild
                        >
                            <Link href="/whatsapp/connect">
                                <Smartphone className="size-3.5 text-[#47b672]" />
                                WABA Settings
                            </Link>
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-9 gap-1.5 border-border hover:bg-muted text-xs font-medium"
                            asChild
                        >
                            <Link href="/bot">
                                <Bot className="size-3.5 text-purple-600" />
                                Bot Flows
                            </Link>
                        </Button>
                        <Button
                            size="sm"
                            className="h-9 gap-1.5 bg-[#47b672] text-white hover:bg-[#349c5e] shadow-sm shadow-[#47b672]/20 text-xs font-semibold"
                            asChild
                        >
                            <Link href="/campaigns">
                                <Send className="size-3.5" />
                                New Broadcast
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* 2. Official WhatsApp Business Account (WABA) Diagnostics Bar */}
                <div className="rounded-xl border border-[#47b672]/25 bg-gradient-to-r from-[#47b672]/10 via-[#47b672]/5 to-transparent p-4 md:p-5 shadow-xs">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex items-start gap-3.5">
                            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#47b672] text-white shadow-md shadow-[#47b672]/30">
                                <ShieldCheck className="size-6" />
                            </div>
                            <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="text-sm font-bold text-foreground">
                                        Official WhatsApp Business Account Connected
                                    </h3>
                                    <Badge className="bg-[#47b672] text-white text-[10px] font-semibold border-0">
                                        QUALITY: HIGH
                                    </Badge>
                                    <Badge variant="outline" className="text-[10px] border-[#47b672]/40 text-[#28804c] dark:text-[#52c480]">
                                        Tier 1 (1,000 unique contacts/24h)
                                    </Badge>
                                </div>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground pt-0.5">
                                    <span className="flex items-center gap-1 font-mono">
                                        <span>Phone ID:</span>
                                        <code className="rounded bg-background/80 px-1 py-0.5 text-foreground border border-border/60">
                                            1431069246745536
                                        </code>
                                        <button
                                            onClick={() => copyToClipboard('1431069246745536', 'phoneId')}
                                            className="text-muted-foreground hover:text-foreground p-0.5"
                                            title="Copy Phone ID"
                                        >
                                            {copiedField === 'phoneId' ? <Check className="size-3 text-[#47b672]" /> : <Copy className="size-3" />}
                                        </button>
                                    </span>
                                    <span className="flex items-center gap-1 font-mono">
                                        <span>WABA ID:</span>
                                        <code className="rounded bg-background/80 px-1 py-0.5 text-foreground border border-border/60">
                                            799788166562792
                                        </code>
                                        <button
                                            onClick={() => copyToClipboard('799788166562792', 'wabaId')}
                                            className="text-muted-foreground hover:text-foreground p-0.5"
                                            title="Copy WABA ID"
                                        >
                                            {copiedField === 'wabaId' ? <Check className="size-3 text-[#47b672]" /> : <Copy className="size-3" />}
                                        </button>
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            <div className="flex items-center gap-2 rounded-lg bg-background/90 px-3 py-1.5 border border-border/80 text-xs shadow-2xs">
                                <span className="size-2 rounded-full bg-[#47b672] animate-ping"></span>
                                <span className="text-muted-foreground">Webhook Status:</span>
                                <span className="font-semibold text-foreground">Listening (200 OK)</span>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 text-xs text-muted-foreground hover:text-foreground"
                                asChild
                            >
                                <Link href="/whatsapp/connect">
                                    View Details <ChevronRight className="size-3.5 ml-0.5" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* 3. Four Core Metric Cards (Xobito Layout) */}
                <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="border-border/80 shadow-xs hover:border-[#47b672]/40 transition-colors">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Total Messages
                            </span>
                            <div className="flex size-7 items-center justify-center rounded-md bg-[#47b672]/15 text-[#28804c] dark:text-[#52c480]">
                                <MessageSquare className="size-3.5" />
                            </div>
                        </CardHeader>
                        <CardContent className="px-4 pb-4">
                            <div className="flex items-baseline justify-between">
                                <span className="text-2xl font-bold tracking-tight text-foreground">2,840</span>
                                <span className="flex items-center text-xs font-semibold text-[#28804c] dark:text-[#52c480]">
                                    <TrendingUp className="size-3 mr-0.5" /> +14.2%
                                </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-1">
                                Inbound & outbound messages this billing cycle
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-border/80 shadow-xs hover:border-[#47b672]/40 transition-colors">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Active 24h Window
                            </span>
                            <div className="flex size-7 items-center justify-center rounded-md bg-blue-500/15 text-blue-600 dark:text-blue-400">
                                <Clock className="size-3.5" />
                            </div>
                        </CardHeader>
                        <CardContent className="px-4 pb-4">
                            <div className="flex items-baseline justify-between">
                                <span className="text-2xl font-bold tracking-tight text-foreground">142</span>
                                <Badge variant="secondary" className="text-[10px] bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-medium">
                                    Free Service Tier
                                </Badge>
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-1">
                                Free customer-initiated chat sessions open
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-border/80 shadow-xs hover:border-[#47b672]/40 transition-colors">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Bot Resolution Rate
                            </span>
                            <div className="flex size-7 items-center justify-center rounded-md bg-purple-500/15 text-purple-600 dark:text-purple-400">
                                <Zap className="size-3.5" />
                            </div>
                        </CardHeader>
                        <CardContent className="px-4 pb-4">
                            <div className="flex items-baseline justify-between">
                                <span className="text-2xl font-bold tracking-tight text-foreground">88.5%</span>
                                <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">
                                    Automated
                                </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-1">
                                Queries solved without human agent escalation
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-border/80 shadow-xs hover:border-[#47b672]/40 transition-colors">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Meta Free Allowance
                            </span>
                            <div className="flex size-7 items-center justify-center rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400">
                                <BarChart3 className="size-3.5" />
                            </div>
                        </CardHeader>
                        <CardContent className="px-4 pb-4">
                            <div className="flex items-baseline justify-between">
                                <span className="text-2xl font-bold tracking-tight text-foreground">858 <span className="text-xs font-normal text-muted-foreground">/ 1,000</span></span>
                                <span className="text-xs font-medium text-emerald-600">
                                    ₹0.00 billed
                                </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-1">
                                1,000 free Meta service conversations/month
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* 4. Tabbed Command Center (Live Stream, Campaigns, Growth Tools, Bot Rules) */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/70 pb-2">
                        <TabsList className="bg-muted/70 p-1 rounded-lg">
                            <TabsTrigger value="overview" className="text-xs data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs">
                                Live Inbound Stream
                            </TabsTrigger>
                            <TabsTrigger value="growth" className="text-xs data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs">
                                Growth & QR Tools
                            </TabsTrigger>
                            <TabsTrigger value="templates" className="text-xs data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs">
                                Meta Templates
                            </TabsTrigger>
                            <TabsTrigger value="bot" className="text-xs data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs">
                                Active Bot Workflows
                            </TabsTrigger>
                        </TabsList>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs gap-1.5"
                                asChild
                            >
                                <Link href="/inbox">
                                    <MessageSquare className="size-3.5 text-[#47b672]" />
                                    Open Full Inbox
                                </Link>
                            </Button>
                        </div>
                    </div>

                    {/* TAB 1: Live Stream */}
                    <TabsContent value="overview" className="space-y-4 m-0">
                        <Card className="border-border/80">
                            <CardHeader className="flex flex-row items-center justify-between border-b border-border/60 pb-3 pt-4 px-5">
                                <div>
                                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                                        <span className="size-2 rounded-full bg-[#47b672] animate-pulse"></span>
                                        Recent Inbound WhatsApp Conversations
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                        Real-time customer messages received through WhatsApp Cloud API.
                                    </CardDescription>
                                </div>
                                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground">
                                    <RefreshCw className="size-3" /> Refresh
                                </Button>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-border/60">
                                    {activeConversations.map((chat) => (
                                        <div
                                            key={chat.id}
                                            className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 hover:bg-muted/40 transition-colors"
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#47b672]/15 text-[#28804c] dark:text-[#52c480] font-bold text-xs">
                                                    {chat.name.slice(0, 2).toUpperCase()}
                                                </div>
                                                <div className="space-y-0.5">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-semibold text-foreground">{chat.name}</span>
                                                        <span className="text-xs font-mono text-muted-foreground">{chat.phone}</span>
                                                        <span className="text-[10px] text-muted-foreground">• {chat.time}</span>
                                                    </div>
                                                    <p className="text-xs text-foreground/90 font-normal leading-relaxed line-clamp-1">
                                                        "{chat.lastMessage}"
                                                    </p>
                                                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                                        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                                                            Intent: {chat.intent}
                                                        </span>
                                                        <span className="rounded bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700 dark:text-blue-300">
                                                            24h Window: {chat.windowRemaining}
                                                        </span>
                                                        {chat.status === 'bot_handled' && (
                                                            <span className="rounded bg-[#47b672]/15 px-1.5 py-0.5 text-[10px] font-semibold text-[#28804c] dark:text-[#52c480]">
                                                                Bot Replied
                                                            </span>
                                                        )}
                                                        {chat.status === 'needs_agent' && (
                                                            <span className="rounded bg-amber-100 dark:bg-amber-950 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-300">
                                                                Agent Needed
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 shrink-0 md:self-center">
                                                <Button size="sm" variant="outline" className="h-8 text-xs border-border gap-1" asChild>
                                                    <Link href="/inbox">
                                                        <MessageCircle className="size-3.5 text-[#47b672]" />
                                                        Reply
                                                    </Link>
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* TAB 2: Growth & QR Generator (Xobito Core Feature) */}
                    <TabsContent value="growth" className="space-y-4 m-0">
                        <div className="grid gap-4 md:grid-cols-2">
                            {/* QR & Direct Link Generator Card */}
                            <Card className="border-border/80">
                                <CardHeader className="pb-3 pt-4 px-5">
                                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                                        <QrCode className="size-4 text-[#47b672]" />
                                        Click-to-WhatsApp QR & Link Generator
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                        Place this QR code on your website, packaging, invoice, or storefront to get direct inbound customer chats.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3 px-5 pb-5">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-foreground">
                                            WhatsApp Phone Number (with Country Code)
                                        </label>
                                        <input
                                            type="text"
                                            value={qrPhone}
                                            onChange={(e) => setQrPhone(e.target.value)}
                                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-[#47b672]/40"
                                            placeholder="917997881665"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-foreground">
                                            Pre-Filled Inbound Greeting Message
                                        </label>
                                        <textarea
                                            value={qrMessage}
                                            onChange={(e) => setQrMessage(e.target.value)}
                                            rows={2}
                                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-[#47b672]/40"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-foreground">
                                            Generated Short Link
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                readOnly
                                                value={waLink}
                                                className="w-full rounded-md border border-input bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground font-mono"
                                            />
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => copyToClipboard(waLink, 'walink')}
                                                className="h-8 shrink-0 text-xs gap-1"
                                            >
                                                {copiedField === 'walink' ? <Check className="size-3.5 text-[#47b672]" /> : <Copy className="size-3.5" />}
                                                Copy
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 pt-2">
                                        <Button
                                            size="sm"
                                            className="bg-[#47b672] text-white hover:bg-[#349c5e] text-xs font-semibold"
                                            asChild
                                        >
                                            <a href={waLink} target="_blank" rel="noreferrer">
                                                <ExternalLink className="size-3.5 mr-1" />
                                                Test Link in WhatsApp
                                            </a>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Live QR Code Display */}
                            <Card className="border-border/80 flex flex-col items-center justify-center text-center">
                                <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                                    <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
                                        {/* Responsive SVG QR Pattern representation */}
                                        <div className="size-48 bg-white flex flex-col items-center justify-center relative">
                                            <svg viewBox="0 0 200 200" className="size-full">
                                                {/* Outer Position Detection Patterns */}
                                                <rect x="10" y="10" width="50" height="50" rx="6" fill="#1C1B19" />
                                                <rect x="20" y="20" width="30" height="30" rx="3" fill="#FFFFFF" />
                                                <rect x="27" y="27" width="16" height="16" fill="#47B672" />

                                                <rect x="140" y="10" width="50" height="50" rx="6" fill="#1C1B19" />
                                                <rect x="150" y="20" width="30" height="30" rx="3" fill="#FFFFFF" />
                                                <rect x="157" y="27" width="16" height="16" fill="#47B672" />

                                                <rect x="10" y="140" width="50" height="50" rx="6" fill="#1C1B19" />
                                                <rect x="20" y="150" width="30" height="30" rx="3" fill="#FFFFFF" />
                                                <rect x="27" y="157" width="16" height="16" fill="#47B672" />

                                                {/* Stylized QR Matrix Dots */}
                                                <circle cx="80" cy="25" r="5" fill="#1C1B19" />
                                                <circle cx="100" cy="30" r="4" fill="#1C1B19" />
                                                <circle cx="120" cy="20" r="5" fill="#1C1B19" />
                                                <circle cx="75" cy="50" r="5" fill="#1C1B19" />
                                                <circle cx="95" cy="55" r="4" fill="#47B672" />
                                                <circle cx="115" cy="45" r="5" fill="#1C1B19" />
                                                <circle cx="80" cy="75" r="4" fill="#1C1B19" />
                                                <circle cx="125" cy="80" r="5" fill="#1C1B19" />
                                                <circle cx="145" cy="75" r="4" fill="#1C1B19" />
                                                <circle cx="170" cy="85" r="5" fill="#47B672" />
                                                <circle cx="80" cy="120" r="5" fill="#1C1B19" />
                                                <circle cx="100" cy="115" r="4" fill="#1C1B19" />
                                                <circle cx="120" cy="130" r="5" fill="#47B672" />
                                                <circle cx="150" cy="120" r="4" fill="#1C1B19" />
                                                <circle cx="80" cy="160" r="5" fill="#47B672" />
                                                <circle cx="105" cy="155" r="4" fill="#1C1B19" />
                                                <circle cx="130" cy="165" r="5" fill="#1C1B19" />
                                                <circle cx="160" cy="155" r="4" fill="#1C1B19" />
                                                <circle cx="175" cy="175" r="5" fill="#47B672" />

                                                {/* Center WhatsApp Logo Icon */}
                                                <circle cx="100" cy="100" r="22" fill="#FFFFFF" />
                                                <circle cx="100" cy="100" r="18" fill="#47B672" />
                                                <path d="M100 89C93.9 89 89 93.9 89 100C89 102.3 89.8 104.5 91.2 106.3L90 111L94.9 109.8C96.5 110.6 98.2 111 100 111C106.1 111 111 106.1 111 100C111 93.9 106.1 89 100 89Z" fill="white" />
                                            </svg>
                                        </div>
                                    </div>
                                    <h4 className="text-sm font-bold text-foreground mt-3">
                                        Scan to Chat with Sathwara InfoTech
                                    </h4>
                                    <p className="text-xs text-muted-foreground max-w-xs mt-0.5">
                                        Opens WhatsApp instantly with your pre-filled inquiry message.
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* TAB 3: Meta Templates */}
                    <TabsContent value="templates" className="space-y-4 m-0">
                        <Card className="border-border/80">
                            <CardHeader className="flex flex-row items-center justify-between border-b border-border/60 pb-3 pt-4 px-5">
                                <div>
                                    <CardTitle className="text-sm font-bold">
                                        Meta Approved Message Templates (HSM)
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                        Required to initiate outbound messages or re-open conversations outside the 24-hour service window.
                                    </CardDescription>
                                </div>
                                <Button size="sm" className="h-8 text-xs bg-[#47b672] text-white hover:bg-[#349c5e]" asChild>
                                    <Link href="/campaigns">
                                        + Submit New Template
                                    </Link>
                                </Button>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-border/60">
                                    {metaTemplates.map((t) => (
                                        <div key={t.name} className="flex items-center justify-between p-4 hover:bg-muted/30">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-xs font-bold text-foreground">{t.name}</span>
                                                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground uppercase">
                                                        {t.language}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <span>Category: <strong className="text-foreground">{t.category}</strong></span>
                                                    <span>•</span>
                                                    <span>Synced: {t.updated}</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <span className="inline-flex items-center gap-1 rounded-full bg-[#47b672]/15 px-2.5 py-0.5 text-xs font-semibold text-[#28804c] dark:text-[#52c480]">
                                                    <CheckCircle2 className="size-3" /> {t.status}
                                                </span>
                                                <Button size="sm" variant="outline" className="h-7 text-xs border-border" asChild>
                                                    <Link href="/campaigns">Use in Campaign</Link>
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* TAB 4: Active Bot Workflows */}
                    <TabsContent value="bot" className="space-y-4 m-0">
                        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                            <Card className="border-border/80 hover:border-[#47b672]/40 transition-colors">
                                <CardHeader className="pb-2 pt-4 px-4">
                                    <div className="flex items-center justify-between">
                                        <Badge className="bg-[#47b672] text-white text-[10px]">ACTIVE</Badge>
                                        <span className="text-[11px] text-muted-foreground">Trigger: First Message</span>
                                    </div>
                                    <CardTitle className="text-sm font-bold mt-2">Welcome Greeting & Main Menu</CardTitle>
                                </CardHeader>
                                <CardContent className="px-4 pb-4 text-xs text-muted-foreground space-y-2">
                                    <p>
                                        Sends interactive buttons: [1] Software Services, [2] Pricing, [3] Request Callback.
                                    </p>
                                    <div className="rounded bg-muted/60 p-2 font-mono text-[11px] text-foreground">
                                        Replies sent today: 184
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-border/80 hover:border-[#47b672]/40 transition-colors">
                                <CardHeader className="pb-2 pt-4 px-4">
                                    <div className="flex items-center justify-between">
                                        <Badge className="bg-[#47b672] text-white text-[10px]">ACTIVE</Badge>
                                        <span className="text-[11px] text-muted-foreground">Keyword: "Price" / "Fee"</span>
                                    </div>
                                    <CardTitle className="text-sm font-bold mt-2">Instant Price List Dispatcher</CardTitle>
                                </CardHeader>
                                <CardContent className="px-4 pb-4 text-xs text-muted-foreground space-y-2">
                                    <p>
                                        Automatically responds with Sathwara WhatsApp SaaS tier rate card & PDF deck.
                                    </p>
                                    <div className="rounded bg-muted/60 p-2 font-mono text-[11px] text-foreground">
                                        Replies sent today: 92
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-border/80 hover:border-[#47b672]/40 transition-colors">
                                <CardHeader className="pb-2 pt-4 px-4">
                                    <div className="flex items-center justify-between">
                                        <Badge className="bg-[#47b672] text-white text-[10px]">ACTIVE</Badge>
                                        <span className="text-[11px] text-muted-foreground">Keyword: "Agent" / "Help"</span>
                                    </div>
                                    <CardTitle className="text-sm font-bold mt-2">Human Executive Handoff</CardTitle>
                                </CardHeader>
                                <CardContent className="px-4 pb-4 text-xs text-muted-foreground space-y-2">
                                    <p>
                                        Pauses bot automation and immediately assigns the chat to an active team agent in the Shared Inbox.
                                    </p>
                                    <div className="rounded bg-muted/60 p-2 font-mono text-[11px] text-foreground">
                                        Escalated today: 16
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>
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
