import { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import {
    FileText,
    Plus,
    RefreshCw,
    CheckCircle2,
    Clock,
    AlertCircle,
    Smartphone,
    Eye,
    Copy,
    Send,
    ExternalLink,
    Search,
    ShieldCheck,
    Check,
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

type TemplateItem = {
    id: string;
    name: string;
    category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
    language: string;
    status: 'APPROVED' | 'IN_REVIEW' | 'REJECTED';
    headerType?: 'TEXT' | 'IMAGE';
    headerText?: string;
    bodyText: string;
    footerText?: string;
    buttons?: { type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER'; text: string; url?: string }[];
    updatedAt: string;
};

export default function MessageTemplates() {
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('ALL');
    const [isSyncing, setIsSyncing] = useState(false);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const [templates, setTemplates] = useState<TemplateItem[]>([
        {
            id: '1',
            name: 'lead_inquiry_welcome_v1',
            category: 'MARKETING',
            language: 'en_US',
            status: 'APPROVED',
            headerType: 'TEXT',
            headerText: 'Welcome to Sathwara InfoTech! 🚀',
            bodyText: 'Hello {{1}}, thank you for reaching out regarding our WhatsApp SaaS and Web Development services. Our team is excited to assist you.\n\nWould you like to explore our live demo or schedule a 15-minute consultation with {{2}}?',
            footerText: 'Sathwara InfoTech • Ahmedabad',
            buttons: [
                { type: 'QUICK_REPLY', text: 'Book Live Demo' },
                { type: 'URL', text: 'View Website', url: 'https://dukanhisab.in' },
            ],
            updatedAt: '2 days ago',
        },
        {
            id: '2',
            name: 'course_admission_confirmed',
            category: 'UTILITY',
            language: 'en_US',
            status: 'APPROVED',
            headerType: 'IMAGE',
            headerText: 'Course Enrollment Receipt',
            bodyText: 'Dear {{1}}, your seat for the Full Stack Laravel & WhatsApp API Masterclass has been confirmed! Batch starts on {{2}} at 10:00 AM IST.\n\nPlease find your classroom portal credentials attached.',
            footerText: 'Reply HELP for assistance',
            buttons: [
                { type: 'URL', text: 'Open Student Portal', url: 'https://dukanhisab.in/portal' },
            ],
            updatedAt: 'Oct 20, 2026',
        },
        {
            id: '3',
            name: 'payment_invoice_reminder',
            category: 'UTILITY',
            language: 'en_US',
            status: 'APPROVED',
            headerType: 'TEXT',
            headerText: 'Invoice #{{1}} Notice',
            bodyText: 'Hello {{2}}, this is a friendly reminder that invoice #{{1}} of amount ₹{{3}} is due on {{4}}.\n\nClick below to securely pay via UPI or Net Banking.',
            footerText: 'Automated by Sathwara Billing',
            buttons: [
                { type: 'URL', text: 'Pay Online Now', url: 'https://dukanhisab.in/pay' },
            ],
            updatedAt: 'Oct 15, 2026',
        },
        {
            id: '4',
            name: 'diwali_festive_offer_gujarat',
            category: 'MARKETING',
            language: 'gu',
            status: 'APPROVED',
            headerType: 'TEXT',
            headerText: 'દિવાળી સ્પેશિયલ ઓફર! ✨',
            bodyText: 'નમસ્તે {{1}}! આ દિવાળીએ આપના બિઝનેસને વોટ્સએપ ઓટોમેશન સાથે 10X ગ્રો કરો. માત્ર ₹2,999 માં મેળવો કમ્પ્લીટ સોફ્ટવેર સેટઅપ.\n\nઓફર મર્યાદિત સમય માટે જ માન્ય છે!',
            footerText: 'સાથવારા ઇન્ફોટેક • ગુજરાત',
            buttons: [
                { type: 'QUICK_REPLY', text: 'ઓફર બુક કરો' },
                { type: 'URL', text: 'વિગત જુઓ', url: 'https://dukanhisab.in' },
            ],
            updatedAt: 'Yesterday',
        },
        {
            id: '5',
            name: 'otp_verification_code',
            category: 'AUTHENTICATION',
            language: 'en_US',
            status: 'APPROVED',
            bodyText: '{{1}} is your Sathwara SaaS login verification code. For security reasons, do not share this code with anyone.',
            footerText: 'Expires in 10 minutes',
            buttons: [
                { type: 'QUICK_REPLY', text: 'Copy Code' },
            ],
            updatedAt: '3 weeks ago',
        },
    ]);

    const [selectedTemplate, setSelectedTemplate] = useState<TemplateItem>(templates[0]);

    const handleSyncMeta = () => {
        setIsSyncing(true);
        setTimeout(() => setIsSyncing(false), 1200);
    };

    const filteredTemplates = templates.filter(t => {
        if (categoryFilter !== 'ALL' && t.category !== categoryFilter) return false;
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            return t.name.toLowerCase().includes(q) || t.bodyText.toLowerCase().includes(q);
        }
        return true;
    });

    return (
        <>
            <Head title="WhatsApp Message Templates - Sathwara InfoTech" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                                <FileText className="size-5 text-[#47b672]" />
                                Meta Approved Message Templates (HSM)
                            </h2>
                            <Badge variant="outline" className="text-xs bg-[#47b672]/10 text-[#28804c] dark:text-[#52c480] border-[#47b672]/30">
                                {templates.length} Templates
                            </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Pre-approved WhatsApp templates required for sending outbound broadcasts and automated notifications.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={isSyncing}
                            onClick={handleSyncMeta}
                            className="text-xs h-9 border-border"
                        >
                            <RefreshCw className={`size-3.5 mr-1.5 ${isSyncing ? 'animate-spin text-[#47b672]' : ''}`} />
                            {isSyncing ? 'Syncing...' : 'Sync with Meta'}
                        </Button>
                        <Button
                            size="sm"
                            onClick={() => setIsCreateOpen(true)}
                            className="bg-[#47b672] hover:bg-[#3ca062] text-white text-xs h-9"
                        >
                            <Plus className="size-3.5 mr-1.5" />
                            Create Template
                        </Button>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                        {['ALL', 'MARKETING', 'UTILITY', 'AUTHENTICATION'].map((cat) => (
                            <Button
                                key={cat}
                                size="sm"
                                variant={categoryFilter === cat ? 'default' : 'outline'}
                                onClick={() => setCategoryFilter(cat)}
                                className={`text-xs h-8 ${
                                    categoryFilter === cat
                                        ? 'bg-[#47b672] hover:bg-[#3ca062] text-white'
                                        : 'text-muted-foreground'
                                }`}
                            >
                                {cat === 'ALL' ? 'All Templates' : cat}
                            </Button>
                        ))}
                    </div>

                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search template name..."
                            className="pl-8 text-xs h-8"
                        />
                    </div>
                </div>

                {/* 2-Column: Template List & Live WhatsApp Mobile Preview */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left: Templates Table */}
                    <div className="lg:col-span-7 space-y-3">
                        {filteredTemplates.map((tpl) => {
                            const isSelected = selectedTemplate.id === tpl.id;
                            return (
                                <Card
                                    key={tpl.id}
                                    onClick={() => setSelectedTemplate(tpl)}
                                    className={`cursor-pointer transition-all border shadow-2xs ${
                                        isSelected
                                            ? 'border-[#47b672] ring-1 ring-[#47b672]/30 bg-card'
                                            : 'border-border hover:border-[#47b672]/50 hover:bg-muted/30'
                                    }`}
                                >
                                    <CardContent className="p-4 space-y-2">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="space-y-0.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-xs font-bold text-foreground">
                                                        {tpl.name}
                                                    </span>
                                                    <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                                                        <Check className="size-2.5 mr-1" />
                                                        {tpl.status}
                                                    </Badge>
                                                </div>
                                                <p className="text-[11px] text-muted-foreground line-clamp-2">
                                                    {tpl.bodyText}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-1 text-[11px] text-muted-foreground border-t border-border/60">
                                            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                                                {tpl.category}
                                            </span>
                                            <span>Lang: <strong className="text-foreground">{tpl.language}</strong></span>
                                            <span>Updated {tpl.updatedAt}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                    {/* Right: Realistic WhatsApp Mobile Preview */}
                    <div className="lg:col-span-5">
                        <Card className="border-border shadow-2xs sticky top-6">
                            <CardHeader className="py-3 px-4 border-b border-border/80">
                                <CardTitle className="text-xs font-semibold flex items-center justify-between text-foreground">
                                    <span className="flex items-center gap-1.5">
                                        <Smartphone className="size-4 text-[#47b672]" />
                                        WhatsApp Message Preview
                                    </span>
                                    <span className="font-mono text-[10px] text-muted-foreground">
                                        {selectedTemplate.category}
                                    </span>
                                </CardTitle>
                            </CardHeader>

                            <CardContent className="p-4 bg-[#efeae2] dark:bg-[#0c1317] rounded-b-xl flex flex-col items-center">
                                {/* WhatsApp Chat Bubble Mockup */}
                                <div className="w-full max-w-sm rounded-lg bg-white dark:bg-[#202c33] text-gray-900 dark:text-gray-100 p-3 shadow-md border border-black/5 space-y-2">
                                    {/* Header */}
                                    {selectedTemplate.headerType === 'TEXT' && selectedTemplate.headerText && (
                                        <p className="font-bold text-xs text-foreground">
                                            {selectedTemplate.headerText}
                                        </p>
                                    )}
                                    {selectedTemplate.headerType === 'IMAGE' && (
                                        <div className="rounded-md bg-muted/60 h-28 flex items-center justify-center text-xs text-muted-foreground border border-border">
                                            🖼️ [Header Media / Image Attached]
                                        </div>
                                    )}

                                    {/* Body */}
                                    <p className="text-xs leading-relaxed whitespace-pre-wrap text-foreground">
                                        {selectedTemplate.bodyText
                                            .replace('{{1}}', 'Bhavesh')
                                            .replace('{{2}}', 'Sathwara InfoTech')
                                            .replace('{{3}}', '2,999')
                                            .replace('{{4}}', 'Oct 30')}
                                    </p>

                                    {/* Footer */}
                                    {selectedTemplate.footerText && (
                                        <p className="text-[10px] text-muted-foreground pt-1">
                                            {selectedTemplate.footerText}
                                        </p>
                                    )}

                                    {/* Buttons */}
                                    {selectedTemplate.buttons && selectedTemplate.buttons.length > 0 && (
                                        <div className="pt-2 border-t border-border/60 space-y-1">
                                            {selectedTemplate.buttons.map((btn, idx) => (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    className="w-full py-1.5 px-3 rounded text-center text-xs font-semibold text-[#00a884] dark:text-[#52c480] bg-muted/40 hover:bg-muted/80 flex items-center justify-center gap-1.5"
                                                >
                                                    {btn.type === 'URL' ? <ExternalLink className="size-3" /> : <Send className="size-3" />}
                                                    {btn.text}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    <div className="text-[10px] text-right text-muted-foreground pt-0.5">
                                        11:34 AM • <Check className="inline size-3 text-[#53bdeb]" />
                                    </div>
                                </div>

                                <div className="mt-4 w-full text-center">
                                    <Button
                                        asChild
                                        size="sm"
                                        className="w-full bg-[#47b672] hover:bg-[#3ca062] text-white text-xs"
                                    >
                                        <Link href="/campaigns">
                                            <Send className="size-3.5 mr-1.5" />
                                            Send Broadcast with This Template
                                        </Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Create Template Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="text-sm font-semibold flex items-center gap-2">
                            <Plus className="size-4 text-[#47b672]" />
                            Create Meta WhatsApp Template
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Submit a new template to Meta for automated approval within 2-5 minutes.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={(e) => { e.preventDefault(); setIsCreateOpen(false); }} className="space-y-3.5 py-2">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs font-medium">Template Name</Label>
                                <Input placeholder="e.g. order_dispatch_update" className="text-xs font-mono" required />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs font-medium">Category</Label>
                                <select className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs">
                                    <option value="MARKETING">Marketing</option>
                                    <option value="UTILITY">Utility</option>
                                    <option value="AUTHENTICATION">Authentication</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs font-medium">Body Text (Use &#123;&#123;1&#125;&#125;, &#123;&#123;2&#125;&#125; for dynamic variables)</Label>
                            <textarea
                                rows={4}
                                placeholder="Hello {{1}}, your order #{{2}} is on the way!"
                                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs"
                                required
                            />
                        </div>

                        <DialogFooter className="pt-2">
                            <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateOpen(false)} className="text-xs">
                                Cancel
                            </Button>
                            <Button type="submit" size="sm" className="bg-[#47b672] hover:bg-[#3ca062] text-white text-xs">
                                Submit to Meta
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
