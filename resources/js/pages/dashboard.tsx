import { Head, Link, usePage } from '@inertiajs/react';
import {
    MessageSquare,
    Users,
    Bot,
    Send,
    ArrowUpRight,
    CheckCircle2,
    Clock,
    Zap,
    ShieldCheck,
    Smartphone,
    ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { dashboard } from '@/routes';

export default function Dashboard() {
    const { auth, tenant } = usePage().props;
    const currentOrg = tenant?.current;

    return (
        <>
            <Head title="WhatsApp SaaS Dashboard" />

            <div className="flex flex-1 flex-col gap-6 p-6">
                {/* 1. Header Greeting & Organization Context */}
                <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            {currentOrg?.name ?? 'Sathwara InfoTech'} Overview
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Welcome back, {auth.user?.name}. Here is your live WhatsApp messaging activity and bot performance.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="gap-1.5 border-emerald-500/30 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                            <span className="size-2 rounded-full bg-emerald-500"></span>
                            {currentOrg?.role ?? 'Owner'} Account
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                            Timezone: {currentOrg?.timezone ?? 'Asia/Kolkata'}
                        </Badge>
                    </div>
                </div>

                {/* 2. WhatsApp Onboarding / Connection Card */}
                <div className="relative overflow-hidden rounded-xl border border-emerald-500/20 bg-gradient-to-r from-emerald-900/10 via-emerald-800/5 to-transparent p-6 shadow-xs">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-start gap-4">
                            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md">
                                <Smartphone className="size-6" />
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <h2 className="text-base font-semibold text-foreground">
                                        Connect Your WhatsApp Business Number
                                    </h2>
                                    <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                        Action Required
                                    </span>
                                </div>
                                <p className="text-sm text-muted-foreground max-w-2xl">
                                    Link your WhatsApp Business Account (WABA) using <strong>Meta Embedded Signup v4</strong>. 
                                    Meta will bill your messages directly at official rates, while Sathwara manages your automated bots and live team inbox.
                                </p>
                            </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-3">
                            <Button asChild className="bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm gap-2">
                                <Link href="/whatsapp/connect">
                                    <MessageSquare className="size-4" />
                                    Connect WhatsApp
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* 3. 4 Key Performance Metrics */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="border-sidebar-border/70">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                Active Chats (24h)
                            </CardTitle>
                            <Clock className="size-4 text-emerald-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">0</div>
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                <span className="inline-block size-1.5 rounded-full bg-emerald-500"></span>
                                Free-form replies within window
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-sidebar-border/70">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                Inbound Messages
                            </CardTitle>
                            <MessageSquare className="size-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">0</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Customer messages received today
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-sidebar-border/70">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                Bot Auto-Replies
                            </CardTitle>
                            <Bot className="size-4 text-purple-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">0</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Handled 100% by rules & menus
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-sidebar-border/70">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                Resolution Rate
                            </CardTitle>
                            <Zap className="size-4 text-amber-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">100%</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                0 escalated to human agents
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* 4. Quick Setup Actions */}
                <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                        Bot Starter Quick Actions
                    </h3>
                    <div className="grid gap-4 md:grid-cols-3">
                        <Link href="/bot" className="group rounded-xl border border-sidebar-border/70 p-5 bg-card hover:border-emerald-500/40 hover:shadow-xs transition-all block">
                            <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 mb-3">
                                <Bot className="size-5" />
                            </div>
                            <h4 className="font-semibold text-foreground text-sm flex items-center justify-between">
                                Configure Welcome Greeting
                                <ArrowUpRight className="size-4 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-600" />
                            </h4>
                            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                                Set up an instant auto-reply with buttons (Courses, Fees, Talk to Us) for customers messaging for the first time.
                            </p>
                        </Link>

                        <Link href="/contacts" className="group rounded-xl border border-sidebar-border/70 p-5 bg-card hover:border-emerald-500/40 hover:shadow-xs transition-all block">
                            <div className="flex size-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 mb-3">
                                <Users className="size-5" />
                            </div>
                            <h4 className="font-semibold text-foreground text-sm flex items-center justify-between">
                                Contacts & Suppression
                                <ArrowUpRight className="size-4 opacity-0 group-hover:opacity-100 transition-opacity text-blue-600" />
                            </h4>
                            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                                Import leads from CSV, tag prospects, and ensure DPDP / Meta opt-out compliance before running broadcasts.
                            </p>
                        </Link>

                        <Link href="/campaigns" className="group rounded-xl border border-sidebar-border/70 p-5 bg-card hover:border-emerald-500/40 hover:shadow-xs transition-all block">
                            <div className="flex size-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 mb-3">
                                <Send className="size-5" />
                            </div>
                            <h4 className="font-semibold text-foreground text-sm flex items-center justify-between">
                                Meta Template Manager
                                <ArrowUpRight className="size-4 opacity-0 group-hover:opacity-100 transition-opacity text-purple-600" />
                            </h4>
                            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                                Sync your utility & marketing templates approved by Meta to re-open conversations outside the 24h window.
                            </p>
                        </Link>
                    </div>
                </div>

                {/* 5. Recent Conversations Table */}
                <Card className="border-sidebar-border/70">
                    <CardHeader className="flex flex-row items-center justify-between border-b border-sidebar-border/50 pb-4">
                        <div>
                            <CardTitle className="text-base font-semibold">Recent WhatsApp Inbound Chats</CardTitle>
                            <CardDescription className="text-xs">
                                Live incoming messages from your WhatsApp Business number.
                            </CardDescription>
                        </div>
                        <Button variant="outline" size="sm" className="h-8 text-xs" asChild>
                            <Link href="/inbox">
                                View Team Inbox
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent className="p-8 text-center">
                        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted/60 text-muted-foreground mb-3">
                            <MessageSquare className="size-6" />
                        </div>
                        <h4 className="text-sm font-semibold text-foreground">No WhatsApp messages yet</h4>
                        <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                            Once your number is connected via Meta Embedded Signup v4, messages from customers will stream into your inbox in real time.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
