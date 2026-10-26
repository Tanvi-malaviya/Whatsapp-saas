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
    const [newCategory, setNewCategory] = useState<'UTILITY' | 'MARKETING' | 'AUTHENTICATION'>('UTILITY');
    const [newLanguage, setNewLanguage] = useState('en_US');
    const [newHeader, setNewHeader] = useState('');
    const [newBody, setNewBody] = useState('');
    const [newFooter, setNewFooter] = useState('');

    // Edit Template State
    const [editingTemplate, setEditingTemplate] = useState<TemplateItem | null>(null);
    const [editHeader, setEditHeader] = useState('');
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

    const handleCreateTemplate = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError(null);

        const cleanName = newName.toLowerCase().trim().replace(/[^a-z0-9_]/g, '_');
        if (!cleanName || !newBody.trim()) {
            setSubmitError('Template name and Body text are required.');
            return;
        }

        setIsSubmitting(true);
        router.post(
            '/templates',
            {
                name: cleanName,
                category: newCategory,
                language: newLanguage,
                header: newHeader.trim() || null,
                body: newBody.trim(),
                footer: newFooter.trim() || null,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsSubmitting(false);
                    setIsCreateOpen(false);
                    setNewName('');
                    setNewHeader('');
                    setNewBody('');
                    setNewFooter('');
                    showToast(`Template "${cleanName}" submitted to Meta for review.`);
                },
                onError: (errs) => {
                    setIsSubmitting(false);
                    setSubmitError(errs?.message || 'Failed to submit template to Meta.');
                },
                onFinish: () => {
                    setIsSubmitting(false);
                },
            }
        );
    };

    const insertVariableIntoBody = () => {
        const matches = newBody.match(/\{\{(\d+)\}\}/g) || [];
        const nextNum = matches.length + 1;
        setNewBody((prev) => `${prev} {{${nextNum}}}`);
    };

    const openEditModal = (tpl: TemplateItem) => {
        setEditingTemplate(tpl);
        setEditHeader(tpl.header || tpl.headerText || '');
        setEditBody(tpl.body || tpl.bodyText || '');
        setEditFooter(tpl.footer || tpl.footerText || '');
        setEditError(null);
    };

    const handleUpdateTemplate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingTemplate || !editBody.trim()) return;

        setIsUpdating(true);
        setEditError(null);

        router.put(
            `/templates/${editingTemplate.id}`,
            {
                header: editHeader.trim() || null,
                body: editBody.trim(),
                footer: editFooter.trim() || null,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsUpdating(false);
                    setEditingTemplate(null);
                    showToast(`Template "${editingTemplate.name}" updated successfully.`);
                },
                onError: (errs) => {
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
                                    <option value="en_US">English (en_US)</option>
                                    <option value="gu">Gujarati (gu)</option>
                                    <option value="hi">Hindi (hi)</option>
                                </select>
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs font-medium">Header (optional)</Label>
                                <Input
                                    value={newHeader}
                                    onChange={(e) => setNewHeader(e.target.value)}
                                    placeholder="e.g. Order Confirmation"
                                    className="text-xs"
                                    maxLength={60}
                                />
                            </div>
                        </div>

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

                        <div className="space-y-1">
                            <Label className="text-xs font-medium">Footer (optional)</Label>
                            <Input
                                value={newFooter}
                                onChange={(e) => setNewFooter(e.target.value)}
                                placeholder="e.g. Sathwara InfoTech • Reply STOP to unsubscribe"
                                className="text-xs"
                                maxLength={60}
                            />
                        </div>

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
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="text-sm font-semibold flex items-center gap-2">
                            <Pencil className="size-4 text-[#47b672]" />
                            Edit Meta Template ("{editingTemplate?.name}")
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Update message content and components. Meta will review updated variables and text.
                        </DialogDescription>
                    </DialogHeader>

                    {editError && (
                        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-2.5 text-xs text-red-600 dark:text-red-400 flex items-start gap-2">
                            <AlertCircle className="size-4 shrink-0 mt-0.5" />
                            <span>{editError}</span>
                        </div>
                    )}

                    <form onSubmit={handleUpdateTemplate} className="space-y-3 py-1">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs font-medium">Template Name</Label>
                                <Input
                                    value={editingTemplate?.name || ''}
                                    disabled
                                    className="text-xs font-mono bg-muted text-muted-foreground opacity-80"
                                />
                                <span className="text-[10px] text-muted-foreground">Template names cannot be changed in Meta</span>
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs font-medium">Header (optional)</Label>
                                <Input
                                    value={editHeader}
                                    onChange={(e) => setEditHeader(e.target.value)}
                                    placeholder="e.g. Order Confirmation"
                                    className="text-xs"
                                    maxLength={60}
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-medium">
                                    Message Body <span className="text-red-500">*</span>
                                </Label>
                                <button
                                    type="button"
                                    onClick={insertVariableIntoEditBody}
                                    className="text-[11px] text-[#47b672] hover:underline font-semibold cursor-pointer"
                                >
                                    + Add Variable (&#123;&#123;1&#125;&#125;)
                                </button>
                            </div>
                            <textarea
                                rows={4}
                                value={editBody}
                                onChange={(e) => setEditBody(e.target.value)}
                                placeholder="Enter updated template body..."
                                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs focus:outline-none"
                                required
                            />
                            <span className="text-[10px] text-muted-foreground">
                                Ensure enough static context words surround variables so Meta approves the edit.
                            </span>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs font-medium">Footer (optional)</Label>
                            <Input
                                value={editFooter}
                                onChange={(e) => setEditFooter(e.target.value)}
                                placeholder="e.g. Sathwara InfoTech"
                                className="text-xs"
                                maxLength={60}
                            />
                        </div>

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={isUpdating}
                                onClick={() => setEditingTemplate(null)}
                                className="text-xs"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                size="sm"
                                disabled={isUpdating}
                                className="bg-[#47b672] hover:bg-[#3ca062] text-white text-xs gap-1.5"
                            >
                                {isUpdating ? (
                                    <>
                                        <Loader2 className="size-3.5 animate-spin" />
                                        <span>Saving to Meta...</span>
                                    </>
                                ) : (
                                    <>
                                        <Check className="size-3.5" />
                                        <span>Save to Meta</span>
                                    </>
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
