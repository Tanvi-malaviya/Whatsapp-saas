import { Link } from '@inertiajs/react';
import { Building2, Monitor, ShieldCheck, UserRound } from 'lucide-react';
import type { PropsWithChildren } from 'react';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn } from '@/lib/utils';

const tabs = [
    { title: 'Organization', href: '/settings/organization', icon: Building2 },
    { title: 'Profile', href: '/settings/profile', icon: UserRound },
    { title: 'Security', href: '/settings/security', icon: ShieldCheck },
    { title: 'Appearance', href: '/settings/appearance', icon: Monitor },
];

export default function SettingsLayout({ children }: PropsWithChildren) {
    const { isCurrentOrParentUrl } = useCurrentUrl();

    return (
        <div className="w-full min-w-0 space-y-6 p-4 sm:p-6 lg:p-8">
            <header>
                <h1 className="text-2xl font-semibold tracking-tight">
                    Settings
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                    Manage your workspace, profile, security, and preferences.
                </p>
            </header>
            <nav
                aria-label="Settings"
                className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-card p-2 sm:flex sm:flex-wrap"
            >
                {tabs.map(({ title, href, icon: Icon }) => (
                    <Link
                        key={href}
                        href={href}
                        aria-current={
                            isCurrentOrParentUrl(href) ? 'page' : undefined
                        }
                        className={cn(
                            'flex min-h-11 min-w-0 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors sm:justify-start sm:px-5',
                            isCurrentOrParentUrl(href)
                                ? 'bg-primary/10 text-primary'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                        )}
                    >
                        <Icon className="size-4 shrink-0" />
                        {title}
                    </Link>
                ))}
            </nav>
            <section className="w-full min-w-0 space-y-8 [overflow-wrap:anywhere]">
                {children}
            </section>
        </div>
    );
}
