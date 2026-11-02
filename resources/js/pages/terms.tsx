import { Head, Link } from '@inertiajs/react';
import { Shield, ArrowLeft, Mail, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TermsOfService() {
    return (
        <>
            <Head title="Terms of Service | Sathwara InfoTech WhatsApp SaaS" />

            <div className="min-h-screen bg-background text-foreground font-sans">
                {/* Header */}
                <header className="border-b border-border/80 bg-card/60 backdrop-blur-md sticky top-0 z-50">
                    <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="size-9 rounded-xl bg-gradient-to-br from-[#1877F2] to-[#25D366] flex items-center justify-center text-white font-bold shadow-md shadow-[#25D366]/20">
                                S
                            </div>
                            <div>
                                <h1 className="text-base font-bold text-foreground leading-none">
                                    Sathwara InfoTech
                                </h1>
                                <p className="text-[11px] text-muted-foreground mt-0.5">
                                    Terms of Service & WhatsApp Usage Terms
                                </p>
                            </div>
                        </div>

                        <Button variant="ghost" size="sm" asChild className="text-xs">
                            <Link href="/">
                                <ArrowLeft className="size-3.5 mr-1" /> Back to Home
                            </Link>
                        </Button>
                    </div>
                </header>

                {/* Main Content */}
                <main className="max-w-4xl mx-auto px-4 py-10 md:py-14 space-y-8">
                    <div className="space-y-3 text-center md:text-left border-b border-border/70 pb-6">
                        <h2 className="text-3xl font-extrabold tracking-tight">
                            Terms of Service
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Last Updated: November 2, 2026 • Sathwara InfoTech
                        </p>
                    </div>

                    <div className="prose prose-slate dark:prose-invert max-w-none space-y-6 text-sm leading-relaxed text-foreground/90">
                        <section className="space-y-3">
                            <h3 className="text-lg font-bold text-foreground">1. Acceptance of Terms</h3>
                            <p>
                                By accessing or utilizing the Sathwara InfoTech platform, you agree to abide by these Terms of Service, the Meta Business Terms, and WhatsApp Business Commerce & Messaging Policies.
                            </p>
                        </section>

                        <section className="space-y-3">
                            <h3 className="text-lg font-bold text-foreground">2. WhatsApp Business Usage</h3>
                            <p>
                                Users must ensure all recipients of WhatsApp broadcasts have provided explicit, verifiable opt-in consent. Spam, unsolicited marketing, or sending prohibited content as defined by WhatsApp Business Policy is strictly prohibited.
                            </p>
                        </section>

                        <section className="space-y-3">
                            <h3 className="text-lg font-bold text-foreground">3. Account Ownership & Security</h3>
                            <p>
                                You are solely responsible for maintaining the confidentiality of your account credentials and safeguarding API tokens. Sathwara InfoTech guarantees 99.9% platform availability for Meta Cloud API routing.
                            </p>
                        </section>

                        <section className="space-y-3">
                            <h3 className="text-lg font-bold text-foreground">4. Contact</h3>
                            <p>
                                For inquiries concerning these terms, please contact us at <strong>bhaveshsathwara72@gmail.com</strong>.
                            </p>
                        </section>
                    </div>
                </main>
            </div>
        </>
    );
}
