import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    Users,
    UserPlus,
    Shield,
    Key,
    Radio,
    Check,
    X,
    Lock,
    Unlock,
    Mail,
    Trash2,
    Edit2,
    CheckCircle2,
    AlertCircle,
    Save,
    Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface Member {
    id: number;
    name: string;
    email: string;
    role: 'Owner' | 'Admin' | 'Manager' | 'Agent' | 'Viewer';
    channel_access: string[];
    status: string;
    joined_at: string;
}

interface Invitation {
    id: number;
    email: string;
    role: string;
    created_at: string;
    expires_at: string | null;
    status: string;
}

interface Channel {
    id: string;
    name: string;
    phone_number: string;
    status: string;
}

interface TeamPageProps {
    members: Member[];
    invitations: Invitation[];
    channels: Channel[];
    roles: string[];
    permissionMatrix: Record<string, Record<string, Record<string, boolean>>>;
    currentUserId: number;
}

const ROLE_BADGES: Record<string, string> = {
    Owner: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30',
    Admin: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
    Manager: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
    Agent: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    Viewer: 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30',
};

export default function TeamManagementPage({
    members: initialMembers = [],
    invitations = [],
    channels = [],
    roles = ['Owner', 'Admin', 'Manager', 'Agent', 'Viewer'],
    permissionMatrix: initialMatrix = {},
    currentUserId,
}: TeamPageProps) {
    const [matrix, setMatrix] = useState(initialMatrix);
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<'Owner' | 'Admin' | 'Manager' | 'Agent' | 'Viewer'>('Agent');
    const [inviteChannels, setInviteChannels] = useState<string[]>([]);

    // Edit Member Modal
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editMember, setEditMember] = useState<Member | null>(null);
    const [editRole, setEditRole] = useState<'Owner' | 'Admin' | 'Manager' | 'Agent' | 'Viewer'>('Agent');
    const [editChannels, setEditChannels] = useState<string[]>([]);

    // Permission Categories
    const categories = [
        { key: 'organizations', label: 'Organizations & Workspaces', actions: ['view', 'create', 'edit', 'delete'] },
        { key: 'whatsapp_accounts', label: 'WhatsApp Channels & Numbers', actions: ['view', 'create', 'edit', 'delete'] },
        { key: 'inbox', label: 'Shared Inbox & Conversations', actions: ['view', 'reply', 'assign', 'delete'] },
        { key: 'campaigns', label: 'Broadcast Campaigns', actions: ['view', 'create', 'send', 'delete'] },
        { key: 'templates', label: 'Meta Templates & Media Headers', actions: ['view', 'create', 'edit', 'delete'] },
        { key: 'automation', label: 'Bot Flows, Auto-Responder & AI', actions: ['view', 'create', 'edit', 'delete'] },
        { key: 'crm', label: 'CRM Leads, Contacts & Segments', actions: ['view', 'create', 'edit', 'delete'] },
        { key: 'billing', label: 'Billing, Invoices & Plan Upgrades', actions: ['view', 'edit', 'manage_plan'] },
    ];

    // Toggle Matrix Cell
    const togglePermission = (role: string, category: string, action: string) => {
        if (role === 'Owner') return; // Owner always has all rights
        setMatrix((prev) => {
            const copy = JSON.parse(JSON.stringify(prev));
            if (!copy[role]) copy[role] = {};
            if (!copy[role][category]) copy[role][category] = {};
            copy[role][category][action] = !copy[role][category][action];
            return copy;
        });
    };

    // Save Permissions Matrix
    const handleSavePermissions = () => {
        router.post(
            '/management/team/permissions',
            { matrix },
            { preserveScroll: true }
        );
    };

    // Send Invitation
    const handleSendInvite = (e: React.FormEvent) => {
        e.preventDefault();
        router.post(
            '/management/team/invite',
            {
                email: inviteEmail,
                role: inviteRole,
                channel_access: inviteChannels,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsInviteOpen(false);
                    setInviteEmail('');
                    setInviteRole('Agent');
                    setInviteChannels([]);
                },
            }
        );
    };

    // Open Edit Member
    const openEditMember = (m: Member) => {
        setEditMember(m);
        setEditRole(m.role);
        setEditChannels(m.channel_access || []);
        setIsEditOpen(true);
    };

    // Update Member
    const handleUpdateMember = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editMember) return;
        router.post(
            '/management/team/update-member',
            {
                user_id: editMember.id,
                role: editRole,
                channel_access: editChannels,
            },
            {
                preserveScroll: true,
                onSuccess: () => setIsEditOpen(false),
            }
        );
    };

    // Remove Member
    const handleRemoveMember = (id: number) => {
        if (!confirm('Are you sure you want to remove this user from the workspace?')) return;
        router.delete(`/management/team/member/${id}`, { preserveScroll: true });
    };

    return (
        <>
            <Head title="Team & Permissions Management | Sathwara InfoTech" />

            <div className="flex flex-1 flex-col gap-4 p-4 sm:p-6 max-w-7xl mx-auto w-full font-sans">
                {/* Header Banner */}
                <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-background to-card p-4 sm:p-6 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-primary text-white shadow-md">
                                <Users className="size-6" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                                        Team &amp; Roles Management
                                    </h1>
                                    <Badge variant="outline" className="text-xs font-bold border-indigo-500/40 text-indigo-600 dark:text-indigo-400">
                                        V2 Multi-Agent
                                    </Badge>
                                </div>
                                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                                    Manage team members, channel routing restrictions, and granular role permissions matrix.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2.5">
                            <Button
                                onClick={() => setIsInviteOpen(true)}
                                className="h-9 px-4 text-xs font-semibold gap-1.5 shadow-sm"
                            >
                                <UserPlus className="size-4" />
                                Invite Team Member
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Tabs Navigation */}
                <Tabs defaultValue="members" className="w-full">
                    <TabsList className="grid grid-cols-2 w-full max-w-md h-10 p-1 bg-muted/60 border border-border/60">
                        <TabsTrigger value="members" className="text-xs font-semibold gap-1.5">
                            <Users className="size-3.5" />
                            Team Members ({initialMembers.length})
                        </TabsTrigger>
                        <TabsTrigger value="permissions" className="text-xs font-semibold gap-1.5">
                            <Shield className="size-3.5" />
                            Role Permission Matrix
                        </TabsTrigger>
                    </TabsList>

                    {/* TAB 1: MEMBERS */}
                    <TabsContent value="members" className="space-y-4 mt-4">
                        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-2xs">
                            <div className="p-4 border-b border-border/60 bg-muted/20 flex items-center justify-between">
                                <div>
                                    <h2 className="text-sm font-bold text-foreground">Active Team Members</h2>
                                    <p className="text-xs text-muted-foreground">
                                        Users who have access to manage WhatsApp conversations, campaigns, and templates.
                                    </p>
                                </div>
                                <span className="text-xs font-medium text-muted-foreground">
                                    {initialMembers.length} active seat{initialMembers.length === 1 ? '' : 's'}
                                </span>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-xs text-left">
                                    <thead className="bg-muted/40 text-muted-foreground uppercase text-[10px] font-bold tracking-wider border-b border-border/60">
                                        <tr>
                                            <th className="px-4 py-3">Member</th>
                                            <th className="px-4 py-3">Role</th>
                                            <th className="px-4 py-3">Allowed Channels</th>
                                            <th className="px-4 py-3">Status</th>
                                            <th className="px-4 py-3">Joined</th>
                                            <th className="px-4 py-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/50">
                                        {initialMembers.map((m) => {
                                            const isSelf = m.id === currentUserId;
                                            const roleClass = ROLE_BADGES[m.role] || ROLE_BADGES.Agent;

                                            return (
                                                <tr key={m.id} className="hover:bg-muted/30 transition-colors">
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase">
                                                                {m.name.slice(0, 2)}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-foreground flex items-center gap-1.5">
                                                                    {m.name}
                                                                    {isSelf && (
                                                                        <Badge variant="secondary" className="text-[9px] px-1 py-0 font-bold">
                                                                            You
                                                                        </Badge>
                                                                    )}
                                                                </p>
                                                                <p className="text-muted-foreground text-[11px] font-mono">
                                                                    {m.email}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${roleClass}`}>
                                                            {m.role}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {m.channel_access && m.channel_access.length > 0 ? (
                                                            <div className="flex flex-wrap gap-1">
                                                                {m.channel_access.map((chId) => {
                                                                    const ch = channels.find((c) => c.id === chId);
                                                                    return (
                                                                        <span
                                                                            key={chId}
                                                                            className="inline-flex items-center gap-1 bg-muted px-1.5 py-0.5 rounded text-[10px] font-semibold text-foreground"
                                                                        >
                                                                            <Radio className="size-2 text-emerald-600" />
                                                                            {ch ? ch.name : chId}
                                                                        </span>
                                                                    );
                                                                })}
                                                            </div>
                                                        ) : (
                                                            <span className="text-[11px] font-semibold text-muted-foreground">
                                                                All Channels (Global)
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                                                            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                            Active
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-muted-foreground text-[11px]">
                                                        {m.joined_at}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => openEditMember(m)}
                                                                className="h-7 px-2 text-xs font-semibold gap-1"
                                                            >
                                                                <Edit2 className="size-3" />
                                                                Edit
                                                            </Button>
                                                            {!isSelf && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleRemoveMember(m.id)}
                                                                    className="h-7 px-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-500/10"
                                                                >
                                                                    <Trash2 className="size-3" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Pending Invitations Table */}
                        {invitations.length > 0 && (
                            <div className="rounded-xl border border-border bg-card overflow-hidden shadow-2xs mt-4">
                                <div className="p-4 border-b border-border/60 bg-muted/20">
                                    <h3 className="text-sm font-bold text-foreground">Pending Invitations</h3>
                                    <p className="text-xs text-muted-foreground">
                                        Invited teammates who have not completed signup yet.
                                    </p>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs text-left">
                                        <thead className="bg-muted/40 text-muted-foreground uppercase text-[10px] font-bold tracking-wider border-b border-border/60">
                                            <tr>
                                                <th className="px-4 py-3">Email</th>
                                                <th className="px-4 py-3">Role</th>
                                                <th className="px-4 py-3">Sent</th>
                                                <th className="px-4 py-3">Expires</th>
                                                <th className="px-4 py-3">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/50">
                                            {invitations.map((inv) => (
                                                <tr key={inv.id}>
                                                    <td className="px-4 py-3 font-semibold text-foreground">
                                                        {inv.email}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <Badge variant="outline" className="text-[11px] font-bold">
                                                            {inv.role}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-4 py-3 text-muted-foreground">
                                                        {inv.created_at}
                                                    </td>
                                                    <td className="px-4 py-3 text-muted-foreground">
                                                        {inv.expires_at || 'In 7 days'}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="text-[11px] font-bold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full">
                                                            Pending
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </TabsContent>

                    {/* TAB 2: PERMISSIONS MATRIX */}
                    <TabsContent value="permissions" className="space-y-4 mt-4">
                        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-2xs">
                            <div className="p-4 border-b border-border/60 bg-muted/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div>
                                    <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                                        <Shield className="size-4 text-primary" />
                                        Granular Roles &amp; Permissions Matrix
                                    </h2>
                                    <p className="text-xs text-muted-foreground">
                                        Define what each role can view, create, edit, or delete across all 8 modules.
                                    </p>
                                </div>
                                <Button
                                    onClick={handleSavePermissions}
                                    size="sm"
                                    className="gap-1.5 text-xs font-semibold shadow-sm self-start sm:self-auto"
                                >
                                    <Save className="size-3.5" />
                                    Save Permission Matrix
                                </Button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-xs text-left border-collapse">
                                    <thead>
                                        <tr className="bg-muted/50 border-b border-border/70 text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
                                            <th className="px-4 py-3 min-w-[200px]">Module / Category</th>
                                            <th className="px-3 py-3 min-w-[120px]">Action</th>
                                            {roles.map((r) => (
                                                <th key={r} className="px-3 py-3 text-center min-w-[90px]">
                                                    <span className={`inline-block px-2 py-0.5 rounded-md border text-[10px] font-extrabold ${ROLE_BADGES[r]}`}>
                                                        {r}
                                                    </span>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/40">
                                        {categories.map((cat) => (
                                            <React.Fragment key={cat.key}>
                                                {cat.actions.map((act, actIndex) => (
                                                    <tr
                                                        key={`${cat.key}_${act}`}
                                                        className={`hover:bg-muted/30 transition-colors ${
                                                            actIndex === 0 ? 'border-t-2 border-border/70' : ''
                                                        }`}
                                                    >
                                                        {actIndex === 0 ? (
                                                            <td
                                                                rowSpan={cat.actions.length}
                                                                className="px-4 py-3 font-bold text-foreground align-top bg-muted/10 border-r border-border/60"
                                                            >
                                                                <p className="text-xs">{cat.label}</p>
                                                            </td>
                                                        ) : null}

                                                        <td className="px-3 py-2 text-[11px] font-semibold text-muted-foreground capitalize border-r border-border/40">
                                                            {act.replace('_', ' ')}
                                                        </td>

                                                        {roles.map((role) => {
                                                            const isOwner = role === 'Owner';
                                                            const isAllowed = isOwner || !!matrix[role]?.[cat.key]?.[act];

                                                            return (
                                                                <td key={role} className="px-3 py-2 text-center">
                                                                    <button
                                                                        type="button"
                                                                        disabled={isOwner}
                                                                        onClick={() => togglePermission(role, cat.key, act)}
                                                                        className={`size-6 rounded-md inline-flex items-center justify-center transition-all ${
                                                                            isAllowed
                                                                                ? 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30 hover:bg-emerald-500/25'
                                                                                : 'bg-muted text-muted-foreground/40 border border-border/60 hover:text-muted-foreground'
                                                                        } ${isOwner ? 'cursor-not-allowed opacity-90' : 'cursor-pointer'}`}
                                                                    >
                                                                        {isAllowed ? (
                                                                            <Check className="size-3.5 stroke-[2.5]" />
                                                                        ) : (
                                                                            <X className="size-3.5" />
                                                                        )}
                                                                    </button>
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                ))}
                                            </React.Fragment>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>

                {/* Dialog: Invite Team Member */}
                <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                    <DialogContent className="sm:max-w-[480px]">
                        <DialogHeader>
                            <DialogTitle className="text-base font-bold flex items-center gap-2">
                                <UserPlus className="size-4 text-primary" />
                                Invite New Team Member
                            </DialogTitle>
                            <DialogDescription className="text-xs">
                                Send an email invitation with tailored role permissions and WhatsApp channel access.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSendInvite} className="space-y-3.5 pt-2">
                            <div>
                                <label className="text-xs font-semibold text-foreground">Email Address *</label>
                                <input
                                    type="email"
                                    required
                                    placeholder="agent@sathwarainfotech.com"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    className="mt-1 w-full h-8 px-2.5 rounded-lg border border-border bg-background text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-foreground">Role</label>
                                <select
                                    value={inviteRole}
                                    onChange={(e) => setInviteRole(e.target.value as any)}
                                    className="mt-1 w-full h-8 px-2.5 rounded-lg border border-border bg-background text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                                >
                                    {roles.map((r) => (
                                        <option key={r} value={r}>
                                            {r} {r === 'Owner' ? '(Full Access)' : r === 'Agent' ? '(Inbox & CRM only)' : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-foreground">
                                    WhatsApp Channels Allowed
                                </label>
                                <p className="text-[11px] text-muted-foreground mb-1.5">
                                    Select which phone numbers this user can see and reply to (leave unselected for all channels).
                                </p>
                                <div className="space-y-1.5 max-h-36 overflow-y-auto border border-border rounded-lg p-2 bg-muted/20">
                                    {channels.map((ch) => {
                                        const isChecked = inviteChannels.includes(ch.id);
                                        return (
                                            <label
                                                key={ch.id}
                                                className="flex items-center gap-2 p-1.5 rounded hover:bg-muted/50 cursor-pointer text-xs"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setInviteChannels([...inviteChannels, ch.id]);
                                                        } else {
                                                            setInviteChannels(inviteChannels.filter((c) => c !== ch.id));
                                                        }
                                                    }}
                                                    className="size-3.5 rounded border-border"
                                                />
                                                <span className="font-semibold text-foreground">{ch.name}</span>
                                                <span className="text-muted-foreground font-mono text-[11px]">
                                                    ({ch.phone_number})
                                                </span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>

                            <DialogFooter className="pt-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsInviteOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" size="sm" className="gap-1.5">
                                    <Mail className="size-3.5" />
                                    Send Invitation
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Dialog: Edit Member */}
                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                    <DialogContent className="sm:max-w-[480px]">
                        <DialogHeader>
                            <DialogTitle className="text-base font-bold flex items-center gap-2">
                                <Edit2 className="size-4 text-primary" />
                                Edit Member Role &amp; Channel Access
                            </DialogTitle>
                            <DialogDescription className="text-xs">
                                Updating access for <strong className="text-foreground">{editMember?.name}</strong> (
                                {editMember?.email}).
                            </DialogDescription>
                        </DialogHeader>

                        {editMember && (
                            <form onSubmit={handleUpdateMember} className="space-y-3.5 pt-2">
                                <div>
                                    <label className="text-xs font-semibold text-foreground">Role</label>
                                    <select
                                        value={editRole}
                                        onChange={(e) => setEditRole(e.target.value as any)}
                                        className="mt-1 w-full h-8 px-2.5 rounded-lg border border-border bg-background text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                                    >
                                        {roles.map((r) => (
                                            <option key={r} value={r}>
                                                {r}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-foreground">
                                        Allowed WhatsApp Channels
                                    </label>
                                    <div className="space-y-1.5 max-h-36 overflow-y-auto border border-border rounded-lg p-2 bg-muted/20 mt-1">
                                        {channels.map((ch) => {
                                            const isChecked = editChannels.includes(ch.id);
                                            return (
                                                <label
                                                    key={ch.id}
                                                    className="flex items-center gap-2 p-1.5 rounded hover:bg-muted/50 cursor-pointer text-xs"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={isChecked}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setEditChannels([...editChannels, ch.id]);
                                                            } else {
                                                                setEditChannels(editChannels.filter((c) => c !== ch.id));
                                                            }
                                                        }}
                                                        className="size-3.5 rounded border-border"
                                                    />
                                                    <span className="font-semibold text-foreground">{ch.name}</span>
                                                    <span className="text-muted-foreground font-mono text-[11px]">
                                                        ({ch.phone_number})
                                                    </span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>

                                <DialogFooter className="pt-3">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setIsEditOpen(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="submit" size="sm" className="gap-1.5">
                                        Save Changes
                                    </Button>
                                </DialogFooter>
                            </form>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}
