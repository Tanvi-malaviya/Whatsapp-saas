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
                <Button
                    variant="ghost"
                    size="sm"
                    className="flex h-9 items-center gap-2 px-2.5 text-left font-normal border border-sidebar-border/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                >
                    <div className="flex size-5 items-center justify-center rounded bg-emerald-600 text-white shadow-xs">
                        <Building2 className="size-3.5" />
                    </div>
                    <div className="flex flex-col text-left">
                        <span className="text-xs font-semibold text-foreground truncate max-w-[140px] leading-tight">
                            {currentOrg.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground uppercase font-medium tracking-wider">
                            {currentOrg.role}
                        </span>
                    </div>
                    <ChevronsUpDown className="ml-1 size-3.5 text-muted-foreground opacity-60" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64" align="start">
                <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1.5">
                    Your Workspaces
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {allOrgs.map((org) => {
                    const isSelected = org.id === currentOrg.id;
                    return (
                        <DropdownMenuItem
                            key={org.id}
                            onClick={() => handleSwitch(org)}
                            className="flex items-center justify-between py-2 cursor-pointer"
                        >
                            <div className="flex items-center gap-2">
                                <div className={`flex size-6 items-center justify-center rounded text-xs ${isSelected ? 'bg-emerald-600 text-white' : 'bg-muted text-muted-foreground'}`}>
                                    <Building2 className="size-3.5" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium">{org.name}</span>
                                    <span className="text-[11px] text-muted-foreground">{org.role}</span>
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
