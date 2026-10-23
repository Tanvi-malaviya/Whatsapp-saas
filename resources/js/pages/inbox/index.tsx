import { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import {
    MessageSquare,
    Search,
    User,
    Clock,
    Send,
    Bot,
    Phone,
    CheckCheck,
    Tag,
    AlertCircle,
    ArrowLeft,
    Filter,
    ChevronDown,
    ChevronRight,
    Plus,
    Archive,
    CheckCircle2,
    Smile,
    Paperclip,
    MoreVertical,
    Sparkles,
    FileText,
    ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type ChatThread = {
    id: string;
    contactName: string;
    phone: string;
    channel: string; // e.g. "DukanHisab"
    lastMessage: string;
    time: string;
    unread: number;
    windowRemaining: string;
    stage: 'New' | 'Qualified' | 'Proposal' | 'Won' | 'Lost';
    label: 'Prospect' | 'Applicant' | 'Enrolled';
    status: 'open' | 'bot_handled' | 'resolved';
};

interface TeamInboxProps {
    initialThreads?: any[];
    channels?: any[];
}

export default function TeamInbox({ initialThreads = [], channels = [] }: TeamInboxProps) {
    const defaultMockThreads: ChatThread[] = [
        {
            id: 'mock-1',
            contactName: 'Bhavesh Sathwara',
            phone: '+91 79978 81665',
            channel: 'DukanHisab',
            lastMessage: 'Hello how are you',
            time: '13d',
            unread: 1,
            windowRemaining: '23h 48m',
            stage: 'New',
            label: 'Prospect',
            status: 'open',
        },
        {
            id: 'mock-2',
            contactName: 'Rahul Patel',
            phone: '+91 98250 12345',
            channel: 'DukanHisab',
            lastMessage: 'Can you please share the syllabus for the Laravel course?',
            time: '2m ago',
            unread: 0,
            windowRemaining: '23h 57m',
            stage: 'Qualified',
            label: 'Applicant',
            status: 'open',
        },
    ];

    const allInitialThreads = initialThreads.length > 0 ? [...initialThreads, ...defaultMockThreads] : defaultMockThreads;
    const [threads, setThreads] = useState<ChatThread[]>(allInitialThreads);

    const initialMsgMap: Record<string, Array<{ id: string; sender: 'contact' | 'agent' | 'bot'; text: string; time: string }>> = {
        'mock-1': [
            { id: 'm1', sender: 'contact', text: 'Hello how are you', time: '11:10 AM' },
            { id: 'm2', sender: 'bot', text: 'Hello Bhavesh! Welcome to Sathwara InfoTech (DukanHisab). How can we assist you today?', time: '11:10 AM' },
        ],
        'mock-2': [
            { id: 'm3', sender: 'contact', text: 'Can you please share the syllabus for the Laravel course?', time: '10:45 AM' },
            { id: 'm4', sender: 'agent', text: 'Sure Rahul! Sharing the brochure and course curriculum right now.', time: '10:47 AM' },
        ],
    };

    if (initialThreads.length > 0) {
        initialThreads.forEach((t) => {
            if (t.messages && t.messages.length > 0) {
                initialMsgMap[t.id] = t.messages;
            }
        });
    }

    const [selectedThread, setSelectedThread] = useState<ChatThread | null>(allInitialThreads[0] || null);
    const [selectedHistoryFilter, setSelectedHistoryFilter] = useState('All');
    const [selectedChannelFilter, setSelectedChannelFilter] = useState('All channels');
    const [searchQuery, setSearchQuery] = useState('');
    const [messages, setMessages] = useState(initialMsgMap);
    const [replyText, setReplyText] = useState('');

    // Inbound test simulation state
    const [showSimDialog, setShowSimDialog] = useState(false);
    const [simPhone, setSimPhone] = useState('919898696798');
    const [simName, setSimName] = useState('Tanvi Malaviya');
    const [simText, setSimText] = useState('Hi! I need software details for my business.');
    const [isSimulating, setIsSimulating] = useState(false);

    // Start New Conversation state
    const [showNewChatDialog, setShowNewChatDialog] = useState(false);
    const [newChatPhone, setNewChatPhone] = useState('');
    const [newChatName, setNewChatName] = useState('');
    const [newChatMsgType, setNewChatMsgType] = useState<'template' | 'text'>('template');
    const [newChatTemplate, setNewChatTemplate] = useState('due_reminder_en');
    const [newChatMessage, setNewChatMessage] = useState('Hello! Welcome to our WhatsApp service.');
    const [isStartingChat, setIsStartingChat] = useState(false);
    const [newChatStatus, setNewChatStatus] = useState<{ success: boolean; message: string } | null>(null);

    const handleStartNewChat = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newChatPhone.trim()) return;
        setIsStartingChat(true);
        setNewChatStatus(null);

        try {
            const res = await fetch('/inbox/new-chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: JSON.stringify({
                    phone: newChatPhone,
                    name: newChatName,
                    type: newChatMsgType,
                    template_name: newChatTemplate,
                    message: newChatMessage,
                }),
            });

            const data = await res.json();
            if (data.success) {
                setNewChatStatus({ success: true, message: data.message });
                setTimeout(() => {
                    setShowNewChatDialog(false);
                    window.location.href = '/inbox';
                }, 800);
            } else {
                setNewChatStatus({ success: false, message: data.message || 'Could not start chat' });
            }
        } catch (err: any) {
            setNewChatStatus({ success: false, message: err.message || 'Network error' });
        } finally {
            setIsStartingChat(false);
        }
    };

    const handleSendReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!replyText.trim() || !selectedThread) return;

        const textToSend = replyText.trim();
        setReplyText('');

        const optimisticMsg = {
            id: 'temp-' + Date.now(),
            sender: 'agent' as const,
            text: textToSend,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages((prev) => ({
            ...prev,
            [selectedThread.id]: [...(prev[selectedThread.id] || []), optimisticMsg],
        }));

        if (!selectedThread.id.startsWith('mock-')) {
            try {
                await fetch('/inbox/reply', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                    },
                    body: JSON.stringify({
                        conversation_id: selectedThread.id,
                        message: textToSend,
                    }),
                });
            } catch (err) {
                console.error(err);
            }
        }
    };

    const handleSimulateInbound = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!simPhone.trim() || !simText.trim()) return;
        setIsSimulating(true);

        try {
            const res = await fetch('/inbox/simulate-inbound', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: JSON.stringify({
                    phone: simPhone,
                    name: simName,
                    message: simText,
                }),
            });

            const data = await res.json();
            if (data.success) {
                setShowSimDialog(false);
                window.location.href = '/inbox';
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsSimulating(false);
        }
    };

    const filteredThreads = threads.filter((t) => {
        if (selectedChannelFilter !== 'All channels' && t.channel !== selectedChannelFilter) {
            return false;
        }
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            return t.contactName.toLowerCase().includes(q) || t.phone.includes(q) || t.lastMessage.toLowerCase().includes(q);
        }
        return true;
    });

    return (
        <>
            <Head title="Chat - Sathwara InfoTech | WhatsApp Business SaaS" />

            {/* Clean Modern 2-Column WhatsApp Chat Layout */}
            <div className="flex h-[calc(100vh-65px)] overflow-hidden bg-background">
                {/* 1. Left Column: Conversation List */}
                <div className="w-full sm:w-80 md:w-96 shrink-0 border-r border-border/80 flex flex-col bg-card">
                    {/* Search & Header */}
                    <div className="p-3.5 border-b border-border/80 space-y-2.5 bg-card">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <h2 className="text-sm font-bold text-foreground">Inbox</h2>
                                <Badge className="bg-[#47b672]/15 text-[#28804c] dark:text-[#52c480] text-[11px] font-semibold border-0 px-2 py-0.5">
                                    {filteredThreads.length}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Button
                                    size="sm"
                                    onClick={() => setShowNewChatDialog(true)}
                                    className="bg-[#47b672] text-white hover:bg-[#349c5e] text-xs font-semibold h-7 px-2.5 gap-1 rounded-full shadow-2xs"
                                    title="Start a new WhatsApp conversation with any phone number"
                                >
                                    <Plus className="size-3.5" />
                                    <span>New Chat</span>
                                </Button>
                                <button
                                    type="button"
                                    onClick={() => setShowSimDialog(true)}
                                    className="flex items-center gap-1 rounded-full bg-muted hover:bg-muted/80 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors border border-border/70"
                                    title="Simulate incoming WhatsApp message for localhost testing"
                                >
                                    <Sparkles className="size-3" />
                                    <span>Test</span>
                                </button>
                            </div>
                        </div>

                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 size-3.5 text-muted-foreground" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search customer, phone, or message..."
                                className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[#47b672]"
                            />
                        </div>

                        <div className="flex items-center gap-1.5">
                            <select
                                value={selectedChannelFilter}
                                onChange={(e) => setSelectedChannelFilter(e.target.value)}
                                className="w-full rounded-md border border-input bg-background px-2.5 py-1 text-xs text-foreground focus:outline-none"
                            >
                                <option>All channels</option>
                                {channels.length === 0 ? (
                                    <option>DukanHisab WhatsApp</option>
                                ) : (
                                    channels.map((ch: any) => (
                                        <option key={ch.id} value={ch.name}>
                                            {ch.name}
                                        </option>
                                    ))
                                )}
                            </select>
                        </div>
                    </div>

                    {/* Chat Item List */}
                    <div className="flex-1 overflow-y-auto divide-y divide-border/50">
                        {filteredThreads.map((thread) => {
                            const isSelected = selectedThread?.id === thread.id;
                            return (
                                <div
                                    key={thread.id}
                                    onClick={() => setSelectedThread(thread)}
                                    className={`flex items-start gap-3 p-3.5 cursor-pointer transition-colors relative ${
                                        isSelected
                                            ? 'bg-[#47b672]/10 border-l-4 border-l-[#47b672]'
                                            : 'hover:bg-muted/40'
                                    }`}
                                >
                                    {/* Avatar with Initials */}
                                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#47b672]/15 text-[#28804c] dark:text-[#52c480] font-bold text-xs border border-[#47b672]/20">
                                        {thread.contactName.slice(0, 2).toUpperCase()}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-1">
                                            <span className="text-xs font-bold text-foreground truncate">
                                                {thread.contactName}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground shrink-0 font-medium">
                                                {thread.time}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <span className="inline-block rounded bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground font-semibold truncate max-w-[120px]">
                                                {thread.channel}
                                            </span>
                                            <span className="text-xs text-muted-foreground truncate flex-1">
                                                {thread.lastMessage}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2 mt-1.5">
                                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                                                <span className="size-1.5 rounded-full bg-emerald-500"></span>
                                                24h Window: {thread.windowRemaining}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Bottom Status Bar */}
                    <div className="p-2.5 border-t border-border/80 flex items-center justify-between bg-card text-[11px] text-muted-foreground">
                        <div className="flex items-center gap-1.5 truncate">
                            <span className="size-2 rounded-full bg-emerald-500"></span>
                            <span className="truncate">Active WhatsApp Connected</span>
                        </div>
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-[10px] text-[#28804c] dark:text-[#52c480]"
                            asChild
                        >
                            <Link href="/whatsapp/connect">Manage</Link>
                        </Button>
                    </div>
                </div>

                {/* 2. Right Column: Chat Conversation Thread OR Empty State */}
                <div className="flex-1 flex flex-col bg-muted/20 overflow-hidden">
                    {selectedThread ? (
                        /* Active Conversation View */
                        <div className="flex flex-col h-full">
                            {/* Thread Header */}
                            <div className="h-16 border-b border-border/80 px-5 flex items-center justify-between bg-card shrink-0">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#47b672]/15 text-[#28804c] dark:text-[#52c480] font-bold text-xs border border-[#47b672]/30">
                                        {selectedThread.contactName.slice(0, 2).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="text-sm font-bold text-foreground truncate">
                                                {selectedThread.contactName}
                                            </h3>
                                            <span className="rounded bg-[#47b672]/15 px-2 py-0.5 text-[10px] font-semibold text-[#28804c] dark:text-[#52c480]">
                                                {selectedThread.channel}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                                            {selectedThread.phone} • Session Window: <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{selectedThread.windowRemaining}</span>
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    <Badge variant="outline" className="text-xs border-[#47b672]/40 text-[#28804c] dark:text-[#52c480] gap-1">
                                        <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                        24h Window Open
                                    </Badge>
                                </div>
                            </div>

                            {/* Message Feed */}
                            <div className="flex-1 overflow-y-auto p-5 space-y-3.5 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:16px_16px]">
                                {(messages[selectedThread.id] || []).map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`flex flex-col max-w-[70%] ${
                                            msg.sender === 'agent'
                                                ? 'ml-auto items-end'
                                                : msg.sender === 'bot'
                                                ? 'mr-auto items-start'
                                                : 'mr-auto items-start'
                                        }`}
                                    >
                                        <div
                                            className={`rounded-2xl px-4 py-2.5 text-xs shadow-xs leading-relaxed ${
                                                msg.sender === 'agent'
                                                    ? 'bg-[#d9fdd3] text-[#111b21] dark:bg-[#005c4b] dark:text-[#e9edef] rounded-tr-xs'
                                                    : msg.sender === 'bot'
                                                    ? 'bg-card text-foreground border border-purple-500/30 rounded-tl-xs'
                                                    : 'bg-card text-foreground border border-border rounded-tl-xs'
                                            }`}
                                        >
                                            {msg.sender === 'bot' && (
                                                <div className="flex items-center gap-1 text-[10px] text-purple-600 dark:text-purple-400 font-bold mb-1">
                                                    <Bot className="size-3" /> Auto-Bot Reply
                                                </div>
                                            )}
                                            <p>{msg.text}</p>
                                            <div className="flex items-center justify-end gap-1 text-[10px] text-muted-foreground mt-1">
                                                <span>{msg.time}</span>
                                                {msg.sender === 'agent' && (
                                                    <CheckCheck className="size-3.5 text-[#53bdeb]" />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Message Reply Input Box */}
                            <form onSubmit={handleSendReply} className="p-3 border-t border-border/80 bg-card shrink-0">
                                <div className="flex items-center gap-2">
                                    <Button type="button" variant="ghost" size="sm" className="size-8 p-0 text-muted-foreground hover:text-foreground">
                                        <Smile className="size-4" />
                                    </Button>
                                    <Button type="button" variant="ghost" size="sm" className="size-8 p-0 text-muted-foreground hover:text-foreground">
                                        <Paperclip className="size-4" />
                                    </Button>
                                    <input
                                        type="text"
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        placeholder={`Type a WhatsApp reply to ${selectedThread.contactName}...`}
                                        className="flex-1 rounded-lg border border-input bg-background px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[#47b672]"
                                    />
                                    <Button
                                        type="submit"
                                        size="sm"
                                        className="bg-[#47b672] text-white hover:bg-[#349c5e] text-xs font-semibold gap-1.5 px-4 shadow-sm"
                                    >
                                        <Send className="size-3.5" />
                                        <span>Send</span>
                                    </Button>
                                </div>
                            </form>
                        </div>
                    ) : (
                        /* Exact Empty State from Xobito Screenshot */
                        <div className="flex flex-col items-center justify-center h-full p-8 text-center select-none">
                            {/* Graphic Illustration Matching Screenshot */}
                            <div className="relative mb-6">
                                <div className="size-48 rounded-3xl bg-card border border-border/70 p-5 shadow-sm flex flex-col justify-center space-y-3">
                                    <div className="flex items-center gap-2">
                                        <div className="size-7 rounded-lg bg-[#47b672]/15 flex items-center justify-center text-[#47b672]">
                                            <MessageSquare className="size-4" />
                                        </div>
                                        <div className="h-2.5 w-24 rounded-full bg-muted"></div>
                                        <div className="size-2 rounded-full bg-[#47b672] ml-auto"></div>
                                    </div>
                                    <div className="h-7 w-36 rounded-lg bg-muted/60 self-start"></div>
                                    <div className="h-7 w-40 rounded-lg bg-[#47b672] self-end flex items-center justify-end px-2">
                                        <CheckCheck className="size-3 text-white/80" />
                                    </div>
                                    <div className="flex items-center gap-1 self-start bg-muted/70 rounded-full px-2 py-1">
                                        <span className="size-1 rounded-full bg-muted-foreground animate-pulse"></span>
                                        <span className="size-1 rounded-full bg-muted-foreground animate-pulse delay-100"></span>
                                        <span className="size-1 rounded-full bg-muted-foreground animate-pulse delay-200"></span>
                                    </div>
                                </div>
                                <div className="absolute -top-2 -right-2 size-8 rounded-full bg-card border border-border shadow-xs flex items-center justify-center text-[#47b672]">
                                    <MessageSquare className="size-4" />
                                </div>
                                <div className="absolute -bottom-2 -left-2 size-8 rounded-full bg-card border border-border shadow-xs flex items-center justify-center text-amber-500">
                                    <Sparkles className="size-4" />
                                </div>
                            </div>

                            <h3 className="text-base font-bold text-foreground">
                                Select a conversation
                            </h3>
                            <p className="text-xs text-muted-foreground max-w-sm mt-1.5 leading-relaxed">
                                Choose a conversation from the list to view the thread, reply, and see the full contact context.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Inbound WhatsApp Simulation Modal */}
            {showSimDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in-50">
                    <div className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-border pb-3">
                            <div className="flex items-center gap-2">
                                <div className="size-7 rounded-lg bg-[#47b672]/15 flex items-center justify-center text-[#47b672]">
                                    <Sparkles className="size-4" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-foreground">Simulate Inbound WhatsApp Test</h3>
                                    <p className="text-[11px] text-muted-foreground">Test two-way live inbox on localhost</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowSimDialog(false)}
                                className="text-muted-foreground hover:text-foreground text-xs p-1"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2.5 text-[11px] text-emerald-800 dark:text-emerald-300 leading-relaxed">
                            💡 <strong>Why Simulation?</strong> When you run on <code>localhost:8000</code>, Meta's internet servers cannot directly reach your laptop without a public tunnel. This tool sends the exact Meta Webhook payload into your backend, creating the chat thread and triggering Bot Auto-Responders!
                        </div>

                        <form onSubmit={handleSimulateInbound} className="space-y-3">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold">Customer Mobile Number (with 91) *</label>
                                <input
                                    type="text"
                                    required
                                    value={simPhone}
                                    onChange={(e) => setSimPhone(e.target.value)}
                                    placeholder="e.g. 919898696798"
                                    className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs font-mono"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold">Customer Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={simName}
                                    onChange={(e) => setSimName(e.target.value)}
                                    placeholder="e.g. Tanvi Malaviya"
                                    className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold">Customer Message Content *</label>
                                <textarea
                                    required
                                    rows={3}
                                    value={simText}
                                    onChange={(e) => setSimText(e.target.value)}
                                    placeholder="Type what customer said on WhatsApp..."
                                    className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowSimDialog(false)}
                                    className="text-xs"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    size="sm"
                                    disabled={isSimulating}
                                    className="bg-[#47b672] text-white hover:bg-[#349c5e] text-xs font-semibold gap-1.5"
                                >
                                    <Send className="size-3.5" />
                                    {isSimulating ? 'Processing...' : '🚀 Simulate Inbound'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Start New Conversation Modal */}
            {showNewChatDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in-50">
                    <div className="w-full max-w-lg rounded-xl border border-border bg-card p-5 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-border pb-3">
                            <div className="flex items-center gap-2">
                                <div className="size-8 rounded-lg bg-[#47b672]/15 flex items-center justify-center text-[#47b672]">
                                    <Plus className="size-4" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-foreground">Start New WhatsApp Conversation</h3>
                                    <p className="text-[11px] text-muted-foreground">Send a WhatsApp message directly to any phone number</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowNewChatDialog(false)}
                                className="text-muted-foreground hover:text-foreground text-xs p-1"
                            >
                                ✕
                            </button>
                        </div>

                        {newChatStatus && (
                            <div className={`p-2.5 rounded-lg text-xs ${
                                newChatStatus.success
                                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                                    : 'bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/20'
                            }`}>
                                {newChatStatus.message}
                            </div>
                        )}

                        <form onSubmit={handleStartNewChat} className="space-y-3.5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold">Recipient Mobile Number *</label>
                                    <input
                                        type="text"
                                        required
                                        value={newChatPhone}
                                        onChange={(e) => setNewChatPhone(e.target.value)}
                                        placeholder="e.g. 919898096798"
                                        className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs font-mono"
                                    />
                                    <span className="text-[10px] text-muted-foreground">Include country code (e.g. 91 for India)</span>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-semibold">Contact Name (Optional)</label>
                                    <input
                                        type="text"
                                        value={newChatName}
                                        onChange={(e) => setNewChatName(e.target.value)}
                                        placeholder="e.g. Rahul Patel"
                                        className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs"
                                    />
                                    <span className="text-[10px] text-muted-foreground">Name saved in your contacts</span>
                                </div>
                            </div>

                            {/* Message Type Toggle */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold">Message Type</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setNewChatMsgType('template')}
                                        className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
                                            newChatMsgType === 'template'
                                                ? 'border-[#47b672] bg-[#47b672]/10 ring-1 ring-[#47b672]'
                                                : 'border-border bg-background hover:bg-muted/40'
                                        }`}
                                    >
                                        <div className="font-semibold text-foreground">⚡ Approved Template</div>
                                        <p className="text-[10px] text-muted-foreground mt-0.5">Delivers anytime to any number</p>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setNewChatMsgType('text')}
                                        className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
                                            newChatMsgType === 'text'
                                                ? 'border-[#47b672] bg-[#47b672]/10 ring-1 ring-[#47b672]'
                                                : 'border-border bg-background hover:bg-muted/40'
                                        }`}
                                    >
                                        <div className="font-semibold text-foreground">💬 Custom Text</div>
                                        <p className="text-[10px] text-muted-foreground mt-0.5">If customer messaged in last 24h</p>
                                    </button>
                                </div>
                            </div>

                            {newChatMsgType === 'template' ? (
                                <div className="space-y-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                                    <label className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                                        Select Meta Approved Template *
                                    </label>
                                    <select
                                        value={newChatTemplate}
                                        onChange={(e) => setNewChatTemplate(e.target.value)}
                                        className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    >
                                        <option value="due_reminder_en">due_reminder_en (Payment Due Reminder)</option>
                                        <option value="sale_invoice_en">sale_invoice_en (Sale Invoice Notification)</option>
                                        <option value="payment_received_en">payment_received_en (Payment Received Confirmation)</option>
                                        <option value="appointment_cancelled">appointment_cancelled (Alert Notification)</option>
                                    </select>
                                    <p className="text-[10px] text-emerald-700 dark:text-emerald-400">
                                        Pre-approved templates land directly on the user's phone to start the conversation.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold">Message Text *</label>
                                    <textarea
                                        required
                                        rows={3}
                                        value={newChatMessage}
                                        onChange={(e) => setNewChatMessage(e.target.value)}
                                        placeholder="Type your WhatsApp message..."
                                        className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs"
                                    />
                                </div>
                            )}

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowNewChatDialog(false)}
                                    className="text-xs"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    size="sm"
                                    disabled={isStartingChat}
                                    className="bg-[#47b672] text-white hover:bg-[#349c5e] text-xs font-semibold gap-1.5 px-4 shadow-sm"
                                >
                                    <Send className="size-3.5" />
                                    {isStartingChat ? 'Sending & Opening...' : '🚀 Start Chat & Send'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
