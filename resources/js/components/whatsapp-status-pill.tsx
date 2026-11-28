import { ChevronDown, ExternalLink } from 'lucide-react';
import { Link } from '@inertiajs/react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type ChannelInfo = {
    id: string;
    name: string;
    phoneNumber: string;
    isDefault: boolean;
    quality: string;
};

type Props = {
    isConnected?: boolean;
    count?: number;
    phoneNumber?: string;
    channels?: ChannelInfo[];
};

export function WhatsAppStatusPill({
    isConnected = false,
    count = 0,
    phoneNumber,
    channels = [],
}: Props) {
    const totalCount = count || (isConnected ? 1 : 0);

    if (!isConnected || totalCount === 0) {
        return (
            <div className="flex items-center gap-2">
                <Link
                    href="/whatsapp/connect"
                    className="flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-50/60 px-2.5 py-1 text-xs text-amber-700 hover:bg-amber-100/80 dark:bg-amber-950/40 dark:text-amber-300 transition-colors"
                    title="Click to connect WhatsApp number"
                    aria-label="WhatsApp disconnected. Connect a number"
                >
                    <span className="size-2 rounded-full bg-amber-500"></span>
                    <span className="hidden font-medium sm:inline">WhatsApp Disconnected</span>
                    <span className="hidden min-[380px]:inline sm:hidden font-medium">Offline</span>
                </Link>
            </div>
        );
    }

    // Single number connected
    if (totalCount === 1) {
        return (
            <Link
                href="/whatsapp/connect"
                className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-50/60 px-2 sm:px-3 py-0.5 sm:py-1 text-[11px] sm:text-xs text-emerald-700 hover:bg-emerald-100/70 dark:bg-emerald-950/40 dark:text-emerald-300 transition-colors cursor-pointer shrink-0"
                title="Manage WhatsApp Channels"
                aria-label="WhatsApp connected. Manage channels"
            >
                <span className="relative flex size-2 shrink-0">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex size-2 rounded-full bg-emerald-500"></span>
                </span>
                <span className="hidden font-medium sm:inline">WhatsApp Connected</span>
                <span className="hidden min-[380px]:inline sm:hidden font-medium">Connected</span>
                {phoneNumber && <span className="hidden opacity-80 xl:inline">({phoneNumber})</span>}
            </Link>
        );
    }

    // Multiple numbers connected: interactive dropdown menu
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-50/80 px-2 sm:px-3 py-0.5 sm:py-1 text-[11px] sm:text-xs text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 transition-all cursor-pointer shadow-2xs shrink-0"
                >
                    <span className="relative flex size-2 shrink-0">
                        <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex size-2 rounded-full bg-emerald-500"></span>
                    </span>
                    <span className="font-semibold hidden sm:inline">{totalCount} Numbers Active</span>
                    <span className="font-semibold hidden min-[380px]:inline sm:hidden">{totalCount} Active</span>
                    {phoneNumber && (
                        <span className="opacity-75 hidden md:inline">
                            (Default: {phoneNumber})
                        </span>
                    )}
                    <ChevronDown className="size-3 opacity-60 ml-0.5" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 p-1.5">
                <div className="px-2 py-1.5 border-b border-border text-[11px] font-semibold text-muted-foreground flex items-center justify-between">
                    <span>CONNECTED NUMBERS ({totalCount})</span>
                    <span className="text-[10px] text-emerald-600 font-medium">Meta Cloud API</span>
                </div>
                <div className="py-1 max-h-56 overflow-y-auto space-y-0.5">
                    {channels && channels.length > 0 ? (
                        channels.map((ch) => (
                            <Link
                                key={ch.id}
                                href="/whatsapp/connect"
                                className="flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-muted text-xs transition-colors"
                            >
                                <div className="flex items-center gap-2 min-w-0">
                                    <span className="size-2 rounded-full bg-emerald-500 shrink-0" />
                                    <div className="truncate">
                                        <div className="font-medium text-foreground truncate">{ch.name || 'WhatsApp'}</div>
                                        <div className="text-[11px] text-muted-foreground font-mono">{ch.phoneNumber || 'Number Connected'}</div>
                                    </div>
                                </div>
                                {ch.isDefault && (
                                    <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-primary/10 text-primary font-bold shrink-0">
                                        Default
                                    </span>
                                )}
                            </Link>
                        ))
                    ) : (
                        <div className="px-2 py-1 text-xs text-muted-foreground">
                            {phoneNumber || 'No numbers available'}
                        </div>
                    )}
                </div>
                <div className="pt-1 border-t border-border mt-1">
                    <Link
                        href="/whatsapp/connect"
                        className="flex items-center justify-center gap-1.5 w-full py-1.5 text-xs text-primary font-medium hover:underline"
                    >
                        <span>Manage All Numbers</span>
                        <ExternalLink className="size-3" />
                    </Link>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
