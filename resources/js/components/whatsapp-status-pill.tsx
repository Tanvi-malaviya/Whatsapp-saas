import { MessageSquare, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link, usePage } from '@inertiajs/react';

type Props = {
    isConnected?: boolean;
    phoneNumber?: string;
};

export function WhatsAppStatusPill({ isConnected = false, phoneNumber }: Props) {
    const { url } = usePage();
    const isConnectPage = url.startsWith('/whatsapp/connect') || url.startsWith('/channels');

    if (isConnected) {
        return (
            <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-50/60 px-3 py-1 text-xs text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                <span className="relative flex size-2">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex size-2 rounded-full bg-emerald-500"></span>
                </span>
                <span className="font-medium">WhatsApp Connected</span>
                {phoneNumber && <span className="opacity-75">({phoneNumber})</span>}
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2">
            <Link
                href="/whatsapp/connect"
                className="flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-50/60 px-2.5 py-1 text-xs text-amber-700 hover:bg-amber-100/80 dark:bg-amber-950/40 dark:text-amber-300 transition-colors"
                title="Click to connect WhatsApp number"
            >
                <span className="size-2 rounded-full bg-amber-500"></span>
                <span className="font-medium">WhatsApp Disconnected</span>
            </Link>
        </div>
    );
}
