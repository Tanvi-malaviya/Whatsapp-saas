import { useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import {
    Building2,
    Save,
    Users,
    Shield,
    Globe,
    Check,
    Mail,
    Plus,
    UserPlus,
    Trash2,
    KeyRound,
    Clock,
    DollarSign,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function OrganizationSettings() {
    const { tenant } = usePage().props as any;
    const currentOrg = tenant?.current;

    const [name, setName] = useState(currentOrg?.name || 'Sathwara InfoTech');
    const [slug, setSlug] = useState(currentOrg?.slug || 'sathwara-infotech');
    const [email, setEmail] = useState('support@sathwarainfotech.com');
    const [timezone, setTimezone] = useState('Asia/Kolkata (IST +05:30)');
    const [currency, setCurrency] = useState('INR (₹)');
    const [wabaId, setWabaId] = useState('799788166562792');
    const [appSecret, setAppSecret] = useState('02d9ac2a37b98b8b29a189f835c13027');
    const [saved, setSaved] = useState(false);

    const [teamMembers, setTeamMembers] = useState([
        { id: '1', name: 'Bhavesh Sathwara', email: 'bhavesh@sathwarainfotech.com', role: 'Owner', status: 'Active' },
        { id: '2', name: 'Tanvi Malaviya', email: 'tanvi@sathwarainfotech.com', role: 'Admin', status: 'Active' },
        { id: '3', name: 'Support Agent', email: 'agent@sathwarainfotech.com', role: 'Agent', status: 'Invited' },
    ]);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    };

    return (
        <>
            <Head title="Organization Settings - Sathwara InfoTech" />

            <div className="space-y-6">
                <div>
                    <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <Building2 className="size-5 text-[#47b672]" />
                        Organization &amp; Workspace Settings
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Manage your company profile, timezone, team members, and WhatsApp Business API configurations.
                    </p>
                </div>

                <form onSubmit={handleSave} className="space-y-6">
                    {/* General Company Info */}
                    <Card className="border-border shadow-2xs">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <Globe className="size-4 text-[#47b672]" />
                                Company Profile
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Basic details displayed across your customer WhatsApp messages and invoices.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium">Business / Organization Name</Label>
                                    <Input
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="e.g. Sathwara InfoTech"
                                        className="text-xs"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium">Workspace Slug (URL)</Label>
                                    <div className="flex items-center rounded-md border border-input bg-muted/30 px-3 text-xs text-muted-foreground">
                                        <span className="font-mono">app.xobito.com/</span>
                                        <Input
                                            value={slug}
                                            onChange={(e) => setSlug(e.target.value)}
                                            className="border-0 bg-transparent p-0 text-xs shadow-none focus-visible:ring-0"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium flex items-center gap-1">
                                        <Mail className="size-3 text-muted-foreground" />
                                        Support Email
                                    </Label>
                                    <Input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="text-xs"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium flex items-center gap-1">
                                        <Clock className="size-3 text-muted-foreground" />
                                        Default Timezone
                                    </Label>
                                    <Input
                                        value={timezone}
                                        onChange={(e) => setTimezone(e.target.value)}
                                        className="text-xs"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium flex items-center gap-1">
                                        <DollarSign className="size-3 text-muted-foreground" />
                                        Default Currency
                                    </Label>
                                    <Input
                                        value={currency}
                                        onChange={(e) => setCurrency(e.target.value)}
                                        className="text-xs"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Meta WhatsApp Cloud Credentials */}
                    <Card className="border-border shadow-2xs">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <KeyRound className="size-4 text-emerald-600" />
                                Meta WhatsApp Business Account (WABA)
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Credentials linked to your Meta Developer App and Business Portfolio.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium">WhatsApp Business Account ID (WABA ID)</Label>
                                    <Input
                                        value={wabaId}
                                        onChange={(e) => setWabaId(e.target.value)}
                                        className="text-xs font-mono"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium">Meta App Secret</Label>
                                    <Input
                                        type="password"
                                        value={appSecret}
                                        onChange={(e) => setAppSecret(e.target.value)}
                                        className="text-xs font-mono"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Save Button */}
                    <div className="flex items-center justify-between">
                        {saved ? (
                            <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                <Check className="size-4" />
                                Organization settings saved successfully!
                            </span>
                        ) : <span />}

                        <Button type="submit" size="sm" className="bg-[#47b672] hover:bg-[#3ca062] text-white">
                            <Save className="size-3.5 mr-1.5" />
                            Save Organization
                        </Button>
                    </div>
                </form>

                {/* Team Members Management */}
                <Card className="border-border shadow-2xs">
                    <CardHeader className="pb-3 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <Users className="size-4 text-[#47b672]" />
                                Team Members &amp; Permissions
                            </CardTitle>
                            <CardDescription className="text-xs mt-0.5">
                                Manage agents who have access to WhatsApp Live Chat and broadcasts.
                            </CardDescription>
                        </div>
                        <Button size="sm" variant="outline" className="text-xs h-8 border-border">
                            <UserPlus className="size-3.5 mr-1.5 text-[#47b672]" />
                            Invite Member
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="border-b border-border bg-muted/40 font-semibold text-muted-foreground">
                                    <tr>
                                        <th className="py-2.5 px-4">Member</th>
                                        <th className="py-2.5 px-4">Email</th>
                                        <th className="py-2.5 px-4">Role</th>
                                        <th className="py-2.5 px-4">Status</th>
                                        <th className="py-2.5 px-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/60">
                                    {teamMembers.map((m) => (
                                        <tr key={m.id} className="hover:bg-muted/30">
                                            <td className="py-2.5 px-4 font-semibold text-foreground">
                                                {m.name}
                                            </td>
                                            <td className="py-2.5 px-4 text-muted-foreground font-mono">
                                                {m.email}
                                            </td>
                                            <td className="py-2.5 px-4">
                                                <Badge variant="outline" className={`text-[10px] ${
                                                    m.role === 'Owner'
                                                        ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                                        : m.role === 'Admin'
                                                        ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                                                        : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                                }`}>
                                                    {m.role}
                                                </Badge>
                                            </td>
                                            <td className="py-2.5 px-4">
                                                <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium ${
                                                    m.status === 'Active' ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'
                                                }`}>
                                                    <span className={`size-1.5 rounded-full ${m.status === 'Active' ? 'bg-emerald-500' : 'bg-muted-foreground'}`}></span>
                                                    {m.status}
                                                </span>
                                            </td>
                                            <td className="py-2.5 px-4 text-right">
                                                {m.role !== 'Owner' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-7 w-7 p-0 text-muted-foreground hover:text-red-600"
                                                        onClick={() => setTeamMembers(teamMembers.filter(item => item.id !== m.id))}
                                                    >
                                                        <Trash2 className="size-3.5" />
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
