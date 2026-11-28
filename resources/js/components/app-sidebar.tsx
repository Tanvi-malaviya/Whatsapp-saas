import { useState, useEffect } from 'react';
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
    Kanban,
    Shield,
    CreditCard,
    Wallet,
    Terminal,
    History,
    CheckSquare,
    Briefcase,
    Megaphone,
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
    SidebarRail,
    useSidebar,
} from '@/components/ui/sidebar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { WorkspaceSwitcher } from '@/components/workspace-switcher';
import { NavUser } from '@/components/nav-user';

export function AppSidebar() {
    const { url } = usePage();
    const { auth, tenant, inboxUnreadCount } = usePage().props as any;
    const { state, isMobile, setOpenMobile } = useSidebar();
    const isCollapsed = state === 'collapsed';
    const currentOrg = tenant?.current;

    // Automatically close mobile sidebar upon navigation
    useEffect(() => {
        if (isMobile) {
            setOpenMobile(false);
        }
    }, [url, isMobile, setOpenMobile]);

    // Expand Automation submenu automatically when inside bot/flows/agent
    const isInsideAutomation =
        url.startsWith('/flows') ||
        url.startsWith('/auto-responder') ||
        url.startsWith('/ai-agent');
    const [automationOpen, setAutomationOpen] = useState<boolean>(isInsideAutomation);

    // Precise active link checker without collisions
    const isActive = (targetPath: string) => {
        const current = url.split('?')[0].replace(/\/$/, '') || '/';
        const target = targetPath.split('?')[0].replace(/\/$/, '') || '/';

        if (target === '/whatsapp/connect') {
            return current === '/whatsapp/connect' || current === '/channels';
        }

        if (target === '/settings/organization') {
            return current.startsWith('/settings/');
        }

        return current === target;
    };

    const activeClass = 'bg-primary/10 text-primary font-semibold';
    const inactiveClass = 'text-foreground/80 hover:bg-muted/70 hover:text-foreground';

    return (
        <Sidebar
            collapsible="icon"
            variant="inset"
            className="border-r border-border bg-card"
            onClick={(e) => {
                if (isMobile && (e.target as HTMLElement).closest('a')) {
                    setOpenMobile(false);
                }
            }}
        >
            {/* 1. Workspace Profile Header */}
            <SidebarHeader className="border-b border-border/70 p-2 group-data-[collapsible=icon]:p-1.5 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
                <WorkspaceSwitcher />
            </SidebarHeader>

            {/* 2. Main Navigation Items with 5 V2 Sections */}
            <SidebarContent className="px-2 py-2 overflow-y-auto overflow-x-hidden [scrollbar-width:thin] [scrollbar-color:rgba(156,163,175,0.3)_transparent] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border/60 hover:[&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full group-data-[collapsible=icon]:px-1 group-data-[collapsible=icon]:py-1.5 group-data-[collapsible=icon]:[scrollbar-width:none] group-data-[collapsible=icon]:[&::-webkit-scrollbar]:hidden">
                
                {/* ========================================================= */}
                {/* SECTION 1: WORKSPACE */}
                {/* ========================================================= */}
                <div className="px-2 pt-1 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 select-none group-data-[collapsible=icon]:hidden">
                    Workspace
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

                    {/* Shared Inbox */}
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            isActive={isActive('/inbox')}
                            className={isActive('/inbox') ? activeClass : inactiveClass}
                            tooltip="Inbox"
                        >
                            <Link href="/inbox" prefetch className="flex items-center justify-between w-full">
                                <span className="flex items-center gap-2">
                                    <MessageSquare className="size-4 text-emerald-600 dark:text-emerald-400" />
                                    <span>Inbox</span>
                                </span>
                                {(inboxUnreadCount ?? 0) > 0 && (
                                    <span className="ml-auto inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-[#47b672] text-white text-[10px] font-bold">
                                        {inboxUnreadCount}
                                    </span>
                                )}
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>

                    {/* Chat Stages */}
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            isActive={isActive('/chat/stages')}
                            className={isActive('/chat/stages') ? activeClass : inactiveClass}
                            tooltip="Chat Stages"
                        >
                            <Link href="/chat/stages" prefetch>
                                <CheckSquare className="size-4 text-blue-600 dark:text-blue-400" />
                                <span>Chat Stages</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>

                    {/* WhatsApp Channels ((•)) */}
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            isActive={isActive('/whatsapp/connect')}
                            className={isActive('/whatsapp/connect') ? activeClass : inactiveClass}
                            tooltip="Channels"
                        >
                            <Link href="/whatsapp/connect" prefetch className="flex items-center w-full">
                                <Radio className="size-4 text-emerald-600" />
                                <span>Channels</span>
                                <span className="ml-auto flex items-center gap-1 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-bold text-emerald-600 group-data-[collapsible=icon]:hidden">
                                    <span className="size-1 rounded-full bg-emerald-500 animate-pulse"></span>
                                    Live
                                </span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>

                {/* ========================================================= */}
                {/* SECTION 2: MARKETING */}
                {/* ========================================================= */}
                <div className="px-2 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 select-none group-data-[collapsible=icon]:hidden">
                    Marketing
                </div>
                <div className="hidden group-data-[collapsible=icon]:block my-1 w-4 h-px bg-border/50 mx-auto" />
                <SidebarMenu className="space-y-0.5">
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

                    {/* Meta Templates */}
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

                    {/* Commerce & Catalog */}
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

                    {/* WhatsApp Automation (Submenu: Bot, Auto Responder, AI Agent) */}
                    <SidebarMenuItem>
                        {isCollapsed ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <SidebarMenuButton
                                        isActive={isInsideAutomation}
                                        className={isInsideAutomation ? activeClass : inactiveClass}
                                        tooltip="WhatsApp Automation"
                                    >
                                        <Zap className="size-4 text-amber-500" />
                                        <span>WhatsApp Automation</span>
                                    </SidebarMenuButton>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    side="right"
                                    align="start"
                                    sideOffset={12}
                                    className="w-48 p-1.5 shadow-xl rounded-xl border border-border bg-popover z-50 animate-in fade-in-0 zoom-in-95"
                                >
                                    <DropdownMenuLabel className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                                        WhatsApp Automation
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator className="my-1" />
                                    <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                                        <Link
                                            href="/flows"
                                            prefetch
                                            className={`flex items-center gap-2.5 px-2.5 py-1.5 text-xs font-medium ${isActive('/flows') ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground/80 hover:bg-muted/70'}`}
                                        >
                                            <GitBranch className="size-3.5 text-muted-foreground" />
                                            <span>Bot</span>
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                                        <Link
                                            href="/auto-responder"
                                            prefetch
                                            className={`flex items-center gap-2.5 px-2.5 py-1.5 text-xs font-medium ${isActive('/auto-responder') ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground/80 hover:bg-muted/70'}`}
                                        >
                                            <Zap className="size-3.5 text-amber-500" />
                                            <span>Auto Responder</span>
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                                        <Link
                                            href="/ai-agent"
                                            prefetch
                                            className={`flex items-center gap-2.5 px-2.5 py-1.5 text-xs font-medium ${isActive('/ai-agent') ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground/80 hover:bg-muted/70'}`}
                                        >
                                            <Sparkles className="size-3.5 text-purple-600 dark:text-purple-400" />
                                            <span>AI Agent</span>
                                        </Link>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <>
                                <SidebarMenuButton
                                    onClick={() => setAutomationOpen(!automationOpen)}
                                    className={isInsideAutomation ? 'font-semibold text-foreground' : inactiveClass}
                                    tooltip="WhatsApp Automation"
                                >
                                    <Zap className="size-4 text-amber-500" />
                                    <span className="flex-1 truncate">WhatsApp Automation</span>
                                    {automationOpen ? (
                                        <ChevronDown className="size-3.5 text-muted-foreground group-data-[collapsible=icon]:hidden" />
                                    ) : (
                                        <ChevronRight className="size-3.5 text-muted-foreground group-data-[collapsible=icon]:hidden" />
                                    )}
                                </SidebarMenuButton>

                                {automationOpen && (
                                    <SidebarMenuSub className="ml-4 mt-0.5 border-l border-border/80 pl-2 space-y-0.5 group-data-[collapsible=icon]:hidden">
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton asChild isActive={isActive('/flows')}>
                                                <Link href="/flows" prefetch className={isActive('/flows') ? activeClass : inactiveClass}>
                                                    <GitBranch className="size-3.5" />
                                                    <span>Bot</span>
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>

                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton asChild isActive={isActive('/auto-responder')}>
                                                <Link href="/auto-responder" prefetch className={isActive('/auto-responder') ? activeClass : inactiveClass}>
                                                    <Zap className="size-3.5 text-amber-500" />
                                                    <span>Auto Responder</span>
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>

                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton asChild isActive={isActive('/ai-agent')}>
                                                <Link href="/ai-agent" prefetch className={isActive('/ai-agent') ? activeClass : inactiveClass}>
                                                    <Sparkles className="size-3.5 text-purple-600 dark:text-purple-400" />
                                                    <span>AI Agent</span>
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                    </SidebarMenuSub>
                                )}
                            </>
                        )}
                    </SidebarMenuItem>
                </SidebarMenu>

                {/* ========================================================= */}
                {/* SECTION 3: CRM */}
                {/* ========================================================= */}
                <div className="px-2 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 select-none group-data-[collapsible=icon]:hidden">
                    CRM
                </div>
                <div className="hidden group-data-[collapsible=icon]:block my-1 w-4 h-px bg-border/50 mx-auto" />
                <SidebarMenu className="space-y-0.5">
                    {/* Contacts Directory */}
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            isActive={isActive('/contacts')}
                            className={isActive('/contacts') ? activeClass : inactiveClass}
                            tooltip="Contacts"
                        >
                            <Link href="/contacts" prefetch>
                                <Users className="size-4" />
                                <span>Contacts</span>
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

                    {/* Lead Pipeline Kanban (NEW) */}
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            isActive={isActive('/crm/pipeline')}
                            className={isActive('/crm/pipeline') ? activeClass : inactiveClass}
                            tooltip="Lead Pipeline"
                        >
                            <Link href="/crm/pipeline" prefetch className="flex items-center w-full">
                                <Kanban className="size-4 text-indigo-600 dark:text-indigo-400" />
                                <span>Lead Pipeline</span>
                                <span className="ml-auto rounded bg-indigo-500/10 px-1.5 py-0.5 text-[9px] font-bold text-indigo-600 dark:text-indigo-400 group-data-[collapsible=icon]:hidden">
                                    Kanban
                                </span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>

                {/* ========================================================= */}
                {/* SECTION 4: INSIGHTS */}
                {/* ========================================================= */}
                <div className="px-2 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 select-none group-data-[collapsible=icon]:hidden">
                    Insights
                </div>
                <div className="hidden group-data-[collapsible=icon]:block my-1 w-4 h-px bg-border/50 mx-auto" />
                <SidebarMenu className="space-y-0.5">
                    {/* Analytics & Meta Costs */}
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            isActive={isActive('/reports') || isActive('/analytics/meta-costs')}
                            className={isActive('/reports') || isActive('/analytics/meta-costs') ? activeClass : inactiveClass}
                            tooltip="Analytics & Costs"
                        >
                            <Link href="/reports" prefetch>
                                <BarChart3 className="size-4 text-blue-600 dark:text-blue-400" />
                                <span>Analytics &amp; Costs</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>

                    {/* System & Webhook Logs (NEW) */}
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            isActive={isActive('/insights/system-logs')}
                            className={isActive('/insights/system-logs') ? activeClass : inactiveClass}
                            tooltip="System Logs"
                        >
                            <Link href="/insights/system-logs" prefetch>
                                <Terminal className="size-4 text-cyan-600 dark:text-cyan-400" />
                                <span>System Logs</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>

                    {/* Message History */}
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            isActive={isActive('/chat/history')}
                            className={isActive('/chat/history') ? activeClass : inactiveClass}
                            tooltip="Message History"
                        >
                            <Link href="/chat/history" prefetch>
                                <History className="size-4" />
                                <span>Message History</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>

                {/* ========================================================= */}
                {/* SECTION 5: MANAGEMENT */}
                {/* ========================================================= */}
                <div className="px-2 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 select-none group-data-[collapsible=icon]:hidden">
                    Management
                </div>
                <div className="hidden group-data-[collapsible=icon]:block my-1 w-4 h-px bg-border/50 mx-auto" />
                <SidebarMenu className="space-y-0.5">
                    {/* B2B Partner Portal */}
                    {(auth?.isB2BAgent || auth?.isSuperAdmin) && (
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                asChild
                                isActive={isActive('/agent/dashboard') || isActive('/agent')}
                                className={isActive('/agent/dashboard') || isActive('/agent') ? activeClass : inactiveClass}
                                tooltip="Partner Portal"
                            >
                                <Link href="/agent/dashboard" prefetch>
                                    <Briefcase className="size-4 text-emerald-600 dark:text-emerald-400" />
                                    <span>Partner Portal</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    )}

                    {/* Subscription and messaging credits have separate pages. */}
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={isActive('/subscription')} className={isActive('/subscription') ? activeClass : inactiveClass} tooltip="Subscription">
                            <Link href="/subscription" prefetch><CreditCard className="size-4" /><span>Subscription</span></Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={isActive('/wallet')} className={isActive('/wallet') ? activeClass : inactiveClass} tooltip="Wallet">
                            <Link href="/wallet" prefetch><Wallet className="size-4 text-emerald-600 dark:text-emerald-400" /><span>Wallet</span></Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>

                    {/* Settings (Workspace & Profile) */}
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

                    {/* API & Developers */}
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            isActive={isActive('/developers')}
                            className={isActive('/developers') ? activeClass : inactiveClass}
                            tooltip="API & Docs"
                        >
                            <Link href="/developers" prefetch>
                                <Terminal className="size-4 text-emerald-600 dark:text-emerald-400" />
                                <span>API &amp; Docs</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>

                    {/* Help & In-App Documentation */}
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            isActive={isActive('/help')}
                            className={isActive('/help') ? activeClass : inactiveClass}
                            tooltip="Help & Docs"
                        >
                            <Link href="/help" prefetch>
                                <HelpCircle className="size-4 text-primary" />
                                <span>Help &amp; Docs</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarContent>

            {/* 3. Footer (User Profile & Workspace) */}
            <SidebarFooter className="border-t border-border/70 p-2 group-data-[collapsible=icon]:p-1.5 shrink-0">
                <NavUser />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}
