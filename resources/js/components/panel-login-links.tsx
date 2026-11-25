import { Link } from '@inertiajs/react';
export function PanelLoginLinks({ panel }: { panel: 'user' | 'admin' | 'agent' }) {
    return <nav aria-label="Choose your login panel" className="mt-5 flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground">{[
        { id: 'user', href: '/login', label: 'User login' },
        { id: 'admin', href: '/admin/login', label: 'Admin login' },
        { id: 'agent', href: '/agent/login', label: 'B2B Partner login' },
    ].map(item => <Link key={item.id} href={item.href} aria-current={panel === item.id ? 'page' : undefined} className={panel === item.id ? 'font-semibold text-foreground' : 'underline underline-offset-4'}>{item.label}</Link>)}</nav>;
}
