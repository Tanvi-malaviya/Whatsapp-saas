import { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import {
    Kanban,
    Plus,
    DollarSign,
    Phone,
    MessageSquare,
    ChevronRight,
    ArrowRight,
    Clock,
    User,
    Tag,
    MoreVertical,
    CheckCircle2,
    TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type LeadCard = {
    id: string;
    contactName: string;
    phone: string;
    dealValue: number;
    interest: string;
    stage: 'New' | 'Qualified' | 'Proposal' | 'Won' | 'Lost';
    daysInStage: number;
    lastActive: string;
    lastMessage?: string;
    status?: string;
};

const STAGES: { id: LeadCard['stage']; label: string; color: string }[] = [
    { id: 'New', label: '🎯 New Lead', color: 'border-sky-500/40 bg-sky-500/5' },
    { id: 'Qualified', label: '⚡ Qualified', color: 'border-indigo-500/40 bg-indigo-500/5' },
    { id: 'Proposal', label: '📑 Proposal Sent', color: 'border-amber-500/40 bg-amber-500/5' },
    { id: 'Won', label: '🏆 Deal Won', color: 'border-emerald-500/40 bg-emerald-500/5' },
    { id: 'Lost', label: '❌ Deal Lost', color: 'border-rose-500/40 bg-rose-500/5' },
];

interface ChatStagesProps {
    initialLeads?: LeadCard[];
}

export default function ChatStages({ initialLeads = [] }: ChatStagesProps) {
    const defaultMockLeads: LeadCard[] = [
        {
            id: '1',
            contactName: 'Bhavesh Sathwara',
            phone: '+91 79978 81665',
            dealValue: 14999,
            interest: 'WhatsApp SaaS Annual License',
            stage: 'Qualified',
            daysInStage: 2,
            lastActive: '10m ago',
        },
        {
            id: '2',
            contactName: 'Rahul Patel',
            phone: '+91 98250 12345',
            dealValue: 4999,
            interest: 'Full Stack Laravel Course',
            stage: 'New',
            daysInStage: 1,
            lastActive: '1h ago',
        },
    ];

    const [leads, setLeads] = useState<LeadCard[]>(
        initialLeads && initialLeads.length > 0 ? initialLeads : defaultMockLeads
    );

    const moveStage = async (leadId: string, direction: 'next' | 'prev') => {
        const lead = leads.find((l) => l.id === leadId);
        if (!lead) return;

        const currentIndex = STAGES.findIndex((s) => s.id === lead.stage);
        const targetIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
        if (targetIndex < 0 || targetIndex >= STAGES.length) return;

        const targetStage = STAGES[targetIndex].id;

        // Optimistic UI update
        setLeads((prev) =>
            prev.map((l) => (l.id === leadId ? { ...l, stage: targetStage, daysInStage: 0 } : l))
        );

        // Persist to backend database
        try {
            await fetch('/chat/stages/update-stage', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN':
                        (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: JSON.stringify({
                    conversation_id: leadId,
                    stage: targetStage,
                }),
            });
        } catch (e) {
            console.error('Error updating stage:', e);
        }
    };

    const totalPipelineValue = leads.reduce((sum, l) => sum + (l.stage !== 'Won' && l.stage !== 'Lost' ? l.dealValue : 0), 0);
    const wonValue = leads.filter(l => l.stage === 'Won').reduce((sum, l) => sum + l.dealValue, 0);

    return (
        <>
            <Head title="Chat Stages Pipeline - Sathwara InfoTech" />

            <div className="flex-1 flex flex-col gap-6 p-4 sm:p-6 lg:p-8 min-w-0">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                                <Kanban className="size-5 text-[#47b672]" />
                                Chat Lead Stages &amp; Pipeline
                            </h2>
                            <Badge variant="outline" className="text-xs bg-[#47b672]/10 text-[#28804c] dark:text-[#52c480] border-[#47b672]/30">
                                Kanban CRM
                            </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Track every WhatsApp prospect from initial message to paid conversion.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-right shadow-2xs">
                            <span className="text-muted-foreground text-[10px] block">Active Pipeline</span>
                            <span className="font-bold text-foreground">₹{totalPipelineValue.toLocaleString()}</span>
                        </div>

                        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs text-right shadow-2xs">
                            <span className="text-emerald-600 text-[10px] block">Won Revenue</span>
                            <span className="font-bold text-emerald-600">₹{wonValue.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* Kanban Pipeline Board (Horizontal Scrollable) */}
                <div className="flex gap-4 overflow-x-auto pb-4 items-start">
                    {STAGES.map((col) => {
                        const colLeads = leads.filter(l => l.stage === col.id);
                        const colTotal = colLeads.reduce((acc, l) => acc + l.dealValue, 0);

                        return (
                            <div
                                key={col.id}
                                className="w-72 shrink-0 rounded-xl border border-border bg-card shadow-2xs flex flex-col max-h-[calc(100vh-210px)]"
                            >
                                {/* Column Header */}
                                <div className={`p-3 border-b border-border/80 rounded-t-xl ${col.color}`}>
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-bold text-xs text-foreground truncate">
                                            {col.label}
                                        </h3>
                                        <Badge variant="outline" className="text-[10px] bg-background/80 font-bold">
                                            {colLeads.length}
                                        </Badge>
                                    </div>
                                    <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground font-mono">
                                        <span>Total:</span>
                                        <span className="font-semibold text-foreground">₹{colTotal.toLocaleString()}</span>
                                    </div>
                                </div>

                                {/* Cards List */}
                                <div className="p-2 space-y-2 overflow-y-auto flex-1">
                                    {colLeads.map((lead) => (
                                        <div
                                            key={lead.id}
                                            className="rounded-lg border border-border bg-background p-3 shadow-2xs hover:border-[#47b672]/60 transition-all space-y-2"
                                        >
                                            <div className="flex items-start justify-between gap-1">
                                                <div>
                                                    <h4 className="font-semibold text-xs text-foreground">
                                                        {lead.contactName}
                                                    </h4>
                                                    <span className="text-[10px] text-muted-foreground font-mono">
                                                        {lead.phone}
                                                    </span>
                                                </div>
                                                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                                    ₹{lead.dealValue.toLocaleString()}
                                                </span>
                                            </div>

                                            <div className="rounded bg-muted/40 p-1.5 text-[10px] text-muted-foreground">
                                                {lead.interest}
                                            </div>

                                            <div className="flex items-center justify-between pt-1 border-t border-border/60 text-[10px] text-muted-foreground">
                                                <span>In stage: {lead.daysInStage}d</span>
                                                <span>{lead.lastActive}</span>
                                            </div>

                                            {/* Action Buttons: Chat & Move */}
                                            <div className="flex items-center justify-between pt-1 gap-1">
                                                <Button
                                                    asChild
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-6 text-[10px] px-2 text-[#28804c] dark:text-[#52c480] border-[#47b672]/30"
                                                >
                                                    <Link href="/inbox">
                                                        <MessageSquare className="size-2.5 mr-1" />
                                                        Chat
                                                    </Link>
                                                </Button>

                                                <div className="flex items-center gap-1">
                                                    {STAGES.findIndex(s => s.id === lead.stage) > 0 && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-6 w-6 p-0 text-muted-foreground"
                                                            onClick={() => moveStage(lead.id, 'prev')}
                                                            title="Move backward"
                                                        >
                                                            ‹
                                                        </Button>
                                                    )}
                                                    {STAGES.findIndex(s => s.id === lead.stage) < STAGES.length - 1 && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-6 w-6 p-0 text-[#47b672] font-bold"
                                                            onClick={() => moveStage(lead.id, 'next')}
                                                            title="Advance stage"
                                                        >
                                                            ›
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {colLeads.length === 0 && (
                                        <div className="py-8 text-center text-xs text-muted-foreground">
                                            No leads in this stage
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </>
    );
}
