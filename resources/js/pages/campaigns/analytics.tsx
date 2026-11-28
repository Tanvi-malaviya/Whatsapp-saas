import { useEffect, useState } from 'react';
import { Head, Link, router, usePoll } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    BarChart2,
    CheckCheck,
    CheckCircle2,
    Clock,
    Download,
    IndianRupee,
    Info,
    MessageSquare,
    RefreshCw,
    Search,
    Send,
    Users,
    X,
    XCircle,
    Trash2,
    Zap,
    Loader2,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface FailureReason {
    error: string;
    count: number;
}

interface RecipientRow {
    id: number;
    phone: string;
    name: string | null;
    status: string;
    error: string | null;
    wamid: string | null;
    updated_at: string | null;
}

interface PaginatedRecipients {
    data: RecipientRow[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    prev_page_url: string | null;
    next_page_url: string | null;
}

interface CampaignInfo {
    id: string;
    name: string;
    template_name: string;
    template_language: string;
    category: string | null;
    cost_paise: number;
    cost_formatted: string;
    status: string;
    is_paused: boolean;
    created_at: string;
    scheduled_at: string | null;
}

interface MetricsInfo {
    total_selected: number;
    queued: number;
    sent: number;
    delivered: number;
    read: number;
    failed: number;
    cancelled: number;
    sent_total: number;
    delivered_total: number;
    replies: number;
    delivery_rate: number;
    read_rate: number;
    failure_reasons: FailureReason[];
}

interface Props {
    campaign: CampaignInfo;
    metrics: MetricsInfo;
    recipients: PaginatedRecipients;
    filters: {
        search: string;
        status: string;
    };
}

interface MetaErrorInfo {
    code: string | null;
    title: string;
    explanation: string;
    action: string;
}

const META_ERROR_GUIDE: Record<string, Omit<MetaErrorInfo, 'code'>> = {
    '131049': {
        title: 'Healthy Ecosystem Engagement Cap',
        explanation: 'WhatsApp skipped delivery because this user recently received too many marketing messages without replying.',
        action: 'Wait 24–48 hours before retrying, or send only to contacts who engage with your messages.',
    },
    '131026': {
        title: 'Number Not on WhatsApp / Inactive',
        explanation: 'The recipient phone number is not registered on WhatsApp, is inactive, or has not accepted WhatsApp Terms of Service.',
        action: 'Verify the number includes the right country code or remove inactive numbers from your list.',
    },
    '131047': {
        title: '24-Hour Customer Care Window Closed',
        explanation: 'A free-form message was attempted more than 24 hours after the customer last replied.',
        action: 'Use an approved WhatsApp template message to re-open the conversation.',
    },
    '131021': {
        title: 'Recipient Cannot Be Same as Sender',
        explanation: 'The destination phone number matches your connected WhatsApp Business number.',
        action: 'Remove your own business number from the recipient list.',
    },
    '131051': {
        title: 'Unsupported Message Type',
        explanation: 'The message format or media attachment is not supported by WhatsApp.',
        action: 'Check your template header media format and resend.',
    },
    '131031': {
        title: 'Business Account Locked / Restricted',
        explanation: 'Your WhatsApp Business Account is temporarily restricted by Meta.',
        action: 'Check Meta Business Manager Account Quality for policy notices.',
    },
    '130429': {
        title: 'Rate Limit Exceeded',
        explanation: 'Too many messages were sent in a short burst exceeding your tier throughput.',
        action: 'Space out large broadcasts or wait for automatic tier scaling.',
    },
    '132000': {
        title: 'Template Parameter Mismatch',
        explanation: 'The number of variables provided did not match what the template expects.',
        action: 'Check all {{1}}, {{2}} template variables before launching.',
    },
    '132001': {
        title: 'Template Does Not Exist',
        explanation: 'The selected template or language pack was not found or is not approved on Meta.',
        action: 'Sync your templates and verify the template is Approved.',
    },
    '135000': {
        title: 'Generic Template / Account Error',
        explanation: 'Meta rejected the request due to a configuration or payment method issue.',
        action: 'Verify your Meta Business payment method and template status.',
    },
};

function explainMetaError(rawError: string): MetaErrorInfo {
    const match = rawError.match(/(?:Meta\s*#|Code\s*#?|\b)(13\d{4})\b/i);
    const code = match ? match[1] : null;
    if (code && META_ERROR_GUIDE[code]) {
        return { code, ...META_ERROR_GUIDE[code] };
    }
    return {
        code,
        title: code ? `Meta Error #${code}` : 'Delivery Error',
        explanation: rawError,
        action: 'Review the recipient number and Meta Business Manager logs if this persists.',
    };
}

function StatusBadge({ status }: { status: string }) {
    switch (status) {
        case 'read':
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                    <CheckCheck className="size-3" />
                    Read
                </span>
            );
        case 'delivered':
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <CheckCheck className="size-3" />
                    Delivered
                </span>
            );
        case 'sent':
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                    <Send className="size-3" />
                    Sent
                </span>
            );
        case 'failed':
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-destructive/10 text-destructive border border-destructive/20">
                    <XCircle className="size-3" />
                    Failed
                </span>
            );
        case 'cancelled':
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-muted text-muted-foreground border border-border">
                    Cancelled
                </span>
            );
        default:
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    <Clock className="size-3" />
                    Queued
                </span>
            );
    }
}

