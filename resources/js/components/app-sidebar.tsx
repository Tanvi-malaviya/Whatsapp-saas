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
    UserCircle,
    ChevronDown,
    ChevronRight,
    Zap,
    GitBranch,
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

export function AppSidebar() {
    const { url } = usePage();
    const { tenant } = usePage().props as any;
    const currentOrg = tenant?.current;

    // Expand Chat submenu if currently inside /inbox or /chat
    const isInsideChat = url.startsWith('/inbox') || url.startsWith('/chat');
    const [chatOpen, setChatOpen] = useState<boolean>(true);

    // Precise active link checker
    const isActive = (targetPath: string) => {
        // Strip origin or trailing slashes for comparison
        const current = url.replace(/\/$/, '') || '/';
        const target = targetPath.replace(/\/$/, '') || '/';

        if (target.includes('?')) {
            return current === target;
        }

        // Exact match or default fallback for base routes
        if (target === '/bot') {
            return current === '/bot' || current === '/bot?tab=flows';
        }
        if (target === '/inbox') {
            return current === '/inbox' && !current.includes('?');
        }
        if (target === '/contacts') {
            return current === '/contacts' && !current.includes('tab=segments');
        }
        if (target === '/campaigns') {
            return current === '/campaigns' && !current.includes('tab=templates');
        }
        if (target === '/whatsapp/connect') {
            return (current.startsWith('/whatsapp/connect') || current.startsWith('/channels')) && !current.includes('tab=developers');
        }

        return current === target;
    };

    const activeClass = 'bg-[#47b672]/15 text-[#28804c] dark:text-[#52c480] font-semibold';
    const inactiveClass = 'text-foreground/80 hover:bg-muted';

    return (
        <Sidebar collapsible="icon" variant="inset" className="border-r border-border bg-card">
            {/* 1. Workspace Profile Header */}
            <SidebarHeader className="border-b border-border/80 p-3">
                <div className="flex items-center justify-between rounded-xl border border-border bg-background p-2 group-data-[collapsible=icon]:p-1 shadow-2xs">
                    <div className="flex items-center gap-2.5 truncate">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-black text-[#f59e0b] font-bold text-sm shadow-xs">
                            S
                        </div>
                        <div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                            <span className="truncate text-xs font-bold text-foreground">
                                {currentOrg?.name || 'Sathwara InfoTech'}
                            </span>
                            <span className="truncate text-[10px] text-muted-foreground font-medium">
                                Admin
                            </span>
                        </div>
                    </div>
                    <ChevronDown className="size-3.5 text-muted-foreground opacity-70 group-data-[collapsible=icon]:hidden" />
                </div>
            </SidebarHeader>

            {/* 2. Main Navigation Items */}
            <SidebarContent className="px-2 py-3 overflow-y-auto">
                <SidebarMenu className="space-y-0.5">
                    {/* Dashboard */}
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            isActive={isActive('/dashboard')}
                            className={isActive('/dashboard') ? activeClass : inactiveClass}
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
                        >
                            <MessageSquare className="size-4" />
                            <span className="flex-1">Chat</span>
                            {chatOpen ? <ChevronDown className="size-3.5 text-muted-foreground" /> : <ChevronRight className="size-3.5 text-muted-foreground" />}
                        </SidebarMenuButton>

                        {chatOpen && (
                            <SidebarMenuSub className="ml-5 mt-1 border-l border-border pl-2 space-y-0.5">
                                <SidebarMenuSubItem>
                                    <SidebarMenuSubButton asChild isActive={isActive('/inbox')}>
                                        <Link href="/inbox" prefetch className={isActive('/inbox') ? activeClass : inactiveClass}>
                                            <span className={`size-1.5 rounded-full ${isActive('/inbox') ? 'bg-[#47b672]' : 'bg-muted-foreground/50'}`}></span>
                                            <span>Inbox</span>
                                        </Link>
                                    </SidebarMenuSubButton>
                                </SidebarMenuSubItem>

                                <SidebarMenuSubItem>
                                    <SidebarMenuSubButton asChild isActive={isActive('/chat/history')}>
                                        <Link href="/chat/history" prefetch className={isActive('/chat/history') ? activeClass : inactiveClass}>
                                            <span className={`size-1.5 rounded-full ${isActive('/chat/history') ? 'bg-[#47b672]' : 'bg-muted-foreground/50'}`}></span>
                                            <span>History</span>
                                        </Link>
                                    </SidebarMenuSubButton>
                                </SidebarMenuSubItem>

                                <SidebarMenuSubItem>
                                    <SidebarMenuSubButton asChild isActive={isActive('/chat/stages')}>
                                        <Link href="/chat/stages" prefetch className={isActive('/chat/stages') ? activeClass : inactiveClass}>
                                            <span className={`size-1.5 rounded-full ${isActive('/chat/stages') ? 'bg-[#47b672]' : 'bg-muted-foreground/50'}`}></span>
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
                        >
                            <Link href="/campaigns" prefetch>
                                <Send className="size-4" />
                                <span>Broadcasts</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>

                    {/* CRM */}
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            isActive={isActive('/contacts')}
                            className={isActive('/contacts') ? activeClass : inactiveClass}
                        >
                            <Link href="/contacts" prefetch className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Users className="size-4" />
                                    <span>CRM</span>
                                </div>
                                <ChevronRight className="size-3 text-muted-foreground" />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>

                    {/* Segments */}
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            isActive={isActive('/contacts?tab=segments')}
                            className={isActive('/contacts?tab=segments') ? activeClass : inactiveClass}
                        >
                            <Link href="/contacts?tab=segments" prefetch>
                                <Layers className="size-4" />
                                <span>Segments</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>

                    {/* Templates */}
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            isActive={isActive('/campaigns?tab=templates')}
                            className={isActive('/campaigns?tab=templates') ? activeClass : inactiveClass}
                        >
                            <Link href="/campaigns?tab=templates" prefetch className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <FileText className="size-4" />
                                    <span>Templates</span>
                                </div>
                                <ChevronRight className="size-3 text-muted-foreground" />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>

                    {/* Flows */}
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            isActive={isActive('/bot')}
                            className={isActive('/bot') ? activeClass : inactiveClass}
                        >
                            <Link href="/bot" prefetch className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <GitBranch className="size-4" />
                                    <span>Flows</span>
                                </div>
                                <ChevronRight className="size-3 text-muted-foreground" />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>

                    {/* Auto Responder */}
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            isActive={isActive('/bot?tab=auto-responder')}
                            className={isActive('/bot?tab=auto-responder') ? activeClass : inactiveClass}
                        >
                            <Link href="/bot?tab=auto-responder" prefetch>
                                <Zap className="size-4" />
                                <span>Auto Responder</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>

                    {/* AI Agent */}
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            isActive={isActive('/bot?tab=ai-agent')}
                            className={isActive('/bot?tab=ai-agent') ? activeClass : inactiveClass}
                        >
                            <Link href="/bot?tab=ai-agent" prefetch>
                                <Sparkles className="size-4 text-purple-600" />
                                <span>AI Agent</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>

                    {/* Help & Docs */}
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild className="text-foreground/80 hover:bg-muted">
                            <a href="https://developers.facebook.com/docs/whatsapp" target="_blank" rel="noreferrer">
                                <HelpCircle className="size-4" />
                                <span>Help &amp; Docs</span>
                            </a>
                        </SidebarMenuButton>
                    </SidebarMenuItem>

                    {/* Channels ((•)) - Connect Any WhatsApp Number */}
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            isActive={isActive('/whatsapp/connect')}
                            className={isActive('/whatsapp/connect') ? activeClass : inactiveClass}
                        >
                            <Link href="/whatsapp/connect" prefetch className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Radio className="size-4 text-[#47b672]" />
                                    <span>Channels</span>
                                </div>
                                <span className="rounded-full bg-[#47b672]/20 px-1.5 py-0.2 text-[10px] font-bold text-[#28804c] dark:text-[#52c480]">
                                    Live
                                </span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>

                    {/* Developers */}
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            isActive={isActive('/whatsapp/connect?tab=developers')}
                            className={isActive('/whatsapp/connect?tab=developers') ? activeClass : inactiveClass}
                        >
                            <Link href="/whatsapp/connect?tab=developers" prefetch className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Code2 className="size-4" />
                                    <span>Developers</span>
                                </div>
                                <ChevronRight className="size-3 text-muted-foreground" />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>

                    {/* Settings */}
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            isActive={isActive('/settings/profile')}
                            className={isActive('/settings/profile') ? activeClass : inactiveClass}
                        >
                            <Link href="/settings/profile" prefetch className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Settings className="size-4" />
                                    <span>Settings</span>
                                </div>
                                <ChevronRight className="size-3 text-muted-foreground" />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>

                    {/* Account */}
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            isActive={isActive('/settings/profile?tab=account')}
                            className={isActive('/settings/profile?tab=account') ? activeClass : inactiveClass}
                        >
                            <Link href="/settings/profile?tab=account" prefetch className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <UserCircle className="size-4" />
                                    <span>Account</span>
                                </div>
                                <ChevronRight className="size-3 text-muted-foreground" />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarContent>

            {/* 3. Footer (Version 1.3.0) */}
            <SidebarFooter className="border-t border-border/70 p-3 text-[11px] text-muted-foreground">
                <div className="flex items-center justify-between">
                    <span>Version 1.3.0</span>
                    <span className="size-2 rounded-full bg-[#47b672]"></span>
                </div>
            </SidebarFooter>
        </Sidebar>
    );
}
