import * as XLSX from 'xlsx';
import { getCountries, getCountryCallingCode, getExampleNumber, type CountryCode } from 'libphonenumber-js';
import phoneExamples from 'libphonenumber-js/mobile/examples';
import { normalizeCampaignRecipients } from '@/lib/campaign-recipients';
import { TemplateFields, templateVariables, templateHasVariables, templateMediaFormat, templateMediaTypes, type MessageTemplate, type TemplateValues } from '@/components/template-fields';
import { useState, useEffect, useMemo } from 'react';
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

const countryNames = new Intl.DisplayNames(['en'], { type: 'region' });
const recipientCountries = getCountries().map(code => ({
    code,
    name: countryNames.of(code) ?? code,
    callingCode: getCountryCallingCode(code),
})).sort((a, b) => a.name.localeCompare(b.name));

interface TemplateItem extends MessageTemplate {
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
    isOptedIn?: boolean;
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
    scheduledAt?: string | null;
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
    messagingLimits?: { tier: string; dailyLimit: number | null; localRemaining: number | null; unlimited: boolean; batchLimit: number; configuredBatchLimit: number; source: 'meta' | 'saved' | 'unknown'; checkedAt: string | null };
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
    messagingLimits,
}: CampaignsPageProps) {
    const { tenant } = usePage().props as any;
    const currentOrg = tenant?.current;

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [isConnectPromptOpen, setIsConnectPromptOpen] = useState(false);

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
    const [recipientCountry, setRecipientCountry] = useState<CountryCode>('IN');
    const [uploadedRecipients, setUploadedRecipients] = useState<{ phone: string; name: string }[]>([]);
    const [uploadSummary, setUploadSummary] = useState<{ filename: string } | null>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [templateParams, setTemplateParams] = useState<string[]>([]);
    const [mediaFile, setMediaFile] = useState<File | null>(null);
    const [extraValues, setExtraValues] = useState<TemplateValues>({ parameters: [] });
    const [consentConfirmed, setConsentConfirmed] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [broadcastResult, setBroadcastResult] = useState<{
        success: boolean;
        message: string;
        sent?: number;
        failed?: number;
    } | null>(null);

    const uploadedAudience = useMemo(() => normalizeCampaignRecipients(uploadedRecipients, recipientCountry), [uploadedRecipients, recipientCountry]);
    const manualAudience = useMemo(() => normalizeCampaignRecipients(
        manualPhoneInput.split(/[\n,;]+/).map(phone => phone.trim()).filter(Boolean).map(phone => ({ phone, name: 'Valued Customer' })),
        recipientCountry,
    ), [manualPhoneInput, recipientCountry]);
    const recipientExample = getExampleNumber(recipientCountry, phoneExamples);

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
        setExtraValues({ parameters: [] });
        setMediaFile(null);
        if (target) {
            setCampaignName(
                activeSegmentName
                    ? `${activeSegmentName} - ${target.name.replace(/_/g, ' ')}`
                    : `${target.name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())} Broadcast`
            );
            // Count variables in body
            const matches = templateVariables(target.body);
            const count = matches.length;
            const initialParams = Array<string>(count).fill('');
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
        openBroadcastModal(tpl);
    };

    const handleSelectTemplateInModal = (templateId: string) => {
        const found = templates.find((t) => t.id === templateId);
        if (found) {
            setSelectedTemplate(found);
            setExtraValues({ parameters: [] });
            setMediaFile(null);
            setBroadcastResult(null);
            setCampaignName(
                `${found.name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())} Broadcast`
            );
            const matches = templateVariables(found.body);
            const count = matches.length;
            const initialParams = Array<string>(count).fill('');
            setTemplateParams(initialParams);
        }
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
            // Select opted-in contacts (or all if none opted-out)
            const optInContacts = contacts.filter((c) => c.isOptedIn !== false);
            setSelectedContactIds(optInContacts.map((c) => c.id));
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

                // Keep original numbers so changing the selected country reprocesses every row.
                const recipientRows: { phone: string; name: string }[] = [];
                for (let i = startRow; i < rows.length; i++) {
                    const row = rows[i];
                    if (!row || row.every(cell => String(cell ?? '').trim() === '')) continue;
                    recipientRows.push({
                        phone: String(row[phoneCol] ?? '').trim(),
                        name: String(row[nameCol] ?? '').trim() || 'Valued Customer',
                    });
                }
                setUploadedRecipients(recipientRows);
                setUploadSummary({ filename: file.name });
                if (recipientRows.length === 0) setUploadError('No recipient rows found in this file.');
            } catch (err: any) {
                setUploadError('Could not read file: ' + (err?.message || 'Invalid Excel/CSV format'));
            }
        };
        reader.readAsArrayBuffer(file);
        e.target.value = '';
    };

    const downloadSampleExcel = () => {
        const sampleRows = [
            { phone: recipientExample?.formatNational() ?? '+919876543210', name: 'Sample Customer' },
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
            return uploadedAudience.recipients;
        }
        return manualAudience.recipients;
    };

    const recipientsCount = getRecipientsList().length;
    const campaignCount = Math.ceil(recipientsCount / Math.max(1, maxContactsLimit));
    const batchSizes = Array.from({ length: Math.min(campaignCount, 5) }, (_, index) => Math.min(maxContactsLimit, recipientsCount - index * maxContactsLimit));

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
            const campaignData = {
                channel_id: resolvedChannelId,
                consent_confirmed: consentConfirmed ? 'yes' : 'no',
                ...extraValues,
                template_name: selectedTemplate.name,
                template_language: selectedTemplate.language,
                campaign_name: campaignName.trim(),
                recipients,
                parameters: templateParams,
            };
            const formData = new FormData();
            // Keep large recipient lists in one field to avoid PHP's input-variable limit.
            formData.append('campaign_data', JSON.stringify(campaignData));
            if (mediaFile) formData.append('header_file', mediaFile);
            const res = await fetch('/campaigns/broadcast', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN':
                        (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)
                            ?.content || '',
                },
                body: formData,
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
                    router.reload({ only: ['recentCampaigns', 'contacts', 'messagingLimits', 'maxContactsLimit', 'wallet'] });
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
                        <Badge variant="outline" className="text-[11px]">Batch: {maxContactsLimit.toLocaleString()} · Meta: {messagingLimits?.unlimited ? 'Unlimited' : messagingLimits?.dailyLimit ? `${messagingLimits.dailyLimit.toLocaleString()}/24h` : 'Not verified'}{messagingLimits?.source === 'saved' ? ' (saved)' : ''}</Badge>
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
                                                    <Link
                                                        href={`/campaigns/${camp.id}/analytics`}
                                                        className="font-semibold text-foreground hover:text-primary hover:underline text-left cursor-pointer"
                                                        title="Click to view detailed campaign analytics"
                                                    >
                                                        {camp.name}
                                                    </Link>
                                                    {camp.scheduledAt && camp.status === 'scheduled' && <p className="mt-1 text-[10px] text-muted-foreground">Scheduled: {new Date(camp.scheduledAt).toLocaleString()}</p>}
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
                                                                : camp.status === 'paused' || camp.status === 'scheduled'
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
                                                                    : camp.status === 'paused' || camp.status === 'scheduled'
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
                                                            asChild
                                                            className="h-6.5 text-[11px] gap-1 px-2 border-primary/30 text-primary hover:bg-primary/10 font-semibold cursor-pointer"
                                                            title="View Delivery Performance, Read Rate & Replies"
                                                        >
                                                            <Link href={`/campaigns/${camp.id}/analytics`}>
                                                                <BarChart2 className="size-3" />
                                                                Analytics
                                                            </Link>
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
                <DialogContent className="flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-1.5rem)] max-w-7xl flex-col gap-0 overflow-hidden p-0 sm:max-w-7xl">
                    <form onSubmit={handleExecuteBroadcast} className="flex min-h-0 flex-1 flex-col overflow-hidden">
                        <DialogHeader className="shrink-0 border-b border-border px-4 py-3 pr-10 sm:px-5 sm:pr-12">
                            <DialogTitle className="flex items-center gap-2 text-base font-bold">
                                <Send className="size-5 shrink-0 text-primary" />
                                Launch WhatsApp Broadcast Campaign
                            </DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground">
                                Prepare your message, choose your audience, and review the campaign plan.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-4 sm:p-5">
                            {broadcastResult && <div role="status" className={`rounded-lg border p-3 text-xs font-medium ${broadcastResult.success ? 'border-primary/30 bg-primary/10 text-primary' : 'border-destructive/30 bg-destructive/10 text-destructive'}`}>
                                {broadcastResult.message}
                            </div>}

                            <div className="grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
                                <div className="min-w-0 space-y-1">
                                    <Label htmlFor="broadcast-campaign-name" className="text-xs font-semibold">Campaign Name</Label>
                                    <Input id="broadcast-campaign-name" value={campaignName} onChange={event => setCampaignName(event.target.value)} placeholder="e.g. Festival Offer" className="text-xs" required />
                                </div>
                                <div className="min-w-0 space-y-1">
                                    <Label htmlFor="broadcast-template" className="text-xs font-semibold">Select Meta Template</Label>
                                    <select id="broadcast-template" value={selectedTemplate?.id || ''} onChange={event => handleSelectTemplateInModal(event.target.value)} className="h-9 w-full min-w-0 rounded-md border border-input bg-background px-3 text-xs font-medium">
                                        {templates.map(template => <option key={template.id} value={template.id}>
                                            {template.name} ({template.language}) · {templateMediaTypes[templateMediaFormat(template)] ? `${templateMediaFormat(template).toLowerCase()} attachment` : 'Text only'}{templateHasVariables(template) ? ' · Dynamic values' : ''}
                                        </option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="grid min-w-0 items-start gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
                                <section aria-label="Template preview and values" className="min-w-0 rounded-xl border border-border bg-card p-3">
                                    <TemplateFields
                                        template={selectedTemplate}
                                        value={{ ...extraValues, parameters: templateParams }}
                                        onChange={value => { setExtraValues(value); setTemplateParams(value.parameters); }}
                                        mediaFile={mediaFile}
                                        onMediaFileChange={setMediaFile}
                                        showContent
                                        layout="columns"
                                    />
                                </section>
                                <section aria-label="Campaign audience" className="min-w-0 rounded-xl border border-border bg-card p-3">
                                    {/* Audience / Recipients Selection */}
                                    <div className="space-y-2">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <Label className="text-xs font-semibold flex items-center gap-1.5">
                                                <Users className="size-3.5 text-primary" />
                                                Audience ({recipientsCount.toLocaleString()} selected)
                                            </Label>
                                            <div className="flex w-full flex-wrap items-center gap-1 rounded-lg bg-muted p-0.5 text-xs">
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
                                                    Excel / CSV ({uploadedAudience.recipients.length})
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

                                        {audienceMode !== 'contacts' && <div className="space-y-1.5 rounded-lg border border-border bg-muted/20 p-3">
                                            <Label htmlFor="recipient-country" className="text-xs font-semibold">Country for local phone numbers</Label>
                                            <select id="recipient-country" value={recipientCountry} onChange={event => setRecipientCountry(event.target.value as CountryCode)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs">
                                                {recipientCountries.map(country => <option key={country.code} value={country.code}>{country.name} (+{country.callingCode})</option>)}
                                            </select>
                                            <p className="text-[11px] text-muted-foreground">Local numbers automatically use +{getCountryCallingCode(recipientCountry)}. International numbers starting with + or 00 keep their country code. Use + for numbers from other countries.</p>
                                            {recipientExample && <p className="text-[11px] text-muted-foreground">Example: {recipientExample.formatNational()} → {recipientExample.number}</p>}
                                        </div>}

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
                                                        const isOptedOut = c.isOptedIn === false;
                                                        return (
                                                            <label
                                                                key={c.id}
                                                                className={`flex items-center justify-between p-1.5 rounded cursor-pointer text-xs transition-colors ${
                                                                    isOptedOut ? 'bg-destructive/5 hover:bg-destructive/10' : 'hover:bg-muted/50'
                                                                }`}
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
                                                                <div className="flex items-center gap-1.5">
                                                                    {isOptedOut ? (
                                                                        <Badge variant="destructive" className="text-[9px] py-0 px-1.5 bg-destructive/15 text-destructive border-destructive/30">
                                                                            Opted Out
                                                                        </Badge>
                                                                    ) : (
                                                                        <Badge variant="outline" className="text-[9px] py-0 px-1.5 text-emerald-600 border-emerald-500/30">
                                                                            Opted In
                                                                        </Badge>
                                                                    )}
                                                                    <Badge variant="outline" className="text-[9px] py-0 px-1.5">
                                                                        {c.label}
                                                                    </Badge>
                                                                </div>
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

                                                {uploadSummary && uploadedAudience.recipients.length === 0 && <p className="rounded-md border border-destructive/20 bg-destructive/10 p-2 text-[11px] text-destructive">No valid recipients for the selected country. Check the country selection and phone column.</p>}
                                                {uploadSummary ? (
                                                    <div className="space-y-2">
                                                        <div className="flex items-center justify-between text-[11px] bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5 rounded-md text-emerald-700 dark:text-emerald-300">
                                                            <span>
                                                                <strong>{uploadSummary.filename}</strong>: {uploadedAudience.recipients.length} valid numbers loaded
                                                                {uploadedAudience.skipped > 0 ? ` (${uploadedAudience.skipped} invalid skipped)` : ''}{uploadedAudience.duplicates > 0 ? ` (${uploadedAudience.duplicates} duplicates removed)` : ''}
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
                                                            {uploadedAudience.recipients.slice(0, 20).map((r, idx) => (
                                                                <div key={idx} className="px-2.5 py-1 flex items-center justify-between">
                                                                    <span className="font-mono text-foreground">{r.phone}</span>
                                                                    <span className="text-muted-foreground truncate max-w-[160px]">{r.name}</span>
                                                                </div>
                                                            ))}
                                                            {uploadedAudience.recipients.length > 20 && (
                                                                <div className="px-2.5 py-1 text-center text-[10px] text-muted-foreground">
                                                                    +{uploadedAudience.recipients.length - 20} more numbers ready
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <p className="text-[10px] text-muted-foreground">
                                                        Upload a spreadsheet with a <code>phone</code> column and optional <code>name</code> column. Local numbers use the country selected above.
                                                    </p>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="space-y-1">
                                                <textarea
                                                    rows={3}
                                                    value={manualPhoneInput}
                                                    onChange={(e) => setManualPhoneInput(e.target.value)}
                                                    placeholder={`Paste numbers separated by comma or newline, e.g.\n${recipientExample?.formatNational() ?? '+919876543210'}`}
                                                    className="w-full rounded-md border border-input bg-background p-2 text-xs font-mono"
                                                />
                                                <p className="text-[10px] text-muted-foreground">
                                                    Paste local numbers without the country code, or full international numbers starting with +.
                                                </p>
                                                {manualPhoneInput.trim() && <div className="space-y-1 text-[11px] text-muted-foreground">
                                                    <p>{manualAudience.recipients.length} valid recipients · {manualAudience.skipped} invalid skipped · {manualAudience.duplicates} duplicates removed</p>
                                                    {manualAudience.recipients.slice(0, 3).map(recipient => <p key={recipient.phone} className="font-mono">{recipient.phone}</p>)}
                                                </div>}
                                            </div>
                                        )}
                                    </div>
                                </section>
                            </div>

                            <div className="grid gap-3 rounded-xl border border-border bg-muted/30 p-3 text-xs sm:grid-cols-3">
                                <div className="space-y-1">
                                    <p className="text-[11px] text-muted-foreground">Estimated total cost</p>
                                    <p className="text-lg font-bold">₹{(recipientsCount * (selectedTemplate?.category === 'UTILITY' ? 0.14 : 0.88)).toFixed(2)}</p>
                                    <p className="text-[10px] text-muted-foreground">{recipientsCount.toLocaleString()} recipients · ₹{selectedTemplate?.category === 'UTILITY' ? '0.14' : '0.88'} / message</p>
                                </div>
                                <div className="space-y-1 sm:border-l sm:border-border sm:pl-3">
                                    <p className="text-[11px] text-muted-foreground">Wallet balance</p>
                                    <p className="text-lg font-bold text-primary">{wallet?.total_balance_formatted ?? '₹0.00'}</p>
                                    {wallet && wallet.total_balance_paise < Math.round(recipientsCount * (selectedTemplate?.category === 'UTILITY' ? 14 : 88)) && recipientsCount > 0 && <p className="text-[11px] text-destructive">Insufficient balance. <Link href="/wallet" className="font-semibold underline">Recharge wallet</Link></p>}
                                </div>
                                <div className="space-y-1 sm:border-l sm:border-border sm:pl-3">
                                    <p className="text-[11px] text-muted-foreground">Campaign plan</p>
                                    <p className="text-lg font-bold">{campaignCount.toLocaleString()} campaign{campaignCount === 1 ? '' : 's'}</p>
                                    <p className="text-[10px] text-muted-foreground">Up to {maxContactsLimit.toLocaleString()} recipients per campaign</p>
                                </div>
                                <div className="space-y-1 border-t border-border pt-2 text-[11px] sm:col-span-3">
                                    <p>Meta allowance: {messagingLimits?.unlimited ? 'Unlimited' : messagingLimits?.dailyLimit ? `${messagingLimits.dailyLimit.toLocaleString()} unique recipients / rolling 24 hours` : 'Not verified'}{messagingLimits?.source === 'saved' ? ' (saved; live check unavailable)' : ''}{messagingLimits?.localRemaining != null ? ` · Estimated available: ${messagingLimits.localRemaining.toLocaleString()}` : ''}</p>
                                    {campaignCount > 1 && <p className="font-semibold text-primary">Automatic split: {campaignCount <= 5 ? batchSizes.map(size => size.toLocaleString()).join(' + ') : `${maxContactsLimit.toLocaleString()} per batch (final batch: ${(recipientsCount - (campaignCount - 1) * maxContactsLimit).toLocaleString()})`} recipients. Same template, media, and values in every campaign.</p>}
                                    {messagingLimits?.dailyLimit && recipientsCount > messagingLimits.dailyLimit && <p className="text-amber-700 dark:text-amber-300">Overflow batches will be scheduled for later allowance windows.</p>}
                                    {messagingLimits?.source === 'unknown' && <p className="text-amber-700 dark:text-amber-300">Meta’s tier could not be verified. Check Messaging Limits in WhatsApp Manager.</p>}
                                    <details className="text-muted-foreground">
                                        <summary className="cursor-pointer text-[10px]">About the allowance estimate</summary>
                                        <p className="pt-1 text-[10px]">Meta shares this allowance across your business portfolio. This estimate includes workspace activity; activity outside this workspace may affect delivery.</p>
                                    </details>
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="shrink-0 gap-3 border-t border-border bg-muted/20 px-4 py-3 sm:items-center sm:justify-between sm:px-5">
                            <label className="flex min-w-0 items-start gap-2 text-xs text-muted-foreground cursor-pointer select-none">
                                <input type="checkbox" required checked={consentConfirmed} onChange={event => setConsentConfirmed(event.target.checked)} className="mt-0.5 size-3.5 shrink-0 rounded border-input text-primary focus:ring-primary" />
                                <span>I confirm these recipients consented to receive this broadcast.</span>
                            </label>
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
                                            <span>{campaignCount > 1 ? `Create ${campaignCount} Campaigns (${recipientsCount})` : `Launch Broadcast (${recipientsCount})`}</span>
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
