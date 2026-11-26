import { Head, Link } from '@inertiajs/react';
import { Bot, MessageCircle, Send } from 'lucide-react';
import {
    LoginBrand,
    LoginFooter,
    LoginStatus,
    LoginThemeToggle,
} from '@/components/auth/login-elements';
import { PanelLoginForm } from '@/components/auth/panel-login-form';
import { PanelLoginLinks } from '@/components/panel-login-links';

type Props = { status?: string; canResetPassword: boolean };

export default function Login({ status, canResetPassword }: Props) {
    return (
        <>
            <Head title="Client login | Sathwara" />
            <div className="grid min-h-svh bg-background text-foreground lg:grid-cols-2">
                <div className="flex flex-col px-6 py-6 sm:px-12 lg:px-16 xl:px-24">
                    <header className="flex items-center justify-between gap-4">
                        <LoginBrand />
                        <LoginThemeToggle />
                    </header>
                    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-14 sm:py-20">
                        <span className="mb-4 w-fit rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                            CLIENT WORKSPACE
                        </span>
                        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                            Welcome back.
                        </h1>
                        <p className="mt-3 mb-8 text-sm leading-6 text-muted-foreground">
                            Sign in to manage your business conversations,
                            campaigns, and automations.
                        </p>
                        <LoginStatus status={status} />
                        <PanelLoginForm
                            panel="user"
                            canResetPassword={canResetPassword}
                        />
                        <p className="mt-6 text-center text-sm text-muted-foreground">
                            New to Sathwara?{' '}
                            <Link
                                href="/register"
                                className="font-semibold text-emerald-700 hover:underline dark:text-emerald-400"
                            >
                                Create a workspace
                            </Link>
                        </p>
                        <PanelLoginLinks panel="user" />
                    </main>
                    <LoginFooter />
                </div>
                <aside className="relative hidden flex-col justify-center overflow-hidden bg-emerald-950 p-12 text-white lg:flex xl:p-20">
                    <div className="pointer-events-none absolute -top-40 -right-40 size-[560px] rounded-full border border-white/10" />
                    <div className="pointer-events-none absolute -top-20 -right-20 size-[400px] rounded-full border border-white/10" />
                    <div className="relative max-w-lg">
                        <span className="text-xs font-semibold tracking-[0.2em] text-emerald-300 uppercase">
                            Your business, connected
                        </span>
                        <h2 className="mt-6 text-4xl leading-tight font-semibold tracking-tight xl:text-5xl">
                            Better conversations.
                            <br />
                            Stronger connections.
                        </h2>
                        <p className="mt-6 max-w-md text-base leading-7 text-emerald-100/75">
                            Bring your WhatsApp conversations and customer
                            engagement together in one workspace.
                        </p>
                        <div className="mt-12 space-y-6">
                            {[
                                {
                                    icon: MessageCircle,
                                    title: 'One shared inbox',
                                    text: 'Keep your team and customer conversations in sync.',
                                },
                                {
                                    icon: Send,
                                    title: 'Campaigns that connect',
                                    text: 'Create and manage your WhatsApp broadcasts.',
                                },
                                {
                                    icon: Bot,
                                    title: 'Helpful automations',
                                    text: 'Build flows that keep conversations moving.',
                                },
                            ].map(({ icon: Icon, title, text }) => (
                                <div key={title} className="flex gap-4">
                                    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-emerald-300">
                                        <Icon className="size-5" />
                                    </span>
                                    <div>
                                        <h3 className="text-sm font-semibold">
                                            {title}
                                        </h3>
                                        <p className="mt-1 text-sm leading-6 text-emerald-100/65">
                                            {text}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </aside>
            </div>
        </>
    );
}
