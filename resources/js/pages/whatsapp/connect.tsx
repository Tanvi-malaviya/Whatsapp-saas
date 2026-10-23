import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
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
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [connectMode, setConnectMode] = useState<'embedded' | 'manual'>('manual');
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
        setConnectMode('manual');
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

    const handleOpenNewModal = () => {
        setIsEditing(false);
        setForm(emptyForm);
        setConnectMode('manual');
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

    // Pre-fill user's provided DukanHisab credentials for convenience
    const prefillUserCredentials = () => {
        setForm({
            name: 'DukanHisab WhatsApp',
            phone_number: '+91 79978 81665',
            phone_number_id: '1431069246745536',
            waba_id: '799788166562792',
            access_token: 'EAAO1pPNX38sBShzw6ZCgRZB2p1lx19wMIFJF5w3bgeq5DR08kaZAj7n8JI7iea42GZBKqPYF94qHymugv0cjZAsi73RH7ZB2Bcr0J5cd3sA8FXKvINgPxwdcnLvNdBGuNKIGaYS5gy0ZCL2xrtItdylRd5b6SywFsQP2TRP3saOeE5aPZAMpMVdCUmZAfU4fduwZDZD',
            app_id: '',
            app_secret: '02d9ac2a37b98b8b29a189f835c13027',
        });
    };

    const openNewChannelModal = () => {
        setForm(emptyForm);
        setConnectMode('manual');
        setIsModalOpen(true);
    };

    const openEditModal = () => {
        prefillUserCredentials();
        setConnectMode('manual');
        setIsModalOpen(true);
    };

    const clearForm = () => {
        setForm(emptyForm);
    };

    return (
        <>
            <Head title="WhatsApp Channels & Phone Number Management" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 max-w-6xl mx-auto w-full">
                {/* Back Link */}
                <div className="flex items-center justify-between">
                    <Button variant="ghost" size="sm" asChild className="gap-1.5 text-muted-foreground hover:text-foreground">
                        <Link href="/dashboard">
                            <ArrowLeft className="size-4" />
                            Back to Dashboard
                        </Link>
                    </Button>

                    <Button
                        onClick={openNewChannelModal}
                        className="bg-[#47b672] text-white hover:bg-[#349c5e] text-xs font-semibold gap-1.5 shadow-sm shadow-[#47b672]/30"
                    >
                        <Plus className="size-4" />
                        Connect New WhatsApp Number
                    </Button>
                </div>

                {/* Header */}
                <div className="flex flex-col gap-1 border-b border-border/70 pb-5">
                    <div className="flex items-center gap-2.5">
                        <div className="flex size-9 items-center justify-center rounded-xl bg-[#47b672] text-white shadow-sm shadow-[#47b672]/30">
                            <Smartphone className="size-5" />
                        </div>
                        <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
                            Connected WhatsApp Channels
                        </h1>
                        <Badge className="bg-[#47b672]/15 text-[#28804c] dark:text-[#52c480] text-xs font-semibold border-0">
                            Meta Cloud API v22.0
                        </Badge>
                    </div>
                    <p className="text-xs md:text-sm text-muted-foreground mt-1 max-w-3xl">
                        Like Xobito, you can connect <strong>any WhatsApp Business number</strong> to your portal. 
                        Messages from all connected numbers will flow directly into your Shared Inbox, Bot flows, and Broadcast campaigns.
                    </p>
                </div>

                {/* Connected Channels List */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                            Active Phone Numbers ({channels.length > 0 ? channels.length : 1})
                        </h2>
                    </div>

                    {channels.length === 0 ? (
                        /* Default display if no channel in db yet, showing DukanHisab channel card */
                        <Card className="border-border/80 bg-card overflow-hidden shadow-xs hover:border-[#47b672]/40 transition-colors">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between p-5 gap-4">
                                <div className="flex items-start gap-3.5">
                                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#47b672]/15 text-[#28804c] dark:text-[#52c480] font-bold">
                                        <Smartphone className="size-5" />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h3 className="text-base font-bold text-foreground">
                                                DukanHisab
                                            </h3>
                                            <Badge className="bg-[#47b672] text-white text-[10px] font-semibold">
                                                DEFAULT CHANNEL
                                            </Badge>
                                            <Badge variant="outline" className="text-[10px] border-[#47b672]/40 text-[#28804c] dark:text-[#52c480]">
                                                QUALITY: HIGH
                                            </Badge>
                                        </div>
                                        <p className="text-xs font-mono text-muted-foreground">
                                            Phone: <strong className="text-foreground">+91 79978 81665</strong> • Phone ID: <span className="font-semibold text-foreground">1431069246745536</span> • WABA ID: <span className="font-semibold text-foreground">799788166562792</span>
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Connected for live customer inbound chats, automatic bot replies, and broadcast marketing.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={openEditModal}
                                        className="h-8 text-xs border-border gap-1"
                                    >
                                        <Sliders className="size-3.5 text-muted-foreground" />
                                        Update Credentials
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="h-8 text-xs bg-[#47b672] text-white hover:bg-[#349c5e]"
                                        asChild
                                    >
                                        <Link href="/inbox">
                                            Open Inbox
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ) : (
                        channels.map((ch) => (
                            <Card key={ch.id} className="border-border/80 bg-card overflow-hidden shadow-xs hover:border-[#47b672]/40 transition-colors">
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between p-5 gap-4">
                                    <div className="flex items-start gap-3.5">
                                        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#47b672]/15 text-[#28804c] dark:text-[#52c480] font-bold">
                                            <Smartphone className="size-5" />
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h3 className="text-base font-bold text-foreground">
                                                    {ch.name}
                                                </h3>
                                                {ch.is_default && (
                                                    <Badge className="bg-[#47b672] text-white text-[10px] font-semibold">
                                                        DEFAULT CHANNEL
                                                    </Badge>
                                                )}
                                                <Badge variant="outline" className="text-[10px] border-[#47b672]/40 text-[#28804c] dark:text-[#52c480]">
                                                    QUALITY: {ch.quality_rating}
                                                </Badge>
                                                <span className="text-xs text-muted-foreground">
                                                    Tier: {ch.messaging_limit}
                                                </span>
                                            </div>
                                            <p className="text-xs font-mono text-muted-foreground">
                                                Phone: <strong className="text-foreground">{ch.phone_number || 'Registered'}</strong> • Phone ID: <span className="font-semibold text-foreground">{ch.phone_number_id}</span> • WABA ID: <span className="font-semibold text-foreground">{ch.waba_id}</span>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleEditChannel(ch)}
                                            className="h-8 text-xs border-border gap-1 text-foreground hover:bg-muted"
                                        >
                                            <Sliders className="size-3 text-[#47b672]" />
                                            Edit Credentials
                                        </Button>

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleTestPing(ch.id)}
                                            disabled={isTesting === ch.id}
                                            className="h-8 text-xs border-border gap-1"
                                        >
                                            <RefreshCw className={`size-3 ${isTesting === ch.id ? 'animate-spin' : ''}`} />
                                            {isTesting === ch.id ? 'Testing...' : 'Test Connection'}
                                        </Button>

                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDelete(ch.id, ch.name)}
                                            className="h-8 text-xs text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/30"
                                        >
                                            <Trash2 className="size-3.5" />
                                        </Button>
                                    </div>
                                </div>

                                {testResult && testResult.id === ch.id && (
                                    <div className={`px-5 py-2 text-xs border-t ${testResult.success ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-500/20' : 'bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300 border-red-500/20'}`}>
                                        {testResult.message}
                                    </div>
                                )}
                            </Card>
                        ))
                    )}
                </div>

                {/* Webhook Configuration for Meta Developers Portal */}
                <Card className="border-border/80">
                    <CardHeader className="pb-3 pt-5 px-5">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <Radio className="size-4 text-[#47b672]" />
                            Meta WhatsApp Webhook Configuration
                        </CardTitle>
                        <CardDescription className="text-xs">
                            In your Meta for Developers App &gt; WhatsApp &gt; Configuration, set this Webhook URL and Verify Token so incoming chats from any number reach this portal.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 px-5 pb-5">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-foreground">
                                    Callback / Webhook URL
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        readOnly
                                        value={defaultWebhookUrl}
                                        className="w-full rounded-md border border-input bg-muted/50 px-3 py-1.5 text-xs text-foreground font-mono"
                                    />
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => copyToClipboard(defaultWebhookUrl, 'webhookUrl')}
                                        className="h-8 shrink-0 text-xs gap-1"
                                    >
                                        {copiedField === 'webhookUrl' ? <Check className="size-3.5 text-[#47b672]" /> : <Copy className="size-3.5" />}
                                        Copy
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-foreground">
                                    Webhook Verify Token
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        readOnly
                                        value={defaultVerifyToken}
                                        className="w-full rounded-md border border-input bg-muted/50 px-3 py-1.5 text-xs text-foreground font-mono"
                                    />
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => copyToClipboard(defaultVerifyToken, 'verifyToken')}
                                        className="h-8 shrink-0 text-xs gap-1"
                                    >
                                        {copiedField === 'verifyToken' ? <Check className="size-3.5 text-[#47b672]" /> : <Copy className="size-3.5" />}
                                        Copy
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground mt-2">
                            <ShieldCheck className="size-4 text-[#47b672] shrink-0" />
                            <span>
                                Subscribe to <strong>messages</strong>, <strong>message_template_status_update</strong>, and <strong>phone_number_quality_update</strong> in Meta Webhook fields.
                            </span>
                        </div>
                    </CardContent>
                </Card>

                {/* Connect Modal Dialog */}
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent className="sm:max-w-xl">
                        <DialogHeader>
                            <DialogTitle className="text-base font-bold flex items-center gap-2">
                                <Smartphone className="size-4 text-[#47b672]" />
                                {isEditing ? `Edit Credentials: ${form.name}` : 'Connect Any WhatsApp Business Number'}
                            </DialogTitle>
                            <DialogDescription className="text-xs">
                                {isEditing ? 'Update your Meta Permanent Access Token, Phone Number ID or WABA ID.' : 'Connect your own shop number, business SIM, or virtual WhatsApp number via Meta Cloud API.'}
                            </DialogDescription>
                        </DialogHeader>

                        {/* Mode Switcher Tabs */}
                        <div className="flex rounded-lg bg-muted p-1 gap-1">
                            <button
                                type="button"
                                onClick={() => setConnectMode('manual')}
                                className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${connectMode === 'manual' ? 'bg-background text-foreground shadow-xs font-semibold' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                Direct Meta API Credentials
                            </button>
                            <button
                                type="button"
                                onClick={() => setConnectMode('embedded')}
                                className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${connectMode === 'embedded' ? 'bg-background text-foreground shadow-xs font-semibold' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                1-Click Meta Embedded Signup
                            </button>
                        </div>

                        {connectMode === 'embedded' ? (
                            <div className="space-y-4 py-4 text-center">
                                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-[#47b672]/15 text-[#28804c] dark:text-[#52c480]">
                                    <Sparkles className="size-6" />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-sm font-bold text-foreground">
                                        Meta Facebook Login for WhatsApp
                                    </h4>
                                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                                        Clicking the button opens official Meta dialog. Enter your phone number, receive OTP on your phone, and connect instantly.
                                    </p>
                                </div>
                                <Button
                                    onClick={() => {
                                        alert('Meta Embedded Signup: To use this in production, Meta requires your verified Meta App ID and Facebook Config ID. Meanwhile, you can enter any number directly in the Direct API Credentials tab!');
                                    }}
                                    className="bg-[#47b672] text-white hover:bg-[#349c5e] text-xs font-semibold gap-1.5"
                                >
                                    <ExternalLink className="size-4" />
                                    Launch Meta Embedded Signup Popup
                                </Button>
                            </div>
                        ) : (
                            <form onSubmit={handleFormSubmit} className="space-y-3.5 py-2">
                                <div className="flex items-center justify-between pb-1">
                                    <span className="text-[11px] text-muted-foreground">
                                        Fill your Meta WhatsApp Phone details:
                                    </span>
                                    <div className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={clearForm}
                                            className="text-[11px] text-red-500 hover:underline font-semibold"
                                        >
                                            Clear Form (Blank)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={prefillUserCredentials}
                                            className="text-[11px] text-[#28804c] dark:text-[#52c480] hover:underline font-semibold"
                                        >
                                            Auto-fill DukanHisab
                                        </button>
                                    </div>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-foreground">
                                            Channel / Shop Name *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={form.name}
                                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                                            placeholder="e.g. DukanHisab or Sathwara Support"
                                            className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-[#47b672]/40"
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
                                            className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-[#47b672]/40"
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2">
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
                                            className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-[#47b672]/40"
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
                                            className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-[#47b672]/40"
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
                                        className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-[#47b672]/40"
                                    />
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-foreground">
                                            App Secret (Optional)
                                        </label>
                                        <input
                                            type="text"
                                            value={form.app_secret}
                                            onChange={(e) => setForm({ ...form, app_secret: e.target.value })}
                                            placeholder="02d9ac..."
                                            className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-[#47b672]/40"
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
                                            className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-[#47b672]/40"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setIsModalOpen(false)}
                                        className="h-8 text-xs"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        size="sm"
                                        className="h-8 text-xs bg-[#47b672] text-white hover:bg-[#349c5e] font-semibold"
                                    >
                                        Save &amp; Connect Number
                                    </Button>
                                </div>
                            </form>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}
