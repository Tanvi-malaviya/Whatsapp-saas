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
    const [formWorkspaceName, setFormWorkspaceName] = useState('');
    const [formMaxChannels, setFormMaxChannels] = useState<number>(1);
    const [formIsSuperAdmin, setFormIsSuperAdmin] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState('');

    const handleToggleSuperAdmin = (userId: number, current: boolean, name: string) => {
        const action = current ? 'Revoke Super Admin access from' : 'Grant Super Admin access to';
        if (confirm(`Are you sure you want to ${action} ${name}?`)) {
            router.post(`/admin/users/${userId}/toggle-admin`);
        }
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

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/70 pb-5">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            <Users className="size-6 text-indigo-500" />
                            <span>System Users &amp; Privileges</span>
                        </h1>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                            Manage all registered users and assign master Super Administrator privileges ({users.length} Total Users).
                        </p>
                    </div>

                    <Button
                        onClick={() => {
                            setFormError('');
                            setIsAddModalOpen(true);
                        }}
                        className="h-9 px-4 text-xs font-semibold gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xs shrink-0"
                    >
                        <UserPlus className="size-4" />
                        <span>Add New User</span>
                    </Button>
                </div>

                {/* Flash Notice */}
                {flash?.success && (
                    <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-sm text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="size-4 shrink-0" />
                        <span>{flash.success}</span>
                    </div>
                )}
                {flash?.error && (
                    <div className="flex items-center gap-2 rounded-lg bg-rose-500/10 border border-rose-500/20 px-4 py-3 text-sm text-rose-600 dark:text-rose-400">
                        <span>{flash.error}</span>
                    </div>
                )}

                {/* Search */}
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by user name or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 text-sm h-9 border-border/80"
                    />
                </div>

                {/* Users Table */}
                <Card className="border-border/70 shadow-2xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-muted/40 border-b border-border text-xs uppercase font-semibold text-muted-foreground">
                                <tr>
                                    <th className="py-3 px-4">User</th>
                                    <th className="py-3 px-4">Workspaces &amp; Role</th>
                                    <th className="py-3 px-4">Super Admin Access</th>
                                    <th className="py-3 px-4">Registered</th>
                                    <th className="py-3 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60">
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-8 text-center text-muted-foreground text-sm">
                                            No users found.
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map((u) => (
                                        <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                                            {/* User Details */}
                                            <td className="py-3.5 px-4">
                                                <div className="font-semibold text-foreground flex items-center gap-2">
                                                    <span>{u.name}</span>
                                                    {u.id === 1 && (
                                                        <Badge variant="outline" className="text-[9px] bg-amber-500/10 text-amber-600 border-amber-500/20">
                                                            OWNER #1
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {u.email}
                                                </div>
                                            </td>

                                            {/* Organizations */}
                                            <td className="py-3.5 px-4">
                                                <div className="flex flex-wrap gap-1 max-w-xs">
                                                    {u.organizations.length === 0 ? (
                                                        <span className="text-[11px] text-muted-foreground italic">No workspace</span>
                                                    ) : (
                                                        u.organizations.map((org) => (
                                                            <span
                                                                key={org.id}
                                                                className="inline-flex items-center gap-1 text-[11px] bg-muted px-2 py-0.5 rounded border border-border/80"
                                                            >
                                                                <Building2 className="size-2.5 text-muted-foreground" />
                                                                <span>{org.name}</span>
                                                                <span className="text-[9px] text-primary font-bold">({org.role})</span>
                                                            </span>
                                                        ))
                                                    )}
                                                </div>
                                            </td>

                                            {/* Super Admin status */}
                                            <td className="py-3.5 px-4">
                                                {u.is_super_admin ? (
                                                    <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/10 px-2 py-0.5 text-xs font-bold text-rose-600 dark:text-rose-400 border border-rose-500/20">
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
                                            <td className="py-3.5 px-4 text-xs text-muted-foreground whitespace-nowrap">
                                                {u.created_at}
                                            </td>

                                            {/* Actions */}
                                            <td className="py-3.5 px-4 text-right">
                                                <Button
                                                    size="sm"
                                                    variant={u.is_super_admin ? 'outline' : 'default'}
                                                    disabled={u.id === 1}
                                                    onClick={() => handleToggleSuperAdmin(u.id, u.is_super_admin, u.name)}
                                                    className={`h-7 text-xs font-semibold px-2.5 ${
                                                        u.is_super_admin
                                                            ? 'text-rose-600 border-rose-500/30 hover:bg-rose-500/10'
                                                            : 'bg-primary hover:bg-primary/90'
                                                    }`}
                                                >
                                                    {u.is_super_admin ? 'Revoke Admin' : 'Make Super Admin'}
                                                </Button>
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
                                <Input
                                    required
                                    type="password"
                                    placeholder="Min 6 characters"
                                    value={formPassword}
                                    onChange={(e) => setFormPassword(e.target.value)}
                                    className="h-8 text-xs"
                                />
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
        </>
    );
}
