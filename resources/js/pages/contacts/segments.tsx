import { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import {
    Layers,
    Plus,
    Users,
    Send,
    Filter,
    Search,
    Trash2,
    Edit3,
    CheckCircle2,
    Calendar,
    MapPin,
    Tag,
    Clock,
    ArrowUpRight,
    Download,
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

type SegmentItem = {
    id: string;
    name: string;
    description: string;
    count: number;
    criteria: string;
    tags: string[];
    lastBroadcast: string;
    updatedAt: string;
};

export default function ContactSegments() {
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const [segments, setSegments] = useState<SegmentItem[]>([
        {
            id: '1',
            name: 'Hot Inbound Leads',
            description: 'Contacts who interacted in the last 7 days and requested pricing or live demo.',
            count: 48,
            criteria: 'Tag: "Hot Lead" AND Stage: "Qualified"',
            tags: ['Hot Lead', 'Ahmedabad', 'High Intent'],
            lastBroadcast: 'Yesterday (98% Delivered)',
            updatedAt: '2 hours ago',
        },
        {
            id: '2',
            name: 'Web Dev & Laravel Course Aspirants',
            description: 'Students who inquired about batch schedules, syllabus, and certification.',
            count: 142,
            criteria: 'Tag: "Student-2026" OR Interest: "Laravel"',
            tags: ['Student', 'Education', 'Gujarat'],
            lastBroadcast: '3 days ago (96% Delivered)',
            updatedAt: 'Yesterday',
        },
        {
            id: '3',
            name: 'Inactive Leads (30+ Days)',
            description: 'Contacts with no activity in over 30 days. Perfect for win-back discount broadcasts.',
            count: 215,
            criteria: 'Last Active > 30 Days ago',
            tags: ['Re-engagement', 'Follow-up'],
            lastBroadcast: '2 weeks ago',
            updatedAt: '4 days ago',
        },
        {
            id: '4',
            name: 'Gujarat VIP Business Owners',
            description: 'Enterprise & retail owners from Ahmedabad, Surat, Rajkot, and Vadodara.',
            count: 86,
            criteria: 'Location in [Ahmedabad, Surat, Rajkot]',
            tags: ['VIP', 'Enterprise', 'Gujarati'],
            lastBroadcast: 'Oct 18, 2026',
            updatedAt: '1 week ago',
        },
    ]);

    const [newName, setNewName] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [newTag, setNewTag] = useState('');

    const handleCreateSegment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim()) return;

        const newSeg: SegmentItem = {
            id: Date.now().toString(),
            name: newName.trim(),
            description: newDesc.trim() || 'Custom audience segment based on selected filters.',
            count: Math.floor(Math.random() * 80) + 20,
            criteria: `Tag: "${newTag || 'General'}"`,
            tags: newTag ? [newTag.trim()] : ['Custom'],
            lastBroadcast: 'Never',
            updatedAt: 'Just now',
        };

        setSegments([newSeg, ...segments]);
        setNewName('');
        setNewDesc('');
        setNewTag('');
        setIsCreateOpen(false);
    };

    const filteredSegments = segments.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <>
            <Head title="Contact Segments - Sathwara InfoTech" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                                <Layers className="size-5 text-[#47b672]" />
                                Contact Segments &amp; Audiences
                            </h2>
                            <Badge variant="outline" className="text-xs bg-[#47b672]/10 text-[#28804c] dark:text-[#52c480] border-[#47b672]/30">
                                {segments.length} Audiences
                            </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Create dynamic target groups based on tags, location, purchase history, and message engagement.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            onClick={() => setIsCreateOpen(true)}
                            className="bg-[#47b672] hover:bg-[#3ca062] text-white text-xs"
                        >
                            <Plus className="size-3.5 mr-1.5" />
                            Create Segment
                        </Button>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="flex items-center justify-between gap-3">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search segments by name, tag, or rule..."
                            className="pl-8 text-xs"
                        />
                    </div>
                    <div className="text-xs text-muted-foreground">
                        Total Audience Reach: <span className="font-semibold text-foreground">{segments.reduce((acc, s) => acc + s.count, 0)} contacts</span>
                    </div>
                </div>

                {/* Segments Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredSegments.map((seg) => (
                        <Card key={seg.id} className="border-border hover:border-[#47b672]/50 transition-all shadow-2xs">
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                                            {seg.name}
                                        </CardTitle>
                                        <CardDescription className="text-xs mt-1 line-clamp-2">
                                            {seg.description}
                                        </CardDescription>
                                    </div>
                                    <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-600 border border-emerald-500/20 shrink-0">
                                        <Users className="size-3.5" />
                                        {seg.count}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3 pt-0">
                                <div className="rounded bg-muted/40 p-2 text-[11px] font-mono text-muted-foreground">
                                    <span className="font-semibold text-foreground">Filter Rule:</span> {seg.criteria}
                                </div>

                                <div className="flex flex-wrap gap-1.5">
                                    {seg.tags.map((t, i) => (
                                        <span key={i} className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                                            <Tag className="size-2.5" />
                                            {t}
                                        </span>
                                    ))}
                                </div>

                                <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
                                    <span className="text-[11px] text-muted-foreground">
                                        Last sent: <span className="font-medium text-foreground">{seg.lastBroadcast}</span>
                                    </span>

                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 text-xs text-muted-foreground hover:text-red-600 p-1"
                                            onClick={() => setSegments(segments.filter(s => s.id !== seg.id))}
                                        >
                                            <Trash2 className="size-3.5" />
                                        </Button>

                                        <Button
                                            asChild
                                            size="sm"
                                            className="h-7 text-xs bg-[#47b672] hover:bg-[#3ca062] text-white"
                                        >
                                            <Link href="/campaigns">
                                                <Send className="size-3 mr-1" />
                                                Broadcast
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Create Segment Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-sm font-semibold flex items-center gap-2">
                            <Plus className="size-4 text-[#47b672]" />
                            Create Dynamic Audience Segment
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Define matching criteria to group contacts for targeted campaigns.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleCreateSegment} className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium">Segment Name</Label>
                            <Input
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder="e.g. Surat Diwali Offer Leads"
                                className="text-xs"
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium">Description</Label>
                            <Input
                                value={newDesc}
                                onChange={(e) => setNewDesc(e.target.value)}
                                placeholder="e.g. Prospects interested in seasonal festive discount"
                                className="text-xs"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium">Match Contact Tag</Label>
                            <Input
                                value={newTag}
                                onChange={(e) => setNewTag(e.target.value)}
                                placeholder="e.g. Diwali-Special"
                                className="text-xs"
                            />
                        </div>

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setIsCreateOpen(false)}
                                className="text-xs"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                size="sm"
                                className="bg-[#47b672] hover:bg-[#3ca062] text-white text-xs"
                            >
                                Create Segment
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
