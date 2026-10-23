import { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import {
    Archive,
    Search,
    Calendar,
    Download,
    CheckCircle2,
    Clock,
    User,
    MessageSquare,
    Filter,
    ChevronRight,
    ArrowUpRight,
    ExternalLink,
    RefreshCw,
    FileSpreadsheet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

type HistorySession = {
    id: string;
    contactName: string;
    phone: string;
    channel: string;
    agent: string;
    status: 'Resolved' | 'Auto-Closed' | 'Archived';
    messagesCount: number;
    duration: string;
    closedAt: string;
    summary: string;
    transcript: { sender: 'contact' | 'agent' | 'bot'; text: string; time: string }[];
};

export default function ChatHistory() {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [selectedSession, setSelectedSession] = useState<HistorySession | null>(null);

    const [sessions, setSessions] = useState<HistorySession[]>([
        {
            id: '1',
            contactName: 'Bhavesh Sathwara',
            phone: '+91 79978 81665',
            channel: 'DukanHisab',
            agent: 'Bhavesh (You)',
            status: 'Resolved',
            messagesCount: 14,
            duration: '18m',
            closedAt: 'Today, 10:45 AM',
            summary: 'Assisted customer with Meta Webhook URL configuration and WhatsApp verify token test.',
            transcript: [
                { sender: 'contact', text: 'Hello, need help connecting our business number.', time: '10:27 AM' },
                { sender: 'bot', text: 'Welcome to Sathwara InfoTech! Connecting you with our technical lead.', time: '10:27 AM' },
                { sender: 'agent', text: 'Hi Bhavesh, I am here to help. Your webhook is verified on dukanhisab.in.', time: '10:29 AM' },
                { sender: 'contact', text: 'Great, test message received on WhatsApp!', time: '10:42 AM' },
                { sender: 'agent', text: 'Glad to assist! Closing ticket.', time: '10:45 AM' },
            ],
        },
        {
            id: '2',
            contactName: 'Rahul Patel',
            phone: '+91 98250 12345',
            channel: 'DukanHisab',
            agent: 'Tanvi Malaviya',
            status: 'Resolved',
            messagesCount: 8,
            duration: '12m',
            closedAt: 'Yesterday, 4:15 PM',
            summary: 'Shared Full Stack Laravel Course syllabus PDF and batch timing details.',
            transcript: [
                { sender: 'contact', text: 'Course fees and duration please?', time: '4:03 PM' },
                { sender: 'agent', text: 'Sent syllabus PDF. Classes are Mon-Fri 10am-12pm.', time: '4:08 PM' },
                { sender: 'contact', text: 'Thank you, registering today.', time: '4:14 PM' },
            ],
        },
        {
            id: '3',
            contactName: 'Amit Shah (Surat)',
            phone: '+91 98790 54321',
            channel: 'Sathwara InfoTech',
            agent: 'Auto Bot',
            status: 'Auto-Closed',
            messagesCount: 4,
            duration: '24h',
            closedAt: 'Oct 21, 2026',
            summary: 'Inactivity timeout after bot delivered business address and pricing brochure.',
            transcript: [
                { sender: 'contact', text: 'location?', time: 'Oct 20, 2:10 PM' },
                { sender: 'bot', text: '📍 Office: Sathwara InfoTech, Ahmedabad, Gujarat.', time: 'Oct 20, 2:10 PM' },
            ],
        },
        {
            id: '4',
            contactName: 'Kiran Desai',
            phone: '+91 94260 78910',
            channel: 'DukanHisab',
            agent: 'Tanvi Malaviya',
            status: 'Archived',
            messagesCount: 22,
            duration: '45m',
            closedAt: 'Oct 19, 2026',
            summary: 'Annual SaaS subscription renewed & invoice #1042 dispatched via WhatsApp.',
            transcript: [
                { sender: 'contact', text: 'UPI payment completed for renewal.', time: 'Oct 19, 11:15 AM' },
                { sender: 'agent', text: 'Received ₹4,999. Invoice receipt attached.', time: 'Oct 19, 11:25 AM' },
            ],
        },
    ]);

    const filteredSessions = sessions.filter(s => {
        if (statusFilter !== 'ALL' && s.status !== statusFilter) return false;
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            return s.contactName.toLowerCase().includes(q) || s.phone.includes(q) || s.summary.toLowerCase().includes(q);
        }
        return true;
    });

    return (
        <>
            <Head title="Chat History & Archive - Sathwara InfoTech" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                                <Archive className="size-5 text-[#47b672]" />
                                Chat History &amp; Resolved Conversations
                            </h2>
                            <Badge variant="outline" className="text-xs bg-[#47b672]/10 text-[#28804c] dark:text-[#52c480] border-[#47b672]/30">
                                {sessions.length} Archived Sessions
                            </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Search, review, and export past customer conversations and agent interaction transcripts.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-9 border-border"
                            onClick={() => alert('Exporting full chat archive to CSV...')}
                        >
                            <FileSpreadsheet className="size-3.5 mr-1.5 text-emerald-600" />
                            Export CSV
                        </Button>
                        <Button
                            asChild
                            size="sm"
                            className="bg-[#47b672] hover:bg-[#3ca062] text-white text-xs h-9"
                        >
                            <Link href="/inbox">
                                <MessageSquare className="size-3.5 mr-1.5" />
                                Go to Live Inbox
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                        {['ALL', 'Resolved', 'Auto-Closed', 'Archived'].map((status) => (
                            <Button
                                key={status}
                                size="sm"
                                variant={statusFilter === status ? 'default' : 'outline'}
                                onClick={() => setStatusFilter(status)}
                                className={`text-xs h-8 ${
                                    statusFilter === status
                                        ? 'bg-[#47b672] hover:bg-[#3ca062] text-white'
                                        : 'text-muted-foreground'
                                }`}
                            >
                                {status === 'ALL' ? 'All Sessions' : status}
                            </Button>
                        ))}
                    </div>

                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by contact name, phone or keyword..."
                            className="pl-8 text-xs h-8"
                        />
                    </div>
                </div>

                {/* Sessions Table */}
                <Card className="border-border shadow-2xs">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="border-b border-border bg-muted/40 font-semibold text-muted-foreground">
                                    <tr>
                                        <th className="py-2.5 px-4">Contact</th>
                                        <th className="py-2.5 px-4">Channel</th>
                                        <th className="py-2.5 px-4">Assigned Agent</th>
                                        <th className="py-2.5 px-4">Summary</th>
                                        <th className="py-2.5 px-4">Duration</th>
                                        <th className="py-2.5 px-4">Status</th>
                                        <th className="py-2.5 px-4 text-right">Transcript</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/60">
                                    {filteredSessions.map((session) => (
                                        <tr key={session.id} className="hover:bg-muted/30">
                                            <td className="py-3 px-4">
                                                <div className="font-semibold text-foreground">
                                                    {session.contactName}
                                                </div>
                                                <div className="text-[11px] text-muted-foreground font-mono">
                                                    {session.phone}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                                    {session.channel}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-foreground flex items-center gap-1.5 pt-4">
                                                <User className="size-3 text-muted-foreground" />
                                                {session.agent}
                                            </td>
                                            <td className="py-3 px-4 max-w-xs">
                                                <p className="text-muted-foreground line-clamp-1 text-[11px]">
                                                    {session.summary}
                                                </p>
                                                <span className="text-[10px] text-muted-foreground/70">{session.closedAt}</span>
                                            </td>
                                            <td className="py-3 px-4 text-muted-foreground text-[11px] font-mono">
                                                {session.duration} ({session.messagesCount} msgs)
                                            </td>
                                            <td className="py-3 px-4">
                                                <Badge variant="outline" className={`text-[10px] ${
                                                    session.status === 'Resolved'
                                                        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                                        : session.status === 'Auto-Closed'
                                                        ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                                        : 'bg-muted text-muted-foreground border-border'
                                                }`}>
                                                    {session.status}
                                                </Badge>
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-7 text-xs text-[#28804c] dark:text-[#52c480] hover:underline"
                                                    onClick={() => setSelectedSession(session)}
                                                >
                                                    View Chat
                                                    <ChevronRight className="size-3.5 ml-1" />
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

            {/* Transcript Modal */}
            {selectedSession && (
                <Dialog open={!!selectedSession} onOpenChange={() => setSelectedSession(null)}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-sm font-semibold flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <MessageSquare className="size-4 text-[#47b672]" />
                                    {selectedSession.contactName}
                                </span>
                                <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                                    {selectedSession.status}
                                </Badge>
                            </DialogTitle>
                            <DialogDescription className="text-xs">
                                Phone: {selectedSession.phone} • Handled by {selectedSession.agent}
                            </DialogDescription>
                        </DialogHeader>

                        {/* WhatsApp Chat Bubbles */}
                        <div className="bg-[#efeae2] dark:bg-[#0c1317] p-3 rounded-lg space-y-2 max-h-80 overflow-y-auto">
                            {selectedSession.transcript.map((msg, idx) => (
                                <div
                                    key={idx}
                                    className={`flex ${msg.sender === 'contact' ? 'justify-start' : 'justify-end'}`}
                                >
                                    <div
                                        className={`max-w-[85%] rounded-lg p-2.5 text-xs shadow-2xs whitespace-pre-wrap ${
                                            msg.sender === 'contact'
                                                ? 'bg-white text-gray-900 dark:bg-[#202c33] dark:text-gray-100 rounded-tl-none border border-black/5'
                                                : msg.sender === 'bot'
                                                ? 'bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-200'
                                                : 'bg-[#d9fdd3] text-gray-900 dark:bg-[#005c4b] dark:text-gray-100 rounded-tr-none'
                                        }`}
                                    >
                                        <p>{msg.text}</p>
                                        <span className="block text-[9px] text-right text-muted-foreground mt-1">
                                            {msg.time}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="pt-2 flex justify-between items-center text-xs">
                            <span className="text-muted-foreground text-[11px]">{selectedSession.summary}</span>
                            <Button size="sm" variant="outline" onClick={() => setSelectedSession(null)} className="text-xs h-8">
                                Close
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </>
    );
}
