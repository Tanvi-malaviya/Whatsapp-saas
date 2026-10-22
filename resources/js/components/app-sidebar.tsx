import { Link } from '@inertiajs/react';
import {
    LayoutGrid,
    MessageSquare,
    Users,
    Bot,
    Send,
    Zap,
    Calendar,
    Sparkles,
    BarChart3,
    Settings,
    HelpCircle,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import type { NavItem } from '@/types';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutGrid,
    },
    {
        title: 'Team Inbox',
        href: '/dashboard#inbox',
        icon: MessageSquare,
    },
    {
        title: 'Contacts & CRM',
        href: '/dashboard#contacts',
        icon: Users,
    },
    {
        title: 'Bot & Auto-Reply',
        href: '/dashboard#bot',
        icon: Bot,
    },
    {
        title: 'Campaigns & Templates',
        href: '/dashboard#campaigns',
        icon: Send,
    },
    {
        title: 'Automations',
        href: '/dashboard#automations',
        icon: Zap,
    },
    {
        title: 'Bookings',
        href: '/dashboard#bookings',
        icon: Calendar,
    },
    {
        title: 'AI Assistant',
        href: '/dashboard#ai',
        icon: Sparkles,
    },
    {
        title: 'Analytics & Reports',
        href: '/dashboard#reports',
        icon: BarChart3,
    },
];

const footerNavItems: NavItem[] = [
    {
        title: 'Settings',
        href: '/settings/profile',
        icon: Settings,
    },
    {
        title: 'Help & Guides',
        href: 'https://faq.whatsapp.com/general/business',
        icon: HelpCircle,
    },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
