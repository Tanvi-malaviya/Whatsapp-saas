import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { Form, Head, Link } from '@inertiajs/react';
import {
    Mail,
    Lock,
    ArrowRight,
    CheckCircle2,
    ShieldCheck,
    Sparkles,
    Send,
    Bot,
    Sun,
    Moon,
    Zap,
    CheckCheck,
} from 'lucide-react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AppLogoIcon from '@/components/app-logo-icon';
import { register, privacy, terms } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';
import { useAppearance } from '@/hooks/use-appearance';

type Props = {
    status?: string;
    canResetPassword: boolean;
};

export default function Login({ status, canResetPassword }: Props) {
    const { resolvedAppearance, updateAppearance } = useAppearance();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Dynamic interactive progress counter
    const [progress, setProgress] = useState(9840);
    useEffect(() => {
        const interval = setInterval(() => {
            setProgress((prev) => (prev >= 9980 ? 9820 : prev + 12));
        }, 2200);
        return () => clearInterval(interval);
    }, []);

    const toggleTheme = () => {
        updateAppearance(resolvedAppearance === 'dark' ? 'light' : 'dark');
    };

    return (
        <>
            <Head title="Sign In • Sathwara WhatsApp Cloud" />

            <div className="relative h-screen w-full bg-background text-foreground flex flex-col lg:grid lg:grid-cols-12 overflow-y-auto lg:overflow-hidden select-none">
                {/* LEFT COLUMN: Small, Simple & Clean Sign-In Form (5 cols on lg) */}
                <div className="flex-1 lg:col-span-5 xl:col-span-5 flex flex-col justify-between p-6 sm:p-8 xl:p-10 z-10">
                    {/* Header: Brand & Theme Toggle */}
                    <div className="flex items-center justify-between">
                        <Link
                            href="/"
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

                        <button
                            type="button"
                            onClick={toggleTheme}
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

                    {/* Centered Compact Form */}
                    <div className="w-full max-w-[360px] mx-auto my-auto py-2">
                        {/* Title Header */}
                        <div className="mb-5 text-left">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 mb-2">
                                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Official Meta Cloud v22.0
                            </span>
                            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                                Welcome back
                            </h1>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                Sign in to your WhatsApp marketing & bot workspace.
                            </p>
                        </div>

                        {/* Status notification */}
                        {status && (
                            <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs font-medium text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                                <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                                <span>{status}</span>
                            </div>
                        )}

                        {/* Form */}
                        <Form
                            {...store.form()}
                            resetOnSuccess={['password']}
                            className="space-y-3.5"
                        >
                            {({ processing, errors }) => (
                                <>
                                    {/* Email */}
                                    <div className="space-y-1">
                                        <Label
                                            htmlFor="email"
                                            className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"
                                        >
                                            <Mail className="size-3 text-emerald-600 dark:text-emerald-400" />
                                            Email Address
                                        </Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            name="email"
                                            required
                                            autoFocus
                                            tabIndex={1}
                                            autoComplete="email"
                                            placeholder="you@company.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="h-9 rounded-lg border-border bg-card/80 text-xs focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500 transition-all shadow-2xs"
                                        />
                                        <InputError message={errors.email} />
                                    </div>

                                    {/* Password */}
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <Label
                                                htmlFor="password"
                                                className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"
                                            >
                                                <Lock className="size-3 text-emerald-600 dark:text-emerald-400" />
                                                Password
                                            </Label>
                                            {canResetPassword && (
                                                <TextLink
                                                    href={request()}
                                                    className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
                                                    tabIndex={5}
                                                >
                                                    Forgot?
                                                </TextLink>
                                            )}
                                        </div>
                                        <PasswordInput
                                            id="password"
                                            name="password"
                                            required
                                            tabIndex={2}
                                            autoComplete="current-password"
                                            placeholder="••••••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="h-9 rounded-lg border-border bg-card/80 text-xs focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500 transition-all shadow-2xs"
                                        />
                                        <InputError message={errors.password} />
                                    </div>

                                    {/* Remember Me */}
                                    <div className="flex items-center justify-between pt-0.5">
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="remember"
                                                name="remember"
                                                tabIndex={3}
                                                className="rounded-sm data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                                            />
                                            <Label
                                                htmlFor="remember"
                                                className="text-xs font-normal text-muted-foreground cursor-pointer select-none"
                                            >
                                                Remember me
                                            </Label>
                                        </div>
                                    </div>

                                    {/* Sign In Button (WhatsApp Signature Green Theme) */}
                                    <Button
                                        type="submit"
                                        className="group h-10 w-full rounded-lg bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs shadow-md shadow-emerald-600/25 transition-all duration-200 active:scale-[0.99] flex items-center justify-center gap-1.5 cursor-pointer mt-1"
                                        tabIndex={4}
                                        disabled={processing}
                                        data-test="login-button"
                                    >
                                        {processing ? (
                                            <>
                                                <Spinner className="size-3.5 text-white" />
                                                <span>Signing in...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>Sign in to Workspace</span>
                                                <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                                            </>
                                        )}
                                    </Button>

                                    {/* Sign Up Link */}
                                    <div className="pt-2 text-center text-xs text-muted-foreground">
                                        Need an account?{' '}
                                        <Link
                                            href={register()}
                                            tabIndex={6}
                                            className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                                        >
                                            Create workspace
                                        </Link>
                                    </div>
                                </>
                            )}
                        </Form>
                    </div>

                    {/* Bottom Security Footer */}
                    <div className="pt-4 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                            <ShieldCheck className="size-3.5 text-emerald-500" />
                            <span>Meta Verified Cloud Partner</span>
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

                {/* RIGHT COLUMN: Interactive Live Showcase in WhatsApp Emerald & Slate Theme (7 cols on lg) */}
                <div className="hidden lg:col-span-7 xl:col-span-7 lg:flex relative overflow-hidden bg-gradient-to-br from-[#041315] via-[#061d1e] to-[#040f13] p-8 xl:p-12 text-white flex-col justify-between">
                    {/* Glowing WhatsApp Auroras */}
                    <div className="pointer-events-none absolute -top-24 -right-24 size-[420px] rounded-full bg-emerald-500/20 blur-[110px] animate-pulse-glow" />
                    <div className="pointer-events-none absolute -bottom-24 -left-24 size-[420px] rounded-full bg-teal-600/15 blur-[120px] animate-pulse-glow" />

                    {/* Top Status Banner */}
                    <div className="relative z-10 flex items-center justify-between">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 backdrop-blur-md">
                            <span className="size-2 rounded-full bg-emerald-400 animate-ping" />
                            <span>Live Meta Cloud Dispatch Engine</span>
                        </div>

                        <span className="text-[11px] text-emerald-400/80 font-mono flex items-center gap-1">
                            <Zap className="size-3 fill-emerald-400 text-emerald-400" />
                            High Throughput Tier
                        </span>
                    </div>

                    {/* Middle: Interactive Cards */}
                    <div className="relative z-10 my-auto py-6 space-y-4 max-w-xl">
                        <div className="space-y-1.5">
                            <h2 className="text-2xl xl:text-3xl font-extrabold tracking-tight text-white leading-tight">
                                Automate WhatsApp. Drive 98% open rates.
                            </h2>
                            <p className="text-xs xl:text-sm text-emerald-100/70">
                                Send 10,000+ broadcasts in seconds, deploy 24/7 AI response bots, and manage multi-agent chats in one unified workspace.
                            </p>
                        </div>

                        {/* Interactive Card 1: Live Animated Broadcast Dispatch */}
                        <div className="rounded-xl border border-emerald-500/25 bg-emerald-950/30 p-4 backdrop-blur-xl shadow-xl space-y-2.5 transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-500/40 hover:shadow-emerald-500/10">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="size-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                                        <Send className="size-3.5" />
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold text-white">
                                            Festive Flash Sale Broadcast
                                        </h4>
                                        <p className="text-[10px] text-emerald-200/60 font-mono">
                                            Template: order_promo_v2 • Approved
                                        </p>
                                    </div>
                                </div>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                                    <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    Dispatching
                                </span>
                            </div>

                            {/* Animated Progress Bar */}
                            <div className="space-y-1">
                                <div className="flex items-center justify-between text-[11px] text-emerald-100/80">
                                    <span>Sending to Contacts</span>
                                    <span className="font-bold text-emerald-300 font-mono">
                                        {progress.toLocaleString()} / 10,000 (98.4%)
                                    </span>
                                </div>
                                <div className="relative h-2 w-full rounded-full bg-white/10 overflow-hidden">
                                    <div className="h-full w-[98.4%] rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300 transition-all duration-500" />
                                </div>
                            </div>

                            {/* Mini KPIs */}
                            <div className="grid grid-cols-3 gap-2 pt-0.5">
                                <div className="rounded-lg bg-white/5 p-1.5 text-center border border-white/5">
                                    <div className="text-[9px] text-white/60">Delivered</div>
                                    <div className="text-xs font-bold text-white">99.1%</div>
                                </div>
                                <div className="rounded-lg bg-emerald-500/10 p-1.5 text-center border border-emerald-500/20">
                                    <div className="text-[9px] text-emerald-300">Open Rate</div>
                                    <div className="text-xs font-bold text-emerald-400">98.2%</div>
                                </div>
                                <div className="rounded-lg bg-white/5 p-1.5 text-center border border-white/5">
                                    <div className="text-[9px] text-white/60">Avg Response</div>
                                    <div className="text-xs font-bold text-teal-300">14s</div>
                                </div>
                            </div>
                        </div>

                        {/* Interactive Card 2: WhatsApp Live Chat & AI Bot Simulator */}
                        <div className="rounded-xl border border-emerald-500/25 bg-emerald-950/30 p-4 backdrop-blur-xl shadow-xl space-y-2.5 transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-500/40">
                            <div className="flex items-center justify-between pb-1 border-b border-white/10">
                                <div className="flex items-center gap-1.5">
                                    <div className="size-5 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                                        <Bot className="size-3" />
                                    </div>
                                    <span className="text-xs font-bold text-white">
                                        WhatsApp Live Chat & Bot Flow
                                    </span>
                                </div>
                                <span className="text-[10px] text-emerald-300/70 font-mono">
                                    Instant 24/7
                                </span>
                            </div>

                            {/* Chat Messages */}
                            <div className="space-y-2 text-xs">
                                {/* Customer Bubble */}
                                <div className="flex items-start gap-2">
                                    <div className="size-5 rounded-full bg-white/10 text-white/80 flex items-center justify-center text-[9px] font-bold shrink-0">
                                        C
                                    </div>
                                    <div className="rounded-xl rounded-tl-xs bg-white/10 border border-white/10 px-3 py-1.5 text-white/90 text-[11px] max-w-[85%]">
                                        Hi! Can I test the WhatsApp Cloud API demo?
                                    </div>
                                </div>

                                {/* Bot Bubble with WhatsApp Green Accent & Double Checkmark */}
                                <div className="flex items-start gap-2 justify-end">
                                    <div className="rounded-xl rounded-tr-xs bg-emerald-900/60 border border-emerald-500/30 px-3 py-2 text-emerald-100 text-[11px] max-w-[85%] space-y-1 shadow-md">
                                        <div className="flex items-center justify-between text-[10px] font-semibold text-emerald-300">
                                            <span className="flex items-center gap-1">
                                                <Sparkles className="size-2.5" />
                                                Sathwara AI Bot
                                            </span>
                                            <CheckCheck className="size-3 text-sky-400" />
                                        </div>
                                        <p>
                                            👋 Welcome! Here are our starter plans & instant setup wizard. An agent will also connect with you in this chat!
                                        </p>
                                    </div>
                                    <div className="size-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                                        <AppLogoIcon className="size-3 text-emerald-400" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Social Proof Bar */}
                    <div className="relative z-10 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-emerald-200/70">
                        <div className="flex items-center gap-1.5">
                            <span className="text-amber-400">★★★★★</span>
                            <span className="text-white/80 font-medium">4.9/5 from 1,200+ brands</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-emerald-400 font-medium">Zero Bans</span>
                            <span>•</span>
                            <span>99.9% Uptime</span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

Login.layout = (page: ReactNode) => page;
