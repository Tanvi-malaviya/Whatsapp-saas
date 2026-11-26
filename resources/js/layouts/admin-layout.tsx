import { useState } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import {
    LayoutDashboard,
    Building2,
    Smartphone,
    Users,
    Settings,
    Crown,
    LogOut,
    Menu,
    X,
    CreditCard,
    Wallet,
    BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/sonner';

type AdminLayoutProps = {
    children: React.ReactNode;
};

export default function AdminLayout({ children }: AdminLayoutProps) {
    const { url } = usePage();
    const { auth } = usePage().props as any;
    const [mobileOpen, setMobileOpen] = useState(false);

    const isActive = (path: string) => {
        const current = url.split('?')[0].replace(/\/$/, '') || '/';
        const target = path.split('?')[0].replace(/\/$/, '') || '/';
        if (target === '/admin') {
            return current === '/admin' || current === '/admin/dashboard';
        }
        return current.startsWith(target);
    };

    const navItems = [
        {
            title: 'Dashboard',
            href: '/admin',
            icon: LayoutDashboard,
        },
        {
            title: 'Subscriptions',
            href: '/admin/subscriptions',
            icon: CreditCard,
        },
        {
            title: 'Wallets & Credits',
            href: '/admin/wallets',
            icon: Wallet,
        },
        {
            title: 'Analytics & Usage',
            href: '/admin/analytics',
            icon: BarChart3,
        },
        {
            title: 'Client Workspaces',
            href: '/admin/organizations',
            icon: Building2,
        },
        {
            title: 'WhatsApp Numbers',
            href: '/admin/channels',
            icon: Smartphone,
        },
        {
            title: 'System Users',
            href: '/admin/users',
            icon: Users,
        },
        {
            title: 'Global Settings',
            href: '/admin/settings',
            icon: Settings,
        },
    ];

    const handleLogout = () => {
        router.post('/admin/logout');
    };

    return (
        <div className="min-h-screen md:h-screen md:overflow-hidden bg-background flex flex-col md:flex-row text-foreground antialiased">
            {/* Mobile Header */}
            <div className="md:hidden flex items-center justify-between p-3 border-b border-border bg-card">
                <div className="flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-rose-500/15 text-rose-500 border border-rose-500/30">
                        <Crown className="size-4" />
                    </div>
                    <div>
                        <div className="text-xs font-bold tracking-tight text-foreground">SATHWARA</div>
                        <div className="text-[10px] text-rose-500 font-semibold uppercase">Super Admin</div>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setMobileOpen(!mobileOpen)}
                    className="size-8 text-muted-foreground"
                >
                    {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
                </Button>
            </div>

            {/* Admin Dedicated Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border/80 flex flex-col transition-transform duration-200 md:static md:translate-x-0 md:h-full shrink-0 ${
                    mobileOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                {/* Brand Header */}
                <div className="p-4 border-b border-border/70 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-amber-500 text-white shadow-md shadow-rose-500/20">
                            <Crown className="size-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-1.5">
                                <span className="font-bold text-sm tracking-tight text-foreground">SATHWARA</span>
                                <span className="rounded bg-rose-500/15 px-1 py-0.2 text-[9px] font-bold text-rose-500 border border-rose-500/20">
                                    ADMIN
                                </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground">Master SaaS Control</p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setMobileOpen(false)}
                        className="md:hidden size-7 text-muted-foreground"
                    >
                        <X className="size-4" />
                    </Button>
                </div>

                {/* Navigation Menu */}
                <div className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
                    <div className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
                        Administration
                    </div>

                    {navItems.map((item) => {
                        const active = isActive(item.href);
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setMobileOpen(false)}
                                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                                    active
                                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold border border-rose-500/20 shadow-2xs'
                                        : 'text-foreground/80 hover:bg-muted/70 hover:text-foreground'
                                }`}
                            >
                                <Icon
                                    className={`size-4 shrink-0 ${
                                        active
                                            ? 'text-rose-600 dark:text-rose-400'
                                            : 'text-muted-foreground'
                                    }`}
                                />
                                <span className="truncate">{item.title}</span>
                            </Link>
                        );
                    })}
                </div>

                {/* Footer User Profile & Logout */}
                <div className="p-3 border-t border-border/70 bg-muted/20">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold text-xs">
                                {auth?.user?.name ? auth.user.name.charAt(0).toUpperCase() : 'A'}
                            </div>
                            <div className="min-w-0">
                                <div className="text-xs font-semibold truncate text-foreground">
                                    {auth?.user?.name || 'Super Admin'}
                                </div>
                                <div className="text-[10px] text-muted-foreground truncate">
                                    {auth?.user?.email || ''}
                                </div>
                            </div>
                        </div>

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleLogout}
                            className="size-7 text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 shrink-0"
                            title="Sign out"
                        >
                            <LogOut className="size-3.5" />
                        </Button>
                    </div>
                </div>
            </aside>

            {/* Mobile Backdrop */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 md:hidden backdrop-blur-xs"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto">
                <div className="flex-1 p-3.5 sm:p-4 lg:p-5 max-w-7xl w-full mx-auto">
                    {children}
                </div>
            </main>

            <Toaster />
        </div>
    );
}
