import { useState } from 'react';
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
    Radio,
    Code2,
    Layers,
    UserCircle,
    ChevronDown,
    ChevronRight,
    Zap,
    Building2,
    GitBranch,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { dashboard } from '@/routes';

export function AppSidebar() {
    const { isCurrentUrl } = useCurrentUrl();
    const { tenant, auth } = usePage().props as any;
    const currentOrg = tenant?.current;

    const [chatOpen, setChatOpen] = useState(true);

    return (
        <Sidebar collapsible="icon" variant="inset" className="border-r border-border bg-card">
            {/* 1. Workspace Profile Header (Matching Screenshot) */}
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

            {/* 2. Main Navigation Items (Matching Screenshot) */}
            <SidebarContent className="px-2 py-3 overflow-y-auto">
                <SidebarMenu className="space-y-0.5">
                    {/* Dashboard */}
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            isActive={isCurrentUrl('/dashboard')}
                            className={isCurrentUrl('/dashboard') ? 'bg-[#47b672]/15 text-[#28804c] dark:text-[#52c480] font-semibold' : 'text-foreground/80'}
                        >
                            <Link href="/dashboard" prefetch>
                                <LayoutGrid className="size-4" />
                                <span>Dashboard</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>

                    {/* Chat (With Submenu: Inbox, History, Stages) */}
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            onClick={() => setChatOpen(!chatOpen)}
                            className={isCurrentUrl('/inbox') ? 'text-[#28804c] dark:text-[#52c480] font-semibold' : 'text-foreground/80'}
                        >
                            <MessageSquare className="size-4" />
                            <span className="flex-1">Chat</span>
                            {chatOpen ? <ChevronDown className="size-3.5 text-muted-foreground" /> : <ChevronRight className="size-3.5 text-muted-foreground" />}
                        </SidebarMenuButton>

                        {chatOpen && (
                            <SidebarMenuSub className="ml-5 mt-1 border-l border-border pl-2 space-y-0.5">
                                <SidebarMenuSubItem>
                                    <SidebarMenuSubButton asChild isActive={isCurrentUrl('/inbox')}>
                                        <Link href="/inbox" prefetch>
                                            <span className="size-1.5 rounded-full bg-muted-foreground/50"></span>
                                            <span>Inbox</span>
                                        </Link>
                                    </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                                <SidebarMenuSubItem>
                                    <SidebarMenuSubButton asChild isActive={isCurrentUrl('/inbox')}>
                                        <Link href="/inbox" prefetch className="bg-[#47b672]/15 text-[#28804c] dark:text-[#52c480] font-semibold rounded-md">
                                            <span className="size-1.5 rounded-full bg-[#47b672]"></span>
                                            <span>History</span>
                                        </Link>
                                    </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                                <SidebarMenuSubItem>
                                    <SidebarMenuSubButton asChild>
                                        <Link href="/inbox" prefetch>
                                            <span className="size-1.5 rounded-full bg-muted-foreground/50"></span>
                                            <span>Stages</span>
                                        </Link>
                                    </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                            </SidebarMenuSub>
                        )}
                    </SidebarMenuItem>

                    {/* Broadcasts */}
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={isCurrentUrl('/campaigns')} className={isCurrentUrl('/campaigns') ? 'bg-[#47b672]/15 text-[#28804c] dark:text-[#52c480] font-semibold' : 'text-foreground/80'}>
                            <Link href="/campaigns" prefetch>
                                <Send className="size-4" />
                                <span>Broadcasts</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>

                    {/* CRM */}
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={isCurrentUrl('/contacts')} className={isCurrentUrl('/contacts') ? 'bg-[#47b672]/15 text-[#28804c] dark:text-[#52c480] font-semibold' : 'text-foreground/80'}>
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
                        <SidebarMenuButton asChild isActive={isCurrentUrl('/contacts')} className="text-foreground/80">
                            <Link href="/contacts" prefetch>
                                <Layers className="size-4" />
                                <span>Segments</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>

                    {/* Templates */}
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={isCurrentUrl('/campaigns')} className="text-foreground/80">
                            <Link href="/campaigns" prefetch className="flex items-center justify-between">
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
                        <SidebarMenuButton asChild isActive={isCurrentUrl('/bot')} className={isCurrentUrl('/bot') ? 'bg-[#47b672]/15 text-[#28804c] dark:text-[#52c480] font-semibold' : 'text-foreground/80'}>
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
                        <SidebarMenuButton asChild isActive={isCurrentUrl('/bot')} className="text-foreground/80">
                            <Link href="/bot" prefetch>
                                <Zap className="size-4" />
                                <span>Auto Responder</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>

                    {/* AI Agent */}
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={isCurrentUrl('/bot')} className="text-foreground/80">
                            <Link href="/bot" prefetch>
                                <Sparkles className="size-4 text-purple-600" />
                                <span>AI Agent</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>

                    {/* Help & Docs */}
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild className="text-foreground/80">
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
                            isActive={isCurrentUrl('/whatsapp/connect') || isCurrentUrl('/channels')}
                            className={
                                isCurrentUrl('/whatsapp/connect') || isCurrentUrl('/channels')
                                    ? 'bg-[#47b672]/15 text-[#28804c] dark:text-[#52c480] font-semibold'
                                    : 'text-foreground/80'
                            }
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
                        <SidebarMenuButton asChild className="text-foreground/80">
                            <Link href="/whatsapp/connect" prefetch className="flex items-center justify-between">
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
                        <SidebarMenuButton asChild isActive={isCurrentUrl('/settings/profile')} className="text-foreground/80">
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
                        <SidebarMenuButton asChild className="text-foreground/80">
                            <Link href="/settings/profile" prefetch className="flex items-center justify-between">
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

            {/* 3. Footer (Version 1.3.0 Matching Screenshot) */}
            <SidebarFooter className="border-t border-border/70 p-3 text-[11px] text-muted-foreground">
                <div className="flex items-center justify-between">
                    <span>Version 1.3.0</span>
                    <span className="size-2 rounded-full bg-[#47b672]"></span>
                </div>
            </SidebarFooter>
        </Sidebar>
    );
}
