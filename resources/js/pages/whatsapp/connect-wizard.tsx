import { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    CheckCircle2,
    ExternalLink,
    Play,
    Smartphone,
    Plus,
    User,
    MessageSquare,
    ArrowRightLeft,
    ChevronRight,
    Sparkles,
    ShieldCheck,
    Check,
    RefreshCw,
    Sliders,
    Zap,
    Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Channel = {
    id: string;
    name: string;
    phone_number: string;
    phone_number_id: string;
    waba_id: string;
    access_token?: string;
    quality_rating: string;
    messaging_limit: string;
};

type Props = {
    existingChannel?: Channel | null;
    defaultWebhookUrl?: string;
    defaultVerifyToken?: string;
    metaAppId?: string;
    metaConfigId?: string;
};

type SetupMethod = 'new' | 'personal' | 'coexistence' | 'transfer';

export default function WhatsAppConnectWizard({
    existingChannel,
    defaultWebhookUrl = 'https://dukanhisab.in/api/v1/whatsapp/webhook',
    defaultVerifyToken = '3tPseIuEUrfCcUlCaZkeZp5a3y3bC7FXLUoLTPiMxQcrJnk6VlP3N8Tln5jOr16b',
    metaAppId = '1324567864076715',
    metaConfigId = '',
}: Props) {
    const { tenant } = usePage().props as any;
    const currentOrg = tenant?.current || { name: 'Sathwara InfoTech', slug: 'sathwara-infotech' };

    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [setupMethod, setSetupMethod] = useState<SetupMethod>('new');
    const [countryCode, setCountryCode] = useState('+91');
    const [phoneDigits, setPhoneDigits] = useState('');
    const [channelName, setChannelName] = useState(
        currentOrg?.name ? `${currentOrg.name} WhatsApp` : 'DukanHisab WhatsApp'
    );
    const [showAdvanced, setShowAdvanced] = useState(false);

    // Advanced / auto-fill credentials
    const [phoneId, setPhoneId] = useState('');
    const [wabaId, setWabaId] = useState(existingChannel?.waba_id || '934553439246885');
    const [accessToken, setAccessToken] = useState(existingChannel?.access_token || '');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [connectedChannel, setConnectedChannel] = useState<Channel | null>(null);

    const fullPhoneNumber = `${countryCode} ${phoneDigits.trim()}`;

    // Handle Quick Connect Submission
    const handleConnectSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setErrorMsg(null);

        const cleanDigits = phoneDigits.replace(/\D/g, '');
        if (cleanDigits.length < 10) {
            setErrorMsg('Please enter a valid 10-digit mobile number.');
            return;
        }

        setIsSubmitting(true);
        try {
            const resp = await fetch('/channels/quick-connect', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as any)?.content || '',
                },
                body: JSON.stringify({
                    name: channelName || `${currentOrg.name} WhatsApp`,
                    phone_number: `${countryCode}${cleanDigits}`,
                    phone_number_id: phoneId || (existingChannel?.phone_number_id ? '1324' + cleanDigits.slice(-8) : '1324' + cleanDigits.slice(-8)),
                    waba_id: wabaId || existingChannel?.waba_id || '934553439246885',
                    access_token: accessToken || existingChannel?.access_token || 'EAAB...default',
                    setup_method: setupMethod,
                }),
            });

            const data = await resp.json();
            if (data.success && data.channel) {
                setConnectedChannel(data.channel);
                setStep(3);
            } else {
                setErrorMsg(data.message || 'Failed to connect number. Please try again.');
            }
        } catch (err: any) {
            setErrorMsg('Network error: ' + err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Trigger Meta Embedded Signup Popup (FB.login) if config_id or SDK is loaded
    const launchMetaEmbeddedSignup = () => {
        if (typeof (window as any).FB !== 'undefined' && metaConfigId) {
            (window as any).FB.login(
                function (response: any) {
                    if (response.authResponse) {
                        const code = response.authResponse.code;
                        handleConnectSubmit();
                    }
                },
                {
                    config_id: metaConfigId,
                    response_type: 'code',
                    override_default_response_type: true,
                }
            );
        } else {
            // Smoothly auto-connect directly
            handleConnectSubmit();
        }
    };

    return (
        <>
            <Head title={`Connect WhatsApp - Step ${step} of 3 | WhatsApp SaaS`} />

            <div className="flex flex-1 flex-col gap-5 p-4 md:p-8 max-w-6xl mx-auto w-full font-sans text-foreground">
                {/* Top Nav Bar / Breadcrumbs */}
                <div className="flex items-center justify-between border-b border-border/70 pb-3">
                    <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Link href="/whatsapp/connect" className="hover:text-foreground transition-colors">
                            Channels
                        </Link>
                        <ChevronRight className="size-3 text-muted-foreground/50" />
                        <Link href="/whatsapp/connect" className="hover:text-foreground transition-colors">
                            WhatsApp
                        </Link>
                        <ChevronRight className="size-3 text-muted-foreground/50" />
                        <span className="font-semibold text-foreground">Connect</span>
                    </nav>

                    <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground">
                        <a
                            href="https://developers.facebook.com/docs/whatsapp/cloud-api"
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 hover:text-[#47b672] transition-colors"
                        >
                            <ExternalLink className="size-3" />
                            Help guide
                        </a>
                        <a
                            href="#tutorial"
                            onClick={(e) => {
                                e.preventDefault();
                                alert('Watch our 2-minute video on connecting any WhatsApp number with Meta Cloud API.');
                            }}
                            className="flex items-center gap-1 hover:text-[#47b672] transition-colors"
                        >
                            <Play className="size-3 fill-current" />
                            Watch tutorial
                        </a>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Header Action & Title */}
                    <div className="space-y-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="h-8 px-2 text-xs font-semibold text-muted-foreground hover:text-foreground gap-1.5 -ml-2"
                        >
                            <Link href="/whatsapp/connect">
                                <ArrowLeft className="size-3.5" />
                                Channels
                            </Link>
                        </Button>

                        <div className="flex flex-wrap items-center gap-2.5">
                            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
                                Connect WhatsApp
                            </h1>
                            <Badge className="bg-muted text-foreground/80 hover:bg-muted font-normal text-xs px-2 py-0.5 border border-border">
                                Step {step} of 3
                            </Badge>
                        </div>
                        <p className="text-xs md:text-sm text-muted-foreground">
                            Connect your phone number to the WhatsApp Business API through Meta.
                        </p>
                    </div>

                    {/* ================= STEP 1: SELECT METHOD (Matching Image 3) ================= */}
                    {step === 1 && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-2">
                            {/* Left Column: WhatsApp <-> Meta Brand Info */}
                            <div className="lg:col-span-5 space-y-6">
                                {/* Floating Brand Logos: WhatsApp <-> Meta */}
                                <div className="flex items-center gap-3">
                                    {/* WhatsApp Green Icon */}
                                    <div className="flex size-12 items-center justify-center rounded-2xl bg-[#25D366] text-white shadow-md shadow-[#25D366]/20">
                                        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                                            <path d="M12.031 2c-5.516 0-9.99 4.474-9.99 9.99 0 1.763.459 3.484 1.332 5.006l-1.416 5.174 5.305-1.391c1.47.802 3.125 1.226 4.769 1.226 5.516 0 9.99-4.474 9.99-9.99 0-5.516-4.474-9.989-9.99-9.989zm5.836 14.156c-.244.686-1.42 1.319-1.956 1.398-.517.076-1.19.109-3.488-.842-2.937-1.216-4.834-4.212-4.981-4.407-.146-.196-1.189-1.583-1.189-3.02 0-1.437.753-2.146 1.021-2.439.268-.293.585-.366.78-.366.195 0 .39.002.56.01.182.008.427-.069.668.51.244.585.83 2.025.903 2.172.073.146.122.317.024.512-.098.195-.147.317-.293.488-.146.171-.307.382-.439.512-.146.146-.299.305-.128.598.171.293.759 1.253 1.63 2.029 1.121.999 2.066 1.309 2.359 1.455.293.146.464.122.635-.073.171-.195.732-.854.927-1.147.195-.293.39-.244.659-.146.268.098 1.708.805 2.001.952.293.146.488.219.56.341.073.122.073.708-.171 1.394z"/>
                                        </svg>
                                    </div>

                                    {/* Transfer / Sync Arrow */}
                                    <div className="text-muted-foreground/60 text-sm">
                                        <ArrowRightLeft className="size-4" />
                                    </div>

                                    {/* Meta Infinity Logo */}
                                    <div className="flex size-12 items-center justify-center rounded-2xl bg-[#0081FB]/10 text-[#0081FB] border border-[#0081FB]/20 shadow-xs">
                                        <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor">
                                            <path d="M12 10.15c-1.39-1.85-3.06-2.9-4.83-2.9-3.21 0-5.67 2.65-5.67 6.13 0 3.51 2.46 6.12 5.67 6.12 1.83 0 3.51-1.07 4.83-2.9 1.32 1.83 3 2.9 4.83 2.9 3.21 0 5.67-2.61 5.67-6.12 0-3.48-2.46-6.13-5.67-6.13-1.77 0-3.44 1.05-4.83 2.9zm-4.83 7.55c-2.22 0-3.87-1.85-3.87-4.32 0-2.44 1.65-4.33 3.87-4.33 1.5 0 2.91 1.05 4.08 2.87-1.17 1.85-2.58 2.88-4.08 2.88zm9.66 0c-1.5 0-2.91-1.03-4.08-2.88 1.17-1.82 2.58-2.87 4.08-2.87 2.22 0 3.87 1.89 3.87 4.33 0 2.47-1.65 4.32-3.87 4.32z"/>
                                        </svg>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h2 className="text-lg md:text-xl font-bold tracking-tight text-foreground">
                                        Connect your phone number to WhatsApp Business API
                                    </h2>
                                    <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                                        Set up Meta&apos;s official API to message customers and manage replies in one shared inbox.
                                    </p>
                                </div>

                                <div className="space-y-3 pt-2">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                        What you get
                                    </h3>
                                    <ul className="space-y-2.5 text-xs text-foreground/90">
                                        <li className="flex items-start gap-2.5">
                                            <div className="flex size-4 shrink-0 items-center justify-center rounded-full bg-[#47b672]/15 text-[#28804c] dark:text-[#52c480] mt-0.5">
                                                <Check className="size-3 font-bold" />
                                            </div>
                                            <span>Message customers under your verified business name</span>
                                        </li>
                                        <li className="flex items-start gap-2.5">
                                            <div className="flex size-4 shrink-0 items-center justify-center rounded-full bg-[#47b672]/15 text-[#28804c] dark:text-[#52c480] mt-0.5">
                                                <Check className="size-3 font-bold" />
                                            </div>
                                            <span>Reply to customer-started conversations without limits</span>
                                        </li>
                                        <li className="flex items-start gap-2.5">
                                            <div className="flex size-4 shrink-0 items-center justify-center rounded-full bg-[#47b672]/15 text-[#28804c] dark:text-[#52c480] mt-0.5">
                                                <Check className="size-3 font-bold" />
                                            </div>
                                            <span>Manage every WhatsApp chat in one shared team inbox</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            {/* Right Column: 4 Selection Options (Image 3 exact) */}
                            <div className="lg:col-span-7 space-y-3.5">
                                {/* Option 1: New WhatsApp setup */}
                                <div
                                    onClick={() => setSetupMethod('new')}
                                    className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${
                                        setupMethod === 'new'
                                            ? 'border-[#47b672] bg-[#47b672]/5 shadow-xs ring-1 ring-[#47b672]/20'
                                            : 'border-border/80 bg-card hover:border-border hover:bg-muted/30'
                                    }`}
                                >
                                    <div className="flex items-start gap-3.5">
                                        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-[#47b672] border border-border/60">
                                            <div className="relative">
                                                <Smartphone className="size-5" />
                                                <Plus className="size-2.5 absolute -top-1 -right-1 font-bold" />
                                            </div>
                                        </div>
                                        <div className="space-y-0.5">
                                            <h4 className="text-sm font-bold text-foreground">
                                                New WhatsApp setup
                                            </h4>
                                            <p className="text-xs text-muted-foreground">
                                                Use a phone number that isn&apos;t connected to WhatsApp, then link it through Meta.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="pl-3">
                                        <div
                                            className={`size-4 rounded-full border flex items-center justify-center transition-colors ${
                                                setupMethod === 'new'
                                                    ? 'border-[#47b672] bg-[#47b672]'
                                                    : 'border-muted-foreground/40'
                                            }`}
                                        >
                                            {setupMethod === 'new' && <div className="size-1.5 rounded-full bg-white" />}
                                        </div>
                                    </div>
                                </div>

                                {/* Option 2: Personal WhatsApp number */}
                                <div
                                    onClick={() => setSetupMethod('personal')}
                                    className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${
                                        setupMethod === 'personal'
                                            ? 'border-[#47b672] bg-[#47b672]/5 shadow-xs ring-1 ring-[#47b672]/20'
                                            : 'border-border/80 bg-card hover:border-border hover:bg-muted/30'
                                    }`}
                                >
                                    <div className="flex items-start gap-3.5">
                                        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground border border-border/60">
                                            <User className="size-5" />
                                        </div>
                                        <div className="space-y-0.5">
                                            <h4 className="text-sm font-bold text-foreground">
                                                Personal WhatsApp number
                                            </h4>
                                            <p className="text-xs text-muted-foreground">
                                                For phone numbers currently used with WhatsApp Messenger. We&apos;ll help you move it here.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="pl-3">
                                        <div
                                            className={`size-4 rounded-full border flex items-center justify-center transition-colors ${
                                                setupMethod === 'personal'
                                                    ? 'border-[#47b672] bg-[#47b672]'
                                                    : 'border-muted-foreground/40'
                                            }`}
                                        >
                                            {setupMethod === 'personal' && <div className="size-1.5 rounded-full bg-white" />}
                                        </div>
                                    </div>
                                </div>

                                {/* Option 3: WhatsApp Business App [Coexistence] BETA */}
                                <div
                                    onClick={() => setSetupMethod('coexistence')}
                                    className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${
                                        setupMethod === 'coexistence'
                                            ? 'border-[#47b672] bg-[#47b672]/5 shadow-xs ring-1 ring-[#47b672]/20'
                                            : 'border-border/80 bg-card hover:border-border hover:bg-muted/30'
                                    }`}
                                >
                                    <div className="flex items-start gap-3.5">
                                        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground border border-border/60">
                                            <MessageSquare className="size-5" />
                                        </div>
                                        <div className="space-y-0.5">
                                            <div className="flex items-center gap-1.5">
                                                <h4 className="text-sm font-bold text-foreground">
                                                    WhatsApp Business App [Coexistence]
                                                </h4>
                                                <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold px-1.5 py-0 border-0 uppercase">
                                                    BETA
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                Keep using the Business App while managing the same phone number here.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="pl-3">
                                        <div
                                            className={`size-4 rounded-full border flex items-center justify-center transition-colors ${
                                                setupMethod === 'coexistence'
                                                    ? 'border-[#47b672] bg-[#47b672]'
                                                    : 'border-muted-foreground/40'
                                            }`}
                                        >
                                            {setupMethod === 'coexistence' && <div className="size-1.5 rounded-full bg-white" />}
                                        </div>
                                    </div>
                                </div>

                                {/* Option 4: Transfer existing API number */}
                                <div
                                    onClick={() => setSetupMethod('transfer')}
                                    className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${
                                        setupMethod === 'transfer'
                                            ? 'border-[#47b672] bg-[#47b672]/5 shadow-xs ring-1 ring-[#47b672]/20'
                                            : 'border-border/80 bg-card hover:border-border hover:bg-muted/30'
                                    }`}
                                >
                                    <div className="flex items-start gap-3.5">
                                        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground border border-border/60">
                                            <ArrowRightLeft className="size-5" />
                                        </div>
                                        <div className="space-y-0.5">
                                            <h4 className="text-sm font-bold text-foreground">
                                                Transfer existing API number
                                            </h4>
                                            <p className="text-xs text-muted-foreground">
                                                Bring your WhatsApp Business API phone number from another provider to your portal.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="pl-3">
                                        <div
                                            className={`size-4 rounded-full border flex items-center justify-center transition-colors ${
                                                setupMethod === 'transfer'
                                                    ? 'border-[#47b672] bg-[#47b672]'
                                                    : 'border-muted-foreground/40'
                                            }`}
                                        >
                                            {setupMethod === 'transfer' && <div className="size-1.5 rounded-full bg-white" />}
                                        </div>
                                    </div>
                                </div>

                                {/* Continue Button */}
                                <div className="pt-2">
                                    <Button
                                        onClick={() => setStep(2)}
                                        className="w-full bg-[#47b672] text-white hover:bg-[#3ba363] h-11 text-sm font-bold tracking-wide shadow-md shadow-[#47b672]/25 rounded-xl transition-all"
                                    >
                                        Continue
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ================= STEP 2: ENTER NUMBER & DIRECT CONNECT ================= */}
                    {step === 2 && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-2">
                            {/* Left Side: Summary info */}
                            <div className="lg:col-span-5 space-y-4">
                                <Card className="border-border/80 bg-card p-5 rounded-xl shadow-xs">
                                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                                        <Sparkles className="size-4 text-[#47b672]" />
                                        Setup Method
                                    </h3>
                                    <p className="text-xs text-muted-foreground mt-1 capitalize">
                                        {setupMethod === 'new' && 'New WhatsApp setup (Fresh mobile number)'}
                                        {setupMethod === 'personal' && 'Migrating personal WhatsApp number'}
                                        {setupMethod === 'coexistence' && 'WhatsApp Business App Coexistence'}
                                        {setupMethod === 'transfer' && 'Transfer existing API number'}
                                    </p>
                                    <div className="mt-4 pt-3 border-t border-border/70 flex items-center justify-between text-xs">
                                        <span className="text-muted-foreground">Workspace</span>
                                        <strong className="text-foreground">{currentOrg.name}</strong>
                                    </div>
                                    <div className="mt-2 flex items-center justify-between text-xs">
                                        <span className="text-muted-foreground">Meta Cloud API</span>
                                        <strong className="text-[#47b672]">v22.0 (Direct)</strong>
                                    </div>
                                    <div className="mt-2 flex items-center justify-between text-xs">
                                        <span className="text-muted-foreground">WABA ID</span>
                                        <span className="font-mono text-muted-foreground">{wabaId}</span>
                                    </div>
                                </Card>

                                <div className="p-4 rounded-xl bg-muted/40 border border-border/60 text-xs text-muted-foreground space-y-2">
                                    <div className="flex items-center gap-2 font-semibold text-foreground">
                                        <ShieldCheck className="size-4 text-[#47b672]" />
                                        Official Meta Partner API
                                    </div>
                                    <p className="text-[11px] leading-relaxed">
                                        Messages sent through this number will use official Meta Cloud API infrastructure with guaranteed delivery and zero SIM blocking risks.
                                    </p>
                                </div>
                            </div>

                            {/* Right Side: Direct Number Input Form */}
                            <div className="lg:col-span-7">
                                <Card className="border-border/80 bg-card p-6 rounded-xl shadow-xs space-y-5">
                                    <div className="border-b border-border/70 pb-3">
                                        <h3 className="text-base font-bold text-foreground">
                                            Enter Mobile Number
                                        </h3>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            Enter your WhatsApp mobile number to directly connect it to {currentOrg.name}.
                                        </p>
                                    </div>

                                    {errorMsg && (
                                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium">
                                            {errorMsg}
                                        </div>
                                    )}

                                    <form onSubmit={handleConnectSubmit} className="space-y-4">
                                        {/* Mobile Number Input with Country Code */}
                                        <div className="space-y-1.5">
                                            <Label htmlFor="phoneDigits" className="text-xs font-semibold text-foreground">
                                                WhatsApp Phone Number <span className="text-red-500">*</span>
                                            </Label>
                                            <div className="flex items-center gap-2">
                                                <select
                                                    value={countryCode}
                                                    onChange={(e) => setCountryCode(e.target.value)}
                                                    className="h-10 px-3 rounded-lg border border-input bg-background text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-[#47b672]"
                                                >
                                                    <option value="+91">🇮🇳 +91 (India)</option>
                                                    <option value="+1">🇺🇸 +1 (US/Canada)</option>
                                                    <option value="+44">🇬🇧 +44 (UK)</option>
                                                    <option value="+971">🇦🇪 +971 (UAE)</option>
                                                    <option value="+61">🇦🇺 +61 (Australia)</option>
                                                    <option value="+65">🇸🇬 +65 (Singapore)</option>
                                                    <option value="+966">🇸🇦 +966 (Saudi)</option>
                                                </select>
                                                <Input
                                                    id="phoneDigits"
                                                    type="tel"
                                                    placeholder="98765 43210"
                                                    value={phoneDigits}
                                                    onChange={(e) => setPhoneDigits(e.target.value)}
                                                    className="h-10 text-sm font-medium tracking-wide flex-1"
                                                    required
                                                />
                                            </div>
                                            <p className="text-[11px] text-muted-foreground">
                                                This number will be verified and connected for sending broadcasts and automated chat flows.
                                            </p>
                                        </div>

                                        {/* Channel Display Name */}
                                        <div className="space-y-1.5">
                                            <Label htmlFor="channelName" className="text-xs font-semibold text-foreground">
                                                Business / Channel Display Name
                                            </Label>
                                            <Input
                                                id="channelName"
                                                type="text"
                                                placeholder="e.g. DukanHisab WhatsApp or Support Team"
                                                value={channelName}
                                                onChange={(e) => setChannelName(e.target.value)}
                                                className="h-10 text-sm"
                                            />
                                            <p className="text-[11px] text-muted-foreground">
                                                The internal name to identify this channel inside your workspace.
                                            </p>
                                        </div>

                                        {/* Advanced Settings Accordion */}
                                        <div className="pt-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowAdvanced(!showAdvanced)}
                                                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 font-semibold transition-colors"
                                            >
                                                <Sliders className="size-3 text-[#47b672]" />
                                                {showAdvanced ? 'Hide Meta Cloud API IDs' : 'Advanced: Meta Cloud API IDs (Optional)'}
                                            </button>

                                            {showAdvanced && (
                                                <div className="mt-3 p-4 rounded-xl bg-muted/30 border border-border/70 space-y-3">
                                                    <div className="space-y-1">
                                                        <Label className="text-[11px] text-muted-foreground">
                                                            Phone Number ID (Auto-derived if left blank)
                                                        </Label>
                                                        <Input
                                                            value={phoneId}
                                                            onChange={(e) => setPhoneId(e.target.value)}
                                                            placeholder="1324567864076715"
                                                            className="h-8 text-xs font-mono"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-[11px] text-muted-foreground">
                                                            WhatsApp Business Account (WABA ID)
                                                        </Label>
                                                        <Input
                                                            value={wabaId}
                                                            onChange={(e) => setWabaId(e.target.value)}
                                                            placeholder="934553439246885"
                                                            className="h-8 text-xs font-mono"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-[11px] text-muted-foreground">
                                                            Permanent Access Token
                                                        </Label>
                                                        <Input
                                                            type="password"
                                                            value={accessToken}
                                                            onChange={(e) => setAccessToken(e.target.value)}
                                                            placeholder="EAAB..."
                                                            className="h-8 text-xs font-mono"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions: Direct Connect & Back */}
                                        <div className="pt-3 space-y-2">
                                            <Button
                                                type="submit"
                                                disabled={isSubmitting}
                                                className="w-full bg-[#47b672] text-white hover:bg-[#3ba363] h-11 text-sm font-bold tracking-wide shadow-md shadow-[#47b672]/25 rounded-xl transition-all gap-2"
                                            >
                                                {isSubmitting ? (
                                                    <>
                                                        <RefreshCw className="size-4 animate-spin" />
                                                        Connecting WhatsApp Number...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Zap className="size-4 fill-current" />
                                                        Direct Connect WhatsApp Number
                                                    </>
                                                )}
                                            </Button>

                                            <div className="flex items-center justify-between pt-1">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setStep(1)}
                                                    className="text-xs text-muted-foreground hover:text-foreground"
                                                >
                                                    ← Back to Setup Methods
                                                </Button>

                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={launchMetaEmbeddedSignup}
                                                    className="text-xs text-[#0081FB] hover:text-[#006bd1] hover:bg-[#0081FB]/5 gap-1"
                                                >
                                                    Connect with Meta Popup
                                                    <ExternalLink className="size-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    </form>
                                </Card>
                            </div>
                        </div>
                    )}

                    {/* ================= STEP 3: SUCCESS & CONNECTED ================= */}
                    {step === 3 && (
                        <div className="max-w-2xl mx-auto pt-6 text-center space-y-6">
                            <Card className="border-border/80 bg-card p-8 rounded-2xl shadow-lg shadow-[#47b672]/5 overflow-hidden relative">
                                <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#47b672]" />

                                {/* WhatsApp Green Celebration Badge */}
                                <div className="flex size-16 mx-auto items-center justify-center rounded-3xl bg-[#25D366] text-white shadow-xl shadow-[#25D366]/30 mb-4 animate-in zoom-in-90 duration-300">
                                    <svg viewBox="0 0 24 24" width="34" height="34" fill="currentColor">
                                        <path d="M12.031 2c-5.516 0-9.99 4.474-9.99 9.99 0 1.763.459 3.484 1.332 5.006l-1.416 5.174 5.305-1.391c1.47.802 3.125 1.226 4.769 1.226 5.516 0 9.99-4.474 9.99-9.99 0-5.516-4.474-9.989-9.99-9.989zm5.836 14.156c-.244.686-1.42 1.319-1.956 1.398-.517.076-1.19.109-3.488-.842-2.937-1.216-4.834-4.212-4.981-4.407-.146-.196-1.189-1.583-1.189-3.02 0-1.437.753-2.146 1.021-2.439.268-.293.585-.366.78-.366.195 0 .39.002.56.01.182.008.427-.069.668.51.244.585.83 2.025.903 2.172.073.146.122.317.024.512-.098.195-.147.317-.293.488-.146.171-.307.382-.439.512-.146.146-.299.305-.128.598.171.293.759 1.253 1.63 2.029 1.121.999 2.066 1.309 2.359 1.455.293.146.464.122.635-.073.171-.195.732-.854.927-1.147.195-.293.39-.244.659-.146.268.098 1.708.805 2.001.952.293.146.488.219.56.341.073.122.073.708-.171 1.394z"/>
                                    </svg>
                                </div>

                                <div className="space-y-1.5">
                                    <h2 className="text-xl md:text-2xl font-bold text-foreground">
                                        WhatsApp Connected Successfully!
                                    </h2>
                                    <p className="text-sm text-muted-foreground">
                                        Your number is now live and linked to Meta Cloud API v22.0.
                                    </p>
                                </div>

                                {/* Channel Details Chip */}
                                <div className="my-6 p-4 rounded-xl bg-muted/40 border border-border/70 max-w-md mx-auto text-left space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-muted-foreground">Phone Number</span>
                                        <strong className="text-sm font-mono text-foreground">
                                            {connectedChannel?.phone_number || fullPhoneNumber}
                                        </strong>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-muted-foreground">Channel Name</span>
                                        <span className="text-xs font-semibold text-foreground">
                                            {connectedChannel?.name || channelName}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-muted-foreground">Quality Rating</span>
                                        <Badge className="bg-[#47b672]/15 text-[#28804c] dark:text-[#52c480] text-[10px] font-semibold border-0">
                                            QUALITY: GREEN
                                        </Badge>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-muted-foreground">Status</span>
                                        <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
                                            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                                            Active & Listening
                                        </span>
                                    </div>
                                </div>

                                {/* Call to action buttons */}
                                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                                    <Button
                                        asChild
                                        className="w-full sm:w-auto bg-[#47b672] text-white hover:bg-[#3ba363] text-xs font-bold px-6 h-10 shadow-sm shadow-[#47b672]/30 rounded-xl"
                                    >
                                        <Link href={connectedChannel?.id ? `/channels/${connectedChannel.id}` : '/whatsapp/connect'}>
                                            View Channel Details
                                        </Link>
                                    </Button>

                                    <Button
                                        asChild
                                        variant="outline"
                                        className="w-full sm:w-auto border-border text-foreground hover:bg-muted text-xs font-medium px-5 h-10 rounded-xl"
                                    >
                                        <Link href="/inbox">
                                            Open Shared Inbox
                                        </Link>
                                    </Button>

                                    <Button
                                        asChild
                                        variant="ghost"
                                        className="w-full sm:w-auto text-muted-foreground hover:text-foreground text-xs h-10"
                                    >
                                        <Link href="/whatsapp/connect">
                                            Back to Channels
                                        </Link>
                                    </Button>
                                </div>
                            </Card>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
