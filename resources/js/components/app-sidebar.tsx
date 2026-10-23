import { Link, usePage } from '@inertiajs/react';
import {
    LayoutGrid,
    MessageSquare,
    Users,
    Bot,
    Send,
    BarChart3,
    Settings,
    HelpCircle,
    Smartphone,
    FileText,
    QrCode,
    Link2,
    Sparkles,
    ShieldCheck,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { dashboard } from '@/routes';
import type { NavItem } from '@/types';

const coreNavItems = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutGrid,
    },
    {
        title: 'Shared Inbox',
        href: '/inbox',
        icon: MessageSquare,
        badge: 'Live',
    },
    {
        title: 'Broadcasts',
        href: '/campaigns',
        icon: Send,
    },
    {
        title: 'Contacts & CRM',
        href: '/contacts',
        icon: Users,
    },
    {
        title: 'Bot Builder',
        href: '/bot',
        icon: Bot,
        badge: 'AI',
    },
    {
        title: 'Meta Templates',
        href: '/campaigns',
        icon: FileText,
    },
    {
        title: 'WhatsApp WABA',
        href: '/whatsapp/connect',
        icon: Smartphone,
    },
    {
        title: 'Analytics & Costs',
        href: '/reports',
        icon: BarChart3,
    },
];

const growthTools = [
    {
        title: 'QR Generator',
        href: '/whatsapp/connect',
        icon: QrCode,
    },
    {
        title: 'Chat Link Generator',
        href: '/whatsapp/connect',
        icon: Link2,
    },
];

const footerNavItems: NavItem[] = [
    {
        title: 'Settings',
        href: '/settings/profile',
        icon: Settings,
    },
    {
        title: 'Meta Docs & Status',
        href: 'https://developers.facebook.com/docs/whatsapp',
        icon: HelpCircle,
    },
];

export function AppSidebar() {
    const { isCurrentUrl } = useCurrentUrl();
    const { tenant } = usePage().props as any;
    const currentOrg = tenant?.current;

    return (
        <Sidebar collapsible="icon" variant="inset" className="border-r border-sidebar-border bg-sidebar">
            <SidebarHeader className="border-b border-sidebar-border/60 pb-3 pt-3">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild className="hover:bg-sidebar-accent">
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>

                {currentOrg && (
                    <div className="mt-1 flex items-center justify-between rounded-lg border border-[#47b672]/20 bg-[#47b672]/5 px-2.5 py-1.5 text-xs group-data-[collapsible=icon]:hidden">
                        <div className="flex items-center gap-1.5 truncate">
                            <span className="size-2 rounded-full bg-[#47b672] ring-2 ring-[#47b672]/20"></span>
                            <span className="truncate font-semibold text-foreground">
                                {currentOrg.slug || 'sathwara-infotech'}
                            </span>
                        </div>
                        <span className="rounded bg-[#47b672]/15 px-1.5 py-0.5 text-[10px] font-semibold text-[#28804c] dark:text-[#52c480]">
                            PRO
                        </span>
                    </div>
                )}
            </SidebarHeader>

            <SidebarContent className="px-1 py-2">
                {/* Core Navigation */}
                <SidebarGroup className="px-2 py-1">
                    <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                        Workspace
                    </SidebarGroupLabel>
                    <SidebarMenu>
                        {coreNavItems.map((item) => {
                            const active = isCurrentUrl(item.href);
                            return (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={active}
                                        tooltip={{ children: item.title }}
                                        className={
                                            active
                                                ? 'bg-[#47b672]/10 font-semibold text-[#28804c] dark:bg-[#47b672]/20 dark:text-[#52c480] hover:bg-[#47b672]/15'
                                                : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-foreground/80'
                                        }
                                    >
                                        <Link href={item.href} prefetch className="flex items-center justify-between">
                                            <div className="flex items-center gap-2.5">
                                                <item.icon className={`size-4 ${active ? 'text-[#349c5e] dark:text-[#52c480]' : ''}`} />
                                                <span>{item.title}</span>
                                            </div>
                                            {item.badge && (
                                                <span className="rounded-full bg-[#47b672]/15 px-1.5 py-0.5 text-[10px] font-bold text-[#28804c] dark:text-[#52c480] group-data-[collapsible=icon]:hidden">
                                                    {item.badge}
                                                </span>
                                            )}
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            );
                        })}
                    </SidebarMenu>
                </SidebarGroup>

                {/* Growth & Lead Gen Tools */}
                <SidebarGroup className="px-2 py-1">
                    <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                        Growth Tools
                    </SidebarGroupLabel>
                    <SidebarMenu>
                        {growthTools.map((item) => (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton
                                    asChild
                                    tooltip={{ children: item.title }}
                                    className="hover:bg-sidebar-accent text-foreground/80"
                                >
                                    <Link href={item.href} prefetch>
                                        <item.icon className="size-4" />
                                        <span>{item.title}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="border-t border-sidebar-border/60 pt-2">
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
