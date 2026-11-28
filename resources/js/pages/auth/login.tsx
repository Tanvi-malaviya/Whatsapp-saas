import { Head, Link } from '@inertiajs/react';
import { Bot, MessageCircle, Send } from 'lucide-react';
import {
    LoginBrand,
    LoginFooter,
    LoginStatus,
    LoginThemeToggle,
} from '@/components/auth/login-elements';
import { PanelLoginForm } from '@/components/auth/panel-login-form';

type Props = { status?: string; canResetPassword: boolean };

export default function Login({ status, canResetPassword }: Props) {
    return (
        <>
            <Head title="Client login | Sathwara" />
            <div className="grid min-h-svh lg:h-screen lg:overflow-hidden bg-background text-foreground lg:grid-cols-2">
                <div className="flex flex-col justify-between px-6 py-5 sm:px-10 lg:px-12 xl:px-16 h-full overflow-y-auto lg:overflow-hidden">
                    <header className="flex items-center justify-between gap-4">
                        <LoginBrand />
                        <LoginThemeToggle />
                    </header>
                    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center my-auto py-4 sm:py-6">
                        <span className="mb-2.5 w-fit rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                            CLIENT WORKSPACE
                        </span>
                        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                            Welcome back.
                        </h1>
                        <p className="mt-1.5 mb-6 text-xs sm:text-sm leading-5 sm:leading-6 text-muted-foreground">
                            Sign in to manage your business conversations,
                            campaigns, and automations.
                        </p>
                        <LoginStatus status={status} />
                        <PanelLoginForm
                            panel="user"
                            canResetPassword={canResetPassword}
                            compact
                        />
                        <p className="mt-4 text-center text-xs sm:text-sm text-muted-foreground">
                            New to Sathwara?{' '}
                            <Link
                                href="/register"
                                className="font-semibold text-emerald-700 hover:underline dark:text-emerald-400"
                            >
                                Create a workspace
                            </Link>
                        </p>
                    </main>
                    <LoginFooter />
                </div>
                <aside className="relative hidden flex-col justify-center overflow-hidden bg-emerald-950 p-8 text-white lg:flex xl:p-14">
                    <div className="pointer-events-none absolute -top-40 -right-40 size-[560px] rounded-full border border-white/10" />
                    <div className="pointer-events-none absolute -top-20 -right-20 size-[400px] rounded-full border border-white/10" />
                    <div className="relative max-w-md xl:max-w-lg">
                        <span className="text-xs font-semibold tracking-[0.2em] text-emerald-300 uppercase">
                            Your business, connected
                        </span>
                        <h2 className="mt-4 text-3xl leading-tight font-semibold tracking-tight xl:text-4xl">
                            Better conversations.
                            <br />
                            Stronger connections.
                        </h2>
                        <p className="mt-3 max-w-md text-sm leading-6 text-emerald-100/75">
                            Bring your WhatsApp conversations and customer
                            engagement together in one workspace.
                        </p>
                        <div className="mt-8 space-y-4 xl:mt-10 xl:space-y-5">
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
                                <div key={title} className="flex gap-3.5">
                                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-emerald-300">
                                        <Icon className="size-4.5" />
                                    </span>
                                    <div>
                                        <h3 className="text-sm font-semibold">
                                            {title}
                                        </h3>
                                        <p className="mt-0.5 text-xs sm:text-sm leading-5 sm:leading-6 text-emerald-100/65">
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
