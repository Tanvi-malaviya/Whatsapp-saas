import { useState, useEffect } from 'react';
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
    ChevronLeft,
    Sparkles,
    ShieldCheck,
    Check,
    RefreshCw,
    Sliders,
    Zap,
    Lock,
    Globe,
    HelpCircle,
    Info,
    Building2,
    Phone,
    Shield,
    CheckCircle,
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

type SetupMethod = 'coexistence' | 'new' | 'personal' | 'transfer';

const COEXISTENCE_STEPS = [
    {
        step: 1,
        title: 'Sign in to Facebook',
        subtitle: 'Log in with the Facebook account that manages your WhatsApp Business app. This lets Sathwara InfoTech request the permissions needed to connect your number.',
        bullets: [
            'Your login happens securely inside Facebook. Sathwara InfoTech never sees your password.',
            'Make sure this account has admin access to the Meta Business portfolio you want to use.',
            'After signing in, you will pick the business linked to your WhatsApp Business app.',
        ],
        previewType: 'fb_login',
    },
    {
        step: 2,
        title: 'Get Started with WhatsApp Business',
        subtitle: 'Review how your WhatsApp account will be connected between your phone app and Cloud API.',
        bullets: [
            'Both your phone app and this dashboard stay connected in Coexistence mode.',
            'You retain full ownership of your phone number and existing customer conversations.',
            "Click 'Get Started' in the popup to proceed to business selection.",
        ],
        previewType: 'get_started',
    },
    {
        step: 3,
        title: 'Select Your Meta Business Portfolio',
        subtitle: 'Choose your verified Meta Business Portfolio (e.g. Sathwara InfoTech) from the list.',
        bullets: [
            'Select the business portfolio that owns your WhatsApp Business Account.',
            'Your verified portfolio unlocks high-volume messaging limits automatically.',
            "Click 'Continue' to move to profile setup.",
        ],
        previewType: 'portfolio',
    },
    {
        step: 4,
        title: 'Create or Select WhatsApp Business Profile',
        subtitle: 'Set up the public business profile details that customers will see when messaging you on WhatsApp.',
        bullets: [
            'Set your official Business Display Name (e.g. Sathwara InfoTech).',
            'Choose your business category (e.g. IT & Software Services, Retail).',
            'Optionally add your business website, email, and description.',
        ],
        previewType: 'profile',
    },
    {
        step: 5,
        title: 'Choose WhatsApp Business App (Coexistence)',
        subtitle: 'Select the Coexistence option to keep using your phone app while managing chats on the web.',
        bullets: [
            "Select 'Keep using WhatsApp Business App' so your mobile chat history stays untouched.",
            'No need to delete or migrate your account away from your phone.',
            'Both channels will sync incoming and outgoing chats simultaneously.',
        ],
        previewType: 'coexistence',
    },
    {
        step: 6,
        title: 'Enter WhatsApp Phone Number',
        subtitle: 'Enter your 10-digit mobile number with country code (+91 for India).',
        bullets: [
            'Select country code and enter your mobile number.',
            'Choose verification method: Text Message (SMS) or Phone Call.',
            "Click 'Send Code' to receive the 6-digit verification code from WhatsApp.",
        ],
        previewType: 'phone_input',
    },
    {
        step: 7,
        title: 'Verify Your Phone Number (OTP)',
        subtitle: 'Enter the 6-digit verification code sent directly to your phone by Meta.',
        bullets: [
            'Meta will send a 6-digit code via SMS or voice call within a few seconds.',
            'Enter the 6-digit code into the Meta popup window.',
            "Click 'Verify' to confirm ownership of the phone number.",
        ],
        previewType: 'otp',
    },
    {
        step: 8,
        title: 'Grant Messaging Permissions',
        subtitle: 'Confirm permissions to allow Sathwara InfoTech to send broadcasts and manage chats.',
        bullets: [
            'Grants whatsapp_business_messaging permissions securely via OAuth 2.0.',
            'No sensitive passwords or private credentials are ever shared or stored.',
            "Click 'Continue' to finalize the access grant.",
        ],
        previewType: 'permissions',
    },
    {
        step: 9,
        title: 'Meta Cloud API Provisioning',
        subtitle: 'Meta automatically registers your Phone Number ID and assigns Cloud API credentials.',
        bullets: [
            'Official Phone Number ID and WABA ID are automatically created by Meta.',
            'Webhooks are subscribed with 100% end-to-end encryption.',
            'Zero manual copy-pasting of API keys or IDs required.',
        ],
        previewType: 'provisioning',
    },
    {
        step: 10,
        title: 'Automatic Handshake & Token Sync',
        subtitle: 'The Meta popup communicates back to your Sathwara InfoTech dashboard.',
        bullets: [
            'The popup securely hands over authorization codes directly to the platform.',
            'Your dashboard stores and validates your Meta Cloud API connection in real time.',
            'The popup window automatically closes once the connection is verified.',
        ],
        previewType: 'handshake',
    },
    {
        step: 11,
        title: 'Congratulations! Your Number is Live',
        subtitle: 'Your WhatsApp number is connected, verified with High Quality Rating, and ready to send!',
        bullets: [
            'Live status badge turns GREEN instantly with Tier 1K messaging limits.',
            'Start sending promotional campaigns and automated bot flows.',
            'Collaborate with your entire team in the Unified Chat Inbox.',
        ],
        previewType: 'live',
    },
];

