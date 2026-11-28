import { useMemo, useState } from 'react';
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
    ChevronRight,
    ArrowUpRight,
    ExternalLink,
    RefreshCw,
    FileSpreadsheet,
    X,
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
    status: 'Resolved' | 'Auto-Closed' | 'Archived' | 'Active' | string;
    messagesCount: number;
    duration: string;
    closedAt: string;
    summary: string;
    transcript: { sender: 'contact' | 'agent' | 'bot'; text: string; time: string }[];
};

interface ChatHistoryProps {
    initialSessions?: HistorySession[];
}

export default function ChatHistory({ initialSessions = [] }: ChatHistoryProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSession, setSelectedSession] = useState<HistorySession | null>(null);

    const [sessions, setSessions] = useState<HistorySession[]>(initialSessions || []);

    const filteredSessions = useMemo(() => {
        if (!searchQuery.trim()) return sessions;
        const q = searchQuery.toLowerCase().trim();
        return sessions.filter((s) => {
            return (
                (s.contactName || '').toLowerCase().includes(q) ||
                (s.phone || '').includes(q) ||
                (s.channel || '').toLowerCase().includes(q) ||
                (s.agent || '').toLowerCase().includes(q) ||
                (s.summary || '').toLowerCase().includes(q)
            );
        });
    }, [sessions, searchQuery]);

    const sortedFilteredSessions = useMemo(() => {
        if (!searchQuery.trim()) return filteredSessions;
        const q = searchQuery.toLowerCase().trim();
        return [...filteredSessions].sort((a, b) => {
            const aStarts = (a.contactName || '').toLowerCase().startsWith(q) || (a.phone || '').startsWith(q);
            const bStarts = (b.contactName || '').toLowerCase().startsWith(q) || (b.phone || '').startsWith(q);
            if (aStarts && !bStarts) return -1;
            if (!aStarts && bStarts) return 1;
            return 0;
        });
    }, [filteredSessions, searchQuery]);

    const handleExportCSV = () => {
        const rows = [
            ['Contact Name', 'Phone', 'Channel', 'Agent', 'Duration', 'Messages Count', 'Status', 'Closed At', 'Summary'],
            ...sortedFilteredSessions.map((s) => [
                `"${s.contactName.replace(/"/g, '""')}"`,
                `"${s.phone}"`,
                `"${s.channel}"`,
                `"${s.agent}"`,
                `"${s.duration}"`,
                s.messagesCount,
                `"${s.status}"`,
                `"${s.closedAt}"`,
                `"${(s.summary || '').replace(/"/g, '""')}"`,
            ]),
        ];
        const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((r) => r.join(',')).join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `whatsapp_chat_history_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <>
            <Head title="Chat History & Archive - Sathwara InfoTech" />

            <div className="flex-1 flex flex-col gap-5 p-4 sm:p-6 min-w-0">
                {/* Compact Action Toolbar */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/60 pb-3.5">
                    <div className="flex items-center gap-2.5 flex-wrap">
                        <Badge variant="outline" className="text-xs bg-[#47b672]/10 text-[#28804c] dark:text-[#52c480] border-[#47b672]/30 font-semibold">
                            {sessions.length} Live Sessions
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                            Search, review, and export past customer conversations and agent interaction transcripts.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-9 border-border"
                            onClick={handleExportCSV}
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

                {/* Search Bar & Records Count */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-foreground">
                            Conversation History
                        </span>
                        <Badge variant="secondary" className="text-[11px] font-semibold px-2 py-0.5">
                            {sortedFilteredSessions.length} {sortedFilteredSessions.length === 1 ? 'Record' : 'Records'}
                        </Badge>
                    </div>

                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground pointer-events-none" />
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by contact, phone, or keyword..."
                            className="pl-8 pr-8 text-xs h-9 bg-card shadow-2xs"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery('')}
                                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
                            >
                                <X className="size-3.5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Sessions Table */}
                <Card className="border-border shadow-2xs overflow-hidden">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[720px] text-left text-xs">
                                <thead className="border-b border-border bg-muted/40 font-bold uppercase text-[10px] tracking-wider text-muted-foreground">
                                    <tr>
                                        <th className="py-3 px-4">Contact</th>
                                        <th className="py-3 px-4">Channel</th>
                                        <th className="py-3 px-4">Assigned Agent</th>
                                        <th className="py-3 px-4">Summary</th>
                                        <th className="py-3 px-4">Duration</th>
                                        <th className="py-3 px-4">Status</th>
                                        <th className="py-3 px-4 text-right">Transcript</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/60">
                                    {sortedFilteredSessions.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="py-12 text-center text-muted-foreground">
                                                <div className="flex flex-col items-center justify-center gap-2">
                                                    <div className="size-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                                                        <MessageSquare className="size-5" />
                                                    </div>
                                                    <p className="text-xs font-semibold text-foreground">
                                                        {searchQuery ? 'No matching conversations found' : 'No conversation history found'}
                                                    </p>
                                                    {searchQuery && (
                                                        <Button
                                                            variant="link"
                                                            size="sm"
                                                            onClick={() => setSearchQuery('')}
                                                            className="text-xs text-[#28804c] h-auto p-0"
                                                        >
                                                            Clear search query
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        sortedFilteredSessions.map((session) => (
                                            <tr key={session.id} className="hover:bg-muted/30 transition-colors">
                                                {/* Contact */}
                                                <td className="py-3.5 px-4 whitespace-nowrap">
                                                    <div className="font-semibold text-xs text-foreground">
                                                        {session.contactName}
                                                    </div>
                                                    <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
                                                        {session.phone}
                                                    </div>
                                                </td>

                                                {/* Channel */}
                                                <td className="py-3.5 px-4 whitespace-nowrap">
                                                    <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-1 text-[11px] font-semibold">
                                                        <MessageSquare className="size-3 text-emerald-600 shrink-0" />
                                                        <span className="truncate max-w-[140px]">{session.channel}</span>
                                                    </span>
                                                </td>

                                                {/* Assigned Agent */}
                                                <td className="py-3.5 px-4 whitespace-nowrap">
                                                    <div className="inline-flex items-center gap-1.5 text-xs text-foreground font-medium">
                                                        <div className="size-6 rounded-full bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                                                            <User className="size-3" />
                                                        </div>
                                                        <span>{session.agent}</span>
                                                    </div>
                                                </td>

                                                {/* Summary */}
                                                <td className="py-3.5 px-4 max-w-[200px] lg:max-w-xs">
                                                    <p className="text-xs text-foreground truncate leading-snug font-normal">
                                                        {session.summary}
                                                    </p>
                                                    <span className="inline-block text-[10px] text-muted-foreground mt-0.5">
                                                        {session.closedAt}
                                                    </span>
                                                </td>

                                                {/* Duration */}
                                                <td className="py-3.5 px-4 whitespace-nowrap">
                                                    <div className="text-xs font-semibold text-foreground font-mono">
                                                        {session.duration}
                                                    </div>
                                                    <div className="text-[10px] text-muted-foreground mt-0.5">
                                                        {session.messagesCount} {session.messagesCount === 1 ? 'msg' : 'msgs'}
                                                    </div>
                                                </td>

                                                {/* Status */}
                                                <td className="py-3.5 px-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                                                        session.status === 'Resolved'
                                                            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                                                            : session.status === 'Active'
                                                            ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                                                            : 'bg-muted text-muted-foreground border border-border'
                                                    }`}>
                                                        <span className={`size-1.5 rounded-full shrink-0 ${
                                                            session.status === 'Resolved'
                                                                ? 'bg-emerald-500'
                                                                : session.status === 'Active'
                                                                ? 'bg-blue-500 animate-pulse'
                                                                : 'bg-muted-foreground'
                                                        }`} />
                                                        {session.status}
                                                    </span>
                                                </td>

                                                {/* Transcript Action */}
                                                <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-8 text-xs font-semibold border-border hover:bg-[#47b672]/10 hover:text-[#28804c] hover:border-[#47b672]/30 shadow-2xs gap-1"
                                                        onClick={() => setSelectedSession(session)}
                                                    >
                                                        View Chat
                                                        <ChevronRight className="size-3.5" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Transcript Modal */}
            {selectedSession && (
                <Dialog open={!!selectedSession} onOpenChange={() => setSelectedSession(null)}>
                    <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-lg p-5 overflow-hidden">
                        <DialogHeader>
                            <DialogTitle className="text-sm font-semibold flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <MessageSquare className="size-4 text-[#47b672]" />
                                    {selectedSession.contactName}
                                </span>
                                <Badge variant="outline" className={`text-[10px] ${
                                    selectedSession.status === 'Resolved'
                                        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                        : selectedSession.status === 'Active'
                                        ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                                        : 'bg-muted text-muted-foreground border-border'
                                }`}>
                                    {selectedSession.status}
                                </Badge>
                            </DialogTitle>
                            <DialogDescription className="text-xs">
                                Phone: {selectedSession.phone} • Handled by {selectedSession.agent}
                            </DialogDescription>
                        </DialogHeader>

                        {/* WhatsApp Chat Bubbles */}
                        <div className="bg-[#efeae2] dark:bg-[#0c1317] p-3 rounded-lg space-y-2.5 max-h-[360px] overflow-y-auto overflow-x-hidden">
                            {selectedSession.transcript.map((msg, idx) => (
                                <div
                                    key={idx}
                                    className={`flex ${msg.sender === 'contact' ? 'justify-start' : 'justify-end'}`}
                                >
                                    <div
                                        className={`max-w-[85%] rounded-lg p-2.5 text-xs shadow-2xs whitespace-pre-wrap break-words [overflow-wrap:anywhere] [word-break:break-word] ${
                                            msg.sender === 'contact'
                                                ? 'bg-white text-gray-900 dark:bg-[#202c33] dark:text-gray-100 rounded-tl-none border border-black/5'
                                                : msg.sender === 'bot'
                                                ? 'bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-200'
                                                : 'bg-[#d9fdd3] text-gray-900 dark:bg-[#005c4b] dark:text-gray-100 rounded-tr-none'
                                        }`}
                                    >
                                        <p className="break-words [overflow-wrap:anywhere] [word-break:break-word]">{msg.text}</p>
                                        <span className="block text-[9px] text-right text-muted-foreground mt-1">
                                            {msg.time}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="pt-2 flex justify-between items-center text-xs border-t border-border/50">
                            <span className="text-muted-foreground text-[11px] font-medium">
                                {selectedSession.transcript.length} {selectedSession.transcript.length === 1 ? 'message' : 'messages'} recorded
                            </span>
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
