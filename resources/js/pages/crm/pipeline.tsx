import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    Kanban,
    Plus,
    Search,
    IndianRupee,
    Calendar,
    Phone,
    ArrowRight,
    Filter,
    CheckCircle2,
    Clock,
    AlertCircle,
    User,
    Sparkles,
    Trash2,
    MessageSquare,
    MoreVertical,
    TrendingUp,
    Briefcase,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Lead {
    id: string;
    contact_name: string;
    contact_phone: string;
    stage: string;
    deal_value: number;
    followup_date: string | null;
    lead_source: string;
    city: string;
    email: string;
    last_message_at: string;
}

interface StageStats {
    count: number;
    total_value: number;
}

interface PipelineProps {
    leads: Lead[];
    stages: string[];
    stageStats: Record<string, StageStats>;
    teamUsers: Array<{ id: number; name: string; email: string }>;
    totalPipelineValue: number;
}

const STAGE_CONFIG: Record<string, { color: string; border: string; bg: string; badge: string }> = {
    New: {
        color: 'text-blue-500',
        border: 'border-blue-500/30',
        bg: 'bg-blue-500/5',
        badge: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
    },
    Contacted: {
        color: 'text-indigo-500',
        border: 'border-indigo-500/30',
        bg: 'bg-indigo-500/5',
        badge: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400',
    },
    Interested: {
        color: 'text-purple-500',
        border: 'border-purple-500/30',
        bg: 'bg-purple-500/5',
        badge: 'bg-purple-500/15 text-purple-600 dark:text-purple-400',
    },
    Qualified: {
        color: 'text-cyan-500',
        border: 'border-cyan-500/30',
        bg: 'bg-cyan-500/5',
        badge: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400',
    },
    Negotiation: {
        color: 'text-amber-500',
        border: 'border-amber-500/30',
        bg: 'bg-amber-500/5',
        badge: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
    },
    Won: {
        color: 'text-emerald-500',
        border: 'border-emerald-500/30',
        bg: 'bg-emerald-500/5',
        badge: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    },
    Lost: {
        color: 'text-rose-500',
        border: 'border-rose-500/30',
        bg: 'bg-rose-500/5',
        badge: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
    },
};

