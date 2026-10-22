import { Head, Link } from '@inertiajs/react';
import {
    Bot,
    Plus,
    Save,
    Sparkles,
    Trash2,
    Clock,
    UserCheck,
    MessageSquare,
    Smile,
    Send,
    ArrowLeft,
    Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';

type KeywordRule = {
    id: string;
    keyword: string;
    matchType: 'contains' | 'exact' | 'starts_with';
    reply: string;
    enabled: boolean;
};

export default function BotBuilder() {
    const [welcomeMessage, setWelcomeMessage] = useState(
        "Hello! Welcome to Sathwara InfoTech. How can we assist you today?\n\n1. Web Development\n2. WhatsApp Automation\n3. Talk to Team"
    );

    const [rules, setRules] = useState<KeywordRule[]>([
        {
            id: '1',
            keyword: 'fees, price, cost',
            matchType: 'contains',
            reply: 'Our Bot Starter package is ₹2,999 one-time setup + ₹999/month for unlimited auto-replies! Would you like a live demo?',
            enabled: true,
        },
        {
            id: '2',
            keyword: 'courses, training',
            matchType: 'contains',
            reply: 'We offer Full Stack Web Development (PHP/Laravel & React) and WhatsApp API automation training. Classes start every Monday!',
            enabled: true,
        },
        {
            id: '3',
            keyword: 'human, agent, talk, call',
            matchType: 'contains',
            reply: 'Sure! Pausing the automated bot and transferring you to our support agent. An agent will reply shortly.',
            enabled: true,
        },
    ]);

    const [newKeyword, setNewKeyword] = useState('');
    const [newReply, setNewReply] = useState('');
    const [previewInput, setPreviewInput] = useState('');
    const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string; time: string }>>([
        { sender: 'bot', text: welcomeMessage, time: '10:00 AM' },
    ]);
    const [savedToast, setSavedToast] = useState(false);

    const handleSave = () => {
        setSavedToast(true);
        setTimeout(() => setSavedToast(false), 2000);
    };

    const handleAddRule = () => {
        if (!newKeyword.trim() || !newReply.trim()) return;
        setRules([
            ...rules,
            {
                id: Date.now().toString(),
                keyword: newKeyword.trim(),
                matchType: 'contains',
                reply: newReply.trim(),
                enabled: true,
            },
        ]);
        setNewKeyword('');
        setNewReply('');
    };

    const handleDeleteRule = (id: string) => {
        setRules(rules.filter((r) => r.id !== id));
    };

    const handleSendTest = (e: React.FormEvent) => {
        e.preventDefault();
        if (!previewInput.trim()) return;

        const userMsg = previewInput.trim();
        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const updated = [...chatMessages, { sender: 'user' as const, text: userMsg, time: now }];
        setChatMessages(updated);
        setPreviewInput('');

        // Find match
        const lower = userMsg.toLowerCase();
        let matchedReply = "Thanks for your message! Our team has received your query and will get back to you shortly.";
        
        for (const rule of rules) {
            if (!rule.enabled) continue;
            const keywords = rule.keyword.split(',').map((k) => k.trim().toLowerCase());
            if (keywords.some((k) => lower.includes(k))) {
                matchedReply = rule.reply;
                break;
            }
        }

        setTimeout(() => {
            setChatMessages((prev) => [
                ...prev,
                { sender: 'bot', text: matchedReply, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
            ]);
        }, 600);
    };

    return (
        <>
            <Head title="Bot & Auto-Reply Builder" />

            <div className="flex flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Button variant="ghost" size="sm" asChild className="h-7 text-xs text-muted-foreground p-0">
                                <Link href="/dashboard">
                                    <ArrowLeft className="size-3.5 mr-1" />
                                    Dashboard
                                </Link>
                            </Button>
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            <Bot className="size-6 text-emerald-600" />
                            Bot Starter — Auto-Reply Engine
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Configure automatic greetings, keyword responses, and human handoff rules. Test live in the WhatsApp simulator.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {savedToast && (
                            <span className="text-xs text-emerald-600 font-medium flex items-center gap-1 animate-in fade-in">
                                <Check className="size-4" /> Saved Successfully!
                            </span>
                        )}
                        <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                            <Save className="size-4" />
                            Save Bot Rules
                        </Button>
                    </div>
                </div>

                {/* 2-Column Layout: Left = Bot Configuration, Right = Live WhatsApp Phone Simulator */}
                <div className="grid gap-6 lg:grid-cols-12 items-start">
                    {/* Left 7 Cols: Rule Editors */}
                    <div className="lg:col-span-7 space-y-6">
                        {/* 1. Welcome Greeting */}
                        <Card className="border-sidebar-border/70">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                                        <Sparkles className="size-4 text-emerald-600" />
                                        1. Welcome Greeting (First-Time Contacts)
                                    </CardTitle>
                                    <Badge variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-500/30">
                                        Active
                                    </Badge>
                                </div>
                                <CardDescription className="text-xs">
                                    Automatically sent when a new phone number sends their first message to your WhatsApp number.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <textarea
                                    rows={4}
                                    value={welcomeMessage}
                                    onChange={(e) => setWelcomeMessage(e.target.value)}
                                    className="w-full rounded-md border border-input bg-background p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                                />
                                <p className="text-[11px] text-muted-foreground">
                                    Supports Gujarati, Hindi, English, and emojis.
                                </p>
                            </CardContent>
                        </Card>

                        {/* 2. Keyword Triggers */}
                        <Card className="border-sidebar-border/70">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                                        <Bot className="size-4 text-blue-600" />
                                        2. Keyword Rules & FAQ Answers
                                    </CardTitle>
                                    <Badge variant="secondary" className="text-xs">
                                        {rules.length} Rules Configured
                                    </Badge>
                                </div>
                                <CardDescription className="text-xs">
                                    When incoming message matches any keyword, the bot replies instantly without human intervention.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-3">
                                    {rules.map((rule, idx) => (
                                        <div
                                            key={rule.id}
                                            className="rounded-lg border border-sidebar-border/60 p-3 bg-muted/20 space-y-2"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="flex size-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] text-white font-bold">
                                                        {idx + 1}
                                                    </span>
                                                    <span className="text-xs font-semibold text-foreground">
                                                        If message contains:
                                                    </span>
                                                    <Badge variant="outline" className="text-xs font-mono bg-background">
                                                        {rule.keyword}
                                                    </Badge>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-7 text-muted-foreground hover:text-red-600"
                                                    onClick={() => handleDeleteRule(rule.id)}
                                                >
                                                    <Trash2 className="size-3.5" />
                                                </Button>
                                            </div>
                                            <p className="text-xs text-muted-foreground bg-background rounded p-2 border border-sidebar-border/40">
                                                {rule.reply}
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                {/* Add New Keyword Rule */}
                                <div className="rounded-lg border border-dashed border-sidebar-border p-4 bg-card space-y-3">
                                    <h4 className="text-xs font-semibold text-foreground">Add New Keyword Rule</h4>
                                    <div className="grid gap-2">
                                        <input
                                            type="text"
                                            placeholder="Keywords (comma separated, e.g. admission, timing, syllabus)"
                                            value={newKeyword}
                                            onChange={(e) => setNewKeyword(e.target.value)}
                                            className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                                        />
                                        <textarea
                                            rows={2}
                                            placeholder="Automated bot reply text..."
                                            value={newReply}
                                            onChange={(e) => setNewReply(e.target.value)}
                                            className="w-full rounded-md border border-input bg-background p-2.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                                        />
                                    </div>
                                    <Button
                                        size="sm"
                                        onClick={handleAddRule}
                                        disabled={!newKeyword.trim() || !newReply.trim()}
                                        className="h-8 text-xs bg-emerald-600 text-white hover:bg-emerald-700 gap-1.5"
                                    >
                                        <Plus className="size-3.5" />
                                        Add Rule
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right 5 Cols: Live WhatsApp Mobile Preview Simulator */}
                    <div className="lg:col-span-5 sticky top-6">
                        <div className="mx-auto w-full max-w-[360px] rounded-[36px] border-[10px] border-neutral-900 bg-neutral-900 shadow-2xl overflow-hidden ring-1 ring-black/10">
                            {/* Phone Speaker Notch */}
                            <div className="flex justify-center bg-neutral-900 py-1">
                                <div className="h-3 w-24 rounded-full bg-neutral-800"></div>
                            </div>

                            {/* WhatsApp Header */}
                            <div className="flex items-center gap-2.5 bg-emerald-800 px-3.5 py-3 text-white">
                                <div className="size-8 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-xs">
                                    SI
                                </div>
                                <div className="flex-1">
                                    <h5 className="text-xs font-semibold leading-tight">Sathwara InfoTech</h5>
                                    <p className="text-[10px] text-emerald-200">Online • Bot Active</p>
                                </div>
                            </div>

                            {/* Chat Conversation Area */}
                            <div className="h-[380px] overflow-y-auto bg-[#e5ddd5] dark:bg-[#121b22] p-3 space-y-2.5 text-xs">
                                <div className="text-center my-1">
                                    <span className="rounded-md bg-white/70 dark:bg-neutral-800/70 px-2 py-0.5 text-[10px] text-neutral-600 dark:text-neutral-400 shadow-xs">
                                        TODAY
                                    </span>
                                </div>

                                {chatMessages.map((msg, idx) => (
                                    <div
                                        key={idx}
                                        className={`flex flex-col max-w-[82%] rounded-lg p-2.5 shadow-xs ${
                                            msg.sender === 'user'
                                                ? 'ml-auto bg-[#d9fdd3] text-neutral-900 dark:bg-[#005c4b] dark:text-white rounded-tr-none'
                                                : 'mr-auto bg-white text-neutral-900 dark:bg-[#202c33] dark:text-white rounded-tl-none'
                                        }`}
                                    >
                                        <p className="whitespace-pre-wrap leading-relaxed text-[12px]">{msg.text}</p>
                                        <span className="text-[9px] text-muted-foreground/80 self-end mt-1">
                                            {msg.time}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Phone Input Box */}
                            <form onSubmit={handleSendTest} className="flex items-center gap-1.5 bg-neutral-100 dark:bg-neutral-900 p-2 border-t border-sidebar-border/50">
                                <input
                                    type="text"
                                    placeholder="Type a message (e.g. fees)..."
                                    value={previewInput}
                                    onChange={(e) => setPreviewInput(e.target.value)}
                                    className="flex-1 rounded-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-1.5 text-xs focus:outline-none"
                                />
                                <Button
                                    type="submit"
                                    size="icon"
                                    className="size-8 rounded-full bg-emerald-600 text-white shrink-0 hover:bg-emerald-700"
                                >
                                    <Send className="size-3.5" />
                                </Button>
                            </form>
                        </div>
                        <p className="text-center text-[11px] text-muted-foreground mt-2">
                            📱 Interactive WhatsApp Chat Simulator (Try sending: <em>fees</em> or <em>courses</em>)
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
