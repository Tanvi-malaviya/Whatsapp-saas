import { useState } from 'react';
import { Head } from '@inertiajs/react';
import {
    Zap,
    Plus,
    Save,
    Trash2,
    Clock,
    UserCheck,
    MessageSquare,
    Smile,
    Send,
    Check,
    Moon,
    Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type KeywordRule = {
    id: string;
    keyword: string;
    matchType: 'contains' | 'exact' | 'starts_with';
    reply: string;
    enabled: boolean;
};

export default function AutoResponder() {
    const [welcomeEnabled, setWelcomeEnabled] = useState(true);
    const [welcomeMessage, setWelcomeMessage] = useState(
        "Hello! Welcome to Sathwara InfoTech. How can we assist you today?\n\n1. Web Development\n2. WhatsApp Automation\n3. Talk to Team"
    );

    const [awayEnabled, setAwayEnabled] = useState(true);
    const [awayMessage, setAwayMessage] = useState(
        "Hi! We are currently outside of business hours (Office hours: 9:30 AM - 7:00 PM IST). We have received your message and will reply first thing in the morning! 🌅"
    );

    const [rules, setRules] = useState<KeywordRule[]>([
        {
            id: '1',
            keyword: 'fees, price, cost',
            matchType: 'contains',
            reply: 'Our WhatsApp Bot Starter package is ₹2,999 one-time setup + ₹999/month for unlimited auto-replies! Would you like a live demo?',
            enabled: true,
        },
        {
            id: '2',
            keyword: 'courses, training, learn',
            matchType: 'contains',
            reply: 'We offer Full Stack Web Development (PHP/Laravel & React) and WhatsApp API automation training. Batches start every Monday in Ahmedabad!',
            enabled: true,
        },
        {
            id: '3',
            keyword: 'human, agent, talk, call',
            matchType: 'contains',
            reply: 'Sure! Pausing automated replies and transferring your chat to Bhavesh Sathwara. An agent will reply shortly.',
            enabled: true,
        },
        {
            id: '4',
            keyword: 'location, address, office',
            matchType: 'contains',
            reply: '📍 Our Office: Sathwara InfoTech, Ahmedabad, Gujarat. Open Monday to Saturday, 9:30 AM to 7:00 PM.',
            enabled: true,
        },
    ]);

    const [newKeyword, setNewKeyword] = useState('');
    const [newReply, setNewReply] = useState('');
    const [saved, setSaved] = useState(false);

    const handleAddRule = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newKeyword.trim() || !newReply.trim()) return;

        const rule: KeywordRule = {
            id: Date.now().toString(),
            keyword: newKeyword.trim(),
            matchType: 'contains',
            reply: newReply.trim(),
            enabled: true,
        };

        setRules([rule, ...rules]);
        setNewKeyword('');
        setNewReply('');
    };

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    };

    return (
        <>
            <Head title="Auto Responder - Sathwara InfoTech" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                                <Zap className="size-5 text-[#47b672]" />
                                Auto Responder &amp; Keyword Rules
                            </h2>
                            <Badge variant="outline" className="text-xs bg-[#47b672]/10 text-[#28804c] dark:text-[#52c480] border-[#47b672]/30">
                                Real-Time Rules Engine
                            </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Set up 24/7 instant auto-replies, business hours away messages, and keyword trigger responses.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        {saved && (
                            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                                <Check className="size-3.5" /> Saved!
                            </span>
                        )}
                        <Button size="sm" onClick={handleSave} className="bg-[#47b672] hover:bg-[#3ca062] text-white text-xs">
                            <Save className="size-3.5 mr-1.5" />
                            Save Rules
                        </Button>
                    </div>
                </div>

                {/* 1. Welcome & Away System Messages */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Welcome Message */}
                    <Card className="border-border shadow-2xs">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                    <MessageSquare className="size-4 text-[#47b672]" />
                                    Welcome Message
                                </CardTitle>
                                <button
                                    type="button"
                                    onClick={() => setWelcomeEnabled(!welcomeEnabled)}
                                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                                        welcomeEnabled ? 'bg-[#47b672]' : 'bg-muted'
                                    }`}
                                >
                                    <span
                                        className={`pointer-events-none inline-block size-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                                            welcomeEnabled ? 'translate-x-4' : 'translate-x-0'
                                        }`}
                                    />
                                </button>
                            </div>
                            <CardDescription className="text-xs">
                                Automatically dispatched the first time a customer messages your WhatsApp number.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <textarea
                                value={welcomeMessage}
                                onChange={(e) => setWelcomeMessage(e.target.value)}
                                rows={4}
                                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            />
                            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                                <span>Variables available: &#123;&#123;name&#125;&#125;, &#123;&#123;phone&#125;&#125;</span>
                                <span className="text-emerald-600 font-medium">Triggered: Instant</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Away Message */}
                    <Card className="border-border shadow-2xs">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                    <Moon className="size-4 text-purple-600" />
                                    Away / Off-Hours Message
                                </CardTitle>
                                <button
                                    type="button"
                                    onClick={() => setAwayEnabled(!awayEnabled)}
                                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                                        awayEnabled ? 'bg-[#47b672]' : 'bg-muted'
                                    }`}
                                >
                                    <span
                                        className={`pointer-events-none inline-block size-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                                            awayEnabled ? 'translate-x-4' : 'translate-x-0'
                                        }`}
                                    />
                                </button>
                            </div>
                            <CardDescription className="text-xs">
                                Dispatched when customer contacts you outside 9:30 AM - 7:00 PM IST.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <textarea
                                value={awayMessage}
                                onChange={(e) => setAwayMessage(e.target.value)}
                                rows={4}
                                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            />
                            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                                <span>Schedule: Mon-Sat 7:00 PM - 9:30 AM</span>
                                <span className="text-purple-600 font-medium">Auto-active</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* 2. Add New Keyword Rule */}
                <Card className="border-border shadow-2xs">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <Plus className="size-4 text-[#47b672]" />
                            Add Keyword Trigger Rule
                        </CardTitle>
                        <CardDescription className="text-xs">
                            When incoming WhatsApp text matches any of these keywords, send this pre-defined reply.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleAddRule} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                            <div className="md:col-span-4 space-y-1">
                                <Label className="text-xs font-medium">Keywords (comma separated)</Label>
                                <Input
                                    value={newKeyword}
                                    onChange={(e) => setNewKeyword(e.target.value)}
                                    placeholder="e.g. discount, offer, coupon"
                                    className="text-xs"
                                />
                            </div>
                            <div className="md:col-span-6 space-y-1">
                                <Label className="text-xs font-medium">Automated WhatsApp Response</Label>
                                <Input
                                    value={newReply}
                                    onChange={(e) => setNewReply(e.target.value)}
                                    placeholder="e.g. Use code SATHWARA10 for 10% off your first month!"
                                    className="text-xs"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <Button type="submit" size="sm" className="w-full bg-[#47b672] hover:bg-[#3ca062] text-white text-xs">
                                    <Plus className="size-3.5 mr-1" />
                                    Add Rule
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* 3. Existing Rules Table */}
                <Card className="border-border shadow-2xs">
                    <CardHeader className="pb-3 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-sm font-semibold">Active Keyword Rules ({rules.length})</CardTitle>
                            <CardDescription className="text-xs">Matched in real-time when webhooks receive user messages.</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="border-b border-border bg-muted/40 font-semibold text-muted-foreground">
                                    <tr>
                                        <th className="py-2.5 px-4">Keywords</th>
                                        <th className="py-2.5 px-4">Match Condition</th>
                                        <th className="py-2.5 px-4">Reply Content</th>
                                        <th className="py-2.5 px-4">Status</th>
                                        <th className="py-2.5 px-4 text-right">Delete</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/60">
                                    {rules.map((rule) => (
                                        <tr key={rule.id} className="hover:bg-muted/30">
                                            <td className="py-3 px-4 font-semibold text-foreground font-mono">
                                                {rule.keyword}
                                            </td>
                                            <td className="py-3 px-4">
                                                <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-600 border-blue-500/20">
                                                    Contains
                                                </Badge>
                                            </td>
                                            <td className="py-3 px-4 text-muted-foreground max-w-md">
                                                <p className="line-clamp-2">{rule.reply}</p>
                                            </td>
                                            <td className="py-3 px-4">
                                                <button
                                                    type="button"
                                                    onClick={() => setRules(rules.map(r => r.id === rule.id ? { ...r, enabled: !r.enabled } : r))}
                                                    className={`inline-flex items-center gap-1.5 text-[11px] font-medium ${
                                                        rule.enabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'
                                                    }`}
                                                >
                                                    <span className={`size-1.5 rounded-full ${rule.enabled ? 'bg-emerald-500' : 'bg-muted-foreground'}`}></span>
                                                    {rule.enabled ? 'Enabled' : 'Paused'}
                                                </button>
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 w-7 p-0 text-muted-foreground hover:text-red-600"
                                                    onClick={() => setRules(rules.filter(r => r.id !== rule.id))}
                                                >
                                                    <Trash2 className="size-3.5" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
