// Components
import { Form, Head, Link } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, CheckCircle2, Mail } from 'lucide-react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { login } from '@/routes';
import { email } from '@/routes/password';

export default function ForgotPassword({ status }: { status?: string }) {
    return (
        <>
            <Head title="Forgot Password • Sathwara WhatsApp Cloud" />

            {status && (
                <div
                    role="status"
                    className="mb-5 flex items-start gap-2.5 rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-3 text-xs text-emerald-800 dark:text-emerald-300"
                >
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span>{status}</span>
                </div>
            )}

            <div className="space-y-4">
                <Form {...email.form()} className="space-y-4">
                    {({ processing, errors }) => (
                        <>
                            <div className="space-y-1.5 text-left">
                                <Label
                                    htmlFor="email"
                                    className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"
                                >
                                    <Mail className="size-3 text-emerald-600 dark:text-emerald-400" />
                                    Email address
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    autoComplete="email"
                                    autoFocus
                                    required
                                    placeholder="you@company.com"
                                    className="h-10 rounded-lg border-border bg-card/80 text-xs focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500 transition-all shadow-2xs"
                                    aria-invalid={!!errors.email}
                                />
                                <InputError message={errors.email} />
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-10 rounded-lg bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs shadow-md shadow-emerald-600/25 transition-all duration-200 active:scale-[0.99] flex items-center justify-center gap-1.5 cursor-pointer mt-2"
                                disabled={processing}
                                data-test="email-password-reset-link-button"
                            >
                                {processing ? (
                                    <>
                                        <Spinner className="size-3.5 text-white" />
                                        <span>Sending reset link...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Email password reset link</span>
                                        <ArrowRight className="size-3.5" />
                                    </>
                                )}
                            </Button>
                        </>
                    )}
                </Form>

                <div className="pt-2 text-center text-xs text-muted-foreground border-t border-border/40">
                    <Link
                        href={login()}
                        className="inline-flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                        <ArrowLeft className="size-3.5" />
                        Return to sign in
                    </Link>
                </div>
            </div>
        </>
    );
}

ForgotPassword.layout = {
    title: 'Forgot password',
    description: 'Enter your email to receive a password reset link',
};
