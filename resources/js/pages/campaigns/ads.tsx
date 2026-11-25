import { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import {
    Megaphone,
    Sparkles,
    Copy,
    Check,
    ExternalLink,
    QrCode,
    MessageSquare,
    ArrowRight,
    ArrowLeft,
    Share2,
    ShieldCheck,
    Zap,
    Layers,
    Target,
    HelpCircle,
    Info,
    Smartphone,
    Globe,
    CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Channel {
    id: string;
    name: string;
    phoneNumber?: string;
    cleanPhone: string;
    isDefault: boolean;
}

interface Flow {
    id: string;
    name: string;
    trigger_keywords: string;
}

interface Props {
    channels: Channel[];
    flows: Flow[];
}

export default function ClickToWhatsAppAds({ channels = [], flows = [] }: Props) {
    const defaultChannel = channels.find((c) => c.isDefault) || channels[0] || null;

    const [selectedChannelId, setSelectedChannelId] = useState<string>(defaultChannel?.id || '');
    const [adHeadline, setAdHeadline] = useState('New Client Inquiry');
    const [campaignName, setCampaignName] = useState('meta_summer_launch');
    const [campaignSource, setCampaignSource] = useState('instagram_ad');
    const [prefilledMessage, setPrefilledMessage] = useState(
        'Hi Sathwara InfoTech! I saw your Ad on Instagram for WhatsApp Automation and Web Solutions. I would like to get pricing and a live demo.'
    );
    const [selectedFlowId, setSelectedFlowId] = useState<string>(flows[0]?.id || '');
    const [copiedLink, setCopiedLink] = useState(false);
    const [showQrModal, setShowQrModal] = useState(false);

    const activeChannel = channels.find((c) => c.id === selectedChannelId) || defaultChannel;
    const cleanPhone = activeChannel?.cleanPhone || '';

    // Generate Meta Deep Link
    const fullMessage = `${prefilledMessage}\n\n[Ref: ${campaignSource}_${campaignName}]`;
    const deepLink = cleanPhone
        ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(fullMessage)}`
        : '';

    const qrCodeUrl = deepLink
        ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(deepLink)}`
        : '';

    const handleCopyLink = () => {
        if (!deepLink) return;
        navigator.clipboard.writeText(deepLink);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
    };

    return (
        <>
            <Head title="Click-to-WhatsApp Ads (CTWA) - Sathwara InfoTech" />

            <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6 min-w-0 max-w-[1400px] mx-auto w-full">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1.5">
                            <Button variant="ghost" size="sm" asChild className="h-7 text-xs text-muted-foreground p-0 hover:text-foreground">
                                <Link href="/campaigns">
                                    <ArrowLeft className="size-3.5 mr-1" />
                                    Broadcasts &amp; Campaigns
                                </Link>
                            </Button>
                        </div>
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                                <Megaphone className="size-6" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                                        Click-to-WhatsApp Ads (CTWA)
                                    </h1>
                                    <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30">
                                        Meta Facebook &amp; Instagram
                                    </Badge>
                                </div>
                                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                                    Drive high-intent Facebook &amp; Instagram ad clicks directly into automated WhatsApp conversations with 24/7 Bot handoff.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="text-xs h-9 gap-1.5 border-border"
                        >
                            <a
                                href="https://adsmanager.facebook.com/adsmanager/manage/campaigns"
                                target="_blank"
                                rel="noreferrer"
                            >
                                <ExternalLink className="size-3.5" />
                                Open Meta Ads Manager
                            </a>
                        </Button>
                        <Button
                            size="sm"
                            asChild
                            className="bg-[#47b672] hover:bg-[#3ca062] text-white text-xs h-9 gap-1.5 font-semibold shadow-xs"
                        >
                            <Link href="/flows">
                                <Zap className="size-3.5" />
                                View Bot Automations
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Meta 72-Hour Free Window Highlight Banner */}
                <div className="rounded-xl border border-purple-500/25 bg-gradient-to-r from-purple-500/10 via-background to-emerald-500/10 p-4 sm:p-5 text-xs shadow-2xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-purple-600 text-white shrink-0 mt-0.5">
                                <Sparkles className="size-5" />
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-sm font-bold text-foreground">
                                        Official Meta Benefit: 72-Hour Free Messaging Window
                                    </h3>
                                    <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                                        ₹0.00 Meta Message Fee
                                    </span>
                                </div>
                                <p className="text-muted-foreground text-xs leading-relaxed max-w-3xl">
                                    When a customer starts a WhatsApp chat by clicking your Facebook or Instagram Ad, Meta provides a <strong>72-hour free service window</strong>. All outbound and inbound messages exchanged during these 3 days are 100% free of Meta conversation fees!
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="h-8 text-xs shrink-0 border-purple-500/30 text-purple-700 dark:text-purple-300 bg-background/80"
                        >
                            <Link href="/help">
                                Learn More in Docs &rarr;
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* 4-Step Architecture Flow */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-xl border border-border bg-card space-y-1.5 shadow-2xs">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Step 1</span>
                            <span className="size-5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-[11px] flex items-center justify-center">1</span>
                        </div>
                        <h4 className="text-xs font-bold text-foreground">Customer Sees Ad</h4>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                            Lead sees your sponsored post or Story on Instagram or Facebook feed.
                        </p>
                    </div>

                    <div className="p-3.5 rounded-xl border border-border bg-card space-y-1.5 shadow-2xs">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Step 2</span>
                            <span className="size-5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold text-[11px] flex items-center justify-center">2</span>
                        </div>
                        <h4 className="text-xs font-bold text-foreground">Taps WhatsApp CTA</h4>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                            One tap opens WhatsApp with your pre-configured inquiry message ready to send.
                        </p>
                    </div>

                    <div className="p-3.5 rounded-xl border border-border bg-card space-y-1.5 shadow-2xs">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Step 3</span>
                            <span className="size-5 rounded-full bg-emerald-500/10 text-[#47b672] font-bold text-[11px] flex items-center justify-center">3</span>
                        </div>
                        <h4 className="text-xs font-bold text-foreground">Bot Responds in 2s</h4>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                            Our WhatsApp Bot Flow triggers instantly, sends menu options, and collects lead details.
                        </p>
                    </div>

                    <div className="p-3.5 rounded-xl border border-border bg-card space-y-1.5 shadow-2xs">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Step 4</span>
                            <span className="size-5 rounded-full bg-amber-500/10 text-amber-600 font-bold text-[11px] flex items-center justify-center">4</span>
                        </div>
                        <h4 className="text-xs font-bold text-foreground">Sales Agent Closes</h4>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                            Lead details appear on your Lead Kanban &amp; Shared Team Inbox for 1-click human closing.
                        </p>
                    </div>
                </div>

                {/* Main 2-Column Section */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left: Deep Link & Campaign Generator */}
                    <div className="lg:col-span-7 space-y-5">
                        <Card className="border-border shadow-2xs">
                            <CardHeader className="pb-3 border-b border-border/80">
                                <CardTitle className="text-base font-bold flex items-center gap-2">
                                    <Target className="size-4 text-purple-600" />
                                    Click-to-WhatsApp Ad Deep Link Generator
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Configure the WhatsApp destination number, campaign attribution tags, and greeting message.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-4 sm:p-5 space-y-4">
                                {/* Destination WhatsApp Channel */}
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold">Destination WhatsApp Number</Label>
                                    {channels.length === 0 ? (
                                        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-700 dark:text-amber-300">
                                            No active WhatsApp number connected. Please connect a number in WhatsApp Channels first.
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {channels.map((chan) => (
                                                <div
                                                    key={chan.id}
                                                    onClick={() => setSelectedChannelId(chan.id)}
                                                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                                                        selectedChannelId === chan.id
                                                            ? 'border-purple-600 bg-purple-500/5 ring-1 ring-purple-600/30'
                                                            : 'border-border hover:bg-muted/40'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-semibold text-xs text-foreground">{chan.name}</span>
                                                        {chan.isDefault && (
                                                            <Badge variant="outline" className="text-[9px] py-0">Default</Badge>
                                                        )}
                                                    </div>
                                                    <div className="text-[11px] font-mono text-muted-foreground mt-1">
                                                        {chan.phoneNumber || chan.cleanPhone}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Campaign Attribution Tracking */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-xs font-semibold">Ad Campaign Name</Label>
                                        <Input
                                            value={campaignName}
                                            onChange={(e) => setCampaignName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                                            placeholder="e.g. meta_summer_launch"
                                            className="text-xs h-8.5 font-mono"
                                        />
                                        <p className="text-[10px] text-muted-foreground">Used to tag inbound leads in CRM</p>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs font-semibold">Ad Source / Placement</Label>
                                        <Input
                                            value={campaignSource}
                                            onChange={(e) => setCampaignSource(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                                            placeholder="e.g. instagram_story_ad"
                                            className="text-xs h-8.5 font-mono"
                                        />
                                        <p className="text-[10px] text-muted-foreground">e.g. fb_feed, instagram_reels</p>
                                    </div>
                                </div>

                                {/* Pre-filled Customer Message */}
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs font-semibold">Pre-filled Customer Opening Message</Label>
                                        <span className="text-[10px] text-muted-foreground">Automatically typed in user&apos;s WhatsApp</span>
                                    </div>
                                    <textarea
                                        rows={3}
                                        value={prefilledMessage}
                                        onChange={(e) => setPrefilledMessage(e.target.value)}
                                        className="w-full rounded-md border border-input bg-background p-2 text-xs leading-relaxed focus:outline-none"
                                        placeholder="Type the message you want pre-filled when user taps your Ad..."
                                    />
                                </div>

                                {/* Connect to Bot Flow */}
                                <div className="space-y-1.5 pt-2 border-t border-border/70">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs font-semibold flex items-center gap-1.5">
                                            <Zap className="size-3.5 text-amber-500" />
                                            Auto-Trigger Bot Flow for Ad Leads
                                        </Label>
                                        <Link href="/flows" className="text-[11px] text-primary hover:underline">
                                            Manage Flows &rarr;
                                        </Link>
                                    </div>
                                    <select
                                        value={selectedFlowId}
                                        onChange={(e) => setSelectedFlowId(e.target.value)}
                                        className="w-full h-8.5 px-3 rounded-md border border-input bg-background text-xs text-foreground focus:ring-1 focus:ring-primary"
                                    >
                                        <option value="">-- No automated flow (Transfer directly to Inbox) --</option>
                                        {flows.map((f) => (
                                            <option key={f.id} value={f.id}>
                                                {f.name} (Triggers on: {f.trigger_keywords})
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-[10px] text-muted-foreground">
                                        Tip: Ensure your Bot Flow trigger keywords contain words present in your pre-filled message (e.g. <em>inquiry, demo, automation</em>).
                                    </p>
                                </div>

                                {/* Generated Deep Link Result Box */}
                                <div className="p-3.5 rounded-xl bg-muted/50 border border-border space-y-2.5 pt-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                            <Globe className="size-3.5 text-primary" />
                                            Generated Click-to-WhatsApp Deep Link
                                        </span>
                                        <Badge variant="outline" className="text-[10px] bg-[#47b672]/10 text-[#28804c] dark:text-[#52c480] border-[#47b672]/30">
                                            Ready for Meta Ads Manager
                                        </Badge>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Input
                                            readOnly
                                            value={deepLink}
                                            className="text-xs font-mono h-8.5 bg-background select-all"
                                        />
                                        <Button
                                            type="button"
                                            size="sm"
                                            onClick={handleCopyLink}
                                            className="h-8.5 text-xs font-semibold shrink-0 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
                                        >
                                            {copiedLink ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                                            {copiedLink ? 'Copied!' : 'Copy Link'}
                                        </Button>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2 pt-1">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            asChild
                                            className="h-7 text-xs gap-1 border-border bg-card"
                                        >
                                            <a href={deepLink} target="_blank" rel="noreferrer">
                                                <Smartphone className="size-3 text-emerald-600" />
                                                Test in WhatsApp Web
                                            </a>
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setShowQrModal(!showQrModal)}
                                            className="h-7 text-xs gap-1 border-border bg-card"
                                        >
                                            <QrCode className="size-3 text-purple-600" />
                                            {showQrModal ? 'Hide QR Code' : 'Show Test QR Code'}
                                        </Button>
                                    </div>

                                    {showQrModal && qrCodeUrl && (
                                        <div className="p-4 bg-background rounded-lg border border-border text-center space-y-2 animate-in fade-in duration-200">
                                            <div className="text-xs font-semibold text-foreground">
                                                Scan with your phone to test the Ad flow:
                                            </div>
                                            <img
                                                src={qrCodeUrl}
                                                alt="Ad Test QR Code"
                                                className="size-44 mx-auto rounded-lg border border-border shadow-xs p-2 bg-white"
                                            />
                                            <p className="text-[10px] text-muted-foreground font-mono">
                                                Direct destination: +{cleanPhone}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right: Meta Ads Manager Step-by-Step Guide */}
                    <div className="lg:col-span-5 space-y-4">
                        <Card className="border-border shadow-2xs">
                            <CardHeader className="pb-3 border-b border-border/80">
                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                    <ShieldCheck className="size-4 text-emerald-600" />
                                    How to Setup in Meta Ads Manager
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Follow these 4 simple steps inside Facebook Ads Manager.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-4 space-y-3.5 text-xs">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 font-semibold text-foreground">
                                        <span className="size-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center">1</span>
                                        <span>Create a New Campaign</span>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground pl-7">
                                        Select <strong>Leads</strong> or <strong>Engagement</strong> as your Campaign Objective.
                                    </p>
                                </div>

                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 font-semibold text-foreground">
                                        <span className="size-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center">2</span>
                                        <span>Set Conversion Destination to WhatsApp</span>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground pl-7">
                                        Under Ad Set &gt; Conversion &gt; choose <strong>Messaging Apps</strong> and check <strong>WhatsApp</strong>. Select your connected WhatsApp Business page.
                                    </p>
                                </div>

                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 font-semibold text-foreground">
                                        <span className="size-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center">3</span>
                                        <span>Configure Message Template</span>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground pl-7">
                                        In the Ad Creative section, scroll to <strong>Message Template</strong>. Choose <strong>Start conversations</strong> and paste the pre-filled opening text or paste the generated deep link.
                                    </p>
                                </div>

                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 font-semibold text-foreground">
                                        <span className="size-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center">4</span>
                                        <span>Publish &amp; Track ROI</span>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground pl-7">
                                        Publish the campaign! When leads message your WhatsApp, our software tags them with your campaign name and handles them 24/7.
                                    </p>
                                </div>

                                <div className="pt-2 border-t border-border/70">
                                    <Button
                                        asChild
                                        className="w-full text-xs font-semibold h-8.5 bg-purple-600 hover:bg-purple-700 text-white gap-1.5"
                                    >
                                        <a
                                            href="https://adsmanager.facebook.com/adsmanager/manage/campaigns"
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            <ExternalLink className="size-3.5" />
                                            Launch in Facebook Ads Manager
                                        </a>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Best Practices Tips */}
                        <div className="p-4 rounded-xl border border-border bg-card space-y-2 text-xs">
                            <div className="flex items-center gap-2 font-bold text-foreground">
                                <Info className="size-4 text-blue-600" />
                                <span>CTWA Pro Tips for Maximum Conversions</span>
                            </div>
                            <ul className="space-y-1.5 text-[11px] text-muted-foreground list-disc pl-4">
                                <li>
                                    <strong>Keep the opening message short &amp; clear:</strong> Users are 4x more likely to send the message if it sounds natural.
                                </li>
                                <li>
                                    <strong>Offer an instant incentive:</strong> E.g. <em>&quot;Send this message to get our free pricing brochure &amp; 10% coupon.&quot;</em>
                                </li>
                                <li>
                                    <strong>Zero wait-time:</strong> Connect an active Bot Flow so users get an immediate interactive menu within 2 seconds.
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
