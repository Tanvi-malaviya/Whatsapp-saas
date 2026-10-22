import { Head, Link } from '@inertiajs/react';
import {
    BarChart3,
    Clock,
    ArrowLeft,
    TrendingUp,
    MessageSquare,
    Bot,
    Zap,
    Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function ReportsIndex() {
    return (
        <>
            <Head title="WhatsApp Analytics & Reports" />

            <div className="flex flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Button variant="ghost" size="sm" asChild className="h-7 text-xs text-muted-foreground p-0">
                                <Link href="/dashboard">
                                    <ArrowLeft className="size-3.5 mr-1" />
                                    Dashboard
                                </Link>
                            </Button>
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            <BarChart3 className="size-6 text-emerald-600" />
                            WhatsApp Analytics & Performance Reports
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Pre-computed metrics calculated in Indian Standard Time (IST / Asia/Kolkata).
                        </p>
                    </div>

                    <Badge variant="outline" className="text-xs">
                        Report Period: Today (IST)
                    </Badge>
                </div>

                {/* 4 Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="border-sidebar-border/70">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-medium uppercase text-muted-foreground">
                                Total Conversations
                            </CardTitle>
                            <MessageSquare className="size-4 text-emerald-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">48</div>
                            <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                                <TrendingUp className="size-3" /> +12% from yesterday
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-sidebar-border/70">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-medium uppercase text-muted-foreground">
                                Bot Resolution Rate
                            </CardTitle>
                            <Bot className="size-4 text-purple-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">94.2%</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                45 of 48 answered by bot rules
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-sidebar-border/70">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-medium uppercase text-muted-foreground">
                                Avg. First Response
                            </CardTitle>
                            <Clock className="size-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">&lt; 2s</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Instant automated reply
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-sidebar-border/70">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-medium uppercase text-muted-foreground">
                                Estimated Meta Cost
                            </CardTitle>
                            <Zap className="size-4 text-amber-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">₹0.00</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Within 1,000 free monthly tier
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}
