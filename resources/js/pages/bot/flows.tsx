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
    HelpCircle,
    ShoppingBag,
    Calendar,
    Headphones,
    BookOpen,
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

export const STARTER_TEMPLATES = [
    {
        id: 'inquiry_lead',
        category: 'Lead Capture',
        name: 'Customer Inquiry & Lead Qualification',
        description: 'Greets new WhatsApp contacts, showcases services, and collects their project requirements automatically.',
        keywords: 'hi, hello, hey, inquiry, services, price',
        greeting: "👋 Welcome to Sathwara InfoTech!\nHow can we help your business today?\n\n1️⃣ Web & Software Development\n2️⃣ WhatsApp API & Automation\n3️⃣ Talk to Support / Sales\n\nReply with 1, 2, or 3.",
        options: [
            {
                id: '1',
                label: 'Web Development',
                reply_text: '🌐 We build custom Laravel & React web applications, customer portals, and SaaS platforms tailored to your business needs!',
                action_type: 'followup' as const,
                followup_question: 'What type of website or software do you need? Please share your requirement details.',
                followup_reply: '✅ Thank you! Our technical team at Sathwara InfoTech has recorded your requirement and will contact you shortly.',
            },
            {
                id: '2',
                label: 'WhatsApp Automation',
                reply_text: '🚀 Our WhatsApp Cloud API solution enables broadcasts to 10,000+ contacts, shared team inbox, and 24/7 AI chatbots with 98% open rates!',
                action_type: 'reply' as const,
            },
            {
                id: '3',
                label: 'Talk to Support / Sales',
                reply_text: '👨‍💼 Notifying our team at Sathwara InfoTech! A support specialist will connect with you here shortly.',
                action_type: 'human_handoff' as const,
            },
        ],
    },
    {
        id: 'ecommerce_store',
        category: 'E-Commerce',
        name: 'E-Commerce & Product Catalog',
        description: 'Assists buyers with product browsing, order status tracking, and returns.',
        keywords: 'catalog, order, shop, product, buy, track',
        greeting: "🛍️ Welcome to our WhatsApp Store!\nHow can we assist your shopping today?\n\n1️⃣ Browse Full Product Catalog\n2️⃣ Track My Order Status\n3️⃣ Return / Exchange Inquiry\n4️⃣ Speak with Sales Executive\n\nReply with 1, 2, 3, or 4.",
        options: [
            {
                id: '1',
                label: 'Browse Catalog',
                reply_text: '📦 View our full product collection with prices and photos right on WhatsApp!\nVisit: wa.me/c/store\n\nAdd any item to cart and send your order here in chat.',
                action_type: 'reply' as const,
            },
            {
                id: '2',
                label: 'Track Order',
                reply_text: '🚚 Live Tracking Status:\nPlease reply with your 6-digit Order ID (e.g. #10492) and we will check live tracking status for you.',
                action_type: 'followup' as const,
                followup_question: 'What is your Order ID?',
                followup_reply: '✅ Thank you! Order found. Your delivery is in transit and expected to arrive within 2 business days.',
            },
            {
                id: '3',
                label: 'Return / Exchange',
                reply_text: '🔄 We offer a 7-day hassle-free return and exchange policy. Please state your reason and order number.',
                action_type: 'followup' as const,
                followup_question: 'Please state the reason for return/exchange and order number.',
                followup_reply: '✅ Return request logged! Our logistics partner will pick up the package within 24 hours.',
            },
            {
                id: '4',
                label: 'Sales Executive',
                reply_text: '👨‍💼 Connecting you with our sales specialist right now. One moment please!',
                action_type: 'human_handoff' as const,
            },
        ],
    },
    {
        id: 'support_faqs',
        category: 'Support & FAQs',
        name: 'Customer Support & Business FAQs',
        description: 'Instantly answers recurring questions about pricing, office timings, address, and live support.',
        keywords: 'help, support, faq, address, timings, hours, cost',
        greeting: "👋 Hello! Welcome to Sathwara InfoTech Support.\nChoose a topic below to get instant answers:\n\n1️⃣ Office Address & Location\n2️⃣ Working Hours & Timings\n3️⃣ Pricing & Subscription Plans\n4️⃣ Speak with Live Agent\n\nReply with 1, 2, 3, or 4.",
        options: [
            {
                id: '1',
                label: 'Office Address',
                reply_text: '📍 Sathwara InfoTech HQ:\nPlot 42, Tech Park, Satellite Road, Ahmedabad, Gujarat, India - 380015\n\nGoogle Maps: https://maps.google.com',
                action_type: 'reply' as const,
            },
            {
                id: '2',
                label: 'Working Hours',
                reply_text: '🕒 Our office and support lines are open Monday to Saturday, 9:30 AM to 6:30 PM IST. Online tickets are monitored 24/7!',
                action_type: 'reply' as const,
            },
            {
                id: '3',
                label: 'Pricing & Plans',
                reply_text: '💎 Annual Software Subscription: ₹9,999/year with unlimited contacts and multi-agent inbox. WhatsApp Cloud API rates are official Meta at cost (₹0.14 for Utility, ₹0.88 for Marketing).',
                action_type: 'reply' as const,
            },
            {
                id: '4',
                label: 'Live Agent Transfer',
                reply_text: '👨‍💼 Notifying our customer support department! An agent will take over this chat momentarily.',
                action_type: 'human_handoff' as const,
            },
        ],
    },
    {
        id: 'appointments',
        category: 'Consultation',
        name: 'Appointment & Consultation Booking',
        description: 'Guides prospects through scheduling a consultation, service visit, or meeting.',
        keywords: 'book, appointment, meeting, schedule, slot',
        greeting: "📅 Welcome! Schedule a consultation with our experts in just a few seconds.\n\n1️⃣ Schedule New Appointment\n2️⃣ Reschedule / Cancel Existing\n3️⃣ Consultation Fees & Services\n4️⃣ Talk to Reception\n\nReply with 1, 2, 3, or 4.",
        options: [
            {
                id: '1',
                label: 'Schedule Appointment',
                reply_text: 'Great! We offer consultations Monday to Saturday between 10:00 AM and 5:00 PM.',
                action_type: 'followup' as const,
                followup_question: 'Please state your Preferred Date and Time Slot (e.g. Tomorrow at 3:00 PM):',
                followup_reply: '✅ Appointment slot recorded! Our coordinator will review the schedule and confirm your calendar invite via WhatsApp.',
            },
            {
                id: '2',
                label: 'Reschedule / Cancel',
                reply_text: 'Please reply with your name and existing booking date so we can adjust your slot.',
                action_type: 'followup' as const,
                followup_question: 'What is your booking reference or name?',
                followup_reply: '✅ Reschedule request noted! We will contact you with alternative openings shortly.',
            },
            {
                id: '3',
                label: 'Consultation Fees',
                reply_text: '💡 Initial 20-minute discovery call is 100% complimentary! In-depth technical architecture audit is ₹2,500.',
                action_type: 'reply' as const,
            },
            {
                id: '4',
                label: 'Talk to Reception',
                reply_text: '📞 Ringing front desk... An associate will join this conversation in a moment.',
                action_type: 'human_handoff' as const,
            },
        ],
    },
];

