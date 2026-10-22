import { Head, Link } from '@inertiajs/react';
import {
    Send,
    Plus,
    Search,
    CheckCircle2,
    Clock,
    AlertCircle,
    ArrowLeft,
    Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';

export default function CampaignsList() {
    const [templates] = useState([
        {
            id: '1',
            name: 'course_admission_reminder',
            category: 'MARKETING',
            status: 'APPROVED',
            language: 'en',
            costEstimate: '₹0.78 / msg',
            body: 'Hello {{1}}, batch admissions for {{2}} close in 48 hours. Reply YES to confirm your seat!',
        },
        {
            id: '2',
            name: 'fee_payment_receipt',
            category: 'UTILITY',
            status: 'APPROVED',
            language: 'en',
            costEstimate: '₹0.11 / msg',
            body: 'Dear {{1}}, thank you for your payment of {{2}}. Your transaction ID is {{3}}.',
        },
        {
            id: '3',
            name: 'appointment_confirmation',
            category: 'UTILITY',
            status: 'APPROVED',
            language: 'en',
            costEstimate: '₹0.11 / msg',
            body: 'Hello {{1}}, your appointment at Apex Clinic is confirmed for {{2}} at {{3}}.',
        },
    ]);

    return (
        <>
            <Head title="WhatsApp Campaigns & Meta Templates" />

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
                            <Send className="size-6 text-emerald-600" />
                            Campaigns & Meta Template Manager
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Sync approved WhatsApp templates directly from Meta Graph API. Broadcast to opted-in contact lists with pacing protection.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 h-9 text-xs">
                            <Plus className="size-3.5" />
                            New Campaign
                        </Button>
                    </div>
                </div>

                {/* Templates List */}
                <div className="grid gap-4 md:grid-cols-3">
                    {templates.map((tpl) => (
                        <Card key={tpl.id} className="border-sidebar-border/70 flex flex-col justify-between">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <Badge variant="outline" className="text-[10px] font-mono">
                                        {tpl.category}
                                    </Badge>
                                    <Badge className="bg-emerald-600 text-white text-[10px] hover:bg-emerald-600">
                                        {tpl.status}
                                    </Badge>
                                </div>
                                <CardTitle className="text-sm font-bold font-mono mt-2 truncate">
                                    {tpl.name}
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Meta Cost Estimate: <strong className="text-foreground">{tpl.costEstimate}</strong>
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="rounded-md bg-muted/40 p-3 text-xs text-muted-foreground leading-relaxed border border-sidebar-border/50">
                                    {tpl.body}
                                </div>
                                <Button variant="outline" size="sm" className="w-full text-xs h-8">
                                    Broadcast This Template
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </>
    );
}
