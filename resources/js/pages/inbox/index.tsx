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

export default function TeamInbox() {
    const [threads, setThreads] = useState<ChatThread[]>([
        {
            id: '1',
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
            id: '2',
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
        {
            id: '3',
            contactName: 'Priya Sharma',
            phone: '+91 94280 67890',
            channel: 'DukanHisab',
            lastMessage: 'Got the fees details, thank you!',
            time: '18m ago',
            unread: 0,
            windowRemaining: '22h 15m',
            stage: 'Proposal',
            label: 'Prospect',
            status: 'bot_handled',
        },
    ]);

    const [selectedThread, setSelectedThread] = useState<ChatThread | null>(null);
    const [selectedHistoryFilter, setSelectedHistoryFilter] = useState('All');
    const [selectedChannelFilter, setSelectedChannelFilter] = useState('All channels');
    const [searchQuery, setSearchQuery] = useState('');

    const [messages, setMessages] = useState<Record<string, Array<{ id: string; sender: 'contact' | 'agent' | 'bot'; text: string; time: string }>>>({
        '1': [
            { id: 'm1', sender: 'contact', text: 'Hello how are you', time: '11:10 AM' },
            { id: 'm2', sender: 'bot', text: 'Hello Bhavesh! Welcome to Sathwara InfoTech (DukanHisab). How can we assist you today?', time: '11:10 AM' },
        ],
        '2': [
            { id: 'm3', sender: 'contact', text: 'Can you please share the syllabus for the Laravel course?', time: '10:45 AM' },
            { id: 'm4', sender: 'agent', text: 'Sure Rahul! Sharing the brochure and course curriculum right now.', time: '10:47 AM' },
        ],
        '3': [
            { id: 'm5', sender: 'contact', text: 'Got the fees details, thank you!', time: 'Yesterday' },
        ],
    });

    const [replyText, setReplyText] = useState('');

    const handleSendReply = (e: React.FormEvent) => {
        e.preventDefault();
        if (!replyText.trim() || !selectedThread) return;

        const currentMessages = messages[selectedThread.id] || [];
        const newMsg = {
            id: Date.now().toString(),
            sender: 'agent' as const,
            text: replyText.trim(),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages({
            ...messages,
            [selectedThread.id]: [...currentMessages, newMsg],
        });
        setReplyText('');
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

            {/* Xobito 3-Column Chat Layout */}
            <div className="flex h-[calc(100vh-65px)] overflow-hidden bg-background">
                {/* 1. Left Sub-Sidebar: Filters & Navigation (Matching Xobito Chat Submenu) */}
                <aside className="w-56 shrink-0 border-r border-border/80 bg-card hidden md:flex flex-col p-3 overflow-y-auto">
                    {/* HISTORY Filter Section */}
                    <div className="mb-4">
                        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-2 py-1">
                            <span>HISTORY</span>
                            <ChevronDown className="size-3" />
                        </div>
                        <div className="space-y-0.5 mt-1">
                            {[
                                { name: 'All', icon: MessageSquare, count: threads.length },
                                { name: 'Assigned to me', icon: User, count: 1 },
                                { name: 'Auto closed', icon: CheckCircle2, count: 0 },
                                { name: 'Archived', icon: Archive, count: 0 },
                            ].map((item) => {
                                const isSelected = selectedHistoryFilter === item.name;
                                return (
                                    <button
                                        key={item.name}
                                        type="button"
                                        onClick={() => setSelectedHistoryFilter(item.name)}
                                        className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                                            isSelected
                                                ? 'bg-[#47b672]/15 text-[#28804c] dark:text-[#52c480] font-semibold'
                                                : 'text-foreground/80 hover:bg-muted'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <item.icon className="size-3.5" />
                                            <span>{item.name}</span>
                                        </div>
                                        <span className="text-[10px] text-muted-foreground">{item.count}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* TYPE Filter Section */}
                    <div className="mb-4">
                        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-2 py-1">
                            <span>TYPE</span>
                            <ChevronDown className="size-3" />
                        </div>
                        <div className="space-y-0.5 mt-1 text-xs text-foreground/80">
                            <label className="flex items-center gap-2 px-2.5 py-1 hover:bg-muted rounded-md cursor-pointer">
                                <input type="checkbox" className="rounded border-border text-[#47b672] focus:ring-[#47b672]" />
                                <span>CTWA (Ads)</span>
                            </label>
                            <label className="flex items-center gap-2 px-2.5 py-1 hover:bg-muted rounded-md cursor-pointer">
                                <input type="checkbox" className="rounded border-border text-[#47b672] focus:ring-[#47b672]" />
                                <span>FB page cta</span>
                            </label>
                        </div>
                    </div>

                    {/* CONV. STAGE Filter Section */}
                    <div className="mb-4">
                        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-2 py-1">
                            <span>CONV. STAGE</span>
                            <ChevronDown className="size-3" />
                        </div>
                        <div className="space-y-0.5 mt-1 text-xs text-foreground/80">
                            {[
                                { name: 'New', color: 'bg-amber-500' },
                                { name: 'Qualified', color: 'bg-slate-400' },
                                { name: 'Proposal', color: 'bg-emerald-500' },
                                { name: 'green', color: 'bg-[#47b672]' },
                                { name: 'Won', color: 'bg-teal-500' },
                                { name: 'Lost', color: 'bg-blue-500' },
                            ].map((stage) => (
                                <label key={stage.name} className="flex items-center gap-2 px-2.5 py-1 hover:bg-muted rounded-md cursor-pointer">
                                    <input type="checkbox" className="rounded border-border text-[#47b672] focus:ring-[#47b672]" />
                                    <span className={`size-2 rounded-full ${stage.color}`}></span>
                                    <span>{stage.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* LABELS Section */}
                    <div>
                        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-2 py-1">
                            <span>LABELS</span>
                            <ChevronDown className="size-3" />
                        </div>
                        <div className="space-y-0.5 mt-1 text-xs text-foreground/80">
                            {[
                                { name: 'Prospect', color: 'bg-pink-500' },
                                { name: 'Applicant', color: 'bg-red-500' },
                                { name: 'Enrolled', color: 'bg-rose-500' },
                            ].map((label) => (
                                <label key={label.name} className="flex items-center gap-2 px-2.5 py-1 hover:bg-muted rounded-md cursor-pointer">
                                    <input type="checkbox" className="rounded border-border text-[#47b672] focus:ring-[#47b672]" />
                                    <span className={`size-2 rounded-full ${label.color}`}></span>
                                    <span>{label.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </aside>

                {/* 2. Middle Column: Conversation List (Matching Xobito Chat List) */}
                <div className="w-full sm:w-80 lg:w-96 shrink-0 border-r border-border/80 flex flex-col bg-card">
                    {/* Search & Dropdown Filters */}
                    <div className="p-3 border-b border-border/80 space-y-2 bg-card">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search name, phone..."
                                className="w-full rounded-md border border-input bg-background pl-8 pr-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[#47b672]"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <select className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs text-foreground focus:outline-none">
                                <option>All agents</option>
                                <option>Bhavesh Sathwara</option>
                                <option>Bot Auto-Reply</option>
                            </select>

                            <select
                                value={selectedChannelFilter}
                                onChange={(e) => setSelectedChannelFilter(e.target.value)}
                                className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs text-foreground focus:outline-none"
                            >
                                <option>All channels</option>
                                <option>DukanHisab</option>
                            </select>
                        </div>
                    </div>

                    {/* Chat Item List */}
                    <div className="flex-1 overflow-y-auto divide-y divide-border/60">
                        {filteredThreads.map((thread) => {
                            const isSelected = selectedThread?.id === thread.id;
                            return (
                                <div
                                    key={thread.id}
                                    onClick={() => setSelectedThread(thread)}
                                    className={`flex items-start gap-3 p-3.5 cursor-pointer transition-colors relative ${
                                        isSelected
                                            ? 'bg-muted/70 border-l-4 border-l-[#47b672]'
                                            : 'hover:bg-muted/40'
                                    }`}
                                >
                                    {/* Avatar with Initials */}
                                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted border border-border text-xs font-bold text-foreground">
                                        {thread.contactName.slice(0, 2).toUpperCase()}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5 truncate">
                                                <span className="text-xs font-bold text-foreground truncate">
                                                    {thread.contactName}
                                                </span>
                                                <span className="rounded bg-muted px-1.5 py-0.2 text-[10px] text-muted-foreground font-medium">
                                                    {thread.channel}
                                                </span>
                                            </div>
                                            <span className="text-[10px] text-muted-foreground shrink-0">
                                                {thread.time}
                                            </span>
                                        </div>

                                        <p className="text-xs text-muted-foreground truncate mt-0.5 flex items-center gap-1">
                                            <span className="text-red-500 font-bold text-[10px]">!</span>
                                            <span>{thread.lastMessage}</span>
                                        </p>

                                        <div className="flex items-center gap-1.5 mt-1.5">
                                            <span className="size-1.5 rounded-full bg-amber-500"></span>
                                            <span className="text-[10px] text-muted-foreground">{thread.stage}</span>
                                            <span className="text-[10px] text-muted-foreground">• {thread.windowRemaining}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Floating WhatsApp Action Button */}
                    <div className="p-3 border-t border-border flex items-center justify-between bg-card">
                        <span className="text-[11px] text-muted-foreground">
                            Channels: <strong className="text-foreground">DukanHisab (+91 79978 81665)</strong>
                        </span>
                        <Button
                            size="sm"
                            className="size-9 rounded-full p-0 bg-[#47b672] text-white hover:bg-[#349c5e] shadow-md shadow-[#47b672]/30"
                            asChild
                        >
                            <Link href="/whatsapp/connect">
                                <Plus className="size-5" />
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* 3. Main Column: Chat Conversation Thread OR Empty State */}
                <div className="flex-1 flex flex-col bg-muted/20 overflow-hidden">
                    {selectedThread ? (
                        /* Active Conversation View */
                        <div className="flex flex-col h-full">
                            {/* Thread Header */}
                            <div className="h-16 border-b border-border/80 px-5 flex items-center justify-between bg-card">
                                <div className="flex items-center gap-3">
                                    <div className="flex size-9 items-center justify-center rounded-full bg-[#47b672]/15 text-[#28804c] dark:text-[#52c480] font-bold text-xs">
                                        {selectedThread.contactName.slice(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-sm font-bold text-foreground">
                                                {selectedThread.contactName}
                                            </h3>
                                            <span className="rounded bg-[#47b672]/15 px-1.5 py-0.2 text-[10px] font-semibold text-[#28804c] dark:text-[#52c480]">
                                                {selectedThread.channel}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-muted-foreground font-mono">
                                            {selectedThread.phone} • 24h Window: {selectedThread.windowRemaining}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs border-[#47b672]/40 text-[#28804c] dark:text-[#52c480]">
                                        Meta Cloud API
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
                            <form onSubmit={handleSendReply} className="p-3 border-t border-border bg-card">
                                <div className="flex items-center gap-2">
                                    <Button type="button" variant="ghost" size="sm" className="size-8 p-0 text-muted-foreground">
                                        <Smile className="size-4" />
                                    </Button>
                                    <Button type="button" variant="ghost" size="sm" className="size-8 p-0 text-muted-foreground">
                                        <Paperclip className="size-4" />
                                    </Button>
                                    <input
                                        type="text"
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        placeholder={`Reply to ${selectedThread.contactName} via ${selectedThread.channel}...`}
                                        className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-[#47b672]/40"
                                    />
                                    <Button
                                        type="submit"
                                        size="sm"
                                        className="bg-[#47b672] text-white hover:bg-[#349c5e] text-xs font-semibold gap-1.5"
                                    >
                                        <Send className="size-3.5" />
                                        Send
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
        </>
    );
}
