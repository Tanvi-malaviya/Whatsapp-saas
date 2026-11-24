import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import type { AppLayoutProps } from '@/types';
import { router, usePage } from '@inertiajs/react';

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    const { tenant } = usePage().props as any;

    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent variant="sidebar" className="min-w-0 overflow-x-clip">
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                {tenant?.isAssisting && (
                    <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-800 dark:text-amber-200">
                        <div className="flex items-center gap-2">
                            <span className="size-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                            <span>
                                <strong>Partner Support Mode:</strong> You are currently assisting <strong>{tenant?.current?.name}</strong>.
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={() => router.post('/agent/exit-assist')}
                            className="text-[11px] font-bold bg-amber-600 hover:bg-amber-700 text-white px-2.5 py-0.5 rounded-md cursor-pointer transition-colors self-start sm:self-auto shrink-0"
                        >
                            Return to Partner Portal &rarr;
                        </button>
                    </div>
                )}
                {children}
            </AppContent>
        </AppShell>
    );
}
