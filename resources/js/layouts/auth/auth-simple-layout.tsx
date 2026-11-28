import { Link } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import { home, privacy, terms } from '@/routes';
import type { AuthLayoutProps } from '@/types';
import { Moon, ShieldCheck, Sun } from 'lucide-react';
import { useAppearance } from '@/hooks/use-appearance';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    const { resolvedAppearance, updateAppearance } = useAppearance();

    return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-5 sm:p-8 relative overflow-hidden select-none">
            {/* Top theme toggle bar */}
            <div className="absolute top-5 right-5 sm:top-6 sm:right-6 z-20">
                <button
                    type="button"
                    onClick={() =>
                        updateAppearance(
                            resolvedAppearance === 'dark' ? 'light' : 'dark',
                        )
                    }
                    className="size-8 rounded-lg border border-border bg-card/70 hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    title="Toggle theme"
                >
                    {resolvedAppearance === 'dark' ? (
                        <Sun className="size-3.5 text-amber-400" />
                    ) : (
                        <Moon className="size-3.5 text-slate-600" />
                    )}
                </button>
            </div>

            {/* Ambient subtle background glow */}
            <div className="pointer-events-none absolute -top-32 -left-32 size-[420px] rounded-full bg-emerald-500/10 blur-[110px]" />
            <div className="pointer-events-none absolute -bottom-32 -right-32 size-[420px] rounded-full bg-teal-500/10 blur-[110px]" />

            <div className="w-full max-w-[420px] relative z-10">
                <div className="flex flex-col gap-5">
                    {/* Brand header */}
                    <div className="flex flex-col items-center gap-2">
                        <Link
                            href={home()}
                            className="group flex items-center gap-2.5 transition-transform hover:scale-[1.02]"
                        >
                            <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/25 shadow-xs shadow-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                                <AppLogoIcon className="size-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div className="flex flex-col text-left leading-tight">
                                <span className="text-sm font-bold tracking-tight text-foreground flex items-center gap-1.5">
                                    Sathwara
                                    <span className="text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.2 rounded-sm bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25">
                                        Cloud API
                                    </span>
                                </span>
                                <span className="text-[10px] text-muted-foreground font-medium">
                                    WhatsApp SaaS Suite
                                </span>
                            </div>
                        </Link>
                    </div>

                    {/* Card container */}
                    <div className="rounded-2xl border border-border/80 bg-card/90 backdrop-blur-md p-6 sm:p-7 shadow-xl shadow-foreground/5">
                        {(title || description) && (
                            <div className="mb-5 space-y-1 text-center">
                                {title && (
                                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                                        {title}
                                    </h1>
                                )}
                                {description && (
                                    <p className="text-xs text-muted-foreground">
                                        {description}
                                    </p>
                                )}
                            </div>
                        )}
                        {children}
                    </div>

                    {/* Bottom footer */}
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
                        <div className="flex items-center gap-1.5">
                            <ShieldCheck className="size-3.5 text-emerald-500" />
                            <span>Official WhatsApp Cloud API</span>
                        </div>
                        <div className="flex items-center gap-2">
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
