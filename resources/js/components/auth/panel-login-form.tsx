import { Form, Link } from '@inertiajs/react';
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

export function PanelLoginForm({ panel, canResetPassword = false }: Props) {
    const config = panels[panel];
    const emailId = `${panel}-email`;
    const passwordId = `${panel}-password`;

    return (
        <Form
            action={config.action}
            method="post"
            resetOnSuccess={['password']}
            className="space-y-5"
        >
            {({ processing, errors }) => (
                <>
                    <div className="space-y-2">
                        <Label htmlFor={emailId}>{config.email}</Label>
                        <Input
                            id={emailId}
                            name="email"
                            type="email"
                            required
                            autoFocus
                            autoComplete="username"
                            placeholder="you@company.com"
                            className="h-12 bg-background text-base md:text-sm"
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
                    <div className="space-y-2">
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
                            placeholder="Enter your password"
                            className="h-12 bg-background text-base md:text-sm"
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
                        <Checkbox id={`${panel}-remember`} name="remember" />
                        <Label
                            htmlFor={`${panel}-remember`}
                            className="cursor-pointer font-normal text-muted-foreground"
                        >
                            Remember me
                        </Label>
                    </div>
                    <Button
                        type="submit"
                        disabled={processing}
                        className={cn(
                            'h-12 w-full gap-2 rounded-lg text-sm font-semibold text-white',
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
                </>
            )}
        </Form>
    );
}
