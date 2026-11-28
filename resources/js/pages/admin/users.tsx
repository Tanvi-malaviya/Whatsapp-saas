import { useState, useMemo } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import {
    Users,
    Search,
    Crown,
    Shield,
    CheckCircle2,
    Building2,
    ShieldAlert,
    UserPlus,
    Lock,
    Sparkles,
    X,
    Pencil,
    Trash2,
    Eye,
    EyeOff,
    KeyRound,
    Briefcase,
    MoreHorizontal,
    UserCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type UserItem = {
    id: number;
    name: string;
    email: string;
    is_super_admin: boolean;
    is_b2b_agent?: boolean;
    referral_code?: string;
    organizations: Array<{
        id: string;
        name: string;
        role: string;
    }>;
    created_at: string;
};

type Props = {
    users: UserItem[];
};

export default function AdminUsers({ users = [] }: Props) {
    const { flash } = usePage().props as any;
    const [search, setSearch] = useState('');

    // Modal state for adding a new user
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [formName, setFormName] = useState('');
    const [formEmail, setFormEmail] = useState('');
    const [formPassword, setFormPassword] = useState('');
    const [showAddPassword, setShowAddPassword] = useState(false);
    const [formWorkspaceName, setFormWorkspaceName] = useState('');
    const [formMaxChannels, setFormMaxChannels] = useState<number>(1);
    const [formIsSuperAdmin, setFormIsSuperAdmin] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState('');

    // Modal state for editing user credentials
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editUserId, setEditUserId] = useState<number | null>(null);
    const [editName, setEditName] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [editPassword, setEditPassword] = useState('');
    const [showEditPassword, setShowEditPassword] = useState(false);
    const [editIsSuperAdmin, setEditIsSuperAdmin] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [editError, setEditError] = useState('');

    // Modal state for deleting a user
    const [deleteTarget, setDeleteTarget] = useState<UserItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Modal state for toggling super admin status
    const [adminToggleTarget, setAdminToggleTarget] = useState<UserItem | null>(null);
    const [isTogglingAdmin, setIsTogglingAdmin] = useState(false);

    const openAdminToggleModal = (u: UserItem) => {
        if (u.id === 1) return;
        setAdminToggleTarget(u);
    };

    const confirmToggleSuperAdmin = () => {
        if (!adminToggleTarget) return;
        if (adminToggleTarget.id === 1) {
            setAdminToggleTarget(null);
            return;
        }

        setIsTogglingAdmin(true);
        router.post(
            `/admin/users/${adminToggleTarget.id}/toggle-admin`,
            {},
            {
                onSuccess: () => {
                    setIsTogglingAdmin(false);
                    setAdminToggleTarget(null);
                },
                onError: () => {
                    setIsTogglingAdmin(false);
                },
            }
        );
    };

    const openEditModal = (u: UserItem) => {
        setEditError('');
        setEditUserId(u.id);
        setEditName(u.name);
        setEditEmail(u.email);
        setEditPassword('');
        setShowEditPassword(false);
        setEditIsSuperAdmin(u.is_super_admin);
        setIsEditModalOpen(true);
    };

    const openDeleteModal = (u: UserItem) => {
        if (u.id === 1) return;
        setDeleteTarget(u);
    };

    const confirmDeleteUser = () => {
        if (!deleteTarget) return;
        if (deleteTarget.id === 1) {
            setDeleteTarget(null);
            return;
        }

        setIsDeleting(true);
        router.delete(`/admin/users/${deleteTarget.id}`, {
            onSuccess: () => {
                setIsDeleting(false);
                setDeleteTarget(null);
            },
            onError: () => {
                setIsDeleting(false);
            },
        });
    };

    const handleUpdateUser = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editUserId) return;
        setEditError('');

        if (!editName.trim() || !editEmail.trim()) {
            setEditError('Please fill in Name and Email.');
            return;
        }

        if (editPassword && editPassword.length < 6) {
            setEditError('New password must be at least 6 characters.');
            return;
        }

        setIsUpdating(true);
        router.put(
            `/admin/users/${editUserId}`,
            {
                name: editName.trim(),
                email: editEmail.trim(),
                password: editPassword || undefined,
                is_super_admin: editIsSuperAdmin,
            },
            {
                onSuccess: () => {
                    setIsUpdating(false);
                    setIsEditModalOpen(false);
                    setEditUserId(null);
                    setEditPassword('');
                },
                onError: (errors) => {
                    setIsUpdating(false);
                    const firstError = Object.values(errors)[0] as string;
                    setEditError(firstError || 'Failed to update user credentials.');
                },
            }
        );
    };

    const handleAddUser = (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');

        if (!formName.trim() || !formEmail.trim() || !formPassword.trim()) {
            setFormError('Please fill in Name, Email, and Password.');
            return;
        }

        setIsSubmitting(true);
        router.post(
            '/admin/users',
            {
                name: formName.trim(),
                email: formEmail.trim(),
                password: formPassword,
                workspace_name: formWorkspaceName.trim() || undefined,
                max_channels: Number(formMaxChannels),
                is_super_admin: formIsSuperAdmin,
            },
            {
                onSuccess: () => {
                    setIsSubmitting(false);
                    setIsAddModalOpen(false);
                    setFormName('');
                    setFormEmail('');
                    setFormPassword('');
                    setFormWorkspaceName('');
                    setFormMaxChannels(1);
                    setFormIsSuperAdmin(false);
                },
                onError: (errors) => {
                    setIsSubmitting(false);
                    const firstError = Object.values(errors)[0] as string;
                    setFormError(firstError || 'Failed to create user.');
                },
            }
        );
    };

    const [roleFilter, setRoleFilter] = useState<'all' | 'admins' | 'partners' | 'clients'>('all');

    const filtered = useMemo(() => {
        return users.filter((u) => {
            const matchesSearch =
                u.name.toLowerCase().includes(search.toLowerCase()) ||
                u.email.toLowerCase().includes(search.toLowerCase());
            if (!matchesSearch) return false;

            if (roleFilter === 'admins' && !u.is_super_admin) return false;
            if (roleFilter === 'partners' && !u.is_b2b_agent) return false;
            if (roleFilter === 'clients' && (u.is_super_admin || u.is_b2b_agent)) return false;

            return true;
        });
    }, [users, search, roleFilter]);

    const superAdminCount = useMemo(() => users.filter((u) => u.is_super_admin).length, [users]);
    const partnerCount = useMemo(() => users.filter((u) => u.is_b2b_agent).length, [users]);
    const clientCount = useMemo(() => users.filter((u) => !u.is_super_admin && !u.is_b2b_agent).length, [users]);

    return (
        <>
            <Head title="System Users - Super Admin" />

            <div className="space-y-3.5 max-w-7xl mx-auto pb-8">
                {/* Header Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card border border-border/70 rounded-2xl p-4 sm:p-5 shadow-2xs">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                                System Users Directory
                            </h1>
                            <Badge variant="outline" className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/25 text-[10px] font-bold uppercase tracking-wider">
                                Access Control
                            </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Manage user accounts, B2B partner status, super administrator privileges, and assigned workspaces.
                        </p>
                    </div>

                    <Button
                        onClick={() => {
                            setFormError('');
                            setIsAddModalOpen(true);
                        }}
                        size="sm"
                        className="h-8 px-3 text-xs font-semibold gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xs rounded-xl self-start sm:self-auto cursor-pointer"
                    >
                        <UserPlus className="size-3.5" />
                        <span>Add New User</span>
                    </Button>
                </div>

                {/* Sleek, Compact Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                    <div className="flex items-center justify-between rounded-xl border border-border/70 bg-card px-3.5 py-2.5 shadow-2xs">
                        <div className="flex items-center gap-2">
                            <div className="size-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                                <Users className="size-3.5" />
                            </div>
                            <span className="text-xs font-medium text-muted-foreground">Total Users</span>
                        </div>
                        <span className="text-base font-bold tabular-nums text-foreground">{users.length}</span>
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-rose-500/20 bg-rose-500/5 px-3.5 py-2.5 shadow-2xs">
                        <div className="flex items-center gap-2">
                            <div className="size-7 rounded-lg bg-rose-500/15 text-rose-600 flex items-center justify-center">
                                <Crown className="size-3.5" />
                            </div>
                            <span className="text-xs font-semibold text-rose-700 dark:text-rose-400">Super Admins</span>
                        </div>
                        <span className="text-base font-bold tabular-nums text-rose-600 dark:text-rose-400">{superAdminCount}</span>
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3.5 py-2.5 shadow-2xs">
                        <div className="flex items-center gap-2">
                            <div className="size-7 rounded-lg bg-emerald-500/15 text-emerald-600 flex items-center justify-center">
                                <Briefcase className="size-3.5" />
                            </div>
                            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">B2B Partners</span>
                        </div>
                        <span className="text-base font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{partnerCount}</span>
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-border/70 bg-card px-3.5 py-2.5 shadow-2xs">
                        <div className="flex items-center gap-2">
                            <div className="size-7 rounded-lg bg-muted text-muted-foreground flex items-center justify-center">
                                <Building2 className="size-3.5" />
                            </div>
                            <span className="text-xs font-medium text-muted-foreground">Regular Clients</span>
                        </div>
                        <span className="text-base font-bold tabular-nums text-foreground">{clientCount}</span>
                    </div>
                </div>

                {/* Flash Notice */}
                {flash?.success && (
                    <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-2 text-xs text-emerald-700 dark:text-emerald-300">
                        <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600" />
                        <span>{flash.success}</span>
                    </div>
                )}
                {flash?.error && (
                    <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 px-3.5 py-2 text-xs text-rose-700 dark:text-rose-300">
                        <span>{flash.error}</span>
                    </div>
                )}

                {/* Search & Filter Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 bg-card border border-border/70 rounded-xl p-2.5 shadow-2xs">
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                        <Input
                            placeholder="Search by user name or email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 text-xs h-8 bg-muted/40"
                        />
                    </div>

                    {/* Segmented Color-Coded Tabs */}
                    <div className="inline-flex items-center gap-1 p-1 bg-muted/60 border border-border/60 rounded-xl w-full sm:w-auto overflow-x-auto">
                        <button
                            type="button"
                            onClick={() => setRoleFilter('all')}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                roleFilter === 'all'
                                    ? 'bg-background text-foreground shadow-xs border border-border/60'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            <span>All</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                                roleFilter === 'all' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                            }`}>
                                {users.length}
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setRoleFilter('admins')}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                roleFilter === 'admins'
                                    ? 'bg-rose-600 text-white shadow-xs'
                                    : 'text-rose-600 hover:bg-rose-500/10'
                            }`}
                        >
                            <span>Admins</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                                roleFilter === 'admins' ? 'bg-white/25 text-white' : 'bg-rose-500/15 text-rose-600'
                            }`}>
                                {superAdminCount}
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setRoleFilter('partners')}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                roleFilter === 'partners'
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'text-emerald-600 hover:bg-emerald-500/10'
                            }`}
                        >
                            <span>Partners</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                                roleFilter === 'partners' ? 'bg-white/25 text-white' : 'bg-emerald-500/15 text-emerald-600'
                            }`}>
                                {partnerCount}
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setRoleFilter('clients')}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                roleFilter === 'clients'
                                    ? 'bg-background text-foreground shadow-xs border border-border/60'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            <span>Clients</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                                roleFilter === 'clients' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                            }`}>
                                {clientCount}
                            </span>
                        </button>
                    </div>
                </div>

                {/* Users Table */}
                <Card className="border-border/70 shadow-2xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[650px] text-left text-xs">
                            <thead className="bg-muted/50 border-b border-border/70 text-muted-foreground uppercase tracking-wider text-[10px] font-semibold">
                                <tr>
                                    <th className="py-2.5 px-3">User Profile</th>
                                    <th className="py-2.5 px-3">Roles &amp; Privileges</th>
                                    <th className="py-2.5 px-3">Assigned Workspaces</th>
                                    <th className="py-2.5 px-3">Registered Date</th>
                                    <th className="py-2.5 px-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60">
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-8 text-center text-muted-foreground text-xs">
                                            No users found matching your search.
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map((u) => {
                                        const initials = u.name
                                            .split(' ')
                                            .map((part) => part[0])
                                            .filter(Boolean)
                                            .join('')
                                            .slice(0, 2)
                                            .toUpperCase() || 'U';

                                        return (
                                            <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                                                {/* User Profile */}
                                                <td className="py-2.5 px-3">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="size-8 rounded-xl bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0 uppercase border border-primary/20">
                                                            {initials}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="font-semibold text-xs text-foreground leading-tight">
                                                                <span className="truncate">{u.name}</span>
                                                            </div>
                                                            <div className="text-[11px] text-muted-foreground truncate leading-tight mt-0.5">
                                                                {u.email}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Roles & Privileges */}
                                                <td className="py-2.5 px-3">
                                                    <div className="flex flex-wrap items-center gap-1">
                                                        {u.is_super_admin ? (
                                                            <Badge variant="outline" className="text-[10px] bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25 font-bold gap-1 px-1.5 py-0.5">
                                                                <Crown className="size-2.5 text-rose-500" />
                                                                <span>Super Admin</span>
                                                            </Badge>
                                                        ) : null}

                                                        {u.is_b2b_agent ? (
                                                            <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25 font-bold gap-1 px-1.5 py-0.5">
                                                                <Briefcase className="size-2.5 text-emerald-600" />
                                                                <span>Partner</span>
                                                            </Badge>
                                                        ) : null}

                                                        {!u.is_super_admin && !u.is_b2b_agent ? (
                                                            <Badge variant="secondary" className="text-[10px] text-muted-foreground font-medium px-1.5 py-0.5">
                                                                Regular Client
                                                            </Badge>
                                                        ) : null}
                                                    </div>
                                                </td>

                                                {/* Assigned Workspaces */}
                                                <td className="py-2.5 px-3">
                                                    <div className="flex flex-wrap items-center gap-1.5 py-0.5">
                                                        {u.organizations.length === 0 ? (
                                                            <span className="text-[11px] text-muted-foreground italic">No workspace assigned</span>
                                                        ) : (
                                                            u.organizations.map((org) => (
                                                                <span
                                                                    key={org.id}
                                                                    className="inline-flex items-center gap-1.5 text-[11px] bg-muted/60 hover:bg-muted text-foreground px-2 py-0.5 rounded-md border border-border/80 leading-tight transition-colors shadow-2xs"
                                                                >
                                                                    <Building2 className="size-3 text-muted-foreground shrink-0" />
                                                                    <span className="font-medium whitespace-nowrap">{org.name}</span>
                                                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded leading-none ${
                                                                        org.role === 'Owner'
                                                                            ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/25'
                                                                            : org.role === 'Admin'
                                                                                ? 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border border-indigo-500/25'
                                                                                : 'bg-primary/10 text-primary border border-primary/20'
                                                                    }`}>
                                                                        {org.role}
                                                                    </span>
                                                                </span>
                                                            ))
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Registered Date */}
                                                <td className="py-2.5 px-3 text-xs text-muted-foreground whitespace-nowrap">
                                                    {u.created_at}
                                                </td>

                                                {/* Actions */}
                                                <td className="py-2.5 px-3 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => openEditModal(u)}
                                                            className="h-7 text-xs font-medium px-2 gap-1 border-border/80 hover:bg-muted rounded-lg"
                                                            title="Edit Credentials"
                                                        >
                                                            <Pencil className="size-3" />
                                                            <span>Edit</span>
                                                        </Button>

                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    className="size-7 p-0 text-muted-foreground hover:text-foreground rounded-lg cursor-pointer"
                                                                >
                                                                    <MoreHorizontal className="size-3.5" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="w-48 text-xs">
                                                                <DropdownMenuItem
                                                                    onClick={() => router.post(`/admin/users/${u.id}/toggle-agent`)}
                                                                    className="cursor-pointer gap-2"
                                                                >
                                                                    <Briefcase className="size-3.5 text-emerald-600" />
                                                                    <span>{u.is_b2b_agent ? 'Revoke B2B Partner' : 'Grant B2B Partner'}</span>
                                                                </DropdownMenuItem>

                                                                {u.id !== 1 && (
                                                                    <DropdownMenuItem
                                                                        onClick={() => openAdminToggleModal(u)}
                                                                        className="cursor-pointer gap-2"
                                                                    >
                                                                        <Crown className="size-3.5 text-rose-500" />
                                                                        <span>{u.is_super_admin ? 'Revoke Admin Role' : 'Make Super Admin'}</span>
                                                                    </DropdownMenuItem>
                                                                )}

                                                                {u.id !== 1 && (
                                                                    <>
                                                                        <DropdownMenuSeparator />
                                                                        <DropdownMenuItem
                                                                            onClick={() => openDeleteModal(u)}
                                                                            className="cursor-pointer gap-2 text-rose-600 focus:text-rose-600 focus:bg-rose-500/10"
                                                                        >
                                                                            <Trash2 className="size-3.5" />
                                                                            <span>Delete User Account</span>
                                                                        </DropdownMenuItem>
                                                                    </>
                                                                )}
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

            {/* Add New User & Workspace Modal */}
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent className="max-w-lg p-5 gap-4">
                    <DialogHeader className="pb-1">
                        <div className="flex items-center gap-2.5">
                            <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                <UserPlus className="size-4" />
                            </div>
                            <div>
                                <DialogTitle className="text-base font-bold text-foreground">Add New User &amp; Workspace</DialogTitle>
                                <DialogDescription className="text-xs text-muted-foreground">
                                    Create a new client login and set their WhatsApp number quota.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    {formError && (
                        <div className="p-2.5 text-xs bg-rose-500/10 border border-rose-500/20 text-rose-600 rounded-lg">
                            {formError}
                        </div>
                    )}

                    <form onSubmit={handleAddUser} className="space-y-3">
                        {/* Row 1: Name & Email */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs font-semibold">Full Name *</Label>
                                <Input
                                    required
                                    placeholder="e.g. Rahul Sharma"
                                    value={formName}
                                    onChange={(e) => setFormName(e.target.value)}
                                    className="h-8 text-xs"
                                />
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs font-semibold">Email Address *</Label>
                                <Input
                                    required
                                    type="email"
                                    placeholder="e.g. rahul@example.com"
                                    value={formEmail}
                                    onChange={(e) => setFormEmail(e.target.value)}
                                    className="h-8 text-xs"
                                />
                            </div>
                        </div>

                        {/* Row 2: Password & Workspace Name */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs font-semibold">Password *</Label>
                                <div className="relative">
                                    <Input
                                        required
                                        type={showAddPassword ? 'text' : 'password'}
                                        placeholder="Min 6 characters"
                                        value={formPassword}
                                        onChange={(e) => setFormPassword(e.target.value)}
                                        className="h-8 text-xs pr-8"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowAddPassword(!showAddPassword)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                                        tabIndex={-1}
                                    >
                                        {showAddPassword ? (
                                            <EyeOff className="size-3.5" />
                                        ) : (
                                            <Eye className="size-3.5" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs font-semibold">Workspace Name (Optional)</Label>
                                <Input
                                    placeholder={formName ? `${formName}'s Workspace` : 'e.g. Apex Traders'}
                                    value={formWorkspaceName}
                                    onChange={(e) => setFormWorkspaceName(e.target.value)}
                                    className="h-8 text-xs"
                                />
                            </div>
                        </div>

                        {/* Row 3: WhatsApp Number Quota - Compact 4-pill selector */}
                        <div className="space-y-1.5 pt-0.5">
                            <Label className="text-xs font-semibold">WhatsApp Number Limit (Quota)</Label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                                {[
                                    { val: 1, label: 'Single (1)', icon: Lock, active: 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold' },
                                    { val: 2, label: 'Dual (2)', icon: Sparkles, active: 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold' },
                                    { val: 5, label: 'Multi (5)', icon: Sparkles, active: 'border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold' },
                                    { val: 0, label: 'Unlimited', icon: Crown, active: 'border-purple-500 bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold' },
                                ].map((opt) => {
                                    const Icon = opt.icon;
                                    const isSelected = formMaxChannels === opt.val;
                                    return (
                                        <button
                                            key={opt.val}
                                            type="button"
                                            onClick={() => setFormMaxChannels(opt.val)}
                                            className={`h-8 px-2 rounded-lg border text-xs flex items-center justify-center gap-1 transition-all ${
                                                isSelected
                                                    ? opt.active + ' shadow-2xs'
                                                    : 'border-border/80 bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground'
                                            }`}
                                        >
                                            <Icon className="size-3 shrink-0" />
                                            <span>{opt.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Super Admin Checkbox */}
                        <div className="pt-0.5">
                            <label className="inline-flex items-center gap-2 cursor-pointer text-xs select-none">
                                <input
                                    type="checkbox"
                                    checked={formIsSuperAdmin}
                                    onChange={(e) => setFormIsSuperAdmin(e.target.checked)}
                                    className="size-3.5 rounded text-rose-600 focus:ring-rose-500"
                                />
                                <span className="text-muted-foreground">
                                    Make <strong className="text-foreground font-semibold">Super Administrator</strong> (Master Portal Access)
                                </span>
                            </label>
                        </div>

                        <DialogFooter className="gap-2 pt-2 border-t border-border/70 mt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsAddModalOpen(false)}
                                className="h-8 text-xs px-3"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="h-8 text-xs px-3.5 bg-primary text-primary-foreground font-semibold shadow-2xs"
                            >
                                {isSubmitting ? 'Creating...' : 'Create User & Workspace'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit User Credentials Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="max-w-md p-5 gap-4">
                    <DialogHeader className="pb-1">
                        <div className="flex items-center gap-2.5">
                            <div className="size-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                                <KeyRound className="size-4" />
                            </div>
                            <div>
                                <DialogTitle className="text-base font-bold text-foreground">Edit User Credentials</DialogTitle>
                                <DialogDescription className="text-xs text-muted-foreground">
                                    Update login name, email, password, and super admin access.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    {editError && (
                        <div className="p-2.5 text-xs bg-rose-500/10 border border-rose-500/20 text-rose-600 rounded-lg">
                            {editError}
                        </div>
                    )}

                    <form onSubmit={handleUpdateUser} className="space-y-3">
                        <div className="space-y-1">
                            <Label className="text-xs font-semibold">Full Name *</Label>
                            <Input
                                required
                                placeholder="Full Name"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="h-8 text-xs"
                            />
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs font-semibold">Email Address *</Label>
                            <Input
                                required
                                type="email"
                                placeholder="name@example.com"
                                value={editEmail}
                                onChange={(e) => setEditEmail(e.target.value)}
                                className="h-8 text-xs"
                            />
                        </div>

                        <div className="space-y-1">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-semibold">Password</Label>
                                <span className="text-[11px] text-muted-foreground">(Leave blank to keep current)</span>
                            </div>
                            <div className="relative">
                                <Input
                                    type={showEditPassword ? 'text' : 'password'}
                                    placeholder="Enter new password to change"
                                    value={editPassword}
                                    onChange={(e) => setEditPassword(e.target.value)}
                                    className="h-8 text-xs pr-8"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowEditPassword(!showEditPassword)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                                    tabIndex={-1}
                                >
                                    {showEditPassword ? (
                                        <EyeOff className="size-3.5" />
                                    ) : (
                                        <Eye className="size-3.5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Super Admin Checkbox */}
                        <div className="pt-1">
                            <label className="inline-flex items-center gap-2 cursor-pointer text-xs select-none">
                                <input
                                    type="checkbox"
                                    checked={editIsSuperAdmin}
                                    disabled={editUserId === 1}
                                    onChange={(e) => setEditIsSuperAdmin(e.target.checked)}
                                    className="size-3.5 rounded text-rose-600 focus:ring-rose-500 disabled:opacity-50"
                                />
                                <span className="text-muted-foreground">
                                    Super Administrator Privilege {editUserId === 1 && '(Owner #1 is permanent)'}
                                </span>
                            </label>
                        </div>

                        <DialogFooter className="gap-2 pt-2 border-t border-border/70 mt-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsEditModalOpen(false)}
                                className="h-8 text-xs px-3"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isUpdating}
                                className="h-8 text-xs px-3.5 bg-primary text-primary-foreground font-semibold shadow-2xs"
                            >
                                {isUpdating ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete User Confirmation Modal */}
            <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <DialogContent className="max-w-md p-5 gap-4">
                    <DialogHeader className="pb-1">
                        <div className="flex items-center gap-2.5">
                            <div className="size-8 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0 border border-rose-500/20">
                                <Trash2 className="size-4" />
                            </div>
                            <div>
                                <DialogTitle className="text-base font-bold text-foreground">
                                    Delete User Account
                                </DialogTitle>
                                <DialogDescription className="text-xs text-muted-foreground">
                                    Confirm user account removal.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    {deleteTarget && (
                        <div className="space-y-3">
                            <div className="rounded-lg bg-muted/60 border border-border/80 p-3 text-xs space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">User Name:</span>
                                    <span className="font-semibold text-foreground">{deleteTarget.name}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Email Address:</span>
                                    <span className="font-mono text-foreground">{deleteTarget.email}</span>
                                </div>
                                {deleteTarget.organizations.length > 0 && (
                                    <div className="flex items-center justify-between pt-1 border-t border-border/60">
                                        <span className="text-muted-foreground">Workspaces:</span>
                                        <span className="text-foreground truncate max-w-[200px]">
                                            {deleteTarget.organizations.map((o) => o.name).join(', ')}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <p className="text-xs text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg p-2.5">
                                ⚠️ Are you sure you want to permanently delete this user? They will lose access to the system immediately.
                            </p>

                            <DialogFooter className="gap-2 pt-2 border-t border-border/70 mt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setDeleteTarget(null)}
                                    disabled={isDeleting}
                                    className="h-8 text-xs px-3"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    variant="destructive"
                                    disabled={isDeleting}
                                    onClick={confirmDeleteUser}
                                    className="h-8 text-xs px-3.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-2xs gap-1.5"
                                >
                                    <Trash2 className="size-3.5" />
                                    <span>{isDeleting ? 'Deleting...' : 'Yes, Delete User'}</span>
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Super Admin Access Toggle Modal */}
            <Dialog open={!!adminToggleTarget} onOpenChange={(open) => !open && setAdminToggleTarget(null)}>
                <DialogContent className="max-w-md p-5 gap-4">
                    <DialogHeader className="pb-1">
                        <div className="flex items-center gap-2.5">
                            <div
                                className={`size-8 rounded-lg flex items-center justify-center shrink-0 border ${
                                    adminToggleTarget?.is_super_admin
                                        ? 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                                        : 'bg-purple-500/10 text-purple-600 border-purple-500/20'
                                }`}
                            >
                                <Crown className="size-4" />
                            </div>
                            <div>
                                <DialogTitle className="text-base font-bold text-foreground">
                                    {adminToggleTarget?.is_super_admin
                                        ? 'Revoke Super Administrator Access'
                                        : 'Grant Super Administrator Access'}
                                </DialogTitle>
                                <DialogDescription className="text-xs text-muted-foreground">
                                    {adminToggleTarget?.is_super_admin
                                        ? 'Demote user back to regular client access.'
                                        : 'Grant master platform privileges to this user.'}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    {adminToggleTarget && (
                        <div className="space-y-3">
                            <div className="rounded-lg bg-muted/60 border border-border/80 p-3 text-xs space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">User Name:</span>
                                    <span className="font-semibold text-foreground">{adminToggleTarget.name}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Email Address:</span>
                                    <span className="font-mono text-foreground">{adminToggleTarget.email}</span>
                                </div>
                                <div className="flex items-center justify-between pt-1 border-t border-border/60">
                                    <span className="text-muted-foreground">Current Status:</span>
                                    <span className="font-semibold">
                                        {adminToggleTarget.is_super_admin ? (
                                            <span className="text-rose-600 font-bold">SUPER ADMIN</span>
                                        ) : (
                                            <span className="text-muted-foreground">Regular Client</span>
                                        )}
                                    </span>
                                </div>
                            </div>

                            <p
                                className={`text-xs rounded-lg p-2.5 border ${
                                    adminToggleTarget.is_super_admin
                                        ? 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20'
                                        : 'text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20'
                                }`}
                            >
                                {adminToggleTarget.is_super_admin
                                    ? '⚠️ This user will immediately lose access to the Super Admin Portal (/admin) and client quota controls.'
                                    : '👑 This user will receive full master control over all client workspaces, WhatsApp quotas, and system settings.'}
                            </p>

                            <DialogFooter className="gap-2 pt-2 border-t border-border/70 mt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setAdminToggleTarget(null)}
                                    disabled={isTogglingAdmin}
                                    className="h-8 text-xs px-3"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    disabled={isTogglingAdmin}
                                    onClick={confirmToggleSuperAdmin}
                                    className={`h-8 text-xs px-3.5 font-semibold shadow-2xs gap-1.5 text-white ${
                                        adminToggleTarget.is_super_admin
                                            ? 'bg-rose-600 hover:bg-rose-700'
                                            : 'bg-primary hover:bg-primary/90'
                                    }`}
                                >
                                    <Crown className="size-3.5" />
                                    <span>
                                        {isTogglingAdmin
                                            ? 'Updating...'
                                            : adminToggleTarget.is_super_admin
                                            ? 'Yes, Revoke Access'
                                            : 'Yes, Make Super Admin'}
                                    </span>
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
