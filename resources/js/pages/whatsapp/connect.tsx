import { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Smartphone,
    CheckCircle2,
    ArrowLeft,
    ShieldCheck,
    AlertCircle,
    Building2,
    Key,
    ExternalLink,
    Zap,
    Plus,
    Copy,
    Check,
    Trash2,
    RefreshCw,
    QrCode,
    Sliders,
    Radio,
    Sparkles,
    ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

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
};

export default function WhatsAppConnect({
    channels = [],
    defaultWebhookUrl = 'https://dukanhisab.in/api/v1/whatsapp/webhook',
    defaultVerifyToken = '3tPseIuEUrfCcUlCaZkeZp5a3y3bC7FXLUoLTPiMxQcrJnk6VlP3N8Tln5jOr16b',
}: Props) {
    const { tenant } = usePage().props as any;
    const currentOrg = tenant?.current;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [isTesting, setIsTesting] = useState<string | null>(null);
    const [testResult, setTestResult] = useState<{ id: string; success: boolean; message: string } | null>(null);

    const emptyForm = {
        name: '',
        phone_number: '',
        phone_number_id: '',
        waba_id: '',
        access_token: '',
        app_id: '',
        app_secret: '',
    };

    // Form inputs for connecting ANY WhatsApp number (blank by default)
    const [form, setForm] = useState(emptyForm);
    const [isEditing, setIsEditing] = useState(false);

    const handleEditChannel = (ch: Channel) => {
        setIsEditing(true);
        setForm({
            name: ch.name || '',
            phone_number: ch.phone_number || '',
            phone_number_id: ch.phone_number_id || '',
            waba_id: ch.waba_id || '',
            access_token: ch.access_token || '',
            app_id: ch.app_id || '',
            app_secret: ch.app_secret || '',
        });
        setIsModalOpen(true);
    };

    const copyToClipboard = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.post('/channels', form, {
            preserveScroll: true,
            onSuccess: () => {
                setIsModalOpen(false);
                setIsEditing(false);
            },
        });
    };

    const handleDelete = (id: string, name: string) => {
        if (confirm(`Are you sure you want to disconnect WhatsApp number "${name}"?`)) {
            router.delete(`/channels/${id}`, {
                preserveScroll: true,
            });
        }
    };

    const handleTestPing = async (id: string) => {
        setIsTesting(id);
        setTestResult(null);
        try {
            const res = await fetch(`/channels/${id}/test`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
            });
            const data = await res.json();
            setTestResult({
                id,
                success: data.success,
                message: data.message || (data.success ? 'Meta Cloud API verified!' : 'Verification failed'),
            });
        } catch (err: any) {
            setTestResult({
                id,
                success: false,
                message: err.message || 'Could not verify',
            });
        } finally {
            setIsTesting(null);
        }
    };

    return (
        <>
            <Head title="WhatsApp Channels & Phone Number Management" />

            <div className="flex flex-1 flex-col gap-3.5 p-3 sm:p-4 md:p-5 max-w-5xl mx-auto w-full font-sans">
                {/* Header Row: Compact unified bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/70 pb-3">
                    <div className="flex items-center gap-2.5">
                        <Button
                            variant="ghost"
                            size="icon"
                            asChild
                            className="size-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted shrink-0"
                        >
                            <Link href="/dashboard" title="Back to Dashboard">
                                <ArrowLeft className="size-4" />
                            </Link>
                        </Button>
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20 shadow-2xs">
                            <Smartphone className="size-4" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
                                    Connected WhatsApp Channels
                                </h1>
                                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary">
                                    <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                                    Meta Cloud v22.0
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Manage registered phone numbers, webhook events, and Cloud API tokens.
                            </p>
                        </div>
                    </div>

                    {channels.length > 0 && (
                        <Button
                            asChild
                            size="sm"
                            className="h-8 px-3 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold rounded-lg gap-1.5 shadow-2xs self-start sm:self-auto shrink-0"
                        >
                            <Link href="/whatsapp/connect/setup">
                                <Plus className="size-3.5" />
                                Connect New Number
                            </Link>
                        </Button>
                    )}
                </div>

                {/* Connected Channels List */}
                <div className="space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                            <span>Active Channels ({channels.length})</span>
                            {currentOrg && (
                                <Badge variant="outline" className="text-[10px] text-foreground font-normal border-border bg-muted/40 py-0">
                                    Workspace: <strong className="ml-1 text-primary font-bold">{currentOrg.name}</strong>
                                </Badge>
                            )}
                        </div>
                    </div>

                    {channels.length === 0 ? (
                        <Card className="border-border/80 bg-card p-6 text-center shadow-2xs rounded-xl">
                            <div className="flex size-11 mx-auto items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 mb-2.5">
                                <Smartphone className="size-5" />
                            </div>
                            <h3 className="text-sm font-bold text-foreground">
                                No WhatsApp Channels Connected
                            </h3>
                            <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1 mb-3.5">
                                Link your first WhatsApp Business number to {currentOrg?.name || 'this workspace'} to enable automated replies and bulk broadcasts.
                            </p>
                            <Button
                                asChild
                                size="sm"
                                className="h-8 px-3.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold rounded-lg gap-1.5 shadow-2xs"
                            >
                                <Link href="/whatsapp/connect/setup">
                                    <Plus className="size-3.5" />
                                    Connect WhatsApp Number
                                </Link>
                            </Button>
                        </Card>
                    ) : (
                        channels.map((ch) => (
                            <Card
                                key={ch.id}
                                onClick={() => router.visit(`/channels/${ch.id}`)}
                                className="border-border/80 bg-card overflow-hidden shadow-2xs hover:border-primary/50 hover:shadow-xs transition-all cursor-pointer group rounded-xl"
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 gap-3">
                                    <div className="flex items-start gap-3">
                                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20 font-bold group-hover:scale-105 transition-transform mt-0.5 sm:mt-0">
                                            <Smartphone className="size-4" />
                                        </div>
                                        <div className="space-y-0.5">
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-1">
                                                    {ch.name}
                                                    <ChevronRight className="size-3.5 text-muted-foreground/60 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                                                </h3>
                                                {ch.is_default && (
                                                    <Badge className="bg-primary text-primary-foreground text-[10px] font-semibold py-0 px-1.5">
                                                        DEFAULT
                                                    </Badge>
                                                )}
                                                <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 py-0 px-1.5 font-medium">
                                                    QUALITY: {ch.quality_rating}
                                                </Badge>
                                                <span className="text-[11px] text-muted-foreground">
                                                    Tier: {ch.messaging_limit}
                                                </span>
                                            </div>
                                            <p className="text-[11px] font-mono text-muted-foreground">
                                                Phone: <strong className="text-foreground">{ch.phone_number || 'Registered'}</strong> • Phone ID: <span className="font-semibold text-foreground">{ch.phone_number_id}</span> • WABA ID: <span className="font-semibold text-foreground">{ch.waba_id}</span>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-1.5 shrink-0 self-end sm:self-auto">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEditChannel(ch);
                                            }}
                                            className="h-7 text-xs px-2.5 rounded-lg border-border gap-1 text-foreground hover:bg-muted"
                                        >
                                            <Sliders className="size-3 text-primary" />
                                            Edit Credentials
                                        </Button>

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleTestPing(ch.id);
                                            }}
                                            disabled={isTesting === ch.id}
                                            className="h-7 text-xs px-2.5 rounded-lg border-border gap-1"
                                        >
                                            <RefreshCw className={`size-3 ${isTesting === ch.id ? 'animate-spin' : ''}`} />
                                            {isTesting === ch.id ? 'Testing...' : 'Test Connection'}
                                        </Button>

                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(ch.id, ch.name);
                                            }}
                                            className="h-7 px-2 text-xs text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/30 rounded-lg"
                                        >
                                            <Trash2 className="size-3.5" />
                                        </Button>
                                    </div>
                                </div>

                                {testResult && testResult.id === ch.id && (
                                    <div className={`px-4 py-1.5 text-xs border-t ${testResult.success ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-500/20' : 'bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300 border-red-500/20'}`}>
                                        {testResult.message}
                                    </div>
                                )}
                            </Card>
                        ))
                    )}
                </div>

                {/* Webhook Configuration for Meta Developers Portal */}
                <Card className="border-border/80 bg-card rounded-xl shadow-2xs overflow-hidden">
                    <CardHeader className="py-2.5 px-3.5 sm:px-4 border-b border-border/60 bg-muted/20">
                        <CardTitle className="text-xs sm:text-sm font-bold flex items-center gap-2 text-foreground">
                            <Radio className="size-3.5 text-primary" />
                            Meta WhatsApp Webhook Configuration
                        </CardTitle>
                        <CardDescription className="text-xs">
                            In Meta for Developers App &gt; WhatsApp &gt; Configuration, set this Webhook URL and Verify Token so incoming chats reach your workspace.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2.5 p-3.5 sm:p-4">
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
                                        className="h-8 shrink-0 text-xs px-2.5 rounded-lg border-border gap-1 hover:bg-muted"
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
                                        value={defaultVerifyToken}
                                        className="w-full rounded-lg border border-input bg-muted/40 px-2.5 py-1 text-xs text-foreground font-mono"
                                    />
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => copyToClipboard(defaultVerifyToken, 'verifyToken')}
                                        className="h-8 shrink-0 text-xs px-2.5 rounded-lg border-border gap-1 hover:bg-muted"
                                    >
                                        {copiedField === 'verifyToken' ? <Check className="size-3.5 text-primary" /> : <Copy className="size-3.5" />}
                                        Copy
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 rounded-lg bg-primary/5 border border-primary/20 p-2.5 text-xs text-muted-foreground">
                            <ShieldCheck className="size-4 text-primary shrink-0" />
                            <span>
                                Subscribe to <strong>messages</strong>, <strong>message_template_status_update</strong>, and <strong>phone_number_quality_update</strong> in Meta Webhook fields.
                            </span>
                        </div>
                    </CardContent>
                </Card>

                {/* Edit Credentials Modal Dialog */}
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
                                <Smartphone className="size-4 text-primary" />
                                {isEditing ? `Edit Credentials: ${form.name}` : 'Connect WhatsApp Business Number'}
                            </DialogTitle>
                            <DialogDescription className="text-xs">
                                {isEditing ? 'Update your Meta Permanent Access Token, Phone Number ID or WABA ID.' : 'Connect your official WhatsApp Business number via Meta Cloud API credentials.'}
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleFormSubmit} className="space-y-3 py-1">
                            <div className="grid gap-2.5 sm:grid-cols-2">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-foreground">
                                        Channel / Shop Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        placeholder="e.g. DukanHisab or Support"
                                        className="w-full rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-foreground">
                                        WhatsApp Phone Number *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={form.phone_number}
                                        onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
                                        placeholder="+91 79978 81665"
                                        className="w-full rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                                    />
                                </div>
                            </div>

                            <div className="grid gap-2.5 sm:grid-cols-2">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-foreground">
                                        Meta Phone Number ID *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={form.phone_number_id}
                                        onChange={(e) => setForm({ ...form, phone_number_id: e.target.value })}
                                        placeholder="1431069246745536"
                                        className="w-full rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-foreground">
                                        WhatsApp Business Account (WABA) ID *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={form.waba_id}
                                        onChange={(e) => setForm({ ...form, waba_id: e.target.value })}
                                        placeholder="799788166562792"
                                        className="w-full rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-foreground">
                                    Permanent Access Token (System User Token) *
                                </label>
                                <textarea
                                    required
                                    rows={2}
                                    value={form.access_token}
                                    onChange={(e) => setForm({ ...form, access_token: e.target.value })}
                                    placeholder="EAAO1pPN..."
                                    className="w-full rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                                />
                            </div>

                            <div className="grid gap-2.5 sm:grid-cols-2">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-foreground">
                                        App Secret (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={form.app_secret}
                                        onChange={(e) => setForm({ ...form, app_secret: e.target.value })}
                                        placeholder="02d9ac..."
                                        className="w-full rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-foreground">
                                        App ID (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={form.app_id}
                                        onChange={(e) => setForm({ ...form, app_id: e.target.value })}
                                        placeholder="Meta App ID"
                                        className="w-full rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2.5 border-t border-border">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsModalOpen(false)}
                                    className="h-7 text-xs rounded-lg"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    size="sm"
                                    className="h-7 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg shadow-2xs"
                                >
                                    Save &amp; Connect Number
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}
