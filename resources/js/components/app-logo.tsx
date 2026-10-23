import AppLogoIcon from '@/components/app-logo-icon';

export default function AppLogo({ className = '' }: { className?: string }) {
    return (
        <div className={`flex items-center gap-2.5 ${className}`}>
            <AppLogoIcon className="size-8 shrink-0 rounded-lg shadow-sm shadow-[#47b672]/30" />
            <div className="grid flex-1 text-left leading-none">
                <span className="truncate text-[15px] font-bold tracking-tight text-foreground">
                    Sathwara
                </span>
                <span className="truncate text-[10px] font-semibold text-[#349c5e] dark:text-[#52c480] uppercase tracking-wider mt-0.5">
                    WhatsApp Cloud
                </span>
            </div>
        </div>
    );
}
