import { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import {
    GitBranch,
    Plus,
    Play,
    CheckCircle2,
    Clock,
    MoreVertical,
    Sparkles,
    Trash2,
    Edit3,
    ArrowRight,
    MessageSquare,
    Layers,
    Sliders,
    CornerDownRight,
    Send,
    Bot,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

type FlowItem = {
    id: string;
    title: string;
    description: string;
    trigger: string;
    stepsCount: number;
    executions: number;
    completionRate: string;
    status: 'active' | 'draft';
    updatedAt: string;
};

export default function BotFlows() {
    const [flows, setFlows] = useState<FlowItem[]>([
        {
            id: '1',
            title: 'Lead Qualification Flow',
            description: 'Greets inbound prospects, captures requirement, budget, and notifies sales agent.',
            trigger: 'Keyword: "hi, hello, info, inquiry"',
            stepsCount: 5,
            executions: 1420,
            completionRate: '88.4%',
            status: 'active',
            updatedAt: '2 hours ago',
        },
        {
            id: '2',
            title: 'WhatsApp Automation Course Inquiry',
            description: 'Explains syllabus, fee structure (₹2,999), and collects student registration details.',
            trigger: 'Keyword: "course, classes, admission"',
            stepsCount: 4,
            executions: 680,
            completionRate: '92.1%',
            status: 'active',
            updatedAt: 'Yesterday',
        },
        {
            id: '3',
            title: 'Customer Support & Human Handoff',
            description: 'Resolves FAQs automatically or transfers chat to live agent on request.',
            trigger: 'Keyword: "help, support, agent, complaint"',
            stepsCount: 3,
            executions: 310,
            completionRate: '79.5%',
            status: 'active',
            updatedAt: '3 days ago',
        },
        {
            id: '4',
            title: 'Post-Purchase Welcome & Onboarding',
            description: 'Sends onboarding links, login credentials, and satisfaction survey.',
            trigger: 'Event: "Webhook - Order Created"',
            stepsCount: 6,
            executions: 195,
            completionRate: '95.0%',
            status: 'draft',
            updatedAt: 'Last week',
        },
    ]);

    const [selectedFlow, setSelectedFlow] = useState<FlowItem>(flows[0]);
    const [previewText, setPreviewText] = useState('');
    const [previewChat, setPreviewChat] = useState<{ sender: 'user' | 'bot'; text: string }[]>([
        { sender: 'user', text: 'Hi, I need info about WhatsApp SaaS' },
        { sender: 'bot', text: '👋 Welcome to Sathwara InfoTech! Please choose what best describes your need:\n\n1️⃣ Connect WhatsApp Number\n2️⃣ Bulk Broadcast Campaign\n3️⃣ Chatbot & AI Automation\n\nReply with 1, 2, or 3.' },
    ]);

    const handleSendPreview = (e: React.FormEvent) => {
        e.preventDefault();
        if (!previewText.trim()) return;
        const userMsg = previewText.trim();
        const updated = [...previewChat, { sender: 'user' as const, text: userMsg }];
        setPreviewChat(updated);
        setPreviewText('');

        setTimeout(() => {
            let botReply = 'Thank you! Pausing automation and notifying our expert team at Sathwara InfoTech.';
            if (userMsg.includes('1')) {
                botReply = '✅ Excellent! With our 1-Click Meta signup, you can connect your WhatsApp number in under 2 minutes. Would you like a setup link?';
            } else if (userMsg.includes('2')) {
                botReply = '🚀 Broadcasts allow sending 10,000+ messages/day with 98% open rates! What is your typical contact audience size?';
            } else if (userMsg.includes('3')) {
                botReply = '🤖 Our Bot Builder handles 24/7 automated FAQs, keyword matching, and human handoff seamlessly!';
            }
            setPreviewChat([...updated, { sender: 'bot' as const, text: botReply }]);
        }, 500);
    };

    return (
        <>
            <Head title="WhatsApp Bot Flows - Sathwara InfoTech" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                                <GitBranch className="size-5 text-[#47b672]" />
                                WhatsApp Bot Flows
                            </h2>
                            <Badge variant="outline" className="text-xs bg-[#47b672]/10 text-[#28804c] dark:text-[#52c480] border-[#47b672]/30">
                                Visual Tree Builder
                            </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Build multi-step interactive conversation flows with buttons, lists, and smart conditional branches.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button size="sm" className="bg-[#47b672] hover:bg-[#3ca062] text-white text-xs">
                            <Plus className="size-3.5 mr-1.5" />
                            Create New Flow
                        </Button>
                    </div>
                </div>

                {/* 2-Column Layout: Flow Cards & Interactive Canvas */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left: Flows List */}
                    <div className="lg:col-span-5 space-y-3">
                        <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground px-1">
                            <span>AVAILABLE FLOWS ({flows.length})</span>
                            <span className="text-[11px] text-[#28804c] dark:text-[#52c480]">3 Active</span>
                        </div>

                        {flows.map((flow) => {
                            const isSelected = selectedFlow.id === flow.id;
                            return (
                                <Card
                                    key={flow.id}
                                    onClick={() => setSelectedFlow(flow)}
                                    className={`cursor-pointer transition-all border shadow-2xs ${
                                        isSelected
                                            ? 'border-[#47b672] ring-1 ring-[#47b672]/30 bg-card'
                                            : 'border-border hover:border-[#47b672]/50 hover:bg-muted/30'
                                    }`}
                                >
                                    <CardContent className="p-4 space-y-2.5">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="space-y-1">
                                                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                                    {flow.title}
                                                    {flow.status === 'active' ? (
                                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                                                            Active
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground border border-border">
                                                            Draft
                                                        </span>
                                                    )}
                                                </h3>
                                                <p className="text-xs text-muted-foreground line-clamp-2">
                                                    {flow.description}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="rounded bg-muted/40 px-2 py-1 text-[11px] font-mono text-muted-foreground">
                                            {flow.trigger}
                                        </div>

                                        <div className="flex items-center justify-between pt-1 text-[11px] text-muted-foreground border-t border-border/60">
                                            <span>{flow.stepsCount} Nodes</span>
                                            <span>{flow.executions.toLocaleString()} triggered</span>
                                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                                {flow.completionRate} completed
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                    {/* Right: Visual Step Canvas & Simulator */}
                    <div className="lg:col-span-7 space-y-4">
                        <Card className="border-border shadow-2xs">
                            <CardHeader className="pb-3 border-b border-border/80">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                            <Sliders className="size-4 text-[#47b672]" />
                                            Flow Canvas: {selectedFlow.title}
                                        </CardTitle>
                                        <CardDescription className="text-xs">
                                            Interactive node pipeline executed when trigger conditions match.
                                        </CardDescription>
                                    </div>
                                    <Badge variant="outline" className="text-xs border-[#47b672]/30 text-[#28804c] dark:text-[#52c480]">
                                        Ready for Production
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 space-y-3">
                                {/* Node 1: Trigger */}
                                <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 space-y-1">
                                    <div className="flex items-center justify-between text-xs font-semibold text-amber-600">
                                        <span className="flex items-center gap-1.5">
                                            <Bot className="size-3.5" />
                                            STEP 1: Trigger Condition
                                        </span>
                                        <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/20">
                                            Keyword Match
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-foreground font-mono">
                                        {selectedFlow.trigger}
                                    </p>
                                </div>

                                <div className="flex justify-center text-muted-foreground">
                                    <ArrowRight className="size-4 rotate-90" />
                                </div>

                                {/* Node 2: Interactive Menu */}
                                <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-3 space-y-1.5">
                                    <div className="flex items-center justify-between text-xs font-semibold text-blue-600">
                                        <span className="flex items-center gap-1.5">
                                            <MessageSquare className="size-3.5" />
                                            STEP 2: Interactive WhatsApp Menu
                                        </span>
                                        <span className="text-[11px] text-muted-foreground">Quick Buttons (3 options)</span>
                                    </div>
                                    <p className="text-xs text-foreground">
                                        Greets customer by name &amp; presents main services menu.
                                    </p>
                                </div>

                                <div className="flex justify-center text-muted-foreground">
                                    <ArrowRight className="size-4 rotate-90" />
                                </div>

                                {/* Node 3: Branching & Action */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 space-y-1">
                                        <span className="text-[11px] font-semibold text-emerald-600 block">
                                            Branch A: Self-Service
                                        </span>
                                        <p className="text-xs text-muted-foreground">
                                            Sends automated PDF catalogue &amp; pricing link.
                                        </p>
                                    </div>
                                    <div className="rounded-lg border border-purple-500/30 bg-purple-500/5 p-3 space-y-1">
                                        <span className="text-[11px] font-semibold text-purple-600 block">
                                            Branch B: Live Human Agent
                                        </span>
                                        <p className="text-xs text-muted-foreground">
                                            Tags contact as "Hot Lead" &amp; notifies Bhavesh.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Live WhatsApp Flow Simulator */}
                        <Card className="border-border shadow-2xs bg-[#efeae2]/40 dark:bg-[#0c1317]">
                            <CardHeader className="py-2.5 px-4 border-b border-border/80 bg-background/80">
                                <CardTitle className="text-xs font-semibold flex items-center justify-between">
                                    <span className="flex items-center gap-1.5 text-foreground">
                                        <Bot className="size-3.5 text-[#47b672]" />
                                        Interactive Flow Simulator
                                    </span>
                                    <span className="text-[10px] text-muted-foreground font-mono">
                                        Simulated WhatsApp Client
                                    </span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-3 space-y-3">
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                    {previewChat.map((m, idx) => (
                                        <div
                                            key={idx}
                                            className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div
                                                className={`max-w-[85%] rounded-lg p-2.5 text-xs shadow-2xs whitespace-pre-wrap leading-relaxed ${
                                                    m.sender === 'user'
                                                        ? 'bg-[#d9fdd3] text-gray-900 dark:bg-[#005c4b] dark:text-gray-100 rounded-tr-none'
                                                        : 'bg-white text-gray-900 dark:bg-[#202c33] dark:text-gray-100 rounded-tl-none border border-black/5'
                                                }`}
                                            >
                                                {m.text}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <form onSubmit={handleSendPreview} className="flex gap-2 pt-1">
                                    <Input
                                        value={previewText}
                                        onChange={(e) => setPreviewText(e.target.value)}
                                        placeholder="Type 1, 2, 3 or ask something..."
                                        className="text-xs bg-background"
                                    />
                                    <Button type="submit" size="sm" className="bg-[#47b672] hover:bg-[#3ca062] text-white h-9 px-3">
                                        <Send className="size-3.5" />
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}
