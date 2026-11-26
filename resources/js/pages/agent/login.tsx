import { Head } from '@inertiajs/react';
import { BriefcaseBusiness, Building2, Users, Wallet } from 'lucide-react';
import {
    LoginBrand,
    LoginFooter,
    LoginStatus,
    LoginThemeToggle,
} from '@/components/auth/login-elements';
import { PanelLoginForm } from '@/components/auth/panel-login-form';
import { PanelLoginLinks } from '@/components/panel-login-links';

export default function AgentLogin({ status }: { status?: string }) {
    return (
        <>
            <Head title="B2B partner login | Sathwara" />
            <div className="flex min-h-svh flex-col bg-blue-50/50 px-6 py-6 text-foreground sm:px-10 dark:bg-background">
                <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4">
                    <LoginBrand />
                    <LoginThemeToggle />
                </header>
                <main className="mx-auto grid w-full max-w-5xl flex-1 items-center gap-12 py-12 lg:grid-cols-2 lg:gap-20">
                    <section className="hidden py-8 lg:block">
                        <span className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300">
                            <BriefcaseBusiness className="size-4" /> Sathwara
                            Partner Network
                        </span>
                        <h2 className="mt-6 text-5xl leading-tight font-semibold tracking-tight">
                            Your clients.
                            <br />
                            <span className="text-blue-700 dark:text-blue-400">
                                Your next chapter.
                            </span>
                        </h2>
                        <p className="mt-5 max-w-sm text-base leading-7 text-muted-foreground">
                            A dedicated space for agencies and resellers to
                            manage clients and grow their business.
                        </p>
                        <div className="mt-10 space-y-5">
                            {[
                                {
                                    icon: Building2,
                                    title: 'Manage client workspaces',
                                    text: 'Keep your client accounts organized.',
                                },
                                {
                                    icon: Users,
                                    title: 'Support your customers',
                                    text: 'Help businesses get more from their workspace.',
                                },
                                {
                                    icon: Wallet,
                                    title: 'Track your partner activity',
                                    text: 'View your wallet and referral activity.',
                                },
                            ].map(({ icon: Icon, title, text }) => (
                                <div
                                    key={title}
                                    className="flex items-start gap-3"
                                >
                                    <Icon className="mt-1 size-5 shrink-0 text-blue-600 dark:text-blue-400" />
                                    <div>
                                        <h3 className="text-sm font-semibold">
                                            {title}
                                        </h3>
                                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                            {text}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                    <section
                        aria-labelledby="partner-login-title"
                        className="mx-auto w-full max-w-md rounded-2xl border border-blue-500/15 bg-card p-6 shadow-xl shadow-blue-950/5 sm:p-9"
                    >
                        <div className="mb-6 flex size-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-700 dark:text-blue-400">
                            <BriefcaseBusiness className="size-6" />
                        </div>
                        <p className="text-xs font-semibold tracking-[0.16em] text-blue-700 uppercase dark:text-blue-400">
                            B2B partner portal
                        </p>
                        <h1
                            id="partner-login-title"
                            className="mt-3 text-3xl font-bold tracking-tight"
                        >
                            Partner login
                        </h1>
                        <p className="mt-3 mb-7 text-sm leading-6 text-muted-foreground">
                            Welcome back. Sign in with your partner account to
                            access your reseller dashboard.
                        </p>
                        <LoginStatus status={status} />
                        <PanelLoginForm panel="agent" canResetPassword />
                        <p className="mt-6 border-t border-border pt-5 text-sm leading-6 text-muted-foreground">
                            Need partner access? Contact your platform
                            administrator for onboarding.
                        </p>
                        <PanelLoginLinks panel="agent" />
                    </section>
                </main>
                <div className="mx-auto w-full max-w-6xl">
                    <LoginFooter />
                </div>
            </div>
        </>
    );
}
