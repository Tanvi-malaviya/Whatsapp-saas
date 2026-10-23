import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { WorkspaceSwitcher } from '@/components/workspace-switcher';
import { WhatsAppStatusPill } from '@/components/whatsapp-status-pill';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';
import { usePage } from '@inertiajs/react';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    const { whatsapp } = usePage().props as {
        whatsapp?: { isConnected: boolean; phoneNumber?: string; name?: string };
    };

    return (
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-sidebar-border/50 px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4">
            <div className="flex items-center gap-3">
                <SidebarTrigger className="-ml-1" />
                <WorkspaceSwitcher />
                <div className="hidden md:block h-4 w-px bg-sidebar-border/60" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>
            <div className="flex items-center gap-3">
                <WhatsAppStatusPill
                    isConnected={whatsapp?.isConnected ?? false}
                    phoneNumber={whatsapp?.phoneNumber}
                />
            </div>
        </header>
    );
}
