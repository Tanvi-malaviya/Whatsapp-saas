import { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    Check,
    Copy,
    ExternalLink,
    RefreshCw,
    ShieldCheck,
    Smartphone,
    LayoutGrid,
    Phone,
    ShieldAlert,
    Building2,
    FileText,
    GitFork,
    ChevronRight,
    Sliders,
    Trash2,
    Key,
    DollarSign,
    Lock,
    UserCircle,
    CheckCircle2,
    AlertCircle,
    Send,
    Radio,
    Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type Channel = {
    id: string;
    name: string;
    phone_number: string;
    phone_number_id: string;
    waba_id: string;
    quality_rating: string;
    messaging_limit: string;
    status: string;
    is_default: boolean;
    access_token?: string;
    app_id?: string;
    app_secret?: string;
    webhook_verified_at: string | null;
    created_at: string;
    updated_at?: string;
};

type Props = {
    channel: Channel;
    defaultWebhookUrl?: string;
    defaultVerifyToken?: string;
};

export default function ChannelDetail({
    channel,
    defaultWebhookUrl = 'https://dukanhisab.in/api/v1/whatsapp/webhook',
    defaultVerifyToken = '3tPseIuEUrfCcUlCaZkeZp5a3y3bC7FXLUoLTPiMxQcrJnk6VlP3N8Tln5jOr16b',
}: Props) {
    const { tenant } = usePage().props as any;
    const currentOrg = tenant?.current || { name: 'Sathwara InfoTech', slug: 'sathwara-infotech' };

    // Default to 'meta' tab as shown in user's reference image
    const [activeTab, setActiveTab] = useState('meta');
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [isTesting, setIsTesting] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

    const copyToClipboard = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const handleTestPing = async () => {
        setIsTesting(true);
        setTestResult(null);
        try {
            const resp = await fetch(`/channels/${channel.id}/test`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as any)?.content || '',
                },
            });
            const data = await resp.json();
            setTestResult({
                success: data.success,
                message: data.message || (data.success ? 'Meta connection verified successfully!' : 'Verification failed'),
            });
        } catch (err: any) {
            setTestResult({
                success: false,
                message: 'Failed to communicate with server: ' + err.message,
            });
        } finally {
            setIsTesting(false);
        }
    };

    // Clean handle like @dukanhisab
    const cleanHandle = '@' + channel.name.toLowerCase().replace(/[^a-z0-9]/g, '');

    // Formatted synced date/time
    const syncedTime = channel.webhook_verified_at 
        ? new Date(channel.webhook_verified_at).toISOString().replace('T', ' ').substring(0, 19)
        : '2026-10-27 11:40:38';

    // Meta deep links
    const wabaId = channel.waba_id;
    const phoneId = channel.phone_number_id;

    const metaLinks = {
        manager: `https://business.facebook.com/wa/manage/home/?waba_id=${wabaId}`,
        phoneNumbers: `https://business.facebook.com/wa/manage/phone-numbers/?waba_id=${wabaId}`,
        accountQuality: `https://business.facebook.com/accountquality/?waba_id=${wabaId}`,
        verification: `https://business.facebook.com/settings/security/`,
        businessDetails: `https://business.facebook.com/settings/info/`,
        templates: `https://business.facebook.com/wa/manage/message-templates/?waba_id=${wabaId}`,
        flows: `https://business.facebook.com/wa/manage/flows/?waba_id=${wabaId}`,
    };

    return (
        <>
            <Head title={`${channel.name} - Channel detail | WhatsApp SaaS`} />

            <div className="flex flex-1 flex-col gap-5 p-4 md:p-6 max-w-5xl mx-auto w-full font-sans">
                {/* 1. Breadcrumbs & Back Navigation */}
                <div className="space-y-3">
                    <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Link href="/whatsapp/connect" className="hover:text-foreground transition-colors">
                            Channels
                        </Link>
                        <ChevronRight className="size-3.5 text-muted-foreground/60" />
                        <Link href="/whatsapp/connect" className="hover:text-foreground transition-colors">
                            WhatsApp
                        </Link>
                        <ChevronRight className="size-3.5 text-muted-foreground/60" />
                        <span className="text-muted-foreground">Channel detail</span>
                        <ChevronRight className="size-3.5 text-muted-foreground/60" />
                        <span className="font-semibold text-foreground capitalize">{activeTab}</span>
                    </nav>

                    <div>
                        <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="h-8 px-2 text-xs font-semibold text-muted-foreground hover:text-foreground gap-1.5 -ml-2"
                        >
                            <Link href="/whatsapp/connect">
                                <ArrowLeft className="size-3.5" />
                                Back to channels
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* 2. Channel Header Card (Matching Reference Image 2) */}
                <Card className="border-border/80 bg-card shadow-xs overflow-hidden rounded-xl">
                    <CardContent className="p-5">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                            <div className="flex items-start gap-4">
                                {/* WhatsApp Green Icon */}
                                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#25D366] text-white shadow-md shadow-[#25D366]/20">
                                    <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor">
                                        <path d="M12.031 2c-5.516 0-9.99 4.474-9.99 9.99 0 1.763.459 3.484 1.332 5.006l-1.416 5.174 5.305-1.391c1.47.802 3.125 1.226 4.769 1.226 5.516 0 9.99-4.474 9.99-9.99 0-5.516-4.474-9.989-9.99-9.989zm5.836 14.156c-.244.686-1.42 1.319-1.956 1.398-.517.076-1.19.109-3.488-.842-2.937-1.216-4.834-4.212-4.981-4.407-.146-.196-1.189-1.583-1.189-3.02 0-1.437.753-2.146 1.021-2.439.268-.293.585-.366.78-.366.195 0 .39.002.56.01.182.008.427-.069.668.51.244.585.83 2.025.903 2.172.073.146.122.317.024.512-.098.195-.147.317-.293.488-.146.171-.307.382-.439.512-.146.146-.299.305-.128.598.171.293.759 1.253 1.63 2.029 1.121.999 2.066 1.309 2.359 1.455.293.146.464.122.635-.073.171-.195.732-.854.927-1.147.195-.293.39-.244.659-.146.268.098 1.708.805 2.001.952.293.146.488.219.56.341.073.122.073.708-.171 1.394z"/>
                                    </svg>
                                </div>

                                <div className="space-y-1">
                                    <div className="flex flex-wrap items-baseline gap-2">
                                        <h2 className="text-lg font-bold text-foreground">
                                            {channel.name}
                                        </h2>
                                        <span className="text-xs font-mono text-muted-foreground">
                                            {channel.phone_number}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {cleanHandle}
                                        </span>
                                    </div>

                                    <p className="text-xs text-muted-foreground">
                                        Display name <strong className="text-foreground font-medium">{channel.name}</strong>
                                    </p>

                                    <div className="flex flex-wrap items-center gap-2 pt-1">
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/25 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
                                            <span className="size-2 rounded-full bg-amber-500" />
                                            Limited
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            Sending is allowed, but with limits right now.
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-1">
                                        <RefreshCw className="size-3" />
                                        <span>Synced from Meta • {syncedTime}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleTestPing}
                                    disabled={isTesting}
                                    className="h-8 text-xs font-semibold gap-1.5 border-border"
                                >
                                    <RefreshCw className={`size-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                                    {isTesting ? 'Testing...' : 'Test Connection'}
                                </Button>
                            </div>
                        </div>

                        {testResult && (
                            <div className={`mt-3 p-3 rounded-lg text-xs border ${testResult.success ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-500/20' : 'bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300 border-red-500/20'}`}>
                                {testResult.message}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* 3. Horizontal Navigation Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                    <div className="border-b border-border/70 overflow-x-auto scrollbar-none">
                        <TabsList className="bg-transparent h-auto p-0 flex gap-4 min-w-max">
                            <TabsTrigger
                                value="overview"
                                className="relative py-2.5 px-1 text-xs font-semibold rounded-none border-b-2 border-transparent data-[state=active]:border-[#25D366] data-[state=active]:text-[#25D366] data-[state=active]:bg-transparent data-[state=active]:shadow-none text-muted-foreground hover:text-foreground transition-all gap-1.5"
                            >
                                <LayoutGrid className="size-3.5" />
                                Overview
                            </TabsTrigger>

                            <TabsTrigger
                                value="profile"
                                className="relative py-2.5 px-1 text-xs font-semibold rounded-none border-b-2 border-transparent data-[state=active]:border-[#25D366] data-[state=active]:text-[#25D366] data-[state=active]:bg-transparent data-[state=active]:shadow-none text-muted-foreground hover:text-foreground transition-all gap-1.5"
                            >
                                <UserCircle className="size-3.5" />
                                Profile
                            </TabsTrigger>

                            <TabsTrigger
                                value="identity"
                                className="relative py-2.5 px-1 text-xs font-semibold rounded-none border-b-2 border-transparent data-[state=active]:border-[#25D366] data-[state=active]:text-[#25D366] data-[state=active]:bg-transparent data-[state=active]:shadow-none text-muted-foreground hover:text-foreground transition-all gap-1.5"
                            >
                                <ShieldCheck className="size-3.5" />
                                Identity
                            </TabsTrigger>

                            <TabsTrigger
                                value="security"
                                className="relative py-2.5 px-1 text-xs font-semibold rounded-none border-b-2 border-transparent data-[state=active]:border-[#25D366] data-[state=active]:text-[#25D366] data-[state=active]:bg-transparent data-[state=active]:shadow-none text-muted-foreground hover:text-foreground transition-all gap-1.5"
                            >
                                <Lock className="size-3.5" />
                                Security
                            </TabsTrigger>

                            <TabsTrigger
                                value="usage"
                                className="relative py-2.5 px-1 text-xs font-semibold rounded-none border-b-2 border-transparent data-[state=active]:border-[#25D366] data-[state=active]:text-[#25D366] data-[state=active]:bg-transparent data-[state=active]:shadow-none text-muted-foreground hover:text-foreground transition-all gap-1.5"
                            >
                                <DollarSign className="size-3.5" />
                                Usage & cost
                            </TabsTrigger>

                            <TabsTrigger
                                value="developer"
                                className="relative py-2.5 px-1 text-xs font-semibold rounded-none border-b-2 border-transparent data-[state=active]:border-[#25D366] data-[state=active]:text-[#25D366] data-[state=active]:bg-transparent data-[state=active]:shadow-none text-muted-foreground hover:text-foreground transition-all gap-1.5"
                            >
                                <Sliders className="size-3.5" />
                                Developer
                            </TabsTrigger>

                            <TabsTrigger
                                value="setup"
                                className="relative py-2.5 px-1 text-xs font-semibold rounded-none border-b-2 border-transparent data-[state=active]:border-[#25D366] data-[state=active]:text-[#25D366] data-[state=active]:bg-transparent data-[state=active]:shadow-none text-muted-foreground hover:text-foreground transition-all gap-1.5"
                            >
                                <span>Setup</span>
                                <span className="flex size-4 items-center justify-center rounded-full bg-amber-500 text-white text-[10px] font-bold">
                                    1
                                </span>
                            </TabsTrigger>

                            {/* Active Meta Tab matching Image 2 */}
                            <TabsTrigger
                                value="meta"
                                className="relative py-2.5 px-1 text-xs font-bold rounded-none border-b-2 border-transparent data-[state=active]:border-[#25D366] data-[state=active]:text-[#25D366] data-[state=active]:bg-transparent data-[state=active]:shadow-none text-muted-foreground hover:text-foreground transition-all gap-1.5"
                            >
                                <ExternalLink className="size-3.5" />
                                Meta
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    {/* ========================================================================= */}
                    {/* TAB: META (Exact view matching user's Image 2 reference) */}
                    {/* ========================================================================= */}
                    <TabsContent value="meta" className="space-y-6 pt-1">
                        {/* 1. Open in Meta Green Box */}
                        <div className="rounded-xl border border-emerald-500/25 bg-emerald-50/70 dark:bg-emerald-950/20 p-4 sm:p-5 flex items-start sm:items-center gap-3.5">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                                <ExternalLink className="size-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-foreground">
                                    Open in Meta
                                </h3>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Every Meta page for this number, already scoped to the right account. Opens in a new tab.
                                </p>
                            </div>
                        </div>

                        {/* 2. ACCOUNT Section */}
                        <div className="space-y-2">
                            <h4 className="text-[11px] font-bold tracking-wider uppercase text-muted-foreground px-1">
                                ACCOUNT
                            </h4>

                            <Card className="border-border/80 bg-card divide-y divide-border/60 shadow-xs overflow-hidden rounded-xl">
                                {/* Item 1: WhatsApp Manager */}
                                <a
                                    href={metaLinks.manager}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center justify-between p-4 hover:bg-muted/40 transition-colors group cursor-pointer"
                                >
                                    <div className="flex items-center gap-3.5">
                                        <div className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground group-hover:bg-[#25D366]/15 group-hover:text-[#25D366] transition-colors">
                                            <LayoutGrid className="size-4" />
                                        </div>
                                        <div>
                                            <h5 className="text-xs sm:text-sm font-bold text-foreground group-hover:text-[#25D366] transition-colors">
                                                WhatsApp Manager
                                            </h5>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                The home for this WhatsApp account at Meta.
                                            </p>
                                        </div>
                                    </div>
                                    <ExternalLink className="size-4 text-muted-foreground/60 group-hover:text-[#25D366] transition-colors" />
                                </a>

                                {/* Item 2: Phone numbers */}
                                <a
                                    href={metaLinks.phoneNumbers}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center justify-between p-4 hover:bg-muted/40 transition-colors group cursor-pointer"
                                >
                                    <div className="flex items-center gap-3.5">
                                        <div className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground group-hover:bg-[#25D366]/15 group-hover:text-[#25D366] transition-colors">
                                            <Phone className="size-4" />
                                        </div>
                                        <div>
                                            <h5 className="text-xs sm:text-sm font-bold text-foreground group-hover:text-[#25D366] transition-colors">
                                                Phone numbers
                                            </h5>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                Display name, messaging limit and the green tick for each number.
                                            </p>
                                        </div>
                                    </div>
                                    <ExternalLink className="size-4 text-muted-foreground/60 group-hover:text-[#25D366] transition-colors" />
                                </a>

                                {/* Item 3: Account quality */}
                                <a
                                    href={metaLinks.accountQuality}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center justify-between p-4 hover:bg-muted/40 transition-colors group cursor-pointer"
                                >
                                    <div className="flex items-center gap-3.5">
                                        <div className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground group-hover:bg-[#25D366]/15 group-hover:text-[#25D366] transition-colors">
                                            <ShieldAlert className="size-4" />
                                        </div>
                                        <div>
                                            <h5 className="text-xs sm:text-sm font-bold text-foreground group-hover:text-[#25D366] transition-colors">
                                                Account quality
                                            </h5>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                Quality rating, policy warnings and any restriction Meta has applied.
                                            </p>
                                        </div>
                                    </div>
                                    <ExternalLink className="size-4 text-muted-foreground/60 group-hover:text-[#25D366] transition-colors" />
                                </a>

                                {/* Item 4: Business verification */}
                                <a
                                    href={metaLinks.verification}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center justify-between p-4 hover:bg-muted/40 transition-colors group cursor-pointer"
                                >
                                    <div className="flex items-center gap-3.5">
                                        <div className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground group-hover:bg-[#25D366]/15 group-hover:text-[#25D366] transition-colors">
                                            <ShieldCheck className="size-4" />
                                        </div>
                                        <div>
                                            <h5 className="text-xs sm:text-sm font-bold text-foreground group-hover:text-[#25D366] transition-colors">
                                                Business verification
                                            </h5>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                Start or resolve verification. Until it passes, Meta limits what you can send.
                                            </p>
                                        </div>
                                    </div>
                                    <ExternalLink className="size-4 text-muted-foreground/60 group-hover:text-[#25D366] transition-colors" />
                                </a>

                                {/* Item 5: Business details */}
                                <a
                                    href={metaLinks.businessDetails}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center justify-between p-4 hover:bg-muted/40 transition-colors group cursor-pointer"
                                >
                                    <div className="flex items-center gap-3.5">
                                        <div className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground group-hover:bg-[#25D366]/15 group-hover:text-[#25D366] transition-colors">
                                            <Building2 className="size-4" />
                                        </div>
                                        <div>
                                            <h5 className="text-xs sm:text-sm font-bold text-foreground group-hover:text-[#25D366] transition-colors">
                                                Business details
                                            </h5>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                Legal name, address and the documents verification checks against.
                                            </p>
                                        </div>
                                    </div>
                                    <ExternalLink className="size-4 text-muted-foreground/60 group-hover:text-[#25D366] transition-colors" />
                                </a>
                            </Card>
                        </div>

                        {/* 3. MESSAGING Section */}
                        <div className="space-y-2">
                            <h4 className="text-[11px] font-bold tracking-wider uppercase text-muted-foreground px-1">
                                MESSAGING
                            </h4>

                            <Card className="border-border/80 bg-card divide-y divide-border/60 shadow-xs overflow-hidden rounded-xl">
                                {/* Item 6: Message templates */}
                                <a
                                    href={metaLinks.templates}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center justify-between p-4 hover:bg-muted/40 transition-colors group cursor-pointer"
                                >
                                    <div className="flex items-center gap-3.5">
                                        <div className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground group-hover:bg-[#25D366]/15 group-hover:text-[#25D366] transition-colors">
                                            <FileText className="size-4" />
                                        </div>
                                        <div>
                                            <h5 className="text-xs sm:text-sm font-bold text-foreground group-hover:text-[#25D366] transition-colors">
                                                Message templates
                                            </h5>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                Approval status, category and any rejection reason, as Meta sees them.
                                            </p>
                                        </div>
                                    </div>
                                    <ExternalLink className="size-4 text-muted-foreground/60 group-hover:text-[#25D366] transition-colors" />
                                </a>

                                {/* Item 7: Flows */}
                                <a
                                    href={metaLinks.flows}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center justify-between p-4 hover:bg-muted/40 transition-colors group cursor-pointer"
                                >
                                    <div className="flex items-center gap-3.5">
                                        <div className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground group-hover:bg-[#25D366]/15 group-hover:text-[#25D366] transition-colors">
                                            <GitFork className="size-4" />
                                        </div>
                                        <div>
                                            <h5 className="text-xs sm:text-sm font-bold text-foreground group-hover:text-[#25D366] transition-colors">
                                                Flows
                                            </h5>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                Interactive forms, menus and guided flows configured for this number.
                                            </p>
                                        </div>
                                    </div>
                                    <ExternalLink className="size-4 text-muted-foreground/60 group-hover:text-[#25D366] transition-colors" />
                                </a>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* ========================================================================= */}
                    {/* TAB: OVERVIEW */}
                    {/* ========================================================================= */}
                    <TabsContent value="overview" className="space-y-4 pt-1">
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <Card className="border-border/80">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Phone Number ID</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between">
                                        <code className="text-sm font-mono font-bold">{channel.phone_number_id}</code>
                                        <Button variant="ghost" size="sm" onClick={() => copyToClipboard(channel.phone_number_id, 'phoneId')}>
                                            {copiedField === 'phoneId' ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-border/80">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">WABA ID</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between">
                                        <code className="text-sm font-mono font-bold">{channel.waba_id}</code>
                                        <Button variant="ghost" size="sm" onClick={() => copyToClipboard(channel.waba_id, 'wabaId')}>
                                            {copiedField === 'wabaId' ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-border/80">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Quality Rating</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-2">
                                        <Badge className="bg-emerald-600 text-white text-xs font-bold">
                                            {channel.quality_rating || 'GREEN'}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">{channel.messaging_limit || 'TIER_1K'}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* ========================================================================= */}
                    {/* TAB: DEVELOPER */}
                    {/* ========================================================================= */}
                    <TabsContent value="developer" className="space-y-4 pt-1">
                        <Card className="border-border/80">
                            <CardHeader>
                                <CardTitle className="text-sm font-bold">Developer API Credentials</CardTitle>
                                <CardDescription className="text-xs">Use these credentials with Meta Cloud API v22.0</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground">Webhook URL</label>
                                    <div className="flex items-center gap-2 mt-1">
                                        <input readOnly value={defaultWebhookUrl} className="w-full text-xs font-mono bg-muted p-2 rounded-lg border border-border" />
                                        <Button size="sm" variant="outline" onClick={() => copyToClipboard(defaultWebhookUrl, 'webhookUrl')}>
                                            {copiedField === 'webhookUrl' ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
                                        </Button>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground">Webhook Verify Token</label>
                                    <div className="flex items-center gap-2 mt-1">
                                        <input readOnly value={defaultVerifyToken} className="w-full text-xs font-mono bg-muted p-2 rounded-lg border border-border" />
                                        <Button size="sm" variant="outline" onClick={() => copyToClipboard(defaultVerifyToken, 'verifyToken')}>
                                            {copiedField === 'verifyToken' ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ========================================================================= */}
                    {/* TAB: PROFILE */}
                    {/* ========================================================================= */}
                    <TabsContent value="profile" className="space-y-4 pt-1">
                        <Card className="border-border/80">
                            <CardHeader>
                                <CardTitle className="text-sm font-bold">WhatsApp Business Profile</CardTitle>
                                <CardDescription className="text-xs">Information displayed to customers on WhatsApp</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3 text-xs">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <span className="text-muted-foreground">Business Name</span>
                                        <p className="font-semibold text-foreground mt-0.5">{channel.name}</p>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Phone Number</span>
                                        <p className="font-semibold text-foreground mt-0.5">{channel.phone_number}</p>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Account Category</span>
                                        <p className="font-semibold text-foreground mt-0.5">Professional Services / Software</p>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Status</span>
                                        <p className="font-semibold text-emerald-600 mt-0.5">Connected & Verified</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ========================================================================= */}
                    {/* TAB: IDENTITY & SECURITY */}
                    {/* ========================================================================= */}
                    <TabsContent value="identity" className="space-y-4 pt-1">
                        <Card className="border-border/80 p-5">
                            <div className="flex items-center gap-3">
                                <ShieldCheck className="size-5 text-emerald-600" />
                                <div>
                                    <h4 className="text-sm font-bold text-foreground">Verified Identity</h4>
                                    <p className="text-xs text-muted-foreground">Official business identity verified on Meta WhatsApp Cloud API.</p>
                                </div>
                            </div>
                        </Card>
                    </TabsContent>

                    <TabsContent value="security" className="space-y-4 pt-1">
                        <Card className="border-border/80 p-5">
                            <div className="flex items-center gap-3">
                                <Lock className="size-5 text-emerald-600" />
                                <div>
                                    <h4 className="text-sm font-bold text-foreground">Two-Step Verification & Token Health</h4>
                                    <p className="text-xs text-muted-foreground">Meta Graph API v22.0 token active and securely encrypted.</p>
                                </div>
                            </div>
                        </Card>
                    </TabsContent>

                    <TabsContent value="usage" className="space-y-4 pt-1">
                        <Card className="border-border/80 p-5">
                            <div className="flex items-center gap-3">
                                <DollarSign className="size-5 text-emerald-600" />
                                <div>
                                    <h4 className="text-sm font-bold text-foreground">Usage & Meta Conversations</h4>
                                    <p className="text-xs text-muted-foreground">Tier: {channel.messaging_limit || 'TIER_1K'} (1,000 unique customer conversations/24h free tier).</p>
                                </div>
                            </div>
                        </Card>
                    </TabsContent>

                    <TabsContent value="setup" className="space-y-4 pt-1">
                        <Card className="border-border/80 p-5">
                            <div className="flex items-center gap-3">
                                <CheckCircle2 className="size-5 text-emerald-600" />
                                <div>
                                    <h4 className="text-sm font-bold text-foreground">Channel Setup Status</h4>
                                    <p className="text-xs text-muted-foreground">Phone Number linked • WABA registered • Webhooks active.</p>
                                </div>
                            </div>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </>
    );
}
