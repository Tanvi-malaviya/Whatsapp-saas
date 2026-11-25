import { Head } from '@inertiajs/react';
import { ShieldCheck } from 'lucide-react';
import {
    LoginBrand,
    LoginFooter,
    LoginStatus,
    LoginThemeToggle,
} from '@/components/auth/login-elements';
import { PanelLoginForm } from '@/components/auth/panel-login-form';
import { PanelLoginLinks } from '@/components/panel-login-links';

export default function AdminLogin({ status }: { status?: string }) {
    return (
        <>
            <Head title="Super admin login | Sathwara" />
            <div className="flex min-h-svh flex-col bg-slate-100 px-6 py-6 text-foreground sm:px-10 dark:bg-slate-950">
                <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4">
                    <LoginBrand />
                    <LoginThemeToggle />
                </header>
                <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-12">
                    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xl shadow-slate-950/5">
                        <div className="h-1 bg-amber-500" />
                        <div className="p-6 sm:p-9">
                            <div className="mb-6 flex size-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400">
                                <ShieldCheck className="size-6" />
                            </div>
                            <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                                Platform administration
                            </p>
                            <h1 className="mt-3 text-3xl font-bold tracking-tight">
                                Super admin login
                            </h1>
                            <p className="mt-3 mb-7 text-sm leading-6 text-muted-foreground">
                                Sign in with your administrator account to
                                manage the Sathwara platform.
                            </p>
                            <LoginStatus status={status} />
                            <PanelLoginForm panel="admin" />
                            <div className="mt-6 flex items-start gap-2 rounded-lg bg-muted/70 p-3 text-xs leading-5 text-muted-foreground">
                                <ShieldCheck className="mt-0.5 size-4 shrink-0" />
                                <span>
                                    This portal is reserved for authorized super
                                    administrators.
                                </span>
                            </div>
                            <PanelLoginLinks panel="admin" />
                        </div>
                    </div>
                </main>
                <div className="mx-auto w-full max-w-6xl">
                    <LoginFooter />
                </div>
            </div>
        </>
    );
}
