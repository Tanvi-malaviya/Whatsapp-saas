import { Head, Link } from '@inertiajs/react';
import { Crown, ShieldCheck } from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';
import {
    LoginStatus,
    LoginThemeToggle,
} from '@/components/auth/login-elements';
import { PanelLoginForm } from '@/components/auth/panel-login-form';

export default function AdminLogin({ status }: { status?: string }) {
    return (
        <>
            <Head title="Super Admin Portal | Sathwara WhatsApp Cloud" />
            <div className="flex h-screen overflow-hidden flex-col items-center justify-center p-3 sm:p-4 bg-background text-foreground relative select-none">
                {/* Top-right theme toggle */}
                <div className="absolute top-3 right-3 sm:top-5 sm:right-5 z-20">
                    <LoginThemeToggle />
                </div>

                {/* Ambient glowing background accents */}
                <div className="pointer-events-none absolute -top-32 -left-32 size-[420px] rounded-full bg-emerald-500/10 blur-[110px]" />
                <div className="pointer-events-none absolute -bottom-32 -right-32 size-[420px] rounded-full bg-rose-500/10 blur-[110px]" />

                {/* Centered Pop-up Modal Container */}
                <div className="w-full max-w-[390px] relative z-10 flex flex-col gap-3 my-auto">
                    {/* Brand Header directly above card */}
                    <div className="flex flex-col items-center gap-1 text-center">
                        <Link href="/" className="inline-flex items-center gap-2 transition-transform hover:scale-[1.02]">
                            <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 shadow-xs shadow-emerald-500/20">
                                <AppLogoIcon className="size-4.5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div className="flex flex-col text-left leading-tight">
                                <span className="text-xs font-bold tracking-tight text-foreground flex items-center gap-1.5">
                                    Sathwara
                                    <span className="text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.2 rounded-sm bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/25">
                                        Admin Portal
                                    </span>
                                </span>
                                <span className="text-[10px] text-muted-foreground font-medium">
                                    Master SaaS Control
                                </span>
                            </div>
                        </Link>
                    </div>

                    {/* Pop-up Card */}
                    <div className="rounded-2xl border border-border/80 bg-card/95 backdrop-blur-md p-5 sm:p-6 shadow-2xl shadow-foreground/5">
                        {/* Status bar */}
                        <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-border/50">
                            <div className="flex items-center gap-2">
                                <div className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-rose-500 to-amber-500 text-white shadow-xs shadow-rose-500/25">
                                    <Crown className="size-3.5" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-1.5 leading-none">
                                        <span className="text-xs font-bold text-foreground">Super Administrator</span>
                                        <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    </div>
                                    <span className="text-[9px] font-medium text-rose-600 dark:text-rose-400">
                                        Root Access Required
                                    </span>
                                </div>
                            </div>
                            <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                                v22.0 Cloud
                            </span>
                        </div>

                        <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                            Master Admin Login
                        </h1>
                        <p className="mt-0.5 mb-3 text-[11px] sm:text-xs text-muted-foreground leading-normal">
                            Sign in to manage global WhatsApp numbers, workspaces, and automations.
                        </p>

                        <LoginStatus status={status} />

                        <PanelLoginForm panel="admin" compact />

                        {/* Security Notice */}
                        <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-1.5 text-[10px] text-muted-foreground">
                            <ShieldCheck className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                            <span className="leading-tight">
                                Restricted gateway. 256-bit SSL encrypted & monitored session.
                            </span>
                        </div>
                    </div>

                    {/* Centered Footer below Pop-up */}
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground px-1">
                        <div className="flex items-center gap-1.5">
                            <span className="size-1.5 rounded-full bg-emerald-500" />
                            <span>Meta Cloud API Partner</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span>© {new Date().getFullYear()} Sathwara</span>
                            <Link href="/privacy" className="hover:text-foreground transition-colors">
                                Privacy
                            </Link>
                            <Link href="/terms" className="hover:text-foreground transition-colors">
                                Terms
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
