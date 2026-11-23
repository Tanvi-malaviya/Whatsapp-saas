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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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

type UserItem = {
    id: number;
    name: string;
    email: string;
    is_super_admin: boolean;
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

    const filtered = useMemo(() => {
        return users.filter((u) => {
            return (
                u.name.toLowerCase().includes(search.toLowerCase()) ||
                u.email.toLowerCase().includes(search.toLowerCase())
            );
        });
    }, [users, search]);

    return (
        <>
            <Head title="System Users - Super Admin" />

            <div className="space-y-3.5">
                {/* Compact Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/70 pb-3">
                    <div className="flex items-center gap-2.5">
                        <div className="size-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                            <Users className="size-4" />
                        </div>
                        <div>
                            <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground leading-tight">
                                System Users &amp; Privileges
                            </h1>
                            <p className="text-xs text-muted-foreground">
                                Manage registered users and Super Administrator privileges ({users.length} Total Users)
                            </p>
                        </div>
                    </div>

                    <Button
                        onClick={() => {
                            setFormError('');
                            setIsAddModalOpen(true);
                        }}
                        className="h-8 px-3 text-xs font-semibold gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xs shrink-0 self-start sm:self-auto"
                    >
                        <UserPlus className="size-3.5" />
                        <span>Add New User</span>
                    </Button>
                </div>

                {/* Flash Notice */}
                {flash?.success && (
                    <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-xs text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="size-3.5 shrink-0" />
                        <span>{flash.success}</span>
                    </div>
                )}
                {flash?.error && (
                    <div className="flex items-center gap-2 rounded-lg bg-rose-500/10 border border-rose-500/20 px-3 py-2 text-xs text-rose-600 dark:text-rose-400">
                        <span>{flash.error}</span>
                    </div>
                )}

                {/* Search */}
                <div className="relative max-w-sm">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                    <Input
                        placeholder="Search by user name or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-8 text-xs h-8 border-border/80"
                    />
                </div>

                {/* Users Table */}
                <Card className="border-border/70 shadow-2xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-muted/40 border-b border-border text-[11px] uppercase font-semibold text-muted-foreground">
                                <tr>
                                    <th className="py-2.5 px-3.5">User</th>
                                    <th className="py-2.5 px-3.5">Workspaces &amp; Role</th>
                                    <th className="py-2.5 px-3.5">Super Admin Access</th>
                                    <th className="py-2.5 px-3.5">Registered</th>
                                    <th className="py-2.5 px-3.5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60">
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-8 text-center text-muted-foreground text-xs">
                                            No users found.
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map((u) => (
                                        <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                                            {/* User Details */}
                                            <td className="py-2 px-3.5">
                                                <div className="font-semibold text-xs text-foreground flex items-center gap-1.5 leading-tight">
                                                    <span>{u.name}</span>
                                                    {u.id === 1 && (
                                                        <Badge variant="outline" className="text-[9px] px-1 py-0 bg-amber-500/10 text-amber-600 border-amber-500/20 font-bold">
                                                            OWNER #1
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                                                    {u.email}
                                                </div>
                                            </td>

                                            {/* Organizations */}
                                            <td className="py-2 px-3.5">
                                                <div className="flex flex-wrap gap-1 max-w-sm">
                                                    {u.organizations.length === 0 ? (
                                                        <span className="text-[11px] text-muted-foreground italic">No workspace</span>
                                                    ) : (
                                                        u.organizations.map((org) => (
                                                            <span
                                                                key={org.id}
                                                                className="inline-flex items-center gap-1 text-[10px] bg-muted px-1.5 py-0.5 rounded border border-border/70 leading-none"
                                                            >
                                                                <Building2 className="size-2.5 text-muted-foreground shrink-0" />
                                                                <span className="truncate max-w-[130px]">{org.name}</span>
                                                                <span className="text-[9px] text-primary font-bold">({org.role})</span>
                                                            </span>
                                                        ))
                                                    )}
                                                </div>
                                            </td>

                                            {/* Super Admin status */}
                                            <td className="py-2 px-3.5">
                                                {u.is_super_admin ? (
                                                    <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/10 px-2 py-0.5 text-[11px] font-bold text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                                        <Crown className="size-3 text-rose-500" />
                                                        SUPER ADMIN
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">
                                                        Regular Client
                                                    </span>
                                                )}
                                            </td>

                                            {/* Registered */}
                                            <td className="py-2 px-3.5 text-xs text-muted-foreground whitespace-nowrap">
                                                {u.created_at}
                                            </td>

                                            {/* Actions */}
                                            <td className="py-2 px-3.5 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => openEditModal(u)}
                                                        className="h-7 text-xs font-medium px-2 gap-1 border-border/80 hover:bg-muted"
                                                        title="Edit Credentials"
                                                    >
                                                        <Pencil className="size-3" />
                                                        <span>Edit</span>
                                                    </Button>

                                                    <Button
                                                        size="sm"
                                                        variant={u.is_super_admin ? 'outline' : 'default'}
                                                        disabled={u.id === 1}
                                                        onClick={() => openAdminToggleModal(u)}
                                                        className={`h-7 text-xs font-semibold px-2 ${
                                                            u.is_super_admin
                                                                ? 'text-rose-600 border-rose-500/30 hover:bg-rose-500/10'
                                                                : 'bg-primary hover:bg-primary/90'
                                                        }`}
                                                    >
                                                        {u.is_super_admin ? 'Revoke Admin' : 'Make Super Admin'}
                                                    </Button>

                                                    {u.id !== 1 && (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => openDeleteModal(u)}
                                                            className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10"
                                                            title="Delete User"
                                                        >
                                                            <Trash2 className="size-3.5" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
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
