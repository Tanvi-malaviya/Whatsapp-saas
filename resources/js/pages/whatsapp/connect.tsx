import { api } from '@/lib/api';
import { useState, useEffect, useRef } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Smartphone,
    CheckCircle2,
    ShieldCheck,
    AlertCircle,
    Building2,
    ExternalLink,
    Zap,
    Plus,
    Copy,
    Check,
    Trash2,
    RefreshCw,
    QrCode,
    Radio,
    Sparkles,
    ChevronRight,
    Send,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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
};

type Props = {
    channels?: Channel[];
    defaultWebhookUrl?: string;
    defaultVerifyToken?: string;
    metaAppId?: string;
    maxChannels?: number;
    channelsCount?: number;
    canAddMore?: boolean;
};

export default function WhatsAppConnect({
    channels = [],
    defaultWebhookUrl = '',
    defaultVerifyToken = '',
    metaAppId = '',
    maxChannels = 1,
    channelsCount = 0,
    canAddMore = true,
}: Props) {
    const { tenant } = usePage().props as any;
    const currentOrg = tenant?.current;

    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [syncingChannelId, setSyncingChannelId] = useState<string | null>(null);
    const [syncNotice, setSyncNotice] = useState<string | null>(null);

    const popupRef = useRef<Window | null>(null);

    // Initialize official Facebook JavaScript SDK for Embedded Signup
    useEffect(() => {
        if (typeof window !== 'undefined' && metaAppId) {
            (window as any).fbAsyncInit = function () {
                (window as any).FB.init({
                    appId: metaAppId,
                    cookie: true,
                    xfbml: true,
                    version: 'v22.0',
                });
            };

            if (!document.getElementById('facebook-jssdk')) {
                const js = document.createElement('script');
                js.id = 'facebook-jssdk';
                js.src = 'https://connect.facebook.net/en_US/sdk.js';
                js.async = true;
                js.defer = true;
                document.body.appendChild(js);
            }
        }
    }, [metaAppId]);

    useEffect(() => {
        const connected = (event: MessageEvent) => {
            if (event.origin === window.location.origin) {
                if (event.data?.type === 'WHATSAPP_CONNECTED') {
                    router.reload();
                } else if (event.data?.type === 'WHATSAPP_CONNECT_ERROR') {
                    setSyncNotice(`Connection error: ${event.data.error || 'Connection failed'}`);
                }
            }
        };
        window.addEventListener('message', connected);
        return () => window.removeEventListener('message', connected);
    }, []);

    // 1-Click Connect with Meta (Embedded Signup)
    const launchDirectMetaWizard = async () => {
        if (!canAddMore) {
            alert(`Your workspace has reached the limit of ${maxChannels} WhatsApp number(s). To connect more numbers, please upgrade your plan in the Admin Panel.`);
            return;
        }

        setIsConnecting(true);
        const popup = window.open('about:blank', 'WhatsAppSignup', 'width=650,height=750');
        try {
            const data = await api('/channels/signup', 'POST', {});
            if (popup) {
                popupRef.current = popup;
                popup.location.href = data.url;
            } else {
                window.location.assign(data.url);
            }
        } catch (error) {
            popup?.close();
            setSyncNotice((error as Error).message);
        } finally {
            setIsConnecting(false);
        }
    };

    // Synchronize an active channel directly from Meta
    const handleSyncActiveChannel = async (channelId: string) => {
        setSyncingChannelId(channelId);
        setSyncNotice(null);
        try {
            const res = await fetch('/channels/sync-meta', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
            });
            const data = await res.json();
            if (data.success) {
                setSyncNotice(data.message || 'Synced successfully from Meta!');
                router.reload({ only: ['channels'] });
            } else {
                setSyncNotice(data.message || 'Could not sync from Meta.');
            }
        } catch (e: any) {
            setSyncNotice('Sync error: ' + e.message);
        } finally {
            setSyncingChannelId(null);
            setTimeout(() => setSyncNotice(null), 5000);
        }
    };

    const copyToClipboard = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const handleDelete = (id: string, name: string) => {
        if (confirm(`Are you sure you want to disconnect WhatsApp number "${name}"? Message history will be safely preserved.`)) {
            router.delete(`/channels/${id}`, {
                preserveScroll: true,
            });
        }
    };

    return (
        <>
            <Head title="WhatsApp Channels & Phone Number Management" />

            <div className="flex flex-1 flex-col gap-4 p-3.5 sm:p-5 max-w-5xl mx-auto w-full font-sans">
                {/* Header Row: Clean, without redundant back button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/70 pb-3.5">
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shadow-2xs">
                            <Smartphone className="size-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
                                    WhatsApp Channels
                                </h1>
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
                                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    Meta Cloud API
                                </span>
                                {maxChannels <= 0 ? (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 text-[10px] font-semibold text-purple-600 dark:text-purple-400">
                                        <Sparkles className="size-2.5" /> Unlimited Numbers Plan
                                    </span>
                                ) : (
                                    <span
                                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                                            canAddMore
                                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                                                : 'bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-300 font-bold'
                                        }`}
                                    >
                                        Allowance: {channelsCount}/{maxChannels} Used {maxChannels === 1 ? '(Single Number)' : `(Max ${maxChannels})`}
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Connect numbers directly with Meta to manage live messaging, broadcasts, and automated bot flows.
                            </p>
                        </div>
                    </div>

                    {/* Primary Action: Connect via Meta Only (No Manual Entry) */}
                    <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                        <Button
                            type="button"
                            size="sm"
                            disabled={isConnecting || !canAddMore}
                            onClick={launchDirectMetaWizard}
                            className="h-9 px-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-semibold rounded-xl gap-2 shadow-md shadow-emerald-500/20 cursor-pointer"
                        >
                            <Plus className="size-4" />
                            <span>{isConnecting ? 'Opening Meta...' : 'Connect Number via Meta'}</span>
                        </Button>
                    </div>
                </div>

                {/* Quota limit warning alert if limit reached */}
                {!canAddMore && (
                    <div className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-800 dark:text-amber-300 text-xs shadow-2xs">
                        <AlertCircle className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                        <span>
                            <strong>Number Quota Reached:</strong> Your current subscription allows a maximum of <strong>{maxChannels}</strong> WhatsApp number{maxChannels > 1 ? 's' : ''}. Contact support or upgrade your plan in settings to connect additional numbers.
                        </span>
                    </div>
                )}

                {syncNotice && (
                    <div className="rounded-xl bg-primary/10 border border-primary/20 px-3.5 py-2 text-xs text-primary font-medium flex items-center justify-between">
                        <span>{syncNotice}</span>
                        <button onClick={() => setSyncNotice(null)} className="text-primary hover:text-primary/70 text-xs font-semibold cursor-pointer">
                            Dismiss
                        </button>
                    </div>
                )}

                {/* Connected Channels List */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                            <span>Connected Numbers ({channels.length})</span>
                            {currentOrg && (
                                <Badge variant="outline" className="text-[10px] text-foreground font-normal border-border bg-muted/40 py-0">
                                    Workspace: <strong className="ml-1 text-primary font-bold">{currentOrg.name}</strong>
                                </Badge>
                            )}
                        </div>
                    </div>

                    {channels.length === 0 ? (
                        <Card className="border-border/80 bg-card p-8 text-center shadow-2xs rounded-2xl">
                            <div className="flex size-14 mx-auto items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 mb-3 shadow-sm">
                                <Smartphone className="size-7" />
                            </div>
                            <h3 className="text-sm sm:text-base font-bold text-foreground">
                                No WhatsApp Numbers Connected
                            </h3>
                            <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1.5 mb-4 leading-relaxed">
                                Link your official WhatsApp Business number directly through Facebook &amp; Meta. No need to look up Phone IDs, WABA IDs, or access tokens manually.
                            </p>
                            <Button
                                size="sm"
                                disabled={isConnecting || !canAddMore}
                                onClick={launchDirectMetaWizard}
                                className="h-9 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-semibold rounded-xl gap-2 shadow-md shadow-emerald-500/20 cursor-pointer"
                            >
                                <Plus className="size-4" />
                                <span>Connect with Meta Now</span>
                            </Button>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 gap-3">
                            {channels.map((ch) => (
                                <Card
                                    key={ch.id}
                                    className="border-border/80 bg-card overflow-hidden shadow-2xs hover:border-primary/40 hover:shadow-xs transition-all rounded-2xl"
                                >
                                    <div className="flex flex-col md:flex-row md:items-center justify-between p-4 gap-4">
                                        <div className="flex items-start gap-3.5">
                                            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-bold mt-0.5">
                                                <Smartphone className="size-5" />
                                            </div>
                                            <div className="space-y-1 min-w-0">
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                    <h3 className="text-sm font-bold text-foreground truncate">
                                                        {ch.name}
                                                    </h3>
                                                    {ch.is_default && (
                                                        <Badge className="bg-primary text-primary-foreground text-[10px] font-semibold py-0 px-2">
                                                            DEFAULT
                                                        </Badge>
                                                    )}
                                                    <Badge
                                                        variant="outline"
                                                        className={`text-[10px] py-0 px-2 font-semibold ${
                                                            ch.quality_rating === 'GREEN'
                                                                ? 'border-emerald-500/30 text-emerald-600 bg-emerald-500/10'
                                                                : ch.quality_rating === 'YELLOW'
                                                                ? 'border-amber-500/30 text-amber-600 bg-amber-500/10'
                                                                : 'border-destructive/30 text-destructive bg-destructive/10'
                                                        }`}
                                                    >
                                                        QUALITY: {ch.quality_rating || 'GREEN'}
                                                    </Badge>
                                                    <Badge variant="outline" className="text-[10px] text-muted-foreground border-border/80 py-0 px-1.5">
                                                        {ch.messaging_limit || 'TIER_1K'}
                                                    </Badge>
                                                </div>

                                                <p className="text-xs font-mono text-muted-foreground flex flex-wrap items-center gap-2">
                                                    <span>
                                                        Number:{' '}
                                                        <strong className="text-foreground text-emerald-600 dark:text-emerald-400 font-semibold">
                                                            {ch.phone_number || 'Registered'}
                                                        </strong>
                                                    </span>
                                                    <span>•</span>
                                                    <span>Phone ID: <span className="font-semibold text-foreground">{ch.phone_number_id}</span></span>
                                                    <span>•</span>
                                                    <span>WABA ID: <span className="font-semibold text-foreground">{ch.waba_id}</span></span>
                                                </p>
                                            </div>
                                        </div>

                                        {/* Actions Per Active Channel: Sync from Meta, Details & Test, Make Default, Disconnect */}
                                        <div className="flex flex-wrap items-center gap-2 shrink-0 self-start md:self-auto pt-2 md:pt-0 border-t md:border-t-0 border-border/60">
                                            {/* Sync from Meta inside Active Channel */}
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                disabled={syncingChannelId === ch.id}
                                                onClick={() => handleSyncActiveChannel(ch.id)}
                                                className="h-8 text-xs px-2.5 rounded-lg border-border/80 gap-1.5 text-foreground hover:bg-muted cursor-pointer"
                                                title="Sync quality rating, limits, and verified name from Meta"
                                            >
                                                <RefreshCw className={`size-3 ${syncingChannelId === ch.id ? 'animate-spin text-primary' : 'text-muted-foreground'}`} />
                                                <span>{syncingChannelId === ch.id ? 'Syncing...' : 'Sync from Meta'}</span>
                                            </Button>

                                            {/* Channel Details & Scan Test */}
                                            <Button
                                                asChild
                                                size="sm"
                                                variant="outline"
                                                className="h-8 text-xs px-2.5 rounded-lg border-border/80 gap-1.5 text-foreground hover:bg-muted"
                                            >
                                                <Link href={`/channels/${ch.id}`}>
                                                    <QrCode className="size-3 text-emerald-600" />
                                                    <span>Details &amp; Test Chat</span>
                                                </Link>
                                            </Button>

                                            {!ch.is_default && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        router.post(`/channels/${ch.id}/set-default`, {}, { preserveScroll: true });
                                                    }}
                                                    className="h-8 text-xs px-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                                                    title="Set as primary WhatsApp sender"
                                                >
                                                    Set Default
                                                </Button>
                                            )}

                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(ch.id, ch.name)}
                                                className="size-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                title="Disconnect channel"
                                            >
                                                <Trash2 className="size-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                {/* Webhook Configuration for Meta Developers Portal */}
                <Card className="border-border/80 bg-card rounded-2xl shadow-2xs overflow-hidden mt-2">
                    <CardHeader className="py-3 px-4 border-b border-border/60 bg-muted/20">
                        <CardTitle className="text-xs sm:text-sm font-bold flex items-center gap-2 text-foreground">
                            <Radio className="size-3.5 text-primary" />
                            Meta WhatsApp Webhook Configuration
                        </CardTitle>
                        <CardDescription className="text-xs">
                            In Meta for Developers App &gt; WhatsApp &gt; Configuration, set this Webhook URL and Verify Token so incoming customer chats reach your workspace.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 p-4">
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-foreground">
                                    Callback / Webhook URL
                                </label>
                                <div className="flex gap-1.5">
                                    <input
                                        readOnly
                                        value={defaultWebhookUrl}
                                        className="w-full rounded-lg border border-input bg-muted/40 px-2.5 py-1 text-xs text-foreground font-mono"
                                    />
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => copyToClipboard(defaultWebhookUrl, 'webhookUrl')}
                                        className="h-8 shrink-0 text-xs px-2.5 rounded-lg border-border gap-1 hover:bg-muted cursor-pointer"
                                    >
                                        {copiedField === 'webhookUrl' ? <Check className="size-3.5 text-primary" /> : <Copy className="size-3.5" />}
                                        Copy
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-foreground">
                                    Webhook Verify Token
                                </label>
                                <div className="flex gap-1.5">
                                    <input
                                        readOnly
                                        value={defaultVerifyToken || 'Managed in Platform Settings'}
                                        className="w-full rounded-lg border border-input bg-muted/40 px-2.5 py-1 text-xs text-foreground font-mono"
                                    />
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => copyToClipboard(defaultVerifyToken, 'verifyToken')}
                                        className="h-8 shrink-0 text-xs px-2.5 rounded-lg border-border gap-1 hover:bg-muted cursor-pointer"
                                    >
                                        {copiedField === 'verifyToken' ? <Check className="size-3.5 text-primary" /> : <Copy className="size-3.5" />}
                                        Copy
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 rounded-xl bg-primary/5 border border-primary/20 p-2.5 text-xs text-muted-foreground">
                            <ShieldCheck className="size-4 text-primary shrink-0" />
                            <span>
                                Subscribe to <strong>messages</strong>, <strong>message_template_status_update</strong>, and <strong>phone_number_quality_update</strong> in Meta Webhook fields.
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
