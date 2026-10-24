import { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { Building2, Check, ChevronsUpDown, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { TenantOrganization } from '@/types/tenant';

export function WorkspaceSwitcher() {
    const { tenant } = usePage().props;
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newOrgName, setNewOrgName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    if (!tenant?.current) {
        return null;
    }

    const currentOrg = tenant.current;
    const allOrgs = tenant.all ?? [currentOrg];

    const handleSwitch = (org: TenantOrganization) => {
        if (org.id === currentOrg.id) return;
        router.post(`/workspace/switch/${org.id}`, {}, {
            preserveState: false,
            preserveScroll: true,
        });
    };

    const handleCreateWorkspace = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = newOrgName.trim();
        if (!trimmed) {
            setError('Please enter a workspace name');
            return;
        }

        setError('');
        setIsSubmitting(true);

        router.post(
            '/workspace/store',
            { name: trimmed },
            {
                preserveState: false,
                onSuccess: () => {
                    setIsCreateOpen(false);
                    setNewOrgName('');
                    setIsSubmitting(false);
                },
                onError: (err) => {
                    setError(err.name || 'Failed to create workspace. Try another name.');
                    setIsSubmitting(false);
                },
                onFinish: () => {
                    setIsSubmitting(false);
                },
            }
        );
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button
                        type="button"
                        className="flex w-full items-center justify-between rounded-xl border border-border bg-background p-2 group-data-[collapsible=icon]:p-1 shadow-2xs hover:bg-muted/60 transition-colors text-left"
                    >
                        <div className="flex items-center gap-2.5 truncate">
                            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold text-sm shadow-xs">
                                {currentOrg.name.slice(0, 1).toUpperCase()}
                            </div>
                            <div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                                <span className="truncate text-xs font-bold text-foreground">
                                    {currentOrg.name}
                                </span>
                                <span className="truncate text-[10px] text-muted-foreground font-medium capitalize">
                                    {currentOrg.role ? currentOrg.role.toLowerCase() : 'Admin'}
                                </span>
                            </div>
                        </div>
                        <ChevronsUpDown className="size-3.5 text-muted-foreground opacity-70 group-data-[collapsible=icon]:hidden shrink-0 ml-1" />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64" align="start">
                    <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1.5">
                        Your Workspaces
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {allOrgs.map((org: any) => {
                        const isSelected = org.id === currentOrg.id;
                        return (
                            <DropdownMenuItem
                                key={org.id}
                                onClick={() => handleSwitch(org)}
                                className="flex items-center justify-between py-2 cursor-pointer"
                            >
                                <div className="flex items-center gap-2.5">
                                    <div
                                        className={`flex size-7 items-center justify-center rounded-lg text-xs font-bold ${
                                            isSelected ? 'bg-emerald-600 text-white' : 'bg-muted text-muted-foreground'
                                        }`}
                                    >
                                        {org.name.slice(0, 1).toUpperCase()}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-semibold text-foreground">{org.name}</span>
                                        <span className="text-[10px] text-muted-foreground capitalize">
                                            {org.role ? org.role.toLowerCase() : 'Member'}
                                        </span>
                                    </div>
                                </div>
                                {isSelected && <Check className="size-4 text-emerald-600" />}
                            </DropdownMenuItem>
                        );
                    })}

                    <DropdownMenuSeparator />

                    {/* Create New Workspace Button */}
                    <DropdownMenuItem
                        onClick={() => {
                            setError('');
                            setNewOrgName('');
                            setIsCreateOpen(true);
                        }}
                        className="flex items-center gap-2 py-2 text-emerald-600 dark:text-emerald-400 font-medium cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                    >
                        <Plus className="size-4" />
                        <span className="text-xs font-semibold">Create New Workspace</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Create Workspace Modal Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="sm:max-w-md">
                    <form onSubmit={handleCreateWorkspace}>
                        <DialogHeader>
                            <DialogTitle className="text-base font-bold flex items-center gap-2">
                                <Building2 className="size-5 text-emerald-600" />
                                Create New Workspace
                            </DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground">
                                Add a separate company or organization workspace. You will be the Owner of this workspace.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-3 py-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="ws-name" className="text-xs font-medium">
                                    Workspace / Business Name
                                </Label>
                                <Input
                                    id="ws-name"
                                    placeholder="e.g. Acme Tech Solutions"
                                    value={newOrgName}
                                    onChange={(e) => setNewOrgName(e.target.value)}
                                    autoFocus
                                    className="text-xs"
                                    disabled={isSubmitting}
                                />
                                {error && <p className="text-[11px] text-destructive font-medium">{error}</p>}
                            </div>
                        </div>

                        <DialogFooter className="flex items-center justify-end gap-2 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setIsCreateOpen(false)}
                                disabled={isSubmitting}
                                className="text-xs"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                size="sm"
                                disabled={isSubmitting || !newOrgName.trim()}
                                className="bg-[#47b672] hover:bg-[#3ea164] text-white text-xs gap-1.5"
                            >
                                {isSubmitting && <Loader2 className="size-3.5 animate-spin" />}
                                Create Workspace
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
