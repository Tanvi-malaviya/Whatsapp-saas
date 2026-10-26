import { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    Layers,
    Plus,
    Users,
    Send,
    Search,
    Trash2,
    CheckCircle2,
    Tag,
    AlertTriangle,
    Loader2,
    Eye,
    MessageSquare,
    AlertCircle,
    Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export type SegmentItem = {
    id: string;
    name: string;
    description: string;
    count: number;
    criteria: string;
    tags: string[];
    filterType: string;
    filterValue: string;
    lastBroadcast: string;
    isSystem?: boolean;
    updatedAt: string;
};

interface PreviewContact {
    id: string;
    name: string;
    phone: string;
    city: string;
    stage: string;
    consent: 'opted_in' | 'opted_out';
    lastMessage: string;
}

export interface TemplateItem {
    id: string;
    name: string;
    category: string;
    status: string;
    language: string;
    costEstimate: string;
    header?: string | null;
    body: string;
    buttons?: string[];
    exampleParams?: string[];
}

interface Props {
    initialSegments?: SegmentItem[];
    totalContacts?: number;
    templates?: TemplateItem[];
    channel?: {
        id: string;
        name: string;
        phoneNumber?: string;
        status: string;
    } | null;
}

export default function ContactSegments({
    initialSegments = [],
    totalContacts = 0,
    templates = [],
    channel,
}: Props) {
    const [searchQuery, setSearchQuery] = useState('');
    const [segments, setSegments] = useState<SegmentItem[]>(initialSegments);

    // Create Modal state
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [newName, setNewName] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [filterType, setFilterType] = useState('opt_in');
    const [filterValue, setFilterValue] = useState('');
    const [newTag, setNewTag] = useState('');

    // Delete Modal state
    const [deletingSegment, setDeletingSegment] = useState<SegmentItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Preview Contacts Modal state
    const [previewSegment, setPreviewSegment] = useState<SegmentItem | null>(null);
    const [previewContacts, setPreviewContacts] = useState<PreviewContact[]>([]);
    const [isLoadingPreview, setIsLoadingPreview] = useState(false);

    // In-Page Broadcast Modal state
    const [broadcastingSegment, setBroadcastingSegment] = useState<SegmentItem | null>(null);
    const [broadcastContacts, setBroadcastContacts] = useState<PreviewContact[]>([]);
    const [isLoadingBroadcastContacts, setIsLoadingBroadcastContacts] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<TemplateItem | null>(null);
    const [campaignName, setCampaignName] = useState('');
    const [templateParams, setTemplateParams] = useState<string[]>([]);
    const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);
    const [broadcastError, setBroadcastError] = useState<string | null>(null);

    // Toast Notification state
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3500);
    };

    useEffect(() => {
        if (initialSegments) {
            setSegments(initialSegments);
        }
    }, [initialSegments]);

    const handleOpenPreview = async (seg: SegmentItem) => {
        setPreviewSegment(seg);
        setIsLoadingPreview(true);
        setPreviewContacts([]);

        try {
            const params = new URLSearchParams();
            if (seg.isSystem) {
                params.set('filter_type', seg.filterType);
                if (seg.filterValue) params.set('filter_value', seg.filterValue);
            } else {
                params.set('segment_id', seg.id);
            }

            const res = await fetch(`/segments/preview?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setPreviewContacts(data.contacts || []);
            }
        } catch (err) {
            console.error('Failed to load segment preview contacts', err);
        } finally {
            setIsLoadingPreview(false);
        }
    };

    const handleOpenBroadcast = async (seg: SegmentItem) => {
        setBroadcastingSegment(seg);
        setBroadcastError(null);
        setIsLoadingBroadcastContacts(true);
        setBroadcastContacts([]);

        const defaultTemplate = templates[0] || null;
        setSelectedTemplate(defaultTemplate);

        if (defaultTemplate) {
            setCampaignName(`${seg.name} - ${defaultTemplate.name.replace(/_/g, ' ')}`);
            const matches = defaultTemplate.body.match(/\{\{(\d+)\}\}/g) || [];
            const count = matches.length;
            const initialParams =
                defaultTemplate.exampleParams && defaultTemplate.exampleParams.length >= count
                    ? defaultTemplate.exampleParams.slice(0, count)
                    : Array.from({ length: count }, (_, i) => `Value ${i + 1}`);
            setTemplateParams(initialParams);
        } else {
            setCampaignName(`${seg.name} Broadcast`);
            setTemplateParams([]);
        }

        try {
            const params = new URLSearchParams();
            if (seg.isSystem) {
                params.set('filter_type', seg.filterType);
                if (seg.filterValue) params.set('filter_value', seg.filterValue);
            } else {
                params.set('segment_id', seg.id);
            }

            const res = await fetch(`/segments/preview?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setBroadcastContacts(data.contacts || []);
            }
        } catch (err) {
            console.error('Failed to load broadcast contacts', err);
        } finally {
            setIsLoadingBroadcastContacts(false);
        }
    };

    const handleSelectTemplate = (templateName: string) => {
        const found = templates.find((t) => t.name === templateName);
        if (found && broadcastingSegment) {
            setSelectedTemplate(found);
            setCampaignName(`${broadcastingSegment.name} - ${found.name.replace(/_/g, ' ')}`);
            const matches = found.body.match(/\{\{(\d+)\}\}/g) || [];
            const count = matches.length;
            const initialParams =
                found.exampleParams && found.exampleParams.length >= count
                    ? found.exampleParams.slice(0, count)
                    : Array.from({ length: count }, (_, i) => `Value ${i + 1}`);
            setTemplateParams(initialParams);
        }
    };

    const handleSendBroadcast = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!broadcastingSegment || !selectedTemplate) return;

        if (broadcastContacts.length === 0) {
            setBroadcastError('No matching contacts found in this segment to receive messages.');
            return;
        }

        setIsSendingBroadcast(true);
        setBroadcastError(null);

        const recipients = broadcastContacts.map((c) => ({
            phone: c.phone,
            name: c.name,
        }));

        const csrfToken =
            (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';

        try {
            const res = await fetch('/campaigns/broadcast', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify({
                    template_name: selectedTemplate.name,
                    template_language: selectedTemplate.language,
                    campaign_name: campaignName.trim(),
                    recipients: recipients,
                    parameters: templateParams,
                }),
            });

            const data = await res.json();

            if (res.ok && data.success) {
                // Update local segment lastBroadcast state
                setSegments((prev) =>
                    prev.map((s) =>
                        s.id === broadcastingSegment.id
                            ? { ...s, lastBroadcast: 'Just now' }
                            : s
                    )
                );
                const targetSegName = broadcastingSegment.name;
                setBroadcastingSegment(null);
                showToast(`🎉 Broadcast dispatched to ${data.sent || recipients.length} contacts in "${targetSegName}"!`);
            } else {
                setBroadcastError(data.message || 'Failed to dispatch broadcast campaign.');
            }
        } catch (err: any) {
            setBroadcastError(err.message || 'An error occurred while dispatching the broadcast.');
        } finally {
            setIsSendingBroadcast(false);
        }
    };

    const handleCreateSegment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim()) return;

        setIsCreating(true);
        router.post(
            '/segments',
            {
                name: newName.trim(),
                description: newDesc.trim() || undefined,
                filter_type: filterType,
                filter_value: filterValue.trim() || undefined,
                tag: newTag.trim() || undefined,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsCreating(false);
                    setIsCreateOpen(false);
                    setNewName('');
                    setNewDesc('');
                    setFilterType('opt_in');
                    setFilterValue('');
                    setNewTag('');
                    showToast(`Segment "${newName.trim()}" created successfully!`);
                },
                onError: () => {
                    setIsCreating(false);
                },
                onFinish: () => {
                    setIsCreating(false);
                },
            }
        );
    };

    const handleConfirmDelete = () => {
        if (!deletingSegment) return;
        setIsDeleting(true);

        router.delete(`/segments/${deletingSegment.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setIsDeleting(false);
                setSegments((prev) => prev.filter((s) => s.id !== deletingSegment.id));
                showToast(`Segment "${deletingSegment.name}" deleted successfully.`);
                setDeletingSegment(null);
            },
            onError: () => {
                setIsDeleting(false);
                setDeletingSegment(null);
            },
            onFinish: () => {
                setIsDeleting(false);
            },
        });
    };

    const filteredSegments = segments.filter(
        (s) =>
            s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <>
            <Head title="Contact Segments - Sathwara InfoTech" />

            {/* Toast Notification */}
            {toastMessage && (
                <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-lg bg-[#1e293b] text-white px-4 py-3 shadow-xl border border-slate-700/60 text-xs font-medium animate-in fade-in slide-in-from-bottom-3 duration-200">
                    <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
                    <span>{toastMessage}</span>
                </div>
            )}

            <div className="flex flex-1 flex-col gap-5 p-4 sm:p-6 min-w-0">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                                <Layers className="size-5 text-[#47b672]" />
                                Contact Segments &amp; Audiences
                            </h2>
                            <Badge variant="outline" className="text-xs bg-[#47b672]/10 text-[#28804c] dark:text-[#52c480] border-[#47b672]/30">
                                {segments.length} Audiences
                            </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Target specific groups of real contacts based on opt-in consent, pipeline stage, and activity.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            onClick={() => setIsCreateOpen(true)}
                            className="bg-[#47b672] hover:bg-[#3ca062] text-white text-xs shadow-xs"
                        >
                            <Plus className="size-3.5 mr-1.5" />
                            Create Segment
                        </Button>
                    </div>
                </div>

                {/* Search Bar & Summary */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search real segments by name, stage, tag..."
                            className="pl-8 text-xs"
                        />
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <span className="inline-flex size-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        Total Workspace Contacts: <span className="font-semibold text-foreground">{totalContacts}</span>
                    </div>
                </div>

                {/* Segments Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {filteredSegments.map((seg) => (
                        <div
                            key={seg.id}
                            className="rounded-xl border border-border/80 bg-card p-3.5 hover:border-[#47b672]/60 hover:shadow-sm transition-all duration-150 flex flex-col justify-between gap-2.5"
                        >
                            {/* Top Row: Name, Badge, Count & Description */}
                            <div className="space-y-1">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2 min-w-0 flex-wrap">
                                        <h3 className="text-sm font-semibold text-foreground truncate">
                                            {seg.name}
                                        </h3>
                                        {seg.isSystem ? (
                                            <Badge variant="secondary" className="text-[10px] font-medium py-0 px-1.5 h-4 bg-muted text-muted-foreground border border-border/40 shrink-0">
                                                Auto
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-[10px] font-medium py-0 px-1.5 h-4 border-[#47b672]/40 text-[#28804c] dark:text-[#52c480] bg-emerald-500/5 shrink-0">
                                                Custom
                                            </Badge>
                                        )}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => handleOpenPreview(seg)}
                                        className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors px-2.5 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0 cursor-pointer"
                                        title="Click to view contacts in this segment"
                                    >
                                        <Users className="size-3" />
                                        <span>{seg.count}</span>
                                    </button>
                                </div>

                                <p className="text-xs text-muted-foreground line-clamp-1">
                                    {seg.description}
                                </p>
                            </div>

                            {/* Middle Row: Rule & Tags */}
                            <div className="space-y-2">
                                <div className="rounded-md bg-muted/40 px-2.5 py-1 text-[11px] font-mono text-muted-foreground flex items-center justify-between border border-border/30">
                                    <div className="truncate flex items-center gap-1.5 min-w-0">
                                        <span className="font-semibold text-foreground text-[10px] uppercase tracking-wider shrink-0">Rule:</span>
                                        <span className="truncate">{seg.criteria}</span>
                                    </div>
                                    <span className="text-[10px] text-muted-foreground/70 shrink-0 ml-2 font-sans">
                                        {seg.updatedAt}
                                    </span>
                                </div>

                                {seg.tags && seg.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                        {seg.tags.map((t, i) => (
                                            <span key={i} className="inline-flex items-center gap-1 rounded bg-muted/70 px-1.5 py-0.5 text-[10px] text-muted-foreground font-medium border border-border/30">
                                                <Tag className="size-2.5 text-muted-foreground/70" />
                                                {t}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Bottom Row: Last Broadcast & Actions */}
                            <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs">
                                <div className="flex items-center gap-1 text-[11px] text-muted-foreground truncate">
                                    <Clock className="size-3 text-muted-foreground/70 shrink-0" />
                                    <span>Broadcast: <span className="font-medium text-foreground">{seg.lastBroadcast}</span></span>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                    {!seg.isSystem && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 w-7 p-0 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md"
                                            onClick={() => setDeletingSegment(seg)}
                                            title="Delete custom segment"
                                        >
                                            <Trash2 className="size-3.5" />
                                        </Button>
                                    )}

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 px-2.5 text-xs border-border/80 hover:bg-muted text-foreground/80 hover:text-foreground gap-1 rounded-md"
                                        onClick={() => handleOpenPreview(seg)}
                                        title="View contacts in this segment"
                                    >
                                        <Eye className="size-3" />
                                        <span>View</span>
                                    </Button>

                                    <Button
                                        type="button"
                                        size="sm"
                                        disabled={seg.count === 0}
                                        onClick={() => handleOpenBroadcast(seg)}
                                        className="h-7 px-3 text-xs bg-[#47b672] hover:bg-[#3ca062] text-white disabled:opacity-50 gap-1 cursor-pointer rounded-md font-medium shadow-2xs"
                                    >
                                        <Send className="size-3" />
                                        <span>Broadcast</span>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredSegments.length === 0 && (
                    <div className="text-center py-12 border border-dashed rounded-lg bg-card text-muted-foreground text-xs">
                        No segments match your search criteria.
                    </div>
                )}
            </div>

            {/* Launch In-Page Broadcast Modal */}
            <Dialog open={!!broadcastingSegment} onOpenChange={(open) => !open && setBroadcastingSegment(null)}>
                <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <div className="flex items-center justify-between pr-4">
                            <div className="flex items-center gap-2">
                                <Send className="size-5 text-[#47b672]" />
                                <div>
                                    <DialogTitle className="text-base font-semibold">
                                        Broadcast to "{broadcastingSegment?.name}"
                                    </DialogTitle>
                                    <DialogDescription className="text-xs text-muted-foreground">
                                        Send verified WhatsApp template message to contacts in this segment.
                                    </DialogDescription>
                                </div>
                            </div>
                            <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30">
                                {isLoadingBroadcastContacts ? 'Loading...' : `${broadcastContacts.length} Contacts`}
                            </Badge>
                        </div>
                    </DialogHeader>

                    {broadcastError && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs">
                            <AlertCircle className="size-4 shrink-0" />
                            <span>{broadcastError}</span>
                        </div>
                    )}

                    <form onSubmit={handleSendBroadcast} className="space-y-4 py-1">
                        <div className="space-y-1">
                            <Label className="text-xs font-medium">Campaign Name</Label>
                            <Input
                                value={campaignName}
                                onChange={(e) => setCampaignName(e.target.value)}
                                placeholder="e.g. Inbound Leads Notification"
                                className="text-xs"
                                required
                            />
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs font-medium">Select Meta Template</Label>
                            {templates.length === 0 ? (
                                <div className="p-3 rounded border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs">
                                    No approved Meta templates found. Please check WhatsApp Manager.
                                </div>
                            ) : (
                                <select
                                    value={selectedTemplate?.name || ''}
                                    onChange={(e) => handleSelectTemplate(e.target.value)}
                                    className="w-full text-xs rounded-md border border-input bg-background px-3 py-2 shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                >
                                    {templates.map((tpl) => (
                                        <option key={tpl.id} value={tpl.name}>
                                            {tpl.name} ({tpl.language}) — {tpl.category} [{tpl.costEstimate}]
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>

                        {/* Template Parameters Input if any {{1}}, {{2}} */}
                        {templateParams.length > 0 && (
                            <div className="space-y-2 p-3 bg-muted/40 rounded-lg border border-border/80">
                                <Label className="text-xs font-semibold text-foreground flex items-center justify-between">
                                    <span>Template Variable Placeholders</span>
                                    <span className="text-[11px] text-muted-foreground font-normal">Fill values for placeholders</span>
                                </Label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                    {templateParams.map((paramVal, idx) => (
                                        <div key={idx} className="space-y-1">
                                            <Label className="text-[11px] text-muted-foreground">Variable {`{{${idx + 1}}}`}</Label>
                                            <Input
                                                value={paramVal}
                                                onChange={(e) => {
                                                    const updated = [...templateParams];
                                                    updated[idx] = e.target.value;
                                                    setTemplateParams(updated);
                                                }}
                                                className="text-xs bg-background"
                                                placeholder={`Value ${idx + 1}`}
                                                required
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Live Message Preview */}
                        {selectedTemplate && (
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium flex items-center gap-1.5">
                                    <MessageSquare className="size-3.5 text-emerald-600" />
                                    <span>Live WhatsApp Preview</span>
                                </Label>
                                <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-500/20 p-3.5 text-xs text-foreground font-sans">
                                    {selectedTemplate.header && (
                                        <div className="font-bold text-xs mb-1 text-emerald-900 dark:text-emerald-300">
                                            {selectedTemplate.header}
                                        </div>
                                    )}
                                    <div className="whitespace-pre-wrap text-[12px] leading-relaxed">
                                        {selectedTemplate.body.replace(/\{\{(\d+)\}\}/g, (_, num) => {
                                            const idx = parseInt(num, 10) - 1;
                                            return templateParams[idx] ? `*${templateParams[idx]}*` : `{{${num}}}`;
                                        })}
                                    </div>
                                    {selectedTemplate.buttons && selectedTemplate.buttons.length > 0 && (
                                        <div className="pt-2.5 mt-2.5 border-t border-emerald-500/20 flex flex-wrap gap-2">
                                            {selectedTemplate.buttons.map((btn, bIdx) => (
                                                <div key={bIdx} className="rounded bg-white dark:bg-slate-900 px-3 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 shadow-2xs">
                                                    {btn}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Recipients summary */}
                        <div className="flex items-center justify-between p-2.5 rounded bg-muted/60 text-xs">
                            <span className="text-muted-foreground">Target Recipients:</span>
                            <span className="font-semibold text-foreground">
                                {isLoadingBroadcastContacts ? (
                                    <span className="flex items-center gap-1 text-muted-foreground">
                                        <Loader2 className="size-3 animate-spin" /> Loading contacts...
                                    </span>
                                ) : (
                                    `${broadcastContacts.length} verified contacts in "${broadcastingSegment?.name}"`
                                )}
                            </span>
                        </div>

                        <DialogFooter className="pt-2 border-t flex items-center justify-between sm:justify-between">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={isSendingBroadcast}
                                onClick={() => setBroadcastingSegment(null)}
                                className="text-xs"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                size="sm"
                                disabled={isSendingBroadcast || isLoadingBroadcastContacts || broadcastContacts.length === 0 || !selectedTemplate}
                                className="bg-[#47b672] hover:bg-[#3ca062] text-white text-xs gap-1.5"
                            >
                                {isSendingBroadcast ? (
                                    <>
                                        <Loader2 className="size-3.5 animate-spin" />
                                        <span>Dispatching Broadcast...</span>
                                    </>
                                ) : (
                                    <>
                                        <Send className="size-3.5" />
                                        <span>Send WhatsApp Broadcast</span>
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* View Contacts in Segment Dialog */}
            <Dialog open={!!previewSegment} onOpenChange={(open) => !open && setPreviewSegment(null)}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <div className="flex items-center justify-between gap-3 pr-4">
                            <div className="flex items-center gap-2">
                                <Users className="size-5 text-[#47b672]" />
                                <div>
                                    <DialogTitle className="text-base font-semibold">
                                        {previewSegment?.name}
                                    </DialogTitle>
                                    <DialogDescription className="text-xs text-muted-foreground">
                                        Rule: {previewSegment?.criteria}
                                    </DialogDescription>
                                </div>
                            </div>
                            <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30">
                                {previewContacts.length} Contacts
                            </Badge>
                        </div>
                    </DialogHeader>

                    <div className="max-h-[360px] overflow-y-auto py-2">
                        {isLoadingPreview ? (
                            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
                                <Loader2 className="size-6 animate-spin text-[#47b672]" />
                                <span className="text-xs">Loading matching contacts...</span>
                            </div>
                        ) : previewContacts.length === 0 ? (
                            <div className="text-center py-10 border border-dashed rounded-lg text-muted-foreground text-xs">
                                No contacts currently match this segment criteria.
                            </div>
                        ) : (
                            <div className="divide-y divide-border/60 border rounded-md">
                                {previewContacts.map((c) => (
                                    <div key={c.id} className="flex items-center justify-between p-3 text-xs hover:bg-muted/30">
                                        <div>
                                            <div className="font-semibold text-foreground flex items-center gap-2">
                                                <span>{c.name}</span>
                                                <Badge variant="secondary" className="text-[10px] py-0 px-1.5 h-4">
                                                    {c.stage}
                                                </Badge>
                                            </div>
                                            <div className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5">
                                                <span>{c.phone}</span>
                                                {c.city !== '—' && (
                                                    <span>• {c.city}</span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="text-right flex flex-col items-end gap-1">
                                            {c.consent === 'opted_in' ? (
                                                <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px] py-0 px-1.5 h-4">
                                                    Opted In
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 text-[10px] py-0 px-1.5 h-4">
                                                    Opted Out
                                                </Badge>
                                            )}
                                            <span className="text-[10px] text-muted-foreground">{c.lastMessage}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <DialogFooter className="flex items-center justify-between sm:justify-between pt-2 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setPreviewSegment(null)}
                            className="text-xs"
                        >
                            Close
                        </Button>
                        {previewSegment && (
                            <Button
                                type="button"
                                size="sm"
                                disabled={previewSegment.count === 0}
                                onClick={() => {
                                    const target = previewSegment;
                                    setPreviewSegment(null);
                                    handleOpenBroadcast(target);
                                }}
                                className="bg-[#47b672] hover:bg-[#3ca062] text-white text-xs gap-1.5 cursor-pointer"
                            >
                                <Send className="size-3" />
                                <span>Broadcast to this Segment</span>
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Create Segment Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-sm font-semibold flex items-center gap-2">
                            <Plus className="size-4 text-[#47b672]" />
                            Create Real Audience Segment
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Define matching criteria to group real contacts for targeted campaigns.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleCreateSegment} className="space-y-3.5 py-2">
                        <div className="space-y-1">
                            <Label className="text-xs font-medium">Segment Name *</Label>
                            <Input
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder="e.g. Surat Retail Clients"
                                className="text-xs"
                                required
                            />
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs font-medium">Description</Label>
                            <Input
                                value={newDesc}
                                onChange={(e) => setNewDesc(e.target.value)}
                                placeholder="e.g. Verified leads from Gujarat region"
                                className="text-xs"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs font-medium">Filter Criteria</Label>
                                <select
                                    value={filterType}
                                    onChange={(e) => {
                                        setFilterType(e.target.value);
                                        if (e.target.value === 'stage' && !filterValue) {
                                            setFilterValue('New');
                                        }
                                    }}
                                    className="w-full text-xs rounded-md border border-input bg-background px-3 py-2 shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                >
                                    <option value="opt_in">WhatsApp Opted-In (Consent = Yes)</option>
                                    <option value="stage">Pipeline Stage</option>
                                    <option value="city">City / Location</option>
                                    <option value="active_7d">Active In Last 7 Days</option>
                                    <option value="inactive_30d">Inactive (&gt; 30 Days)</option>
                                    <option value="opt_out">WhatsApp Opted-Out (STOP)</option>
                                    <option value="all">All Contacts</option>
                                </select>
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs font-medium">Filter Value</Label>
                                {filterType === 'stage' ? (
                                    <select
                                        value={filterValue || 'New'}
                                        onChange={(e) => setFilterValue(e.target.value)}
                                        className="w-full text-xs rounded-md border border-input bg-background px-3 py-2 shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    >
                                        <option value="New">New</option>
                                        <option value="Contacted">Contacted</option>
                                        <option value="Interested">Interested</option>
                                        <option value="Won">Won</option>
                                    </select>
                                ) : filterType === 'city' ? (
                                    <Input
                                        value={filterValue}
                                        onChange={(e) => setFilterValue(e.target.value)}
                                        placeholder="e.g. Surat or Ahmedabad"
                                        className="text-xs"
                                        required
                                    />
                                ) : (
                                    <Input
                                        value="Automatic"
                                        disabled
                                        className="text-xs bg-muted text-muted-foreground"
                                    />
                                )}
                            </div>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs font-medium">Custom Tag (Optional)</Label>
                            <Input
                                value={newTag}
                                onChange={(e) => setNewTag(e.target.value)}
                                placeholder="e.g. VIP, Festival, Urgent"
                                className="text-xs"
                            />
                        </div>

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={isCreating}
                                onClick={() => setIsCreateOpen(false)}
                                className="text-xs"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                size="sm"
                                disabled={isCreating}
                                className="bg-[#47b672] hover:bg-[#3ca062] text-white text-xs gap-1.5"
                            >
                                {isCreating ? (
                                    <>
                                        <Loader2 className="size-3.5 animate-spin" />
                                        <span>Saving...</span>
                                    </>
                                ) : (
                                    <>
                                        <Plus className="size-3.5" />
                                        <span>Save Segment</span>
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!deletingSegment} onOpenChange={(open) => !open && setDeletingSegment(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <div className="flex items-center gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400">
                                <AlertTriangle className="size-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-base font-semibold">Delete Segment?</DialogTitle>
                                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                                    Are you sure you want to remove <span className="font-semibold text-foreground">"{deletingSegment?.name}"</span>?
                                    Your actual contacts in the CRM will not be deleted.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <DialogFooter className="flex flex-row justify-end items-center gap-3 pt-3 sm:gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isDeleting}
                            onClick={() => setDeletingSegment(null)}
                            className="text-xs px-4"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            disabled={isDeleting}
                            onClick={handleConfirmDelete}
                            className="text-xs gap-1.5 px-4"
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="size-3.5 animate-spin" />
                                    <span>Deleting...</span>
                                </>
                            ) : (
                                <>
                                    <Trash2 className="size-3.5" />
                                    <span>Delete Segment</span>
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
