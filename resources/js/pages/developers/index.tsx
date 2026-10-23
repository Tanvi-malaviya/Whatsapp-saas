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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Developers() {
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [testPhone, setTestPhone] = useState('917997881665');
    const [testMsg, setTestMsg] = useState('Hello from Sathwara WhatsApp SaaS API!');
    const [apiResponse, setApiResponse] = useState<string | null>(null);
    const [isSimulating, setIsSimulating] = useState(false);

    const webhookUrl = 'https://dukanhisab.in/api/v1/whatsapp/webhook';
    const verifyToken = '3tPseIuEUrfCcUlCaZkeZp5a3y3bC7FXLUoLTPiMxQcrJnk6VlP3N8Tln5jOr16b';
    const apiKey = 'sk_live_sat_9a8f27b401e9d8c3f281e04';

    const copyToClipboard = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const handleSimulateApi = () => {
        setIsSimulating(true);
        setTimeout(() => {
            setIsSimulating(false);
            setApiResponse(
                JSON.stringify(
                    {
                        messaging_product: 'whatsapp',
                        contacts: [{ input: testPhone, wa_id: testPhone }],
                        messages: [{ id: 'wamid.HBgMOTE3OTk3ODgxNjY1FQIAERgSQTcyODMwNTM3OUFDMkE2NDIA' }],
                        status: 'sent',
                        charge: 'FREE_SERVICE_CONVERSATION',
                        timestamp: new Date().toISOString(),
                    },
                    null,
                    2
                )
            );
        }, 600);
    };

    const curlSnippet = `curl -X POST "https://dukanhisab.in/api/v1/messages/send" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "${testPhone}",
    "type": "text",
    "text": { "body": "${testMsg}" }
  }'`;

    return (
        <>
            <Head title="Developers & Webhook API - Sathwara InfoTech" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 max-w-6xl mx-auto w-full">
                {/* Header */}
                <div className="flex flex-col gap-1 border-b border-border/80 pb-5">
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
                        Integrate Sathwara WhatsApp SaaS with your website, ERP, CRM, or billing software. 
                        Trigger WhatsApp messages, OTPs, invoices, and receive real-time webhooks.
                    </p>
                </div>

                {/* API Keys & Webhook Config */}
                <div className="grid gap-4 md:grid-cols-2">
                    {/* API Secret Key */}
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
                            <div className="flex gap-2">
                                <input
                                    readOnly
                                    value={apiKey}
                                    type="password"
                                    className="w-full rounded-md border border-input bg-muted/50 px-3 py-1.5 text-xs text-foreground font-mono"
                                />
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => copyToClipboard(apiKey, 'apiKey')}
                                    className="h-8 shrink-0 text-xs gap-1"
                                >
                                    {copiedField === 'apiKey' ? <Check className="size-3.5 text-[#47b672]" /> : <Copy className="size-3.5" />}
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
                                >
                                    {copiedField === 'wh' ? <Check className="size-3 text-[#47b672]" /> : <Copy className="size-3" />}
                                </button>
                            </div>
                            <div className="flex items-center justify-between text-xs font-mono bg-muted/60 px-3 py-1.5 rounded-md">
                                <span className="text-muted-foreground truncate">Token: {verifyToken.slice(0, 15)}...</span>
                                <button
                                    onClick={() => copyToClipboard(verifyToken, 'vt')}
                                    className="text-muted-foreground hover:text-foreground ml-2"
                                >
                                    {copiedField === 'vt' ? <Check className="size-3 text-[#47b672]" /> : <Copy className="size-3" />}
                                </button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* API Sandbox & Code Snippet */}
                <Card className="border-border/80 shadow-xs">
                    <CardHeader className="pb-3 pt-5 px-5 border-b border-border/80">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                    <Terminal className="size-4 text-[#47b672]" />
                                    Send Message API Sandbox
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Test sending an automated WhatsApp message through the REST API.
                                </CardDescription>
                            </div>
                            <Button
                                size="sm"
                                onClick={handleSimulateApi}
                                disabled={isSimulating}
                                className="h-8 text-xs bg-[#47b672] text-white hover:bg-[#349c5e] font-semibold gap-1.5"
                            >
                                <Play className="size-3.5" />
                                {isSimulating ? 'Sending...' : 'Test Send Request'}
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-5 grid gap-5 lg:grid-cols-2">
                        {/* cURL Snippet */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                                <span>cURL Request:</span>
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
                                API Response (200 OK):
                            </span>
                            <pre className="rounded-lg bg-muted/60 text-foreground p-3.5 text-xs font-mono overflow-x-auto leading-relaxed border border-border min-h-[140px]">
                                {apiResponse || '// Click "Test Send Request" to simulate real-time API response.'}
                            </pre>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
