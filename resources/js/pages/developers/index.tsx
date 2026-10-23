import { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import {
    Code2,
    Key,
    Radio,
    Copy,
    Check,
    Send,
    Terminal,
    ShieldCheck,
    ExternalLink,
    Play,
    RefreshCw,
    AlertCircle,
    CheckCircle2,
    Smartphone,
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

type Props = {
    channels?: Channel[];
};

export default function Developers({ channels = [] }: Props) {
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [selectedChannelId, setSelectedChannelId] = useState<string>(channels[0]?.id || '');
    const [testPhone, setTestPhone] = useState('919898096798');
    const [testMsg, setTestMsg] = useState('Hello! This is a live test message from Sathwara WhatsApp SaaS.');
    const [apiResponse, setApiResponse] = useState<string | null>(null);
    const [isSending, setIsSending] = useState(false);
    const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null);

    const [msgType, setMsgType] = useState<'template' | 'text'>('template');
    const [selectedTemplate, setSelectedTemplate] = useState('due_reminder_en');

    const webhookUrl = 'https://dukanhisab.in/api/v1/whatsapp/webhook';
    const verifyToken = '3tPseIuEUrfCcUlCaZkeZp5a3y3bC7FXLUoLTPiMxQcrJnk6VlP3N8Tln5jOr16b';
    const apiKey = 'sk_live_sat_9a8f27b401e9d8c3f281e04';

    const copyToClipboard = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
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
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: JSON.stringify({
                    phone: testPhone,
                    message: testMsg,
                    channel_id: selectedChannelId,
                    type: msgType,
                    template_name: selectedTemplate,
                }),
            });

            const data = await res.json();
            setSendResult({
                success: data.success,
                message: data.message || (data.success ? 'Message dispatched!' : 'Sending failed'),
            });
            setApiResponse(JSON.stringify(data.meta_response || data, null, 2));
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

    const curlSnippet = msgType === 'template' ? `curl -X POST "https://dukanhisab.in/api/v1/messages/send" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "${testPhone}",
    "type": "template",
    "template": {
      "name": "${selectedTemplate}",
      "language": { "code": "en_US" }
    }
  }'` : `curl -X POST "https://dukanhisab.in/api/v1/messages/send" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "${testPhone}",
    "type": "text",
    "text": { "body": "${testMsg}" }
  }'`;

    return (
        <>
            <Head title="Developer Hub & REST APIs - Sathwara InfoTech" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 max-w-6xl mx-auto w-full">
                {/* Header */}
                <div className="flex flex-col gap-1 border-b border-border/70 pb-5">
                    <div className="flex items-center gap-2.5">
                        <div className="flex size-9 items-center justify-center rounded-xl bg-[#47b672] text-white shadow-sm shadow-[#47b672]/30">
                            <Code2 className="size-5" />
                        </div>
                        <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
                            Developer Hub &amp; REST APIs
                        </h1>
                        <Badge className="bg-[#47b672]/15 text-[#28804c] dark:text-[#52c480] text-xs font-semibold border-0">
                            v1.3.0
                        </Badge>
                    </div>
                    <p className="text-xs md:text-sm text-muted-foreground mt-1 max-w-3xl">
                        Integrate Sathwara WhatsApp SaaS with your website, ERP, CRM, or billing software. Trigger WhatsApp messages,
                        OTPs, invoices, and receive real-time webhooks.
                    </p>
                </div>

                {/* API Key & Webhook Overview */}
                <div className="grid gap-4 md:grid-cols-2">
                    {/* REST API Key */}
                    <Card className="border-border/80 shadow-xs">
                        <CardHeader className="pb-3 pt-5 px-5">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Key className="size-4 text-[#47b672]" />
                                Your Secret API Key
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Use this bearer token to authenticate requests from your external backend server.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3 px-5 pb-5">
                            <div className="flex items-center justify-between rounded-md border border-input bg-muted/40 px-3 py-2 text-xs font-mono">
                                <span className="text-muted-foreground">sk_live_sat_••••••••••••••••••••</span>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => copyToClipboard(apiKey, 'apiKey')}
                                    className="h-7 text-xs gap-1 text-[#28804c] dark:text-[#52c480]"
                                >
                                    {copiedField === 'apiKey' ? <Check className="size-3" /> : <Copy className="size-3" />}
                                    Copy Key
                                </Button>
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                                Keep this key secret. Never expose it in client-side code (browsers or mobile apps).
                            </p>
                        </CardContent>
                    </Card>

                    {/* Webhook Configuration */}
                    <Card className="border-border/80 shadow-xs">
                        <CardHeader className="pb-3 pt-5 px-5">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Radio className="size-4 text-[#47b672]" />
                                Meta Webhook Endpoint
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Meta Cloud API sends inbound messages and delivery reports here.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2.5 px-5 pb-5">
                            <div className="flex items-center justify-between text-xs font-mono bg-muted/60 px-3 py-1.5 rounded-md">
                                <span className="text-muted-foreground truncate">{webhookUrl}</span>
                                <button
                                    onClick={() => copyToClipboard(webhookUrl, 'wh')}
                                    className="text-muted-foreground hover:text-foreground ml-2"
                                    title="Copy Webhook URL"
                                >
                                    {copiedField === 'wh' ? <Check className="size-3 text-[#47b672]" /> : <Copy className="size-3" />}
                                </button>
                            </div>
                            <div className="flex items-center justify-between text-xs font-mono bg-muted/60 px-3 py-1.5 rounded-md">
                                <span className="text-muted-foreground truncate">Token: {verifyToken.slice(0, 15)}...</span>
                                <button
                                    onClick={() => copyToClipboard(verifyToken, 'vt')}
                                    className="text-muted-foreground hover:text-foreground ml-2"
                                    title="Copy Verify Token"
                                >
                                    {copiedField === 'vt' ? <Check className="size-3 text-[#47b672]" /> : <Copy className="size-3" />}
                                </button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Send Message API Sandbox - Interactive Testing Form */}
                <Card className="border-border/80 shadow-xs">
                    <CardHeader className="pb-3 pt-5 px-5 border-b border-border/80">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                    <Terminal className="size-4 text-[#47b672]" />
                                    Send Live WhatsApp Test Message (Sandbox)
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Type your personal phone number below to send an actual test WhatsApp message right now.
                                </CardDescription>
                            </div>
                            <Badge variant="outline" className="text-xs text-[#28804c] dark:text-[#52c480] border-[#47b672]/30">
                                Live Meta Cloud API
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-5 space-y-5">
                        {/* Testing Form */}
                        <form onSubmit={handleSendRealMessage} className="space-y-4 rounded-xl border border-border bg-card p-4 shadow-2xs">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                {/* Sender Channel */}
                                <div className="md:col-span-4 space-y-1.5">
                                    <Label className="text-xs font-semibold flex items-center gap-1.5">
                                        <Smartphone className="size-3.5 text-[#47b672]" />
                                        Sending From Channel
                                    </Label>
                                    <select
                                        value={selectedChannelId}
                                        onChange={(e) => setSelectedChannelId(e.target.value)}
                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    >
                                        {channels.length === 0 ? (
                                            <option value="">Default Connected Number</option>
                                        ) : (
                                            channels.map((ch) => (
                                                <option key={ch.id} value={ch.id}>
                                                    {ch.name} ({ch.phone_number || ch.phone_number_id})
                                                </option>
                                            ))
                                        )}
                                    </select>
                                </div>

                                {/* Recipient Phone Number */}
                                <div className="md:col-span-8 space-y-1.5">
                                    <Label className="text-xs font-semibold flex items-center justify-between">
                                        <span>Recipient Mobile Number (with Country Code) *</span>
                                        <span className="text-[10px] text-muted-foreground font-normal">e.g. 919898096798 for India (+91)</span>
                                    </Label>
                                    <Input
                                        type="text"
                                        required
                                        value={testPhone}
                                        onChange={(e) => setTestPhone(e.target.value)}
                                        placeholder="e.g. 919898096798"
                                        className="text-xs font-mono"
                                    />
                                </div>
                            </div>

                            {/* Message Type Selector */}
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold">Message Type / Method</Label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setMsgType('template')}
                                        className={`flex flex-col text-left p-3 rounded-lg border transition-all text-xs ${
                                            msgType === 'template'
                                                ? 'border-[#47b672] bg-[#47b672]/10 ring-1 ring-[#47b672]'
                                                : 'border-border bg-background hover:bg-muted/50'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between font-semibold">
                                            <span>⚡ Approved Template (Recommended)</span>
                                            {msgType === 'template' && <Check className="size-3.5 text-[#47b672]" />}
                                        </div>
                                        <span className="text-[11px] text-muted-foreground mt-0.5">
                                            Delivers directly anytime! No 24-hr customer initiation required.
                                        </span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setMsgType('text')}
                                        className={`flex flex-col text-left p-3 rounded-lg border transition-all text-xs ${
                                            msgType === 'text'
                                                ? 'border-[#47b672] bg-[#47b672]/10 ring-1 ring-[#47b672]'
                                                : 'border-border bg-background hover:bg-muted/50'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between font-semibold">
                                            <span>💬 Custom Session Text Message</span>
                                            {msgType === 'text' && <Check className="size-3.5 text-[#47b672]" />}
                                        </div>
                                        <span className="text-[11px] text-muted-foreground mt-0.5">
                                            Requires user to have sent 'Hi' to WhatsApp number within 24 hours.
                                        </span>
                                    </button>
                                </div>
                            </div>

                            {/* Template or Text Input */}
                            {msgType === 'template' ? (
                                <div className="space-y-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                                    <Label className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                                        Select Meta Approved Template *
                                    </Label>
                                    <select
                                        value={selectedTemplate}
                                        onChange={(e) => setSelectedTemplate(e.target.value)}
                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    >
                                        <option value="due_reminder_en">due_reminder_en (Utility - Payment Due Reminder)</option>
                                        <option value="sale_invoice_en">sale_invoice_en (Utility - Sale Invoice Notification)</option>
                                        <option value="payment_received_en">payment_received_en (Utility - Payment Confirmation)</option>
                                        <option value="appointment_cancelled">appointment_cancelled (General Alert)</option>
                                    </select>
                                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                                        ✅ This approved template bypasses Meta's anti-spam 24h restrictions and lands right on the recipient's phone.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs font-semibold">Custom Text Message *</Label>
                                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                                            ⚠️ Recipient must have texted this WhatsApp number in last 24h
                                        </span>
                                    </div>
                                    <textarea
                                        required
                                        rows={3}
                                        value={testMsg}
                                        onChange={(e) => setTestMsg(e.target.value)}
                                        placeholder="Type test message text here..."
                                        className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    />
                                </div>
                            )}

                            {/* Alert Banner Result */}
                            {sendResult && (
                                <div
                                    className={`flex items-start gap-2 rounded-lg p-3 text-xs ${
                                        sendResult.success
                                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                                            : 'bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/20'
                                    }`}
                                >
                                    {sendResult.success ? (
                                        <CheckCircle2 className="size-4 shrink-0 mt-0.5 text-emerald-600" />
                                    ) : (
                                        <AlertCircle className="size-4 shrink-0 mt-0.5 text-red-600" />
                                    )}
                                    <div>
                                        <p className="font-semibold">{sendResult.message}</p>
                                        {sendResult.success && (
                                            <p className="text-[11px] mt-0.5 opacity-90">
                                                Please check your WhatsApp on phone <strong>+{testPhone}</strong>!
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Send Button */}
                            <div className="flex items-center justify-between pt-1">
                                <span className="text-[11px] text-muted-foreground">
                                    Dispatches directly using Meta WhatsApp Cloud API v22.0
                                </span>
                                <Button
                                    type="submit"
                                    disabled={isSending}
                                    className="h-9 px-4 text-xs bg-[#47b672] text-white hover:bg-[#349c5e] font-semibold gap-1.5 shadow-sm shadow-[#47b672]/30"
                                >
                                    {isSending ? (
                                        <RefreshCw className="size-3.5 animate-spin" />
                                    ) : (
                                        <Send className="size-3.5" />
                                    )}
                                    {isSending ? 'Sending to WhatsApp...' : '🚀 Send Test WhatsApp Message'}
                                </Button>
                            </div>
                        </form>

                        {/* Developer cURL & Live JSON Response */}
                        <div className="grid gap-5 lg:grid-cols-2 pt-2">
                            {/* cURL Snippet */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                                    <span>Live cURL Request (Auto-generated):</span>
                                    <button
                                        onClick={() => copyToClipboard(curlSnippet, 'curl')}
                                        className="text-[#28804c] dark:text-[#52c480] text-[11px] hover:underline flex items-center gap-1 font-mono"
                                    >
                                        {copiedField === 'curl' ? <Check className="size-3" /> : <Copy className="size-3" />}
                                        Copy cURL
                                    </button>
                                </div>
                                <pre className="rounded-lg bg-black text-emerald-400 p-3.5 text-xs font-mono overflow-x-auto leading-relaxed border border-border">
                                    {curlSnippet}
                                </pre>
                            </div>

                            {/* Live JSON Response */}
                            <div className="space-y-2">
                                <span className="text-xs font-semibold text-foreground block">
                                    Meta API Response:
                                </span>
                                <pre className="rounded-lg bg-muted/60 text-foreground p-3.5 text-xs font-mono overflow-x-auto leading-relaxed border border-border min-h-[140px]">
                                    {apiResponse || '// Click "Send Test WhatsApp Message" above to see the real-time Meta API JSON response here.'}
                                </pre>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
