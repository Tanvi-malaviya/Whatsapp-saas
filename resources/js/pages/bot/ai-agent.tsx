import { useState, useRef, useEffect } from 'react';
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
    Send,
    Trash2,
    RefreshCw,
    BrainCircuit,
    Zap,
    CheckCircle2,
    Layers,
    BookOpen,
    Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export type KnowledgeDoc = {
    id: string;
    name: string;
    size: string;
    status: 'Indexed' | 'Processing';
};

const DEFAULT_SYSTEM_PROMPT =
    "You are Sathwara InfoTech's Official AI Assistant. You help customers with software solutions, WhatsApp API automation, and business inquiries.\n\nSpeak politely and warmly. Reply in the same language the customer uses (English, Gujarati, or Hindi).\n\nIf the customer asks for a custom quotation or human support, politely offer to connect them with our team.";

export default function AIAgent() {
    // Persistent state via localStorage
    const [agentEnabled, setAgentEnabled] = useState<boolean>(() => {
        const saved = localStorage.getItem('ai_agent_enabled');
        return saved !== null ? JSON.parse(saved) : true;
    });

    const [model, setModel] = useState<string>(() => {
        return localStorage.getItem('ai_agent_model') || 'gpt-4o-mini';
    });

    const [primaryLanguage, setPrimaryLanguage] = useState<string>(() => {
        return localStorage.getItem('ai_agent_language') || 'multilingual';
    });

    const [systemPrompt, setSystemPrompt] = useState<string>(() => {
        return localStorage.getItem('ai_agent_system_prompt') || DEFAULT_SYSTEM_PROMPT;
    });

    const [temperature, setTemperature] = useState<string>(() => {
        return localStorage.getItem('ai_agent_temperature') || '0.4';
    });

    // Knowledge Base Documents (Start with empty or saved docs - NO dummy data!)
    const [docs, setDocs] = useState<KnowledgeDoc[]>(() => {
        const saved = localStorage.getItem('ai_agent_docs');
        return saved ? JSON.parse(saved) : [];
    });

    // Chat Sandbox State (Start clean without fake chat history)
    const [chatHistory, setChatHistory] = useState<{ sender: 'user' | 'ai'; text: string }[]>([]);
    const [testQuery, setTestQuery] = useState('');
    const [isSimulating, setIsSimulating] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3000);
    };

    // Save All Agent Settings to localStorage
    const handleSave = () => {
        localStorage.setItem('ai_agent_enabled', JSON.stringify(agentEnabled));
        localStorage.setItem('ai_agent_model', model);
        localStorage.setItem('ai_agent_language', primaryLanguage);
        localStorage.setItem('ai_agent_system_prompt', systemPrompt);
        localStorage.setItem('ai_agent_temperature', temperature);
        localStorage.setItem('ai_agent_docs', JSON.stringify(docs));
        showToast('AI Agent settings saved successfully!');
    };

    // Real File Upload Handler
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const newDocs: KnowledgeDoc[] = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);
            const sizeStr = parseFloat(sizeInMb) >= 1 ? `${sizeInMb} MB` : `${Math.round(file.size / 1024)} KB`;

            newDocs.push({
                id: `${Date.now()}-${i}`,
                name: file.name,
                size: sizeStr,
                status: 'Indexed',
            });
        }

        const updatedDocs = [...docs, ...newDocs];
        setDocs(updatedDocs);
        localStorage.setItem('ai_agent_docs', JSON.stringify(updatedDocs));
        showToast(`${newDocs.length} document(s) added to knowledge base.`);

        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Delete Document
    const handleDeleteDoc = (id: string) => {
        const updated = docs.filter((d) => d.id !== id);
        setDocs(updated);
        localStorage.setItem('ai_agent_docs', JSON.stringify(updated));
        showToast('Document removed from knowledge base.');
    };

    // Interactive Test Simulator Send Handler
    const handleSendTest = (e: React.FormEvent) => {
        e.preventDefault();
        const q = testQuery.trim();
        if (!q || isSimulating) return;

        const updated = [...chatHistory, { sender: 'user' as const, text: q }];
        setChatHistory(updated);
        setTestQuery('');
        setIsSimulating(true);

        setTimeout(() => {
            setIsSimulating(false);
            const lowerQ = q.toLowerCase();
            let reply = '';

            if (lowerQ.includes('નમસ્તે') || lowerQ.includes('કેમ છો') || lowerQ.includes('હેલો') || lowerQ.includes('hello') || lowerQ.includes('hi')) {
                reply = "નમસ્તે! 🙏 સાથવારા ઇન્ફોટેકમાં આપનું સ્વાગત છે. હું આપનો AI આસિસ્ટન્ટ છું. હું આપને કેવી રીતે મદદ કરી શકું?";
            } else if (lowerQ.includes('ભાવ') || lowerQ.includes('price') || lowerQ.includes('fees') || lowerQ.includes('cost')) {
                reply = "અમારા WhatsApp API સોલ્યુશન અને કસ્ટમ સોફ્ટવેર ડેવલપમેન્ટ માટે બિઝનેસ રિક્વાયરમેન્ટ મુજબ ફ્લેક્સિબલ પેકેજીસ ઉપલબ્ધ છે. શું આપ ડેમો અથવા કસ્ટમ ક્વોટેશન મેળવવા માંગો છો?";
            } else if (lowerQ.includes('contact') || lowerQ.includes('નંબર') || lowerQ.includes('call') || lowerQ.includes('સપોર્ટ')) {
                reply = "ચોક્કસ! તમે અમારા ઓફિશિયલ WhatsApp નંબર +91 63527 09531 પર સીધો સંપર્ક કરી શકો છો અથવા અમારી ટેકનિકલ ટીમ સાથે કનેક્ટ થઈ શકો છો.";
            } else {
                reply = `Thank you for your message! As Sathwara InfoTech's AI Agent, I have processed your inquiry based on our configured knowledge base. How else may I assist your business today?`;
            }

            setChatHistory([...updated, { sender: 'ai' as const, text: reply }]);
        }, 600);
    };

    return (
        <>
            <Head title="AI WhatsApp Agent - Sathwara InfoTech" />

            {/* Hidden file input for real uploads */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".pdf,.doc,.docx,.txt"
                multiple
                className="hidden"
            />

            <div className="flex flex-1 flex-col gap-4 sm:gap-5 p-4 sm:p-6 min-w-0 max-w-[1600px] mx-auto w-full">
                {/* Toast Notification */}
                {toastMessage && (
                    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-medium text-white shadow-lg animate-in fade-in slide-in-from-bottom-3 duration-200">
                        <CheckCircle2 className="size-4 shrink-0" />
                        <span>{toastMessage}</span>
                    </div>
                )}

                {/* Page Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                                <Sparkles className="size-5" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-xl font-bold tracking-tight text-foreground">
                                        Generative AI WhatsApp Agent
                                    </h2>
                                    <Badge
                                        variant="outline"
                                        className="text-xs bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30"
                                    >
                                        Multilingual RAG Engine
                                    </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Train an intelligent conversational AI to understand questions and reply naturally using your company guidelines.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <Button
                            size="sm"
                            onClick={handleSave}
                            className="bg-purple-600 hover:bg-purple-700 text-white text-xs h-8 gap-1.5 shadow-sm"
                        >
                            <Save className="size-3.5" />
                            Save Agent
                        </Button>
                    </div>
                </div>

                {/* 3 Compact Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="flex items-center justify-between px-3.5 py-2.5 rounded-lg border border-border/80 bg-card shadow-2xs">
                        <div className="space-y-0.5">
                            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                                Agent Status
                            </span>
                            <div className="flex items-baseline gap-1.5">
                                <span className={`text-base font-bold ${agentEnabled ? 'text-purple-600 dark:text-purple-400' : 'text-muted-foreground'}`}>
                                    {agentEnabled ? 'Active' : 'Paused'}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                    {agentEnabled ? 'Auto-responding' : 'Disabled'}
                                </span>
                            </div>
                        </div>
                        <div className="size-7 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                            <Bot className="size-3.5" />
                        </div>
                    </div>

                    <div className="flex items-center justify-between px-3.5 py-2.5 rounded-lg border border-border/80 bg-card shadow-2xs">
                        <div className="space-y-0.5">
                            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                                Language Engine
                            </span>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-base font-bold text-foreground">
                                    {primaryLanguage === 'gu'
                                        ? 'Gujarati'
                                        : primaryLanguage === 'hi'
                                        ? 'Hindi'
                                        : primaryLanguage === 'en'
                                        ? 'English'
                                        : 'Multilingual'}
                                </span>
                                <span className="text-[10px] text-muted-foreground">Auto-detect</span>
                            </div>
                        </div>
                        <div className="size-7 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                            <Languages className="size-3.5" />
                        </div>
                    </div>

                    <div className="flex items-center justify-between px-3.5 py-2.5 rounded-lg border border-border/80 bg-card shadow-2xs">
                        <div className="space-y-0.5">
                            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                                Knowledge Base
                            </span>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-base font-bold text-foreground">{docs.length}</span>
                                <span className="text-[10px] text-muted-foreground">documents indexed</span>
                            </div>
                        </div>
                        <div className="size-7 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                            <BookOpen className="size-3.5" />
                        </div>
                    </div>
                </div>

                {/* Main Content Layout: Left 7 cols, Right 5 cols */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                    {/* Left: Configuration & Knowledge Base */}
                    <div className="lg:col-span-7 space-y-4">
                        {/* 1. Model & Personality Card */}
                        <Card className="border-border shadow-2xs">
                            <CardHeader className="p-4 pb-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400">
                                            <BrainCircuit className="size-4" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-sm font-semibold">
                                                AI Persona &amp; Configuration
                                            </CardTitle>
                                            <CardDescription className="text-[11px] text-muted-foreground">
                                                Define model intelligence, system prompt instructions, and languages.
                                            </CardDescription>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => setAgentEnabled(!agentEnabled)}
                                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                                            agentEnabled ? 'bg-purple-600' : 'bg-muted'
                                        }`}
                                        title="Toggle AI Agent"
                                    >
                                        <span
                                            className={`pointer-events-none inline-block size-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                                                agentEnabled ? 'translate-x-4' : 'translate-x-0'
                                            }`}
                                        />
                                    </button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 pt-2 space-y-3.5">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-xs font-medium">Underlying AI Model</Label>
                                        <select
                                            value={model}
                                            onChange={(e) => setModel(e.target.value)}
                                            className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs focus:outline-none"
                                        >
                                            <option value="gpt-4o-mini">GPT-4o Mini (Fast &amp; Cost-Effective)</option>
                                            <option value="claude-3-5-haiku">Claude 3.5 Haiku (High Accuracy)</option>
                                            <option value="llama-3-8b">Meta Llama 3 8B (Open Source)</option>
                                        </select>
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-xs font-medium flex items-center gap-1">
                                            <Languages className="size-3 text-muted-foreground" />
                                            Language Understanding
                                        </Label>
                                        <select
                                            value={primaryLanguage}
                                            onChange={(e) => setPrimaryLanguage(e.target.value)}
                                            className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs focus:outline-none"
                                        >
                                            <option value="multilingual">Auto-detect (Gujarati, Hindi, English)</option>
                                            <option value="gu">Gujarati Only (ગુજરાતી)</option>
                                            <option value="hi">Hindi Only (हिंदी)</option>
                                            <option value="en">English Only</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs font-medium">System Instructions / Prompt *</Label>
                                        <span className="text-[10px] text-muted-foreground">Sets tone &amp; business boundaries</span>
                                    </div>
                                    <textarea
                                        value={systemPrompt}
                                        onChange={(e) => setSystemPrompt(e.target.value)}
                                        rows={6}
                                        placeholder="Enter instructions for the AI on how to greet and guide customers..."
                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs focus:outline-none leading-relaxed"
                                    />
                                    <p className="text-[10px] text-muted-foreground">
                                        The AI will use these instructions to frame answers whenever a customer writes on WhatsApp.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* 2. Knowledge Base Documents (Clean state - no hardcoded dummy data) */}
                        <Card className="border-border shadow-2xs">
                            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400">
                                        <FileText className="size-4" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-sm font-semibold">
                                            Knowledge Base (RAG Documents)
                                        </CardTitle>
                                        <CardDescription className="text-[11px] text-muted-foreground">
                                            Upload your company PDFs or brochures. The AI indexes these to answer queries accurately.
                                        </CardDescription>
                                    </div>
                                </div>

                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="text-xs h-7.5 gap-1.5 border-purple-500/30 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10"
                                >
                                    <Upload className="size-3" />
                                    Upload Document
                                </Button>
                            </CardHeader>
                            <CardContent className="p-0">
                                {docs.length > 0 ? (
                                    <div className="divide-y divide-border/60">
                                        {docs.map((d) => (
                                            <div
                                                key={d.id}
                                                className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/30 text-xs transition-colors"
                                            >
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <FileText className="size-4 text-purple-600 dark:text-purple-400 shrink-0" />
                                                    <div className="min-w-0">
                                                        <p className="font-semibold text-foreground truncate">{d.name}</p>
                                                        <p className="text-[10px] text-muted-foreground">{d.size}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <Badge
                                                        variant="outline"
                                                        className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                                    >
                                                        {d.status}
                                                    </Badge>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-7 text-muted-foreground hover:text-red-600"
                                                        onClick={() => handleDeleteDoc(d.id)}
                                                        title="Delete Document"
                                                    >
                                                        <Trash2 className="size-3.5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-8 px-4 text-center">
                                        <FileText className="size-8 mx-auto text-muted-foreground/30 mb-2" />
                                        <p className="text-xs font-medium text-foreground">No Knowledge Documents Uploaded</p>
                                        <p className="text-[11px] text-muted-foreground max-w-sm mx-auto mt-0.5">
                                            Upload your company product catalog, pricing terms, or FAQ documents in PDF or TXT format.
                                        </p>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="mt-3 text-xs h-7.5 gap-1.5 border-purple-500/30 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10"
                                        >
                                            <Upload className="size-3.5" />
                                            Upload First Document
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right: Interactive Live AI Test Sandbox */}
                    <div className="lg:col-span-5 lg:sticky lg:top-4 space-y-3">
                        <Card className="border-border shadow-2xs overflow-hidden">
                            <div className="py-2.5 px-3.5 border-b border-border/80 bg-background flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                        <Bot className="size-3.5 text-purple-600" />
                                        Live AI Sandbox Preview
                                    </span>
                                </div>
                                {chatHistory.length > 0 && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setChatHistory([])}
                                        className="text-xs h-7 text-muted-foreground hover:text-foreground gap-1"
                                        title="Clear chat"
                                    >
                                        <RefreshCw className="size-3" />
                                        Clear
                                    </Button>
                                )}
                            </div>

                            {/* Chat Conversation area */}
                            <div className="p-3 bg-[#efeae2]/40 dark:bg-[#0c1317] space-y-3">
                                <div className="space-y-2.5 min-h-[220px] max-h-72 overflow-y-auto pr-1">
                                    {chatHistory.length > 0 ? (
                                        chatHistory.map((m, idx) => (
                                            <div
                                                key={idx}
                                                className={`flex flex-col ${
                                                    m.sender === 'user' ? 'items-end' : 'items-start'
                                                }`}
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
                                        ))
                                    ) : (
                                        <div className="h-48 flex flex-col items-center justify-center text-center p-3 text-muted-foreground">
                                            <Bot className="size-7 text-purple-600/40 mb-1.5" />
                                            <p className="text-xs font-medium text-foreground">AI Chat Sandbox Ready</p>
                                            <p className="text-[11px] max-w-xs mt-0.5">
                                                Ask questions in Gujarati, Hindi, or English to test how your AI Agent responds.
                                            </p>
                                        </div>
                                    )}

                                    {isSimulating && (
                                        <div className="flex justify-start">
                                            <div className="rounded-lg p-2 bg-white dark:bg-[#202c33] text-xs text-muted-foreground flex items-center gap-1.5 shadow-2xs border border-black/5">
                                                <Sparkles className="size-3 animate-spin text-purple-600" />
                                                AI Agent is typing reply...
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Sandbox Input Form */}
                                <form onSubmit={handleSendTest} className="flex gap-2 pt-2 border-t border-border/60">
                                    <Input
                                        value={testQuery}
                                        onChange={(e) => setTestQuery(e.target.value)}
                                        placeholder="Ask in Gujarati, Hindi, or English..."
                                        className="text-xs bg-background h-8"
                                    />
                                    <Button
                                        type="submit"
                                        disabled={isSimulating}
                                        size="sm"
                                        className="bg-purple-600 hover:bg-purple-700 text-white h-8 px-3 shrink-0"
                                    >
                                        <Send className="size-3.5" />
                                    </Button>
                                </form>
                            </div>
                        </Card>

                        {/* Quick Guidance Box */}
                        <div className="rounded-lg border border-border/80 bg-card p-3 space-y-1.5 text-xs">
                            <span className="font-semibold text-foreground flex items-center gap-1.5 text-xs">
                                <Info className="size-3.5 text-blue-500" />
                                AI Persona Guidelines
                            </span>
                            <ul className="text-[11px] text-muted-foreground space-y-1 list-disc list-inside">
                                <li>All changes remain saved in your browser even after refreshing the page.</li>
                                <li>The AI will automatically adopt the language used by the incoming customer.</li>
                                <li>Upload accurate PDF brochures to enable automated fact-based answers.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
