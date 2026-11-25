import { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import {
    HelpCircle,
    Search,
    BookOpen,
    Zap,
    Send,
    Radio,
    ShoppingBag,
    Users,
    CreditCard,
    Megaphone,
    CheckCircle2,
    ArrowRight,
    ExternalLink,
    ChevronDown,
    ChevronUp,
    PhoneCall,
    Mail,
    FileText,
    ShieldCheck,
    Layers,
    Clock,
    Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

interface DocItem {
    id: string;
    category: string;
    title: string;
    badge?: string;
    content: string;
    steps?: string[];
    link?: { label: string; url: string };
}

const DOCS_DATA: DocItem[] = [
    // 1. Getting Started
    {
        id: 'connect-number',
        category: 'Getting Started',
        title: 'How to Connect Your WhatsApp Number via Meta Embedded Signup',
        badge: 'Core Setup',
        content:
            'Our platform uses official Meta WhatsApp Cloud API. You do not need any third-party gateway or unofficial QR scan that risks number ban.',
        steps: [
            'Go to Channels in the left sidebar and click "Connect New Number".',
            'Click the green "Login with Facebook" button to open Meta Embedded Signup popup.',
            'Log in with your Facebook business admin account and choose or create a Meta Business Portfolio.',
            'Choose or create a WhatsApp Business Profile (Set your Business Name, Category, and Description).',
            'Enter your phone number (can be landline or mobile) and verify it via SMS or Phone Call OTP.',
            'Once OTP is verified, click Finish. The popup will automatically close and add your channel to the platform!',
        ],
        link: { label: 'Go to WhatsApp Channels', url: '/whatsapp/connect' },
    },
    {
        id: 'wallet-recharge',
        category: 'Getting Started',
        title: 'How Messaging Wallet & Meta Rates Work',
        badge: 'Pricing & Billing',
        content:
            'Messaging on WhatsApp Cloud API uses pay-as-you-go wallet deduction based on transparent official Meta conversation rates with ZERO hidden markup.',
        steps: [
            'Go to Wallet in the sidebar.',
            'Click "Recharge wallet" and choose a message category and quantity. The configured minimum purchase is shown in the dialog.',
            'Complete instant recharge via Razorpay / UPI / Card / NetBanking.',
            'Utility messages (OTPs, order tracking, alerts) cost ~₹0.14 per message.',
            'Marketing messages (promotions, offers, product launches) cost ~₹0.88 per message.',
            'Inbound customer customer-care conversations initiated by users have a 24-hour service window.',
            'Click-to-WhatsApp Ads (CTWA) provide an official 72-hour FREE messaging window!',
        ],
        link: { label: 'View Wallet', url: '/wallet' },
    },

    // 2. Broadcasts & Campaigns
    {
        id: 'create-broadcast',
        category: 'Broadcasts & Templates',
        title: 'How to Create and Dispatch a WhatsApp Broadcast Campaign',
        badge: 'Campaigns',
        content:
            'Send broadcast announcements to thousands of opted-in customers simultaneously using official Meta-approved templates with 98% open rates.',
        steps: [
            'First, create or select an approved template under "Templates" in the sidebar.',
            'Ensure the template is approved by Meta (typically takes 1-5 minutes).',
            'Navigate to "Broadcasts & Campaigns" and click "New Campaign".',
            'Select your sender WhatsApp number and approved template.',
            'Choose your audience: select CRM contacts, pick a segment, or paste phone numbers directly.',
            'Review estimated campaign cost and wallet balance.',
            'Click "Dispatch Campaign". The queue processes messages instantly with real-time delivery status!',
        ],
        link: { label: 'Go to Broadcasts', url: '/campaigns' },
    },
    {
        id: 'campaign-analytics',
        category: 'Broadcasts & Templates',
        title: 'Understanding Campaign Delivery Analytics (Delivered, Read, Replied)',
        badge: 'Analytics',
        content:
            'Every dispatched campaign tracks message states directly via Meta Webhooks so you know exactly who received and opened your message.',
        steps: [
            'Total Selected: Total audience count included in the broadcast.',
            'Delivered: Number of messages confirmed received on recipient phones.',
            'Read (Seen): Recipients who opened and viewed the WhatsApp message (blue ticks).',
            'Customer Replies: Number of recipients who sent a response back to your WhatsApp.',
            'Failed / Undelivered: Messages that failed (e.g. invalid phone number, phone switched off).',
            'Click the "Analytics" button on any campaign row in Recent Broadcast Activity to open full visual charts!',
        ],
        link: { label: 'View Campaigns History', url: '/campaigns' },
    },

    // 3. Bot Flows & Automation
    {
        id: 'bot-flows-how',
        category: 'Automation & Bots',
        title: 'How WhatsApp Bot Flows Work (Interactive Menus & 24/7 Auto-Reply)',
        badge: 'Automation',
        content:
            'Bot Flows turn your WhatsApp into an interactive 24/7 automated assistant that greets customers, answers FAQs, and routes inquiries to human agents.',
        steps: [
            'Trigger Keyword: When a customer types words like "hi", "hello", "menu", or "price", the flow triggers.',
            'Welcome Greeting: The bot instantly sends your customized menu (e.g. 1. Services, 2. Pricing, 3. Talk to Support).',
            'Interactive Options: Customer replies with a number (1, 2, or 3) to navigate your menu.',
            'Branching Actions: Each option can provide an instant answer, ask a follow-up question (e.g. "What is your project requirement?"), or handoff to a human agent.',
            'Human Handoff: When selected, the bot pauses and notifies your team in the Shared Team Inbox!',
        ],
        link: { label: 'Configure Bot Flows', url: '/flows' },
    },
    {
        id: 'ai-agent-byok',
        category: 'Automation & Bots',
        title: 'AI Agent BYOK (Bring Your Own Key) Setup',
        badge: 'AI Chatbot',
        content:
            'Connect OpenAI GPT-4o or Anthropic Claude 3.5 Sonnet to your WhatsApp without any token markup using your own API key.',
        steps: [
            'Go to Automation > AI Agent in the sidebar.',
            'Select your AI Provider: OpenAI GPT or Anthropic Claude.',
            'Paste your secret API key (starts with sk-proj-... for OpenAI or sk-ant-... for Anthropic).',
            'Upload your business documents (PDF, DOCX, TXT) to the Knowledge Base.',
            'Configure your System Instructions and Business Personality.',
            'Click Save! Your AI agent now reads your documents and accurately answers customer queries 24/7.',
        ],
        link: { label: 'Setup AI Agent', url: '/ai-agent' },
    },

    // 4. Click-to-WhatsApp Ads
    {
        id: 'ctwa-ads',
        category: 'Ads & Growth',
        title: 'Running Click-to-WhatsApp Ads (CTWA) on Facebook & Instagram',
        badge: 'Meta Ads',
        content:
            'Generate high-intent leads by running Facebook & Instagram Ads that open directly into WhatsApp with a pre-filled prompt and zero Meta message charges for 72 hours.',
        steps: [
            'Open "WhatsApp Ads (CTWA)" from the sidebar.',
            'Select your sender WhatsApp number and type a pre-filled customer message (e.g. "Hi, I saw your ad on Instagram!").',
            'Add campaign attribution tags (e.g. meta_summer_launch, instagram_reels).',
            'Copy the generated official Deep Link or download the QR Code.',
            'In Meta Ads Manager, set Campaign Objective to "Leads" or "Engagement".',
            'Under Ad Set > Conversion > select "Messaging Apps" and check WhatsApp.',
            'Paste the pre-filled opening text in Message Template.',
            'Publish! When leads tap your ad, they open WhatsApp and your Bot Flow greets them instantly.',
        ],
        link: { label: 'Open WhatsApp Ads Generator', url: '/campaigns/ads' },
    },

    // 5. Commerce & Catalog
    {
        id: 'catalog-share',
        category: 'Commerce & Sales',
        title: 'Managing Products & Sharing Full WhatsApp Business Catalog',
        badge: 'Commerce',
        content:
            'Showcase products, pricing, and high-resolution images. Share your entire storefront link directly with buyers.',
        steps: [
            'Go to Commerce in the sidebar.',
            'Select which WhatsApp channel to manage if you have multiple numbers.',
            'Click "Add Product" to create items with title, price, SKU, and image URL.',
            'Click the green "Share Full Catalog" button to get your direct WhatsApp catalog link (https://wa.me/c/{phone}).',
            'Customers can browse products, add items to cart, and send order inquiries directly in chat!',
        ],
        link: { label: 'Go to Commerce', url: '/commerce' },
    },

    // 6. CRM & Team Inbox
    {
        id: 'crm-pipeline',
        category: 'CRM & Inbox',
        title: 'Shared Team Inbox, Chat Stages & Lead Pipeline Kanban',
        badge: 'Team Collaboration',
        content:
            'Collaborate with your team from a single unified WhatsApp inbox without sharing physical phones.',
        steps: [
            'All inbound WhatsApp conversations sync to the Shared Inbox in real-time.',
            'Assign conversations to specific team members or departments.',
            'Update Chat Stages (e.g. New Lead, In Progress, Proposal Sent, Won, Closed).',
            'Track high-value prospects visually on the drag-and-drop Lead Pipeline Kanban board.',
            'Filter contacts by custom tags and segments for targeted broadcast campaigns.',
        ],
        link: { label: 'Go to Shared Inbox', url: '/inbox' },
    },

    // 7. Reseller & Partner Program
    {
        id: 'partner-portal',
        category: 'B2B & Resellers',
        title: 'B2B Partner & Reseller Portal (Earn ₹500 + Commissions)',
        badge: 'Partnership',
        content:
            'Monetize your network by onboarding businesses onto WhatsApp SaaS. Share your unique username-based referral code.',
        steps: [
            'Your unique referral code is auto-generated based on your username (e.g. BHAVES1234).',
            'Share your referral link with clients, agencies, and business owners.',
            'When a referred customer signs up and activates their annual subscription, you automatically receive ₹500 reward in your wallet!',
            'B2B partners get dedicated portal access to view client status, wallet commissions, and revenue analytics.',
        ],
        link: { label: 'View Partner Portal', url: '/agent/dashboard' },
    },
];

export default function HelpDocsPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [expandedDocId, setExpandedDocId] = useState<string>(DOCS_DATA[0].id);

    const categories = ['All', 'Getting Started', 'Broadcasts & Templates', 'Automation & Bots', 'Ads & Growth', 'Commerce & Sales', 'CRM & Inbox', 'B2B & Resellers'];

    const filteredDocs = DOCS_DATA.filter((doc) => {
        const matchesCategory = selectedCategory === 'All' || doc.category === selectedCategory;
        if (!matchesCategory) return false;

        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            doc.title.toLowerCase().includes(q) ||
            doc.content.toLowerCase().includes(q) ||
            doc.category.toLowerCase().includes(q) ||
            (doc.steps && doc.steps.some((s) => s.toLowerCase().includes(q)))
        );
    });

    const toggleExpand = (id: string) => {
        setExpandedDocId(expandedDocId === id ? '' : id);
    };

    return (
        <>
            <Head title="Help & Documentation - Sathwara InfoTech" />

            <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6 min-w-0 max-w-[1400px] mx-auto w-full">
                {/* Compact Action Toolbar */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/60 pb-3.5">
                    <div className="flex items-center gap-2.5 flex-wrap">
                        <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
                            Docs &amp; Guides
                        </Badge>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                            Everything you need to know about setting up WhatsApp Cloud API, broadcasts, 24/7 bot flows, and ads.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="text-xs h-9 gap-1.5 border-border"
                        >
                            <a href="https://wa.me/919898696798?text=Hello%20Support,%20I%20need%20help%20with%20WhatsApp%20SaaS" target="_blank" rel="noreferrer">
                                <PhoneCall className="size-3.5 text-emerald-600" />
                                WhatsApp Live Support
                            </a>
                        </Button>
                    </div>
                </div>

                {/* Search & Category Filter */}
                <div className="space-y-3">
                    <div className="relative">
                        <Search className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search help articles, guides, or questions (e.g. connect number, bot flows, ads, wallet, templates)..."
                            className="pl-10 h-10 text-xs sm:text-sm bg-card shadow-2xs"
                        />
                    </div>

                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                                    selectedCategory === cat
                                        ? 'bg-primary text-primary-foreground shadow-xs'
                                        : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 3 Quick Help Shortcuts */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-xl border border-border bg-card space-y-1.5 shadow-2xs">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Quick Setup</span>
                            <Radio className="size-4 text-emerald-600" />
                        </div>
                        <h4 className="text-xs font-bold text-foreground">Connect WhatsApp</h4>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                            Connect your official Meta WhatsApp Business phone number in under 2 minutes.
                        </p>
                        <Link href="/whatsapp/connect" className="text-[11px] text-primary font-semibold hover:underline block pt-1">
                            Connect Channel &rarr;
                        </Link>
                    </div>

                    <div className="p-3.5 rounded-xl border border-border bg-card space-y-1.5 shadow-2xs">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Messaging</span>
                            <Send className="size-4 text-blue-600" />
                        </div>
                        <h4 className="text-xs font-bold text-foreground">Broadcast to 10k+</h4>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                            Send announcements &amp; promotions with live delivery, read &amp; reply tracking.
                        </p>
                        <Link href="/campaigns" className="text-[11px] text-primary font-semibold hover:underline block pt-1">
                            Open Campaigns &rarr;
                        </Link>
                    </div>

                    <div className="p-3.5 rounded-xl border border-border bg-card space-y-1.5 shadow-2xs">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Automation</span>
                            <Zap className="size-4 text-amber-500" />
                        </div>
                        <h4 className="text-xs font-bold text-foreground">24/7 Bot Flows</h4>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                            Create interactive menu bots that answer FAQs and capture leads automatically.
                        </p>
                        <Link href="/flows" className="text-[11px] text-primary font-semibold hover:underline block pt-1">
                            Build Bot Flow &rarr;
                        </Link>
                    </div>
                </div>

                {/* Articles List / Accordion */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            {filteredDocs.length} Guide{filteredDocs.length === 1 ? '' : 's'} Found
                        </span>
                        {selectedCategory !== 'All' && (
                            <button
                                type="button"
                                onClick={() => setSelectedCategory('All')}
                                className="text-xs text-primary hover:underline"
                            >
                                Reset Filter
                            </button>
                        )}
                    </div>

                    {filteredDocs.length === 0 ? (
                        <Card className="border-dashed p-8 text-center space-y-2">
                            <HelpCircle className="size-8 mx-auto text-muted-foreground" />
                            <h4 className="text-sm font-semibold">No Articles Found</h4>
                            <p className="text-xs text-muted-foreground">
                                Try searching for another keyword or browse all categories.
                            </p>
                        </Card>
                    ) : (
                        <div className="space-y-2.5">
                            {filteredDocs.map((doc) => {
                                const isExpanded = expandedDocId === doc.id;
                                return (
                                    <Card
                                        key={doc.id}
                                        className={`border transition-all shadow-2xs ${
                                            isExpanded
                                                ? 'border-primary/50 ring-1 ring-primary/20 bg-card'
                                                : 'border-border hover:border-border/80'
                                        }`}
                                    >
                                        <CardHeader
                                            onClick={() => toggleExpand(doc.id)}
                                            className="p-4 cursor-pointer select-none"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <Badge variant="outline" className="text-[10px] py-0">
                                                            {doc.category}
                                                        </Badge>
                                                        {doc.badge && (
                                                            <span className="rounded bg-primary/10 px-1.5 py-0.2 text-[10px] font-bold text-primary">
                                                                {doc.badge}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <CardTitle className="text-sm sm:text-base font-bold text-foreground">
                                                        {doc.title}
                                                    </CardTitle>
                                                </div>

                                                <div className="p-1 rounded text-muted-foreground hover:text-foreground shrink-0 mt-1">
                                                    {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                                                </div>
                                            </div>
                                        </CardHeader>

                                        {isExpanded && (
                                            <CardContent className="px-4 pb-4 pt-0 space-y-3.5 text-xs text-muted-foreground border-t border-border/60 mt-2 pt-3">
                                                <p className="leading-relaxed text-foreground/90">
                                                    {doc.content}
                                                </p>

                                                {doc.steps && (
                                                    <div className="space-y-2 bg-muted/40 p-3 rounded-xl border border-border/60">
                                                        <span className="font-bold text-foreground text-xs block">
                                                            Step-by-step instructions:
                                                        </span>
                                                        <ol className="space-y-2 text-[11px] list-none pl-0">
                                                            {doc.steps.map((st, idx) => (
                                                                <li key={idx} className="flex items-start gap-2">
                                                                    <span className="size-4 rounded-full bg-primary/15 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                                                                        {idx + 1}
                                                                    </span>
                                                                    <span className="leading-relaxed">{st}</span>
                                                                </li>
                                                            ))}
                                                        </ol>
                                                    </div>
                                                )}

                                                {doc.link && (
                                                    <div className="pt-1 flex items-center justify-end">
                                                        <Button
                                                            size="sm"
                                                            asChild
                                                            className="h-7 text-xs font-semibold gap-1 bg-primary text-primary-foreground hover:bg-primary/90"
                                                        >
                                                            <Link href={doc.link.url}>
                                                                {doc.link.label} &rarr;
                                                            </Link>
                                                        </Button>
                                                    </div>
                                                )}
                                            </CardContent>
                                        )}
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Support Card */}
                <div className="p-4 sm:p-5 rounded-xl border border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
                    <div className="space-y-1">
                        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                            <Sparkles className="size-4 text-emerald-600" />
                            Need Dedicated Technical Support or Setup Assistance?
                        </h3>
                        <p className="text-xs text-muted-foreground max-w-2xl">
                            Our engineering team at Sathwara InfoTech is available to assist you with Meta Business verification, green tick application, or custom CRM integrations.
                        </p>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                        <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="text-xs h-8.5 gap-1.5 border-border"
                        >
                            <a href="mailto:support@sathwarainfotech.com">
                                <Mail className="size-3.5 text-blue-600" />
                                Email Support
                            </a>
                        </Button>
                        <Button
                            size="sm"
                            asChild
                            className="bg-[#47b672] hover:bg-[#3ca062] text-white text-xs h-8.5 gap-1.5 font-semibold"
                        >
                            <a href="https://wa.me/919898696798" target="_blank" rel="noreferrer">
                                <PhoneCall className="size-3.5" />
                                Direct WhatsApp
                            </a>
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
}
