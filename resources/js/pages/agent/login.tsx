import { PanelLoginLinks } from '@/components/panel-login-links';
import { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Briefcase,
    Mail,
    Lock,
    ArrowRight,
    ShieldCheck,
    CheckCircle2,
    Eye,
    EyeOff,
    Sun,
    Moon,
    TrendingUp,
    Percent,
    Building2,
    Gift,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppearance } from '@/hooks/use-appearance';

type Props = {
    status?: string;
};

export default function AgentLogin({ status }: Props) {
    const { errors, flash } = usePage().props as any;
    const { resolvedAppearance, updateAppearance } = useAppearance();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [remember, setRemember] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        router.post(
            '/agent/login',
            {
                email: email.trim(),
                password,
                remember,
            },
            {
                onFinish: () => setIsSubmitting(false),
            }
        );
    };

    const toggleTheme = () => {
        updateAppearance(resolvedAppearance === 'dark' ? 'light' : 'dark');
    };

    return (
        <>
            <Head title="B2B Partner & Reseller Sign In • Sathwara WhatsApp SaaS" />

            <div className="min-h-screen w-full bg-gradient-to-b from-background via-card/50 to-background flex flex-col justify-between p-4 sm:p-6 text-foreground relative overflow-hidden select-none">
                {/* Subtle Ambient Background Gradients */}
                <div className="absolute -top-32 -left-32 size-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
                <div className="absolute -bottom-32 -right-32 size-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

                {/* Top Nav Bar */}
                <header className="w-full max-w-5xl mx-auto flex items-center justify-between z-10">
                    <div className="flex items-center gap-2.5">
                        <div className="size-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/25">
                            <Briefcase className="size-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-1.5">
                                <span className="font-bold text-sm tracking-tight text-foreground">SATHWARA</span>
                                <span className="rounded bg-blue-500/15 px-1.5 py-0.5 text-[9px] font-bold text-blue-600 dark:text-blue-400 border border-blue-500/25">
                                    PARTNER B2B
                                </span>
                            </div>
                            <p className="text-[10px] text-muted-foreground">Reseller & Franchise Portal</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link
                            href="/login"
                            className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg border border-border/80 hover:bg-muted/60"
                        >
                            Client App Login &rarr;
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
                </header>

                {/* Main Card Container */}
                <main className="w-full max-w-4xl mx-auto my-auto z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center py-6">
                    {/* Left Column: Partner Perks & Value Prop */}
                    <div className="hidden lg:flex flex-col gap-6 lg:col-span-5 pr-4">
                        <div>
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 mb-3">
                                <TrendingUp className="size-3.5" />
                                <span>High-Earning Reseller Ecosystem</span>
                            </div>
                            <h2 className="text-2xl font-black tracking-tight text-foreground leading-tight">
                                Grow Your WhatsApp SaaS Business
                            </h2>
                            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                                Onboard businesses, manage client WhatsApp Cloud API setups with 1-click support mode, and earn direct recurring revenue.
                            </p>
                        </div>

                        <div className="space-y-3.5">
                            <div className="flex items-start gap-3 p-3 rounded-xl bg-card/60 border border-border/70 backdrop-blur-xs">
                                <div className="size-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                                    <Percent className="size-4" />
                                </div>
                                <div className="text-xs">
                                    <p className="font-bold text-foreground">₹500 Referral Commission</p>
                                    <p className="text-[11px] text-muted-foreground mt-0.5">
                                        Earn instant ₹500 credited to your wallet for every active client subscription.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-3 rounded-xl bg-card/60 border border-border/70 backdrop-blur-xs">
                                <div className="size-7 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                                    <Building2 className="size-4" />
                                </div>
                                <div className="text-xs">
                                    <p className="font-bold text-foreground">Direct Workspace Onboarding</p>
                                    <p className="text-[11px] text-muted-foreground mt-0.5">
                                        Create client workspaces in 1-click with ₹500 welcome bonus auto-injected.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-3 rounded-xl bg-card/60 border border-border/70 backdrop-blur-xs">
                                <div className="size-7 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                                    <ShieldCheck className="size-4" />
                                </div>
                                <div className="text-xs">
                                    <p className="font-bold text-foreground">1-Click Client Support Mode</p>
                                    <p className="text-[11px] text-muted-foreground mt-0.5">
                                        Jump into client accounts safely to configure Meta webhooks, templates, and bots without sharing passwords.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Sign In Form */}
                    <div className="lg:col-span-7">
                        <div className="w-full max-w-md mx-auto rounded-2xl border border-border/80 bg-card/95 shadow-xl p-6 sm:p-8 backdrop-blur-md">
                            <div className="text-center mb-6">
                                <div className="inline-flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25 mb-3">
                                    <Briefcase className="size-5" />
                                </div>
                                <h1 className="text-lg font-bold tracking-tight text-foreground">
                                    B2B Partner Sign In
                                </h1>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Enter your authorized partner credentials to manage your reseller accounts.
                                </p>
                            </div>

                            {/* Flash Status & Error Messages */}
                            {status && (
                                <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
                                    <CheckCircle2 className="size-4 shrink-0" />
                                    <span>{status}</span>
                                </div>
                            )}

                            {flash?.error && (
                                <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                                    <span>{flash.error}</span>
                                </div>
                            )}

                            {errors?.email && (
                                <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
                                    {errors.email}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="agent-email" className="text-xs font-semibold">
                                        Partner Email Address
                                    </Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                        <Input
                                            id="agent-email"
                                            type="email"
                                            required
                                            autoFocus
                                            autoComplete="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="partner@youragency.com"
                                            className="pl-9 text-xs h-10 border-border/80 focus-visible:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="agent-password" className="text-xs font-semibold">
                                            Password
                                        </Label>
                                        <Link
                                            href="/forgot-password"
                                            className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline"
                                        >
                                            Forgot?
                                        </Link>
                                    </div>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                        <Input
                                            id="agent-password"
                                            type={showPassword ? 'text' : 'password'}
                                            required
                                            autoComplete="current-password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••••••"
                                            className="pl-9 pr-9 text-xs h-10 border-border/80 focus-visible:ring-blue-500 font-mono"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        >
                                            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-1">
                                    <label className="flex items-center gap-2 cursor-pointer text-xs text-muted-foreground select-none">
                                        <input
                                            type="checkbox"
                                            checked={remember}
                                            onChange={(e) => setRemember(e.target.checked)}
                                            className="rounded border-border size-3.5 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span>Stay signed in for 30 days</span>
                                    </label>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full h-10 text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-500/20 cursor-pointer"
                                >
                                    {isSubmitting ? (
                                        <span>Authenticating Partner...</span>
                                    ) : (
                                        <span className="flex items-center justify-center gap-1.5">
                                            <span>Enter Partner Portal</span>
                                            <ArrowRight className="size-3.5" />
                                        </span>
                                    )}
                                </Button>
                            </form>
                            <PanelLoginLinks panel="agent" />

                            <div className="mt-6 pt-5 border-t border-border/60 text-center">
                                <p className="text-[11px] text-muted-foreground">
                                    Need a B2B Partner Account?{' '}
                                    <Link href="/register" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                                        Register Workspace
                                    </Link>{' '}
                                    and request agency onboarding.
                                </p>
                            </div>
                        </div>
                    </div>
                </main>

                {/* Footer */}
                <footer className="w-full max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between text-[11px] text-muted-foreground gap-2 pt-4 border-t border-border/40 z-10">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="size-3.5 text-blue-600" />
                        <span>Authorized Partner Access Only • End-to-End Meta API Integration</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/admin/login" className="hover:text-foreground transition-colors">
                            Super Admin Portal
                        </Link>
                        <span>•</span>
                        <Link href="/login" className="hover:text-foreground transition-colors">
                            Client Sign In
                        </Link>
                    </div>
                </footer>
            </div>
        </>
    );
}
