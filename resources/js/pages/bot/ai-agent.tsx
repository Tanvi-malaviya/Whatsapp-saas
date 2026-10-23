import { useState } from 'react';
import { Head } from '@inertiajs/react';
import {
    Sparkles,
    Bot,
    Upload,
    FileText,
    Save,
    Check,
    Languages,
    Sliders,
    ShieldAlert,
    Send,
    Trash2,
    RefreshCw,
    BrainCircuit,
    Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function AIAgent() {
    const [agentEnabled, setAgentEnabled] = useState(true);
    const [model, setModel] = useState('gpt-4o-mini');
    const [primaryLanguage, setPrimaryLanguage] = useState('multilingual');
    const [systemPrompt, setSystemPrompt] = useState(
        `You are Sathwara InfoTech's Official AI Assistant. You help customers with WhatsApp Business API setup, SaaS portal subscriptions, and software inquiries.\n\nSpeak politely and warmly. You can reply in English, Gujarati (ગુજરાતી), or Hindi (हिंदी) depending on what language the user speaks.\n\nPricing reference:\n- WhatsApp Bot Starter: ₹2,999 setup + ₹999/mo\n- Bulk Broadcast Unlimited: ₹4,999/mo\n\nIf the customer asks for custom web/app development or a human call, politely offer to connect them with Bhavesh Sathwara.`
    );
    const [temperature, setTemperature] = useState('0.4');

    const [docs, setDocs] = useState([
        { id: '1', name: 'Sathwara_InfoTech_Services_2026.pdf', size: '2.4 MB', status: 'Indexed' },
        { id: '2', name: 'WhatsApp_Cloud_API_FAQ.pdf', size: '840 KB', status: 'Indexed' },
        { id: '3', name: 'Pricing_and_SLA_Terms.pdf', size: '420 KB', status: 'Indexed' },
    ]);

    const [testQuery, setTestQuery] = useState('');
    const [chatHistory, setChatHistory] = useState<{ sender: 'user' | 'ai'; text: string }[]>([
        { sender: 'user', text: 'નમસ્તે! વોટ્સએપ એપીઆઇ નું સેટઅપ કેટલા રૂપિયામાં થાય?' },
        { sender: 'ai', text: 'નમસ્તે! 🙏 સાથવારા ઇન્ફોટેકમાં આપનું સ્વાગત છે.\n\nઅમારું WhatsApp Bot Starter પેકેજ ₹2,999 વન-ટાઇમ સેટઅપ + ₹999/મહિને શરૂ થાય છે, જેમાં અનલિમિટેડ ઓટો-રિપ્લાય અને 1-ક્લિક મેટા કનેક્શન મળે છે! શું તમારે લાઇવ ડેમો જોવો છે?' },
    ]);
    const [isSimulating, setIsSimulating] = useState(false);
    const [saved, setSaved] = useState(false);

    const handleSendTest = (e: React.FormEvent) => {
        e.preventDefault();
        if (!testQuery.trim() || isSimulating) return;

        const q = testQuery.trim();
        const updated = [...chatHistory, { sender: 'user' as const, text: q }];
        setChatHistory(updated);
        setTestQuery('');
        setIsSimulating(true);

        setTimeout(() => {
            setIsSimulating(false);
            let reply = "I would be delighted to assist you! With Sathwara InfoTech, you get official Meta WhatsApp Cloud API approval and high-speed broadcast delivery.";
            if (q.includes('નમસ્તે') || q.includes('કેમ') || q.includes('ભાવ')) {
                reply = "હા ચોક્કસ! અમે તમને સંપૂર્ણ સેટઅપ અને વેરિફિકેશનમાં મદદ કરીશું. તમે ક્યારે વાત કરવા માટે અનુકૂળ છો?";
            } else if (q.toLowerCase().includes('demo') || q.toLowerCase().includes('test')) {
                reply = "You can test right here! Your Meta webhook is live on https://dukanhisab.in/api/v1/whatsapp/webhook and ready for real messages.";
            }
            setChatHistory([...updated, { sender: 'ai' as const, text: reply }]);
        }, 700);
    };

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    };

    return (
        <>
            <Head title="AI Agent - Sathwara InfoTech" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                                <Sparkles className="size-5 text-purple-600" />
                                Generative AI WhatsApp Agent
                            </h2>
                            <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-600 border-purple-500/20">
                                Multilingual (Gujarati, Hindi, English)
                            </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Train a smart conversational AI bot using your company documents to answer customer questions automatically.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        {saved && (
                            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                                <Check className="size-3.5" /> Saved!
                            </span>
                        )}
                        <Button size="sm" onClick={handleSave} className="bg-purple-600 hover:bg-purple-700 text-white text-xs">
                            <Save className="size-3.5 mr-1.5" />
                            Save Agent
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left: Configuration & Knowledge Base */}
                    <div className="lg:col-span-7 space-y-5">
                        {/* 1. Model & Personality */}
                        <Card className="border-border shadow-2xs">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                        <BrainCircuit className="size-4 text-purple-600" />
                                        AI Persona &amp; Model Selection
                                    </CardTitle>
                                    <button
                                        type="button"
                                        onClick={() => setAgentEnabled(!agentEnabled)}
                                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                                            agentEnabled ? 'bg-purple-600' : 'bg-muted'
                                        }`}
                                    >
                                        <span
                                            className={`pointer-events-none inline-block size-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                                                agentEnabled ? 'translate-x-4' : 'translate-x-0'
                                            }`}
                                        />
                                    </button>
                                </div>
                                <CardDescription className="text-xs">
                                    Define the model intelligence level, system prompt, and multi-language behavior.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium">Underlying AI Model</Label>
                                        <select
                                            value={model}
                                            onChange={(e) => setModel(e.target.value)}
                                            className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                        >
                                            <option value="gpt-4o-mini">GPT-4o Mini (Fast &amp; Cost-Effective)</option>
                                            <option value="claude-3-5-haiku">Claude 3.5 Haiku (High Accuracy)</option>
                                            <option value="llama-3-8b">Meta Llama 3 8B (Open Source)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium flex items-center gap-1">
                                            <Languages className="size-3.5 text-muted-foreground" />
                                            Language Understanding
                                        </Label>
                                        <select
                                            value={primaryLanguage}
                                            onChange={(e) => setPrimaryLanguage(e.target.value)}
                                            className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                        >
                                            <option value="multilingual">Auto-detect (Gujarati, Hindi, English)</option>
                                            <option value="gu">Gujarati Only (ગુજરાતી)</option>
                                            <option value="hi">Hindi Only (हिंदी)</option>
                                            <option value="en">English Only</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs font-medium">System Instructions / Prompt</Label>
                                        <span className="text-[10px] text-muted-foreground">Sets tone &amp; boundaries</span>
                                    </div>
                                    <textarea
                                        value={systemPrompt}
                                        onChange={(e) => setSystemPrompt(e.target.value)}
                                        rows={6}
                                        className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-sans leading-relaxed"
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* 2. Knowledge Base Documents */}
                        <Card className="border-border shadow-2xs">
                            <CardHeader className="pb-3 flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                        <FileText className="size-4 text-purple-600" />
                                        Knowledge Base (RAG Documents)
                                    </CardTitle>
                                    <CardDescription className="text-xs mt-0.5">
                                        Upload brochures, pricelists, or PDFs. The AI indexes these to answer queries accurately.
                                    </CardDescription>
                                </div>
                                <Button size="sm" variant="outline" className="text-xs h-8">
                                    <Upload className="size-3 mr-1.5 text-purple-600" />
                                    Upload Document
                                </Button>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-border/60">
                                    {docs.map((d) => (
                                        <div key={d.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/30 text-xs">
                                            <div className="flex items-center gap-2.5">
                                                <FileText className="size-4 text-purple-600 shrink-0" />
                                                <div>
                                                    <p className="font-semibold text-foreground">{d.name}</p>
                                                    <p className="text-[11px] text-muted-foreground">{d.size}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                                                    {d.status}
                                                </Badge>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 w-7 p-0 text-muted-foreground hover:text-red-600"
                                                    onClick={() => setDocs(docs.filter(item => item.id !== d.id))}
                                                >
                                                    <Trash2 className="size-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right: Interactive Live AI Test Chatbot */}
                    <div className="lg:col-span-5">
                        <Card className="border-border shadow-2xs bg-[#efeae2]/40 dark:bg-[#0c1317] h-full flex flex-col">
                            <CardHeader className="py-3 px-4 border-b border-border/80 bg-background/90">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="size-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                        <CardTitle className="text-xs font-semibold text-foreground">
                                            Live AI Sandbox Preview
                                        </CardTitle>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setChatHistory([])}
                                        className="h-7 text-[10px] text-muted-foreground hover:text-foreground"
                                    >
                                        <RefreshCw className="size-3 mr-1" />
                                        Clear
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-3 flex-1 flex flex-col justify-between space-y-3">
                                <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                                    {chatHistory.map((m, idx) => (
                                        <div
                                            key={idx}
                                            className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div
                                                className={`max-w-[88%] rounded-lg p-2.5 text-xs shadow-2xs whitespace-pre-wrap leading-relaxed ${
                                                    m.sender === 'user'
                                                        ? 'bg-[#d9fdd3] text-gray-900 dark:bg-[#005c4b] dark:text-gray-100 rounded-tr-none'
                                                        : 'bg-white text-gray-900 dark:bg-[#202c33] dark:text-gray-100 rounded-tl-none border border-black/5'
                                                }`}
                                            >
                                                {m.text}
                                            </div>
                                        </div>
                                    ))}

                                    {isSimulating && (
                                        <div className="flex justify-start">
                                            <div className="rounded-lg p-2 bg-white dark:bg-[#202c33] text-xs text-muted-foreground flex items-center gap-1.5 shadow-2xs">
                                                <Sparkles className="size-3 animate-spin text-purple-600" />
                                                AI Agent is typing reply...
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <form onSubmit={handleSendTest} className="flex gap-2 pt-2 border-t border-border/60">
                                    <Input
                                        value={testQuery}
                                        onChange={(e) => setTestQuery(e.target.value)}
                                        placeholder="Ask in Gujarati, Hindi, or English..."
                                        className="text-xs bg-background"
                                    />
                                    <Button
                                        type="submit"
                                        disabled={isSimulating}
                                        size="sm"
                                        className="bg-purple-600 hover:bg-purple-700 text-white h-9 px-3"
                                    >
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
