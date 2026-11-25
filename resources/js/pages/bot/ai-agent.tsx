import { api } from '@/lib/api';
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

export default function AIAgent({ settings = {}, initialDocs = [], providerReady = false }: { settings?: any; initialDocs?: KnowledgeDoc[]; providerReady?: boolean }) {
    const [agentEnabled, setAgentEnabled] = useState<boolean>(settings.enabled ?? false);
    const [provider, setProvider] = useState<'openai' | 'anthropic' | 'gemini' | 'groq'>(settings.provider ?? 'openai');
    const [customerApiKey, setCustomerApiKey] = useState<string>(settings.api_key ?? '');
    const [model, setModel] = useState<string>(settings.model ?? 'gpt-4o-mini');
    const [primaryLanguage, setPrimaryLanguage] = useState<string>(settings.language ?? 'multilingual');
    const [systemPrompt, setSystemPrompt] = useState<string>(settings.system_prompt ?? 'Help our customers using the uploaded business documents. Offer human support if information is missing.');
    const [temperature, setTemperature] = useState<string>(String(settings.temperature ?? '0.4'));
    const [docs, setDocs] = useState<KnowledgeDoc[]>(initialDocs);
    const [isSaving, setIsSaving] = useState(false);
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

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await api('/ai-agent', 'POST', {
                enabled: agentEnabled,
                provider,
                api_key: customerApiKey,
                model,
                language: primaryLanguage,
                system_prompt: systemPrompt,
                temperature: Number(temperature),
            });
            showToast('AI settings saved successfully.');
        } catch (error) {
            showToast((error as Error).message);
        } finally {
            setIsSaving(false);
        }
    };
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        const body = new FormData();
        Array.from(e.target.files).forEach(file => body.append('files[]', file));
        setIsSaving(true);
        try { const data = await api('/ai-agent/documents', 'POST', body); setDocs(data.docs); showToast('Documents stored and indexed.'); }
        catch (error) { showToast((error as Error).message); }
        finally { setIsSaving(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
    };
    const handleDeleteDoc = async (id: string) => {
        try { await api(`/ai-agent/documents/${id}`, 'DELETE'); setDocs(current => current.filter(doc => doc.id !== id)); }
        catch (error) { showToast((error as Error).message); }
    };
    const handleSendTest = async (e: React.FormEvent) => {
        e.preventDefault(); const question = testQuery.trim(); if (!question || isSimulating) return;
        const history = [...chatHistory, { sender: 'user' as const, text: question }];
        setChatHistory(history); setTestQuery(''); setIsSimulating(true);
        try { const data = await api('/ai-agent/test', 'POST', { question, history: chatHistory.slice(-8) }); setChatHistory([...history, { sender: 'ai', text: data.reply }]); }
        catch (error) { showToast((error as Error).message); }
        finally { setIsSimulating(false); }
    };

    return (
        <>
            <Head title="WhatsApp AI Agent - PDF & Document Knowledge Base" />

            {/* Hidden file input for real uploads */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".pdf,.doc,.docx,.txt,.md,.csv,.json"
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

                {/* Compact Action Toolbar */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/60 pb-3.5">
                    <div className="flex items-center gap-2.5 flex-wrap">
                        <Badge
                            variant="outline"
                            className="text-xs bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30"
                        >
                            PDF &amp; Document Knowledge Base
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                            Upload your product brochures, pricing PDFs, or company documents. Connect OpenAI, Claude, Gemini, or Groq using your own API key.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <Button
                            size="sm"
                            onClick={handleSave}
                            disabled={isSaving}
                            className="bg-purple-600 hover:bg-purple-700 text-white text-xs h-9 gap-1.5 shadow-sm px-3.5"
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

                {!providerReady && <p role="status" className="rounded-lg border p-3 text-sm">An administrator must add the OpenAI API key in Platform Settings before AI can answer messages.</p>}
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
                                {/* Provider Selection & BYOK API Key */}
                                <div className="p-3 rounded-lg bg-muted/40 border border-border/80 space-y-2.5">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                                            <Zap className="size-3.5 text-amber-500" />
                                            <span>AI Provider &amp; Customer Token (BYOK)</span>
                                        </Label>
                                        <span className="text-[10px] text-muted-foreground font-medium">No markup on customer tokens</span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setProvider('openai');
                                                setModel('gpt-4o-mini');
                                            }}
                                            className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                                                provider === 'openai'
                                                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold'
                                                    : 'border-border bg-card hover:bg-muted text-muted-foreground'
                                            }`}
                                        >
                                            <div className="text-xs">OpenAI (GPT)</div>
                                            <div className="text-[10px] text-muted-foreground font-normal">GPT-4o, GPT-4o Mini</div>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setProvider('anthropic');
                                                setModel('claude-3-5-sonnet-20241022');
                                            }}
                                            className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                                                provider === 'anthropic'
                                                    ? 'border-purple-500 bg-purple-500/10 text-purple-700 dark:text-purple-300 font-bold'
                                                    : 'border-border bg-card hover:bg-muted text-muted-foreground'
                                            }`}
                                        >
                                            <div className="text-xs">Anthropic (Claude)</div>
                                            <div className="text-[10px] text-muted-foreground font-normal">Claude 3.5 / 3.7 Sonnet</div>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setProvider('gemini');
                                                setModel('gemini-2.5-flash');
                                            }}
                                            className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                                                provider === 'gemini'
                                                    ? 'border-blue-500 bg-blue-500/10 text-blue-700 dark:text-blue-300 font-bold'
                                                    : 'border-border bg-card hover:bg-muted text-muted-foreground'
                                            }`}
                                        >
                                            <div className="text-xs">Google (Gemini)</div>
                                            <div className="text-[10px] text-muted-foreground font-normal">Gemini 2.5 Flash, 1.5 Pro</div>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setProvider('groq');
                                                setModel('llama-3.3-70b-versatile');
                                            }}
                                            className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                                                provider === 'groq'
                                                    ? 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold'
                                                    : 'border-border bg-card hover:bg-muted text-muted-foreground'
                                            }`}
                                        >
                                            <div className="text-xs">Groq (Llama 3)</div>
                                            <div className="text-[10px] text-muted-foreground font-normal">Ultra-fast Llama 3.3 70B</div>
                                        </button>
                                    </div>

                                    <div className="space-y-1 pt-1">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-[11px] font-semibold text-foreground">
                                                {provider === 'anthropic'
                                                    ? 'Anthropic Claude API Key'
                                                    : provider === 'gemini'
                                                    ? 'Google Gemini API Key'
                                                    : provider === 'groq'
                                                    ? 'Groq API Key'
                                                    : 'OpenAI API Key'}
                                            </Label>
                                            <span className="text-[10px] text-muted-foreground font-mono">
                                                {provider === 'anthropic'
                                                    ? 'sk-ant-...'
                                                    : provider === 'gemini'
                                                    ? 'AIza...'
                                                    : provider === 'groq'
                                                    ? 'gsk_...'
                                                    : 'sk-proj-...'}
                                            </span>
                                        </div>
                                        <Input
                                            type="password"
                                            value={customerApiKey}
                                            onChange={(e) => setCustomerApiKey(e.target.value)}
                                            placeholder={`Paste your ${
                                                provider === 'anthropic'
                                                    ? 'Anthropic'
                                                    : provider === 'gemini'
                                                    ? 'Google Gemini'
                                                    : provider === 'groq'
                                                    ? 'Groq'
                                                    : 'OpenAI'
                                            } API Key`}
                                            className="h-8 text-xs font-mono"
                                        />
                                        <p className="text-[10px] text-muted-foreground">
                                            Your personal key is stored encrypted and used only for your workspace&apos;s bot replies.
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-xs font-medium">Selected Model</Label>
                                        <select
                                            value={model}
                                            onChange={(e) => setModel(e.target.value)}
                                            className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs focus:outline-none"
                                        >
                                            {provider === 'openai' && (
                                                <>
                                                    <option value="gpt-4o-mini">GPT-4o Mini (Fast &amp; Cost-Effective)</option>
                                                    <option value="gpt-4o">GPT-4o (Most Intelligent)</option>
                                                    <option value="gpt-4.1-mini">GPT-4.1 Mini</option>
                                                </>
                                            )}
                                            {provider === 'anthropic' && (
                                                <>
                                                    <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet (Highest Quality)</option>
                                                    <option value="claude-3-7-sonnet-20250219">Claude 3.7 Sonnet (Latest)</option>
                                                    <option value="claude-3-5-haiku-20241022">Claude 3.5 Haiku (Lightning Fast)</option>
                                                </>
                                            )}
                                            {provider === 'gemini' && (
                                                <>
                                                    <option value="gemini-2.5-flash">Gemini 2.5 Flash (Fast &amp; Smart)</option>
                                                    <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                                                    <option value="gemini-1.5-pro">Gemini 1.5 Pro (Complex Docs)</option>
                                                </>
                                            )}
                                            {provider === 'groq' && (
                                                <>
                                                    <option value="llama-3.3-70b-versatile">Llama 3.3 70B Versatile</option>
                                                    <option value="llama-3.1-8b-instant">Llama 3.1 8B Instant</option>
                                                </>
                                            )}
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