interface Props {
    flows?: BotFlowItem[];
}

export default function BotFlows({ flows = [] }: Props) {
    const [flowList, setFlowList] = useState<BotFlowItem[]>(flows);
    const [selectedFlowId, setSelectedFlowId] = useState<string>(flows[0]?.id || '');
    const [searchQuery, setSearchQuery] = useState('');
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [showHowItWorksModal, setShowHowItWorksModal] = useState(false);

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

    // Load template into form state
    const applyTemplate = (t: (typeof STARTER_TEMPLATES)[0]) => {
        setFormName(t.name);
        setFormDescription(t.description);
        setFormKeywords(t.keywords);
        setFormStatus('active');
        setFormGreeting(t.greeting);
        setFormOptions(
            t.options.map((opt) => ({
                id: opt.id,
                label: opt.label,
                reply_text: opt.reply_text,
                action_type: opt.action_type,
                followup_question: 'followup_question' in opt ? (opt as any).followup_question || '' : '',
                followup_reply: 'followup_reply' in opt ? (opt as any).followup_reply || '' : '',
            }))
        );
        showToast(`Loaded "${t.name}" template!`);
    };

    // Open Form for Create with a selected template pre-filled
    const openCreateWithTemplate = (t: (typeof STARTER_TEMPLATES)[0]) => {
        setEditingFlow(null);
        applyTemplate(t);
        setFormError(null);
        setIsFormOpen(true);
    };

    // Load sample template for quick testing
    const loadSampleTemplate = () => {
        applyTemplate(STARTER_TEMPLATES[0]);
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

    const handleClearAllFlows = () => {
        if (!confirm(`Are you sure you want to delete all ${flowList.length} bot flow(s)? This cannot be undone.`)) return;
        router.delete('/flows/clear-all', {
            preserveScroll: true,
            onSuccess: () => {
                setFlowList([]);
                setSelectedFlowId('');
                showToast('All bot flows cleared.');
            },
            onError: () => {
                showToast('Failed to clear bot flows.');
            },
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

                {/* Compact Action Toolbar */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/60 pb-3.5">
                    <div className="flex items-center gap-2.5 flex-wrap">
                        <Badge variant="outline" className="text-xs bg-[#47b672]/10 text-[#28804c] dark:text-[#52c480] border-[#47b672]/30">
                            Interactive Selection Menus
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                            Create predefined selection menus (1, 2, 3...) so customers can pick an option and receive instant automated answers.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {flowList.length > 0 && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleClearAllFlows}
                                className="text-xs gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10 h-9"
                            >
                                <Trash2 className="size-3.5" />
                                Clear All Flows
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowHowItWorksModal(true)}
                            className="text-xs gap-1.5 border-border h-9"
                        >
                            <HelpCircle className="size-3.5 text-blue-600" />
                            How It Works
                        </Button>
                        <Button
                            size="sm"
                            onClick={openCreateModal}
                            className="bg-[#47b672] hover:bg-[#3ca062] text-white text-xs gap-1.5 shadow-sm font-semibold h-9 px-3.5"
                        >
                            <Plus className="size-3.5" />
                            Create New Flow
                        </Button>
                    </div>
                </div>

                {/* 3-Step Quick Help Guide */}
                <div className="rounded-xl border border-[#47b672]/20 bg-[#47b672]/5 p-3.5 sm:p-4 text-xs">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 font-semibold text-foreground">
                            <Sparkles className="size-4 text-[#47b672]" />
                            <span>How WhatsApp Bot Flows Work in 3 Easy Steps</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowHowItWorksModal(true)}
                            className="text-[11px] text-[#28804c] dark:text-[#52c480] font-semibold hover:underline"
                        >
                            Detailed Walkthrough &rarr;
                        </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-muted-foreground">
                        <div className="flex items-start gap-2 bg-background/70 p-2.5 rounded-lg border border-border/50">
                            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#47b672]/20 text-[#28804c] dark:text-[#52c480] font-bold text-[11px]">1</span>
                            <div>
                                <strong className="text-foreground block text-[11px]">Trigger Keyword</strong>
                                Customer types keywords like <em>hi, menu, price, order</em>.
                            </div>
                        </div>
                        <div className="flex items-start gap-2 bg-background/70 p-2.5 rounded-lg border border-border/50">
                            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold text-[11px]">2</span>
                            <div>
                                <strong className="text-foreground block text-[11px]">Welcome Greeting &amp; Menu</strong>
                                Bot automatically sends your welcome greeting with 1, 2, 3 options.
                            </div>
                        </div>
                        <div className="flex items-start gap-2 bg-background/70 p-2.5 rounded-lg border border-border/50">
                            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-400 font-bold text-[11px]">3</span>
                            <div>
                                <strong className="text-foreground block text-[11px]">Instant Answer or Agent</strong>
                                Customer replies with an option number to get instant answers or transfer to staff.
                            </div>
                        </div>
                    </div>
                </div>

                {/* 1-Click Starter Template Library */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between px-0.5">
                        <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            <Sparkles className="size-3.5 text-amber-500" />
                            1-Click Starter Templates (Pick one to start immediately)
                        </span>
                        <span className="text-[11px] text-muted-foreground">Pre-configured with industry-proven flows</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                        {STARTER_TEMPLATES.map((tmpl) => (
                            <Card
                                key={tmpl.id}
                                className="border-border hover:border-[#47b672]/60 hover:shadow-2xs transition-all flex flex-col justify-between p-3 bg-card"
                            >
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <Badge variant="outline" className="text-[9px] py-0 bg-muted">
                                            {tmpl.category}
                                        </Badge>
                                        <span className="text-[10px] text-muted-foreground font-mono">{tmpl.options.length} Options</span>
                                    </div>
                                    <h4 className="text-xs font-bold text-foreground line-clamp-1">{tmpl.name}</h4>
                                    <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                                        {tmpl.description}
                                    </p>
                                </div>
                                <div className="pt-2.5 mt-2 border-t border-border/60 flex items-center justify-between">
                                    <span className="text-[10px] font-mono text-muted-foreground truncate max-w-[120px]">
                                        {tmpl.keywords.split(',').slice(0, 2).join(',')}...
                                    </span>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => openCreateWithTemplate(tmpl)}
                                        className="h-6 text-[11px] font-semibold text-[#28804c] dark:text-[#52c480] hover:bg-[#47b672]/10 px-2 gap-1"
                                    >
                                        Use Template &rarr;
                                    </Button>
                                </div>
                            </Card>
                        ))}
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
                                {/* Clean Flow Details Card */}
                                <Card className="border-border shadow-2xs">
                                    <CardHeader className="pb-3 border-b border-border/80">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <CardTitle className="text-base font-bold text-foreground">
                                                        {selectedFlow.name}
                                                    </CardTitle>
                                                    <Badge
                                                        variant="outline"
                                                        className={`text-[10px] font-semibold ${
                                                            selectedFlow.status === 'active'
                                                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                                                : 'bg-muted text-muted-foreground'
                                                        }`}
                                                    >
                                                        {selectedFlow.status === 'active' ? '● Active' : '○ Draft'}
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    Triggered when customer sends: <span className="font-mono font-semibold text-foreground bg-muted px-1.5 py-0.5 rounded">{selectedFlow.trigger_keywords}</span>
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-1.5">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => openEditModal(selectedFlow)}
                                                    className="text-xs h-7 gap-1 font-semibold"
                                                >
                                                    <Edit3 className="size-3" />
                                                    Edit Flow
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleToggleStatus(selectedFlow)}
                                                    className={`text-xs h-7 gap-1 font-semibold ${
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

                                    <CardContent className="p-4 space-y-4">
                                        {/* Step 1: Greeting & Menu */}
                                        <div className="rounded-lg border border-border bg-card p-3 space-y-1.5">
                                            <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                                                <span className="flex items-center gap-1.5 text-[#47b672]">
                                                    <MessageSquare className="size-3.5" />
                                                    Step 1: Welcome Greeting Sent to Customer
                                                </span>
                                            </div>
                                            <p className="text-xs text-foreground whitespace-pre-wrap bg-muted/30 p-2.5 rounded-md border border-border/60 leading-relaxed font-sans">
                                                {selectedFlow.greeting_message}
                                            </p>
                                        </div>

                                        {/* Step 2: Interactive Menu Options */}
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between text-xs font-semibold text-foreground px-0.5">
                                                <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                                                    <Sliders className="size-3.5" />
                                                    Step 2: Menu Options &amp; Automated Replies ({selectedFlow.options?.length || 0})
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                                                {selectedFlow.options?.map((opt, idx) => (
                                                    <div
                                                        key={opt.id}
                                                        className="rounded-lg border border-border/80 bg-muted/20 p-3 space-y-2"
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <span className="font-semibold text-xs text-foreground flex items-center gap-1">
                                                                <span className="size-4 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                                                                    {opt.id}
                                                                </span>
                                                                {opt.label}
                                                            </span>
                                                            {opt.action_type === 'human_handoff' && (
                                                                <Badge variant="outline" className="text-[9px] bg-purple-500/10 text-purple-600 border-purple-500/20">
                                                                    Staff Handoff
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-muted-foreground leading-relaxed bg-background/80 p-2 rounded border border-border/50">
                                                            {opt.reply_text}
                                                        </p>
                                                    </div>
                                                ))}
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
                <DialogContent className="w-[calc(100vw-1.25rem)] sm:max-w-2xl max-h-[calc(100dvh-1.5rem)] sm:max-h-[88vh] flex flex-col p-0 gap-0 overflow-hidden">
                    <DialogHeader className="p-4 sm:p-5 pb-3 border-b border-border/70 shrink-0 pr-12 text-left">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pr-1">
                            <DialogTitle className="text-sm sm:text-base font-semibold flex items-start sm:items-center gap-2 leading-snug">
                                <GitBranch className="size-4 text-[#47b672] shrink-0 mt-0.5 sm:mt-0" />
                                <span className="line-clamp-2 sm:line-clamp-none break-words">
                                    {editingFlow ? `Edit Flow: ${editingFlow.name}` : 'Create WhatsApp Bot Flow'}
                                </span>
                            </DialogTitle>
                            {!editingFlow && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={loadSampleTemplate}
                                    className="text-[11px] h-7 gap-1 text-muted-foreground hover:text-foreground self-start sm:self-auto shrink-0"
                                >
                                    <Sparkles className="size-3 text-amber-500" />
                                    <span>Fill Sample Template</span>
                                </Button>
                            )}
                        </div>
                        <DialogDescription className="text-xs text-muted-foreground mt-1 pr-1">
                            Configure keyword triggers, automated welcome greeting, and interactive customer branches.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSaveFlow} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 min-h-0">
                            {!editingFlow && (
                                <div className="p-2.5 rounded-lg bg-muted/40 border border-border/70 space-y-1.5">
                                    <span className="text-[11px] font-semibold text-foreground flex items-center gap-1">
                                        <Sparkles className="size-3 text-amber-500" />
                                        Choose a pre-configured template to autofill:
                                    </span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {STARTER_TEMPLATES.map((tmpl) => (
                                            <button
                                                key={tmpl.id}
                                                type="button"
                                                onClick={() => applyTemplate(tmpl)}
                                                className="px-2 py-0.5 rounded text-[10px] font-medium bg-background border border-border hover:border-[#47b672] hover:text-[#47b672] transition-colors"
                                            >
                                                {tmpl.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {formError && (
                                <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-2.5 text-xs text-red-600 dark:text-red-400 flex items-start gap-2">
                                    <AlertCircle className="size-4 shrink-0 mt-0.5" />
                                    <span>{formError}</span>
                                </div>
                            )}

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
                                                        <option value="reply">Instant Auto-Reply</option>
                                                        <option value="followup">Ask Follow-up Question</option>
                                                        <option value="human_handoff">Live Agent Handoff</option>
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
                                                            Next Follow-up Question (What the bot asks customer next):
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
                                                            Automated Confirmation Reply (Sent after customer answers):
                                                        </Label>
                                                        <textarea
                                                            rows={2}
                                                            value={opt.followup_reply || ''}
                                                            onChange={(e) => updateOptionField(idx, 'followup_reply', e.target.value)}
                                                            placeholder="e.g. ✅ Thank you! We have received your response. Our team will review your requirement and contact you shortly."
                                                            className="w-full rounded border border-input bg-background px-2.5 py-1.5 text-xs focus:outline-none"
                                                        />
                                                        <p className="text-[9px] text-muted-foreground">
                                                            Once customer replies to the follow-up question, the bot immediately confirms receipt with this message.
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="p-3 sm:p-4 border-t border-border/70 bg-card shrink-0 flex flex-row justify-end items-center gap-2.5">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={isSaving}
                                onClick={() => setIsFormOpen(false)}
                                className="text-xs px-4 h-8"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                size="sm"
                                disabled={isSaving}
                                className="bg-[#47b672] hover:bg-[#3ca062] text-white text-xs gap-1.5 px-4 h-8 shadow-xs"
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
                <DialogContent className="w-[calc(100vw-1.25rem)] sm:max-w-md p-4 sm:p-5">
                    <DialogHeader className="pr-10 text-left">
                        <div className="flex items-start gap-3">
                            <div className="p-2 rounded-full bg-red-100 dark:bg-red-950/50 text-red-600 shrink-0 mt-0.5">
                                <Trash2 className="size-5" />
                            </div>
                            <div className="space-y-1 min-w-0">
                                <DialogTitle className="text-base font-semibold">Delete Bot Flow?</DialogTitle>
                                <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
                                    Are you sure you want to remove <span className="font-semibold text-foreground">"{deletingFlow?.name}"</span>?
                                    Automated replies for its trigger keywords will stop.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <DialogFooter className="flex flex-row justify-end items-center gap-2.5 pt-3 sm:gap-2.5">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isDeleting}
                            onClick={() => setDeletingFlow(null)}
                            className="text-xs px-4 h-8"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            disabled={isDeleting}
                            onClick={handleConfirmDelete}
                            className="text-xs gap-1.5 px-4 h-8"
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

            {/* How It Works Walkthrough Dialog */}
            <Dialog open={showHowItWorksModal} onOpenChange={setShowHowItWorksModal}>
                <DialogContent className="w-[calc(100vw-1.25rem)] sm:max-w-xl max-h-[calc(100dvh-1.5rem)] sm:max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
                    <DialogHeader className="p-4 sm:p-5 pb-3 border-b border-border/70 shrink-0 pr-12 text-left">
                        <DialogTitle className="text-base font-bold flex items-center gap-2">
                            <GitBranch className="size-5 text-[#47b672] shrink-0" />
                            <span>How WhatsApp Bot Flows Work</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground mt-1">
                            A complete breakdown of automated menu bots, keywords, and human agent handoff.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs min-h-0">
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2 font-bold text-foreground">
                                <span className="size-5 rounded-full bg-[#47b672]/20 text-[#28804c] dark:text-[#52c480] flex items-center justify-center text-[10px] font-bold">1</span>
                                <span>Inbound Trigger Keywords</span>
                            </div>
                            <p className="text-muted-foreground text-[11px] leading-relaxed pl-7">
                                When a customer sends any message containing your trigger keywords (e.g. <em>hi, hello, menu, price, services</em>), the platform identifies the matched flow and instantly engages them.
                            </p>
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2 font-bold text-foreground">
                                <span className="size-5 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center text-[10px] font-bold">2</span>
                                <span>Automated Welcome Greeting &amp; Numbered Menu</span>
                            </div>
                            <p className="text-muted-foreground text-[11px] leading-relaxed pl-7">
                                The bot sends your customized greeting message presenting numbered options (e.g. 1. Web Development, 2. WhatsApp API, 3. Talk to Support).
                            </p>
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2 font-bold text-foreground">
                                <span className="size-5 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center text-[10px] font-bold">3</span>
                                <span>Interactive Decision Branches</span>
                            </div>
                            <div className="pl-7 space-y-1.5 text-[11px] text-muted-foreground">
                                <div>
                                    <strong className="text-foreground">Instant Auto-Reply:</strong> Answers with pricing, services, or catalog links immediately.
                                </div>
                                <div>
                                    <strong className="text-foreground">Ask Follow-up Question:</strong> Prompts the user (e.g. <em>"What is your project requirement?"</em>) and confirms receipt upon reply.
                                </div>
                                <div>
                                    <strong className="text-foreground">Live Agent Transfer:</strong> Pauses automated bot responses and creates an alert for your human agents in the Shared Team Inbox.
                                </div>
                            </div>
                        </div>

                        <div className="p-3 bg-muted/40 rounded-lg border border-border text-[11px] space-y-1">
                            <span className="font-bold text-foreground">Pro Tip: Testing your flow</span>
                            <p className="text-muted-foreground">
                                Use the Live WhatsApp Simulator on the right of the screen. You can click on the option bubbles directly to simulate user interactions without sending real messages!
                            </p>
                        </div>
                    </div>

                    <DialogFooter className="p-3 sm:p-4 border-t border-border/70 bg-card shrink-0 flex flex-row justify-end items-center">
                        <Button
                            type="button"
                            onClick={() => setShowHowItWorksModal(false)}
                            className="bg-[#47b672] hover:bg-[#3ca062] text-white text-xs h-8 px-4 font-semibold"
                        >
                            Got It!
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
