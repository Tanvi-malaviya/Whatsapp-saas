import { useState } from 'react';
import { Head } from '@inertiajs/react';
import {
    Settings,
    Key,
    Globe,
    Check,
    Copy,
    ExternalLink,
    ShieldCheck,
    Server,
    Cpu,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Props = {
    settings: {
        app_id: string;
        config_id: string;
        webhook_url: string;
        verify_token: string;
        graph_version: string;
        php_version: string;
        laravel_version: string;
        environment: string;
    };
};

export default function AdminSettings({ settings }: Props) {
    const [copiedField, setCopiedField] = useState<string | null>(null);

    const copyToClipboard = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    return (
        <>
            <Head title="Global Settings - Super Admin" />

            <div className="space-y-6 max-w-4xl">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/70 pb-5">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            <Settings className="size-6 text-primary" />
                            <span>Global Platform Settings</span>
                        </h1>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                            System-wide Meta WhatsApp Cloud API credentials, webhook verification, and environment specs.
                        </p>
                    </div>
                </div>

                {/* Meta Developer App Configuration */}
                <Card className="border-border/70 shadow-2xs">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base font-bold flex items-center gap-2">
                                <Key className="size-4 text-emerald-600" />
                                <span>Official Meta Cloud API App</span>
                            </CardTitle>
                            <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-mono">
                                {settings.graph_version}
                            </Badge>
                        </div>
                        <CardDescription>
                            Meta for Developers App credentials used by the 1-Click Embedded Signup wizard for all clients.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-1">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">Meta App ID (Client ID)</Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        readOnly
                                        value={settings.app_id}
                                        className="font-mono text-xs bg-muted/50"
                                    />
                                    <Button
                                        size="icon"
                                        variant="outline"
                                        className="size-9 shrink-0"
                                        onClick={() => copyToClipboard(settings.app_id, 'appid')}
                                    >
                                        {copiedField === 'appid' ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">Embedded Signup Config ID</Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        readOnly
                                        value={settings.config_id}
                                        className="font-mono text-xs bg-muted/50"
                                    />
                                    <Button
                                        size="icon"
                                        variant="outline"
                                        className="size-9 shrink-0"
                                        onClick={() => copyToClipboard(settings.config_id, 'configid')}
                                    >
                                        {copiedField === 'configid' ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Webhook Settings */}
                        <div className="space-y-1.5 pt-2">
                            <Label className="text-xs font-semibold">Global Webhook Callback URL</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    readOnly
                                    value={settings.webhook_url}
                                    className="font-mono text-xs bg-muted/50"
                                />
                                <Button
                                    size="icon"
                                    variant="outline"
                                    className="size-9 shrink-0"
                                    onClick={() => copyToClipboard(settings.webhook_url, 'whurl')}
                                >
                                    {copiedField === 'whurl' ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
                                </Button>
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                                Configure this endpoint in Meta Developer Dashboard &gt; WhatsApp &gt; Configuration &gt; Webhook Callback URL.
                            </p>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold">Webhook Verify Token</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    readOnly
                                    value={settings.verify_token}
                                    className="font-mono text-xs bg-muted/50"
                                />
                                <Button
                                    size="icon"
                                    variant="outline"
                                    className="size-9 shrink-0"
                                    onClick={() => copyToClipboard(settings.verify_token, 'token')}
                                >
                                    {copiedField === 'token' ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
                                </Button>
                            </div>
                        </div>

                        <div className="pt-2 flex items-center justify-end">
                            <Button size="sm" variant="outline" asChild className="h-8 text-xs gap-1.5">
                                <a
                                    href="https://developers.facebook.com/apps/1079349601748656/whatsapp-business/wa-dev-console/"
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    <span>Open Meta Developer Console</span>
                                    <ExternalLink className="size-3" />
                                </a>
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Server & Environment Info */}
                <Card className="border-border/70 shadow-2xs">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-bold flex items-center gap-2">
                            <Server className="size-4 text-blue-600" />
                            <span>System &amp; Server Environment</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-1">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="p-3 rounded-lg border border-border/60 bg-muted/30">
                                <span className="text-[10px] uppercase font-bold text-muted-foreground">PHP Version</span>
                                <div className="text-sm font-bold font-mono text-foreground mt-0.5">{settings.php_version}</div>
                            </div>
                            <div className="p-3 rounded-lg border border-border/60 bg-muted/30">
                                <span className="text-[10px] uppercase font-bold text-muted-foreground">Laravel Framework</span>
                                <div className="text-sm font-bold font-mono text-foreground mt-0.5">v{settings.laravel_version}</div>
                            </div>
                            <div className="p-3 rounded-lg border border-border/60 bg-muted/30">
                                <span className="text-[10px] uppercase font-bold text-muted-foreground">Environment</span>
                                <div className="text-sm font-bold capitalize text-emerald-600 mt-0.5">{settings.environment}</div>
                            </div>
                            <div className="p-3 rounded-lg border border-border/60 bg-muted/30">
                                <span className="text-[10px] uppercase font-bold text-muted-foreground">Multi-Tenancy</span>
                                <div className="text-sm font-bold text-primary mt-0.5">Org Context</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
