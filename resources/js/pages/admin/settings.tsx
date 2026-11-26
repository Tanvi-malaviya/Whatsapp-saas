import { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
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
    Layers,
    Building2,
    CheckCircle2,
    Eye,
    EyeOff,
    Radio,
    Sparkles,
    Save,
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
        permanent_token?: string;
        webhook_url: string;
        verify_token: string;
        graph_version: string;
        php_version: string;
        laravel_version: string;
        environment: string;
        subscription_annual_price_paise?: number;
        subscription_validity_days?: number;
        welcome_bonus_paise?: number;
        referral_reward_paise?: number;
        campaign_max_contacts?: number;
        min_message_purchase_count?: number;
        meta_rate_marketing_paise?: number;
        meta_rate_utility_paise?: number;
        meta_rate_authentication_paise?: number;
    };
};

export default function AdminSettings({ settings }: Props) {
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [showVerifyToken, setShowVerifyToken] = useState(false);
    const [showPermanentToken, setShowPermanentToken] = useState(false);
    const [appId, setAppId] = useState(settings.app_id);
    const [configId, setConfigId] = useState(settings.config_id);
    const [verifyToken, setVerifyToken] = useState(settings.verify_token);
    const [permanentToken, setPermanentToken] = useState(settings.permanent_token || '');
    const [appSecret, setAppSecret] = useState('');
    const [openaiKey, setOpenaiKey] = useState('');
    const [razorpayKeyId, setRazorpayKeyId] = useState('');
    const [razorpaySecret, setRazorpaySecret] = useState('');
    const [razorpayWebhook, setRazorpayWebhook] = useState('');

    // Subscription & Financial Configuration States
    const [annualPrice, setAnnualPrice] = useState((settings.subscription_annual_price_paise ?? 999900) / 100);
    const [validityDays, setValidityDays] = useState(settings.subscription_validity_days ?? 365);
    const [welcomeBonus, setWelcomeBonus] = useState((settings.welcome_bonus_paise ?? 50000) / 100);
    const [referralReward, setReferralReward] = useState((settings.referral_reward_paise ?? 50000) / 100);
    const [campaignMaxContacts, setCampaignMaxContacts] = useState(settings.campaign_max_contacts ?? 2000);
    const [minMessages, setMinMessages] = useState(settings.min_message_purchase_count ?? 500);
    const [rateMarketing, setRateMarketing] = useState((settings.meta_rate_marketing_paise ?? 88) / 100);
    const [rateUtility, setRateUtility] = useState((settings.meta_rate_utility_paise ?? 14) / 100);
    const [rateAuth, setRateAuth] = useState((settings.meta_rate_authentication_paise ?? 14) / 100);

    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

    useEffect(() => {
        setAppId(settings.app_id);
        setConfigId(settings.config_id);
        setVerifyToken(settings.verify_token);
        setPermanentToken(settings.permanent_token || '');
        setAnnualPrice((settings.subscription_annual_price_paise ?? 999900) / 100);
        setValidityDays(settings.subscription_validity_days ?? 365);
        setWelcomeBonus((settings.welcome_bonus_paise ?? 50000) / 100);
        setReferralReward((settings.referral_reward_paise ?? 50000) / 100);
        setCampaignMaxContacts(settings.campaign_max_contacts ?? 2000);
        setMinMessages(settings.min_message_purchase_count ?? 500);
        setRateMarketing((settings.meta_rate_marketing_paise ?? 88) / 100);
        setRateUtility((settings.meta_rate_utility_paise ?? 14) / 100);
        setRateAuth((settings.meta_rate_authentication_paise ?? 14) / 100);
    }, [
        settings.app_id,
        settings.config_id,
        settings.verify_token,
        settings.permanent_token,
        settings.subscription_annual_price_paise,
        settings.subscription_validity_days,
        settings.welcome_bonus_paise,
        settings.referral_reward_paise,
        settings.campaign_max_contacts,
        settings.min_message_purchase_count,
        settings.meta_rate_marketing_paise,
        settings.meta_rate_utility_paise,
        settings.meta_rate_authentication_paise,
    ]);

    const hasChanges = true;

    const handleSaveSettings = () => {
        setIsSaving(true);
        router.post(
            '/admin/settings',
            {
                app_id: appId,
                config_id: configId,
                verify_token: verifyToken,
                app_secret: appSecret,
                openai_api_key: openaiKey,
                razorpay_key_id: razorpayKeyId,
                razorpay_key_secret: razorpaySecret,
                razorpay_webhook_secret: razorpayWebhook,
                subscription_annual_price_paise: Math.round(annualPrice * 100),
                subscription_validity_days: validityDays,
                welcome_bonus_paise: Math.round(welcomeBonus * 100),
                referral_reward_paise: Math.round(referralReward * 100),
                campaign_max_contacts: campaignMaxContacts,
                min_message_purchase_count: minMessages,
                meta_rate_marketing_paise: Math.round(rateMarketing * 100),
                meta_rate_utility_paise: Math.round(rateUtility * 100),
                meta_rate_authentication_paise: Math.round(rateAuth * 100),
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsSaving(false);
                    setSaveSuccessNotice(true);
                    setAppSecret(''); setOpenaiKey(''); setRazorpayKeyId(''); setRazorpaySecret(''); setRazorpayWebhook('');
                    setTimeout(() => setSaveSuccessNotice(false), 5000);
                },
                onError: () => {
                    setIsSaving(false);
                },
                onFinish: () => setIsSaving(false),
            }
        );
    };

    const copyToClipboard = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    return (
        <>
            <Head title="Global Settings - Super Admin" />

            <div className="space-y-3.5 w-full"><Card><CardHeader><CardTitle>AI and payment providers</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2">{[
                ['OpenAI API key', openaiKey, setOpenaiKey], ['Razorpay key ID', razorpayKeyId, setRazorpayKeyId], ['Razorpay key secret', razorpaySecret, setRazorpaySecret], ['Razorpay webhook secret', razorpayWebhook, setRazorpayWebhook],
            ].map(([label, value, setter]) => <label key={label as string} className="text-sm">{label as string}<Input autoComplete="new-password" type="password" value={value as string} onChange={e => (setter as (value: string) => void)(e.target.value)} placeholder="Leave blank to keep existing" /></label>)}<p className="text-xs text-muted-foreground sm:col-span-2">Razorpay webhook URL: {window.location.origin}/webhooks/razorpay</p></CardContent></Card>
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/70">
                    <div className="flex items-center gap-2.5">
                        <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <Settings className="size-4" />
                        </div>
                        <div>
                            <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground leading-tight">
                                Global Platform &amp; API Settings
                            </h1>
                            <p className="text-xs text-muted-foreground">
                                Manage provider credentials and webhooks. Leave secret fields blank to keep their current values.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                        {hasChanges && (
                            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1 shrink-0">
                                <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                                Unsaved changes
                            </span>
                        )}

                        <Button
                            size="sm"
                            disabled={isSaving || !hasChanges}
                            onClick={handleSaveSettings}
                            className={`h-8 text-xs font-semibold gap-1.5 shadow-2xs transition-all ${
                                hasChanges
                                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                                    : 'bg-muted text-muted-foreground hover:bg-muted/80 opacity-60'
                            }`}
                        >
                            <Save className="size-3.5" />
                            <span>{isSaving ? 'Saving...' : hasChanges ? 'Save Settings' : 'Saved'}</span>
                        </Button>

                        <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 gap-1.5 py-1">
                            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Meta API {settings.graph_version}</span>
                        </Badge>

                        <Button size="sm" variant="outline" asChild className="h-8 text-xs gap-1.5 border-border/80 hover:bg-muted">
                            <a
                                href={`https://developers.facebook.com/apps/${appId || settings.app_id}/whatsapp-business/wa-dev-console/`}
                                target="_blank"
                                rel="noreferrer"
                            >
                                <span>Meta Console</span>
                                <ExternalLink className="size-3 text-muted-foreground" />
                            </a>
                        </Button>
                    </div>
                </div>

                {saveSuccessNotice && (
                    <div className="flex items-center gap-2 p-3 text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-lg animate-in fade-in">
                        <Check className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        <span className="font-medium">
                            Settings and Meta Meta App Secret saved successfully! All connected channels have been synced with Meta Graph API.
                        </span>
                    </div>
                )}

                {/* 2-Column Responsive Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
                    {/* Left Column: Meta Cloud API & Webhook (7 Columns) */}
                    <div className="lg:col-span-7 space-y-3.5">
                        {/* Meta Developer App Configuration */}
                        <Card className="border-border/70 shadow-2xs">
                            <CardHeader className="p-4 pb-2">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                                        <Key className="size-4 text-emerald-600 dark:text-emerald-400" />
                                        <span>Official Meta Cloud API App</span>
                                    </CardTitle>
                                    <Badge variant="outline" className="text-[10px] bg-muted font-mono">
                                        Embedded Signup
                                    </Badge>
                                </div>
                                <CardDescription className="text-xs">
                                    Meta for Developers App credentials used by the 1-Click Embedded Signup wizard for all clients.
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="p-4 pt-1 space-y-3">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {/* App ID */}
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-xs font-semibold text-foreground">Meta App ID (Client ID)</Label>
                                            {copiedField === 'appid' && (
                                                <span className="text-[10px] text-emerald-600 font-medium">Copied!</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Input
                                                value={appId}
                                                onChange={(e) => setAppId(e.target.value)}
                                                className="font-mono text-xs bg-background h-8 border-border/80"
                                                placeholder="Meta App ID"
                                            />
                                            <Button
                                                size="icon"
                                                variant="outline"
                                                className="size-8 shrink-0 hover:bg-muted"
                                                title="Copy App ID"
                                                onClick={() => copyToClipboard(appId, 'appid')}
                                            >
                                                {copiedField === 'appid' ? (
                                                    <Check className="size-3.5 text-emerald-600" />
                                                ) : (
                                                    <Copy className="size-3.5 text-muted-foreground" />
                                                )}
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Config ID */}
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-xs font-semibold text-foreground">Embedded Signup Config ID</Label>
                                            {copiedField === 'configid' && (
                                                <span className="text-[10px] text-emerald-600 font-medium">Copied!</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Input
                                                value={configId}
                                                onChange={(e) => setConfigId(e.target.value)}
                                                className="font-mono text-xs bg-background h-8 border-border/80"
                                                placeholder="Config ID"
                                            />
                                            <Button
                                                size="icon"
                                                variant="outline"
                                                className="size-8 shrink-0 hover:bg-muted"
                                                title="Copy Config ID"
                                                onClick={() => copyToClipboard(configId, 'configid')}
                                            >
                                                {copiedField === 'configid' ? (
                                                    <Check className="size-3.5 text-emerald-600" />
                                                ) : (
                                                    <Copy className="size-3.5 text-muted-foreground" />
                                                )}
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Meta App Secret */}
                                    <div className="space-y-1 sm:col-span-2">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                                <span>Meta App Secret (System User Token)</span>
                                                <span className="text-[10px] text-muted-foreground font-normal">(Used for dynamic auto-fetching phone numbers &amp; templates)</span>
                                            </Label>
                                            {copiedField === 'permtoken' && (
                                                <span className="text-[10px] text-emerald-600 font-medium">Copied!</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <div className="relative flex-1">
                                                <Input
                                                    type={showPermanentToken ? 'text' : 'password'}
                                                    value={appSecret}
                                                    onChange={(e) => setAppSecret(e.target.value)}
                                                    placeholder="EAAG... (Paste System User Token from Meta Business Settings)"
                                                    className="font-mono text-xs pr-8 h-8 border-border/80 focus-visible:ring-primary/20"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPermanentToken(!showPermanentToken)}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                                                    title={showPermanentToken ? 'Hide token' : 'Show token'}
                                                >
                                                    {showPermanentToken ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                                                </button>
                                            </div>
                                            <Button
                                                size="icon"
                                                variant="outline"
                                                className="size-8 shrink-0 hover:bg-muted"
                                                title="Copy App Secret"
                                                onClick={() => copyToClipboard(permanentToken, 'permtoken')}
                                            >
                                                {copiedField === 'permtoken' ? (
                                                    <Check className="size-3.5 text-emerald-600" />
                                                ) : (
                                                    <Copy className="size-3.5 text-muted-foreground" />
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Webhook Settings */}
                        <Card className="border-border/70 shadow-2xs">
                            <CardHeader className="p-4 pb-2">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                                        <Globe className="size-4 text-blue-600 dark:text-blue-400" />
                                        <span>Global Webhook Callback &amp; Verification</span>
                                    </CardTitle>
                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                        <Radio className="size-2.5 animate-pulse" />
                                        Listening
                                    </span>
                                </div>
                                <CardDescription className="text-xs">
                                    Configure these exact webhook values in Meta Developer Console &gt; WhatsApp &gt; Configuration.
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="p-4 pt-1 space-y-3">
                                {/* Callback URL */}
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs font-semibold text-foreground">Webhook Callback URL</Label>
                                        {copiedField === 'whurl' && (
                                            <span className="text-[10px] text-emerald-600 font-medium">Copied!</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Input
                                            readOnly
                                            value={settings.webhook_url}
                                            className="font-mono text-xs bg-muted/40 h-8 border-border/80"
                                        />
                                        <Button
                                            size="icon"
                                            variant="outline"
                                            className="size-8 shrink-0 hover:bg-muted"
                                            title="Copy Webhook URL"
                                            onClick={() => copyToClipboard(settings.webhook_url, 'whurl')}
                                        >
                                            {copiedField === 'whurl' ? (
                                                <Check className="size-3.5 text-emerald-600" />
                                            ) : (
                                                <Copy className="size-3.5 text-muted-foreground" />
                                            )}
                                        </Button>
                                    </div>
                                </div>

                                {/* Verify Token */}
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs font-semibold text-foreground">Webhook Verify Token</Label>
                                        {copiedField === 'token' && (
                                            <span className="text-[10px] text-emerald-600 font-medium">Copied!</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="relative flex-1">
                                            <Input
                                                type={showVerifyToken ? 'text' : 'password'}
                                                value={verifyToken}
                                                onChange={(e) => setVerifyToken(e.target.value)}
                                                className="font-mono text-xs bg-background h-8 pr-8 border-border/80"
                                                placeholder="Webhook verify token"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowVerifyToken(!showVerifyToken)}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                                                tabIndex={-1}
                                            >
                                                {showVerifyToken ? (
                                                    <EyeOff className="size-3.5" />
                                                ) : (
                                                    <Eye className="size-3.5" />
                                                )}
                                            </button>
                                        </div>
                                        <Button
                                            size="icon"
                                            variant="outline"
                                            className="size-8 shrink-0 hover:bg-muted"
                                            title="Copy Verify Token"
                                            onClick={() => copyToClipboard(verifyToken, 'token')}
                                        >
                                            {copiedField === 'token' ? (
                                                <Check className="size-3.5 text-emerald-600" />
                                            ) : (
                                                <Copy className="size-3.5 text-muted-foreground" />
                                            )}
                                        </Button>
                                    </div>
                                </div>

                                {/* Subscribed Events */}
                                <div className="pt-1 border-t border-border/60">
                                    <div className="text-[11px] font-semibold text-muted-foreground mb-1.5">
                                        Required Webhook Field Subscriptions:
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {['messages', 'message_template_status_update', 'phone_number_name_update', 'account_update'].map((f) => (
                                            <span
                                                key={f}
                                                className="inline-flex items-center gap-1 text-[10px] font-mono bg-muted px-2 py-0.5 rounded-md border border-border/70 text-foreground"
                                            >
                                                <Check className="size-2.5 text-emerald-600 shrink-0" />
                                                <span>{f}</span>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Subscription & Messaging Economics Configuration */}
                        <Card className="border-border/70 shadow-2xs">
                            <CardHeader className="p-4 pb-2">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                                        <Sparkles className="size-4 text-emerald-600 dark:text-emerald-400" />
                                        <span>Subscription &amp; Messaging Economics</span>
                                    </CardTitle>
                                    <Badge variant="outline" className="text-[10px] uppercase font-bold text-emerald-600 border-emerald-500/30">
                                        Dynamic Rules
                                    </Badge>
                                </div>
                                <CardDescription className="text-xs">
                                    Configure annual subscription pricing, bonuses, campaign limits, and Meta message rates without modifying code.
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="p-4 pt-1 space-y-3">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-xs font-semibold text-foreground">Annual Subscription (₹)</Label>
                                        <Input
                                            type="number"
                                            min={0}
                                            value={annualPrice}
                                            onChange={(e) => setAnnualPrice(parseFloat(e.target.value) || 0)}
                                            className="h-8 text-xs font-semibold"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs font-semibold text-foreground">Validity (Days)</Label>
                                        <Input
                                            type="number"
                                            min={1}
                                            value={validityDays}
                                            onChange={(e) => setValidityDays(parseInt(e.target.value) || 365)}
                                            className="h-8 text-xs"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs font-semibold text-foreground">Welcome Bonus Credit (₹)</Label>
                                        <Input
                                            type="number"
                                            min={0}
                                            value={welcomeBonus}
                                            onChange={(e) => setWelcomeBonus(parseFloat(e.target.value) || 0)}
                                            className="h-8 text-xs"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs font-semibold text-foreground">Referral Reward Credit (₹)</Label>
                                        <Input
                                            type="number"
                                            min={0}
                                            value={referralReward}
                                            onChange={(e) => setReferralReward(parseFloat(e.target.value) || 0)}
                                            className="h-8 text-xs"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs font-semibold text-foreground">Max Contacts / Campaign</Label>
                                        <Input
                                            type="number"
                                            min={10}
                                            value={campaignMaxContacts}
                                            onChange={(e) => setCampaignMaxContacts(parseInt(e.target.value) || 2000)}
                                            className="h-8 text-xs"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs font-semibold text-foreground">Min Message Purchase</Label>
                                        <Input
                                            type="number"
                                            min={1}
                                            value={minMessages}
                                            onChange={(e) => setMinMessages(parseInt(e.target.value) || 500)}
                                            className="h-8 text-xs"
                                        />
                                    </div>
                                </div>

                                <div className="pt-2 border-t border-border/60">
                                    <div className="text-[11px] font-semibold text-muted-foreground mb-2">
                                        Meta Message Pricing Matrix (₹ per message):
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="space-y-1">
                                            <Label className="text-[10px] text-muted-foreground uppercase font-semibold">Marketing</Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={rateMarketing}
                                                onChange={(e) => setRateMarketing(parseFloat(e.target.value) || 0)}
                                                className="h-8 text-xs"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[10px] text-muted-foreground uppercase font-semibold">Utility</Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={rateUtility}
                                                onChange={(e) => setRateUtility(parseFloat(e.target.value) || 0)}
                                                className="h-8 text-xs"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[10px] text-muted-foreground uppercase font-semibold">Authentication</Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={rateAuth}
                                                onChange={(e) => setRateAuth(parseFloat(e.target.value) || 0)}
                                                className="h-8 text-xs"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Server Environment & System Status (5 Columns) */}
                    <div className="lg:col-span-5 space-y-3.5">
                        {/* Server & Environment Info */}
                        <Card className="border-border/70 shadow-2xs">
                            <CardHeader className="p-4 pb-2">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                                        <Server className="size-4 text-purple-600 dark:text-purple-400" />
                                        <span>System &amp; Server Environment</span>
                                    </CardTitle>
                                    <Badge
                                        variant="outline"
                                        className={`text-[10px] font-semibold uppercase ${
                                            settings.environment === 'production'
                                                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                                : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                        }`}
                                    >
                                        {settings.environment}
                                    </Badge>
                                </div>
                            </CardHeader>

                            <CardContent className="p-4 pt-1 space-y-2.5">
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="p-2.5 rounded-lg border border-border/70 bg-muted/30">
                                        <div className="flex items-center gap-1.5 text-muted-foreground">
                                            <Cpu className="size-3 text-indigo-500" />
                                            <span className="text-[10px] uppercase font-bold tracking-wider">PHP Version</span>
                                        </div>
                                        <div className="text-xs font-bold font-mono text-foreground mt-1">
                                            {settings.php_version}
                                        </div>
                                    </div>

                                    <div className="p-2.5 rounded-lg border border-border/70 bg-muted/30">
                                        <div className="flex items-center gap-1.5 text-muted-foreground">
                                            <Layers className="size-3 text-rose-500" />
                                            <span className="text-[10px] uppercase font-bold tracking-wider">Laravel</span>
                                        </div>
                                        <div className="text-xs font-bold font-mono text-foreground mt-1">
                                            v{settings.laravel_version}
                                        </div>
                                    </div>

                                    <div className="p-2.5 rounded-lg border border-border/70 bg-muted/30">
                                        <div className="flex items-center gap-1.5 text-muted-foreground">
                                            <Building2 className="size-3 text-emerald-500" />
                                            <span className="text-[10px] uppercase font-bold tracking-wider">Multi-Tenancy</span>
                                        </div>
                                        <div className="text-xs font-bold text-foreground mt-1 truncate">
                                            TenantContext
                                        </div>
                                    </div>

                                    <div className="p-2.5 rounded-lg border border-border/70 bg-muted/30">
                                        <div className="flex items-center gap-1.5 text-muted-foreground">
                                            <ShieldCheck className="size-3 text-blue-500" />
                                            <span className="text-[10px] uppercase font-bold tracking-wider">Security</span>
                                        </div>
                                        <div className="text-xs font-bold text-foreground mt-1 truncate">
                                            Super Admin Protected
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Integration Readiness Checklist */}
                        <Card className="border-border/70 shadow-2xs">
                            <CardHeader className="p-4 pb-2">
                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                    <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                                    <span>Platform Readiness Checklist</span>
                                </CardTitle>
                            </CardHeader>

                            <CardContent className="p-4 pt-1 space-y-2">
                                {[
                                    { title: 'Embedded Signup Wizard', desc: '1-click client WhatsApp onboarding active' },
                                    { title: 'Meta Cloud API v22.0', desc: 'Official Graph API endpoint connected' },
                                    { title: 'Multi-Tenant Quota System', desc: 'Channel limits enforced per client workspace' },
                                    { title: 'Real-time Webhook Ingestion', desc: 'Incoming messages and delivery receipts synced' },
                                ].map((item, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-start gap-2 p-2 rounded-md bg-muted/30 border border-border/60"
                                    >
                                        <div className="size-4 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                                            <Check className="size-2.5" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-xs font-semibold text-foreground leading-tight">
                                                {item.title}
                                            </div>
                                            <div className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                                                {item.desc}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}
