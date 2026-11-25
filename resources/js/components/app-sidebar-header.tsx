import {
    Sun,
    Moon,
    LayoutGrid,
    MessageSquare,
    CheckSquare,
    Radio,
    Send,
    FileText,
    Megaphone,
    ShoppingBag,
    GitBranch,
    Zap,
    Sparkles,
    Users,
    Layers,
    Kanban,
    BarChart3,
    Terminal,
    History,
    Briefcase,
    CreditCard,
    Wallet,
    Settings,
    Code2,
    HelpCircle,
    type LucideIcon,
} from 'lucide-react';
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

interface PageHeaderMeta {
    title: string;
    icon: LucideIcon;
    iconClass?: string;
}

function resolvePageHeaderMeta(url: string): PageHeaderMeta | null {
    const path = url.split('?')[0].replace(/\/$/, '') || '/';

    const exactMap: Record<string, PageHeaderMeta> = {
        '/dashboard': { title: 'Dashboard', icon: LayoutGrid, iconClass: 'text-emerald-600 dark:text-emerald-400' },
        '/inbox': { title: 'Shared Inbox', icon: MessageSquare, iconClass: 'text-emerald-600 dark:text-emerald-400' },
        '/chat/stages': { title: 'Chat Lead Stages', icon: CheckSquare, iconClass: 'text-blue-600 dark:text-blue-400' },
        '/whatsapp/connect': { title: 'WhatsApp Channels', icon: Radio, iconClass: 'text-emerald-600 dark:text-emerald-400' },
        '/channels': { title: 'WhatsApp Channels', icon: Radio, iconClass: 'text-emerald-600 dark:text-emerald-400' },
        '/campaigns': { title: 'WhatsApp Broadcasts & Campaigns', icon: Send, iconClass: 'text-primary' },
        '/templates': { title: 'Meta Message Templates', icon: FileText, iconClass: 'text-emerald-600 dark:text-emerald-400' },
        '/campaigns/ads': { title: 'WhatsApp Ads (CTWA)', icon: Megaphone, iconClass: 'text-purple-600 dark:text-purple-400' },
        '/commerce': { title: 'WhatsApp Commerce & Catalog', icon: ShoppingBag, iconClass: 'text-emerald-600 dark:text-emerald-400' },
        '/flows': { title: 'WhatsApp Bot', icon: GitBranch, iconClass: 'text-emerald-600 dark:text-emerald-400' },
        '/auto-responder': { title: 'WhatsApp Auto Responder', icon: Zap, iconClass: 'text-amber-500' },
        '/ai-agent': { title: 'WhatsApp AI Agent', icon: Sparkles, iconClass: 'text-purple-600 dark:text-purple-400' },
        '/bot': { title: 'WhatsApp Bot', icon: GitBranch, iconClass: 'text-emerald-600 dark:text-emerald-400' },
        '/contacts': { title: 'Contacts & CRM Directory', icon: Users, iconClass: 'text-emerald-600 dark:text-emerald-400' },
        '/segments': { title: 'Contact Segments', icon: Layers, iconClass: 'text-emerald-600 dark:text-emerald-400' },
        '/crm/pipeline': { title: 'CRM Lead Pipeline', icon: Kanban, iconClass: 'text-indigo-600 dark:text-indigo-400' },
        '/reports': { title: 'Analytics & Meta Costs', icon: BarChart3, iconClass: 'text-blue-600 dark:text-blue-400' },
        '/analytics/meta-costs': { title: 'Analytics & Meta Costs', icon: BarChart3, iconClass: 'text-blue-600 dark:text-blue-400' },
        '/insights/system-logs': { title: 'System & Webhook Logs', icon: Terminal, iconClass: 'text-cyan-600 dark:text-cyan-400' },
        '/chat/history': { title: 'Message History', icon: History, iconClass: 'text-emerald-600 dark:text-emerald-400' },
        '/agent/dashboard': { title: 'Partner Portal', icon: Briefcase, iconClass: 'text-emerald-600 dark:text-emerald-400' },
        '/agent': { title: 'Partner Portal', icon: Briefcase, iconClass: 'text-emerald-600 dark:text-emerald-400' },
        '/subscription': { title: 'Subscription', icon: CreditCard, iconClass: 'text-primary' },
        '/wallet': { title: 'Messaging Wallet', icon: Wallet, iconClass: 'text-emerald-600 dark:text-emerald-400' },
        '/developers': { title: 'API & Developer Docs', icon: Code2, iconClass: 'text-emerald-600 dark:text-emerald-400' },
        '/help': { title: 'Help & Knowledge Center', icon: HelpCircle, iconClass: 'text-primary' },
    };

    if (exactMap[path]) {
        return exactMap[path];
    }

    if (path.startsWith('/settings/')) {
        return { title: 'Settings', icon: Settings, iconClass: 'text-muted-foreground' };
    }

    return null;
}

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    const { url, props } = usePage();
    const { whatsapp, auth } = props as {
        whatsapp?: {
            isConnected: boolean;
            count?: number;
            phoneNumber?: string;
            name?: string;
            channels?: Array<{
                id: string;
                name: string;
                phoneNumber: string;
                isDefault: boolean;
                quality: string;
            }>;
        };
        auth?: { user?: User };
    };
    const getInitials = useInitials();
    const { resolvedAppearance, updateAppearance } = useAppearance();
    const pageMeta = resolvePageHeaderMeta(url);
    const PageIcon = pageMeta?.icon;

    const toggleTheme = () => {
        updateAppearance(resolvedAppearance === 'dark' ? 'light' : 'dark');
    };

    return (
        <header className="flex h-14 sm:h-16 shrink-0 items-center justify-between gap-2 sm:gap-3 border-b border-sidebar-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 px-3 sm:px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-5 sticky top-0 z-20 min-w-0">
            <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
                <SidebarTrigger className="-ml-1 shrink-0" />
                <div className="h-4 w-px bg-border/70 shrink-0 hidden sm:block" />
                {breadcrumbs.length > 1 || !pageMeta ? (
                    <Breadcrumbs breadcrumbs={breadcrumbs} />
                ) : (
                    <div className="flex min-w-0 items-center gap-2">
                        {PageIcon && (
                            <div className="hidden sm:flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted/70 border border-border/60">
                                <PageIcon className={`size-4 ${pageMeta.iconClass ?? 'text-primary'}`} />
                            </div>
                        )}
                        <h1 className="truncate text-sm sm:text-base font-bold tracking-tight text-foreground">
                            {pageMeta.title}
                        </h1>
                    </div>
                )}
            </div>
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
                <WhatsAppStatusPill
                    isConnected={whatsapp?.isConnected ?? false}
                    count={whatsapp?.count ?? (whatsapp?.isConnected ? 1 : 0)}
                    phoneNumber={whatsapp?.phoneNumber}
                    channels={whatsapp?.channels}
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
