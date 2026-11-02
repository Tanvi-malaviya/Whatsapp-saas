import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    Activity,
    Webhook,
    ShieldAlert,
    Copy,
    Check,
    RefreshCw,
    Trash2,
    Eye,
    Filter,
    CheckCircle2,
    XCircle,
    Clock,
    Terminal,
    Sparkles,
    User,
    Globe,
    FileCode,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface WebhookItem {
    id: number;
    provider: string;
    event_id: string;
    status: string;
    error: string | null;
    payload: any;
    created_at: string;
    time_ago: string;
}

interface AuditLogItem {
    id: number;
    user_name: string;
    user_email: string;
    action: string;
    entity_type: string;
    entity_id: string | null;
    diff: any;
    ip_address: string;
    created_at: string;
    time_ago: string;
}

interface SystemLogsProps {
    webhooks: WebhookItem[];
    auditLogs: AuditLogItem[];
    currentFilter: string;
}

export default function SystemLogsPage({
    webhooks = [],
    auditLogs = [],
    currentFilter = 'all',
}: SystemLogsProps) {
    const [selectedPayload, setSelectedPayload] = useState<any>(null);
    const [isPayloadOpen, setIsPayloadOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    // Selected Audit Diff
    const [selectedAudit, setSelectedAudit] = useState<AuditLogItem | null>(null);
    const [isAuditOpen, setIsAuditOpen] = useState(false);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleFilterChange = (filter: string) => {
        router.get('/insights/system-logs', { status: filter }, { preserveScroll: true, preserveState: true });
    };

    const handleSimulateWebhook = () => {
        router.post('/insights/system-logs/simulate-webhook', {}, { preserveScroll: true });
    };

    const handleClearLogs = () => {
        if (!confirm('Are you sure you want to clear all webhook inbox logs?')) return;
        router.post('/insights/system-logs/clear', {}, { preserveScroll: true });
    };

    return (
        <>
            <Head title="System & Webhook Logs | Sathwara InfoTech" />

            <div className="flex flex-1 flex-col gap-4 p-4 sm:p-6 max-w-7xl mx-auto w-full font-sans">
                {/* Header Banner */}
                <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-background to-card p-4 sm:p-6 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-600 to-blue-600 text-white shadow-md">
                                <Terminal className="size-6" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                                        System &amp; Webhook Logs
                                    </h1>
                                    <Badge variant="outline" className="text-xs font-bold border-cyan-500/40 text-cyan-600 dark:text-cyan-400">
                                        Audit Inspector
                                    </Badge>
                                </div>
                                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                                    Inspect incoming Meta WhatsApp Cloud API webhooks, diagnose payloads, and track workspace audit logs.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleSimulateWebhook}
                                className="h-9 px-3 text-xs font-semibold gap-1.5 border-border shadow-2xs hover:bg-muted"
                            >
                                <Sparkles className="size-3.5 text-cyan-600" />
                                Simulate Inbound Webhook
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleClearLogs}
                                className="h-9 px-3 text-xs font-semibold gap-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 border-border"
                            >
                                <Trash2 className="size-3.5" />
                                Clear Webhooks
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="webhooks" className="w-full">
                    <TabsList className="grid grid-cols-2 w-full max-w-md h-10 p-1 bg-muted/60 border border-border/60">
                        <TabsTrigger value="webhooks" className="text-xs font-semibold gap-1.5">
                            <Webhook className="size-3.5" />
                            Meta Webhook Inbox ({webhooks.length})
                        </TabsTrigger>
                        <TabsTrigger value="audit" className="text-xs font-semibold gap-1.5">
                            <ShieldAlert className="size-3.5" />
                            Security Audit Trail ({auditLogs.length})
                        </TabsTrigger>
                    </TabsList>

                    {/* TAB 1: WEBHOOK INBOX */}
                    <TabsContent value="webhooks" className="space-y-4 mt-4">
                        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-2xs">
                            {/* Filter Bar */}
                            <div className="p-3.5 border-b border-border/60 bg-muted/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-foreground">Filter by Status:</span>
                                    {['all', 'processed', 'failed', 'pending'].map((st) => (
                                        <button
                                            key={st}
                                            onClick={() => handleFilterChange(st)}
                                            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all capitalize ${
                                                currentFilter === st
                                                    ? 'bg-primary text-primary-foreground shadow-xs'
                                                    : 'bg-muted/70 text-muted-foreground hover:bg-muted'
                                            }`}
                                        >
                                            {st}
                                        </button>
                                    ))}
                                </div>

                                <div className="text-[11px] text-muted-foreground font-medium">
                                    Showing latest 50 webhook events
                                </div>
                            </div>

                            {/* Webhooks Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs text-left">
                                    <thead className="bg-muted/40 text-muted-foreground uppercase text-[10px] font-bold tracking-wider border-b border-border/60">
                                        <tr>
                                            <th className="px-4 py-3">Event ID</th>
                                            <th className="px-4 py-3">Provider</th>
                                            <th className="px-4 py-3">Status</th>
                                            <th className="px-4 py-3">Event Type / Details</th>
                                            <th className="px-4 py-3">Timestamp</th>
                                            <th className="px-4 py-3 text-right">Raw Payload</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/50">
                                        {webhooks.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                                                    No webhook events received yet. Click "Simulate Inbound Webhook" to test!
                                                </td>
                                            </tr>
                                        ) : (
                                            webhooks.map((w) => {
                                                const isSuccess = w.status === 'processed';
                                                const isFailed = w.status === 'failed';
                                                const firstChange = w.payload?.entry?.[0]?.changes?.[0]?.field || 'messages';

                                                return (
                                                    <tr key={w.id} className="hover:bg-muted/30 transition-colors">
                                                        <td className="px-4 py-3 font-mono font-bold text-foreground">
                                                            {w.event_id}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <Badge variant="outline" className="text-[10px] font-semibold border-cyan-500/30 text-cyan-700 dark:text-cyan-300">
                                                                {w.provider}
                                                            </Badge>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            {isSuccess ? (
                                                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                                                    <CheckCircle2 className="size-3" />
                                                                    Processed
                                                                </span>
                                                            ) : isFailed ? (
                                                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-500/10 px-2 py-0.5 rounded-full">
                                                                    <XCircle className="size-3" />
                                                                    Failed
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full">
                                                                    <Clock className="size-3" />
                                                                    Pending
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="text-[11px] font-semibold text-foreground">
                                                                    whatsapp_business_account
                                                                </span>
                                                                <Badge variant="secondary" className="text-[9px] uppercase px-1 py-0">
                                                                    {firstChange}
                                                                </Badge>
                                                            </div>
                                                            {w.error && (
                                                                <p className="text-[10px] text-rose-600 mt-0.5 font-mono line-clamp-1">
                                                                    {w.error}
                                                                </p>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <p className="text-[11px] font-medium text-foreground">
                                                                {w.time_ago}
                                                            </p>
                                                            <p className="text-[10px] text-muted-foreground font-mono">
                                                                {w.created_at}
                                                            </p>
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setSelectedPayload(w.payload);
                                                                    setIsPayloadOpen(true);
                                                                }}
                                                                className="h-7 px-2.5 text-xs font-semibold gap-1 border-border shadow-2xs hover:bg-muted"
                                                            >
                                                                <Eye className="size-3" />
                                                                JSON
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </TabsContent>

                    {/* TAB 2: AUDIT TRAIL */}
                    <TabsContent value="audit" className="space-y-4 mt-4">
                        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-2xs">
                            <div className="p-4 border-b border-border/60 bg-muted/20">
                                <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                                    <ShieldAlert className="size-4 text-primary" />
                                    Security &amp; Action Audit Trail
                                </h2>
                                <p className="text-xs text-muted-foreground">
                                    Chronological log of admin actions, stage transitions, member invites, and plan updates.
                                </p>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-xs text-left">
                                    <thead className="bg-muted/40 text-muted-foreground uppercase text-[10px] font-bold tracking-wider border-b border-border/60">
                                        <tr>
                                            <th className="px-4 py-3">Action</th>
                                            <th className="px-4 py-3">Performed By</th>
                                            <th className="px-4 py-3">Entity</th>
                                            <th className="px-4 py-3">IP Address</th>
                                            <th className="px-4 py-3">Timestamp</th>
                                            <th className="px-4 py-3 text-right">Details</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/50">
                                        {auditLogs.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                                                    No audit log events recorded yet.
                                                </td>
                                            </tr>
                                        ) : (
                                            auditLogs.map((a) => (
                                                <tr key={a.id} className="hover:bg-muted/30 transition-colors">
                                                    <td className="px-4 py-3 font-semibold text-foreground">
                                                        <span className="font-mono text-[11px] bg-muted px-1.5 py-0.5 rounded text-foreground">
                                                            {a.action}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-1.5">
                                                            <div className="size-5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[9px]">
                                                                {a.user_name[0] || 'U'}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-foreground text-[11px]">
                                                                    {a.user_name}
                                                                </p>
                                                                <p className="text-muted-foreground text-[10px]">
                                                                    {a.user_email}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <Badge variant="outline" className="text-[10px] font-semibold">
                                                            {a.entity_type} {a.entity_id ? `#${a.entity_id}` : ''}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">
                                                        <div className="flex items-center gap-1">
                                                            <Globe className="size-3 text-muted-foreground" />
                                                            {a.ip_address}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <p className="text-[11px] font-medium text-foreground">
                                                            {a.time_ago}
                                                        </p>
                                                        <p className="text-[10px] text-muted-foreground font-mono">
                                                            {a.created_at}
                                                        </p>
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        {a.diff ? (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setSelectedAudit(a);
                                                                    setIsAuditOpen(true);
                                                                }}
                                                                className="h-7 px-2.5 text-xs font-semibold gap-1 border-border shadow-2xs hover:bg-muted"
                                                            >
                                                                <FileCode className="size-3" />
                                                                Diff
                                                            </Button>
                                                        ) : (
                                                            <span className="text-muted-foreground text-[11px]">—</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>

                {/* Dialog: Raw Webhook JSON Payload */}
                <Dialog open={isPayloadOpen} onOpenChange={setIsPayloadOpen}>
                    <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
                        <DialogHeader>
                            <DialogTitle className="text-base font-bold flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <Webhook className="size-4 text-cyan-600" />
                                    Meta Cloud Webhook Payload
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => copyToClipboard(JSON.stringify(selectedPayload, null, 2))}
                                    className="h-7 text-xs font-semibold gap-1 mr-6"
                                >
                                    {copied ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
                                    {copied ? 'Copied' : 'Copy JSON'}
                                </Button>
                            </DialogTitle>
                            <DialogDescription className="text-xs">
                                Exact inbound JSON dispatched by Meta Cloud API webhook endpoint.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex-1 overflow-auto rounded-lg bg-slate-950 p-4 border border-slate-800 text-slate-100 font-mono text-xs [scrollbar-width:thin]">
                            <pre className="whitespace-pre-wrap break-all">
                                {selectedPayload ? JSON.stringify(selectedPayload, null, 2) : 'No payload'}
                            </pre>
                        </div>

                        <DialogFooter className="pt-2">
                            <Button size="sm" onClick={() => setIsPayloadOpen(false)}>
                                Close
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Dialog: Audit Log Diff */}
                <Dialog open={isAuditOpen} onOpenChange={setIsAuditOpen}>
                    <DialogContent className="sm:max-w-xl max-h-[80vh] flex flex-col">
                        <DialogHeader>
                            <DialogTitle className="text-base font-bold flex items-center gap-2">
                                <ShieldAlert className="size-4 text-primary" />
                                Audit Diff: {selectedAudit?.action}
                            </DialogTitle>
                            <DialogDescription className="text-xs">
                                Performed by {selectedAudit?.user_name} on {selectedAudit?.created_at}.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex-1 overflow-auto rounded-lg bg-slate-950 p-4 border border-slate-800 text-slate-100 font-mono text-xs">
                            <pre className="whitespace-pre-wrap">
                                {selectedAudit?.diff ? JSON.stringify(selectedAudit.diff, null, 2) : 'No diff'}
                            </pre>
                        </div>

                        <DialogFooter className="pt-2">
                            <Button size="sm" onClick={() => setIsAuditOpen(false)}>
                                Close
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}
