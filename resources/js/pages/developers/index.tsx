import { useState } from 'react';
import { Head } from '@inertiajs/react';
import {
    Code2,
    Key,
    Radio,
    Copy,
    Check,
    Send,
    Terminal,
    ShieldCheck,
    Play,
    Plus,
    Trash2,
    Eye,
    EyeOff,
    AlertCircle,
    CheckCircle2,
    Smartphone,
    BookOpen,
    Wallet,
    Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Channel = {
    id: string;
    name: string;
    phone_number: string;
    phone_number_id: string;
    is_default: boolean;
};

type TemplateItem = {
    name: string;
    language: string;
    category: string;
    body: string;
};

type ApiKeyItem = {
    id: string;
    name: string;
    key_prefix: string;
    secret_key: string | null;
    is_active: boolean;
    last_used_at: string | null;
    created_at: string | null;
};

type Props = {
    channels?: Channel[];
    templates?: TemplateItem[];
    apiKeys?: ApiKeyItem[];
    wallet?: {
        total_balance_formatted: string;
        paid_balance_formatted: string;
        promotional_balance_formatted: string;
    };
    verifyToken?: string;
    appUrl?: string;
};

export default function Developers({
    channels = [],
    templates = [],
    apiKeys: initialKeys = [],
    wallet,
    verifyToken = 'Configured in Admin Settings',
    appUrl = '',
}: Props) {
    const baseUrl =
        (typeof window !== 'undefined' ? window.location.origin : appUrl).replace(/\/$/, '') || 'https://your-domain.com';

    const [keys, setKeys] = useState<ApiKeyItem[]>(initialKeys);
    const [newKeyName, setNewKeyName] = useState('');
    const [creatingKey, setCreatingKey] = useState(false);
    const [revealedKeyIds, setRevealedKeyIds] = useState<Record<string, boolean>>({});
    const [copiedField, setCopiedField] = useState<string | null>(null);

    // Live API Tester state
    const [selectedChannelId, setSelectedChannelId] = useState<string>(channels[0]?.id || '');
    const [testPhone, setTestPhone] = useState('919898696798');
    const [msgType, setMsgType] = useState<'template' | 'text'>(templates.length > 0 ? 'template' : 'text');
    const [selectedTemplate, setSelectedTemplate] = useState(templates[0]?.name || 'hello_world');
    const [templateLang, setTemplateLang] = useState(templates[0]?.language || 'en_US');
    const [testMsg, setTestMsg] = useState('Hello! This is a live API test message from our WhatsApp SaaS.');
    const [isSending, setIsSending] = useState(false);
    const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null);
    const [apiResponse, setApiResponse] = useState<string | null>(null);

    // Docs language tab
    const [docLang, setDocLang] = useState<'curl' | 'php' | 'node' | 'python'>('curl');

    const activeSecretKey = keys[0]?.secret_key || 'sk_live_YOUR_API_KEY';
    const webhookUrl = `${baseUrl}/webhooks/meta`;
    const csrfToken = () =>
        (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';

    const copyToClipboard = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const handleCreateKey = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newKeyName.trim()) return;
        setCreatingKey(true);
        try {
            const res = await fetch('/developers/keys', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken(),
                },
                body: JSON.stringify({ name: newKeyName.trim() }),
            });
            const data = await res.json();
            if (data.success && data.key) {
                setKeys((prev) => [data.key, ...prev]);
                setNewKeyName('');
                setRevealedKeyIds((prev) => ({ ...prev, [data.key.id]: true }));
            }
        } finally {
            setCreatingKey(false);
        }
    };

    const handleRevokeKey = async (id: string) => {
        if (!confirm('Revoke this API key? Any external software using it will immediately stop working.')) return;
        const res = await fetch(`/developers/keys/${id}`, {
            method: 'DELETE',
            headers: { 'X-CSRF-TOKEN': csrfToken() },
        });
        if (res.ok) {
            setKeys((prev) => prev.filter((k) => k.id !== id));
        }
    };

    const handleSendRealMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!testPhone.trim()) return;

        setIsSending(true);
        setSendResult(null);
        setApiResponse(null);

        try {
            const res = await fetch('/developers/send-test', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken(),
                },
                body: JSON.stringify({
                    phone: testPhone,
                    message: testMsg,
                    channel_id: selectedChannelId || undefined,
                    type: msgType,
                    template_name: selectedTemplate,
                    template_language: templateLang,
                }),
            });

            const data = await res.json();
            setSendResult({
                success: Boolean(data.success),
                message: data.message || (data.success ? 'Message dispatched!' : 'Sending failed'),
            });
            setApiResponse(JSON.stringify(data, null, 2));
        } catch (err: any) {
            setSendResult({
                success: false,
                message: err.message || 'Network error reaching server',
            });
            setApiResponse(JSON.stringify({ error: err.message }, null, 2));
        } finally {
            setIsSending(false);
        }
    };

    const samplePayloadJson =
        msgType === 'template'
            ? JSON.stringify(
                  {
                      to: testPhone,
                      type: 'template',
                      template: {
                          name: selectedTemplate,
                          language: { code: templateLang },
                      },
                  },
                  null,
                  2
              )
            : JSON.stringify(
                  {
                      to: testPhone,
                      type: 'text',
                      text: { body: testMsg },
                  },
                  null,
                  2
              );

    const codeSnippets: Record<'curl' | 'php' | 'node' | 'python', string> = {
        curl: `curl -X POST "${baseUrl}/api/v1/messages/send" \\
  -H "Authorization: Bearer ${activeSecretKey}" \\
  -H "Content-Type: application/json" \\
  -d '${samplePayloadJson}'`,
        php: `<?php
$ch = curl_init("${baseUrl}/api/v1/messages/send");
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => [
        "Authorization: Bearer ${activeSecretKey}",
        "Content-Type: application/json",
    ],
    CURLOPT_POSTFIELDS => json_encode(${
        msgType === 'template'
            ? `[
        "to" => "${testPhone}",
        "type" => "template",
        "template" => [
            "name" => "${selectedTemplate}",
            "language" => ["code" => "${templateLang}"]
        ]
    ]`
            : `[
        "to" => "${testPhone}",
        "type" => "text",
        "text" => ["body" => "${testMsg.replace(/"/g, '\\"')}"]
    ]`
    }),
]);
$response = json_decode(curl_exec($ch), true);
curl_close($ch);`,
        node: `const res = await fetch("${baseUrl}/api/v1/messages/send", {
  method: "POST",
  headers: {
    "Authorization": "Bearer ${activeSecretKey}",
    "Content-Type": "application/json",
  },
  body: JSON.stringify(${samplePayloadJson}),
});
const data = await res.json();
console.log(data);`,
        python: `import requests

response = requests.post(
    "${baseUrl}/api/v1/messages/send",
    headers={
        "Authorization": "Bearer ${activeSecretKey}",
        "Content-Type": "application/json",
    },
    json=${samplePayloadJson},
)
print(response.json())`,
    };

    const endpoints = [
        {
            method: 'POST',
            path: '/api/v1/messages/send',
            title: 'Send WhatsApp Message',
            description:
                'Send a template message (anytime), or a text/image/document message (inside 24h customer window). Automatically deducts wallet balance.',
            body: '{ "to": "919898696798", "type": "template", "template": { "name": "hello_world", "language": { "code": "en_US" } } }',
        },
        {
            method: 'GET',
            path: '/api/v1/messages/{id}',
            title: 'Check Message Delivery Status',
            description: 'Fetch real-time status (queued, sent, delivered, read, failed) using message_id or Meta wamid.',
        },
        {
            method: 'GET',
            path: '/api/v1/channels',
            title: 'List Connected WhatsApp Numbers',
            description: 'Returns all connected WhatsApp Business numbers and channel_ids for your workspace.',
        },
        {
            method: 'GET',
            path: '/api/v1/templates',
            title: 'List Approved Meta Templates',
            description: 'Returns approved templates, languages, categories (MARKETING/UTILITY), and required variables.',
        },
        {
            method: 'GET',
            path: '/api/v1/me',
            title: 'Workspace Info & Wallet Balance',
            description: 'Check remaining wallet credits and active per-message rates before dispatching.',
        },
    ];

    return (
        <>
            <Head title="API & Developer Docs - WhatsApp SaaS" />

            <div className="flex flex-1 flex-col gap-6 p-3.5 sm:p-4 md:p-6 max-w-6xl mx-auto w-full min-w-0 overflow-x-hidden">
                {/* Compact Action Toolbar */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/60 pb-3.5">
                    <div className="flex items-center gap-2.5 flex-wrap">
                        <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 text-xs font-semibold border-0">
                            API v1
                        </Badge>
                        <p className="text-xs md:text-sm text-muted-foreground max-w-2xl">
                            Connect your ERP, CRM, billing software, or website to send WhatsApp messages, OTPs, and order alerts directly using Bearer Token authentication.
                        </p>
                    </div>
                    {wallet && (
                        <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2 text-xs shrink-0">
                            <Wallet className="size-4 text-emerald-600" />
                            <div>
                                <div className="text-[10px] text-muted-foreground uppercase font-semibold">Wallet Balance</div>
                                <div className="text-sm font-bold text-foreground">{wallet.total_balance_formatted}</div>
                            </div>
                        </div>
                    )}
                </div>

                {/* API Keys & Webhook Row */}
                <div className="grid gap-4 lg:grid-cols-12">
                    {/* API Key Management */}
                    <Card className="lg:col-span-7 min-w-0 overflow-hidden border-border/80 shadow-xs">
                        <CardHeader className="pb-3 pt-4 px-4 sm:px-5">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Key className="size-4 text-emerald-600" />
                                API Keys (Bearer Authentication)
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Pass <code className="bg-muted px-1 py-0.5 rounded">Authorization: Bearer YOUR_API_KEY</code> or <code className="bg-muted px-1 py-0.5 rounded">X-API-Key</code> in every API request.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3 px-4 sm:px-5 pb-5">
                            <form onSubmit={handleCreateKey} className="flex flex-col sm:flex-row gap-2">
                                <Input
                                    value={newKeyName}
                                    onChange={(e) => setNewKeyName(e.target.value)}
                                    placeholder="New key name (e.g. Tally ERP / Website)"
                                    className="h-9 text-xs"
                                />
                                <Button
                                    type="submit"
                                    size="sm"
                                    disabled={creatingKey || !newKeyName.trim()}
                                    className="h-9 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 w-full sm:w-auto"
                                >
                                    {creatingKey ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
                                    Generate Key
                                </Button>
                            </form>

                            {keys.length === 0 ? (
                                <div className="rounded-xl border border-dashed border-border/80 bg-muted/10 p-6 text-center text-xs space-y-1.5">
                                    <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 mb-2">
                                        <Key className="size-5" />
                                    </div>
                                    <p className="font-semibold text-foreground">No API Keys Generated</p>
                                    <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                                        You haven't generated any API keys yet. Enter a name above and click "Generate Key" to create your secure secret key.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {keys.map((k) => {
                                        const revealed = !!revealedKeyIds[k.id];
                                        const displayKey = revealed && k.secret_key ? k.secret_key : k.key_prefix + '••••••••••••••••••••';
                                        return (
                                            <div
                                                key={k.id}
                                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs"
                                            >
                                                <div className="min-w-0 space-y-0.5">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-foreground">{k.name}</span>
                                                        {k.last_used_at && (
                                                            <span className="text-[10px] text-muted-foreground">Used {k.last_used_at}</span>
                                                        )}
                                                    </div>
                                                    <div className="font-mono text-[11px] text-muted-foreground truncate">
                                                        {displayKey}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1 shrink-0">
                                                    {k.secret_key && (
                                                        <>
                                                            <Button
                                                                type="button"
                                                                size="icon"
                                                                variant="ghost"
                                                                className="size-7"
                                                                onClick={() =>
                                                                    setRevealedKeyIds((prev) => ({ ...prev, [k.id]: !prev[k.id] }))
                                                                }
                                                                title={revealed ? 'Hide Key' : 'Reveal Key'}
                                                            >
                                                                {revealed ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                variant="outline"
                                                                className="h-7 text-[11px] gap-1"
                                                                onClick={() => copyToClipboard(k.secret_key!, k.id)}
                                                            >
                                                                {copiedField === k.id ? (
                                                                    <Check className="size-3 text-emerald-600" />
                                                                ) : (
                                                                    <Copy className="size-3" />
                                                                )}
                                                                {copiedField === k.id ? 'Copied' : 'Copy'}
                                                            </Button>
                                                        </>
                                                    )}
                                                    <Button
                                                        type="button"
                                                        size="icon"
                                                        variant="ghost"
                                                        className="size-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                        onClick={() => handleRevokeKey(k.id)}
                                                        title="Revoke / Delete Key"
                                                    >
                                                        <Trash2 className="size-3.5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Base URL & Webhook Info */}
                    <Card className="lg:col-span-5 min-w-0 overflow-hidden border-border/80 shadow-xs">
                        <CardHeader className="pb-3 pt-4 px-5">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Radio className="size-4 text-emerald-600" />
                                Base URL &amp; Webhook Setup
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Endpoints for your external integration &amp; Meta Cloud callbacks.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3 px-5 pb-5 text-xs">
                            <div className="space-y-1">
                                <Label className="text-[11px] text-muted-foreground">API Base URL</Label>
                                <div className="flex items-center justify-between font-mono bg-muted/60 px-3 py-1.5 rounded-md">
                                    <span className="truncate">{baseUrl}/api/v1</span>
                                    <button
                                        type="button"
                                        onClick={() => copyToClipboard(`${baseUrl}/api/v1`, 'base')}
                                        className="text-muted-foreground hover:text-foreground ml-2"
                                    >
                                        {copiedField === 'base' ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[11px] text-muted-foreground">Meta Webhook Callback URL</Label>
                                <div className="flex items-center justify-between font-mono bg-muted/60 px-3 py-1.5 rounded-md">
                                    <span className="truncate">{webhookUrl}</span>
                                    <button
                                        type="button"
                                        onClick={() => copyToClipboard(webhookUrl, 'wh')}
                                        className="text-muted-foreground hover:text-foreground ml-2"
                                    >
                                        {copiedField === 'wh' ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[11px] text-muted-foreground">Verify Token</Label>
                                <div className="flex items-center justify-between font-mono bg-muted/60 px-3 py-1.5 rounded-md">
                                    <span className="truncate">{verifyToken}</span>
                                    <button
                                        type="button"
                                        onClick={() => copyToClipboard(verifyToken, 'vt')}
                                        className="text-muted-foreground hover:text-foreground ml-2"
                                    >
                                        {copiedField === 'vt' ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
                                    </button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Live API Tester + Code Snippet */}
                <div className="grid gap-6 lg:grid-cols-12 items-start">
                    {/* Interactive Live API Tester */}
                    <Card className="lg:col-span-6 border-border/80 shadow-xs">
                        <CardHeader className="pb-3 pt-4 px-5 border-b border-border/60">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Play className="size-4 text-emerald-600" />
                                Live API Tester (Direct Send Test)
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Enter any WhatsApp number directly to test <code className="bg-muted px-1 rounded">POST /api/v1/messages/send</code> live.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-5 space-y-4">
                            <form onSubmit={handleSendRealMessage} className="space-y-3.5">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-xs font-semibold">Sender WhatsApp Number</Label>
                                        <select
                                            value={selectedChannelId}
                                            onChange={(e) => setSelectedChannelId(e.target.value)}
                                            className="w-full h-9 px-2.5 rounded-md border border-input bg-background text-xs"
                                        >
                                            {channels.length === 0 ? (
                                                <option value="">No connected channel</option>
                                            ) : (
                                                channels.map((ch) => (
                                                    <option key={ch.id} value={ch.id}>
                                                        {ch.name} ({ch.phone_number || ch.phone_number_id})
                                                    </option>
                                                ))
                                            )}
                                        </select>
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-xs font-semibold">Recipient Phone Number *</Label>
                                        <div className="relative">
                                            <Smartphone className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                                            <Input
                                                value={testPhone}
                                                onChange={(e) => setTestPhone(e.target.value)}
                                                placeholder="919898696798"
                                                className="pl-8 h-9 text-xs font-mono"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold">Message Type</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setMsgType('template')}
                                            className={`py-2 px-3 rounded-lg border text-xs font-semibold transition-colors ${
                                                msgType === 'template'
                                                    ? 'border-emerald-600 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                                                    : 'border-border text-muted-foreground hover:bg-muted/40'
                                            }`}
                                        >
                                            Approved Template (Anytime)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setMsgType('text')}
                                            className={`py-2 px-3 rounded-lg border text-xs font-semibold transition-colors ${
                                                msgType === 'text'
                                                    ? 'border-emerald-600 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                                                    : 'border-border text-muted-foreground hover:bg-muted/40'
                                            }`}
                                        >
                                            Free-Form Text (24h Window)
                                        </button>
                                    </div>
                                </div>

                                {msgType === 'template' ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                        <div className="sm:col-span-2 space-y-1">
                                            <Label className="text-xs font-semibold">Template Name</Label>
                                            {templates.length > 0 ? (
                                                <select
                                                    value={selectedTemplate}
                                                    onChange={(e) => {
                                                        const found = templates.find((t) => t.name === e.target.value);
                                                        setSelectedTemplate(e.target.value);
                                                        if (found) setTemplateLang(found.language);
                                                    }}
                                                    className="w-full h-9 px-2.5 rounded-md border border-input bg-background text-xs font-mono"
                                                >
                                                    {templates.map((t) => (
                                                        <option key={`${t.name}-${t.language}`} value={t.name}>
                                                            {t.name} ({t.category})
                                                        </option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <Input
                                                    value={selectedTemplate}
                                                    onChange={(e) => setSelectedTemplate(e.target.value)}
                                                    placeholder="hello_world"
                                                    className="h-9 text-xs font-mono"
                                                />
                                            )}
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs font-semibold">Language</Label>
                                            <Input
                                                value={templateLang}
                                                onChange={(e) => setTemplateLang(e.target.value)}
                                                placeholder="en_US"
                                                className="h-9 text-xs font-mono"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        <Label className="text-xs font-semibold">Text Message Body</Label>
                                        <textarea
                                            rows={3}
                                            value={testMsg}
                                            onChange={(e) => setTestMsg(e.target.value)}
                                            className="w-full rounded-md border border-input bg-background p-2.5 text-xs focus:outline-none"
                                        />
                                        <p className="text-[10px] text-muted-foreground">
                                            Note: Meta only delivers free-form text if the recipient messaged you in the last 24 hours. Use a Template to initiate a conversation anytime.
                                        </p>
                                    </div>
                                )}

                                {sendResult && (
                                    <div
                                        className={`p-2.5 rounded-lg border text-xs flex items-start gap-2 ${
                                            sendResult.success
                                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                                                : 'bg-destructive/10 border-destructive/30 text-destructive'
                                        }`}
                                    >
                                        {sendResult.success ? (
                                            <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
                                        ) : (
                                            <AlertCircle className="size-4 shrink-0 mt-0.5" />
                                        )}
                                        <span>{sendResult.message}</span>
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    disabled={isSending || channels.length === 0}
                                    className="w-full h-9 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold gap-1.5"
                                >
                                    {isSending ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
                                    {isSending ? 'Dispatching via API...' : 'Send Test Message via API'}
                                </Button>
                            </form>

                            {apiResponse && (
                                <div className="space-y-1 pt-2 border-t border-border/60">
                                    <Label className="text-[11px] font-semibold text-muted-foreground">Live JSON Response</Label>
                                    <pre className="p-3 rounded-lg bg-slate-950 text-emerald-400 text-[11px] font-mono overflow-x-auto max-h-56">
                                        {apiResponse}
                                    </pre>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Integration Code Snippets */}
                    <Card className="lg:col-span-6 border-border/80 shadow-xs">
                        <CardHeader className="pb-3 pt-4 px-5 border-b border-border/60">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                    <Terminal className="size-4 text-emerald-600" />
                                    Ready-to-Use Code Snippets
                                </CardTitle>
                                <div className="flex items-center gap-1 rounded-lg bg-muted p-0.5 text-[11px]">
                                    {(['curl', 'php', 'node', 'python'] as const).map((lang) => (
                                        <button
                                            key={lang}
                                            type="button"
                                            onClick={() => setDocLang(lang)}
                                            className={`px-2 py-0.5 rounded font-semibold uppercase transition-colors ${
                                                docLang === lang
                                                    ? 'bg-card text-foreground shadow-2xs'
                                                    : 'text-muted-foreground hover:text-foreground'
                                            }`}
                                        >
                                            {lang}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <CardDescription className="text-xs">
                                Copy and paste directly into your backend or billing software.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-5 space-y-3">
                            <div className="relative">
                                <pre className="p-3.5 pr-20 rounded-xl bg-slate-950 text-slate-100 text-[11px] font-mono overflow-x-auto leading-relaxed">
                                    {codeSnippets[docLang]}
                                </pre>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => copyToClipboard(codeSnippets[docLang], 'snippet')}
                                    className="absolute top-2.5 right-2.5 h-7 text-[11px] gap-1"
                                >
                                    {copiedField === 'snippet' ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
                                    {copiedField === 'snippet' ? 'Copied' : 'Copy'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* API Endpoints Reference */}
                <Card className="border-border/80 shadow-xs">
                    <CardHeader className="pb-3 pt-4 px-5 border-b border-border/60">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <BookOpen className="size-4 text-emerald-600" />
                            REST API Endpoints Reference
                        </CardTitle>
                        <CardDescription className="text-xs">
                            Every endpoint requires your Bearer API key and returns JSON. Wallet deductions happen automatically per message category.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-5 divide-y divide-border/60">
                        {endpoints.map((ep) => (
                            <div key={ep.path} className="py-3.5 first:pt-0 last:pb-0 space-y-1.5">
                                <div className="flex flex-wrap items-center gap-2">
                                    <Badge
                                        variant="outline"
                                        className={`font-mono text-[10px] font-bold ${
                                            ep.method === 'POST'
                                                ? 'bg-blue-500/10 text-blue-600 border-blue-500/30'
                                                : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                                        }`}
                                    >
                                        {ep.method}
                                    </Badge>
                                    <code className="text-xs font-mono font-semibold text-foreground">{ep.path}</code>
                                    <span className="text-xs font-semibold text-muted-foreground">— {ep.title}</span>
                                </div>
                                <p className="text-xs text-muted-foreground">{ep.description}</p>
                                {ep.body && (
                                    <pre className="p-2 rounded bg-muted/60 text-[11px] font-mono text-foreground overflow-x-auto">
                                        Body: {ep.body}
                                    </pre>
                                )}
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Security Footer */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
                    <ShieldCheck className="size-4 text-emerald-600 shrink-0" />
                    <span>
                        Rate limit: 120 API requests per minute per key. Keep your secret keys confidential and revoke compromised keys immediately.
                    </span>
                </div>
            </div>
        </>
    );
}
