import { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Crown,
    Mail,
    Lock,
    ArrowRight,
    ShieldAlert,
    ShieldCheck,
    CheckCircle2,
    Eye,
    EyeOff,
    Sun,
    Moon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppearance } from '@/hooks/use-appearance';

type Props = {
    status?: string;
};

export default function AdminLogin({ status }: Props) {
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
            '/admin/login',
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
            <Head title="Super Admin Sign In • Master SaaS Control" />

            <div className="min-h-screen w-full bg-gradient-to-b from-background via-card/50 to-background flex flex-col justify-between p-4 sm:p-6 text-foreground relative overflow-hidden select-none">
                {/* Subtle Ambient Background Gradients */}
                <div className="absolute -top-32 -left-32 size-96 rounded-full bg-rose-500/10 blur-3xl pointer-events-none" />
                <div className="absolute -bottom-32 -right-32 size-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

                {/* Top Nav Bar */}
                <header className="w-full max-w-5xl mx-auto flex items-center justify-between z-10">
                    <div className="flex items-center gap-2.5">
                        <div className="size-9 rounded-xl bg-gradient-to-br from-rose-500 to-amber-500 text-white flex items-center justify-center shadow-md shadow-rose-500/25">
                            <Crown className="size-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-1.5">
                                <span className="font-bold text-sm tracking-tight text-foreground">SATHWARA</span>
                                <span className="rounded bg-rose-500/15 px-1 py-0.2 text-[9px] font-bold text-rose-600 dark:text-rose-400 border border-rose-500/25">
                                    ADMIN
                                </span>
                            </div>
                            <p className="text-[10px] text-muted-foreground">Master SaaS Infrastructure</p>
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

                {/* Main Admin Login Card */}
                <main className="w-full max-w-md mx-auto my-auto py-8 z-10">
                    <div className="rounded-2xl border border-rose-500/20 bg-card/80 backdrop-blur-md p-6 sm:p-8 shadow-xl shadow-rose-500/5">
                        {/* Header Badge & Title */}
                        <div className="mb-6 text-center">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/25 mb-3">
                                <ShieldAlert className="size-3" />
                                Restricted Super Admin Login
                            </span>
                            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                                Master SaaS Portal
                            </h1>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Only accounts with Super Administrator privileges can authenticate here.
                            </p>
                        </div>

                        {/* Status Notice */}
                        {(status || flash?.success) && (
                            <div className="mb-4 rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-3 text-xs font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                                <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                                <span>{status || flash?.success}</span>
                            </div>
                        )}

                        {/* Error Notice */}
                        {(errors?.email || errors?.password || flash?.error) && (
                            <div className="mb-4 rounded-xl border border-rose-500/25 bg-rose-500/10 p-3 text-xs font-medium text-rose-600 dark:text-rose-400 flex items-start gap-2">
                                <ShieldAlert className="size-4 shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-semibold">{errors?.email || errors?.password || flash?.error}</p>
                                    <p className="text-[11px] text-muted-foreground mt-0.5">
                                        If you are a regular client, please use the{' '}
                                        <Link href="/login" className="underline font-medium text-foreground">
                                            Client Workspace Login
                                        </Link>.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Admin Login Form */}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                    <Mail className="size-3 text-rose-500" />
                                    <span>Super Admin Email</span>
                                </Label>
                                <Input
                                    type="email"
                                    required
                                    autoFocus
                                    placeholder="admin@sathwara.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="h-10 text-xs bg-background/70 border-border/80 focus-visible:ring-rose-500/30 focus-visible:border-rose-500"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                    <Lock className="size-3 text-rose-500" />
                                    <span>Master Password</span>
                                </Label>
                                <div className="relative">
                                    <Input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        placeholder="••••••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="h-10 text-xs pr-10 bg-background/70 border-border/80 focus-visible:ring-rose-500/30 focus-visible:border-rose-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        title={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-1">
                                <label className="flex items-center gap-2 cursor-pointer text-xs select-none">
                                    <input
                                        type="checkbox"
                                        checked={remember}
                                        onChange={(e) => setRemember(e.target.checked)}
                                        className="size-3.5 rounded text-rose-600 focus:ring-rose-500"
                                    />
                                    <span className="text-muted-foreground">Keep admin terminal active</span>
                                </label>
                            </div>

                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full h-10 font-bold text-xs gap-2 bg-gradient-to-r from-rose-600 to-amber-600 text-white hover:from-rose-500 hover:to-amber-500 shadow-md shadow-rose-600/20"
                            >
                                <ShieldCheck className="size-4" />
                                <span>{isSubmitting ? 'Authenticating...' : 'Sign In to Super Admin'}</span>
                                <ArrowRight className="size-3.5 ml-auto" />
                            </Button>
                        </form>
                    </div>

                    {/* Bottom Security Info */}
                    <div className="mt-6 text-center text-[11px] text-muted-foreground">
                        <p className="flex items-center justify-center gap-1.5">
                            <span className="size-1.5 rounded-full bg-emerald-500"></span>
                            <span>Direct Super Admin Gateway • TLS 1.3 End-to-End Secure</span>
                        </p>
                    </div>
                </main>

                {/* Footer */}
                <footer className="w-full max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between text-[11px] text-muted-foreground/60 border-t border-border/50 pt-4 z-10">
                    <p>&copy; {new Date().getFullYear()} Sathwara InfoTech. All rights reserved.</p>
                    <p className="mt-1 sm:mt-0 font-mono">Platform v22.0 • Meta Cloud API Engine</p>
                </footer>
            </div>
        </>
    );
}