export default function PipelinePage({
    leads: initialLeads = [],
    stages = ['New', 'Contacted', 'Interested', 'Qualified', 'Negotiation', 'Won', 'Lost'],
    stageStats: initialStats = {},
    teamUsers = [],
    totalPipelineValue = 0,
}: PipelineProps) {
    const [leads, setLeads] = useState<Lead[]>(initialLeads);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSource, setSelectedSource] = useState('all');
    const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
    const [dragOverStage, setDragOverStage] = useState<string | null>(null);

    // Add Lead Modal State
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [newLead, setNewLead] = useState({
        name: '',
        phone: '',
        stage: 'New',
        deal_value: '',
        followup_date: '',
        lead_source: 'WhatsApp Inbound',
        city: '',
        email: '',
    });

    // Edit Deal Modal State
    const [editLead, setEditLead] = useState<Lead | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);

    // Sync on external props change
    React.useEffect(() => {
        setLeads(initialLeads);
    }, [initialLeads]);

    // Format currency in Indian Rupees (₹)
    const formatINR = (val: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(val || 0);
    };

    // Filter leads
    const filteredLeads = leads.filter((lead) => {
        const matchesSearch =
            lead.contact_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lead.contact_phone.includes(searchTerm) ||
            lead.city.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSource = selectedSource === 'all' || lead.lead_source === selectedSource;
        return matchesSearch && matchesSource;
    });

    // Drag and Drop handlers
    const handleDragStart = (e: React.DragEvent, leadId: string) => {
        e.dataTransfer.setData('text/plain', leadId);
        setDraggedLeadId(leadId);
    };

    const handleDragOver = (e: React.DragEvent, stage: string) => {
        e.preventDefault();
        setDragOverStage(stage);
    };

    const handleDragLeave = () => {
        setDragOverStage(null);
    };

    const handleDrop = (e: React.DragEvent, targetStage: string) => {
        e.preventDefault();
        setDragOverStage(null);
        const leadId = e.dataTransfer.getData('text/plain') || draggedLeadId;
        if (!leadId) return;

        const lead = leads.find((l) => l.id === leadId);
        if (!lead || lead.stage === targetStage) return;

        // Optimistic UI update
        setLeads((prev) =>
            prev.map((l) => (l.id === leadId ? { ...l, stage: targetStage } : l))
        );

        // Server update
        router.post(
            '/crm/pipeline/move',
            {
                conversation_id: leadId,
                stage: targetStage,
            },
            {
                preserveScroll: true,
                preserveState: true,
            }
        );
        setDraggedLeadId(null);
    };

    // Quick stage change via dropdown
    const handleQuickMove = (leadId: string, newStage: string) => {
        setLeads((prev) =>
            prev.map((l) => (l.id === leadId ? { ...l, stage: newStage } : l))
        );
        router.post(
            '/crm/pipeline/move',
            {
                conversation_id: leadId,
                stage: newStage,
            },
            { preserveScroll: true }
        );
    };

    // Save New Lead
    const handleAddLead = (e: React.FormEvent) => {
        e.preventDefault();
        router.post(
            '/crm/pipeline/lead',
            {
                name: newLead.name,
                phone: newLead.phone,
                stage: newLead.stage,
                deal_value: newLead.deal_value ? parseFloat(newLead.deal_value) : 0,
                followup_date: newLead.followup_date || null,
                lead_source: newLead.lead_source,
                city: newLead.city,
                email: newLead.email,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsAddOpen(false);
                    setNewLead({
                        name: '',
                        phone: '',
                        stage: 'New',
                        deal_value: '',
                        followup_date: '',
                        lead_source: 'WhatsApp Inbound',
                        city: '',
                        email: '',
                    });
                },
            }
        );
    };

    // Save Edit Deal
    const handleSaveEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editLead) return;

        router.post(
            '/crm/pipeline/move',
            {
                conversation_id: editLead.id,
                stage: editLead.stage,
                deal_value: editLead.deal_value,
                followup_date: editLead.followup_date,
            },
            {
                preserveScroll: true,
                onSuccess: () => setIsEditOpen(false),
            }
        );
    };

    // Delete lead
    const handleDeleteLead = (id: string) => {
        if (!confirm('Are you sure you want to remove this lead from the pipeline?')) return;
        router.delete(`/crm/pipeline/lead/${id}`, { preserveScroll: true });
    };

    // Follow-up status check
    const getFollowupBadge = (dateStr: string | null) => {
        if (!dateStr) return null;
        const target = new Date(dateStr);
        const now = new Date();
        const diffDays = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-rose-600 bg-rose-500/10 px-2 py-0.5 rounded-full">
                    <AlertCircle className="size-3" /> Overdue
                </span>
            );
        } else if (diffDays === 0) {
            return (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full">
                    <Clock className="size-3" /> Due Today
                </span>
            );
        } else {
            return (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    <Calendar className="size-3" /> in {diffDays}d
                </span>
            );
        }
    };

    const sources = Array.from(new Set(leads.map((l) => l.lead_source).filter(Boolean)));
    const wonCount = leads.filter((l) => l.stage === 'Won').length;
    const winRate = leads.length > 0 ? Math.round((wonCount / leads.length) * 100) : 0;

    return (
        <>
            <Head title="CRM Lead Pipeline | Sathwara InfoTech" />

            <div className="flex flex-1 flex-col gap-4 p-4 sm:p-6 max-w-[1600px] mx-auto w-full font-sans">
                {/* Header Banner */}
                <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-background to-card p-4 sm:p-6 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-md">
                                <Kanban className="size-6" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                                        CRM Lead Pipeline
                                    </h1>
                                    <Badge variant="outline" className="text-xs font-bold border-primary/40 text-primary">
                                        Kanban V2
                                    </Badge>
                                </div>
                                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                                    Drag &amp; drop WhatsApp inquiries through your sales funnel with deal values (₹) and follow-up schedules.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2.5">
                            <Button
                                onClick={() => setIsAddOpen(true)}
                                className="h-9 px-4 text-xs font-semibold gap-1.5 shadow-sm"
                            >
                                <Plus className="size-4" />
                                Add New Lead
                            </Button>
                        </div>
                    </div>

                    {/* Quick KPI Bar */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-border/60">
                        <div className="flex items-center gap-2.5">
                            <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                                <IndianRupee className="size-4" />
                            </div>
                            <div>
                                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                    Pipeline Value
                                </p>
                                <p className="text-base sm:text-lg font-bold text-foreground">
                                    {formatINR(totalPipelineValue)}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2.5">
                            <div className="flex size-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
                                <Briefcase className="size-4" />
                            </div>
                            <div>
                                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                    Active Deals
                                </p>
                                <p className="text-base sm:text-lg font-bold text-foreground">
                                    {leads.length} Contacts
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2.5">
                            <div className="flex size-9 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600">
                                <TrendingUp className="size-4" />
                            </div>
                            <div>
                                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                    Win Rate
                                </p>
                                <p className="text-base sm:text-lg font-bold text-foreground">
                                    {winRate}% Won ({wonCount})
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2.5">
                            <div className="flex size-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
                                <Clock className="size-4" />
                            </div>
                            <div>
                                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                    Avg Follow-up
                                </p>
                                <p className="text-base sm:text-lg font-bold text-foreground">
                                    ~2.4 Days
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filter & Search Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card border border-border/80 rounded-xl p-3 shadow-2xs">
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search lead name, phone, city..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-8 pl-9 pr-3 rounded-lg border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Filter className="size-3.5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground font-medium">Source:</span>
                        <select
                            value={selectedSource}
                            onChange={(e) => setSelectedSource(e.target.value)}
                            className="h-8 px-2.5 rounded-lg border border-border bg-background text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                            <option value="all">All Sources</option>
                            {sources.map((s) => (
                                <option key={s} value={s}>
                                    {s}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Kanban Board Container (Horizontal Scroll) */}
                <div className="overflow-x-auto pb-4 pt-1 [scrollbar-width:thin]">
                    <div className="flex items-start gap-3.5 min-w-[1400px]">
                        {stages.map((stage) => {
                            const config = STAGE_CONFIG[stage] || STAGE_CONFIG.New;
                            const stageLeads = filteredLeads.filter((l) => l.stage === stage);
                            const stageSum = stageLeads.reduce((acc, curr) => acc + (curr.deal_value || 0), 0);
                            const isOver = dragOverStage === stage;

                            return (
                                <div
                                    key={stage}
                                    onDragOver={(e) => handleDragOver(e, stage)}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleDrop(e, stage)}
                                    className={`flex flex-col flex-1 min-w-[280px] max-w-[320px] rounded-xl border ${
                                        isOver ? 'border-primary ring-2 ring-primary/30 bg-primary/5' : config.border
                                    } bg-card/60 backdrop-blur-xs transition-all duration-200 shadow-2xs`}
                                >
                                    {/* Column Header */}
                                    <div className="p-3 border-b border-border/60 bg-muted/30 rounded-t-xl">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className={`size-2.5 rounded-full ${config.bg} ring-2 ring-current ${config.color}`} />
                                                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                                                    {stage}
                                                </h3>
                                            </div>
                                            <Badge variant="secondary" className="text-[10px] font-bold px-1.5 py-0.5">
                                                {stageLeads.length}
                                            </Badge>
                                        </div>
                                        <div className="mt-1 flex items-baseline justify-between text-[11px] text-muted-foreground font-medium">
                                            <span>Total Value</span>
                                            <span className="font-bold text-foreground">
                                                {formatINR(stageSum)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Column Cards List */}
                                    <div className="p-2.5 flex flex-col gap-2.5 min-h-[420px] max-h-[calc(100vh-280px)] overflow-y-auto">
                                        {stageLeads.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center h-32 rounded-lg border border-dashed border-border/80 text-muted-foreground/60 p-4 text-center">
                                                <p className="text-[11px] font-medium">No leads in {stage}</p>
                                                <p className="text-[10px] mt-0.5">Drag leads here</p>
                                            </div>
                                        ) : (
                                            stageLeads.map((lead) => {
                                                const initials = lead.contact_name
                                                    .split(' ')
                                                    .map((n) => n[0])
                                                    .join('')
                                                    .toUpperCase()
                                                    .slice(0, 2);

                                                return (
                                                    <div
                                                        key={lead.id}
                                                        draggable
                                                        onDragStart={(e) => handleDragStart(e, lead.id)}
                                                        className="group relative rounded-xl border border-border bg-card p-3 shadow-2xs hover:shadow-md hover:border-primary/50 cursor-grab active:cursor-grabbing transition-all duration-200 select-none"
                                                    >
                                                        {/* Top Row: Name, Phone & Menu */}
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="flex items-center gap-2">
                                                                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[11px] font-bold">
                                                                    {initials || 'U'}
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                                                                        {lead.contact_name}
                                                                    </p>
                                                                    <p className="text-[11px] text-muted-foreground font-mono flex items-center gap-1">
                                                                        <Phone className="size-2.5" />
                                                                        {lead.contact_phone}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="size-6 text-muted-foreground hover:text-foreground"
                                                                    >
                                                                        <MoreVertical className="size-3.5" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end" className="text-xs w-44">
                                                                    <DropdownMenuItem
                                                                        onClick={() => {
                                                                            setEditLead(lead);
                                                                            setIsEditOpen(true);
                                                                        }}
                                                                    >
                                                                        Edit Deal Value &amp; Schedule
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem asChild>
                                                                        <Link
                                                                            href={`/inbox?phone=${encodeURIComponent(lead.contact_phone)}`}
                                                                            className="flex items-center gap-2"
                                                                        >
                                                                            <MessageSquare className="size-3.5" />
                                                                            Open in Shared Inbox
                                                                        </Link>
                                                                    </DropdownMenuItem>
                                                                    <div className="my-1 border-t border-border" />
                                                                    <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase">
                                                                        Move to Stage:
                                                                    </div>
                                                                    {stages.map((st) => (
                                                                        <DropdownMenuItem
                                                                            key={st}
                                                                            disabled={st === lead.stage}
                                                                            onClick={() => handleQuickMove(lead.id, st)}
                                                                            className="text-xs"
                                                                        >
                                                                            Move to {st}
                                                                        </DropdownMenuItem>
                                                                    ))}
                                                                    <div className="my-1 border-t border-border" />
                                                                    <DropdownMenuItem
                                                                        onClick={() => handleDeleteLead(lead.id)}
                                                                        className="text-rose-600 focus:text-rose-600"
                                                                    >
                                                                        <Trash2 className="size-3.5 mr-1" />
                                                                        Delete Lead
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </div>

                                                        {/* Deal Value & Source */}
                                                        <div className="mt-2.5 flex items-center justify-between border-t border-border/50 pt-2">
                                                            <div className="flex items-center gap-1">
                                                                <IndianRupee className="size-3 text-emerald-600" />
                                                                <span className="text-xs font-black text-emerald-700 dark:text-emerald-400">
                                                                    {formatINR(lead.deal_value)}
                                                                </span>
                                                            </div>
                                                            <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                                                {lead.lead_source}
                                                            </span>
                                                        </div>

                                                        {/* Follow-up Badge & Quick Chat */}
                                                        <div className="mt-2 flex items-center justify-between gap-1 pt-1.5 border-t border-border/40">
                                                            <div className="flex items-center gap-1">
                                                                {getFollowupBadge(lead.followup_date)}
                                                            </div>

                                                            <Link
                                                                href={`/inbox?phone=${encodeURIComponent(lead.contact_phone)}`}
                                                                className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1"
                                                            >
                                                                Chat
                                                                <ArrowRight className="size-2.5" />
                                                            </Link>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Dialog: Add New Lead */}
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogContent className="sm:max-w-[480px]">
                        <DialogHeader>
                            <DialogTitle className="text-base font-bold flex items-center gap-2">
                                <Plus className="size-4 text-primary" />
                                Add New Lead to Pipeline
                            </DialogTitle>
                            <DialogDescription className="text-xs">
                                Create a prospect record with an expected deal value and follow-up reminder.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleAddLead} className="space-y-3 pt-2">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-semibold text-foreground">Contact Name *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Rajesh Sharma"
                                        value={newLead.name}
                                        onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                                        className="mt-1 w-full h-8 px-2.5 rounded-lg border border-border bg-background text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-foreground">WhatsApp Phone *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="+919825012345"
                                        value={newLead.phone}
                                        onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                                        className="mt-1 w-full h-8 px-2.5 rounded-lg border border-border bg-background text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-semibold text-foreground">Pipeline Stage</label>
                                    <select
                                        value={newLead.stage}
                                        onChange={(e) => setNewLead({ ...newLead, stage: e.target.value })}
                                        className="mt-1 w-full h-8 px-2.5 rounded-lg border border-border bg-background text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                                    >
                                        {stages.map((st) => (
                                            <option key={st} value={st}>
                                                {st}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-foreground">Expected Deal Value (₹)</label>
                                    <input
                                        type="number"
                                        step="500"
                                        placeholder="25000"
                                        value={newLead.deal_value}
                                        onChange={(e) => setNewLead({ ...newLead, deal_value: e.target.value })}
                                        className="mt-1 w-full h-8 px-2.5 rounded-lg border border-border bg-background text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-semibold text-foreground">Follow-up Schedule</label>
                                    <input
                                        type="datetime-local"
                                        value={newLead.followup_date}
                                        onChange={(e) => setNewLead({ ...newLead, followup_date: e.target.value })}
                                        className="mt-1 w-full h-8 px-2.5 rounded-lg border border-border bg-background text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-foreground">Lead Source</label>
                                    <select
                                        value={newLead.lead_source}
                                        onChange={(e) => setNewLead({ ...newLead, lead_source: e.target.value })}
                                        className="mt-1 w-full h-8 px-2.5 rounded-lg border border-border bg-background text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                                    >
                                        <option value="WhatsApp Inbound">WhatsApp Inbound</option>
                                        <option value="Website Inbound">Website Inbound</option>
                                        <option value="WhatsApp Broadcast">WhatsApp Broadcast</option>
                                        <option value="Catalog Inbound">Catalog Inbound</option>
                                        <option value="Referral">Referral</option>
                                        <option value="Google Ad Campaign">Google Ad Campaign</option>
                                        <option value="Cold Outreach">Cold Outreach</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-semibold text-foreground">City</label>
                                    <input
                                        type="text"
                                        placeholder="Ahmedabad / Surat"
                                        value={newLead.city}
                                        onChange={(e) => setNewLead({ ...newLead, city: e.target.value })}
                                        className="mt-1 w-full h-8 px-2.5 rounded-lg border border-border bg-background text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-foreground">Email (Optional)</label>
                                    <input
                                        type="email"
                                        placeholder="client@example.com"
                                        value={newLead.email}
                                        onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                                        className="mt-1 w-full h-8 px-2.5 rounded-lg border border-border bg-background text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                                    />
                                </div>
                            </div>

                            <DialogFooter className="pt-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsAddOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" size="sm" className="gap-1.5">
                                    <CheckCircle2 className="size-3.5" />
                                    Save Lead to Pipeline
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Dialog: Edit Deal Value & Follow-up */}
                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                    <DialogContent className="sm:max-w-[420px]">
                        <DialogHeader>
                            <DialogTitle className="text-base font-bold flex items-center gap-2">
                                <IndianRupee className="size-4 text-emerald-600" />
                                Edit Deal &amp; Schedule
                            </DialogTitle>
                            <DialogDescription className="text-xs">
                                Update stage, expected deal revenue (₹), or next follow-up date for{' '}
                                <strong className="text-foreground">{editLead?.contact_name}</strong>.
                            </DialogDescription>
                        </DialogHeader>

                        {editLead && (
                            <form onSubmit={handleSaveEdit} className="space-y-3 pt-2">
                                <div>
                                    <label className="text-xs font-semibold text-foreground">Current Stage</label>
                                    <select
                                        value={editLead.stage}
                                        onChange={(e) => setEditLead({ ...editLead, stage: e.target.value })}
                                        className="mt-1 w-full h-8 px-2.5 rounded-lg border border-border bg-background text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                                    >
                                        {stages.map((st) => (
                                            <option key={st} value={st}>
                                                {st}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-foreground">Expected Deal Value (₹)</label>
                                    <input
                                        type="number"
                                        step="500"
                                        value={editLead.deal_value}
                                        onChange={(e) =>
                                            setEditLead({ ...editLead, deal_value: parseFloat(e.target.value) || 0 })
                                        }
                                        className="mt-1 w-full h-8 px-2.5 rounded-lg border border-border bg-background text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-foreground">Follow-up Date &amp; Time</label>
                                    <input
                                        type="datetime-local"
                                        value={editLead.followup_date || ''}
                                        onChange={(e) =>
                                            setEditLead({ ...editLead, followup_date: e.target.value })
                                        }
                                        className="mt-1 w-full h-8 px-2.5 rounded-lg border border-border bg-background text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                                    />
                                </div>

                                <DialogFooter className="pt-3">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setIsEditOpen(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="submit" size="sm" className="gap-1.5">
                                        Update Deal
                                    </Button>
                                </DialogFooter>
                            </form>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}
