import { Head, Link } from '@inertiajs/react';
import { Shield, Lock, CheckCircle2, ArrowLeft, Mail, Phone, Globe, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function PrivacyPolicy() {
    return (
        <>
            <Head title="Privacy Policy | Sathwara InfoTech WhatsApp SaaS" />

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
                                    Official WhatsApp Business Platform Partner
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
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-semibold">
                            <Shield className="size-3.5" />
                            <span>Meta Developer Policy Compliant</span>
                        </div>
                        <h2 className="text-3xl font-extrabold tracking-tight">
                            Privacy Policy
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Last Updated: November 2, 2026 • Sathwara InfoTech (Business ID: 976124469221838)
                        </p>
                    </div>

                    <div className="prose prose-slate dark:prose-invert max-w-none space-y-6 text-sm leading-relaxed text-foreground/90">
                        <section className="space-y-3">
                            <h3 className="text-lg font-bold text-foreground">1. Introduction</h3>
                            <p>
                                Sathwara InfoTech (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) operates the Sathwara WhatsApp Cloud Platform. We are committed to protecting your privacy and ensuring transparency in how we collect, process, and safeguard data in accordance with the Meta Platform Terms, WhatsApp Business Terms of Service, and applicable data protection regulations.
                            </p>
                        </section>

                        <section className="space-y-3">
                            <h3 className="text-lg font-bold text-foreground">2. Information We Collect</h3>
                            <p>To provide WhatsApp messaging and CRM services through Meta Cloud API, we collect:</p>
                            <ul className="list-disc pl-5 space-y-1.5 text-muted-foreground">
                                <li><strong>Account Information:</strong> Name, business name, official email address, and billing details.</li>
                                <li><strong>Meta Platform Data:</strong> WhatsApp Business Account ID (WABA ID), Phone Number ID, WhatsApp Display Name, and OAuth access tokens required to send messages via Meta Cloud API.</li>
                                <li><strong>Messaging Logs:</strong> Message delivery timestamps, read receipts, template submission statuses, and customer inquiry logs for unified team inbox routing.</li>
                            </ul>
                        </section>

                        <section className="space-y-3">
                            <h3 className="text-lg font-bold text-foreground">3. How We Use Your Data</h3>
                            <p>We process data solely for the following legitimate business purposes:</p>
                            <ul className="list-disc pl-5 space-y-1.5 text-muted-foreground">
                                <li>Connecting your phone number to official Meta WhatsApp Cloud API infrastructure.</li>
                                <li>Delivering customer-initiated chat messages, notifications, and scheduled broadcast campaigns.</li>
                                <li>Providing real-time analytics, cost tracking, and conversation metrics.</li>
                                <li>Ensuring compliance with Meta&apos;s anti-spam and quality rating standards.</li>
                            </ul>
                        </section>

                        <section className="space-y-3">
                            <h3 className="text-lg font-bold text-foreground">4. Strict Meta Data Protection & Non-Disclosure</h3>
                            <p className="p-4 rounded-xl bg-muted/40 border border-border/80">
                                <strong>We strictly do not sell, rent, or trade your Meta Platform Data or customer contact lists to any third parties or advertisers.</strong> All message payloads and access tokens are secured with AES-256 encryption in transit (TLS 1.3) and at rest.
                            </p>
                        </section>

                        <section className="space-y-3">
                            <h3 className="text-lg font-bold text-foreground">5. Data Retention & Deletion</h3>
                            <p>
                                You retain full ownership of your data. You may disconnect your WhatsApp channel or request total erasure of your account and messaging history at any time by contacting our support team or navigating to Settings &gt; Channel Settings in the portal.
                            </p>
                        </section>

                        <section className="space-y-3">
                            <h3 className="text-lg font-bold text-foreground">6. Contact Information</h3>
                            <div className="p-4 rounded-xl border border-border bg-card grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                                <div className="space-y-1">
                                    <span className="text-muted-foreground block">Company Entity</span>
                                    <strong className="text-foreground flex items-center gap-1.5">
                                        <Building2 className="size-3.5 text-[#1877F2]" />
                                        Sathwara InfoTech
                                    </strong>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-muted-foreground block">Support & Privacy Email</span>
                                    <strong className="text-foreground flex items-center gap-1.5">
                                        <Mail className="size-3.5 text-[#25D366]" />
                                        bhaveshsathwara72@gmail.com
                                    </strong>
                                </div>
                            </div>
                        </section>
                    </div>
                </main>
            </div>
        </>
    );
}
