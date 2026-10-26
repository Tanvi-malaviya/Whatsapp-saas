import { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import {
    Zap,
    Plus,
    Save,
    Trash2,
    Clock,
    MessageSquare,
    Smile,
    Send,
    Check,
    Moon,
    Sparkles,
    RotateCcw,
    Edit3,
    Search,
    Bot,
    AlertCircle,
    CheckCircle2,
    Tag,
    Sliders,
    Power,
    HelpCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

export type KeywordRule = {
    id: string;
    keyword: string;
    matchType: 'contains' | 'exact' | 'starts_with';
    reply: string;
    enabled: boolean;
};

const DEFAULT_WELCOME =
    "👋 Hello {{name}}! Welcome to Sathwara InfoTech.\nHow can we assist you today?\n\n1️⃣ Web & Software Development\n2️⃣ WhatsApp API & Automation\n3️⃣ Talk to Support";

const DEFAULT_AWAY =
    "🌙 Hi! We are currently outside of business hours (Office hours: Mon-Sat, 9:30 AM - 7:00 PM IST).\n\nWe have received your message and our team will get back to you first thing in the morning! 🌅";

const DEFAULT_RULES: KeywordRule[] = [
    {
        id: '1',
        keyword: 'fees, price, cost, pricing',
        matchType: 'contains',
        reply: '💰 Our WhatsApp Bot Cloud API package starts at ₹2,999 one-time setup + ₹999/month for unlimited auto-replies and broadcasts! Would you like a live demo?',
        enabled: true,
    },
    {
        id: '2',
        keyword: 'courses, training, learn, admission',
        matchType: 'contains',
        reply: '🎓 We offer Full Stack Web Development (PHP/Laravel & React) and WhatsApp API automation training. Batches start every Monday in Ahmedabad!',
        enabled: true,
    },
    {
        id: '3',
        keyword: 'human, agent, talk, call, support',
        matchType: 'contains',
        reply: '👨‍💼 Sure! We are notifying our support specialist at Sathwara InfoTech. An agent will connect with you here shortly.',
        enabled: true,
    },
    {
        id: '4',
        keyword: 'location, address, office, visit',
        matchType: 'contains',
        reply: '📍 Our Office: Sathwara InfoTech, Ahmedabad, Gujarat.\n⏰ Working Hours: Monday to Saturday, 9:30 AM to 7:00 PM IST.',
        enabled: true,
    },
];

export default function AutoResponder() {
    // Welcome & Away States (with localStorage support)
    const [welcomeEnabled, setWelcomeEnabled] = useState<boolean>(() => {
        const saved = localStorage.getItem('ar_welcome_enabled');
        return saved !== null ? JSON.parse(saved) : true;
    });
    const [welcomeMessage, setWelcomeMessage] = useState<string>(() => {
        return localStorage.getItem('ar_welcome_msg') || DEFAULT_WELCOME;
    });

    const [awayEnabled, setAwayEnabled] = useState<boolean>(() => {
        const saved = localStorage.getItem('ar_away_enabled');
        return saved !== null ? JSON.parse(saved) : true;
    });
    const [awayMessage, setAwayMessage] = useState<string>(() => {
        return localStorage.getItem('ar_away_msg') || DEFAULT_AWAY;
    });

    // Keyword Rules
    const [rules, setRules] = useState<KeywordRule[]>(() => {
        const saved = localStorage.getItem('ar_keyword_rules');
        return saved ? JSON.parse(saved) : DEFAULT_RULES;
    });

    // UI & Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'paused'>('all');
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // Modal state for Add / Edit Rule
    const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
    const [editingRule, setEditingRule] = useState<KeywordRule | null>(null);
    const [ruleKeyword, setRuleKeyword] = useState('');
    const [ruleMatchType, setRuleMatchType] = useState<'contains' | 'exact' | 'starts_with'>('contains');
    const [ruleReply, setRuleReply] = useState('');
    const [ruleEnabled, setRuleEnabled] = useState(true);
    const [ruleError, setRuleError] = useState<string | null>(null);

    // Modal state for Delete confirmation
    const [deletingRule, setDeletingRule] = useState<KeywordRule | null>(null);

    // Simulator State
    const [simMessages, setSimMessages] = useState<
        { sender: 'user' | 'bot'; text: string; matchTag?: string }[]
    >([
        {
            sender: 'user',
            text: 'Hello, what is your price?',
        },
        {
            sender: 'bot',
            text: DEFAULT_RULES[0].reply,
            matchTag: 'Rule 1 (price)',
        },
    ]);
    const [simInput, setSimInput] = useState('');

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3000);
    };

    // Save All to localStorage
    const handleSaveAll = () => {
        localStorage.setItem('ar_welcome_enabled', JSON.stringify(welcomeEnabled));
        localStorage.setItem('ar_welcome_msg', welcomeMessage);
        localStorage.setItem('ar_away_enabled', JSON.stringify(awayEnabled));
        localStorage.setItem('ar_away_msg', awayMessage);
        localStorage.setItem('ar_keyword_rules', JSON.stringify(rules));
        showToast('Auto Responder settings saved successfully!');
    };

    // Open Add Rule Modal
    const openAddRuleModal = () => {
        setEditingRule(null);
        setRuleKeyword('');
        setRuleMatchType('contains');
        setRuleReply('');
        setRuleEnabled(true);
        setRuleError(null);
        setIsRuleModalOpen(true);
    };

    // Open Edit Rule Modal
    const openEditRuleModal = (rule: KeywordRule) => {
        setEditingRule(rule);
        setRuleKeyword(rule.keyword);
        setRuleMatchType(rule.matchType);
        setRuleReply(rule.reply);
        setRuleEnabled(rule.enabled);
        setRuleError(null);
        setIsRuleModalOpen(true);
    };

    // Save Rule from Modal
    const handleSaveRule = (e: React.FormEvent) => {
        e.preventDefault();
        if (!ruleKeyword.trim() || !ruleReply.trim()) {
            setRuleError('Please provide both trigger keywords and response message.');
            return;
        }

        if (editingRule) {
            const updated = rules.map((r) =>
                r.id === editingRule.id
                    ? {
                          ...r,
                          keyword: ruleKeyword.trim(),
                          matchType: ruleMatchType,
                          reply: ruleReply.trim(),
                          enabled: ruleEnabled,
                      }
                    : r
            );
            setRules(updated);
            localStorage.setItem('ar_keyword_rules', JSON.stringify(updated));
            showToast(`Rule updated successfully.`);
        } else {
            const newRule: KeywordRule = {
                id: Date.now().toString(),
                keyword: ruleKeyword.trim(),
                matchType: ruleMatchType,
                reply: ruleReply.trim(),
                enabled: ruleEnabled,
            };
            const updated = [newRule, ...rules];
            setRules(updated);
            localStorage.setItem('ar_keyword_rules', JSON.stringify(updated));
            showToast(`New keyword rule added.`);
        }

        setIsRuleModalOpen(false);
    };

    // Toggle rule status
    const handleToggleRule = (id: string) => {
        const updated = rules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r));
        setRules(updated);
        localStorage.setItem('ar_keyword_rules', JSON.stringify(updated));
    };

    // Confirm Delete Rule
    const handleConfirmDelete = () => {
        if (!deletingRule) return;
        const updated = rules.filter((r) => r.id !== deletingRule.id);
        setRules(updated);
        localStorage.setItem('ar_keyword_rules', JSON.stringify(updated));
        showToast('Keyword rule removed.');
        setDeletingRule(null);
    };

    // Insert variable in welcome message
    const insertVariable = (varName: string) => {
        setWelcomeMessage((prev) => `${prev} {{${varName}}}`);
    };

    // Simulator Send handler
    const handleSimSend = (customText?: string) => {
        const text = (customText ?? simInput).trim();
        if (!text) return;

        const updated = [...simMessages, { sender: 'user' as const, text }];
        setSimMessages(updated);
        setSimInput('');

        // Find match in keyword rules
        const lowerText = text.toLowerCase();
        let matchedRule: KeywordRule | undefined;

        for (const rule of rules.filter((r) => r.enabled)) {
            const keywords = rule.keyword.split(',').map((k) => k.trim().toLowerCase());
            if (rule.matchType === 'exact') {
                if (keywords.includes(lowerText)) {
                    matchedRule = rule;
                    break;
                }
            } else if (rule.matchType === 'starts_with') {
                if (keywords.some((k) => lowerText.startsWith(k))) {
                    matchedRule = rule;
                    break;
                }
            } else {
                // contains
                if (keywords.some((k) => lowerText.includes(k))) {
                    matchedRule = rule;
                    break;
                }
            }
        }

        setTimeout(() => {
            if (matchedRule) {
                setSimMessages([
                    ...updated,
                    {
                        sender: 'bot',
                        text: matchedRule.reply,
                        matchTag: `Matched: "${matchedRule.keyword.split(',')[0].trim()}"`,
                    },
                ]);
            } else if (welcomeEnabled && (lowerText === 'hi' || lowerText === 'hello' || lowerText === 'hey')) {
                setSimMessages([
                    ...updated,
                    {
                        sender: 'bot',
                        text: welcomeMessage.replace('{{name}}', 'Customer').replace('{{phone}}', '+91 98765 43210'),
                        matchTag: 'Welcome Message Trigger',
                    },
                ]);
            } else {
                setSimMessages([
                    ...updated,
                    {
                        sender: 'bot',
                        text: "🤖 Thanks for contacting Sathwara InfoTech! We couldn't find an automatic keyword match, but our team will review your message shortly.",
                        matchTag: 'Default Fallback',
                    },
                ]);
            }
        }, 350);
    };

    const handleRestartSim = () => {
        setSimMessages([
            {
                sender: 'user',
                text: 'Hi, where is your office?',
            },
            {
                sender: 'bot',
                text: rules.find((r) => r.keyword.includes('location'))?.reply || DEFAULT_RULES[3].reply,
                matchTag: 'Matched: "location"',
            },
        ]);
        setSimInput('');
    };

    // Filter rules
    const filteredRules = rules.filter((r) => {
        const matchesQuery =
            r.keyword.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.reply.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus =
            filterStatus === 'all'
                ? true
                : filterStatus === 'active'
                ? r.enabled
                : !r.enabled;
        return matchesQuery && matchesStatus;
    });

    const activeRulesCount = rules.filter((r) => r.enabled).length;

    return (
        <>
            <Head title="WhatsApp Auto Responder - Sathwara InfoTech" />

            <div className="flex flex-1 flex-col gap-4 sm:gap-5 p-4 sm:p-6 min-w-0 max-w-[1600px] mx-auto w-full">
                {/* Toast Notification */}
                {toastMessage && (
                    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-medium text-white shadow-lg animate-in fade-in slide-in-from-bottom-3 duration-200">
                        <CheckCircle2 className="size-4 shrink-0" />
                        <span>{toastMessage}</span>
                    </div>
                )}

                {/* Page Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-lg bg-[#47b672]/10 text-[#47b672]">
                                <Zap className="size-5" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-xl font-bold tracking-tight text-foreground">
                                        Auto Responder &amp; Keyword Rules
                                    </h2>
                                    <Badge
                                        variant="outline"
                                        className="text-xs bg-[#47b672]/10 text-[#28804c] dark:text-[#52c480] border-[#47b672]/30"
                                    >
                                        24/7 Automation Engine
                                    </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Set up instant welcome greetings, business hours away messages, and keyword trigger responses for your WhatsApp number.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={openAddRuleModal}
                            className="text-xs h-8 gap-1.5 border-[#47b672]/40 text-[#28804c] dark:text-[#52c480] hover:bg-[#47b672]/10"
                        >
                            <Plus className="size-3.5" />
                            Add Keyword Rule
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleSaveAll}
                            className="bg-[#47b672] hover:bg-[#3ca062] text-white text-xs h-8 gap-1.5 shadow-sm"
                        >
                            <Save className="size-3.5" />
                            Save All Settings
                        </Button>
                    </div>
                </div>

                {/* 3 Compact Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="flex items-center justify-between px-3.5 py-2.5 rounded-lg border border-border/80 bg-card shadow-2xs">
                        <div className="space-y-0.5">
                            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                                Keyword Rules
                            </span>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-base font-bold text-foreground">{rules.length}</span>
                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                                    ({activeRulesCount} active)
                                </span>
                            </div>
                        </div>
                        <div className="size-7 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                            <MessageSquare className="size-3.5" />
                        </div>
                    </div>

                    <div className="flex items-center justify-between px-3.5 py-2.5 rounded-lg border border-border/80 bg-card shadow-2xs">
                        <div className="space-y-0.5">
                            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                                Welcome Greeting
                            </span>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                                    {welcomeEnabled ? 'Enabled' : 'Paused'}
                                </span>
                                <span className="text-[10px] text-muted-foreground">First contact</span>
                            </div>
                        </div>
                        <div className="size-7 rounded-md bg-emerald-500/10 text-[#47b672] flex items-center justify-center shrink-0">
                            <Smile className="size-3.5" />
                        </div>
                    </div>

                    <div className="flex items-center justify-between px-3.5 py-2.5 rounded-lg border border-border/80 bg-card shadow-2xs">
                        <div className="space-y-0.5">
                            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                                Off-Hours / Away
                            </span>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-base font-bold text-purple-600 dark:text-purple-400">
                                    {awayEnabled ? 'Active' : 'Disabled'}
                                </span>
                                <span className="text-[10px] text-muted-foreground">7 PM - 9:30 AM</span>
                            </div>
                        </div>
                        <div className="size-7 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                            <Moon className="size-3.5" />
                        </div>
                    </div>
                </div>

                {/* 1. Welcome & Away System Messages (2 Cards) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Welcome Message Card */}
                    <Card className="border-border shadow-2xs">
                        <CardHeader className="p-4 pb-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 rounded-md bg-[#47b672]/10 text-[#47b672]">
                                        <Smile className="size-4" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-sm font-semibold">
                                            Welcome Message (First-Time Contacts)
                                        </CardTitle>
                                        <CardDescription className="text-[11px] text-muted-foreground">
                                            Automatically sent when a customer sends their first WhatsApp message.
                                        </CardDescription>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setWelcomeEnabled(!welcomeEnabled)}
                                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                                        welcomeEnabled ? 'bg-[#47b672]' : 'bg-muted'
                                    }`}
                                    title="Toggle Welcome Message"
                                >
                                    <span
                                        className={`pointer-events-none inline-block size-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                                            welcomeEnabled ? 'translate-x-4' : 'translate-x-0'
                                        }`}
                                    />
                                </button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-2 space-y-2.5">
                            <textarea
                                value={welcomeMessage}
                                onChange={(e) => setWelcomeMessage(e.target.value)}
                                rows={4}
                                placeholder="Enter greeting message..."
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs focus:outline-none leading-relaxed"
                            />
                            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border/60 text-[11px]">
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <span>Insert:</span>
                                    <button
                                        type="button"
                                        onClick={() => insertVariable('name')}
                                        className="px-1.5 py-0.5 rounded bg-muted hover:bg-muted/80 text-[10px] font-mono font-medium text-foreground transition-colors"
                                    >
                                        &#123;&#123;name&#125;&#125;
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => insertVariable('phone')}
                                        className="px-1.5 py-0.5 rounded bg-muted hover:bg-muted/80 text-[10px] font-mono font-medium text-foreground transition-colors"
                                    >
                                        &#123;&#123;phone&#125;&#125;
                                    </button>
                                </div>
                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    Trigger: First Inbound Text
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Away / Off-Hours Message Card */}
                    <Card className="border-border shadow-2xs">
                        <CardHeader className="p-4 pb-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400">
                                        <Moon className="size-4" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-sm font-semibold">
                                            Away / Off-Hours Message (Outside Business Hours)
                                        </CardTitle>
                                        <CardDescription className="text-[11px] text-muted-foreground">
                                            Sent when customers reach out outside your working hours.
                                        </CardDescription>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setAwayEnabled(!awayEnabled)}
                                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                                        awayEnabled ? 'bg-[#47b672]' : 'bg-muted'
                                    }`}
                                    title="Toggle Away Message"
                                >
                                    <span
                                        className={`pointer-events-none inline-block size-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                                            awayEnabled ? 'translate-x-4' : 'translate-x-0'
                                        }`}
                                    />
                                </button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-2 space-y-2.5">
                            <textarea
                                value={awayMessage}
                                onChange={(e) => setAwayMessage(e.target.value)}
                                rows={4}
                                placeholder="Enter away message..."
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs focus:outline-none leading-relaxed"
                            />
                            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border/60 text-[11px]">
                                <div className="flex items-center gap-1.5 text-muted-foreground text-[10px]">
                                    <Clock className="size-3 text-purple-500" />
                                    <span>Office Hours: Mon-Sat, 9:30 AM - 7:00 PM IST</span>
                                </div>
                                <span className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">
                                    Auto-Active on Off-Hours
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* 2. Main Split: Keyword Rules (Left 8 cols) & Simulator (Right 4 cols) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                    {/* Left Column: Keyword Rules Table & Search */}
                    <div className="lg:col-span-8 space-y-3">
                        <Card className="border-border shadow-2xs">
                            <div className="p-3.5 border-b border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/10">
                                <div>
                                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                        <Tag className="size-4 text-[#47b672]" />
                                        Keyword Trigger Rules ({filteredRules.length})
                                    </h3>
                                    <p className="text-[11px] text-muted-foreground mt-0.5">
                                        When customer text matches keywords, bot instantly sends the configured response.
                                    </p>
                                </div>

                                <Button
                                    size="sm"
                                    onClick={openAddRuleModal}
                                    className="bg-[#47b672] hover:bg-[#3ca062] text-white text-xs h-7.5 gap-1.5 shadow-2xs self-start sm:self-auto"
                                >
                                    <Plus className="size-3.5" />
                                    Add Rule
                                </Button>
                            </div>

                            {/* Search & Filter Bar */}
                            <div className="p-3 border-b border-border/60 flex flex-col sm:flex-row items-center justify-between gap-2.5">
                                <div className="relative w-full sm:w-72">
                                    <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                                    <Input
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search by keyword or response..."
                                        className="pl-8 text-xs h-8 bg-background"
                                    />
                                </div>

                                <div className="flex items-center gap-1 self-end sm:self-auto">
                                    {(['all', 'active', 'paused'] as const).map((st) => (
                                        <button
                                            key={st}
                                            type="button"
                                            onClick={() => setFilterStatus(st)}
                                            className={`px-2.5 py-1 rounded text-[11px] font-medium capitalize transition-colors ${
                                                filterStatus === st
                                                    ? 'bg-[#47b672]/15 text-[#28804c] dark:text-[#52c480] font-semibold'
                                                    : 'text-muted-foreground hover:bg-muted'
                                            }`}
                                        >
                                            {st}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Rules Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="border-b border-border/60 bg-muted/30 font-semibold text-muted-foreground">
                                        <tr>
                                            <th className="py-2.5 px-3.5">Trigger Keywords</th>
                                            <th className="py-2.5 px-3">Condition</th>
                                            <th className="py-2.5 px-3.5">Automated Reply</th>
                                            <th className="py-2.5 px-3 text-center">Status</th>
                                            <th className="py-2.5 px-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/50">
                                        {filteredRules.length > 0 ? (
                                            filteredRules.map((rule) => {
                                                const keywordsList = rule.keyword.split(',').map((k) => k.trim());
                                                return (
                                                    <tr key={rule.id} className="hover:bg-muted/20 transition-colors">
                                                        <td className="py-3 px-3.5 align-top">
                                                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                                                                {keywordsList.map((kw, i) => (
                                                                    <span
                                                                        key={i}
                                                                        className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-muted/80 text-foreground border border-border/40"
                                                                    >
                                                                        {kw}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </td>

                                                        <td className="py-3 px-3 align-top whitespace-nowrap">
                                                            <Badge
                                                                variant="outline"
                                                                className={`text-[10px] font-medium ${
                                                                    rule.matchType === 'exact'
                                                                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                                                        : rule.matchType === 'starts_with'
                                                                        ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
                                                                        : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                                                                }`}
                                                            >
                                                                {rule.matchType === 'exact'
                                                                    ? 'Exact Match'
                                                                    : rule.matchType === 'starts_with'
                                                                    ? 'Starts With'
                                                                    : 'Contains'}
                                                            </Badge>
                                                        </td>

                                                        <td className="py-3 px-3.5 align-top text-muted-foreground max-w-sm">
                                                            <p className="line-clamp-2 leading-relaxed text-xs">
                                                                {rule.reply}
                                                            </p>
                                                        </td>

                                                        <td className="py-3 px-3 align-top text-center whitespace-nowrap">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleToggleRule(rule.id)}
                                                                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                                                                    rule.enabled
                                                                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                                                                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                                                }`}
                                                            >
                                                                <span
                                                                    className={`size-1.5 rounded-full ${
                                                                        rule.enabled ? 'bg-emerald-500' : 'bg-muted-foreground'
                                                                    }`}
                                                                />
                                                                {rule.enabled ? 'Active' : 'Paused'}
                                                            </button>
                                                        </td>

                                                        <td className="py-3 px-3 align-top text-right whitespace-nowrap">
                                                            <div className="flex items-center justify-end gap-1">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="size-7 text-muted-foreground hover:text-foreground"
                                                                    onClick={() => openEditRuleModal(rule)}
                                                                    title="Edit Rule"
                                                                >
                                                                    <Edit3 className="size-3.5" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="size-7 text-muted-foreground hover:text-red-600"
                                                                    onClick={() => setDeletingRule(rule)}
                                                                    title="Delete Rule"
                                                                >
                                                                    <Trash2 className="size-3.5" />
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan={5} className="py-10 text-center text-muted-foreground">
                                                    <div className="flex flex-col items-center justify-center gap-1.5">
                                                        <Tag className="size-6 text-muted-foreground/40" />
                                                        <span className="text-xs font-medium">No keyword rules found</span>
                                                        <span className="text-[11px] text-muted-foreground">
                                                            Click &ldquo;Add Rule&rdquo; above to set up your first automatic trigger.
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </div>

                    {/* Right Column: Live Simulator (Sticky) */}
                    <div className="lg:col-span-4 lg:sticky lg:top-4 space-y-3">
                        <Card className="border-border shadow-2xs overflow-hidden">
                            <div className="py-2.5 px-3.5 border-b border-border/80 bg-background flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                        <Bot className="size-3.5 text-[#47b672]" />
                                        Auto-Reply Simulator
                                    </span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleRestartSim}
                                    className="text-xs h-7 text-muted-foreground hover:text-foreground gap-1"
                                    title="Restart simulation"
                                >
                                    <RotateCcw className="size-3" />
                                    Reset
                                </Button>
                            </div>

                            {/* Chat messages */}
                            <div className="p-3 bg-[#efeae2]/40 dark:bg-[#0c1317] space-y-3">
                                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                                    {simMessages.map((m, idx) => (
                                        <div
                                            key={idx}
                                            className={`flex flex-col ${
                                                m.sender === 'user' ? 'items-end' : 'items-start'
                                            }`}
                                        >
                                            <div
                                                className={`max-w-[90%] rounded-lg p-2.5 text-xs shadow-2xs whitespace-pre-wrap leading-relaxed ${
                                                    m.sender === 'user'
                                                        ? 'bg-[#d9fdd3] text-gray-900 dark:bg-[#005c4b] dark:text-gray-100 rounded-tr-none'
                                                        : 'bg-white text-gray-900 dark:bg-[#202c33] dark:text-gray-100 rounded-tl-none border border-black/5'
                                                }`}
                                            >
                                                {m.text}
                                            </div>

                                            {m.matchTag && (
                                                <span className="text-[9px] font-mono text-muted-foreground/80 mt-0.5 px-1">
                                                    ⚡ {m.matchTag}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Quick test pills */}
                                <div className="space-y-1.5 pt-1 border-t border-border/50">
                                    <span className="text-[10px] text-muted-foreground font-medium block">
                                        Quick Test Prompts:
                                    </span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {[
                                            { label: '💰 Price', query: 'What is your package price?' },
                                            { label: '📍 Address', query: 'Where is your Ahmedabad office?' },
                                            { label: '🎓 Courses', query: 'Tell me about React training courses' },
                                            { label: '👨‍💼 Support', query: 'Can I talk to a human agent?' },
                                        ].map((t, i) => (
                                            <button
                                                key={i}
                                                type="button"
                                                onClick={() => handleSimSend(t.query)}
                                                className="px-2 py-0.5 rounded-full bg-white dark:bg-[#202c33] border border-[#47b672]/30 text-[#28804c] dark:text-[#52c480] text-[10px] font-medium hover:bg-[#47b672]/10 transition-colors shadow-2xs"
                                            >
                                                {t.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Simulator Input Form */}
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        handleSimSend();
                                    }}
                                    className="flex gap-2 pt-1"
                                >
                                    <Input
                                        value={simInput}
                                        onChange={(e) => setSimInput(e.target.value)}
                                        placeholder="Type test message..."
                                        className="text-xs bg-background h-8"
                                    />
                                    <Button
                                        type="submit"
                                        size="sm"
                                        className="bg-[#47b672] hover:bg-[#3ca062] text-white h-8 px-3 shrink-0"
                                    >
                                        <Send className="size-3.5" />
                                    </Button>
                                </form>
                            </div>
                        </Card>

                        {/* Quick Tips Card */}
                        <div className="rounded-lg border border-border/80 bg-card p-3 space-y-1.5 text-xs">
                            <span className="font-semibold text-foreground flex items-center gap-1.5 text-xs">
                                <Sparkles className="size-3.5 text-amber-500" />
                                Auto-Responder Pro Tips
                            </span>
                            <ul className="text-[11px] text-muted-foreground space-y-1 list-disc list-inside">
                                <li>Use multiple synonyms separated by comma (e.g. <code>cost, fees, price</code>).</li>
                                <li>Use <strong>Contains</strong> condition for most conversational inquiries.</li>
                                <li>Include next action or menu in responses for higher customer engagement.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add / Edit Rule Modal */}
            <Dialog open={isRuleModalOpen} onOpenChange={setIsRuleModalOpen}>
                <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-base font-semibold flex items-center gap-2">
                            <Tag className="size-4 text-[#47b672]" />
                            {editingRule ? 'Edit Keyword Trigger Rule' : 'Create New Keyword Rule'}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            Define the trigger keywords and the automated WhatsApp response.
                        </DialogDescription>
                    </DialogHeader>

                    {ruleError && (
                        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-2.5 text-xs text-red-600 dark:text-red-400 flex items-start gap-2">
                            <AlertCircle className="size-4 shrink-0 mt-0.5" />
                            <span>{ruleError}</span>
                        </div>
                    )}

                    <form onSubmit={handleSaveRule} className="space-y-3.5 py-1">
                        <div className="space-y-1">
                            <Label className="text-xs font-medium">Trigger Keywords (comma separated) *</Label>
                            <Input
                                value={ruleKeyword}
                                onChange={(e) => setRuleKeyword(e.target.value)}
                                placeholder="e.g. discount, offer, coupon, deal"
                                className="text-xs font-mono"
                                required
                            />
                            <p className="text-[10px] text-muted-foreground">
                                Bot triggers when customer message contains any of these words.
                            </p>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs font-medium">Match Condition *</Label>
                            <select
                                value={ruleMatchType}
                                onChange={(e) =>
                                    setRuleMatchType(e.target.value as 'contains' | 'exact' | 'starts_with')
                                }
                                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs focus:outline-none"
                            >
                                <option value="contains">Contains (matches if keyword appears anywhere in message)</option>
                                <option value="exact">Exact Match (entire message must match keyword exactly)</option>
                                <option value="starts_with">Starts With (message begins with this keyword)</option>
                            </select>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs font-medium">Automated WhatsApp Response *</Label>
                            <textarea
                                rows={4}
                                value={ruleReply}
                                onChange={(e) => setRuleReply(e.target.value)}
                                placeholder="Enter automated response to send..."
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs focus:outline-none leading-relaxed"
                                required
                            />
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-border/60">
                            <div>
                                <Label className="text-xs font-medium">Rule Status</Label>
                                <p className="text-[10px] text-muted-foreground">Enable or pause this trigger rule</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setRuleEnabled(!ruleEnabled)}
                                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                                    ruleEnabled ? 'bg-[#47b672]' : 'bg-muted'
                                }`}
                            >
                                <span
                                    className={`pointer-events-none inline-block size-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                                        ruleEnabled ? 'translate-x-4' : 'translate-x-0'
                                    }`}
                                />
                            </button>
                        </div>

                        <DialogFooter className="flex flex-row justify-end items-center gap-2 pt-3">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setIsRuleModalOpen(false)}
                                className="text-xs px-3.5"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                size="sm"
                                className="bg-[#47b672] hover:bg-[#3ca062] text-white text-xs gap-1.5 px-4"
                            >
                                <Check className="size-3.5" />
                                {editingRule ? 'Update Rule' : 'Add Rule'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Rule Confirmation Dialog */}
            <Dialog open={!!deletingRule} onOpenChange={(open) => !open && setDeletingRule(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-base font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
                            <Trash2 className="size-4" />
                            Delete Keyword Rule
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            Are you sure you want to delete this rule for keywords{' '}
                            <span className="font-semibold text-foreground">
                                &ldquo;{deletingRule?.keyword}&rdquo;
                            </span>
                            ? The bot will no longer auto-respond to these keywords.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="flex flex-row justify-end items-center gap-2 pt-3">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setDeletingRule(null)}
                            className="text-xs px-3.5"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={handleConfirmDelete}
                            className="text-xs gap-1.5 px-4"
                        >
                            <Trash2 className="size-3.5" />
                            Delete Rule
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