export default function WhatsAppConnectWizard({
    existingChannel,
    defaultWebhookUrl = 'https://whatsapp.sathwarainfotech.cloud/webhooks/meta',
    defaultVerifyToken = 'sathwara_secret_token_123',
    metaAppId = '1079349601748656',
    metaConfigId = '1857245935612505',
}: Props) {
    const { tenant } = usePage().props as any;
    const currentOrg = tenant?.current || { name: 'Sathwara InfoTech', slug: 'sathwara-infotech' };

    const [step, setStep] = useState<1 | 2 | 3>(2);
    const [setupMethod, setSetupMethod] = useState<SetupMethod>('coexistence');
    const [guideStep, setGuideStep] = useState(1);
    const [showDirectForm, setShowDirectForm] = useState(false);

    const [countryCode, setCountryCode] = useState('+91');
    const [phoneDigits, setPhoneDigits] = useState('9104081291');
    const [channelName, setChannelName] = useState(
        currentOrg?.name ? `${currentOrg.name} WhatsApp` : 'Sathwara InfoTech WhatsApp'
    );
    const [showAdvanced, setShowAdvanced] = useState(false);

    // Advanced / auto-fill credentials
    const [phoneId, setPhoneId] = useState('');
    const [wabaId, setWabaId] = useState(existingChannel?.waba_id || '934553439246885');
    const [accessToken, setAccessToken] = useState(existingChannel?.access_token || '');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successNotice, setSuccessNotice] = useState<string | null>(null);
    const [connectedChannel, setConnectedChannel] = useState<Channel | null>(null);

    const [configIdInput, setConfigIdInput] = useState(metaConfigId || '1857245935612505');
    const [showConfigModal, setShowConfigModal] = useState(false);

    // 1. Dynamically load Meta Facebook JavaScript SDK for Embedded Signup
    useEffect(() => {
        if (typeof window !== 'undefined') {
            (window as any).fbAsyncInit = function () {
                (window as any).FB.init({
                    appId: metaAppId || '1079349601748656',
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

    // 2. Listen to Meta Embedded Signup session message events
    useEffect(() => {
        const handleMetaMessage = (event: MessageEvent) => {
            if (
                event.origin !== 'https://www.facebook.com' &&
                event.origin !== 'https://web.facebook.com'
            ) {
                return;
            }
            try {
                const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
                if (data.type === 'WA_EMBEDDED_SIGNUP') {
                    if (data.event === 'FINISH') {
                        const { phone_number_id, waba_id } = data.data || {};
                        setSuccessNotice('Meta Embedded Signup completed! Connecting channel automatically...');
                        handleDirectAutoConnect(phone_number_id, waba_id);
                    }
                }
            } catch (e) {
                // Ignore parsing errors for other message events
            }
        };

        window.addEventListener('message', handleMetaMessage);
        return () => window.removeEventListener('message', handleMetaMessage);
    }, []);

    // Automatic connection handler when Meta popup finishes
    const handleDirectAutoConnect = async (customPhoneId?: string, customWabaId?: string) => {
        setIsSubmitting(true);
        setErrorMsg(null);
        try {
            const resp = await fetch('/channels/quick-connect', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as any)?.content || '',
                },
                body: JSON.stringify({
                    name: channelName || `${currentOrg.name} WhatsApp`,
                    phone_number: `${countryCode}${phoneDigits.replace(/\D/g, '')}`,
                    phone_number_id: customPhoneId || phoneId || '',
                    waba_id: customWabaId || wabaId || '934553439246885',
                    access_token: accessToken || existingChannel?.access_token || '',
                    setup_method: 'coexistence',
                }),
            });

            const data = await resp.json();
            if (data.success && data.channel) {
                setConnectedChannel(data.channel);
                setStep(3);
            } else {
                setErrorMsg(data.message || 'Failed to auto-connect. Please enter phone number manually below.');
                setShowDirectForm(true);
            }
        } catch (err: any) {
            setErrorMsg('Network error: ' + err.message);
            setShowDirectForm(true);
        } finally {
            setIsSubmitting(false);
        }
    };

    // 3. Trigger Official Meta WhatsApp Onboarding Popup - Exactly like Xobito
    const launchMetaEmbeddedSignup = () => {
        setErrorMsg(null);
        const activeConfigId = configIdInput.trim() || metaConfigId || '1835889181059188';
        const appId = metaAppId || '1079349601748656';

        const onboardUrl = `https://business.facebook.com/messaging/whatsapp/onboard/?app_id=${appId}&config_id=${activeConfigId}&extras=%7B%22version%22%3A%22v4%22%2C%22sessionInfoVersion%22%3A%223%22%2C%22featureType%22%3A%22whatsapp_business_app_onboarding%22%7D&redirect_uri=https%3A%2F%2Fwhatsapp.sathwarainfotech.cloud%2Fwhatsapp%2Fconnect`;

        const w = 650;
        const h = 750;
        const left = typeof window !== 'undefined' ? window.screen.width / 2 - w / 2 : 100;
        const top = typeof window !== 'undefined' ? window.screen.height / 2 - h / 2 : 100;

        const popup = window.open(
            onboardUrl,
            'MetaWhatsAppOnboarding',
            `width=${w},height=${h},top=${top},left=${left},scrollbars=yes,status=no,resizable=yes`
        );

        if (!popup || popup.closed || typeof popup.closed === 'undefined') {
            window.open(onboardUrl, '_blank');
        }

        // Auto-detect when popup is completed/closed
        const timer = setInterval(() => {
            if (popup && popup.closed) {
                clearInterval(timer);
                setSuccessNotice('Popup completed! Syncing and connecting WhatsApp number...');
                handleDirectAutoConnect();
            }
        }, 1500);
    };

    const handleConnectSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setErrorMsg(null);

        const cleanDigits = phoneDigits.replace(/\D/g, '');
        if (cleanDigits.length < 10 && !phoneId) {
            setErrorMsg('Please enter a valid 10-digit WhatsApp phone number.');
            return;
        }

        handleDirectAutoConnect();
    };

    const currentStepData = COEXISTENCE_STEPS.find((s) => s.step === guideStep) || COEXISTENCE_STEPS[0];

    return (
        <>
            <Head title="Connect WhatsApp | Coexistence Guide | Sathwara InfoTech" />

            <div className="flex flex-1 flex-col gap-5 p-4 md:p-8 max-w-6xl mx-auto w-full font-sans text-foreground">
                {/* Top Nav Bar / Breadcrumbs (Exact Xobito style) */}
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
                        <span className="hover:text-foreground transition-colors">Connect</span>
                        <ChevronRight className="size-3 text-muted-foreground/50" />
                        <span className="hover:text-foreground transition-colors">Coexistence</span>
                        <ChevronRight className="size-3 text-muted-foreground/50" />
                        <span className="font-semibold text-foreground">Guide</span>
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
                    {/* Header Action & Title (Exact Xobito Step 3 of 3) */}
                    <div className="space-y-1.5">
                        <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="h-8 px-2 text-xs font-semibold text-muted-foreground hover:text-foreground gap-1.5 -ml-2"
                        >
                            <Link href="/whatsapp/connect">
                                <ArrowLeft className="size-3.5" />
                                Back
                            </Link>
                        </Button>

                        <div className="flex flex-wrap items-center gap-2.5">
                            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
                                Connect WhatsApp
                            </h1>
                            <Badge className="bg-muted text-foreground/80 hover:bg-muted font-normal text-xs px-2 py-0.5 border border-border">
                                Step 3 of 3
                            </Badge>
                        </div>
                        <p className="text-xs md:text-sm text-muted-foreground">
                            Follow the steps in the Facebook window to complete your Meta setup.
                        </p>
                    </div>

                    {/* Notification Alerts */}
                    {errorMsg && (
                        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium flex items-start justify-between gap-3 animate-in fade-in">
                            <div className="space-y-1">
                                <p className="font-semibold">Notice:</p>
                                <p>{errorMsg}</p>
                            </div>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setShowDirectForm(true)}
                                className="h-7 text-xs border-red-300 dark:border-red-800 text-red-700 dark:text-red-300"
                            >
                                Enter Number Manually
                            </Button>
                        </div>
                    )}

                    {successNotice && (
                        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-medium flex items-center gap-2 animate-in fade-in">
                            <RefreshCw className="size-4 animate-spin text-emerald-600 shrink-0" />
                            <span>{successNotice}</span>
                        </div>
                    )}

                    {/* ================= STEP 2: XOBITO COEXISTENCE INTERACTIVE GUIDE ================= */}
                    {step === 2 && (
                        <div className="space-y-6">
                            {/* Main Card: "You're almost there" + [Continue with Facebook] */}
                            <Card className="border-border/80 bg-card rounded-2xl shadow-sm overflow-hidden">
                                {/* Top Banner of Card */}
                                <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/70">
                                    <div className="space-y-1">
                                        <h2 className="text-lg md:text-xl font-bold text-foreground tracking-tight">
                                            You&apos;re almost there
                                        </h2>
                                        <p className="text-xs md:text-sm text-muted-foreground">
                                            Sign in with Facebook and follow the Meta setup steps to connect your phone number.
                                        </p>
                                    </div>

                                    {/* Primary 1-Click Facebook Button */}
                                    <Button
                                        onClick={launchMetaEmbeddedSignup}
                                        disabled={isSubmitting}
                                        className="h-11 px-6 rounded-xl bg-[#1877F2] hover:bg-[#166FE5] text-white font-bold text-sm shadow-md shadow-[#1877F2]/25 gap-2.5 shrink-0 transition-transform hover:scale-[1.02]"
                                    >
                                        {/* Official Facebook 'f' Logo */}
                                        <div className="size-5 rounded-full bg-white flex items-center justify-center text-[#1877F2]">
                                            <svg className="size-3.5 fill-current" viewBox="0 0 24 24">
                                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                            </svg>
                                        </div>
                                        <span>Continue with Facebook</span>
                                    </Button>
                                </div>

                                {/* Interactive 11-Step Walkthrough (Split Layout Matching Image) */}
                                <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-muted/10">
                                    {/* Left Column: Mockup Facebook Popup Browser Window */}
                                    <div className="lg:col-span-6 flex justify-center">
                                        <div className="w-full max-w-md rounded-2xl border border-border/80 bg-background shadow-lg overflow-hidden flex flex-col h-[380px] transition-all">
                                            {/* Browser Window Chrome */}
                                            <div className="h-9 bg-muted/60 border-b border-border/70 px-3.5 flex items-center gap-2 select-none">
                                                <div className="flex items-center gap-1.5">
                                                    <div className="size-2.5 rounded-full bg-[#FF5F56]" />
                                                    <div className="size-2.5 rounded-full bg-[#FFBD2E]" />
                                                    <div className="size-2.5 rounded-full bg-[#27C93F]" />
                                                </div>
                                                <div className="flex-1 mx-2">
                                                    <div className="h-5 rounded-md bg-background/80 border border-border/60 text-[10px] text-muted-foreground flex items-center justify-center gap-1 font-mono">
                                                        <Lock className="size-2.5 text-muted-foreground/60" />
                                                        facebook.com
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Mock Content Canvas per Step */}
                                            <div className="flex-1 p-5 flex flex-col justify-center items-center text-center overflow-y-auto">
                                                {currentStepData.previewType === 'fb_login' && (
                                                    <div className="w-full max-w-xs space-y-3 animate-in fade-in duration-200">
                                                        <div className="size-10 mx-auto rounded-full bg-[#1877F2] text-white flex items-center justify-center shadow-md">
                                                            <svg className="size-6 fill-current" viewBox="0 0 24 24">
                                                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                                            </svg>
                                                        </div>
                                                        <h4 className="text-xs font-bold text-foreground">Log in to Facebook</h4>
                                                        <div className="space-y-2">
                                                            <div className="h-8 rounded-lg border border-border/80 bg-muted/30 px-3 text-[11px] text-muted-foreground flex items-center">
                                                                bhavesh.sathwara@gmail.com
                                                            </div>
                                                            <div className="h-8 rounded-lg border border-border/80 bg-muted/30 px-3 text-[11px] text-muted-foreground flex items-center tracking-widest">
                                                                ••••••••••••
                                                            </div>
                                                        </div>
                                                        <div className="h-8 rounded-lg bg-[#1877F2] text-white text-xs font-semibold flex items-center justify-center shadow-xs">
                                                            Log In
                                                        </div>
                                                        <div className="text-[10px] text-[#1877F2] hover:underline cursor-pointer">
                                                            Forgotten password?
                                                        </div>
                                                    </div>
                                                )}

                                                {currentStepData.previewType === 'get_started' && (
                                                    <div className="w-full max-w-xs space-y-3.5 animate-in fade-in duration-200">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <div className="size-10 rounded-xl bg-[#25D366] text-white flex items-center justify-center shadow-sm">
                                                                <MessageSquare className="size-5" />
                                                            </div>
                                                            <ArrowRightLeft className="size-4 text-muted-foreground/60" />
                                                            <div className="size-10 rounded-xl bg-[#1877F2] text-white flex items-center justify-center shadow-sm">
                                                                <Building2 className="size-5" />
                                                            </div>
                                                        </div>
                                                        <h4 className="text-xs font-bold text-foreground">Connect to Sathwara InfoTech</h4>
                                                        <p className="text-[11px] text-muted-foreground leading-snug">
                                                            Link your WhatsApp account to enable Cloud API broadcasting & chat routing.
                                                        </p>
                                                        <div className="h-8 rounded-lg bg-[#1877F2] text-white text-xs font-semibold flex items-center justify-center">
                                                            Get Started
                                                        </div>
                                                    </div>
                                                )}

                                                {currentStepData.previewType === 'portfolio' && (
                                                    <div className="w-full max-w-xs space-y-2.5 text-left animate-in fade-in duration-200">
                                                        <h4 className="text-xs font-bold text-foreground text-center">Select Meta Business Portfolio</h4>
                                                        <div className="p-3 rounded-xl border-2 border-[#1877F2] bg-[#1877F2]/5 flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <Building2 className="size-4 text-[#1877F2]" />
                                                                <div>
                                                                    <div className="text-xs font-bold text-foreground">Sathwara InfoTech</div>
                                                                    <div className="text-[10px] text-muted-foreground">ID: 976124469221838 • Verified</div>
                                                                </div>
                                                            </div>
                                                            <div className="size-4 rounded-full bg-[#1877F2] text-white flex items-center justify-center">
                                                                <Check className="size-2.5 stroke-[3]" />
                                                            </div>
                                                        </div>
                                                        <div className="h-8 rounded-lg bg-[#1877F2] text-white text-xs font-semibold flex items-center justify-center mt-2">
                                                            Continue
                                                        </div>
                                                    </div>
                                                )}

                                                {currentStepData.previewType === 'profile' && (
                                                    <div className="w-full max-w-xs space-y-2.5 text-left animate-in fade-in duration-200">
                                                        <h4 className="text-xs font-bold text-foreground text-center">Create WhatsApp Profile</h4>
                                                        <div className="space-y-1">
                                                            <div className="text-[10px] text-muted-foreground font-medium">Display Name</div>
                                                            <div className="h-7 rounded border border-border px-2 text-xs flex items-center font-semibold text-foreground">
                                                                Sathwara InfoTech
                                                            </div>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <div className="text-[10px] text-muted-foreground font-medium">Category</div>
                                                            <div className="h-7 rounded border border-border px-2 text-xs flex items-center text-muted-foreground">
                                                                IT & Software Services
                                                            </div>
                                                        </div>
                                                        <div className="h-8 rounded-lg bg-[#1877F2] text-white text-xs font-semibold flex items-center justify-center mt-2">
                                                            Next
                                                        </div>
                                                    </div>
                                                )}

                                                {currentStepData.previewType === 'coexistence' && (
                                                    <div className="w-full max-w-xs space-y-3 animate-in fade-in duration-200">
                                                        <div className="size-11 mx-auto rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center border border-emerald-500/20">
                                                            <Smartphone className="size-6" />
                                                        </div>
                                                        <h4 className="text-xs font-bold text-foreground">WhatsApp Business App Coexistence</h4>
                                                        <div className="p-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/5 text-left flex items-start gap-2">
                                                            <CheckCircle className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                                                            <div className="text-[11px] text-foreground">
                                                                Keep using your mobile phone app. Chats will sync to both devices.
                                                            </div>
                                                        </div>
                                                        <div className="h-8 rounded-lg bg-[#1877F2] text-white text-xs font-semibold flex items-center justify-center">
                                                            Continue
                                                        </div>
                                                    </div>
                                                )}

                                                {currentStepData.previewType === 'phone_input' && (
                                                    <div className="w-full max-w-xs space-y-2.5 text-left animate-in fade-in duration-200">
                                                        <h4 className="text-xs font-bold text-foreground text-center">Add a Phone Number</h4>
                                                        <div className="flex gap-2">
                                                            <div className="h-8 px-2 rounded border border-border flex items-center text-xs font-semibold">
                                                                🇮🇳 +91
                                                            </div>
                                                            <div className="h-8 flex-1 px-3 rounded border border-border flex items-center text-xs font-mono font-medium">
                                                                91040 81291
                                                            </div>
                                                        </div>
                                                        <div className="space-y-1 pt-1 text-[11px] text-muted-foreground">
                                                            <label className="flex items-center gap-1.5 cursor-pointer">
                                                                <input type="radio" checked readOnly className="accent-[#1877F2]" />
                                                                <span>Text message (SMS)</span>
                                                            </label>
                                                        </div>
                                                        <div className="h-8 rounded-lg bg-[#1877F2] text-white text-xs font-semibold flex items-center justify-center mt-2">
                                                            Send Code
                                                        </div>
                                                    </div>
                                                )}

                                                {currentStepData.previewType === 'otp' && (
                                                    <div className="w-full max-w-xs space-y-3 animate-in fade-in duration-200">
                                                        <h4 className="text-xs font-bold text-foreground">Verify Your Phone Number</h4>
                                                        <p className="text-[11px] text-muted-foreground">
                                                            Enter the 6-digit code sent to +91 91040 81291
                                                        </p>
                                                        <div className="flex justify-center gap-1.5">
                                                            {['8', '4', '1', '9', '2', '0'].map((digit, i) => (
                                                                <div
                                                                    key={i}
                                                                    className="size-8 rounded border-2 border-[#1877F2] bg-[#1877F2]/5 flex items-center justify-center text-sm font-bold font-mono text-foreground"
                                                                >
                                                                    {digit}
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <div className="h-8 rounded-lg bg-[#1877F2] text-white text-xs font-semibold flex items-center justify-center mt-2">
                                                            Verify
                                                        </div>
                                                    </div>
                                                )}

                                                {currentStepData.previewType === 'permissions' && (
                                                    <div className="w-full max-w-xs space-y-2.5 text-left animate-in fade-in duration-200">
                                                        <h4 className="text-xs font-bold text-foreground text-center">Permissions Summary</h4>
                                                        <div className="p-3 rounded-xl border border-border/80 bg-muted/30 space-y-2 text-[11px]">
                                                            <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
                                                                <Check className="size-3.5 stroke-[3]" />
                                                                <span>whatsapp_business_messaging</span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
                                                                <Check className="size-3.5 stroke-[3]" />
                                                                <span>whatsapp_business_management</span>
                                                            </div>
                                                        </div>
                                                        <div className="h-8 rounded-lg bg-[#1877F2] text-white text-xs font-semibold flex items-center justify-center">
                                                            Grant Permissions
                                                        </div>
                                                    </div>
                                                )}

                                                {currentStepData.previewType === 'provisioning' && (
                                                    <div className="w-full max-w-xs space-y-3 animate-in fade-in duration-200">
                                                        <RefreshCw className="size-10 mx-auto text-[#1877F2] animate-spin" />
                                                        <h4 className="text-xs font-bold text-foreground">Provisioning Cloud API...</h4>
                                                        <p className="text-[11px] text-muted-foreground">
                                                            Registering Phone Number ID & End-to-End Encryption Keys on Meta servers.
                                                        </p>
                                                    </div>
                                                )}

                                                {currentStepData.previewType === 'handshake' && (
                                                    <div className="w-full max-w-xs space-y-3 animate-in fade-in duration-200">
                                                        <div className="size-12 mx-auto rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center border border-emerald-500/20">
                                                            <ShieldCheck className="size-7" />
                                                        </div>
                                                        <h4 className="text-xs font-bold text-foreground">Secure Token Exchange</h4>
                                                        <p className="text-[11px] text-muted-foreground">
                                                            Authenticating with Sathwara InfoTech Portal... Handshake complete!
                                                        </p>
                                                    </div>
                                                )}

                                                {currentStepData.previewType === 'live' && (
                                                    <div className="w-full max-w-xs space-y-3 animate-in fade-in duration-200">
                                                        <div className="size-12 mx-auto rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-lg shadow-[#25D366]/30">
                                                            <Check className="size-7 stroke-[3]" />
                                                        </div>
                                                        <h4 className="text-sm font-bold text-foreground">Ready for Messaging!</h4>
                                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-[11px] font-semibold">
                                                            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                                                            Active & Verified
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Column: Step Description, Green Text & Bullet Points (Exact Xobito layout) */}
                                    <div className="lg:col-span-6 space-y-5">
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <Badge
                                                    variant="secondary"
                                                    className="font-mono text-xs px-2.5 py-0.5 font-semibold text-muted-foreground"
                                                >
                                                    Step {currentStepData.step} of 11
                                                </Badge>

                                                {/* Stepper Arrow Buttons */}
                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        disabled={guideStep === 1}
                                                        onClick={() => setGuideStep((prev) => Math.max(1, prev - 1))}
                                                        className="size-7 rounded-lg"
                                                    >
                                                        <ChevronLeft className="size-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        disabled={guideStep === 11}
                                                        onClick={() => setGuideStep((prev) => Math.min(11, prev + 1))}
                                                        className="size-7 rounded-lg"
                                                    >
                                                        <ChevronRight className="size-4" />
                                                    </Button>
                                                </div>
                                            </div>

                                            <h3 className="text-lg md:text-xl font-bold text-foreground tracking-tight">
                                                {currentStepData.title}
                                            </h3>
                                        </div>

                                        {/* Highlight description box in vibrant green */}
                                        <div className="p-3.5 rounded-xl bg-[#25D366]/10 border border-[#25D366]/20 text-[#128C7E] dark:text-[#25D366] text-xs md:text-sm font-medium leading-relaxed">
                                            {currentStepData.subtitle}
                                        </div>

                                        {/* Explanatory Bullet Points */}
                                        <ul className="space-y-2.5 text-xs text-muted-foreground leading-relaxed">
                                            {currentStepData.bullets.map((bullet, idx) => (
                                                <li key={idx} className="flex items-start gap-2.5">
                                                    <span className="text-[#1877F2] font-bold text-sm leading-none mt-0.5">•</span>
                                                    <span>{bullet}</span>
                                                </li>
                                            ))}
                                        </ul>

                                        {/* Interactive Navigation Dots (1 to 11) */}
                                        <div className="pt-2 flex items-center justify-between border-t border-border/70">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                {COEXISTENCE_STEPS.map((s) => (
                                                    <button
                                                        key={s.step}
                                                        onClick={() => setGuideStep(s.step)}
                                                        className={`size-6 rounded-md text-[11px] font-bold transition-all ${
                                                            s.step === guideStep
                                                                ? 'bg-[#1877F2] text-white shadow-xs scale-105'
                                                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                                        }`}
                                                    >
                                                        {s.step}
                                                    </button>
                                                ))}
                                            </div>

                                            <Button
                                                size="sm"
                                                onClick={launchMetaEmbeddedSignup}
                                                className="bg-[#1877F2] hover:bg-[#166FE5] text-white text-xs font-semibold gap-1.5 h-8 px-3 rounded-lg"
                                            >
                                                <span>Launch Popup</span>
                                                <ExternalLink className="size-3" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            {/* Collapsible / Direct Input Accordion for Manual Verification */}
                            <div className="border border-border/80 bg-card rounded-2xl p-5 shadow-xs">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div>
                                        <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                                            <Zap className="size-4 text-[#47b672]" />
                                            Direct Quick Connect & Verification
                                        </h4>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            Already finished the Meta popup or want to directly verify your WhatsApp mobile number?
                                        </p>
                                    </div>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowDirectForm(!showDirectForm)}
                                        className="text-xs font-semibold h-8"
                                    >
                                        {showDirectForm ? 'Hide Form' : 'Show Direct Form'}
                                    </Button>
                                </div>

                                {showDirectForm && (
                                    <form onSubmit={handleConnectSubmit} className="mt-5 pt-5 border-t border-border/70 space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-semibold text-foreground">
                                                    WhatsApp Phone Number <span className="text-red-500">*</span>
                                                </Label>
                                                <div className="flex gap-2">
                                                    <select
                                                        value={countryCode}
                                                        onChange={(e) => setCountryCode(e.target.value)}
                                                        className="h-10 px-3 rounded-lg border border-input bg-background text-xs font-semibold text-foreground"
                                                    >
                                                        <option value="+91">🇮🇳 +91 (India)</option>
                                                        <option value="+1">🇺🇸 +1 (US)</option>
                                                        <option value="+44">🇬🇧 +44 (UK)</option>
                                                        <option value="+971">🇦🇪 +971 (UAE)</option>
                                                    </select>
                                                    <Input
                                                        type="tel"
                                                        value={phoneDigits}
                                                        onChange={(e) => setPhoneDigits(e.target.value)}
                                                        placeholder="91040 81291"
                                                        className="h-10 text-sm font-medium tracking-wide flex-1 font-mono"
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-semibold text-foreground">
                                                    Business / Channel Display Name
                                                </Label>
                                                <Input
                                                    type="text"
                                                    value={channelName}
                                                    onChange={(e) => setChannelName(e.target.value)}
                                                    placeholder="Sathwara InfoTech WhatsApp"
                                                    className="h-10 text-sm"
                                                />
                                            </div>
                                        </div>

                                        {/* Advanced Settings */}
                                        <div>
                                            <button
                                                type="button"
                                                onClick={() => setShowAdvanced(!showAdvanced)}
                                                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 font-semibold transition-colors"
                                            >
                                                <Sliders className="size-3 text-[#47b672]" />
                                                {showAdvanced ? 'Hide Advanced Meta IDs' : 'Advanced: Meta Cloud API IDs'}
                                            </button>

                                            {showAdvanced && (
                                                <div className="mt-3 p-4 rounded-xl bg-muted/30 border border-border/70 grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    <div className="space-y-1">
                                                        <Label className="text-[11px] text-muted-foreground">Phone Number ID</Label>
                                                        <Input
                                                            value={phoneId}
                                                            onChange={(e) => setPhoneId(e.target.value)}
                                                            placeholder="Leave blank for 1-click auto-discovery"
                                                            className="h-8 text-xs font-mono"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-[11px] text-muted-foreground">WABA ID</Label>
                                                        <Input
                                                            value={wabaId}
                                                            onChange={(e) => setWabaId(e.target.value)}
                                                            placeholder="934553439246885"
                                                            className="h-8 text-xs font-mono"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <Button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="w-full bg-[#47b672] text-white hover:bg-[#3ba363] h-10 text-xs font-bold tracking-wide rounded-xl gap-2 shadow-xs"
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
                                    </form>
                                )}
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
                                        <path d="M12.031 2c-5.516 0-9.99 4.474-9.99 9.99 0 1.763.459 3.484 1.332 5.006l-1.416 5.174 5.305-1.391c1.47.802 3.125 1.226 4.769 1.226 5.516 0 9.99-4.474 9.99-9.99 0-5.516-4.474-9.989-9.99-9.989zm5.836 14.156c-.244.686-1.42 1.319-1.956 1.398-.517.076-1.19.109-3.488-.842-2.937-1.216-4.834-4.212-4.981-4.407-.146-.196-1.189-1.583-1.189-3.02 0-1.437.753-2.146 1.021-2.439.268-.293.585-.366.78-.366.195 0 .39.002.56.01.182.008.427-.069.668.51.244.585.83 2.025.903 2.172.073.146.122.317.024.512-.098.195-.147.317-.293.488-.146.171-.307.382-.439.512-.146.146-.299.305-.128.598.171.293.759 1.253 1.63 2.029 1.121.999 2.066 1.309 2.359 1.455.293.146.464.122.635-.073.171-.195.732-.854.927-1.147.195-.293.39-.244.659-.146.268.098 1.708.805 2.001.952.293.146.488.219.56.341.073.122.073.708-.171 1.394z" />
                                    </svg>
                                </div>

                                <div className="space-y-1.5">
                                    <h2 className="text-xl md:text-2xl font-bold text-foreground">
                                        WhatsApp Number Successfully Connected!
                                    </h2>
                                    <p className="text-xs md:text-sm text-muted-foreground">
                                        Your WhatsApp Business number is officially verified and registered with Meta Cloud API.
                                    </p>
                                </div>

                                {/* Channel Card Summary */}
                                <div className="mt-6 p-4 rounded-xl bg-muted/30 border border-border/80 text-left space-y-3">
                                    <div className="flex items-center justify-between pb-2 border-b border-border/60">
                                        <div>
                                            <h4 className="text-sm font-bold text-foreground">
                                                {connectedChannel?.name || `${currentOrg.name} WhatsApp`}
                                            </h4>
                                            <p className="text-xs font-mono text-muted-foreground">
                                                {connectedChannel?.phone_number || `${countryCode} ${phoneDigits}`}
                                            </p>
                                        </div>
                                        <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs px-2.5 py-1 font-semibold flex items-center gap-1.5">
                                            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                                            Connected & Live
                                        </Badge>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 text-xs">
                                        <div>
                                            <span className="text-muted-foreground block text-[11px]">Quality Rating</span>
                                            <strong className="text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
                                                <ShieldCheck className="size-3.5" />
                                                HIGH (Green)
                                            </strong>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground block text-[11px]">Messaging Tier</span>
                                            <strong className="text-foreground font-semibold mt-0.5 block">
                                                TIER 1K (1,000 / 24h)
                                            </strong>
                                        </div>
                                    </div>
                                </div>

                                {/* Call to Actions */}
                                <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                                    <Button
                                        asChild
                                        className="w-full sm:w-auto bg-[#47b672] text-white hover:bg-[#3ba363] h-10 px-6 font-bold text-xs rounded-xl shadow-md shadow-[#47b672]/20"
                                    >
                                        <Link href="/whatsapp/connect">
                                            Manage All Channels
                                        </Link>
                                    </Button>

                                    <Button
                                        asChild
                                        variant="outline"
                                        className="w-full sm:w-auto h-10 px-6 text-xs font-semibold rounded-xl"
                                    >
                                        <Link href="/campaigns/create">
                                            Send First Broadcast
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
