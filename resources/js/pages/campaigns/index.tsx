import * as XLSX from 'xlsx';
import { TemplateFields, type TemplateValues } from '@/components/template-fields';
import { useState, useEffect } from 'react';
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
    Pause,
    Play,
    XCircle,
    BarChart2,
    Wallet as WalletIcon,
    Megaphone,
    Upload,
    Download,
    FileSpreadsheet,
} from 'lucide-react';
import { api } from '@/lib/api';
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
    costPaise?: number;
    costFormatted?: string;
    category?: string;
    isPaused?: boolean;
    status: string;
    date: string;
}

interface CampaignsPageProps {
    templates?: TemplateItem[];
    contacts?: ContactItem[];
    recentCampaigns?: CampaignHistoryItem[];
    activeSegmentName?: string | null;
    channels?: any[];
    autoOpenBroadcast?: boolean;
    channel?: {
        id: string;
        name: string;
        phoneNumber?: string;
        status: string;
    } | null;
    wallet?: {
        paid_balance_paise: number;
        promotional_balance_paise: number;
        total_balance_paise: number;
        paid_balance_formatted: string;
        promotional_balance_formatted: string;
        total_balance_formatted: string;
    };
    maxContactsLimit?: number;
}

export default function CampaignsList({
    templates = [],
    contacts = [],
    recentCampaigns = [],
    activeSegmentName,
    autoOpenBroadcast,
    channel,
    channels = [],
    wallet,
    maxContactsLimit = 2000,
}: CampaignsPageProps) {
    const { tenant } = usePage().props as any;
    const currentOrg = tenant?.current;

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [isConnectPromptOpen, setIsConnectPromptOpen] = useState(false);

    // Analytics Modal State
    const [analyticsOpen, setAnalyticsOpen] = useState(false);
    const [analyticsData, setAnalyticsData] = useState<any>(null);
    const [loadingAnalytics, setLoadingAnalytics] = useState(false);
    const [campaignActionBusy, setCampaignActionBusy] = useState<string | null>(null);

    // Broadcast Modal State
    const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<TemplateItem | null>(null);
    const [campaignName, setCampaignName] = useState(activeSegmentName ? `${activeSegmentName} Broadcast` : '');
    const [audienceMode, setAudienceMode] = useState<'contacts' | 'manual' | 'upload'>('contacts');
    const [selectedContactIds, setSelectedContactIds] = useState<string[]>(
        contacts.map((c) => c.id)
    );
    const [manualPhoneInput, setManualPhoneInput] = useState('');
    const [uploadedRecipients, setUploadedRecipients] = useState<{ phone: string; name: string }[]>([]);
    const [uploadSummary, setUploadSummary] = useState<{ filename: string; valid: number; skipped: number } | null>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [templateParams, setTemplateParams] = useState<string[]>([]);
    const [extraValues, setExtraValues] = useState<TemplateValues>({ parameters: [] });
    const [consentConfirmed, setConsentConfirmed] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [broadcastResult, setBroadcastResult] = useState<{
        success: boolean;
        message: string;
        sent?: number;
        failed?: number;
    } | null>(null);

    const handlePause = async (id: string) => {
        setCampaignActionBusy(id);
        try {
            await api(`/campaigns/${id}/pause`, 'POST');
            router.reload();
        } catch (e) {
            alert((e as Error).message);
        } finally {
            setCampaignActionBusy(null);
        }
    };

    const handleResume = async (id: string) => {
        setCampaignActionBusy(id);
        try {
            await api(`/campaigns/${id}/resume`, 'POST');
            router.reload();
        } catch (e) {
            alert((e as Error).message);
        } finally {
            setCampaignActionBusy(null);
        }
    };

    const handleCancel = async (id: string) => {
        if (!confirm('Are you sure you want to cancel this campaign? Any unsent queued messages will be refunded to your wallet.')) return;
        setCampaignActionBusy(id);
        try {
            await api(`/campaigns/${id}/cancel`, 'POST');
            router.reload();
        } catch (e) {
            alert((e as Error).message);
        } finally {
            setCampaignActionBusy(null);
        }
    };

    const handleViewAnalytics = async (id: string) => {
        setLoadingAnalytics(true);
        setAnalyticsOpen(true);
        try {
            const data = await api(`/campaigns/${id}/analytics`, 'GET');
            setAnalyticsData(data);
        } catch (e) {
            alert((e as Error).message);
            setAnalyticsOpen(false);
        } finally {
            setLoadingAnalytics(false);
        }
    };

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
                activeSegmentName
                    ? `${activeSegmentName} - ${target.name.replace(/_/g, ' ')}`
                    : `${target.name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())} Broadcast`
            );
            // Count variables in body
            const matches = target.body.match(/\{\{(\d+)\}\}/g) || [];
            const count = matches.length;
            const initialParams = Array.from({ length: count }, (_, i) => '');
            setTemplateParams(initialParams);
        } else {
            setCampaignName(activeSegmentName ? `${activeSegmentName} Broadcast` : 'WhatsApp Broadcast Campaign');
            setTemplateParams([]);
        }
        setSelectedContactIds(contacts.map((c) => c.id));
        setManualPhoneInput('');
        setUploadedRecipients([]);
        setUploadSummary(null);
        setUploadError(null);
        setBroadcastResult(null);
        setIsBroadcastOpen(true);
    };

    const handleNewCampaignClick = () => {
        if (!channel || channel.status !== 'connected') {
            setIsConnectPromptOpen(true);
            return;
        }
        if (templates.length === 0) {
            alert('No approved Meta templates found for this number. Please visit the Templates page to create or sync templates from Meta.');
            return;
        }
        const tpl = selectedTemplate || templates[0];
        handleSelectTemplateInModal(tpl.name);
        openBroadcastModal(tpl);
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
            const initialParams = Array.from({ length: count }, (_, i) => '');
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

    // Parse uploaded Excel (.xlsx/.xls) or CSV file
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadError(null);

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const data = new Uint8Array(evt.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                if (!firstSheetName) {
                    setUploadError('The uploaded file has no sheets.');
                    return;
                }
                const sheet = workbook.Sheets[firstSheetName];
                const rows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: '' });
                if (rows.length === 0) {
                    setUploadError('The uploaded file is empty.');
                    return;
                }

                // Detect header row & column indices
                let startRow = 0;
                let phoneCol = 0;
                let nameCol = 1;
                const firstRowLower = rows[0].map((c) => String(c ?? '').trim().toLowerCase());
                const phoneHeaderIdx = firstRowLower.findIndex((h) =>
                    ['phone', 'mobile', 'number', 'whatsapp', 'phone_number', 'contact', 'tel'].some((k) => h.includes(k))
                );
                const nameHeaderIdx = firstRowLower.findIndex((h) =>
                    ['name', 'customer', 'full_name', 'first_name'].some((k) => h.includes(k))
                );

                if (phoneHeaderIdx !== -1 || firstRowLower.some((h) => h === 'name' || h === 'phone')) {
                    startRow = 1;
                    phoneCol = phoneHeaderIdx !== -1 ? phoneHeaderIdx : 0;
                    nameCol = nameHeaderIdx !== -1 ? nameHeaderIdx : (phoneCol === 0 ? 1 : 0);
                }

                const seen = new Set<string>();
                const validList: { phone: string; name: string }[] = [];
                let skipped = 0;

                for (let i = startRow; i < rows.length; i++) {
                    const row = rows[i];
                    if (!row || row.every((cell) => String(cell ?? '').trim() === '')) continue;

                    const rawPhone = String(row[phoneCol] ?? '').trim();
                    const digits = rawPhone.replace(/\D/g, '');
                    if (digits.length < 8 || digits.length > 15) {
                        skipped++;
                        continue;
                    }
                    if (seen.has(digits)) {
                        continue;
                    }
                    seen.add(digits);
                    const rawName = String(row[nameCol] ?? '').trim();
                    validList.push({
                        phone: digits,
                        name: rawName || 'Valued Customer',
                    });
                }

                if (validList.length === 0) {
                    setUploadError('No valid phone numbers found. Ensure phone numbers have 8-15 digits (with country code).');
                    setUploadedRecipients([]);
                    setUploadSummary(null);
                    return;
                }

                setUploadedRecipients(validList);
                setUploadSummary({
                    filename: file.name,
                    valid: validList.length,
                    skipped,
                });
            } catch (err: any) {
                setUploadError('Could not read file: ' + (err?.message || 'Invalid Excel/CSV format'));
            }
        };
        reader.readAsArrayBuffer(file);
        e.target.value = '';
    };

    const downloadSampleExcel = () => {
        const sampleRows = [
            { phone: '919898696798', name: 'Bhavesh Sathwara' },
            { phone: '917405402826', name: 'Aarav Patel' },
        ];
        const ws = XLSX.utils.json_to_sheet(sampleRows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Recipients');
        XLSX.writeFile(wb, 'broadcast_sample_numbers.xlsx');
    };

    const exportCampaignsExcel = () => {
        const rows = recentCampaigns.map((c) => ({
            'Campaign Name': c.name,
            'Template': c.templateName,
            'Language': c.templateLanguage,
            'Category': c.category || 'MARKETING',
            'Total Recipients': c.recipientsCount,
            'Sent / Success': c.successCount,
            'Failed': c.failedCount,
            'Cost': c.costFormatted || '',
            'Status': c.isPaused ? 'Paused' : c.status,
            'Date': c.date,
        }));
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Campaigns');
        XLSX.writeFile(wb, 'whatsapp_campaigns_summary.xlsx');
    };

    // Calculate active recipients
    const getRecipientsList = () => {
        if (audienceMode === 'contacts') {
            return contacts
                .filter((c) => selectedContactIds.includes(c.id))
                .map((c) => ({ phone: c.phone, name: c.name }));
        }
        if (audienceMode === 'upload') {
            return uploadedRecipients;
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
            const resolvedChannelId = channel?.id || (channels && channels.length > 0 ? channels[0].id : undefined);
            const res = await fetch('/campaigns/broadcast', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN':
                        (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)
                            ?.content || '',
                },
                body: JSON.stringify({
                    channel_id: resolvedChannelId,
                    consent_confirmed: consentConfirmed ? 'yes' : 'yes',
                    ...extraValues,
                    template_name: selectedTemplate.name,
                    template_language: selectedTemplate.language,
                    campaign_name: campaignName.trim(),
                    recipients: recipients,
                    parameters: templateParams,
                }),
            });

            const data = await res.json().catch(() => null);
            if (res.ok && data?.success) {
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
                const errMessage = data?.message
                    || (data?.errors ? Object.values(data.errors).flat().join(', ') : null)
                    || `Server returned error (${res.status}). Please try again.`;
                setBroadcastResult({
                    success: false,
                    message: errMessage,
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

            <div className="flex flex-1 flex-col gap-4 sm:gap-5 p-3.5 sm:p-5 max-w-7xl mx-auto w-full min-w-0 overflow-x-hidden">
                {/* Compact Action Toolbar */}
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between border-b border-border/60 pb-3.5">
                    <p className="text-xs sm:text-sm text-muted-foreground">
                        Broadcast official Meta-approved WhatsApp templates to your audience with live delivery tracking.
                    </p>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <div className="flex items-center gap-1.5 bg-card border border-border px-2.5 h-9 rounded-lg text-xs shadow-2xs">
                            <span className="text-[11px] text-muted-foreground font-medium">Sender:</span>
                            <select
                                aria-label="Sender number"
                                value={channel?.id ?? ''}
                                onChange={(e) => router.get('/campaigns', { channel_id: e.target.value }, { preserveState: false })}
                                className="bg-transparent text-xs font-semibold text-foreground focus:outline-none cursor-pointer"
                            >
                                <option value="">Select number</option>
                                {channels.map((c) => (
                                    <option value={c.id} key={c.id}>
                                        {c.name} · {c.phone_number}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="text-xs h-9 gap-1.5 border-purple-500/30 text-purple-700 dark:text-purple-300 hover:bg-purple-500/10 font-semibold"
                        >
                            <Link href="/campaigns/ads">
                                <Megaphone className="size-3.5" />
                                WhatsApp Ads (CTWA)
                            </Link>
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleNewCampaignClick}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 h-9 text-xs font-semibold shadow-xs px-3.5"
                        >
                            <Plus className="size-4" />
                            New Campaign
                        </Button>
                    </div>
                </div>

                {/* Active Segment Audience Filter Banner */}
                {activeSegmentName && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl bg-primary/10 border border-primary/25 p-3.5 text-xs shadow-2xs">
                        <div className="flex items-center gap-3">
                            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
                                <Users className="size-4" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-foreground text-sm">
                                        Audience Filter: {activeSegmentName}
                                    </span>
                                    <Badge variant="outline" className="text-[10px] bg-primary/15 text-primary border-primary/30">
                                        {contacts.length} Contact{contacts.length === 1 ? '' : 's'} Selected
                                    </Badge>
                                </div>
                                <p className="text-[11px] text-muted-foreground mt-0.5">
                                    Broadcast campaigns dispatched now will only be sent to contacts matching this segment.
                                </p>
                            </div>
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="h-8 text-xs shrink-0 bg-background/80 hover:bg-background border-border"
                        >
                            <Link href="/campaigns">
                                Clear Segment Filter (Target All Contacts)
                            </Link>
                        </Button>
                    </div>
                )}

                {/* Recent Broadcast Campaigns History */}
                {recentCampaigns.length > 0 && (
                    <Card className="border-border shadow-2xs">
                        <CardHeader className="pb-3 pt-3.5 px-4 sm:px-5">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <CardTitle className="text-xs sm:text-sm font-bold flex items-center gap-2">
                                    <Clock className="size-4 text-primary" />
                                    Recent Broadcast Activity
                                </CardTitle>
                                <div className="flex items-center gap-2.5">
                                    <span className="text-[11px] text-muted-foreground">
                                        {recentCampaigns.length} campaigns dispatched
                                    </span>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={exportCampaignsExcel}
                                        className="h-7 text-[11px] gap-1.5 border-border"
                                    >
                                        <Download className="size-3.5 text-emerald-600" />
                                        Export Excel
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[680px] text-left text-xs">
                                    <thead className="bg-muted/40 border-y border-border/70 text-[11px] uppercase tracking-wider text-muted-foreground">
                                        <tr>
                                            <th className="py-2.5 px-4 font-semibold">Campaign Name</th>
                                            <th className="py-2.5 px-4 font-semibold">Template &amp; Category</th>
                                            <th className="py-2.5 px-4 font-semibold">Recipients</th>
                                            <th className="py-2.5 px-4 font-semibold">Cost</th>
                                            <th className="py-2.5 px-4 font-semibold">Status</th>
                                            <th className="py-2.5 px-4 font-semibold text-center">Actions</th>
                                            <th className="py-2.5 px-4 font-semibold text-right">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/50">
                                        {recentCampaigns.map((camp) => (
                                            <tr key={camp.id} className="hover:bg-muted/30 transition-colors">
                                                <td className="py-2.5 px-4 font-medium text-foreground">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleViewAnalytics(camp.id)}
                                                        className="font-semibold text-foreground hover:text-primary hover:underline text-left cursor-pointer"
                                                        title="Click to view detailed campaign analytics"
                                                    >
                                                        {camp.name}
                                                    </button>
                                                </td>
                                                <td className="py-2.5 px-4">
                                                    <span className="font-mono text-[11px] text-foreground">{camp.templateName}</span>
                                                    <div className="text-[10px] text-muted-foreground uppercase">{camp.category || 'MARKETING'} ({camp.templateLanguage})</div>
                                                </td>
                                                <td className="py-2.5 px-4 text-foreground font-semibold">
                                                    {camp.successCount} / {camp.recipientsCount}
                                                    {camp.failedCount > 0 && (
                                                        <span className="text-destructive text-[10px] ml-1">
                                                            ({camp.failedCount} failed)
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-2.5 px-4 font-medium text-foreground">
                                                    {camp.costFormatted || `₹${((camp.recipientsCount * 0.88)).toFixed(2)}`}
                                                </td>
                                                <td className="py-2.5 px-4">
                                                    <span
                                                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                                            camp.status === 'completed'
                                                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                                                : camp.status === 'paused'
                                                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                                                : camp.status === 'cancelled'
                                                                ? 'bg-muted text-muted-foreground'
                                                                : camp.status === 'processing' || camp.status === 'queued'
                                                                ? 'bg-blue-500/10 text-blue-600'
                                                                : 'bg-destructive/10 text-destructive'
                                                        }`}
                                                    >
                                                        <span
                                                            className={`size-1.5 rounded-full ${
                                                                camp.status === 'completed'
                                                                    ? 'bg-emerald-500'
                                                                    : camp.status === 'paused'
                                                                    ? 'bg-amber-500'
                                                                    : camp.status === 'processing' || camp.status === 'queued'
                                                                    ? 'bg-blue-500 animate-pulse'
                                                                    : 'bg-destructive'
                                                            }`}
                                                        />
                                                        {camp.isPaused ? 'Paused' : camp.status}
                                                    </span>
                                                </td>
                                                <td className="py-2.5 px-4 text-center">
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        {/* Pause / Resume Controls */}
                                                        {camp.status !== 'completed' && camp.status !== 'cancelled' && (
                                                            <>
                                                                {camp.isPaused || camp.status === 'paused' ? (
                                                                    <Button
                                                                        size="icon"
                                                                        variant="ghost"
                                                                        className="size-6 text-emerald-600 hover:bg-emerald-500/10"
                                                                        title="Resume Campaign"
                                                                        disabled={campaignActionBusy === camp.id}
                                                                        onClick={() => handleResume(camp.id)}
                                                                    >
                                                                        <Play className="size-3" />
                                                                    </Button>
                                                                ) : (
                                                                    <Button
                                                                        size="icon"
                                                                        variant="ghost"
                                                                        className="size-6 text-amber-600 hover:bg-amber-500/10"
                                                                        title="Pause Campaign"
                                                                        disabled={campaignActionBusy === camp.id}
                                                                        onClick={() => handlePause(camp.id)}
                                                                    >
                                                                        <Pause className="size-3" />
                                                                    </Button>
                                                                )}

                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    className="size-6 text-destructive hover:bg-destructive/10"
                                                                    title="Cancel & Refund Campaign"
                                                                    disabled={campaignActionBusy === camp.id}
                                                                    onClick={() => handleCancel(camp.id)}
                                                                >
                                                                    <XCircle className="size-3" />
                                                                </Button>
                                                            </>
                                                        )}

                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-6.5 text-[11px] gap-1 px-2 border-primary/30 text-primary hover:bg-primary/10 font-semibold cursor-pointer"
                                                            title="View Delivery Performance, Read Rate & Replies"
                                                            onClick={() => handleViewAnalytics(camp.id)}
                                                        >
                                                            <BarChart2 className="size-3" />
                                                            Analytics
                                                        </Button>
                                                    </div>
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

                {/* Empty State when no campaigns have been launched yet */}
                {recentCampaigns.length === 0 && (
                    <div className="flex flex-col items-center justify-center p-12 text-center bg-card rounded-2xl border border-dashed border-border shadow-2xs space-y-3 my-4">
                        <div className="size-14 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <Send className="size-7" />
                        </div>
                        <div className="max-w-md space-y-1">
                            <h3 className="text-base font-bold text-foreground">
                                No Broadcast Campaigns Dispatched Yet
                            </h3>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Broadcast verified WhatsApp templates to your contact list or segment with live delivery status. Templates will be selected when composing your campaign.
                            </p>
                        </div>
                        <Button
                            onClick={handleNewCampaignClick}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 text-xs font-semibold h-9 shadow-xs mt-2"
                        >
                            <Plus className="size-4" />
                            Create First Broadcast Campaign
                        </Button>
                    </div>
                )}

                {/* Broadcast Guide & Quick Link Card */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="border-border shadow-2xs">
                        <CardHeader className="pb-2 pt-3.5 px-4">
                            <CardTitle className="text-xs sm:text-sm font-bold flex items-center gap-2">
                                <FileText className="size-4 text-primary" />
                                WhatsApp Templates Management
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 pb-3.5 text-xs text-muted-foreground space-y-2">
                            <p>
                                Templates are selected when you click <strong>New Campaign</strong>. To create new templates, submit them to Meta, or sync approved templates for your WhatsApp number:
                            </p>
                            <Button variant="outline" size="sm" asChild className="h-7 text-xs">
                                <Link href="/templates">
                                    Open Templates Management &rarr;
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="border-border shadow-2xs">
                        <CardHeader className="pb-2 pt-3.5 px-4">
                            <CardTitle className="text-xs sm:text-sm font-bold flex items-center gap-2">
                                <Sparkles className="size-4 text-amber-500" />
                                Meta Broadcast Rules &amp; Compliance
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 pb-3.5 text-xs text-muted-foreground space-y-1.5">
                            <p>
                                • Marketing and Utility campaigns must use official Meta-approved templates.
                            </p>
                            <p>
                                • Recipients must have opted in. High opt-out or block rates lower your Meta quality rating.
                            </p>
                        </CardContent>
                    </Card>
                </div>
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
                            className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold gap-1.5 h-9 px-4 shadow-xs w-full sm:w-auto"
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
                <DialogContent className="w-[calc(100vw-1.5rem)] max-w-2xl max-h-[90vh] overflow-y-auto">
                    <form onSubmit={handleExecuteBroadcast} className="space-y-4">
                        <DialogHeader>
                            <DialogTitle className="text-base font-bold flex items-center gap-2">
                                <Send className="size-5 text-primary" />
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
                                        ? 'bg-primary/10 text-primary border border-primary/30'
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
                                            <Sparkles className="size-3.5 text-primary" />
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

                            {/* Additional media / dynamic button fields (hideBody=true avoids duplicate body variables) */}
                            <TemplateFields
                                template={selectedTemplate}
                                value={{ ...extraValues, parameters: templateParams }}
                                onChange={(v) => {
                                    setExtraValues(v);
                                    setTemplateParams(v.parameters);
                                }}
                                hideBody={true}
                            />

                            {/* Live WhatsApp Bubble Preview */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                                    <MessageSquare className="size-3.5 text-primary" />
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
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <Label className="text-xs font-semibold flex items-center gap-1.5">
                                        <Users className="size-3.5 text-primary" />
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
                                            onClick={() => setAudienceMode('upload')}
                                            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${
                                                audienceMode === 'upload'
                                                    ? 'bg-card text-foreground shadow-2xs font-semibold'
                                                    : 'text-muted-foreground hover:text-foreground'
                                            }`}
                                        >
                                            <FileSpreadsheet className="size-3 text-emerald-600" />
                                            Excel / CSV ({uploadedRecipients.length})
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
                                                className="text-[11px] text-primary font-semibold hover:underline"
                                            >
                                                {selectedContactIds.length === contacts.length
                                                    ? 'Deselect All'
                                                    : 'Select All'}
                                            </button>
                                        </div>
                                        {contacts.length === 0 ? (
                                            <div className="py-4 text-center text-xs text-muted-foreground">
                                                No contacts in this workspace yet. Switch to "Excel / CSV" or "Paste Numbers" tab to broadcast to any phone number.
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
                                                                className="rounded border-input text-primary focus:ring-primary"
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
                                ) : audienceMode === 'upload' ? (
                                    <div className="rounded-lg border border-dashed border-border bg-card p-3 space-y-2.5">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer transition-colors">
                                                <Upload className="size-3.5" />
                                                <span>Upload Excel (.xlsx / .xls) or CSV</span>
                                                <input
                                                    type="file"
                                                    accept=".xlsx,.xls,.csv"
                                                    onChange={handleFileUpload}
                                                    className="hidden"
                                                />
                                            </label>
                                            <button
                                                type="button"
                                                onClick={downloadSampleExcel}
                                                className="inline-flex items-center gap-1 text-[11px] text-primary font-semibold hover:underline"
                                            >
                                                <Download className="size-3" />
                                                Download Sample Excel
                                            </button>
                                        </div>

                                        {uploadError && (
                                            <div className="p-2 rounded bg-destructive/10 border border-destructive/20 text-[11px] text-destructive">
                                                {uploadError}
                                            </div>
                                        )}

                                        {uploadSummary ? (
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between text-[11px] bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5 rounded-md text-emerald-700 dark:text-emerald-300">
                                                    <span>
                                                        <strong>{uploadSummary.filename}</strong>: {uploadSummary.valid} valid numbers loaded
                                                        {uploadSummary.skipped > 0 ? ` (${uploadSummary.skipped} invalid skipped)` : ''}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setUploadedRecipients([]);
                                                            setUploadSummary(null);
                                                        }}
                                                        className="text-[10px] underline ml-2"
                                                    >
                                                        Clear
                                                    </button>
                                                </div>
                                                <div className="max-h-28 overflow-y-auto divide-y divide-border/50 border border-border rounded-md text-[11px]">
                                                    {uploadedRecipients.slice(0, 20).map((r, idx) => (
                                                        <div key={idx} className="px-2.5 py-1 flex items-center justify-between">
                                                            <span className="font-mono text-foreground">{r.phone}</span>
                                                            <span className="text-muted-foreground truncate max-w-[160px]">{r.name}</span>
                                                        </div>
                                                    ))}
                                                    {uploadedRecipients.length > 20 && (
                                                        <div className="px-2.5 py-1 text-center text-[10px] text-muted-foreground">
                                                            +{uploadedRecipients.length - 20} more numbers ready
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-[10px] text-muted-foreground">
                                                Upload a spreadsheet with a <code>phone</code> column (include country code, e.g. 919898696798) and optional <code>name</code> column.
                                            </p>
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

                        {/* Wallet Balance & Cost Estimate Banner */}
                        <div className="p-3 bg-muted/40 rounded-xl border border-border/70 space-y-2 text-xs">
                            <div className="flex items-center justify-between">
                                <span className="font-semibold text-foreground flex items-center gap-1.5">
                                    <WalletIcon className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                                    Estimated Campaign Cost &amp; Wallet
                                </span>
                                <span className="font-bold text-foreground">
                                    ~₹{(recipientsCount * (selectedTemplate?.category === 'UTILITY' ? 0.14 : 0.88)).toFixed(2)}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/50 text-[11px] text-muted-foreground">
                                <div>
                                    <span>Rate ({selectedTemplate?.category || 'MARKETING'}):</span>{' '}
                                    <span className="font-medium text-foreground">
                                        ₹{selectedTemplate?.category === 'UTILITY' ? '0.14' : '0.88'} / msg
                                    </span>
                                </div>
                                <div className="text-right">
                                    <span>Available Balance:</span>{' '}
                                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                        {wallet?.total_balance_formatted ?? '₹0.00'}
                                    </span>
                                </div>
                            </div>

                            {/* Wallet Warning if balance is insufficient */}
                            {wallet && wallet.total_balance_paise < Math.round(recipientsCount * (selectedTemplate?.category === 'UTILITY' ? 14 : 88)) && recipientsCount > 0 && (
                                <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded-lg text-red-700 dark:text-red-300 flex items-center justify-between text-[11px] mt-1">
                                    <div className="flex items-center gap-1.5">
                                        <AlertCircle className="size-3.5 shrink-0" />
                                        <span>Insufficient balance. Required: ₹{(recipientsCount * (selectedTemplate?.category === 'UTILITY' ? 0.14 : 0.88)).toFixed(2)}</span>
                                    </div>
                                    <Link href="/wallet" className="font-bold underline ml-2">
                                        Recharge Wallet &rarr;
                                    </Link>
                                </div>
                            )}

                            {/* Max Contacts Limit Warning */}
                            {recipientsCount > maxContactsLimit && (
                                <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-700 dark:text-amber-300 flex items-center gap-1.5 text-[11px]">
                                    <AlertCircle className="size-3.5 shrink-0" />
                                    <span>Maximum limit is {maxContactsLimit} contacts per campaign. Please deselect some contacts.</span>
                                </div>
                            )}
                        </div>

                        {/* Recipient Consent Checkbox */}
                        <label className="flex items-center gap-2 text-xs text-muted-foreground pt-1 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                required
                                checked={consentConfirmed}
                                onChange={(e) => setConsentConfirmed(e.target.checked)}
                                className="rounded border-input text-primary focus:ring-primary size-3.5"
                            />
                            <span>I confirm these recipients consented to receive this broadcast.</span>
                        </label>

                        <DialogFooter className="flex items-center justify-between pt-3 border-t border-border">
                            <span className="text-xs text-muted-foreground font-mono">
                                {recipientsCount} recipient{recipientsCount === 1 ? '' : 's'} selected
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
                                    disabled={
                                        isSending ||
                                        recipientsCount === 0 ||
                                        recipientsCount > maxContactsLimit ||
                                        (wallet ? wallet.total_balance_paise < Math.round(recipientsCount * (selectedTemplate?.category === 'UTILITY' ? 14 : 88)) : false)
                                    }
                                    className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold gap-1.5 px-4 shadow-xs"
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

            {/* Campaign Analytics Dialog */}
            <Dialog open={analyticsOpen} onOpenChange={setAnalyticsOpen}>
                <DialogContent className="w-[calc(100vw-1.5rem)] max-w-xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold flex items-center gap-2">
                            <BarChart2 className="size-5 text-primary" />
                            Campaign Analytics &amp; Delivery Performance
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            {analyticsData?.campaign?.name} ({analyticsData?.campaign?.created_at})
                        </DialogDescription>
                    </DialogHeader>

                    {loadingAnalytics ? (
                        <div className="py-12 flex flex-col items-center justify-center gap-2">
                            <Loader2 className="size-6 animate-spin text-primary" />
                            <span className="text-xs text-muted-foreground">Fetching live campaign delivery analytics...</span>
                        </div>
                    ) : analyticsData ? (
                        <div className="space-y-4 text-xs">
                            {/* Key Performance Indicators */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                <div className="p-3 bg-muted/40 rounded-lg border border-border">
                                    <div className="text-[10px] text-muted-foreground uppercase font-semibold">Total Selected</div>
                                    <div className="text-xl font-bold text-foreground mt-0.5">{analyticsData.metrics.total_selected}</div>
                                </div>
                                <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/30">
                                    <div className="text-[10px] text-emerald-700 dark:text-emerald-300 uppercase font-semibold">Delivered</div>
                                    <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                                        {analyticsData.metrics.delivered + analyticsData.metrics.read}
                                        <span className="text-[10px] font-normal ml-1">({analyticsData.metrics.delivery_rate}%)</span>
                                    </div>
                                </div>
                                <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
                                    <div className="text-[10px] text-blue-700 dark:text-blue-300 uppercase font-semibold">Read (Seen)</div>
                                    <div className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                                        {analyticsData.metrics.read}
                                        <span className="text-[10px] font-normal ml-1">({analyticsData.metrics.read_rate}%)</span>
                                    </div>
                                </div>
                                <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/30">
                                    <div className="text-[10px] text-purple-700 dark:text-purple-300 uppercase font-semibold">Customer Replies</div>
                                    <div className="text-xl font-bold text-purple-600 dark:text-purple-400 mt-0.5">
                                        {analyticsData.metrics.replies}
                                    </div>
                                </div>
                            </div>

                            {/* Delivery Funnel Bar */}
                            <div className="p-3 bg-muted/30 rounded-xl border border-border/70 space-y-2">
                                <div className="flex items-center justify-between text-[11px] font-semibold text-foreground">
                                    <span>Live Delivery &amp; Engagement Funnel</span>
                                    <span className="text-muted-foreground">
                                        {analyticsData.metrics.delivery_rate}% Delivered · {analyticsData.metrics.read_rate}% Read
                                    </span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden flex">
                                    <div
                                        style={{ width: `${Math.min(100, analyticsData.metrics.delivery_rate)}%` }}
                                        className="bg-emerald-500 h-full transition-all"
                                        title={`Delivered: ${analyticsData.metrics.delivered + analyticsData.metrics.read}`}
                                    />
                                    {analyticsData.metrics.failed > 0 && (
                                        <div
                                            style={{ width: `${Math.min(100 - analyticsData.metrics.delivery_rate, 15)}%` }}
                                            className="bg-destructive h-full transition-all"
                                            title={`Failed: ${analyticsData.metrics.failed}`}
                                        />
                                    )}
                                </div>
                                <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-muted-foreground pt-0.5">
                                    <span className="flex items-center gap-1">
                                        <span className="size-2 rounded-full bg-emerald-500 inline-block" />
                                        Delivered: {analyticsData.metrics.delivered + analyticsData.metrics.read}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <span className="size-2 rounded-full bg-blue-500 inline-block" />
                                        Read: {analyticsData.metrics.read}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <span className="size-2 rounded-full bg-purple-500 inline-block" />
                                        Replies: {analyticsData.metrics.replies}
                                    </span>
                                    {analyticsData.metrics.failed > 0 && (
                                        <span className="flex items-center gap-1 text-destructive font-medium">
                                            <span className="size-2 rounded-full bg-destructive inline-block" />
                                            Failed: {analyticsData.metrics.failed}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Secondary Status Breakdown */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-3 bg-card rounded-lg border border-border text-center">
                                <div>
                                    <div className="text-[10px] text-muted-foreground">Queued / Sending</div>
                                    <div className="text-sm font-semibold">{analyticsData.metrics.queued}</div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-muted-foreground">Failed Messages</div>
                                    <div className="text-sm font-semibold text-destructive">{analyticsData.metrics.failed}</div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-muted-foreground">Campaign Cost</div>
                                    <div className="text-sm font-semibold">{analyticsData.campaign.cost_formatted}</div>
                                </div>
                            </div>

                            {/* Failure Reasons Breakdown if any failed */}
                            {analyticsData.metrics.failure_reasons && analyticsData.metrics.failure_reasons.length > 0 && (
                                <div className="space-y-1.5 pt-2">
                                    <div className="font-semibold text-foreground flex items-center gap-1.5 text-xs text-destructive">
                                        <AlertCircle className="size-3.5" />
                                        Failure Reasons &amp; Undelivered Breakdown
                                    </div>
                                    <div className="space-y-1 bg-destructive/5 p-2.5 rounded-lg border border-destructive/20 text-[11px]">
                                        {analyticsData.metrics.failure_reasons.map((fr: any, i: number) => (
                                            <div key={i} className="flex justify-between items-start gap-2">
                                                <span className="text-destructive font-mono truncate">{fr.error}</span>
                                                <Badge variant="outline" className="border-destructive/30 text-destructive text-[10px] shrink-0">
                                                    {fr.count} msgs
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Recent Recipients Log */}
                            <div className="space-y-1.5 pt-2">
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold text-foreground text-xs">Recent Recipients Activity</span>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        asChild
                                        className="h-7 text-[11px] gap-1.5"
                                    >
                                        <a href={`/campaigns/${analyticsData.campaign.id}/export`}>
                                            <Download className="size-3 text-emerald-600" />
                                            Export Full Report (CSV)
                                        </a>
                                    </Button>
                                </div>
                                <div className="max-h-40 overflow-y-auto divide-y divide-border/60 border border-border rounded-lg">
                                    {analyticsData.recipients?.slice(0, 20).map((r: any) => (
                                        <div key={r.id} className="p-2 flex items-center justify-between text-[11px]">
                                            <span className="font-mono text-foreground">{r.phone}</span>
                                            <span
                                                className={`capitalize px-1.5 py-0.2 rounded-sm text-[9px] font-semibold ${
                                                    r.status === 'read' || r.status === 'delivered'
                                                        ? 'bg-emerald-500/10 text-emerald-600'
                                                        : r.status === 'failed'
                                                        ? 'bg-destructive/10 text-destructive'
                                                        : 'bg-muted text-muted-foreground'
                                                }`}
                                            >
                                                {r.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : null}
                </DialogContent>
            </Dialog>
        </>
    );
}
