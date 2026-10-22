import { MessageSquare } from 'lucide-react';

export default function AppLogo() {
    return (
        <div className="flex items-center gap-2.5">
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-500/20">
                <MessageSquare className="size-4.5 stroke-[2.2]" />
            </div>
            <div className="grid flex-1 text-left">
                <span className="truncate text-sm font-bold tracking-tight text-foreground leading-tight">
                    Sathwara
                </span>
                <span className="truncate text-[10px] font-medium text-emerald-600 dark:text-emerald-400 leading-tight">
                    WhatsApp SaaS
                </span>
            </div>
        </div>
    );
}
