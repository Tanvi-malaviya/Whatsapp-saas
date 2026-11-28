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
    Upload,
    Download,
    FileSpreadsheet,
    Smartphone,
    ShieldCheck,
    Trash2,
    Zap,
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
    isAllChannels?: boolean;
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
    isAllChannels = false,
}: CampaignsPageProps) {
    const { tenant } = usePage().props as any;
    const currentOrg = tenant?.current;

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [isConnectPromptOpen, setIsConnectPromptOpen] = useState(false);

    const [campaignActionBusy, setCampaignActionBusy] = useState<string | null>(null);
    const [campaignSearch, setCampaignSearch] = useState('');
    const [campaignStatusFilter, setCampaignStatusFilter] = useState<'all' | 'completed' | 'scheduled'>('all');

    const totalMessagesSent = useMemo(() => {
        return recentCampaigns.reduce((acc, c) => acc + (c.successCount || 0), 0);
    }, [recentCampaigns]);

    const completedCampaignsCount = useMemo(() => {
        return recentCampaigns.filter((c) => c.status === 'completed').length;
    }, [recentCampaigns]);

    const scheduledCampaignsCount = useMemo(() => {
        return recentCampaigns.filter((c) => c.status === 'scheduled' || c.status === 'paused' || c.isPaused).length;
    }, [recentCampaigns]);

    const filteredCampaigns = useMemo(() => {
        return recentCampaigns.filter((camp) => {
            const matchesSearch =
                camp.name.toLowerCase().includes(campaignSearch.toLowerCase()) ||
                camp.templateName.toLowerCase().includes(campaignSearch.toLowerCase()) ||
                (camp.category && camp.category.toLowerCase().includes(campaignSearch.toLowerCase()));
            if (!matchesSearch) return false;
            if (campaignStatusFilter === 'completed') return camp.status === 'completed';
            if (campaignStatusFilter === 'scheduled') return camp.status === 'scheduled' || camp.status === 'paused' || camp.isPaused;
            return true;
        });
    }, [recentCampaigns, campaignSearch, campaignStatusFilter]);

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

    const handleSendNow = async (id: string) => {
        setCampaignActionBusy(id);
        try {
            await api(`/campaigns/${id}/send-now`, 'POST');
            router.reload();
        } catch (e) {
            alert((e as Error).message);
        } finally {
            setCampaignActionBusy(null);
        }
    };

    // Delete campaign modal state
    const [deleteCampaignTarget, setDeleteCampaignTarget] = useState<CampaignHistoryItem | null>(null);
    const [isDeletingCampaign, setIsDeletingCampaign] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    // Cancel campaign modal state
    const [cancelCampaignTarget, setCancelCampaignTarget] = useState<CampaignHistoryItem | null>(null);
    const [isCancellingCampaign, setIsCancellingCampaign] = useState(false);
    const [cancelError, setCancelError] = useState<string | null>(null);

    const confirmCancelCampaign = async () => {
        if (!cancelCampaignTarget) return;
        setIsCancellingCampaign(true);
        setCancelError(null);
        try {
            await api(`/campaigns/${cancelCampaignTarget.id}/cancel`, 'POST');
            setCancelCampaignTarget(null);
            router.reload();
        } catch (e) {
            setCancelError((e as Error).message);
        } finally {
            setIsCancellingCampaign(false);
        }
    };

    const confirmDeleteCampaign = async () => {
        if (!deleteCampaignTarget) return;
        setIsDeletingCampaign(true);
        setDeleteError(null);
        try {
            await api(`/campaigns/${deleteCampaignTarget.id}`, 'DELETE');
            setDeleteCampaignTarget(null);
            router.reload();
        } catch (e) {
            setDeleteError((e as Error).message);
        } finally {
            setIsDeletingCampaign(false);
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
        const listToExport = filteredCampaigns.length > 0 ? filteredCampaigns : recentCampaigns;
        const rows = listToExport.map((c) => ({
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

            <div className="space-y-4 w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 pb-12">
                {/* Header Banner Card */}
                <div className="bg-card border border-border/70 rounded-2xl p-4 sm:p-5 shadow-2xs">
                    {/* Top Row: Title, Badge, and Primary Action */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-foreground">
                                    WhatsApp Broadcasts &amp; Campaigns
                                </h1>
                                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25 text-[10px] font-bold uppercase tracking-wider shrink-0">
                                    Meta Cloud API
                                </Badge>
                            </div>
                            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                                Broadcast official Meta-approved templates to targeted contacts or segments with live delivery tracking.
                            </p>
                        </div>

                        <Button
                            size="sm"
                            onClick={handleNewCampaignClick}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 h-8.5 text-xs font-semibold shadow-xs px-4 rounded-lg cursor-pointer shrink-0 self-start sm:self-auto"
                        >
                            <Plus className="size-4" />
                            New Campaign
                        </Button>
                    </div>

                    {/* Integrated Channel & Quick Tools Bar */}
                    <div className="mt-3.5 pt-3.5 border-t border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                        {/* Sender Number Selector */}
                        {channels && channels.length > 0 && (
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
                                <span className="text-[11px] font-medium text-muted-foreground shrink-0">Active WhatsApp Sender:</span>
                                <div className="flex items-center gap-1.5 bg-muted/40 border border-border/80 px-2.5 h-8 rounded-lg text-xs w-full sm:w-auto max-w-full">
                                    <Smartphone className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                    <select
                                        aria-label="Sender number"
                                        value={isAllChannels ? 'all' : (channel?.id ?? '')}
                                        onChange={(e) => {
                                            if (e.target.value === 'all') {
                                                router.get('/campaigns', { channel_id: 'all' }, { preserveState: false });
                                            } else if (e.target.value) {
                                                router.get('/campaigns', { channel_id: e.target.value }, { preserveState: false });
                                            } else {
                                                router.get('/campaigns', {}, { preserveState: false });
                                            }
                                        }}
                                        className="bg-transparent text-xs font-semibold text-foreground focus:outline-none cursor-pointer w-full sm:w-auto truncate"
                                    >
                                        {channels.map((c) => (
                                            <option value={c.id} key={c.id}>
                                                {c.name} · {c.phone_number}
                                            </option>
                                        ))}
                                        <option value="all">All Numbers (Consolidated)</option>
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* 4 KPI Overview Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
                    {/* Card 1: Total Campaigns */}
                    <div className="flex items-center justify-between gap-2 rounded-xl border border-border/70 bg-card px-3.5 py-2.5 shadow-2xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className="size-7.5 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                <Send className="size-3.5" />
                            </div>
                            <div className="min-w-0">
                                <span className="text-xs font-semibold text-foreground block leading-tight truncate">Total Campaigns</span>
                                <span className="text-[10px] text-muted-foreground truncate block">{completedCampaignsCount} completed</span>
                            </div>
                        </div>
                        <span className="text-base font-bold tabular-nums text-foreground shrink-0">{recentCampaigns.length}</span>
                    </div>

                    {/* Card 2: Messages Sent */}
                    <div className="flex items-center justify-between gap-2 rounded-xl border border-border/70 bg-card px-3.5 py-2.5 shadow-2xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className="size-7.5 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                                <CheckCircle2 className="size-3.5" />
                            </div>
                            <div className="min-w-0">
                                <span className="text-xs font-semibold text-foreground block leading-tight truncate">Messages Sent</span>
                                <span className="text-[10px] text-muted-foreground truncate block">Successful dispatches</span>
                            </div>
                        </div>
                        <span className="text-base font-bold tabular-nums text-foreground shrink-0">{totalMessagesSent.toLocaleString()}</span>
                    </div>

                    {/* Card 3: Meta 24h Quota */}
                    <div className="flex items-center justify-between gap-2 rounded-xl border border-border/70 bg-card px-3.5 py-2.5 shadow-2xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className="size-7.5 rounded-lg bg-sky-500/10 text-sky-600 flex items-center justify-center shrink-0">
                                <ShieldCheck className="size-3.5" />
                            </div>
                            <div className="min-w-0">
                                <span className="text-xs font-semibold text-foreground block leading-tight truncate">Meta 24h Quota</span>
                                <span className="text-[10px] text-muted-foreground truncate block">{messagingLimits?.tier || 'Tier 1'} limit</span>
                            </div>
                        </div>
                        <span className="text-base font-bold tabular-nums text-foreground shrink-0">
                            {messagingLimits?.unlimited ? 'Unlimited' : `${messagingLimits?.dailyLimit?.toLocaleString() || '1,000'}/24h`}
                        </span>
                    </div>

                    {/* Card 4: Wallet Balance */}
                    <div className="flex items-center justify-between gap-2 rounded-xl border border-border/70 bg-card px-3.5 py-2.5 shadow-2xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className="size-7.5 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                                <WalletIcon className="size-3.5" />
                            </div>
                            <div className="min-w-0">
                                <span className="text-xs font-semibold text-foreground block leading-tight truncate">Available Credits</span>
                                <span className="text-[10px] text-muted-foreground truncate block">Wallet balance</span>
                            </div>
                        </div>
                        <span className="text-base font-bold tabular-nums text-amber-600 dark:text-amber-400 shrink-0">
                            {wallet?.total_balance_formatted || '₹500.00'}
                        </span>
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
                    <div className="rounded-xl border border-border/70 bg-card overflow-hidden shadow-2xs">
                        {/* Integrated Table Toolbar */}
                        <div className="p-3 sm:px-4 border-b border-border/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-muted/20">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                                        <Clock className="size-3.5 text-primary" />
                                        Recent Broadcast Activity
                                    </h2>
                                    <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-primary/10 text-primary">
                                        {filteredCampaigns.length}
                                    </span>
                                </div>
                                <p className="text-[11px] text-muted-foreground mt-0.5">
                                    Performance, delivery status, and read analytics for dispatched campaigns.
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                                {/* Search */}
                                <div className="relative flex-1 sm:w-52">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
                                    <Input
                                        placeholder="Search campaigns..."
                                        value={campaignSearch}
                                        onChange={(e) => setCampaignSearch(e.target.value)}
                                        className="pl-8 h-7.5 text-xs bg-background"
                                    />
                                </div>

                                {/* Segmented Filter Pills */}
                                <div className="inline-flex items-center gap-0.5 p-0.5 bg-muted/60 border border-border/60 rounded-lg shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => setCampaignStatusFilter('all')}
                                        className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                                            campaignStatusFilter === 'all'
                                                ? 'bg-background text-foreground shadow-2xs'
                                                : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        All ({recentCampaigns.length})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setCampaignStatusFilter('completed')}
                                        className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                                            campaignStatusFilter === 'completed'
                                                ? 'bg-background text-emerald-600 dark:text-emerald-400 shadow-2xs'
                                                : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        Completed ({completedCampaignsCount})
                                    </button>
                                    {scheduledCampaignsCount > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => setCampaignStatusFilter('scheduled')}
                                            className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                                                campaignStatusFilter === 'scheduled'
                                                    ? 'bg-background text-amber-600 shadow-2xs'
                                                    : 'text-muted-foreground hover:text-foreground'
                                            }`}
                                        >
                                            Scheduled ({scheduledCampaignsCount})
                                        </button>
                                    )}
                                </div>

                                {/* Export Excel */}
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={exportCampaignsExcel}
                                    className="h-7.5 text-xs gap-1.5 border-border/80 rounded-lg shrink-0"
                                >
                                    <Download className="size-3 text-emerald-600" />
                                    Export Excel
                                </Button>
                            </div>
                        </div>

                        {/* Table */}
                        {filteredCampaigns.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[700px] text-left text-xs">
                                    <thead className="bg-muted/40 border-b border-border/70 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                        <tr>
                                            <th className="py-2.5 px-4 font-semibold">Campaign Name</th>
                                            <th className="py-2.5 px-4 font-semibold">Template &amp; Category</th>
                                            <th className="py-2.5 px-4 font-semibold text-center">Recipients</th>
                                            <th className="py-2.5 px-4 font-semibold text-right">Cost</th>
                                            <th className="py-2.5 px-4 font-semibold text-center">Status</th>
                                            <th className="py-2.5 px-4 font-semibold text-center">Actions</th>
                                            <th className="py-2.5 px-4 font-semibold text-right">Date &amp; Time</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/50">
                                        {filteredCampaigns.map((camp) => {
                                            const parts = camp.date.split(' ');
                                            const hasTime = parts.length >= 3 && camp.date.includes(':');
                                            const dateText = hasTime ? parts.slice(0, 3).join(' ') : camp.date;
                                            const timeText = hasTime ? parts.slice(3).join(' ') : '';

                                            return (
                                                <tr key={camp.id} className="hover:bg-muted/30 transition-colors">
                                                    <td className="py-2.5 px-4 font-medium text-foreground max-w-[240px]">
                                                        <Link
                                                            href={`/campaigns/${camp.id}/analytics`}
                                                            className="font-semibold text-foreground hover:text-primary hover:underline text-left cursor-pointer line-clamp-1"
                                                            title="Click to view detailed campaign analytics"
                                                        >
                                                            {camp.name}
                                                        </Link>
                                                        {camp.scheduledAt && camp.status === 'scheduled' && (
                                                            <div className="mt-1 flex items-center gap-1 text-[10px] text-amber-600 font-medium">
                                                                <Clock className="size-2.5" />
                                                                <span>Scheduled: {new Date(camp.scheduledAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })}</span>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="py-2.5 px-4">
                                                        <span className="font-mono text-[11px] font-medium text-foreground px-1.5 py-0.5 rounded bg-muted/60 border border-border/60">
                                                            {camp.templateName}
                                                        </span>
                                                        <div className="text-[10px] text-muted-foreground uppercase font-medium mt-1">
                                                            {camp.category || 'MARKETING'} ({camp.templateLanguage})
                                                        </div>
                                                    </td>
                                                    <td className="py-2.5 px-4 text-center">
                                                        <div className="inline-flex items-center gap-1 font-bold tabular-nums text-foreground">
                                                            <span>{camp.successCount} / {camp.recipientsCount}</span>
                                                            {camp.successCount === camp.recipientsCount && (
                                                                <CheckCircle2 className="size-3 text-emerald-600" />
                                                            )}
                                                        </div>
                                                        {camp.failedCount > 0 && (
                                                            <div className="text-[10px] text-destructive font-medium">
                                                                {camp.failedCount} failed
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="py-2.5 px-4 text-right font-bold tabular-nums text-foreground">
                                                        {camp.costFormatted || `₹${((camp.recipientsCount * 0.88)).toFixed(2)}`}
                                                    </td>
                                                    <td className="py-2.5 px-4 text-center">
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
                                                                            className="size-6 text-emerald-600 hover:bg-emerald-500/10 cursor-pointer"
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
                                                                            className="size-6 text-amber-600 hover:bg-amber-500/10 cursor-pointer"
                                                                            title="Pause Campaign"
                                                                            disabled={campaignActionBusy === camp.id}
                                                                            onClick={() => handlePause(camp.id)}
                                                                        >
                                                                            <Pause className="size-3" />
                                                                        </Button>
                                                                    )}

                                                                    {/* Send Now (Instant Dispatch for Queued / Processing / Paused) */}
                                                                    {(camp.status === 'queued' || camp.status === 'processing' || camp.status === 'paused') && (
                                                                        <Button
                                                                            size="icon"
                                                                            variant="ghost"
                                                                            className="size-6 text-sky-600 hover:bg-sky-500/10 cursor-pointer"
                                                                            title="Send Now (Dispatch Queued Messages Immediately)"
                                                                            disabled={campaignActionBusy === camp.id}
                                                                            onClick={() => handleSendNow(camp.id)}
                                                                        >
                                                                            {campaignActionBusy === camp.id ? (
                                                                                <Loader2 className="size-3 animate-spin text-sky-600" />
                                                                            ) : (
                                                                                <Zap className="size-3 fill-sky-600 text-sky-600" />
                                                                            )}
                                                                        </Button>
                                                                    )}

                                                                    <Button
                                                                        size="icon"
                                                                        variant="ghost"
                                                                        className="size-6 text-destructive hover:bg-destructive/10 cursor-pointer"
                                                                        title="Cancel & Refund Campaign"
                                                                        disabled={campaignActionBusy === camp.id}
                                                                        onClick={() => {
                                                                            setCancelError(null);
                                                                            setCancelCampaignTarget(camp);
                                                                        }}
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

                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                className="size-6 text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 cursor-pointer"
                                                                title="Delete Campaign"
                                                                disabled={campaignActionBusy === camp.id}
                                                                onClick={() => {
                                                                    setDeleteError(null);
                                                                    setDeleteCampaignTarget(camp);
                                                                }}
                                                            >
                                                                <Trash2 className="size-3" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                    <td className="py-2.5 px-4 text-right whitespace-nowrap">
                                                        <div className="text-xs font-semibold text-foreground">{dateText}</div>
                                                        {timeText && <div className="text-[10px] text-muted-foreground font-mono">{timeText}</div>}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="p-8 text-center text-xs text-muted-foreground">
                                No campaigns match your current search or filter.
                            </div>
                        )}
                    </div>
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

                {/* Broadcast Guide & Quick Link Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-xl border border-border/70 bg-card p-4 shadow-2xs space-y-2.5">
                        <div className="flex items-center gap-2">
                            <div className="size-6.5 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                <FileText className="size-3.5" />
                            </div>
                            <h3 className="text-xs font-bold text-foreground">
                                WhatsApp Templates Management
                            </h3>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Templates are chosen when composing a <strong>New Campaign</strong>. To create new templates, submit them to Meta for approval, or sync approved templates:
                        </p>
                        <Button variant="outline" size="sm" asChild className="h-7 text-xs font-semibold rounded-lg mt-1">
                            <Link href="/templates">
                                Open Templates Management &rarr;
                            </Link>
                        </Button>
                    </div>

                    <div className="rounded-xl border border-border/70 bg-card p-4 shadow-2xs space-y-2.5">
                        <div className="flex items-center gap-2">
                            <div className="size-6.5 rounded-md bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                                <Sparkles className="size-3.5" />
                            </div>
                            <h3 className="text-xs font-bold text-foreground">
                                Meta Broadcast Rules &amp; Compliance
                            </h3>
                        </div>
                        <ul className="text-xs text-muted-foreground space-y-1.5 list-disc pl-4 leading-relaxed">
                            <li>Marketing and Utility broadcasts must always use official Meta-approved templates.</li>
                            <li>Recipients must have opted in. High block rates reduce your Meta messaging quality rating.</li>
                        </ul>
                    </div>
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

                            <div className="grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
                                <div className="min-w-0 space-y-1">
                                    <Label htmlFor="broadcast-template" className="text-xs font-semibold">Select Meta Template</Label>
                                    <select
                                        id="broadcast-template"
                                        value={selectedTemplate?.id || ''}
                                        onChange={event => handleSelectTemplateInModal(event.target.value)}
                                        className="h-9 w-full min-w-0 rounded-md border border-input bg-background px-3 text-xs font-medium"
                                    >
                                        {templates.map(template => (
                                            <option key={template.id} value={template.id}>
                                                {template.name} ({template.language}) · {templateMediaTypes[templateMediaFormat(template)] ? `${templateMediaFormat(template).toLowerCase()} attachment` : 'Text only'}{templateHasVariables(template) ? ' · Dynamic values' : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="min-w-0 space-y-1">
                                    <Label htmlFor="broadcast-campaign-name" className="text-xs font-semibold">Campaign Name</Label>
                                    <Input
                                        id="broadcast-campaign-name"
                                        value={campaignName}
                                        onChange={event => setCampaignName(event.target.value)}
                                        placeholder="e.g. Festival Offer"
                                        className="text-xs"
                                        required
                                    />
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

            {/* Cancel Campaign Confirmation Modal Dialog */}
            <Dialog open={!!cancelCampaignTarget} onOpenChange={(open) => !open && setCancelCampaignTarget(null)}>
                <DialogContent className="max-w-md p-5 gap-4">
                    <DialogHeader className="pb-1">
                        <div className="flex items-center gap-2.5">
                            <div className="size-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 border border-amber-500/20">
                                <XCircle className="size-4" />
                            </div>
                            <div>
                                <DialogTitle className="text-base font-bold text-foreground">
                                    Cancel Broadcast Campaign
                                </DialogTitle>
                                <DialogDescription className="text-xs text-muted-foreground">
                                    Stop campaign dispatch & refund unsent messages.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    {cancelCampaignTarget && (
                        <div className="space-y-3">
                            <div className="rounded-lg bg-muted/60 border border-border/80 p-3 text-xs space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground font-medium">Campaign:</span>
                                    <span className="font-semibold text-foreground truncate max-w-[220px]">
                                        {cancelCampaignTarget.name}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground font-medium">Recipients & Status:</span>
                                    <span className="font-medium text-foreground capitalize">
                                        {cancelCampaignTarget.recipientsCount} contacts · {cancelCampaignTarget.status}
                                    </span>
                                </div>
                            </div>

                            <div className="rounded-md bg-emerald-500/10 border border-emerald-500/20 p-2.5 text-xs text-emerald-700 dark:text-emerald-400 flex items-start gap-2">
                                <ShieldCheck className="size-4 shrink-0 mt-0.5 text-emerald-600" />
                                <span>Any unsent queued messages will be cancelled immediately and refunded to your wallet balance.</span>
                            </div>

                            {cancelError && (
                                <div className="rounded-md bg-rose-50 border border-rose-200 p-2 text-xs text-rose-700 font-medium">
                                    {cancelError}
                                </div>
                            )}

                            <DialogFooter className="gap-2 pt-2 border-t border-border/70 mt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setCancelCampaignTarget(null)}
                                    disabled={isCancellingCampaign}
                                >
                                    Keep Campaign
                                </Button>
                                <Button
                                    type="button"
                                    variant="destructive"
                                    onClick={confirmCancelCampaign}
                                    disabled={isCancellingCampaign}
                                    className="gap-1.5"
                                >
                                    <XCircle className="size-3.5" />
                                    <span>{isCancellingCampaign ? 'Cancelling...' : 'Yes, Cancel & Refund'}</span>
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Campaign Confirmation Modal Dialog */}
            <Dialog open={!!deleteCampaignTarget} onOpenChange={(open) => !open && setDeleteCampaignTarget(null)}>
                <DialogContent className="max-w-md p-5 gap-4">
                    <DialogHeader className="pb-1">
                        <div className="flex items-center gap-2.5">
                            <div className="size-8 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0 border border-rose-500/20">
                                <Trash2 className="size-4" />
                            </div>
                            <div>
                                <DialogTitle className="text-base font-bold text-foreground">
                                    Delete Broadcast Campaign
                                </DialogTitle>
                                <DialogDescription className="text-xs text-muted-foreground">
                                    Confirm permanent removal of this campaign.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    {deleteCampaignTarget && (
                        <div className="space-y-3">
                            <div className="rounded-lg bg-muted/60 border border-border/80 p-3 text-xs space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground font-medium">Campaign:</span>
                                    <span className="font-semibold text-foreground truncate max-w-[220px]">
                                        {deleteCampaignTarget.name}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground font-medium">Template:</span>
                                    <span className="font-mono text-foreground">
                                        {deleteCampaignTarget.templateName} ({deleteCampaignTarget.templateLanguage})
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground font-medium">Recipients & Status:</span>
                                    <span className="font-medium text-foreground capitalize">
                                        {deleteCampaignTarget.recipientsCount} contacts · {deleteCampaignTarget.status}
                                    </span>
                                </div>
                                {deleteCampaignTarget.costFormatted && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground font-medium">Cost:</span>
                                        <span className="font-semibold text-foreground">
                                            {deleteCampaignTarget.costFormatted}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {['queued', 'scheduled', 'processing', 'paused'].includes(deleteCampaignTarget.status) && (
                                <div className="rounded-md bg-emerald-500/10 border border-emerald-500/20 p-2.5 text-xs text-emerald-700 dark:text-emerald-400 flex items-start gap-2">
                                    <ShieldCheck className="size-4 shrink-0 mt-0.5 text-emerald-600" />
                                    <span>Any unsent queued messages will be automatically refunded back to your workspace wallet balance.</span>
                                </div>
                            )}

                            <p className="text-xs text-destructive flex items-center gap-1.5 font-medium">
                                <AlertCircle className="size-3.5 shrink-0" />
                                <span>This action is permanent and cannot be undone.</span>
                            </p>

                            {deleteError && (
                                <div className="rounded-md bg-rose-50 border border-rose-200 p-2 text-xs text-rose-700 font-medium">
                                    {deleteError}
                                </div>
                            )}

                            <DialogFooter className="gap-2 pt-2 border-t border-border/70 mt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setDeleteCampaignTarget(null)}
                                    disabled={isDeletingCampaign}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    variant="destructive"
                                    onClick={confirmDeleteCampaign}
                                    disabled={isDeletingCampaign}
                                    className="gap-1.5"
                                >
                                    <Trash2 className="size-3.5" />
                                    <span>{isDeletingCampaign ? 'Deleting...' : 'Yes, Delete Campaign'}</span>
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
