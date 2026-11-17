import { Link } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import { home, privacy, terms } from '@/routes';
import type { AuthLayoutProps } from '@/types';
import { ShieldCheck } from 'lucide-react';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10 relative overflow-hidden">
            {/* Ambient subtle background glow */}
            <div className="pointer-events-none absolute -top-32 -left-32 size-[400px] rounded-full bg-primary/5 blur-[100px]" />
            <div className="pointer-events-none absolute -bottom-32 -right-32 size-[400px] rounded-full bg-emerald-500/5 blur-[100px]" />

            <div className="w-full max-w-md relative z-10">
                <div className="flex flex-col gap-6">
                    {/* Brand header */}
                    <div className="flex flex-col items-center gap-3">
                        <Link
                            href={home()}
                            className="group flex items-center gap-3 transition-transform hover:scale-105"
                        >
                            <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 shadow-xs shadow-primary/20">
                                <AppLogoIcon className="size-6 text-primary" />
                            </div>
                            <div className="flex flex-col text-left">
                                <span className="text-base font-bold tracking-tight text-foreground flex items-center gap-1.5">
                                    Sathwara
                                    <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded-sm bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                        Cloud API
                                    </span>
                                </span>
                                <span className="text-[11px] font-medium text-muted-foreground">
                                    WhatsApp Business Suite
                                </span>
                            </div>
                        </Link>
                    </div>

                    {/* Card container */}
                    <div className="rounded-2xl border border-border/80 bg-card/80 backdrop-blur-md p-6 sm:p-8 shadow-xl shadow-foreground/5">
                        {(title || description) && (
                            <div className="mb-6 space-y-1.5 text-center">
                                {title && (
                                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                                        {title}
                                    </h1>
                                )}
                                {description && (
                                    <p className="text-xs sm:text-sm text-muted-foreground">
                                        {description}
                                    </p>
                                )}
                            </div>
                        )}
                        {children}
                    </div>

                    {/* Bottom footer */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-muted-foreground px-2">
                        <div className="flex items-center gap-1.5">
                            <ShieldCheck className="size-3.5 text-emerald-500" />
                            <span>Meta Cloud API Partner</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Link href={privacy()} className="hover:text-foreground transition-colors">
                                Privacy
                            </Link>
                            <span>•</span>
                            <Link href={terms()} className="hover:text-foreground transition-colors">
                                Terms
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
