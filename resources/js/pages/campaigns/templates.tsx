import { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    FileText,
    Plus,
    RefreshCw,
    CheckCircle2,
    Clock,
    AlertCircle,
    Smartphone,
    Eye,
    Send,
    ExternalLink,
    Search,
    ShieldCheck,
    Check,
    Tag,
    Globe,
    Layers,
    ArrowLeft,
    Sparkles,
    Loader2,
    Pencil,
    Trash2,
    Video,
    Upload,
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

export type TemplateItem = {
    id: string;
    name: string;
    category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION' | string;
    language: string;
    status: 'APPROVED' | 'IN_REVIEW' | 'PENDING' | 'REJECTED' | string;
    costEstimate?: string;
    header?: string | null;
    headerFormat?: string | null;
    headerType?: 'TEXT' | 'IMAGE' | 'DOCUMENT';
    headerUrl?: string | null;
    headerMediaId?: string | null;
    body: string;
    bodyText?: string;
    footer?: string | null;
    footerText?: string | null;
    buttons?: string[] | { type: string; text: string; url?: string }[];
    exampleParams?: string[];
    updatedAt?: string;
};

interface Props {
    initialTemplates?: TemplateItem[];
    channel?: {
        id: string;
        name: string;
        phoneNumber?: string;
        status: string;
        wabaId?: string;
    } | null;
    flash?: {
        success?: string;
        error?: string;
    };
    errors?: Record<string, string>;
}

export default function MessageTemplates({
    initialTemplates = [],
    channel,
    flash,
    errors = {},
}: Props) {
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('ALL');
    const [languageFilter, setLanguageFilter] = useState('ALL');
    const [isSyncing, setIsSyncing] = useState(false);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // Create Template Form State
    const [newName, setNewName] = useState('');
    const [newCategory, setNewCategory] = useState<'UTILITY' | 'MARKETING' | 'AUTHENTICATION'>('MARKETING');
    const [newLanguage, setNewLanguage] = useState('gu');
    const [newHeaderType, setNewHeaderType] = useState<'NONE' | 'TEXT' | 'VIDEO' | 'IMAGE' | 'DOCUMENT'>('NONE');
    const [newHeader, setNewHeader] = useState('');
    const [newHeaderFile, setNewHeaderFile] = useState<File | null>(null);
    const [newHeaderFileWarning, setNewHeaderFileWarning] = useState<string | null>(null);
    const [newBody, setNewBody] = useState('');
    const [newFooter, setNewFooter] = useState('');
    const [newButtonType, setNewButtonType] = useState<'NONE' | 'URL' | 'QUICK_REPLY'>('NONE');
    const [newButtonUrlText, setNewButtonUrlText] = useState('Download Now');
    const [newButtonUrlLink, setNewButtonUrlLink] = useState('https://play.google.com/store/apps/details?id=com.app.dukanhisab');
    const [newButtonQrText, setNewButtonQrText] = useState('Yes, Interested');

    // Edit Template State
    const [editingTemplate, setEditingTemplate] = useState<TemplateItem | null>(null);
    const [editHeader, setEditHeader] = useState('');
    const [editHeaderUrl, setEditHeaderUrl] = useState('');
    const [editVideoFile, setEditVideoFile] = useState<File | null>(null);
    const [videoSizeWarning, setVideoSizeWarning] = useState<string | null>(null);
    const [editBody, setEditBody] = useState('');
    const [editFooter, setEditFooter] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);
    const [editError, setEditError] = useState<string | null>(null);

    // Delete Template State
    const [deletingTemplate, setDeletingTemplate] = useState<TemplateItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    const [templates, setTemplates] = useState<TemplateItem[]>(initialTemplates);
    const [selectedTemplate, setSelectedTemplate] = useState<TemplateItem | null>(
        initialTemplates.length > 0 ? initialTemplates[0] : null
    );

    useEffect(() => {
        if (initialTemplates) {
            setTemplates(initialTemplates);
            if (initialTemplates.length > 0 && (!selectedTemplate || !initialTemplates.some(t => t.id === selectedTemplate.id))) {
                setSelectedTemplate(initialTemplates[0]);
            }
        }
    }, [initialTemplates]);

    // Handle Flash messages
    useEffect(() => {
        if (flash?.success) {
            showToast(flash.success);
        }
        if (flash?.error || errors?.message) {
            setSubmitError(flash?.error || errors?.message || 'Action failed.');
        }
    }, [flash, errors]);

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 4000);
    };

    const handleSyncMeta = () => {
        setIsSyncing(true);
        router.post(
            '/templates/sync',
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsSyncing(false);
                    showToast('Templates refreshed from Meta WhatsApp Business Account.');
                },
                onError: () => {
                    setIsSyncing(false);
                },
                onFinish: () => {
                    setIsSyncing(false);
                },
            }
        );
    };

    const handleHeaderFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) {
            setNewHeaderFile(null);
            setNewHeaderFileWarning(null);
            return;
        }

        const sizeInMb = file.size / (1024 * 1024);
        if (sizeInMb > 16) {
            setNewHeaderFileWarning(`Warning: File size is ${sizeInMb.toFixed(1)} MB. Meta requires media to be strictly 16 MB or less.`);
        } else {
            setNewHeaderFileWarning(null);
        }
        setNewHeaderFile(file);
    };

    const handleCreateTemplate = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError(null);

        const cleanName = newName.toLowerCase().trim().replace(/[^a-z0-9_]/g, '_');
        if (!cleanName || !newBody.trim()) {
            setSubmitError('Template name and Body text are required.');
            return;
        }

        if (newHeaderType !== 'NONE' && newHeaderType !== 'TEXT' && !newHeaderFile) {
            setSubmitError(`Please select a sample ${newHeaderType.toLowerCase()} file for Meta review.`);
            return;
        }

        if (newHeaderFile && newHeaderFile.size > 16 * 1024 * 1024) {
            setSubmitError('Header media exceeds 16 MB limit. Please compress before uploading.');
            return;
        }

        const formData = new FormData();
        formData.append('name', cleanName);
        formData.append('category', newCategory);
        formData.append('language', newLanguage);
        formData.append('header_type', newHeaderType);
        if (newHeaderType === 'TEXT' && newHeader.trim()) {
            formData.append('header_text', newHeader.trim());
        }
        if (newHeaderFile) {
            formData.append('header_file', newHeaderFile);
        }
        formData.append('body', newBody.trim());
        if (newFooter.trim()) {
            formData.append('footer', newFooter.trim());
        }
        formData.append('button_type', newButtonType);
        if (newButtonType === 'URL') {
            formData.append('button_url_text', newButtonUrlText.trim());
            formData.append('button_url_link', newButtonUrlLink.trim());
        } else if (newButtonType === 'QUICK_REPLY') {
            formData.append('button_qr_text', newButtonQrText.trim());
        }

        setIsSubmitting(true);
        router.post('/templates', formData, {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                setIsSubmitting(false);
                setIsCreateOpen(false);
                setNewName('');
                setNewHeaderType('NONE');
                setNewHeader('');
                setNewHeaderFile(null);
                setNewHeaderFileWarning(null);
                setNewBody('');
                setNewFooter('');
                setNewButtonType('NONE');
                showToast(`Template "${cleanName}" submitted to Meta for review.`);
            },
            onError: (errs) => {
                setIsSubmitting(false);
                setSubmitError(errs?.message || 'Failed to submit template to Meta.');
            },
            onFinish: () => {
                setIsSubmitting(false);
            },
        });
    };

    const insertVariableIntoBody = () => {
        const matches = newBody.match(/\{\{(\d+)\}\}/g) || [];
        const nextNum = matches.length + 1;
        setNewBody((prev) => `${prev} {{${nextNum}}}`);
    };

    const openEditModal = (tpl: TemplateItem) => {
        setEditingTemplate(tpl);
        setEditHeader(tpl.header || tpl.headerText || '');
        setEditHeaderUrl(tpl.headerUrl || '');
        setEditVideoFile(null);
        setVideoSizeWarning(null);
        setEditBody(tpl.body || tpl.bodyText || '');
        setEditFooter(tpl.footer || tpl.footerText || '');
        setEditError(null);
    };

    const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) {
            setEditVideoFile(null);
            setVideoSizeWarning(null);
            return;
        }

        const sizeInMb = file.size / (1024 * 1024);
        if (sizeInMb > 16) {
            setVideoSizeWarning(`Warning: File size is ${sizeInMb.toFixed(1)} MB. Meta requires video to be strictly 16 MB or less. Please compress before uploading.`);
        } else {
            setVideoSizeWarning(null);
        }
        setEditVideoFile(file);
    };

    const handleUpdateTemplate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingTemplate || !editBody.trim()) return;

        if (editVideoFile && editVideoFile.size > 16 * 1024 * 1024) {
            setEditError('Video file exceeds Meta\'s 16 MB limit. Please compress the video before uploading.');
            return;
        }

        setIsUpdating(true);
        setEditError(null);

        const formData = new FormData();
        formData.append('body', editBody.trim());
        formData.append('template_name', editingTemplate.name);
        if (editHeader.trim()) formData.append('header', editHeader.trim());
        if (editFooter.trim()) formData.append('footer', editFooter.trim());
        if (editHeaderUrl.trim()) formData.append('header_url', editHeaderUrl.trim());
        if (editVideoFile) formData.append('video_file', editVideoFile);
        formData.append('_method', 'PUT');

        router.post(
            `/templates/${editingTemplate.id}`,
            formData,
            {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: () => {
                    setIsUpdating(false);
                    setEditingTemplate(null);
                    setEditVideoFile(null);
                    setVideoSizeWarning(null);
                    showToast(`Template "${editingTemplate.name}" updated successfully.`);
                },
                onError: (errs: any) => {
                    setIsUpdating(false);
                    setEditError(errs?.message || 'Failed to update template in Meta.');
                },
                onFinish: () => {
                    setIsUpdating(false);
                },
            }
        );
    };

    const insertVariableIntoEditBody = () => {
        const matches = editBody.match(/\{\{(\d+)\}\}/g) || [];
        const nextNum = matches.length + 1;
        setEditBody((prev) => `${prev} {{${nextNum}}}`);
    };

    const handleConfirmDelete = () => {
        if (!deletingTemplate) return;

        const targetName = deletingTemplate.name;
        setIsDeleting(true);
        setDeleteError(null);

        router.delete(`/templates/${targetName}`, {
            preserveScroll: true,
            onSuccess: () => {
                setIsDeleting(false);
                setTemplates((prev) => prev.filter((t) => t.name !== targetName));
                if (selectedTemplate?.name === targetName) {
                    setSelectedTemplate(null);
                }
                showToast(`Template "${targetName}" deleted successfully.`);
                setDeletingTemplate(null);
            },
            onError: (errs) => {
                setIsDeleting(false);
                setDeleteError(errs?.message || 'Failed to delete template from Meta.');
            },
            onFinish: () => {
                setIsDeleting(false);
            },
        });
    };

    const getBodyText = (t: TemplateItem | null) => {
        if (!t) return '';
        return t.body || t.bodyText || '';
    };

    const getHeaderText = (t: TemplateItem | null) => {
        if (!t) return null;
        return t.header || t.headerText || null;
    };

    const getFooterText = (t: TemplateItem | null) => {
        if (!t) return null;
        return t.footer || t.footerText || null;
    };

    const filteredTemplates = templates.filter((t) => {
        if (categoryFilter !== 'ALL' && t.category.toUpperCase() !== categoryFilter) {
            return false;
        }
        if (languageFilter !== 'ALL' && t.language !== languageFilter) {
            return false;
        }
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            const body = getBodyText(t).toLowerCase();
            return t.name.toLowerCase().includes(q) || body.includes(q);
        }
        return true;
    });

    const activePreviewTemplate = selectedTemplate || filteredTemplates[0] || null;

    return (
        <>
            <Head title="WhatsApp Message Templates (HSM) - Sathwara InfoTech" />

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
                        <div className="flex items-center gap-2 mb-1">
                            <Button
                                variant="ghost"
                                size="sm"
                                asChild
                                className="h-7 text-xs text-muted-foreground p-0 hover:text-foreground"
                            >
                                <Link href="/campaigns">
                                    <ArrowLeft className="size-3.5 mr-1" />
                                    Campaigns
                                </Link>
                            </Button>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                                <FileText className="size-6 text-[#47b672]" />
                                Meta Approved Message Templates (HSM)
                            </h1>
                            <Badge
                                variant="outline"
                                className="text-xs bg-[#47b672]/10 text-[#28804c] dark:text-[#52c480] border-[#47b672]/30"
                            >
                                {templates.length} Real Meta Templates
                            </Badge>
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                            Official Meta WhatsApp Cloud API templates verified for broadcast campaigns and automated customer alerts.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={isSyncing}
                            onClick={handleSyncMeta}
                            className="text-xs h-8 border-border hover:bg-muted gap-1.5"
                            title="Re-fetch templates from Meta Graph API"
                        >
                            <RefreshCw className={`size-3.5 ${isSyncing ? 'animate-spin text-[#47b672]' : ''}`} />
                            <span>{isSyncing ? 'Syncing...' : 'Sync with Meta'}</span>
                        </Button>

                        <Button
                            size="sm"
                            onClick={() => {
                                setSubmitError(null);
                                setIsCreateOpen(true);
                            }}
                            className="bg-[#47b672] hover:bg-[#3ca062] text-white text-xs h-8 gap-1.5 shadow-2xs"
                        >
                            <Plus className="size-3.5" />
                            <span>Create Template</span>
                        </Button>
                    </div>
                </div>

                {/* Filters & Search Toolbar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card border border-border/70 rounded-xl p-3">
                    <div className="flex items-center gap-2 flex-wrap">
                        {['ALL', 'UTILITY', 'MARKETING', 'AUTHENTICATION'].map((cat) => (
                            <Button
                                key={cat}
                                size="sm"
                                variant={categoryFilter === cat ? 'default' : 'ghost'}
                                onClick={() => setCategoryFilter(cat)}
                                className={`text-xs h-7 px-3 rounded-md font-medium ${
                                    categoryFilter === cat
                                        ? 'bg-[#47b672] hover:bg-[#3ca062] text-white'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                {cat === 'ALL' ? 'All Categories' : cat}
                            </Button>
                        ))}

                        <div className="h-4 w-px bg-border/60 mx-1 hidden sm:block" />

                        <select
                            value={languageFilter}
                            onChange={(e) => setLanguageFilter(e.target.value)}
                            className="h-7 text-xs rounded-md border border-border/80 bg-background px-2 text-muted-foreground focus:outline-none"
                        >
                            <option value="ALL">All Languages</option>
                            <option value="en_US">English (en_US)</option>
                            <option value="gu">Gujarati (gu)</option>
                            <option value="hi">Hindi (hi)</option>
                        </select>
                    </div>

                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-2.5 top-2 size-3.5 text-muted-foreground" />
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by name, message text..."
                            className="pl-8 text-xs h-7"
                        />
                    </div>
                </div>

                {/* 2-Column: Real Meta Templates List & WhatsApp Mobile Screen Preview */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                    {/* Left: Templates Cards / List */}
                    <div className="lg:col-span-7 space-y-2.5">
                        {filteredTemplates.length === 0 ? (
                            <div className="text-center py-12 border border-dashed rounded-xl bg-card text-muted-foreground text-xs space-y-2">
                                <FileText className="size-8 mx-auto text-muted-foreground/60" />
                                <p className="font-semibold text-foreground">No templates found matching your criteria</p>
                                <p className="text-muted-foreground">Try clearing search filters or click "Sync with Meta" to reload.</p>
                            </div>
                        ) : (
                            filteredTemplates.map((tpl) => {
                                const isSelected = activePreviewTemplate?.id === tpl.id;
                                const body = getBodyText(tpl);
                                const header = getHeaderText(tpl);

                                return (
                                    <div
                                        key={tpl.id}
                                        onClick={() => setSelectedTemplate(tpl)}
                                        className={`cursor-pointer rounded-xl border p-3.5 transition-all duration-150 flex flex-col justify-between gap-2.5 ${
                                            isSelected
                                                ? 'border-[#47b672] ring-1 ring-[#47b672]/30 bg-card shadow-xs'
                                                : 'border-border/80 bg-card hover:border-[#47b672]/50 hover:shadow-xs'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="space-y-0.5 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-mono text-xs font-bold text-foreground">
                                                        {tpl.name}
                                                    </span>
                                                    <Badge
                                                        variant="outline"
                                                        className={`text-[10px] font-medium py-0 px-1.5 h-4 ${
                                                            tpl.status === 'APPROVED'
                                                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                                                : tpl.status === 'PENDING' || tpl.status === 'IN_REVIEW'
                                                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                                                                : 'bg-red-500/10 text-red-600 border-red-500/30'
                                                        }`}
                                                    >
                                                        {tpl.status === 'APPROVED' && <Check className="size-2.5 mr-0.5" />}
                                                        {tpl.status}
                                                    </Badge>
                                                    <span className="text-[10px] text-muted-foreground/80 font-mono">
                                                        [{tpl.language}]
                                                    </span>
                                                </div>

                                                {header && (
                                                    <p className="text-[11px] font-semibold text-foreground/90 truncate">
                                                        Header: {header}
                                                    </p>
                                                )}

                                                <p className="text-xs text-muted-foreground line-clamp-2">
                                                    {body}
                                                </p>
                                            </div>

                                            <div className="shrink-0 text-right">
                                                <span className="inline-block rounded-md bg-muted/60 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground border border-border/40 uppercase tracking-wider">
                                                    {tpl.category}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-2 border-t border-border/50 text-[11px] text-muted-foreground">
                                            <div className="flex items-center gap-2">
                                                <span>Est. Cost: <strong className="text-foreground">{tpl.costEstimate || '₹0.11 / msg'}</strong></span>
                                                {tpl.headerFormat && (
                                                    <span className="rounded bg-muted px-1.5 py-0.2 text-[9px] font-mono text-muted-foreground">
                                                        {tpl.headerFormat}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-1 shrink-0">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground hover:bg-muted rounded cursor-pointer"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openEditModal(tpl);
                                                    }}
                                                    title="Edit template content in Meta"
                                                >
                                                    <Pencil className="size-3" />
                                                </Button>

                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-6 w-6 p-0 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded cursor-pointer"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setDeletingTemplate(tpl);
                                                        setDeleteError(null);
                                                    }}
                                                    title="Delete template from Meta"
                                                >
                                                    <Trash2 className="size-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Right: Realistic WhatsApp Mobile Screen Preview */}
                    <div className="lg:col-span-5 sticky top-6">
                        <Card className="border-border/80 shadow-xs rounded-xl overflow-hidden">
                            <CardHeader className="py-2.5 px-4 bg-muted/30 border-b border-border/80">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Smartphone className="size-4 text-[#47b672]" />
                                        <CardTitle className="text-xs font-semibold text-foreground">
                                            WhatsApp Customer Preview
                                        </CardTitle>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        {activePreviewTemplate && (
                                            <>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-6 px-2 text-[10px] text-muted-foreground hover:text-foreground hover:bg-muted rounded gap-1 cursor-pointer"
                                                    onClick={() => openEditModal(activePreviewTemplate)}
                                                    title="Edit this template"
                                                >
                                                    <Pencil className="size-2.5" />
                                                    <span>Edit</span>
                                                </Button>
                                                <Badge variant="secondary" className="text-[10px] font-mono h-4 px-1.5">
                                                    {activePreviewTemplate.category}
                                                </Badge>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="p-4 space-y-3 bg-[#e5ddd5]/30 dark:bg-zinc-950/40 min-h-[380px] flex flex-col justify-between">
                                {activePreviewTemplate ? (
                                    <>
                                        {/* Simulated WhatsApp Chat Bubble */}
                                        <div className="bg-[#ffffff] dark:bg-[#1f2c34] p-3 rounded-lg shadow-sm max-w-sm space-y-2 border border-slate-200/60 dark:border-zinc-800 self-start w-full">
                                            {/* Header text or format */}
                                            {getHeaderText(activePreviewTemplate) && (
                                                <div className="font-bold text-xs text-foreground pb-1 border-b border-border/40">
                                                    {getHeaderText(activePreviewTemplate)}
                                                </div>
                                            )}

                                            {activePreviewTemplate.headerFormat === 'DOCUMENT' && (
                                                <div className="flex items-center gap-2 bg-muted/40 p-2 rounded text-xs font-medium text-foreground border border-border/40">
                                                    <FileText className="size-4 text-red-500" />
                                                    <span>Invoice_Document.pdf</span>
                                                </div>
                                            )}

                                            {/* Body text with styled dynamic variables */}
                                            <div className="text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed">
                                                {getBodyText(activePreviewTemplate)
                                                    .split(/(\{\{\d+\}\})/)
                                                    .map((chunk, i) =>
                                                        chunk.match(/^\{\{\d+\}\}$/) ? (
                                                            <span
                                                                key={i}
                                                                className="inline-block bg-[#47b672]/15 text-[#28804c] dark:text-[#52c480] px-1 rounded font-semibold text-[11px]"
                                                            >
                                                                {chunk}
                                                            </span>
                                                        ) : (
                                                            chunk
                                                        )
                                                    )}
                                            </div>

                                            {/* Footer */}
                                            {getFooterText(activePreviewTemplate) && (
                                                <div className="text-[10px] text-muted-foreground pt-1">
                                                    {getFooterText(activePreviewTemplate)}
                                                </div>
                                            )}

                                            {/* Interactive Call-To-Action or Quick Reply Buttons */}
                                            {activePreviewTemplate.buttons && (
                                                <div className="pt-2 border-t border-slate-200/60 dark:border-zinc-800 space-y-1">
                                                    {(Array.isArray(activePreviewTemplate.buttons)
                                                        ? activePreviewTemplate.buttons
                                                        : []
                                                    ).map((btn, idx) => {
                                                        const btnText = typeof btn === 'string' ? btn : btn.text;
                                                        return (
                                                            <div
                                                                key={idx}
                                                                className="w-full py-1.5 px-3 rounded text-center text-xs font-semibold text-[#00a884] dark:text-[#52c480] bg-muted/50 flex items-center justify-center gap-1.5 border border-border/30"
                                                            >
                                                                <ExternalLink className="size-3" />
                                                                <span>{btnText}</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            <div className="text-[10px] text-right text-muted-foreground pt-0.5 flex items-center justify-end gap-1">
                                                <span>12:00 PM</span>
                                                <Check className="inline size-3 text-[#53bdeb]" />
                                            </div>
                                        </div>


                                    </>
                                ) : (
                                    <div className="m-auto text-center text-xs text-muted-foreground">
                                        Select a template from the list to preview
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Create Meta Template Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="text-sm font-semibold flex items-center gap-2">
                            <Plus className="size-4 text-[#47b672]" />
                            Create &amp; Submit Meta WhatsApp Template
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Submit a new template to your connected WhatsApp Business Account for automated Meta review.
                        </DialogDescription>
                    </DialogHeader>

                    {submitError && (
                        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-2.5 text-xs text-red-600 dark:text-red-400 flex items-start gap-2">
                            <AlertCircle className="size-4 shrink-0 mt-0.5" />
                            <span>{submitError}</span>
                        </div>
                    )}

                    <form onSubmit={handleCreateTemplate} className="space-y-3 py-1">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs font-medium">
                                    Template Name <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                                    placeholder="e.g. order_alert_v1"
                                    className="text-xs font-mono"
                                    required
                                />
                                <span className="text-[10px] text-muted-foreground">Only lowercase &amp; underscores</span>
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs font-medium">Category</Label>
                                <select
                                    value={newCategory}
                                    onChange={(e) => setNewCategory(e.target.value as any)}
                                    className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs h-9 focus:outline-none"
                                >
                                    <option value="UTILITY">UTILITY (Transactional / ₹0.11)</option>
                                    <option value="MARKETING">MARKETING (Offers &amp; Promos / ₹0.78)</option>
                                    <option value="AUTHENTICATION">AUTHENTICATION (OTP &amp; Login)</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs font-medium">Language</Label>
                                <select
                                    value={newLanguage}
                                    onChange={(e) => setNewLanguage(e.target.value)}
                                    className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs h-9 focus:outline-none"
                                >
                                    <option value="gu">Gujarati (gu)</option>
                                    <option value="en_US">English (en_US)</option>
                                    <option value="hi">Hindi (hi)</option>
                                </select>
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs font-medium">Header Type</Label>
                                <select
                                    value={newHeaderType}
                                    onChange={(e) => {
                                        setNewHeaderType(e.target.value as any);
                                        setNewHeaderFile(null);
                                        setNewHeaderFileWarning(null);
                                    }}
                                    className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs h-9 focus:outline-none"
                                >
                                    <option value="NONE">None (Text Body Only)</option>
                                    <option value="VIDEO">🎬 Video Header (.mp4, max 16MB)</option>
                                    <option value="IMAGE">🖼️ Image Header (.jpg, .png)</option>
                                    <option value="DOCUMENT">📄 Document Header (.pdf)</option>
                                    <option value="TEXT">🔤 Text Header</option>
                                </select>
                            </div>
                        </div>

                        {/* Header Details depending on selected type */}
                        {newHeaderType === 'TEXT' && (
                            <div className="space-y-1">
                                <Label className="text-xs font-medium">Header Title Text</Label>
                                <Input
                                    value={newHeader}
                                    onChange={(e) => setNewHeader(e.target.value)}
                                    placeholder="e.g. DukanHisab App Launch"
                                    className="text-xs"
                                    maxLength={60}
                                />
                            </div>
                        )}

                        {newHeaderType === 'VIDEO' && (
                            <div className="space-y-1.5 p-3 rounded-lg border border-purple-500/25 bg-purple-500/5">
                                <Label className="text-xs font-medium text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                                    <span>🎬 Upload Sample Video (.mp4)</span>
                                    <span className="text-[10px] text-muted-foreground font-normal">(required for Meta review)</span>
                                </Label>
                                <Input
                                    type="file"
                                    accept="video/mp4"
                                    onChange={handleHeaderFileChange}
                                    className="text-xs cursor-pointer bg-background"
                                    required
                                />
                                {newHeaderFileWarning ? (
                                    <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">{newHeaderFileWarning}</p>
                                ) : (
                                    <p className="text-[10px] text-muted-foreground">
                                        Meta requires an example video under 16 MB. The video will be sent to Meta for official approval.
                                    </p>
                                )}
                            </div>
                        )}

                        {newHeaderType === 'IMAGE' && (
                            <div className="space-y-1.5 p-3 rounded-lg border border-blue-500/25 bg-blue-500/5">
                                <Label className="text-xs font-medium text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                                    <span>🖼️ Upload Sample Image (.jpg, .png)</span>
                                    <span className="text-[10px] text-muted-foreground font-normal">(required for Meta review)</span>
                                </Label>
                                <Input
                                    type="file"
                                    accept="image/jpeg,image/png"
                                    onChange={handleHeaderFileChange}
                                    className="text-xs cursor-pointer bg-background"
                                    required
                                />
                                <p className="text-[10px] text-muted-foreground">Max 5 MB image for header preview.</p>
                            </div>
                        )}

                        {newHeaderType === 'DOCUMENT' && (
                            <div className="space-y-1.5 p-3 rounded-lg border border-amber-500/25 bg-amber-500/5">
                                <Label className="text-xs font-medium text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                                    <span>📄 Upload Sample PDF Document</span>
                                    <span className="text-[10px] text-muted-foreground font-normal">(required for Meta review)</span>
                                </Label>
                                <Input
                                    type="file"
                                    accept="application/pdf"
                                    onChange={handleHeaderFileChange}
                                    className="text-xs cursor-pointer bg-background"
                                    required
                                />
                                <p className="text-[10px] text-muted-foreground">Max 10 MB PDF for header preview.</p>
                            </div>
                        )}

                        <div className="space-y-1">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-medium">
                                    Message Body <span className="text-red-500">*</span>
                                </Label>
                                <button
                                    type="button"
                                    onClick={insertVariableIntoBody}
                                    className="text-[11px] text-[#47b672] hover:underline font-semibold cursor-pointer"
                                >
                                    + Add Variable (&#123;&#123;1&#125;&#125;)
                                </button>
                            </div>
                            <textarea
                                rows={4}
                                value={newBody}
                                onChange={(e) => setNewBody(e.target.value)}
                                placeholder="Hello {{1}}, thank you for your order #{{2}}. Your order is confirmed and will be delivered on {{3}}."
                                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs focus:outline-none"
                                required
                            />
                            <span className="text-[10px] text-muted-foreground">
                                Use &#123;&#123;1&#125;&#125;, &#123;&#123;2&#125;&#125; for dynamic customer data.
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs font-medium">Footer (optional)</Label>
                                <Input
                                    value={newFooter}
                                    onChange={(e) => setNewFooter(e.target.value)}
                                    placeholder="e.g. Sathwara InfoTech"
                                    className="text-xs"
                                    maxLength={60}
                                />
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs font-medium">Interactive Buttons</Label>
                                <select
                                    value={newButtonType}
                                    onChange={(e) => setNewButtonType(e.target.value as any)}
                                    className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs h-9 focus:outline-none"
                                >
                                    <option value="NONE">None</option>
                                    <option value="URL">Call to Action (Website / App URL)</option>
                                    <option value="QUICK_REPLY">Quick Reply Button</option>
                                </select>
                            </div>
                        </div>

                        {newButtonType === 'URL' && (
                            <div className="grid grid-cols-2 gap-3 p-3 rounded-lg border border-emerald-500/25 bg-emerald-500/5">
                                <div className="space-y-1">
                                    <Label className="text-xs font-medium text-emerald-800 dark:text-emerald-300">Button Label</Label>
                                    <Input
                                        value={newButtonUrlText}
                                        onChange={(e) => setNewButtonUrlText(e.target.value)}
                                        placeholder="Download Now"
                                        className="text-xs bg-background"
                                        maxLength={25}
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs font-medium text-emerald-800 dark:text-emerald-300">Target URL</Label>
                                    <Input
                                        value={newButtonUrlLink}
                                        onChange={(e) => setNewButtonUrlLink(e.target.value)}
                                        placeholder="https://play.google.com/..."
                                        className="text-xs bg-background"
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        {newButtonType === 'QUICK_REPLY' && (
                            <div className="p-3 rounded-lg border border-emerald-500/25 bg-emerald-500/5 space-y-1">
                                <Label className="text-xs font-medium text-emerald-800 dark:text-emerald-300">Quick Reply Text</Label>
                                <Input
                                    value={newButtonQrText}
                                    onChange={(e) => setNewButtonQrText(e.target.value)}
                                    placeholder="e.g. Yes, Interested"
                                    className="text-xs bg-background"
                                    maxLength={25}
                                    required
                                />
                            </div>
                        )}

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={isSubmitting}
                                onClick={() => setIsCreateOpen(false)}
                                className="text-xs"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                size="sm"
                                disabled={isSubmitting}
                                className="bg-[#47b672] hover:bg-[#3ca062] text-white text-xs gap-1.5"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="size-3.5 animate-spin" />
                                        <span>Submitting to Meta...</span>
                                    </>
                                ) : (
                                    <>
                                        <Send className="size-3.5" />
                                        <span>Submit to Meta</span>
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Meta Template Dialog */}
            <Dialog open={!!editingTemplate} onOpenChange={(open) => !open && setEditingTemplate(null)}>
                <DialogContent className="sm:max-w-[460px] max-h-[88vh] overflow-y-auto p-4 sm:p-5">
                    <DialogHeader className="pb-1">
                        <DialogTitle className="text-sm font-semibold flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                                <Pencil className="size-3.5 text-[#47b672]" />
                                Edit Template
                            </span>
                            <code className="text-[11px] font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground font-normal">
                                {editingTemplate?.name}
                            </code>
                        </DialogTitle>
                    </DialogHeader>

                    {editError && (
                        <div className="rounded-md bg-red-500/10 border border-red-500/20 p-2 text-xs text-red-600 dark:text-red-400 flex items-start gap-1.5">
                            <AlertCircle className="size-3.5 shrink-0 mt-0.5" />
                            <span>{editError}</span>
                        </div>
                    )}

                    <form onSubmit={handleUpdateTemplate} className="space-y-2.5 py-0.5">
                        {/* Text Header for non-video templates */}
                        {!(editingTemplate?.headerFormat === 'VIDEO' || editingTemplate?.name?.toLowerCase().includes('launch') || editingTemplate?.name?.toLowerCase().includes('video')) && (
                            <div className="space-y-1">
                                <Label className="text-[11px] font-medium">Header (optional)</Label>
                                <Input
                                    value={editHeader}
                                    onChange={(e) => setEditHeader(e.target.value)}
                                    placeholder="e.g. Order Confirmation"
                                    className="text-xs h-8"
                                    maxLength={60}
                                />
                            </div>
                        )}

                        {/* Compact Video Header Section for Video Templates */}
                        {(editingTemplate?.headerFormat === 'VIDEO' || editingTemplate?.name?.toLowerCase().includes('launch') || editingTemplate?.name?.toLowerCase().includes('video')) && (
                            <div className="rounded-lg border border-border/80 bg-muted/20 p-2.5 space-y-2 text-xs">
                                <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-1.5 font-medium text-[11px] text-foreground">
                                        <Video className="size-3.5 text-[#47b672]" />
                                        Video Header
                                    </span>
                                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                                        MP4 (&lt; 16 MB)
                                    </span>
                                </div>

                                {/* Option 1: Upload Video File */}
                                <div className="flex items-center gap-2">
                                    <input
                                        type="file"
                                        id="template-video-upload"
                                        accept="video/mp4,video/3gpp"
                                        onChange={handleVideoFileChange}
                                        className="hidden"
                                    />
                                    <label
                                        htmlFor="template-video-upload"
                                        className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 border border-dashed border-input hover:border-[#47b672] rounded cursor-pointer bg-background hover:bg-muted/30 transition-colors text-[11px] text-muted-foreground hover:text-foreground"
                                    >
                                        <Upload className="size-3 text-[#47b672]" />
                                        <span className="truncate max-w-[200px]">
                                            {editVideoFile ? editVideoFile.name : 'Upload MP4 File (< 16 MB)'}
                                        </span>
                                    </label>
                                    {editVideoFile && (
                                        <button
                                            type="button"
                                            className="text-[10px] text-red-500 hover:underline px-1 cursor-pointer"
                                            onClick={() => {
                                                setEditVideoFile(null);
                                                setVideoSizeWarning(null);
                                            }}
                                        >
                                            Clear
                                        </button>
                                    )}
                                </div>

                                {videoSizeWarning ? (
                                    <p className="text-[10px] text-red-500 font-medium">{videoSizeWarning}</p>
                                ) : editVideoFile ? (
                                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                                        <Check className="size-3" />
                                        {(editVideoFile.size / (1024 * 1024)).toFixed(1)} MB (Ready to upload)
                                    </p>
                                ) : null}

                                {/* Option 2: Public Video URL */}
                                <div className="flex items-center gap-1.5 pt-1 border-t border-border/40">
                                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">OR URL:</span>
                                    <Input
                                        value={editHeaderUrl}
                                        onChange={(e) => setEditHeaderUrl(e.target.value)}
                                        placeholder="https://...video.mp4"
                                        className="text-[11px] h-7 font-mono px-2"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-1">
                            <div className="flex items-center justify-between">
                                <Label className="text-[11px] font-medium">
                                    Message Body <span className="text-red-500">*</span>
                                </Label>
                                <button
                                    type="button"
                                    onClick={insertVariableIntoEditBody}
                                    className="text-[10px] text-[#47b672] hover:underline font-semibold cursor-pointer"
                                >
                                    + Add Variable (&#123;&#123;1&#125;&#125;)
                                </button>
                            </div>
                            <textarea
                                rows={3}
                                value={editBody}
                                onChange={(e) => setEditBody(e.target.value)}
                                placeholder="Enter updated template body..."
                                className="w-full rounded-md border border-input bg-transparent px-2.5 py-1.5 text-xs focus:outline-none max-h-24 leading-relaxed"
                                required
                            />
                        </div>

                        <div className="space-y-1">
                            <Label className="text-[11px] font-medium">Footer (optional)</Label>
                            <Input
                                value={editFooter}
                                onChange={(e) => setEditFooter(e.target.value)}
                                placeholder="e.g. Sathwara InfoTech"
                                className="text-xs h-7.5"
                                maxLength={60}
                            />
                        </div>

                        <DialogFooter className="pt-2 flex items-center justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={isUpdating}
                                onClick={() => setEditingTemplate(null)}
                                className="text-xs h-7.5 px-3"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                size="sm"
                                disabled={isUpdating}
                                className="bg-[#47b672] hover:bg-[#3ca062] text-white text-xs h-7.5 px-3.5 gap-1.5 cursor-pointer"
                            >
                                {isUpdating ? (
                                    <>
                                        <Loader2 className="size-3 animate-spin" />
                                        <span>Saving...</span>
                                    </>
                                ) : (
                                    <span>Save to Meta</span>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!deletingTemplate} onOpenChange={(open) => !open && setDeletingTemplate(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-red-100 dark:bg-red-950/50 text-red-600">
                                <Trash2 className="size-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-base font-semibold">
                                    Delete Template from Meta?
                                </DialogTitle>
                                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                                    Are you sure you want to remove <span className="font-semibold text-foreground">"{deletingTemplate?.name}"</span>?
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    {deleteError && (
                        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-2.5 text-xs text-red-600 dark:text-red-400 flex items-start gap-2">
                            <AlertCircle className="size-4 shrink-0 mt-0.5" />
                            <span>{deleteError}</span>
                        </div>
                    )}

                    <p className="text-xs text-muted-foreground">
                        Deleting this template will delete it permanently from your WhatsApp Business Account. Any ongoing automated campaigns using this template will be stopped.
                    </p>

                    <DialogFooter className="flex flex-row justify-end items-center gap-3 pt-3 sm:gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isDeleting}
                            onClick={() => setDeletingTemplate(null)}
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
                                    <span>Deleting from Meta...</span>
                                </>
                            ) : (
                                <>
                                    <Trash2 className="size-3.5" />
                                    <span>Delete Template</span>
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
