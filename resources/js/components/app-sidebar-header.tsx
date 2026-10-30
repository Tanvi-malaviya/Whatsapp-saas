import { Sun, Moon } from 'lucide-react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { WhatsAppStatusPill } from '@/components/whatsapp-status-pill';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserMenuContent } from '@/components/user-menu-content';
import { useInitials } from '@/hooks/use-initials';
import { useAppearance } from '@/hooks/use-appearance';
import type { BreadcrumbItem as BreadcrumbItemType, User } from '@/types';
import { usePage } from '@inertiajs/react';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    const { whatsapp, auth } = usePage().props as {
        whatsapp?: { isConnected: boolean; phoneNumber?: string; name?: string };
        auth?: { user?: User };
    };
    const getInitials = useInitials();
    const { resolvedAppearance, updateAppearance } = useAppearance();

    const toggleTheme = () => {
        updateAppearance(resolvedAppearance === 'dark' ? 'light' : 'dark');
    };

    return (
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-sidebar-border/50 px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4">
            <div className="flex items-center gap-3">
                <SidebarTrigger className="-ml-1" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
                <WhatsAppStatusPill
                    isConnected={whatsapp?.isConnected ?? false}
                    phoneNumber={whatsapp?.phoneNumber}
                />

                {/* Light / Dark Mode Toggle */}
                <button
                    type="button"
                    onClick={toggleTheme}
                    className="flex size-8 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-all cursor-pointer shadow-2xs"
                    title={resolvedAppearance === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                    aria-label="Toggle theme"
                >
                    {resolvedAppearance === 'dark' ? (
                        <Sun className="size-4 text-amber-400" />
                    ) : (
                        <Moon className="size-4 text-slate-700" />
                    )}
                </button>

                {auth?.user && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                type="button"
                                className="flex items-center gap-2 rounded-full p-0.5 hover:ring-2 hover:ring-primary/40 transition-all focus:outline-none cursor-pointer"
                                title={`${auth.user.name} - Profile & Logout`}
                            >
                                <Avatar className="size-8 overflow-hidden rounded-full border border-border">
                                    <AvatarImage src={auth.user.avatar} alt={auth.user.name} />
                                    <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                                        {getInitials(auth.user.name)}
                                    </AvatarFallback>
                                </Avatar>
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end">
                            <UserMenuContent user={auth.user} />
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>
        </header>
    );
}
