import { router, usePage } from '@inertiajs/react';
import { Building2, Check, ChevronsUpDown, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

    return (
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
                                <div className={`flex size-7 items-center justify-center rounded-lg text-xs font-bold ${isSelected ? 'bg-emerald-600 text-white' : 'bg-muted text-muted-foreground'}`}>
                                    {org.name.slice(0, 1).toUpperCase()}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-semibold text-foreground">{org.name}</span>
                                    <span className="text-[10px] text-muted-foreground capitalize">{org.role ? org.role.toLowerCase() : 'Member'}</span>
                                </div>
                            </div>
                            {isSelected && <Check className="size-4 text-emerald-600" />}
                        </DropdownMenuItem>
                    );
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
