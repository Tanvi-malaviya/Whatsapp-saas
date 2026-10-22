import { Head, Link } from '@inertiajs/react';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';

export default function WhatsAppConnect() {
    const [isConnecting, setIsConnecting] = useState(false);
    const [connected, setConnected] = useState(false);

    const handleConnectClick = () => {
        setIsConnecting(true);
        // Simulate Meta Embedded Signup popup flow
        setTimeout(() => {
            setIsConnecting(false);
            setConnected(true);
        }, 1500);
    };

    return (
        <>
            <Head title="Connect WhatsApp Business" />

            <div className="flex flex-1 flex-col gap-6 p-6 max-w-5xl mx-auto">
                {/* Back button */}
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" asChild className="gap-1 text-muted-foreground">
                        <Link href="/dashboard">
                            <ArrowLeft className="size-4" />
                            Back to Dashboard
                        </Link>
                    </Button>
                </div>

                {/* Header */}
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
                        <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-600 text-white">
                            <Smartphone className="size-5" />
                        </div>
                        Connect WhatsApp Business Account (WABA)
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Onboard your WhatsApp number using <strong>Meta Embedded Signup v4</strong>. You keep full ownership of your phone number and pay Meta directly for message usage.
                    </p>
                </div>

                {/* Status Box */}
                {connected ? (
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5 flex items-start gap-3">
                        <CheckCircle2 className="size-5 text-emerald-600 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                            <h3 className="text-sm font-semibold text-foreground">
                                WhatsApp Successfully Connected!
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                Connected Phone Number: <strong>+91 98765 43210</strong> (Sathwara InfoTech). Webhook status: Active. You can now build bot rules and receive live chats.
                            </p>
                            <div className="pt-2">
                                <Button size="sm" className="bg-emerald-600 text-white" asChild>
                                    <Link href="/bot">Configure Bot Rules</Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <Card className="border-emerald-500/30 bg-gradient-to-br from-emerald-950/20 via-card to-card">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <Badge variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-500/30 dark:bg-emerald-950/50 dark:text-emerald-300">
                                    Official Meta Tech Provider Path
                                </Badge>
                                <span className="text-xs text-muted-foreground">Embedded Signup v4</span>
                            </div>
                            <CardTitle className="text-lg font-bold mt-2">
                                1-Click Meta Embedded Signup
                            </CardTitle>
                            <CardDescription className="text-sm">
                                Clicking the button below opens the official Meta Facebook popup to log in to your Meta Business Manager and select your phone number.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-3 sm:grid-cols-3">
                                <div className="rounded-lg border border-sidebar-border/70 p-3.5 bg-background/50">
                                    <ShieldCheck className="size-5 text-emerald-600 mb-1.5" />
                                    <h4 className="text-xs font-semibold">Direct Meta Billing</h4>
                                    <p className="text-[11px] text-muted-foreground mt-0.5">
                                        You pay Meta directly in INR with zero markup on WhatsApp conversation charges.
                                    </p>
                                </div>
                                <div className="rounded-lg border border-sidebar-border/70 p-3.5 bg-background/50">
                                    <Building2 className="size-5 text-blue-600 mb-1.5" />
                                    <h4 className="text-xs font-semibold">Green Tick Ready</h4>
                                    <p className="text-[11px] text-muted-foreground mt-0.5">
                                        Your number stays inside your own Meta Business Account, eligible for the verified green badge.
                                    </p>
                                </div>
                                <div className="rounded-lg border border-sidebar-border/70 p-3.5 bg-background/50">
                                    <Zap className="size-5 text-purple-600 mb-1.5" />
                                    <h4 className="text-xs font-semibold">Instant Webhook Sync</h4>
                                    <p className="text-[11px] text-muted-foreground mt-0.5">
                                        Incoming customer messages are received in under 200ms with automated 24h window tracking.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 pt-2">
                                <Button
                                    onClick={handleConnectClick}
                                    disabled={isConnecting}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-6 shadow-sm gap-2"
                                >
                                    <Smartphone className="size-4" />
                                    {isConnecting ? 'Opening Meta Popup...' : 'Connect WhatsApp Number Now'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Pre-requisites Checklist */}
                <Card className="border-sidebar-border/70">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">
                            What you need before connecting
                        </CardTitle>
                        <CardDescription className="text-xs">
                            Keep these ready for a smooth 2-minute onboarding:
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex items-start gap-3">
                            <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                            <div className="text-xs">
                                <span className="font-semibold text-foreground">A clean phone number: </span>
                                <span className="text-muted-foreground">The number must not currently be registered on the normal WhatsApp or WhatsApp Business mobile app. (If it is, delete the account in the WhatsApp app first).</span>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                            <div className="text-xs">
                                <span className="font-semibold text-foreground">Facebook / Meta Account: </span>
                                <span className="text-muted-foreground">An admin login to your company's Facebook Page or Meta Business Manager.</span>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                            <div className="text-xs">
                                <span className="font-semibold text-foreground">Business Details: </span>
                                <span className="text-muted-foreground">Legal business name, address, and GSTIN / Udyam registration for Meta verification.</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
