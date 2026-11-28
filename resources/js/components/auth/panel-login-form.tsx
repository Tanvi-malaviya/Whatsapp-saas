import { useEffect } from 'react';
import { Link, useForm } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

type Props = {
    panel: 'user' | 'admin' | 'agent';
    canResetPassword?: boolean;
    compact?: boolean;
};

const panels = {
    user: {
        action: '/login',
        label: 'Sign in to workspace',
        email: 'Work email',
        color: 'bg-emerald-700 hover:bg-emerald-800 focus-visible:ring-emerald-500',
    },
    admin: {
        action: '/admin/login',
        label: 'Sign in to admin',
        email: 'Administrator email',
        color: 'bg-slate-900 hover:bg-slate-800 dark:bg-amber-400 dark:text-slate-950 dark:hover:bg-amber-300 focus-visible:ring-amber-500',
    },
    agent: {
        action: '/agent/login',
        label: 'Sign in to partner portal',
        email: 'Partner email',
        color: 'bg-blue-700 hover:bg-blue-800 focus-visible:ring-blue-500',
    },
};

export function PanelLoginForm({ panel, canResetPassword = false, compact = false }: Props) {
    const config = panels[panel];
    const emailId = `${panel}-email`;
    const passwordId = `${panel}-password`;
    const storageEmailKey = `sathwara_${panel}_remember_email`;
    const storagePassKey = `sathwara_${panel}_remember_pass`;

    const encodeVal = (val: string) => {
        try {
            return btoa(encodeURIComponent(val));
        } catch {
            return val;
        }
    };

    const decodeVal = (val: string) => {
        try {
            return decodeURIComponent(atob(val));
        } catch {
            return val;
        }
    };

    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    useEffect(() => {
        try {
            const savedEmail =
                localStorage.getItem(storageEmailKey) ||
                (panel === 'user' ? localStorage.getItem('sathwara_remember_email') : null);
            const savedPass =
                localStorage.getItem(storagePassKey) ||
                (panel === 'user' ? localStorage.getItem('sathwara_remember_pass') : null);

            if (savedEmail) {
                setData((prev) => ({
                    ...prev,
                    email: savedEmail,
                    password: savedPass ? decodeVal(savedPass) : prev.password,
                    remember: true,
                }));
            }
        } catch {
            // Ignore if localStorage is restricted
        }
    }, [panel, storageEmailKey, storagePassKey]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (data.remember && data.email) {
                localStorage.setItem(storageEmailKey, data.email.trim());
                if (data.password) {
                    localStorage.setItem(storagePassKey, encodeVal(data.password));
                }
                if (panel === 'user') {
                    localStorage.setItem('sathwara_remember_email', data.email.trim());
                    if (data.password) {
                        localStorage.setItem('sathwara_remember_pass', encodeVal(data.password));
                    }
                }
            } else {
                localStorage.removeItem(storageEmailKey);
                localStorage.removeItem(storagePassKey);
                if (panel === 'user') {
                    localStorage.removeItem('sathwara_remember_email');
                    localStorage.removeItem('sathwara_remember_pass');
                }
            }
        } catch {
            // Ignore if localStorage is restricted
        }

        post(config.action, {
            onFinish: () => {
                if (!data.remember) {
                    reset('password');
                }
            },
        });
    };

    return (
        <form
            onSubmit={handleSubmit}
            className={cn('space-y-5', compact && 'space-y-3.5')}
        >
            <div className={cn('space-y-2', compact && 'space-y-1.5')}>
                <Label htmlFor={emailId}>{config.email}</Label>
                <Input
                    id={emailId}
                    name="email"
                    type="email"
                    required
                    autoFocus={!data.email}
                    autoComplete="username"
                    value={data.email}
                    onChange={(e) => setData('email', e.target.value)}
                    placeholder="you@company.com"
                    className={cn(
                        'h-12 bg-background text-base md:text-sm',
                        compact && 'h-10 text-sm',
                    )}
                    aria-invalid={!!errors.email}
                    aria-describedby={
                        errors.email ? `${emailId}-error` : undefined
                    }
                />
                <InputError
                    id={`${emailId}-error`}
                    message={errors.email}
                    role="alert"
                />
            </div>
            <div className={cn('space-y-2', compact && 'space-y-1.5')}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <Label htmlFor={passwordId}>Password</Label>
                    {canResetPassword && (
                        <Link
                            href="/forgot-password"
                            className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                        >
                            Forgot password?
                        </Link>
                    )}
                </div>
                <PasswordInput
                    id={passwordId}
                    name="password"
                    required
                    autoComplete="current-password"
                    value={data.password}
                    onChange={(e) => setData('password', e.target.value)}
                    placeholder="Enter your password"
                    className={cn(
                        'h-12 bg-background text-base md:text-sm',
                        compact && 'h-10 text-sm',
                    )}
                    aria-invalid={!!errors.password}
                    aria-describedby={
                        errors.password
                            ? `${passwordId}-error`
                            : undefined
                    }
                />
                <InputError
                    id={`${passwordId}-error`}
                    message={errors.password}
                    role="alert"
                />
            </div>
            <div className="flex items-center gap-2.5">
                <Checkbox
                    id={`${panel}-remember`}
                    name="remember"
                    checked={data.remember}
                    onCheckedChange={(checked) => setData('remember', !!checked)}
                />
                <Label
                    htmlFor={`${panel}-remember`}
                    className="cursor-pointer font-normal text-muted-foreground text-sm select-none"
                >
                    Remember me
                </Label>
            </div>
            <Button
                type="submit"
                disabled={processing}
                className={cn(
                    'h-12 w-full gap-2 rounded-lg text-sm font-semibold text-white cursor-pointer transition-all',
                    compact && 'h-10 text-sm',
                    config.color,
                )}
                data-test="login-button"
            >
                {processing ? (
                    <>
                        <Spinner /> Signing in...
                    </>
                ) : (
                    <>
                        {config.label}
                        <ArrowRight className="size-4" />
                    </>
                )}
            </Button>
        </form>
    );
}
