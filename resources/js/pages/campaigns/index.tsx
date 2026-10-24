import { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Send,
    Plus,
    Search,
    CheckCircle2,
    Clock,
    AlertCircle,
    ArrowLeft,
    Sparkles,
    Users,
    Check,
    Radio,
    HelpCircle,
    RefreshCw,
    Loader2,
    ChevronRight,
    MessageSquare,
    Globe,
    Layers,
    FileText,
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

interface TemplateItem {
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

interface ContactItem {
    id: string;
    name: string;
    phone: string;
    label: string;
}

interface CampaignHistoryItem {
    id: string;
    name: string;
    templateName: string;
    templateLanguage: string;
    recipientsCount: number;
    successCount: number;
    failedCount: number;
    status: string;
    date: string;
}

interface CampaignsPageProps {
    templates?: TemplateItem[];
    contacts?: ContactItem[];
    recentCampaigns?: CampaignHistoryItem[];
    channel?: {
        id: string;
        name: string;
        phoneNumber?: string;
        status: string;
    } | null;
}

export default function CampaignsList({
    templates = [],
    contacts = [],
    recentCampaigns = [],
    channel,
}: CampaignsPageProps) {
    const { tenant } = usePage().props as any;
    const currentOrg = tenant?.current;

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [isConnectPromptOpen, setIsConnectPromptOpen] = useState(false);

    // Broadcast Modal State
    const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<TemplateItem | null>(null);
    const [campaignName, setCampaignName] = useState('');
    const [audienceMode, setAudienceMode] = useState<'contacts' | 'manual'>('contacts');
    const [selectedContactIds, setSelectedContactIds] = useState<string[]>(
        contacts.map((c) => c.id)
    );
    const [manualPhoneInput, setManualPhoneInput] = useState('');
    const [templateParams, setTemplateParams] = useState<string[]>([]);
    const [isSending, setIsSending] = useState(false);
    const [broadcastResult, setBroadcastResult] = useState<{
        success: boolean;
        message: string;
        sent?: number;
        failed?: number;
    } | null>(null);

    // Filter templates
    const filteredTemplates = templates.filter((tpl) => {
        if (selectedLanguage !== 'all' && tpl.language !== selectedLanguage) {
            return false;
        }
        if (selectedCategory !== 'all' && tpl.category !== selectedCategory) {
            return false;
        }
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            return (
                tpl.name.toLowerCase().includes(q) ||
                tpl.body.toLowerCase().includes(q) ||
                tpl.category.toLowerCase().includes(q)
            );
        }
        return true;
    });

    const openBroadcastModal = (template?: TemplateItem) => {
        const target = template || templates[0] || null;
        setSelectedTemplate(target);
        if (target) {
            setCampaignName(
                `${target.name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())} Broadcast`
            );
            // Count variables in body
            const matches = target.body.match(/\{\{(\d+)\}\}/g) || [];
            const count = matches.length;
            const initialParams = target.exampleParams && target.exampleParams.length >= count
                ? target.exampleParams.slice(0, count)
                : Array.from({ length: count }, (_, i) => `Value ${i + 1}`);
            setTemplateParams(initialParams);
        } else {
            setCampaignName('WhatsApp Broadcast Campaign');
            setTemplateParams([]);
        }
        setSelectedContactIds(contacts.map((c) => c.id));
        setManualPhoneInput('');
        setBroadcastResult(null);
        setIsBroadcastOpen(true);
    };

    const handleNewCampaignClick = () => {
        if (!channel || channel.status !== 'connected') {
            setIsConnectPromptOpen(true);
            return;
        }
        if (templates.length === 0) {
            alert('No approved Meta templates found for this workspace. Please create templates in your WhatsApp Business Manager.');
            return;
        }
        openBroadcastModal();
    };

    const handleSelectTemplateInModal = (templateName: string) => {
        const found = templates.find((t) => t.name === templateName);
        if (found) {
            setSelectedTemplate(found);
            setCampaignName(
                `${found.name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())} Broadcast`
            );
            const matches = found.body.match(/\{\{(\d+)\}\}/g) || [];
            const count = matches.length;
            const initialParams = found.exampleParams && found.exampleParams.length >= count
                ? found.exampleParams.slice(0, count)
                : Array.from({ length: count }, (_, i) => `Value ${i + 1}`);
            setTemplateParams(initialParams);
        }
    };

    const handleParamChange = (index: number, value: string) => {
        setTemplateParams((prev) => {
            const next = [...prev];
            next[index] = value;
            return next;
        });
    };

    const handleToggleContact = (id: string) => {
        setSelectedContactIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    const handleSelectAllContacts = () => {
        if (selectedContactIds.length === contacts.length) {
            setSelectedContactIds([]);
        } else {
            setSelectedContactIds(contacts.map((c) => c.id));
        }
    };

    // Calculate active recipients
    const getRecipientsList = () => {
        if (audienceMode === 'contacts') {
            return contacts
                .filter((c) => selectedContactIds.includes(c.id))
                .map((c) => ({ phone: c.phone, name: c.name }));
        }
        // Manual numbers parsed by line or comma
        const lines = manualPhoneInput
            .split(/[\n,;]+/)
            .map((s) => s.trim())
            .filter((s) => s.length >= 8);
        return lines.map((phone) => ({ phone, name: 'Valued Customer' }));
    };

    const recipientsCount = getRecipientsList().length;

    // Generate live preview body
    const generatePreviewBody = () => {
        if (!selectedTemplate) return '';
        let text = selectedTemplate.body;
        templateParams.forEach((param, idx) => {
            const placeholder = new RegExp(`\\{\\{${idx + 1}\\}\\}`, 'g');
            text = text.replace(placeholder, param || `[Param ${idx + 1}]`);
        });
        return text;
    };

    const handleExecuteBroadcast = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTemplate) return;

        const recipients = getRecipientsList();
        if (recipients.length === 0) {
            setBroadcastResult({
                success: false,
                message: 'Please select at least 1 recipient for this broadcast.',
            });
            return;
        }

        setIsSending(true);
        setBroadcastResult(null);

        try {
            const res = await fetch('/campaigns/broadcast', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN':
                        (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)
                            ?.content || '',
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
            if (data.success) {
                setBroadcastResult({
                    success: true,
                    message: data.message || `Broadcast launched successfully!`,
                    sent: data.success_count,
                    failed: data.failed_count,
                });
                setTimeout(() => {
                    setIsBroadcastOpen(false);
                    router.reload({ only: ['recentCampaigns', 'contacts'] });
                }, 1800);
            } else {
                setBroadcastResult({
                    success: false,
                    message: data.message || 'Failed to dispatch broadcast campaign.',
                });
            }
        } catch (err: any) {
            setBroadcastResult({
                success: false,
                message: err.message || 'Network error occurred.',
            });
        } finally {
            setIsSending(false);
        }
    };

    return (
        <>
            <Head title="WhatsApp Broadcasts & Meta Campaigns - Sathwara InfoTech" />

            <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-6 min-w-0">
                {/* Header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Button
                                variant="ghost"
                                size="sm"
                                asChild
                                className="h-7 text-xs text-muted-foreground p-0 hover:text-foreground"
                            >
                                <Link href="/dashboard">
                                    <ArrowLeft className="size-3.5 mr-1" />
                                    Dashboard
                                </Link>
                            </Button>
                        </div>
                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            <Send className="size-6 text-[#47b672]" />
                            WhatsApp Broadcasts &amp; Campaigns
                        </h1>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                            Broadcast official Meta-approved WhatsApp templates to your audience with live delivery tracking.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            onClick={handleNewCampaignClick}
                            className="bg-[#47b672] hover:bg-[#3ca062] text-white gap-1.5 h-9 text-xs font-semibold shadow-xs"
                        >
                            <Plus className="size-4" />
                            New Campaign
                        </Button>
                    </div>
                </div>

                {/* Empty State for Campaigns */}
                {recentCampaigns.length === 0 && (
                    <Card className="border-border shadow-2xs">
                        <CardContent className="flex flex-col items-center justify-center p-8 sm:p-12 text-center">
                            <div className="size-14 rounded-full bg-[#47b672]/15 flex items-center justify-center text-[#28804c] dark:text-[#52c480] mb-3">
                                <Send className="size-6 text-[#47b672]" />
                            </div>
                            <h3 className="text-base font-bold text-foreground">
                                No Broadcast Campaigns Yet
                            </h3>
                            <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1 mb-4 leading-relaxed">
                                Broadcast official Meta-approved WhatsApp templates to your audience with live delivery tracking.
                            </p>
                            <Button
                                onClick={handleNewCampaignClick}
                                className="bg-[#47b672] hover:bg-[#3ca062] text-white text-xs font-semibold gap-1.5 h-9 px-4 shadow-xs"
                            >
                                <Plus className="size-4" />
                                New Campaign
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Recent Broadcast Campaigns History */}
                {recentCampaigns.length > 0 && (
                    <Card className="border-border shadow-2xs">
                        <CardHeader className="pb-3 pt-4 px-4 sm:px-6">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-xs sm:text-sm font-bold flex items-center gap-2">
                                    <Clock className="size-4 text-[#47b672]" />
                                    Recent Broadcast Activity
                                </CardTitle>
                                <span className="text-[11px] text-muted-foreground">
                                    {recentCampaigns.length} campaigns dispatched
                                </span>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-muted/40 border-y border-border/70 text-[11px] uppercase tracking-wider text-muted-foreground">
                                        <tr>
                                            <th className="py-2.5 px-4 font-semibold">Campaign Name</th>
                                            <th className="py-2.5 px-4 font-semibold">Template</th>
                                            <th className="py-2.5 px-4 font-semibold">Language</th>
                                            <th className="py-2.5 px-4 font-semibold">Recipients</th>
                                            <th className="py-2.5 px-4 font-semibold">Status</th>
                                            <th className="py-2.5 px-4 font-semibold text-right">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/50">
                                        {recentCampaigns.map((camp) => (
                                            <tr key={camp.id} className="hover:bg-muted/30 transition-colors">
                                                <td className="py-2.5 px-4 font-medium text-foreground">
                                                    {camp.name}
                                                </td>
                                                <td className="py-2.5 px-4 font-mono text-[11px] text-muted-foreground">
                                                    {camp.templateName}
                                                </td>
                                                <td className="py-2.5 px-4 text-muted-foreground uppercase text-[10px]">
                                                    {camp.templateLanguage}
                                                </td>
                                                <td className="py-2.5 px-4 text-foreground font-semibold">
                                                    {camp.successCount} / {camp.recipientsCount}
                                                    {camp.failedCount > 0 && (
                                                        <span className="text-destructive text-[10px] ml-1">
                                                            ({camp.failedCount} failed)
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-2.5 px-4">
                                                    <span
                                                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                                            camp.status === 'completed'
                                                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                                                : camp.status === 'partial'
                                                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                                                : 'bg-destructive/10 text-destructive'
                                                        }`}
                                                    >
                                                        <span
                                                            className={`size-1.5 rounded-full ${
                                                                camp.status === 'completed'
                                                                    ? 'bg-emerald-500'
                                                                    : camp.status === 'partial'
                                                                    ? 'bg-amber-500'
                                                                    : 'bg-destructive'
                                                            }`}
                                                        />
                                                        {camp.status}
                                                    </span>
                                                </td>
                                                <td className="py-2.5 px-4 text-right text-[11px] text-muted-foreground font-mono">
                                                    {camp.date}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Templates Section */}
                {templates.length > 0 ? (
                    <>
                        {/* Templates Filter & Search Controls */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border">
                            <div className="flex flex-wrap items-center gap-2">
                                {/* Language Filter */}
                                <div className="flex items-center gap-1 text-xs">
                                    <span className="text-[11px] text-muted-foreground font-medium mr-1">Language:</span>
                                    {['all', 'en_US', 'gu', 'hi'].map((lang) => (
                                        <button
                                            key={lang}
                                            type="button"
                                            onClick={() => setSelectedLanguage(lang)}
                                            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                                                selectedLanguage === lang
                                                    ? 'bg-[#47b672] text-white shadow-2xs'
                                                    : 'bg-muted/60 text-muted-foreground hover:text-foreground'
                                            }`}
                                        >
                                            {lang === 'all'
                                                ? 'All'
                                                : lang === 'en_US'
                                                ? 'English'
                                                : lang === 'gu'
                                                ? 'Gujarati'
                                                : 'Hindi'}
                                        </button>
                                    ))}
                                </div>

                                {/* Category Filter */}
                                <div className="flex items-center gap-1 text-xs ml-0 sm:ml-2">
                                    <span className="text-[11px] text-muted-foreground font-medium mr-1">Category:</span>
                                    {['all', 'UTILITY', 'MARKETING'].map((cat) => (
                                        <button
                                            key={cat}
                                            type="button"
                                            onClick={() => setSelectedCategory(cat)}
                                            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                                                selectedCategory === cat
                                                    ? 'bg-foreground text-background shadow-2xs'
                                                    : 'bg-muted/60 text-muted-foreground hover:text-foreground'
                                            }`}
                                        >
                                            {cat === 'all' ? 'All' : cat}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-3 top-2.5 size-3.5 text-muted-foreground" />
                                <Input
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search templates..."
                                    className="pl-9 h-8 text-xs bg-background"
                                />
                            </div>
                        </div>

                        {/* Templates Grid */}
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {filteredTemplates.map((tpl) => (
                                <Card
                                    key={tpl.id}
                                    className="border-border flex flex-col justify-between hover:border-[#47b672]/50 transition-colors shadow-2xs"
                                >
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center justify-between gap-2">
                                            <Badge variant="outline" className="text-[10px] font-mono uppercase">
                                                {tpl.category}
                                            </Badge>
                                            <div className="flex items-center gap-1.5">
                                                <Badge variant="secondary" className="text-[10px] uppercase font-mono">
                                                    {tpl.language}
                                                </Badge>
                                                <Badge className="bg-emerald-600 text-white text-[10px] hover:bg-emerald-600 font-semibold">
                                                    {tpl.status}
                                                </Badge>
                                            </div>
                                        </div>
                                        <CardTitle className="text-sm font-bold font-mono mt-2 truncate text-foreground">
                                            {tpl.name}
                                        </CardTitle>
                                        <CardDescription className="text-xs">
                                            Meta Cost Estimate:{' '}
                                            <strong className="text-foreground">{tpl.costEstimate}</strong>
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div className="rounded-lg bg-muted/30 p-3 text-xs text-muted-foreground leading-relaxed border border-border/50 min-h-24 max-h-36 overflow-y-auto whitespace-pre-wrap">
                                            {tpl.body}
                                        </div>

                                        {tpl.buttons && tpl.buttons.length > 0 && (
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                {tpl.buttons.map((btn, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="text-[10px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20"
                                                    >
                                                        🔘 {btn}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        <Button
                                            onClick={() => openBroadcastModal(tpl)}
                                            size="sm"
                                            className="w-full text-xs h-8 bg-[#47b672] hover:bg-[#3da163] text-white font-semibold gap-1.5 shadow-2xs"
                                        >
                                            <Send className="size-3.5" />
                                            Broadcast This Template
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {filteredTemplates.length === 0 && (
                            <div className="flex flex-col items-center justify-center p-12 text-center bg-card rounded-xl border border-dashed border-border">
                                <FileText className="size-8 text-muted-foreground mb-2" />
                                <h3 className="text-sm font-semibold text-foreground">No templates matched</h3>
                                <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                                    Try adjusting your search query or language filter to discover available templates.
                                </p>
                            </div>
                        )}
                    </>
                ) : channel && channel.status === 'connected' ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center bg-card rounded-2xl border border-dashed border-border shadow-2xs space-y-3 my-4">
                        <div className="size-14 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                            <FileText className="size-7 opacity-60" />
                        </div>
                        <div className="max-w-md space-y-1">
                            <h3 className="text-base font-bold text-foreground">
                                No Templates Found on Meta
                            </h3>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                No approved WhatsApp message templates were found in your Meta WABA account for this workspace. Please create or submit templates for approval in your Meta WhatsApp Business Manager.
                            </p>
                        </div>
                    </div>
                ) : null}
            </div>

            {/* WhatsApp Connect Required Modal */}
            <Dialog open={isConnectPromptOpen} onOpenChange={setIsConnectPromptOpen}>
                <DialogContent className="sm:max-w-md text-center p-6">
                    <div className="size-14 rounded-full bg-amber-500/15 flex items-center justify-center text-amber-600 dark:text-amber-400 mx-auto mb-2">
                        <Radio className="size-7" />
                    </div>
                    <DialogHeader className="text-center sm:text-center">
                        <DialogTitle className="text-base font-bold text-foreground">
                            WhatsApp Channel Not Connected
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                            First you need to connect your WhatsApp Business number to <strong>{currentOrg?.name || 'this workspace'}</strong> before you can fetch approved Meta templates and launch broadcast campaigns.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsConnectPromptOpen(false)}
                            className="w-full sm:w-auto text-xs h-9"
                        >
                            Cancel
                        </Button>
                        <Button
                            asChild
                            size="sm"
                            className="bg-[#47b672] hover:bg-[#3ca062] text-white text-xs font-semibold gap-1.5 h-9 px-4 shadow-xs w-full sm:w-auto"
                        >
                            <Link href="/whatsapp/connect">
                                Connect WhatsApp Number
                            </Link>
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Broadcast Launch Modal Dialog */}
            <Dialog open={isBroadcastOpen} onOpenChange={setIsBroadcastOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <form onSubmit={handleExecuteBroadcast} className="space-y-4">
                        <DialogHeader>
                            <DialogTitle className="text-base font-bold flex items-center gap-2">
                                <Send className="size-5 text-[#47b672]" />
                                Launch WhatsApp Broadcast Campaign
                            </DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground">
                                Broadcast this verified Meta template to multiple customer WhatsApp numbers simultaneously.
                            </DialogDescription>
                        </DialogHeader>

                        {broadcastResult && (
                            <div
                                className={`p-3 rounded-lg text-xs font-medium ${
                                    broadcastResult.success
                                        ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30'
                                        : 'bg-destructive/10 text-destructive border border-destructive/30'
                                }`}
                            >
                                {broadcastResult.message}
                            </div>
                        )}

                        <div className="space-y-4">
                            {/* Campaign Name */}
                            <div className="space-y-1">
                                <Label className="text-xs font-semibold">Campaign Name</Label>
                                <Input
                                    value={campaignName}
                                    onChange={(e) => setCampaignName(e.target.value)}
                                    placeholder="e.g. October Discount Reminder"
                                    className="text-xs"
                                    required
                                />
                            </div>

                            {/* Template Selector */}
                            <div className="space-y-1">
                                <Label className="text-xs font-semibold">Select Meta Template</Label>
                                <select
                                    value={selectedTemplate?.name || ''}
                                    onChange={(e) => handleSelectTemplateInModal(e.target.value)}
                                    className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium"
                                >
                                    {templates.map((t) => (
                                        <option key={t.id} value={t.name}>
                                            {t.name} ({t.language}) - {t.category}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Dynamic Variable Customization */}
                            {templateParams.length > 0 && (
                                <div className="space-y-2 rounded-xl border border-border bg-muted/20 p-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                            <Sparkles className="size-3.5 text-[#47b672]" />
                                            Template Variable Values
                                        </span>
                                        <span className="text-[10px] text-muted-foreground">
                                            Fill values for placeholders
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                                        {templateParams.map((paramVal, idx) => (
                                            <div key={idx} className="space-y-1">
                                                <Label className="text-[11px] text-muted-foreground font-mono">
                                                    Variable &#123;&#123;{idx + 1}&#125;&#125;
                                                </Label>
                                                <Input
                                                    value={paramVal}
                                                    onChange={(e) => handleParamChange(idx, e.target.value)}
                                                    placeholder={`Value for {{${idx + 1}}}`}
                                                    className="text-xs h-8 bg-background"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Live WhatsApp Bubble Preview */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                                    <MessageSquare className="size-3.5 text-emerald-600" />
                                    Customer Message Preview:
                                </Label>
                                <div className="rounded-xl bg-[#e5ddd5] dark:bg-[#111b21] p-3 text-xs shadow-inner">
                                    <div className="max-w-[85%] rounded-lg bg-white dark:bg-[#202c33] p-2.5 shadow-sm text-foreground text-xs leading-relaxed space-y-1.5">
                                        <p className="whitespace-pre-wrap">{generatePreviewBody()}</p>
                                        <div className="text-[9px] text-muted-foreground text-right">
                                            12:00 PM ✓✓
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Audience / Recipients Selection */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-semibold flex items-center gap-1.5">
                                        <Users className="size-3.5 text-[#47b672]" />
                                        Target Audience ({recipientsCount} selected)
                                    </Label>
                                    <div className="flex items-center gap-1 rounded-lg bg-muted p-0.5 text-xs">
                                        <button
                                            type="button"
                                            onClick={() => setAudienceMode('contacts')}
                                            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                                                audienceMode === 'contacts'
                                                    ? 'bg-card text-foreground shadow-2xs font-semibold'
                                                    : 'text-muted-foreground hover:text-foreground'
                                            }`}
                                        >
                                            CRM Contacts ({contacts.length})
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setAudienceMode('manual')}
                                            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                                                audienceMode === 'manual'
                                                    ? 'bg-card text-foreground shadow-2xs font-semibold'
                                                    : 'text-muted-foreground hover:text-foreground'
                                            }`}
                                        >
                                            Paste Numbers
                                        </button>
                                    </div>
                                </div>

                                {audienceMode === 'contacts' ? (
                                    <div className="rounded-lg border border-border bg-card p-2 space-y-2 max-h-40 overflow-y-auto">
                                        <div className="flex items-center justify-between border-b border-border/60 pb-1.5 px-1">
                                            <span className="text-[11px] text-muted-foreground font-medium">
                                                Select contacts from current workspace:
                                            </span>
                                            <button
                                                type="button"
                                                onClick={handleSelectAllContacts}
                                                className="text-[11px] text-[#47b672] font-semibold hover:underline"
                                            >
                                                {selectedContactIds.length === contacts.length
                                                    ? 'Deselect All'
                                                    : 'Select All'}
                                            </button>
                                        </div>
                                        {contacts.length === 0 ? (
                                            <div className="py-4 text-center text-xs text-muted-foreground">
                                                No contacts in this workspace yet. Switch to "Paste Numbers" tab to broadcast to any phone number.
                                            </div>
                                        ) : (
                                            contacts.map((c) => {
                                                const isChecked = selectedContactIds.includes(c.id);
                                                return (
                                                    <label
                                                        key={c.id}
                                                        className="flex items-center justify-between p-1.5 rounded hover:bg-muted/50 cursor-pointer text-xs transition-colors"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="checkbox"
                                                                checked={isChecked}
                                                                onChange={() => handleToggleContact(c.id)}
                                                                className="rounded border-input text-emerald-600 focus:ring-emerald-500"
                                                            />
                                                            <span className="font-semibold text-foreground">
                                                                {c.name}
                                                            </span>
                                                            <span className="font-mono text-muted-foreground text-[11px]">
                                                                {c.phone}
                                                            </span>
                                                        </div>
                                                        <Badge variant="outline" className="text-[9px] py-0 px-1.5">
                                                            {c.label}
                                                        </Badge>
                                                    </label>
                                                );
                                            })
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        <textarea
                                            rows={3}
                                            value={manualPhoneInput}
                                            onChange={(e) => setManualPhoneInput(e.target.value)}
                                            placeholder="Paste recipient numbers (separated by comma or newline), e.g.&#10;919898696798&#10;917405402826"
                                            className="w-full rounded-md border border-input bg-background p-2 text-xs font-mono"
                                        />
                                        <p className="text-[10px] text-muted-foreground">
                                            Include country code without + or spaces (e.g. 919898696798).
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <DialogFooter className="flex items-center justify-between pt-3 border-t border-border">
                            <span className="text-xs text-muted-foreground">
                                Cost: ~₹{(recipientsCount * 0.11).toFixed(2)}
                            </span>
                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsBroadcastOpen(false)}
                                    disabled={isSending}
                                    className="text-xs"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    size="sm"
                                    disabled={isSending || recipientsCount === 0}
                                    className="bg-[#47b672] hover:bg-[#3ca062] text-white text-xs font-semibold gap-1.5 px-4 shadow-xs"
                                >
                                    {isSending ? (
                                        <>
                                            <Loader2 className="size-3.5 animate-spin" />
                                            <span>Sending Broadcast...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Send className="size-3.5" />
                                            <span>Launch Broadcast ({recipientsCount})</span>
                                        </>
                                    )}
                                </Button>
                            </div>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
