import { Link } from '@inertiajs/react';

export function PanelLoginLinks({
    panel,
}: {
    panel: 'user' | 'admin' | 'agent';
}) {
    return (
        <nav
            aria-label="Other login portals"
            className="mt-7 border-t border-border pt-5 text-center"
        >
            <p className="mb-3 text-xs text-muted-foreground">
                Looking for a different portal?
            </p>
            <div className="flex flex-wrap justify-center gap-x-5 gap-y-3 text-sm">
                {[
                    { id: 'user', href: '/login', label: 'Client login' },
                    { id: 'admin', href: '/admin/login', label: 'Admin login' },
                    {
                        id: 'agent',
                        href: '/agent/login',
                        label: 'Partner login',
                    },
                ]
                    .filter((item) => item.id !== panel)
                    .map((item) => (
                        <Link
                            key={item.id}
                            href={item.href}
                            className="text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
                        >
                            {item.label}
                        </Link>
                    ))}
            </div>
        </nav>
    );
}
