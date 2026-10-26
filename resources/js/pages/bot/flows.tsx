import { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    GitBranch,
    Plus,
    Play,
    CheckCircle2,
    Clock,
    Trash2,
    Edit3,
    ArrowRight,
    MessageSquare,
    Layers,
    Sliders,
    CornerDownRight,
    Send,
    Bot,
    Sparkles,
    AlertCircle,
    RotateCcw,
    Power,
    Search,
    Check,
    Loader2,
    ShieldAlert,
    ExternalLink,
    UserCheck,
    Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

export type FlowOption = {
    id: string;
    label: string;
    reply_text: string;
    action_type?: 'reply' | 'followup' | 'link' | 'human_handoff';
    followup_question?: string;
    followup_reply?: string;
};

export type BotFlowItem = {
    id: string;
    name: string;
    description: string | null;
    trigger_keywords: string;
    status: 'active' | 'draft';
    greeting_message: string;
    options: FlowOption[];
    execution_count: number;
    created_at?: string;
    updated_at?: string;
};

interface Props {
    flows?: BotFlowItem[];
}

export default function BotFlows({ flows = [] }: Props) {
    const [flowList, setFlowList] = useState<BotFlowItem[]>(flows);
    const [selectedFlowId, setSelectedFlowId] = useState<string>(flows[0]?.id || '');
    const [searchQuery, setSearchQuery] = useState('');
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // Keep state synchronized with props
    useEffect(() => {
        setFlowList(flows);
        if (flows.length > 0 && (!selectedFlowId || !flows.find((f) => f.id === selectedFlowId))) {
            setSelectedFlowId(flows[0].id);
        }
    }, [flows]);

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 4000);
    };

    const selectedFlow = flowList.find((f) => f.id === selectedFlowId) || flowList[0] || null;

    // Filter flows by search
    const filteredFlows = flowList.filter((f) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            f.name.toLowerCase().includes(q) ||
            f.trigger_keywords.toLowerCase().includes(q) ||
            (f.description && f.description.toLowerCase().includes(q))
        );
    });

    // Modal state for Create / Edit
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingFlow, setEditingFlow] = useState<BotFlowItem | null>(null);
    const [formName, setFormName] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [formKeywords, setFormKeywords] = useState('');
    const [formStatus, setFormStatus] = useState<'active' | 'draft'>('active');
    const [formGreeting, setFormGreeting] = useState('');
    const [formOptions, setFormOptions] = useState<FlowOption[]>([
        { id: '1', label: 'Services & Products', reply_text: 'Here are our core services...', action_type: 'reply' },
        { id: '2', label: 'Pricing & Quotation', reply_text: 'Our pricing plans start from...', action_type: 'reply' },
        { id: '3', label: 'Speak with Team', reply_text: 'Connecting you with our support team.', action_type: 'human_handoff' },
    ]);
    const [formError, setFormError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Modal state for Delete
    const [deletingFlow, setDeletingFlow] = useState<BotFlowItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Simulator State
    const [previewChat, setPreviewChat] = useState<{ sender: 'user' | 'bot'; text: string; options?: FlowOption[] }[]>([]);
    const [previewInput, setPreviewInput] = useState('');
    const [waitingFollowupOption, setWaitingFollowupOption] = useState<FlowOption | null>(null);

    // Reset simulator whenever selectedFlow changes
    useEffect(() => {
        if (!selectedFlow) {
            setPreviewChat([]);
            setWaitingFollowupOption(null);
            return;
        }

        const sampleKeyword = selectedFlow.trigger_keywords.split(',')[0]?.trim() || 'Hi';
        setWaitingFollowupOption(null);
        setPreviewChat([
            {
                sender: 'user',
                text: `${sampleKeyword}, I would like to know more about your services`,
            },
            {
                sender: 'bot',
                text: selectedFlow.greeting_message,
                options: selectedFlow.options || [],
            },
        ]);
        setPreviewInput('');
    }, [selectedFlow?.id]);

    const handleSimulatorSend = (textToSend?: string) => {
        const text = (textToSend ?? previewInput).trim();
        if (!text || !selectedFlow) return;

        const updated = [...previewChat, { sender: 'user' as const, text }];
        setPreviewChat(updated);
        setPreviewInput('');

        // 1. If currently waiting for user's answer to a follow-up question
        if (waitingFollowupOption && text.toLowerCase() !== 'menu' && text.toLowerCase() !== 'restart') {
            const answeredOpt = waitingFollowupOption;
            setWaitingFollowupOption(null);

            setTimeout(() => {
                const confirmationText = answeredOpt.followup_reply?.trim()
                    ? answeredOpt.followup_reply.trim()
                    : '✅ Thank you! We have received your response. Our team will review your requirement and contact you shortly.';

                setPreviewChat([
                    ...updated,
                    {
                        sender: 'bot',
                        text: `${confirmationText}\n\n💡 Reply *MENU* anytime to view main options again.`,
                    },
                ]);
            }, 400);
            return;
        }

        // Reset waiting follow-up if user sent menu/restart
        if (waitingFollowupOption) {
            setWaitingFollowupOption(null);
        }

        // Check if user requested main menu
        if (text.toLowerCase() === 'menu' || text.toLowerCase() === 'restart') {
            setTimeout(() => {
                setPreviewChat([
                    ...updated,
                    {
                        sender: 'bot',
                        text: selectedFlow.greeting_message,
                        options: selectedFlow.options || [],
                    },
                ]);
            }, 300);
            return;
        }

        // Find matching option (by option ID or keyword match in label)
        const matched = selectedFlow.options?.find(
            (opt) =>
                opt.id.toLowerCase() === text.toLowerCase() ||
                opt.label.toLowerCase().includes(text.toLowerCase()) ||
                text.toLowerCase().includes(opt.id.toLowerCase())
        );

        setTimeout(() => {
            if (matched) {
                const replyPrefix = matched.action_type === 'human_handoff' ? '👨‍💼 [Live Agent Handoff]\n\n' : '';
                const botReply = replyPrefix + matched.reply_text;
                const nextMessages = [...updated, { sender: 'bot' as const, text: botReply }];

                if (matched.action_type === 'followup' && matched.followup_question?.trim()) {
                    setPreviewChat(nextMessages);
                    setWaitingFollowupOption(matched);
                    setTimeout(() => {
                        setPreviewChat([
                            ...nextMessages,
                            {
                                sender: 'bot' as const,
                                text: `❓ ${matched.followup_question}`,
                            },
                        ]);
                    }, 400);
                } else {
                    setWaitingFollowupOption(null);
                    setPreviewChat(nextMessages);
                }
            } else {
                setPreviewChat([
                    ...updated,
                    {
                        sender: 'bot',
                        text: `Thanks for your reply! Please choose one of the options below (reply with ${selectedFlow.options.map((o) => o.id).join(', ')}):`,
                        options: selectedFlow.options || [],
                    },
                ]);
            }
        }, 400);
    };

    const handleRestartSimulator = () => {
        if (!selectedFlow) return;
        setWaitingFollowupOption(null);
        const sampleKeyword = selectedFlow.trigger_keywords.split(',')[0]?.trim() || 'Hi';
        setPreviewChat([
            {
                sender: 'user',
                text: `${sampleKeyword}, please share details`,
            },
            {
                sender: 'bot',
                text: selectedFlow.greeting_message,
                options: selectedFlow.options || [],
            },
        ]);
        setPreviewInput('');
    };

    // Load sample template for quick testing
    const loadSampleTemplate = () => {
        setFormName('Customer Inquiry & Services Flow');
        setFormDescription('Greets new WhatsApp contacts, presents services menu, and collects project requirements.');
        setFormKeywords('hi, hello, hey, inquiry, services, price');
        setFormStatus('active');
        setFormGreeting("👋 Welcome to Sathwara InfoTech!\nHow can we help you today?\n\n1️⃣ Web & Software Development\n2️⃣ WhatsApp API & Automation\n3️⃣ Talk to Support\n\nReply with 1, 2, or 3.");
        setFormOptions([
            {
                id: '1',
                label: 'Web Development',
                reply_text: '🌐 We build custom Laravel & React web applications, portals, and SaaS platforms tailored to your business needs!',
                action_type: 'followup',
                followup_question: 'What type of website or software do you need? Please share your requirement.',
                followup_reply: '✅ Thank you for sharing your requirement! Our technical team at Sathwara InfoTech will review it and get in touch shortly.',
            },
            {
                id: '2',
                label: 'WhatsApp Automation',
                reply_text: '🚀 Our WhatsApp Cloud API solution enables broadcasts to 10,000+ contacts, shared team inbox, and 24/7 AI chatbots with 98% open rates!',
                action_type: 'reply',
                followup_question: '',
            },
            {
                id: '3',
                label: 'Human Agent Handoff',
                reply_text: '👨‍💼 Notifying our team at Sathwara InfoTech! A support specialist will connect with you here shortly.',
                action_type: 'human_handoff',
                followup_question: '',
            },
        ]);
        showToast('Sample template loaded!');
    };

    // Open Form for Create - completely blank by default!
    const openCreateModal = () => {
        setEditingFlow(null);
        setFormName('');
        setFormDescription('');
        setFormKeywords('');
        setFormStatus('active');
        setFormGreeting('');
        setFormOptions([
            {
                id: '1',
                label: '',
                reply_text: '',
                action_type: 'reply',
                followup_question: '',
            },
        ]);
        setFormError(null);
        setIsFormOpen(true);
    };

    // Open Form for Edit
    const openEditModal = (flow: BotFlowItem) => {
        setEditingFlow(flow);
        setFormName(flow.name);
        setFormDescription(flow.description || '');
        setFormKeywords(flow.trigger_keywords);
        setFormStatus(flow.status);
        setFormGreeting(flow.greeting_message);
        setFormOptions(
            flow.options && flow.options.length > 0
                ? flow.options
                : [{ id: '1', label: 'Option 1', reply_text: 'Reply for option 1', action_type: 'reply' }]
        );
        setFormError(null);
        setIsFormOpen(true);
    };

    // Add new option in form (up to 10 steps)
    const addFormOption = () => {
        if (formOptions.length >= 10) return;
        const nextId = (formOptions.length + 1).toString();
        setFormOptions([
            ...formOptions,
            {
                id: nextId,
                label: '',
                reply_text: '',
                action_type: 'reply',
                followup_question: '',
            },
        ]);
    };

    // Remove option from form
    const removeFormOption = (index: number) => {
        if (formOptions.length <= 1) return;
        const updated = formOptions.filter((_, idx) => idx !== index);
        // re-number IDs
        const renumbered = updated.map((opt, idx) => ({ ...opt, id: (idx + 1).toString() }));
        setFormOptions(renumbered);
    };

    // Update option field
    const updateOptionField = (index: number, field: keyof FlowOption, val: string) => {
        const updated = [...formOptions];
        updated[index] = { ...updated[index], [field]: val };
        setFormOptions(updated);
    };

    // Save Flow
    const handleSaveFlow = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formName.trim() || !formKeywords.trim() || !formGreeting.trim()) {
            setFormError('Please fill in Flow Name, Trigger Keywords, and Greeting Message.');
            return;
        }

        if (formOptions.some((o) => !o.label.trim() || !o.reply_text.trim())) {
            setFormError('Every menu option must have a title and reply text.');
            return;
        }

        setIsSaving(true);
        setFormError(null);

        const payload = {
            name: formName.trim(),
            description: formDescription.trim() || null,
            trigger_keywords: formKeywords.trim(),
            status: formStatus,
            greeting_message: formGreeting.trim(),
            options: formOptions,
        };

        if (editingFlow) {
            router.put(`/flows/${editingFlow.id}`, payload, {
                preserveScroll: true,
                onSuccess: () => {
                    setIsSaving(false);
                    setIsFormOpen(false);
                    showToast(`Flow "${formName}" updated successfully.`);
                },
                onError: (errs) => {
                    setIsSaving(false);
                    setFormError(Object.values(errs)[0] as string || 'Failed to update flow.');
                },
                onFinish: () => setIsSaving(false),
            });
        } else {
            router.post('/flows', payload, {
                preserveScroll: true,
                onSuccess: () => {
                    setIsSaving(false);
                    setIsFormOpen(false);
                    showToast(`Flow "${formName}" created successfully.`);
                },
                onError: (errs) => {
                    setIsSaving(false);
                    setFormError(Object.values(errs)[0] as string || 'Failed to create flow.');
                },
                onFinish: () => setIsSaving(false),
            });
        }
    };

    // Toggle Active / Draft
    const handleToggleStatus = (flow: BotFlowItem, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        router.patch(
            `/flows/${flow.id}/toggle`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    const newStatus = flow.status === 'active' ? 'draft' : 'active';
                    setFlowList((prev) =>
                        prev.map((f) => (f.id === flow.id ? { ...f, status: newStatus } : f))
                    );
                    showToast(`Flow "${flow.name}" status changed to ${newStatus}.`);
                },
            }
        );
    };

    // Confirm Delete
    const handleConfirmDelete = () => {
        if (!deletingFlow) return;
        setIsDeleting(true);
        router.delete(`/flows/${deletingFlow.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setIsDeleting(false);
                const remaining = flowList.filter((f) => f.id !== deletingFlow.id);
                setFlowList(remaining);
                if (selectedFlowId === deletingFlow.id) {
                    setSelectedFlowId(remaining[0]?.id || '');
                }
                showToast(`Flow "${deletingFlow.name}" deleted successfully.`);
                setDeletingFlow(null);
            },
            onError: () => {
                setIsDeleting(false);
                showToast('Failed to delete flow.');
            },
            onFinish: () => setIsDeleting(false),
        });
    };

    const totalExecutions = flowList.reduce((acc, curr) => acc + (curr.execution_count || 0), 0);
    const activeCount = flowList.filter((f) => f.status === 'active').length;

    return (
        <>
            <Head title="WhatsApp Bot Flows - Sathwara InfoTech" />

            <div className="flex flex-1 flex-col gap-2 sm:gap-5 p-4 sm:p-6 min-w-0 max-w-[1600px] mx-auto w-full">
                {/* Toast Notification */}
                {toastMessage && (
                    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-medium text-white shadow-lg animate-in fade-in slide-in-from-bottom-3 duration-200">
                        <CheckCircle2 className="size-4 shrink-0" />
                        <span>{toastMessage}</span>
                    </div>
                )}

                {/* Page Header & Stats */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-lg bg-[#47b672]/10 text-[#47b672]">
                                <GitBranch className="size-5" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-xl font-bold tracking-tight text-foreground">
                                        WhatsApp Bot Flows
                                    </h2>
                                    <Badge variant="outline" className="text-xs bg-[#47b672]/10 text-[#28804c] dark:text-[#52c480] border-[#47b672]/30">
                                        Visual Automation Tree
                                    </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Build multi-step interactive WhatsApp chatbots with buttons, quick replies, and automated lead qualification.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            size="sm"
                            onClick={openCreateModal}
                            className="bg-[#47b672] hover:bg-[#3ca062] text-white text-xs gap-1.5 shadow-sm"
                        >
                            <Plus className="size-3.5" />
                            Create New Flow
                        </Button>
                    </div>
                </div>

                {/* 3 Compact Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="flex items-center justify-between px-3.5 py-2.5 rounded-lg border border-border/80 bg-card shadow-2xs">
                        <div className="space-y-0.5">
                            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                                Total Flows
                            </span>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-base font-bold text-foreground">{flowList.length}</span>
                                <span className="text-[10px] text-muted-foreground">flows</span>
                            </div>
                        </div>
                        <div className="size-7 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                            <Layers className="size-3.5" />
                        </div>
                    </div>

                    <div className="flex items-center justify-between px-3.5 py-2.5 rounded-lg border border-border/80 bg-card shadow-2xs">
                        <div className="space-y-0.5">
                            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                                Active Automations
                            </span>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                                    {activeCount}
                                </span>
                                <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 flex items-center gap-1 font-medium">
                                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                                    Running
                                </span>
                            </div>
                        </div>
                        <div className="size-7 rounded-md bg-emerald-500/10 text-[#47b672] flex items-center justify-center shrink-0">
                            <Zap className="size-3.5" />
                        </div>
                    </div>

                    <div className="flex items-center justify-between px-3.5 py-2.5 rounded-lg border border-border/80 bg-card shadow-2xs">
                        <div className="space-y-0.5">
                            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                                Total Executions
                            </span>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-base font-bold text-foreground">{totalExecutions}</span>
                                <span className="text-[10px] text-muted-foreground">inquiries handled</span>
                            </div>
                        </div>
                        <div className="size-7 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                            <Bot className="size-3.5" />
                        </div>
                    </div>
                </div>

                {/* Main 12-Column Content */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left Column: Flows List (Sticky sidebar on desktop) */}
                    <div className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-4 self-start flex flex-col space-y-3 max-h-[calc(100vh-120px)]">
                        <div className="flex items-center justify-between gap-2 px-0.5 shrink-0">
                            <div className="relative flex-1">
                                <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                                <Input
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search flows by name or keyword..."
                                    className="pl-8 text-xs h-8 bg-card"
                                />
                            </div>
                        </div>

                        {filteredFlows.length === 0 ? (
                            <Card className="border-dashed border-border p-8 text-center space-y-3">
                                <div className="mx-auto size-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                                    <GitBranch className="size-5" />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-sm font-semibold text-foreground">No Bot Flows Found</h4>
                                    <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                                        {searchQuery
                                            ? `No flows matched "${searchQuery}". Clear your search to see all flows.`
                                            : 'Create your first automated WhatsApp flow to greet prospects and answer FAQs.'}
                                    </p>
                                </div>
                                {!searchQuery && (
                                    <Button
                                        size="sm"
                                        onClick={openCreateModal}
                                        className="bg-[#47b672] hover:bg-[#3ca062] text-white text-xs gap-1.5"
                                    >
                                        <Plus className="size-3.5" />
                                        Create First Flow
                                    </Button>
                                )}
                            </Card>
                        ) : (
                            <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 overscroll-contain">
                                {filteredFlows.map((flow) => {
                                    const isSelected = selectedFlow?.id === flow.id;
                                    return (
                                        <Card
                                            key={flow.id}
                                            onClick={() => setSelectedFlowId(flow.id)}
                                            className={`cursor-pointer transition-all border shadow-2xs ${
                                                isSelected
                                                    ? 'border-[#47b672] ring-1 ring-[#47b672]/30 bg-card'
                                                    : 'border-border hover:border-[#47b672]/50 hover:bg-muted/30'
                                            }`}
                                        >
                                            <CardContent className="p-3.5 space-y-2">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="space-y-0.5 min-w-0">
                                                        <h3 className="text-sm font-semibold text-foreground truncate flex items-center gap-2">
                                                            {flow.name}
                                                        </h3>
                                                        {flow.description && (
                                                            <p className="text-xs text-muted-foreground line-clamp-1">
                                                                {flow.description}
                                                            </p>
                                                        )}
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={(e) => handleToggleStatus(flow, e)}
                                                        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors shrink-0 ${
                                                            flow.status === 'active'
                                                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                                                                : 'bg-muted text-muted-foreground border border-border hover:bg-muted/80'
                                                        }`}
                                                        title="Click to toggle Active / Draft"
                                                    >
                                                        {flow.status === 'active' ? '● Active' : '○ Draft'}
                                                    </button>
                                                </div>

                                                <div className="flex items-center gap-1.5 rounded bg-muted/40 px-2 py-1 text-[11px] font-mono text-muted-foreground truncate">
                                                    <Bot className="size-3 shrink-0 text-amber-500" />
                                                    <span className="truncate">Keywords: {flow.trigger_keywords}</span>
                                                </div>

                                                <div className="flex items-center justify-between pt-1 text-[11px] text-muted-foreground border-t border-border/60">
                                                    <span>{(flow.options?.length || 0) + 2} Steps</span>
                                                    <span>{flow.execution_count || 0} triggered</span>
                                                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="size-6 text-muted-foreground hover:text-foreground"
                                                            onClick={() => openEditModal(flow)}
                                                            title="Edit Flow"
                                                        >
                                                            <Edit3 className="size-3" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="size-6 text-muted-foreground hover:text-red-600"
                                                            onClick={() => setDeletingFlow(flow)}
                                                            title="Delete Flow"
                                                        >
                                                            <Trash2 className="size-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Right Column: Visual Tree Canvas & Interactive Simulator */}
                    <div className="lg:col-span-7 xl:col-span-8 space-y-5">
                        {selectedFlow ? (
                            <>
                                {/* Canvas View */}
                                <Card className="border-border shadow-2xs">
                                    <CardHeader className="pb-3 border-b border-border/80">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                            <div>
                                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                                    <Sliders className="size-4 text-[#47b672]" />
                                                    Flow Canvas: {selectedFlow.name}
                                                </CardTitle>
                                                <CardDescription className="text-xs">
                                                    Interactive conversation pipeline executed when customer sends matching keywords.
                                                </CardDescription>
                                            </div>

                                            <div className="flex items-center gap-1.5">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => openEditModal(selectedFlow)}
                                                    className="text-xs h-7 gap-1"
                                                >
                                                    <Edit3 className="size-3" />
                                                    Edit
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleToggleStatus(selectedFlow)}
                                                    className={`text-xs h-7 gap-1 ${
                                                        selectedFlow.status === 'active'
                                                            ? 'text-amber-600 hover:text-amber-700'
                                                            : 'text-emerald-600 hover:text-emerald-700'
                                                    }`}
                                                >
                                                    <Power className="size-3" />
                                                    {selectedFlow.status === 'active' ? 'Pause' : 'Activate'}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setDeletingFlow(selectedFlow)}
                                                    className="text-xs h-7 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                                                >
                                                    <Trash2 className="size-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="p-4 space-y-3">
                                        {/* Step 1: Trigger Node */}
                                        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 space-y-1">
                                            <div className="flex items-center justify-between text-xs font-semibold text-amber-600 dark:text-amber-400">
                                                <span className="flex items-center gap-1.5">
                                                    <Bot className="size-3.5" />
                                                    STEP 1: Trigger Condition
                                                </span>
                                                <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
                                                    Keywords Match
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-foreground font-mono bg-background/50 p-1.5 rounded border border-border/50">
                                                {selectedFlow.trigger_keywords}
                                            </p>
                                        </div>

                                        <div className="flex justify-center text-muted-foreground/60">
                                            <ArrowRight className="size-4 rotate-90" />
                                        </div>

                                        {/* Step 2: Interactive Greeting & Menu Node */}
                                        <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-3 space-y-1.5">
                                            <div className="flex items-center justify-between text-xs font-semibold text-blue-600 dark:text-blue-400">
                                                <span className="flex items-center gap-1.5">
                                                    <MessageSquare className="size-3.5" />
                                                    STEP 2: Automated Greeting &amp; Options Menu
                                                </span>
                                                <span className="text-[11px] text-muted-foreground font-normal">
                                                    {selectedFlow.options?.length || 0} Interactive Options
                                                </span>
                                            </div>
                                            <p className="text-xs text-foreground whitespace-pre-wrap bg-background/60 p-2 rounded border border-border/50 leading-relaxed font-sans">
                                                {selectedFlow.greeting_message}
                                            </p>
                                        </div>

                                        <div className="flex justify-center text-muted-foreground/60">
                                            <ArrowRight className="size-4 rotate-90" />
                                        </div>

                                        {/* Step 3: Interactive Branches */}
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between text-xs font-semibold text-foreground px-1">
                                                <span>STEP 3: Decision Branches</span>
                                                <span className="text-[11px] text-muted-foreground font-normal">
                                                    Automated action per selection
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                                {selectedFlow.options?.map((opt, idx) => {
                                                    const colors = [
                                                        'border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400',
                                                        'border-purple-500/30 bg-purple-500/5 text-purple-700 dark:text-purple-400',
                                                        'border-sky-500/30 bg-sky-500/5 text-sky-700 dark:text-sky-400',
                                                        'border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-400',
                                                        'border-rose-500/30 bg-rose-500/5 text-rose-700 dark:text-rose-400',
                                                    ];
                                                    const colorClass = colors[idx % colors.length];

                                                    return (
                                                        <div
                                                            key={opt.id}
                                                            className={`rounded-lg border p-2.5 space-y-1.5 ${colorClass}`}
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <span className="font-semibold text-xs">
                                                                    Branch {opt.id}: {opt.label}
                                                                </span>
                                                                {opt.action_type === 'human_handoff' && (
                                                                    <Badge variant="outline" className="text-[9px] bg-purple-500/10 text-purple-600 border-purple-500/20">
                                                                        Agent Handoff
                                                                    </Badge>
                                                                )}
                                                                {opt.action_type === 'followup' && (
                                                                    <Badge variant="outline" className="text-[9px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
                                                                        Next Step
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <p className="text-[11px] text-foreground/80 line-clamp-3 leading-snug">
                                                                {opt.reply_text}
                                                            </p>
                                                            {opt.followup_question && (
                                                                <p className="text-[10px] text-amber-600 dark:text-amber-400 border-t border-amber-500/20 pt-1 font-medium">
                                                                    ↳ Q: {opt.followup_question}
                                                                </p>
                                                            )}
                                                            {opt.followup_reply && (
                                                                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 border-t border-emerald-500/20 pt-1 font-medium">
                                                                    ↳ Ans Reply: {opt.followup_reply}
                                                                </p>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Live WhatsApp Simulator */}
                                <Card className="border-border shadow-2xs overflow-hidden">
                                    <div className="py-2.5 px-4 border-b border-border/80 bg-background flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                                            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                                <Bot className="size-3.5 text-[#47b672]" />
                                                Live WhatsApp Flow Simulator
                                            </span>
                                            <span className="text-[10px] text-muted-foreground font-mono">
                                                (Testing: {selectedFlow.name})
                                            </span>
                                        </div>

                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleRestartSimulator}
                                            className="text-xs h-7 text-muted-foreground hover:text-foreground gap-1"
                                            title="Restart simulation conversation"
                                        >
                                            <RotateCcw className="size-3" />
                                            Restart
                                        </Button>
                                    </div>

                                    <div className="p-3 bg-[#efeae2]/40 dark:bg-[#0c1317] space-y-3">
                                        <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                                            {previewChat.map((m, idx) => (
                                                <div
                                                    key={idx}
                                                    className={`flex flex-col ${
                                                        m.sender === 'user' ? 'items-end' : 'items-start'
                                                    }`}
                                                >
                                                    <div
                                                        className={`max-w-[85%] rounded-lg p-2.5 text-xs shadow-2xs whitespace-pre-wrap leading-relaxed ${
                                                            m.sender === 'user'
                                                                ? 'bg-[#d9fdd3] text-gray-900 dark:bg-[#005c4b] dark:text-gray-100 rounded-tr-none'
                                                                : 'bg-white text-gray-900 dark:bg-[#202c33] dark:text-gray-100 rounded-tl-none border border-black/5'
                                                        }`}
                                                    >
                                                        {m.text}
                                                    </div>

                                                    {/* Quick clickable options */}
                                                    {m.options && m.options.length > 0 && (
                                                        <div className="flex flex-wrap gap-1.5 mt-1.5 max-w-[85%]">
                                                            {m.options.map((opt) => (
                                                                <button
                                                                    key={opt.id}
                                                                    type="button"
                                                                    onClick={() => handleSimulatorSend(opt.id)}
                                                                    className="px-2.5 py-1 rounded-full bg-white dark:bg-[#202c33] border border-[#47b672]/40 text-[#28804c] dark:text-[#52c480] text-[11px] font-medium shadow-2xs hover:bg-[#47b672]/10 transition-colors flex items-center gap-1"
                                                                >
                                                                    <span className="font-bold">{opt.id}.</span> {opt.label}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>

                                        <form
                                            onSubmit={(e) => {
                                                e.preventDefault();
                                                handleSimulatorSend();
                                            }}
                                            className="flex gap-2 pt-1"
                                        >
                                            <Input
                                                value={previewInput}
                                                onChange={(e) => setPreviewInput(e.target.value)}
                                                placeholder={`Type 1, 2, or 3...`}
                                                className="text-xs bg-background"
                                            />
                                            <Button
                                                type="submit"
                                                size="sm"
                                                className="bg-[#47b672] hover:bg-[#3ca062] text-white h-9 px-3 shrink-0"
                                            >
                                                <Send className="size-3.5" />
                                            </Button>
                                        </form>
                                    </div>
                                </Card>
                            </>
                        ) : (
                            <Card className="border-dashed border-border p-12 text-center space-y-3">
                                <div className="mx-auto size-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                                    <GitBranch className="size-6" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-base font-semibold text-foreground">No Flow Selected</h3>
                                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                                        Select a flow from the left to visualize its decision pipeline or test it in the WhatsApp simulator.
                                    </p>
                                </div>
                                <Button
                                    size="sm"
                                    onClick={openCreateModal}
                                    className="bg-[#47b672] hover:bg-[#3ca062] text-white text-xs gap-1.5"
                                >
                                    <Plus className="size-3.5" />
                                    Create Flow
                                </Button>
                            </Card>
                        )}
                    </div>
                </div>
            </div>

            {/* Create / Edit Flow Modal */}
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <div className="flex items-center justify-between gap-2">
                            <DialogTitle className="text-base font-semibold flex items-center gap-2">
                                <GitBranch className="size-4 text-[#47b672]" />
                                {editingFlow ? `Edit Flow: ${editingFlow.name}` : 'Create WhatsApp Bot Flow'}
                            </DialogTitle>
                            {!editingFlow && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={loadSampleTemplate}
                                    className="text-[11px] h-7 gap-1 text-muted-foreground hover:text-foreground"
                                >
                                    <Sparkles className="size-3 text-amber-500" />
                                    <span>Fill Sample Template</span>
                                </Button>
                            )}
                        </div>
                        <DialogDescription className="text-xs text-muted-foreground">
                            Configure keyword triggers, automated welcome greeting, and interactive customer branches.
                        </DialogDescription>
                    </DialogHeader>

                    {formError && (
                        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-2.5 text-xs text-red-600 dark:text-red-400 flex items-start gap-2">
                            <AlertCircle className="size-4 shrink-0 mt-0.5" />
                            <span>{formError}</span>
                        </div>
                    )}

                    <form onSubmit={handleSaveFlow} className="space-y-4 py-1">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs font-medium">Flow Name *</Label>
                                <Input
                                    value={formName}
                                    onChange={(e) => setFormName(e.target.value)}
                                    placeholder="e.g. Lead Qualification or Product Catalog"
                                    className="text-xs"
                                    required
                                />
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs font-medium">Status *</Label>
                                <select
                                    value={formStatus}
                                    onChange={(e) => setFormStatus(e.target.value as 'active' | 'draft')}
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs focus:outline-none"
                                >
                                    <option value="active">Active (Responding to customers)</option>
                                    <option value="draft">Draft (Paused)</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs font-medium">Trigger Keywords (comma separated) *</Label>
                            <Input
                                value={formKeywords}
                                onChange={(e) => setFormKeywords(e.target.value)}
                                placeholder="e.g. hi, hello, price, quote, order, inquiry"
                                className="text-xs font-mono"
                                required
                            />
                            <p className="text-[10px] text-muted-foreground">
                                Flow starts when a customer sends any of these words.
                            </p>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs font-medium">Description (optional)</Label>
                            <Input
                                value={formDescription}
                                onChange={(e) => setFormDescription(e.target.value)}
                                placeholder="e.g. Explains web services and connects hot leads to sales team."
                                className="text-xs"
                            />
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs font-medium">Step 1: Automated Greeting &amp; Menu Message *</Label>
                            <textarea
                                rows={4}
                                value={formGreeting}
                                onChange={(e) => setFormGreeting(e.target.value)}
                                placeholder="👋 Welcome! Please choose from our options below (1, 2, or 3)..."
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs focus:outline-none leading-relaxed"
                                required
                            />
                            <p className="text-[10px] text-muted-foreground">
                                This message is sent immediately when a customer triggers this flow.
                            </p>
                        </div>

                        {/* Options / Branches */}
                        <div className="space-y-2.5 pt-1 border-t border-border/80">
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label className="text-xs font-semibold">Step 2: Interactive Menu Options &amp; Branches</Label>
                                    <p className="text-[10px] text-muted-foreground">
                                        Add multiple steps (1, 2, 3...). You can send auto replies, ask follow-up questions, or transfer to human agents.
                                    </p>
                                </div>
                                {formOptions.length < 10 && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={addFormOption}
                                        className="text-xs h-7 gap-1.5 border-[#47b672]/40 text-[#28804c] dark:text-[#52c480] hover:bg-[#47b672]/10"
                                    >
                                        <Plus className="size-3.5" />
                                        Add Step / Option
                                    </Button>
                                )}
                            </div>

                            <div className="space-y-3">
                                {formOptions.map((opt, idx) => (
                                    <div
                                        key={idx}
                                        className="rounded-lg border border-border p-3 bg-muted/20 space-y-2 relative"
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2 flex-1">
                                                <span className="size-5 rounded-full bg-[#47b672]/20 text-[#28804c] dark:text-[#52c480] text-[11px] font-bold flex items-center justify-center shrink-0">
                                                    {opt.id}
                                                </span>
                                                <Input
                                                    value={opt.label}
                                                    onChange={(e) => updateOptionField(idx, 'label', e.target.value)}
                                                    placeholder={`Option ${opt.id} Title (e.g. Web Development)`}
                                                    className="text-xs h-7"
                                                    required
                                                />
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <select
                                                    value={opt.action_type || 'reply'}
                                                    onChange={(e) =>
                                                        updateOptionField(idx, 'action_type', e.target.value)
                                                    }
                                                    className="rounded border border-input bg-background px-2 py-1 text-[11px] h-7 focus:outline-none"
                                                >
                                                    <option value="reply">Auto Reply (મેસેજ)</option>
                                                    <option value="followup">Ask Follow-up Question (આગળનો સવાલ)</option>
                                                    <option value="human_handoff">Human Handoff (એજન્ટ)</option>
                                                </select>

                                                {formOptions.length > 1 && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-7 text-muted-foreground hover:text-red-600"
                                                        onClick={() => removeFormOption(idx)}
                                                    >
                                                        <Trash2 className="size-3" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>

                                        <textarea
                                            rows={2}
                                            value={opt.reply_text}
                                            onChange={(e) => updateOptionField(idx, 'reply_text', e.target.value)}
                                            placeholder={`Bot reply for Step ${opt.id}...`}
                                            className="w-full rounded border border-input bg-background px-2.5 py-1.5 text-xs focus:outline-none"
                                            required
                                        />

                                        {opt.action_type === 'followup' && (
                                            <div className="space-y-2 pt-1.5 bg-amber-500/5 p-2.5 rounded-md border border-amber-500/20">
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                                        <CornerDownRight className="size-3" />
                                                        Next Follow-up Question (બોટ આગળ કયો સવાલ પૂછશે):
                                                    </Label>
                                                    <Input
                                                        value={opt.followup_question || ''}
                                                        onChange={(e) => updateOptionField(idx, 'followup_question', e.target.value)}
                                                        placeholder="e.g. What type of website or software do you need? Please share your requirement."
                                                        className="text-xs h-7 bg-background"
                                                    />
                                                </div>

                                                <div className="space-y-1 pt-1.5 border-t border-amber-500/15">
                                                    <Label className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                                        <CheckCircle2 className="size-3" />
                                                        Answer Completion Reply (ગ્રાહક જવાબ આપે ત્યારે બોટ શું રિપ્લાય કરશે):
                                                    </Label>
                                                    <textarea
                                                        rows={2}
                                                        value={opt.followup_reply || ''}
                                                        onChange={(e) => updateOptionField(idx, 'followup_reply', e.target.value)}
                                                        placeholder="e.g. ✅ Thank you! We have received your response. Our team will review your requirement and contact you shortly."
                                                        className="w-full rounded border border-input bg-background px-2.5 py-1.5 text-xs focus:outline-none"
                                                    />
                                                    <p className="text-[9px] text-muted-foreground">
                                                        જ્યારે ગ્રાહક ઉપરના સવાલનો જવાબ આપશે ત્યારે બોટ આ મેસેજ આપમેળે મોકલી આપશે.
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <DialogFooter className="flex flex-row justify-end items-center gap-3 pt-3 sm:gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={isSaving}
                                onClick={() => setIsFormOpen(false)}
                                className="text-xs px-4"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                size="sm"
                                disabled={isSaving}
                                className="bg-[#47b672] hover:bg-[#3ca062] text-white text-xs gap-1.5 px-4"
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="size-3.5 animate-spin" />
                                        <span>Saving Flow...</span>
                                    </>
                                ) : (
                                    <>
                                        <Check className="size-3.5" />
                                        <span>{editingFlow ? 'Update Flow' : 'Create Flow'}</span>
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Modal */}
            <Dialog open={!!deletingFlow} onOpenChange={(open) => !open && setDeletingFlow(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-red-100 dark:bg-red-950/50 text-red-600">
                                <Trash2 className="size-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-base font-semibold">Delete Bot Flow?</DialogTitle>
                                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                                    Are you sure you want to remove <span className="font-semibold text-foreground">"{deletingFlow?.name}"</span>?
                                    Automated replies for its trigger keywords will stop.
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
                            onClick={() => setDeletingFlow(null)}
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
                                    <span>Delete Flow</span>
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