export default function CampaignAnalyticsPage({ campaign, metrics, recipients, filters }: Props) {
    const [searchInput, setSearchInput] = useState(filters.search ?? '');
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        setSearchInput(filters.search ?? '');
    }, [filters.search]);

    const isLive = campaign.status === 'processing' || campaign.status === 'queued' || metrics.queued > 0 || metrics.sent > 0;
    usePoll(6000, { only: ['campaign', 'metrics', 'recipients'] }, { autoStart: isLive });

    const handleManualRefresh = () => {
        setRefreshing(true);
        router.reload({
            only: ['campaign', 'metrics', 'recipients'],
            onFinish: () => setRefreshing(false),
        });
    };

    const applyFilters = (nextSearch: string, nextStatus: string) => {
        const params: Record<string, string> = {};
        if (nextSearch.trim() !== '') params.search = nextSearch.trim();
        if (nextStatus !== '') params.status = nextStatus;

        router.get(`/campaigns/${campaign.id}/analytics`, params, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [isSendingNow, setIsSendingNow] = useState(false);

    const handleSendNow = async () => {
        setIsSendingNow(true);
        try {
            await api(`/campaigns/${campaign.id}/send-now`, 'POST');
            router.reload();
        } catch (e) {
            alert((e as Error).message);
        } finally {
            setIsSendingNow(false);
        }
    };

    const confirmDelete = async () => {
        setIsDeleting(true);
        setDeleteError(null);
        try {
            await api(`/campaigns/${campaign.id}`, 'DELETE');
            router.visit('/campaigns');
        } catch (e) {
            setDeleteError((e as Error).message);
            setIsDeleting(false);
        }
    };

    const totalRecipientsRecorded =
        metrics.queued + metrics.sent + metrics.delivered + metrics.read + metrics.failed + metrics.cancelled;
    const totalBase = Math.max(metrics.total_selected, totalRecipientsRecorded, 1);
    const attemptedBase = Math.max(metrics.sent_total + metrics.failed, 1);

    const sentPctOfSelected = metrics.total_selected > 0 ? Math.round((metrics.sent_total / metrics.total_selected) * 100) : 0;
    const replyRate = metrics.delivered_total > 0 ? ((metrics.replies / metrics.delivered_total) * 100).toFixed(1) : '0.0';
    const failRate = metrics.sent_total + metrics.failed > 0 ? ((metrics.failed / attemptedBase) * 100).toFixed(1) : '0.0';

    const costPerDelivered =
        metrics.delivered_total > 0 && campaign.cost_paise > 0
            ? `₹${(campaign.cost_paise / 100 / metrics.delivered_total).toFixed(2)}`
            : '—';

    const funnelStages = [
        {
            label: 'Total Selected',
            count: metrics.total_selected,
            pct: 100,
            hint: 'Audience targeted',
            barClass: 'bg-slate-500',
        },
        {
            label: 'Sent to WhatsApp',
            count: metrics.sent_total,
            pct: Math.round((metrics.sent_total / totalBase) * 100),
            hint: `${metrics.sent} awaiting delivery receipt`,
            barClass: 'bg-sky-500',
        },
        {
            label: 'Delivered to Device',
            count: metrics.delivered_total,
            pct: Math.round((metrics.delivered_total / totalBase) * 100),
            hint: `${metrics.delivery_rate}% of attempted`,
            barClass: 'bg-emerald-500',
        },
        {
            label: 'Read (Seen)',
            count: metrics.read,
            pct: Math.round((metrics.read / totalBase) * 100),
            hint: `${metrics.read_rate}% of delivered`,
            barClass: 'bg-blue-500',
        },
        {
            label: 'Customer Replies',
            count: metrics.replies,
            pct: Math.min(100, Math.round((metrics.replies / totalBase) * 100)),
            hint: `${replyRate}% of delivered`,
            barClass: 'bg-purple-500',
        },
    ];

    const statusTabs = [
        { key: '', label: 'All', count: totalRecipientsRecorded || metrics.total_selected },
        { key: 'read', label: 'Read', count: metrics.read },
        { key: 'delivered', label: 'Delivered (Unread)', count: metrics.delivered },
        { key: 'sent', label: 'Sent (Pending Receipt)', count: metrics.sent },
        { key: 'failed', label: 'Failed', count: metrics.failed },
        ...(metrics.queued > 0 ? [{ key: 'queued', label: 'Queued', count: metrics.queued }] : []),
        ...(metrics.cancelled > 0 ? [{ key: 'cancelled', label: 'Cancelled', count: metrics.cancelled }] : []),
    ];

    return (
        <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
            <Head title={`${campaign.name} - Campaign Analytics`} />

            {/* Top Navigation & Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1.5">
                    <Link
                        href="/campaigns"
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft className="size-3.5" />
                        Back to Broadcast Campaigns
                    </Link>

                    <div className="flex flex-wrap items-center gap-2.5">
                        <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <BarChart2 className="size-5" />
                        </div>
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                                    {campaign.name}
                                </h1>
                                <Badge variant="outline" className="capitalize text-[11px]">
                                    {campaign.is_paused ? 'paused' : campaign.status}
                                </Badge>
                                {isLive && (
                                    <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] gap-1">
                                        <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        Live Updating
                                    </Badge>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Launched {campaign.created_at}
                                {campaign.template_name ? ` · Template: ${campaign.template_name}` : ''}
                                {campaign.template_language ? ` (${campaign.template_language})` : ''}
                                {campaign.category ? ` · ${campaign.category}` : ''}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {(campaign.status === 'queued' || campaign.status === 'processing' || campaign.status === 'paused' || metrics.queued > 0) && (
                        <Button
                            type="button"
                            size="sm"
                            variant="default"
                            onClick={handleSendNow}
                            disabled={isSendingNow}
                            className="h-8 text-xs gap-1.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold cursor-pointer shadow-2xs"
                        >
                            {isSendingNow ? (
                                <>
                                    <Loader2 className="size-3.5 animate-spin" />
                                    <span>Sending Queued...</span>
                                </>
                            ) : (
                                <>
                                    <Zap className="size-3.5 fill-white" />
                                    <span>Send Now ({metrics.queued > 0 ? metrics.queued : 'All'})</span>
                                </>
                            )}
                        </Button>
                    )}
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleManualRefresh}
                        disabled={refreshing}
                        className="h-8 text-xs gap-1.5"
                    >
                        <RefreshCw className={`size-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button type="button" size="sm" variant="default" asChild className="h-8 text-xs gap-1.5">
                        <a href={`/campaigns/${campaign.id}/export`}>
                            <Download className="size-3.5" />
                            Export CSV Report
                        </a>
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                            setDeleteError(null);
                            setIsDeleteModalOpen(true);
                        }}
                        className="h-8 text-xs gap-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 cursor-pointer"
                    >
                        <Trash2 className="size-3.5" />
                        <span>Delete Campaign</span>
                    </Button>
                </div>
            </div>

            {/* Primary KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                <Card className="shadow-none">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
                            <span>Total Selected</span>
                            <Users className="size-4 text-muted-foreground/70" />
                        </div>
                        <div className="text-2xl font-bold text-foreground mt-1.5">{metrics.total_selected}</div>
                        <p className="text-[11px] text-muted-foreground mt-1">
                            {metrics.queued > 0 ? `${metrics.queued} still queued` : 'All recipients processed'}
                        </p>
                    </CardContent>
                </Card>

                <Card className="shadow-none border-sky-500/30 bg-sky-500/5">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between text-xs text-sky-700 dark:text-sky-300 font-medium">
                            <span>Sent to WhatsApp</span>
                            <Send className="size-4 text-sky-500" />
                        </div>
                        <div className="flex items-baseline gap-1.5 mt-1.5">
                            <span className="text-2xl font-bold text-sky-600 dark:text-sky-400">{metrics.sent_total}</span>
                            <span className="text-xs font-medium text-sky-600/80 dark:text-sky-400/80">
                                ({sentPctOfSelected}%)
                            </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1">
                            {metrics.sent > 0 ? `${metrics.sent} awaiting device receipt` : 'All sent have receipt'}
                        </p>
                    </CardContent>
                </Card>

                <Card className="shadow-none border-emerald-500/30 bg-emerald-500/5">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-300 font-medium">
                            <span>Delivered</span>
                            <CheckCheck className="size-4 text-emerald-500" />
                        </div>
                        <div className="flex items-baseline gap-1.5 mt-1.5">
                            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                {metrics.delivered_total}
                            </span>
                            <span className="text-xs font-medium text-emerald-600/80 dark:text-emerald-400/80">
                                ({metrics.delivery_rate}%)
                            </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1">
                            Of {metrics.sent_total + metrics.failed} attempted messages
                        </p>
                    </CardContent>
                </Card>

                <Card className="shadow-none border-blue-500/30 bg-blue-500/5">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between text-xs text-blue-700 dark:text-blue-300 font-medium">
                            <span>Read (Seen)</span>
                            <CheckCircle2 className="size-4 text-blue-500" />
                        </div>
                        <div className="flex items-baseline gap-1.5 mt-1.5">
                            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{metrics.read}</span>
                            <span className="text-xs font-medium text-blue-600/80 dark:text-blue-400/80">
                                ({metrics.read_rate}%)
                            </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1">
                            Of {metrics.delivered_total} delivered messages
                        </p>
                    </CardContent>
                </Card>

                <Card className="shadow-none border-purple-500/30 bg-purple-500/5 col-span-2 md:col-span-1">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between text-xs text-purple-700 dark:text-purple-300 font-medium">
                            <span>Customer Replies</span>
                            <MessageSquare className="size-4 text-purple-500" />
                        </div>
                        <div className="flex items-baseline gap-1.5 mt-1.5">
                            <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">{metrics.replies}</span>
                            <span className="text-xs font-medium text-purple-600/80 dark:text-purple-400/80">
                                ({replyRate}%)
                            </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1">
                            Inbound replies since launch
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Funnel & Failure Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Delivery Funnel + Cost */}
                <Card className="lg:col-span-7 shadow-none">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Delivery &amp; Engagement Funnel</CardTitle>
                        <CardDescription className="text-xs">
                            How your {metrics.total_selected} selected contacts progressed from dispatch to read and reply.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-3">
                            {funnelStages.map((stage) => (
                                <div key={stage.label} className="space-y-1">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-medium text-foreground">{stage.label}</span>
                                        <span className="text-muted-foreground">
                                            <strong className="text-foreground font-semibold">{stage.count}</strong>{' '}
                                            <span className="text-[11px]">({stage.hint})</span>
                                        </span>
                                    </div>
                                    <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all ${stage.barClass}`}
                                            style={{ width: `${Math.max(stage.count > 0 ? 2 : 0, Math.min(100, stage.pct))}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Secondary Cost & Status Strip */}
                        <div className="grid grid-cols-3 gap-3 pt-3 border-t border-border">
                            <div className="p-3 rounded-lg bg-muted/40 border border-border/60">
                                <div className="text-[11px] text-muted-foreground">Queued / Pending</div>
                                <div className="text-base font-bold text-foreground mt-0.5">{metrics.queued}</div>
                            </div>
                            <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                                <div className="text-[11px] text-muted-foreground">Failed Messages</div>
                                <div className="text-base font-bold text-destructive mt-0.5">
                                    {metrics.failed}{' '}
                                    <span className="text-[11px] font-normal">({failRate}%)</span>
                                </div>
                            </div>
                            <div className="p-3 rounded-lg bg-muted/40 border border-border/60">
                                <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                                    <IndianRupee className="size-3" />
                                    Campaign Cost
                                </div>
                                <div className="text-base font-bold text-foreground mt-0.5">{campaign.cost_formatted}</div>
                                <div className="text-[10px] text-muted-foreground">{costPerDelivered} / delivered</div>
                            </div>
                        </div>

                        <div className="flex items-start gap-2 rounded-lg bg-muted/40 p-2.5 text-[11px] text-muted-foreground">
                            <Info className="size-3.5 mt-0.5 shrink-0 text-primary" />
                            <span>
                                <strong>Sent (✓):</strong> Accepted by WhatsApp servers.{' '}
                                <strong>Delivered (✓✓):</strong> Received on recipient&apos;s phone.{' '}
                                <strong>Read (✓✓):</strong> Opened by recipient (requires read receipts enabled).
                            </span>
                        </div>
                    </CardContent>
                </Card>

                {/* Failure Reasons Explained */}
                <Card className="lg:col-span-5 shadow-none flex flex-col">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <AlertCircle className={`size-4 ${metrics.failed > 0 ? 'text-destructive' : 'text-emerald-500'}`} />
                            Why Messages Failed ({metrics.failed})
                        </CardTitle>
                        <CardDescription className="text-xs">
                            Plain-English breakdown of Meta delivery errors and recommended next steps.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-3">
                        {metrics.failure_reasons && metrics.failure_reasons.length > 0 ? (
                            <div className="space-y-2.5">
                                {metrics.failure_reasons.map((fr, idx) => {
                                    const info = explainMetaError(fr.error);
                                    return (
                                        <div
                                            key={idx}
                                            className="p-3 rounded-xl border border-destructive/20 bg-destructive/5 space-y-1.5"
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-xs font-semibold text-destructive">
                                                    {info.code ? `Meta #${info.code} · ` : ''}
                                                    {info.title}
                                                </span>
                                                <Badge variant="outline" className="border-destructive/30 text-destructive text-[11px] shrink-0">
                                                    {fr.count} {fr.count === 1 ? 'msg' : 'msgs'}
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-foreground/90 leading-relaxed">{info.explanation}</p>
                                            <p className="text-[11px] text-muted-foreground">
                                                <strong className="text-foreground">Tip:</strong> {info.action}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="h-full min-h-[180px] flex flex-col items-center justify-center text-center p-6 rounded-xl border border-dashed border-emerald-500/30 bg-emerald-500/5">
                                <CheckCircle2 className="size-8 text-emerald-500 mb-2" />
                                <div className="text-sm font-semibold text-foreground">No Delivery Failures</div>
                                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                                    Every attempted message in this campaign was accepted without any Meta delivery errors.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Searchable & Filterable Recipients Table */}
            <Card className="shadow-none">
                <CardHeader className="pb-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <CardTitle className="text-base">Recipients Delivery Log</CardTitle>
                            <CardDescription className="text-xs">
                                Showing {recipients.from ?? 0}–{recipients.to ?? 0} of {recipients.total} matching recipients.
                            </CardDescription>
                        </div>

                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                applyFilters(searchInput, filters.status);
                            }}
                            className="flex items-center gap-2 w-full sm:w-auto"
                        >
                            <div className="relative flex-1 sm:w-64">
                                <Search className="size-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
                                <Input
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    placeholder="Search phone, name, or error..."
                                    className="h-8 pl-8 pr-7 text-xs"
                                />
                                {searchInput && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearchInput('');
                                            applyFilters('', filters.status);
                                        }}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        title="Clear search"
                                    >
                                        <X className="size-3.5" />
                                    </button>
                                )}
                            </div>
                            <Button type="submit" size="sm" variant="secondary" className="h-8 text-xs">
                                Search
                            </Button>
                        </form>
                    </div>

                    {/* Status Filter Pills */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-2">
                        {statusTabs.map((tab) => {
                            const active = (filters.status || '') === tab.key;
                            return (
                                <button
                                    key={tab.key || 'all'}
                                    type="button"
                                    onClick={() => applyFilters(searchInput, tab.key)}
                                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors cursor-pointer ${
                                        active
                                            ? 'bg-primary text-primary-foreground border-primary'
                                            : 'bg-background text-muted-foreground border-border hover:text-foreground hover:bg-muted/60'
                                    }`}
                                >
                                    {tab.label} ({tab.count})
                                </button>
                            );
                        })}
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    <div className="overflow-x-auto border-t border-border">
                        <table className="w-full min-w-[650px] text-left border-collapse">
                            <thead>
                                <tr className="bg-muted/40 border-b border-border text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                    <th className="py-2.5 px-4">Recipient</th>
                                    <th className="py-2.5 px-4">Status</th>
                                    <th className="py-2.5 px-4">Details / Failure Reason</th>
                                    <th className="py-2.5 px-4 text-right">Last Updated</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/70 text-xs">
                                {recipients.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="py-10 text-center text-muted-foreground">
                                            No recipients match your current filter.
                                        </td>
                                    </tr>
                                ) : (
                                    recipients.data.map((r) => {
                                        const errInfo = r.error ? explainMetaError(r.error) : null;
                                        return (
                                            <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                                                <td className="py-2.5 px-4">
                                                    <div className="font-mono font-medium text-foreground">{r.phone}</div>
                                                    {r.name && (
                                                        <div className="text-[11px] text-muted-foreground">{r.name}</div>
                                                    )}
                                                </td>
                                                <td className="py-2.5 px-4 whitespace-nowrap">
                                                    <StatusBadge status={r.status} />
                                                </td>
                                                <td className="py-2.5 px-4 max-w-md">
                                                    {r.status === 'failed' && errInfo ? (
                                                        <div className="space-y-0.5">
                                                            <div className="text-destructive font-medium">
                                                                {errInfo.code ? `#${errInfo.code}: ` : ''}
                                                                {errInfo.title}
                                                            </div>
                                                            <div className="text-[11px] text-muted-foreground line-clamp-2">
                                                                {errInfo.explanation}
                                                            </div>
                                                        </div>
                                                    ) : r.status === 'read' ? (
                                                        <span className="text-muted-foreground">Opened on recipient&apos;s WhatsApp</span>
                                                    ) : r.status === 'delivered' ? (
                                                        <span className="text-muted-foreground">Delivered to device, not yet opened</span>
                                                    ) : r.status === 'sent' ? (
                                                        <span className="text-muted-foreground">Sent to WhatsApp, awaiting delivery receipt</span>
                                                    ) : r.status === 'cancelled' ? (
                                                        <span className="text-muted-foreground">Cancelled before sending (refunded)</span>
                                                    ) : (
                                                        <span className="text-muted-foreground">Waiting in send queue</span>
                                                    )}
                                                </td>
                                                <td className="py-2.5 px-4 text-right text-[11px] text-muted-foreground font-mono whitespace-nowrap">
                                                    {r.updated_at ?? '—'}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {recipients.last_page > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-border text-xs text-muted-foreground">
                            <span>
                                Page {recipients.current_page} of {recipients.last_page}
                            </span>
                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    disabled={!recipients.prev_page_url}
                                    onClick={() =>
                                        recipients.prev_page_url &&
                                        router.get(recipients.prev_page_url, {}, { preserveState: true, preserveScroll: true })
                                    }
                                    className="h-7 text-xs"
                                >
                                    Previous
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    disabled={!recipients.next_page_url}
                                    onClick={() =>
                                        recipients.next_page_url &&
                                        router.get(recipients.next_page_url, {}, { preserveState: true, preserveScroll: true })
                                    }
                                    className="h-7 text-xs"
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Delete Campaign Confirmation Modal Dialog */}
            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
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

                    <div className="space-y-3">
                        <div className="rounded-lg bg-muted/60 border border-border/80 p-3 text-xs space-y-1.5">
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground font-medium">Campaign:</span>
                                <span className="font-semibold text-foreground truncate max-w-[220px]">
                                    {campaign.name}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground font-medium">Template:</span>
                                <span className="font-mono text-foreground">
                                    {campaign.template_name} ({campaign.template_language})
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground font-medium">Recipients & Status:</span>
                                <span className="font-medium text-foreground capitalize">
                                    {metrics.total_selected} contacts · {campaign.status}
                                </span>
                            </div>
                            {campaign.cost_formatted && (
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground font-medium">Cost:</span>
                                    <span className="font-semibold text-foreground">
                                        {campaign.cost_formatted}
                                    </span>
                                </div>
                            )}
                        </div>

                        {['queued', 'scheduled', 'processing', 'paused'].includes(campaign.status) && (
                            <div className="rounded-md bg-emerald-500/10 border border-emerald-500/20 p-2.5 text-xs text-emerald-700 dark:text-emerald-400 flex items-start gap-2">
                                <CheckCheck className="size-4 shrink-0 mt-0.5 text-emerald-600" />
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
                                onClick={() => setIsDeleteModalOpen(false)}
                                disabled={isDeleting}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={confirmDelete}
                                disabled={isDeleting}
                                className="gap-1.5"
                            >
                                <Trash2 className="size-3.5" />
                                <span>{isDeleting ? 'Deleting...' : 'Yes, Delete Campaign'}</span>
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
