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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';

type ChatThread = {
    id: string;
    contactName: string;
    phone: string;
    lastMessage: string;
    time: string;
    unread: number;
    windowRemaining: string;
    assignedTo: string;
    status: 'open' | 'bot_handled' | 'resolved';
};

export default function TeamInbox() {
    const [threads, setThreads] = useState<ChatThread[]>([
        {
            id: '1',
            contactName: 'Rahul Patel',
            phone: '+91 98250 12345',
            lastMessage: 'Can you please share the syllabus for the Laravel course?',
            time: '2m ago',
            unread: 1,
            windowRemaining: '23h 48m',
            assignedTo: 'Bhavesh Sathwara',
            status: 'open',
        },
        {
            id: '2',
            contactName: 'Priya Sharma',
            phone: '+91 94280 67890',
            lastMessage: 'Got the fees details, thank you!',
            time: '18m ago',
            unread: 0,
            windowRemaining: '22h 15m',
            assignedTo: 'Bot Handled',
            status: 'bot_handled',
        },
        {
            id: '3',
            contactName: 'Apex Dental Inquiries',
            phone: '+91 79840 54321',
            lastMessage: 'Appointment booked for tomorrow 4:00 PM',
            time: '1h ago',
            unread: 0,
            windowRemaining: '20h 30m',
            assignedTo: 'Bot Handled',
            status: 'resolved',
        },
    ]);

    const [selectedThread, setSelectedThread] = useState<ChatThread>(threads[0]);
    const [messages, setMessages] = useState([
        { id: 'm1', sender: 'contact', text: 'Hello, I saw your post on LinkedIn regarding web development courses.', time: '11:10 AM' },
        { id: 'm2', sender: 'bot', text: 'Hello Rahul! Welcome to Sathwara InfoTech. How can we assist you today?', time: '11:10 AM' },
        { id: 'm3', sender: 'contact', text: 'Can you please share the syllabus for the Laravel course?', time: '11:12 AM' },
    ]);
    const [replyText, setReplyText] = useState('');

    const handleSendReply = (e: React.FormEvent) => {
        e.preventDefault();
        if (!replyText.trim()) return;

        setMessages([
            ...messages,
            {
                id: Date.now().toString(),
                sender: 'agent',
                text: replyText.trim(),
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
        ]);
        setReplyText('');
    };

    return (
        <>
            <Head title="Live WhatsApp Team Inbox" />

            <div className="flex h-[calc(100vh-65px)] flex-col">
                {/* 3-Pane WhatsApp Inbox Layout */}
                <div className="grid h-full grid-cols-12 overflow-hidden border-t border-sidebar-border/50">
                    {/* Left Pane: Conversations List (4 Cols) */}
                    <div className="col-span-12 md:col-span-4 lg:col-span-3 border-r border-sidebar-border/60 flex flex-col bg-card">
                        <div className="p-3 border-b border-sidebar-border/50 space-y-2">
                            <div className="flex items-center justify-between">
                                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                                    <MessageSquare className="size-4 text-emerald-600" />
                                    Conversations
                                </h2>
                                <Badge variant="secondary" className="text-xs">
                                    {threads.length} active
                                </Badge>
                            </div>
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Search by name, +91 number..."
                                    className="w-full rounded-md border border-input bg-background pl-8 pr-3 py-1.5 text-xs focus:outline-none"
                                />
                            </div>
                        </div>

                        {/* Thread List */}
                        <div className="flex-1 overflow-y-auto divide-y divide-sidebar-border/30">
                            {threads.map((thread) => {
                                const isSelected = thread.id === selectedThread.id;
                                return (
                                    <div
                                        key={thread.id}
                                        onClick={() => setSelectedThread(thread)}
                                        className={`p-3 cursor-pointer transition-colors ${
                                            isSelected ? 'bg-emerald-500/10 border-l-4 border-l-emerald-600' : 'hover:bg-muted/40'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-semibold text-xs text-foreground truncate max-w-[140px]">
                                                {thread.contactName}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground">{thread.time}</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground truncate mb-1.5">
                                            {thread.lastMessage}
                                        </p>
                                        <div className="flex items-center justify-between text-[10px]">
                                            <span className="text-muted-foreground font-mono">{thread.phone}</span>
                                            <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                                                <Clock className="size-3" /> {thread.windowRemaining}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Middle Pane: Active Chat Messages Thread (5-6 Cols) */}
                    <div className="col-span-12 md:col-span-8 lg:col-span-6 flex flex-col bg-[#efeae2] dark:bg-[#0b141a]">
                        {/* Thread Top Bar */}
                        <div className="flex items-center justify-between border-b border-sidebar-border/40 bg-card p-3">
                            <div className="flex items-center gap-2.5">
                                <div className="size-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                                    {selectedThread.contactName.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="text-xs font-bold leading-tight text-foreground">
                                        {selectedThread.contactName}
                                    </h3>
                                    <p className="text-[10px] text-muted-foreground font-mono">
                                        {selectedThread.phone}
                                    </p>
                                </div>
                            </div>

                            {/* 24h Window Badge */}
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs text-emerald-700 bg-emerald-50 border-emerald-500/30 gap-1">
                                    <Clock className="size-3" /> Window: {selectedThread.windowRemaining}
                                </Badge>
                                <Button size="sm" variant="outline" className="h-7 text-xs">
                                    Resolve
                                </Button>
                            </div>
                        </div>

                        {/* Message Bubbles Container */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {messages.map((m) => {
                                const isAgent = m.sender === 'agent';
                                const isBot = m.sender === 'bot';
                                const isContact = m.sender === 'contact';

                                return (
                                    <div
                                        key={m.id}
                                        className={`flex flex-col max-w-[75%] rounded-lg p-3 text-xs shadow-xs ${
                                            isContact
                                                ? 'mr-auto bg-white dark:bg-[#202c33] text-foreground rounded-tl-none'
                                                : isBot
                                                ? 'ml-auto bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-foreground'
                                                : 'ml-auto bg-[#d9fdd3] dark:bg-[#005c4b] text-foreground rounded-tr-none'
                                        }`}
                                    >
                                        {isBot && (
                                            <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1 mb-1">
                                                <Bot className="size-3" /> Automated Bot Reply
                                            </span>
                                        )}
                                        {isAgent && (
                                            <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-200 mb-0.5">
                                                Bhavesh Sathwara (Agent)
                                            </span>
                                        )}
                                        <p className="whitespace-pre-wrap leading-relaxed text-[13px]">{m.text}</p>
                                        <div className="flex items-center justify-end gap-1 text-[9px] text-muted-foreground mt-1">
                                            <span>{m.time}</span>
                                            {!isContact && <CheckCheck className="size-3 text-emerald-600" />}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Reply Input Box */}
                        <form onSubmit={handleSendReply} className="p-3 bg-card border-t border-sidebar-border/50 flex items-center gap-2">
                            <input
                                type="text"
                                placeholder="Type your WhatsApp reply..."
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-xs focus:outline-none"
                            />
                            <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 h-8">
                                <Send className="size-3.5" />
                                Send
                            </Button>
                        </form>
                    </div>

                    {/* Right Pane: Contact Profile & Timeline (3 Cols) */}
                    <div className="hidden lg:col-span-3 border-l border-sidebar-border/60 bg-card p-4 space-y-4">
                        <div className="text-center pb-3 border-b border-sidebar-border/50">
                            <div className="mx-auto size-12 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-base mb-2">
                                {selectedThread.contactName.charAt(0)}
                            </div>
                            <h3 className="font-bold text-sm text-foreground">{selectedThread.contactName}</h3>
                            <p className="text-xs text-muted-foreground font-mono">{selectedThread.phone}</p>
                        </div>

                        <div className="space-y-3 text-xs">
                            <div>
                                <label className="text-[10px] uppercase font-bold text-muted-foreground">Assigned Agent</label>
                                <p className="font-medium text-foreground">{selectedThread.assignedTo}</p>
                            </div>
                            <div>
                                <label className="text-[10px] uppercase font-bold text-muted-foreground">Tags</label>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    <Badge variant="secondary" className="text-[10px]">Lead</Badge>
                                    <Badge variant="secondary" className="text-[10px]">Laravel Course</Badge>
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] uppercase font-bold text-muted-foreground">Consent / Opt-In Status</label>
                                <p className="text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
                                    Opted In (DPDP Compliant)
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
