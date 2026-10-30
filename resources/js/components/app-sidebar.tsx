import { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
    LayoutGrid,
    MessageSquare,
    Users,
    Send,
    BarChart3,
    Settings,
    HelpCircle,
    FileText,
    Sparkles,
    Radio,
    Code2,
    Layers,
    ChevronDown,
    ChevronRight,
    Zap,
    GitBranch,
    ShoppingBag,
} from 'lucide-react';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { WorkspaceSwitcher } from '@/components/workspace-switcher';
import { NavUser } from '@/components/nav-user';

export function AppSidebar() {
    const { url } = usePage();
    const { tenant } = usePage().props as any;
    const currentOrg = tenant?.current;

    // Expand Chat submenu automatically when inside /inbox or /chat, collapsed otherwise to save space
    const isInsideChat = url.startsWith('/inbox') || url.startsWith('/chat');
    const [chatOpen, setChatOpen] = useState<boolean>(isInsideChat);

    // Precise active link checker without collisions
    const isActive = (targetPath: string) => {
        const current = url.split('?')[0].replace(/\/$/, '') || '/';
        const target = targetPath.split('?')[0].replace(/\/$/, '') || '/';

        if (target === '/whatsapp/connect') {
            return current === '/whatsapp/connect' || current === '/channels';
        }

        if (target === '/settings/organization') {
            return current.startsWith('/settings');
        }

        return current === target;
    };

    const activeClass = 'bg-primary/10 text-primary font-semibold';
    const inactiveClass = 'text-foreground/80 hover:bg-muted/70 hover:text-foreground';

    return (


    
        <Sidebar collapsible="icon" variant="inset" className="border-r border-border bg-card">
            {/* 1. Workspace Profile Header */}
            <SidebarHeader className="border-b border-border/70 p-2 group-data-[collapsible=icon]:p-1.5 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
                <WorkspaceSwitcher />
            </SidebarHeader>

            {/* 2. Main Navigation Items with Sleek Custom Scrollbar */}
            <SidebarContent className="px-2 py-2 overflow-y-auto overflow-x-hidden [scrollbar-width:thin] [scrollbar-color:rgba(156,163,175,0.3)_transparent] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border/60 hover:[&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full group-data-[collapsible=icon]:px-1.5">
                
                {/* Section: Main Navigation */}
                <div className="px-2 pt-1 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 select-none group-data-[collapsible=icon]:hidden">
                    Core
                </div>
                <SidebarMenu className="space-y-0.5">
                    {/* Dashboard */}
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            isActive={isActive('/dashboard')}
                            className={isActive('/dashboard') ? activeClass : inactiveClass}
                            tooltip="Dashboard"
                        >
                            <Link href="/dashboard" prefetch>
                                <LayoutGrid className="size-4" />
                                <span>Dashboard</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>

                    {/* Chat (Collapsible Submenu: Inbox, History, Stages) */}
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            onClick={() => setChatOpen(!chatOpen)}
                            className={isInsideChat ? 'font-semibold text-foreground' : inactiveClass}
                            tooltip="Chat"
                        >
                            <MessageSquare className="size-4" />
                            <span className="flex-1">Chat</span>
                            {chatOpen ? (
                                <ChevronDown className="size-3.5 text-muted-foreground group-data-[collapsible=icon]:hidden" />
                            ) : (
                                <ChevronRight className="size-3.5 text-muted-foreground group-data-[collapsible=icon]:hidden" />
                            )}
                        </SidebarMenuButton>

                        {chatOpen && (
                            <SidebarMenuSub className="ml-4 mt-0.5 border-l border-border/80 pl-2 space-y-0.5 group-data-[collapsible=icon]:hidden">
                                <SidebarMenuSubItem>
                                    <SidebarMenuSubButton asChild isActive={isActive('/inbox')}>
                                        <Link href="/inbox" prefetch className={isActive('/inbox') ? activeClass : inactiveClass}>
                                            <span className={`size-1.5 rounded-full ${isActive('/inbox') ? 'bg-primary' : 'bg-muted-foreground/40'}`}></span>
                                            <span>Inbox</span>
                                        </Link>
                                    </SidebarMenuSubButton>
                                </SidebarMenuSubItem>

                                <SidebarMenuSubItem>
                                    <SidebarMenuSubButton asChild isActive={isActive('/chat/history')}>
                                        <Link href="/chat/history" prefetch className={isActive('/chat/history') ? activeClass : inactiveClass}>
                                            <span className={`size-1.5 rounded-full ${isActive('/chat/history') ? 'bg-primary' : 'bg-muted-foreground/40'}`}></span>
                                            <span>History</span>
                                        </Link>
                                    </SidebarMenuSubButton>
                                </SidebarMenuSubItem>

                                <SidebarMenuSubItem>
                                    <SidebarMenuSubButton asChild isActive={isActive('/chat/stages')}>
                                        <Link href="/chat/stages" prefetch className={isActive('/chat/stages') ? activeClass : inactiveClass}>
                                            <span className={`size-1.5 rounded-full ${isActive('/chat/stages') ? 'bg-primary' : 'bg-muted-foreground/40'}`}></span>
                                            <span>Stages</span>
                                        </Link>
                                    </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                            </SidebarMenuSub>
                        )}
                    </SidebarMenuItem>

                    {/* Broadcasts */}
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            isActive={isActive('/campaigns')}
                            className={isActive('/campaigns') ? activeClass : inactiveClass}
                            tooltip="Broadcasts"
                        >
                            <Link href="/campaigns" prefetch>
                                <Send className="size-4" />
                                <span>Broadcasts</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>

                    {/* CRM / Contacts */}
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            isActive={isActive('/contacts')}
                            className={isActive('/contacts') ? activeClass : inactiveClass}
                            tooltip="CRM"
                        >
                            <Link href="/contacts" prefetch>
                                <Users className="size-4" />
                                <span>CRM</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>

                    {/* Segments */}
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            isActive={isActive('/segments')}
                            className={isActive('/segments') ? activeClass : inactiveClass}
                            tooltip="Segments"
                        >
                            <Link href="/segments" prefetch>
                                <Layers className="size-4" />
                                <span>Segments</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>

                {/* Section: Automation & Sales */}
                <div className="px-2 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 select-none group-data-[collapsible=icon]:hidden">
                    Automation
                </div>
                <div className="hidden group-data-[collapsible=icon]:block my-1.5 w-5 h-px bg-border/60 mx-auto" />
                <SidebarMenu className="space-y-0.5">
                    {/* Templates */}
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            isActive={isActive('/templates')}
                            className={isActive('/templates') ? activeClass : inactiveClass}
                            tooltip="Templates"
                        >
                            <Link href="/templates" prefetch>
                                <FileText className="size-4" />
                                <span>Templates</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>

                    {/* Flows */}
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            isActive={isActive('/flows')}
                            className={isActive('/flows') ? activeClass : inactiveClass}
                            tooltip="Flows"
                        >
                            <Link href="/flows" prefetch>
                                <GitBranch className="size-4" />
                                <span>Flows</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>

                    {/* Auto Responder */}
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            isActive={isActive('/auto-responder')}
                            className={isActive('/auto-responder') ? activeClass : inactiveClass}
                            tooltip="Auto Responder"
                        >
                            <Link href="/auto-responder" prefetch>
                                <Zap className="size-4" />
                                <span>Auto Responder</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>

                    {/* AI Agent */}
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            isActive={isActive('/ai-agent')}
                            className={isActive('/ai-agent') ? activeClass : inactiveClass}
                            tooltip="AI Agent"
                        >
                            <Link href="/ai-agent" prefetch>
                                <Sparkles className="size-4 text-purple-600 dark:text-purple-400" />
                                <span>AI Agent</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>

                    {/* Commerce & Meta Catalog */}
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            isActive={isActive('/commerce')}
                            className={isActive('/commerce') ? activeClass : inactiveClass}
                            tooltip="Commerce"
                        >
                            <Link href="/commerce" prefetch className="flex items-center w-full">
                                <ShoppingBag className="size-4 text-emerald-600" />
                                <span>Commerce</span>
                                <span className="ml-auto rounded bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-bold text-emerald-600 uppercase tracking-wide group-data-[collapsible=icon]:hidden">
                                    Catalog
                                </span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>

                {/* Section: Analytics & Settings */}
                <div className="px-2 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 select-none group-data-[collapsible=icon]:hidden">
                    Analytics &amp; Setup
                </div>
                <div className="hidden group-data-[collapsible=icon]:block my-1.5 w-5 h-px bg-border/60 mx-auto" />
                <SidebarMenu className="space-y-0.5">
                    {/* Analytics & Meta Costs (Clean label without truncated badge) */}
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            isActive={isActive('/reports') || isActive('/analytics/meta-costs')}
                            className={isActive('/reports') || isActive('/analytics/meta-costs') ? activeClass : inactiveClass}
                            tooltip="Analytics & Costs"
                        >
                            <Link href="/reports" prefetch className="flex items-center gap-2">
                                <BarChart3 className="size-4 text-blue-600 dark:text-blue-400" />
                                <span>Analytics &amp; Costs</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>

                    {/* Channels ((•)) - Connect Any WhatsApp Number */}
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            isActive={isActive('/whatsapp/connect')}
                            className={isActive('/whatsapp/connect') ? activeClass : inactiveClass}
                            tooltip="Channels"
                        >
                            <Link href="/whatsapp/connect" prefetch className="flex items-center w-full">
                                <Radio className="size-4" />
                                <span>Channels</span>
                                <span className="ml-auto flex items-center gap-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold text-primary group-data-[collapsible=icon]:hidden">
                                    <span className="size-1 rounded-full bg-primary animate-pulse"></span>
                                    Live
                                </span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>

                    {/* Developers */}
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            isActive={isActive('/developers')}
                            className={isActive('/developers') ? activeClass : inactiveClass}
                            tooltip="Developers"
                        >
                            <Link href="/developers" prefetch>
                                <Code2 className="size-4" />
                                <span>Developers</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>

                    {/* Settings (Workspace, Profile, Security & Appearance) */}
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            isActive={isActive('/settings/organization')}
                            className={isActive('/settings/organization') ? activeClass : inactiveClass}
                            tooltip="Settings"
                        >
                            <Link href="/settings/organization" prefetch>
                                <Settings className="size-4" />
                                <span>Settings</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>

                    {/* Help & Docs */}
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            className="text-foreground/70 hover:bg-muted/70 hover:text-foreground"
                            tooltip="Help & Docs"
                        >
                            <a href="https://developers.facebook.com/docs/whatsapp" target="_blank" rel="noreferrer">
                                <HelpCircle className="size-4" />
                                <span>Help &amp; Docs</span>
                            </a>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarContent>

            {/* 3. Footer (User Profile & Workspace) */}
            <SidebarFooter className="border-t border-border/70 p-2">
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
