import { Head, Link } from '@inertiajs/react';
import { CheckCircle2, CreditCard, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { BillingNotice } from '@/components/billing/billing-notice';
import { InvoiceList } from '@/components/billing/invoice-list';
import { money } from '@/components/billing/types';
import type {
    BillingProfile,
    Invoice,
    Notice,
    Plan,
} from '@/components/billing/types';
import { useCheckout } from '@/components/billing/use-checkout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';

type Props = {
    currentPlan: string;
    subscriptionStatus: string;
    subscriptionExpiresAt: string | null;
    daysUntilExpiry: number | null;
    plans: Record<string, Plan>;
    usage: Record<string, number>;
    limits: Record<string, number>;
    invoices: Invoice[];
    profile: BillingProfile;
    checkoutReady: boolean;
};

export default function Subscription({
    currentPlan,
    subscriptionStatus,
    subscriptionExpiresAt,
    daysUntilExpiry,
    plans,
    usage,
    limits,
    invoices,
    profile,
    checkoutReady,
}: Props) {
    const { busy, notice, checkout } = useCheckout();
    const [details, setDetails] = useState({
        billing_email: profile.billing_email ?? '',
        gstin: profile.gstin ?? '',
        address: profile.address ?? '',
    });
    const [saving, setSaving] = useState(false);
    const [profileNotice, setProfileNotice] = useState<Notice | null>(null);
    const annual = plans.annual;
    const price = annual?.amount_paise;
    const validity = annual?.validity_days ?? 365;
    const saveProfile = async (event: FormEvent) => {
        event.preventDefault();
        setSaving(true);
        setProfileNotice(null);
        try {
            await api('/settings/billing/profile', 'PUT', details);
            setProfileNotice({
                type: 'success',
                message: 'Billing profile saved successfully.',
            });
        } catch (error) {
            setProfileNotice({
                type: 'error',
                message: (error as Error).message,
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <Head title="Subscription" />
            <div className="w-full min-w-0 max-w-5xl mx-auto space-y-3 p-3 sm:p-4 [overflow-wrap:anywhere]">
                <div className="flex items-center justify-between border-b border-border/60 pb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold tracking-wider text-primary uppercase bg-primary/10 px-2 py-0.5 rounded-full">
                            Your business plan
                        </span>
                        <p className="text-xs text-muted-foreground hidden sm:inline">
                            Manage your plan, renewal, billing details, and subscription invoices.
                        </p>
                    </div>
                    <Link
                        href="/wallet"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                    >
                        Open Wallet
                        <ExternalLink className="size-3" />
                    </Link>
                </div>

                <BillingNotice notice={notice} />
                {!checkoutReady && (
                    <BillingNotice
                        notice={{
                            type: 'error',
                            message:
                                'Online payments are unavailable. Contact your administrator to configure payments.',
                        }}
                    />
                )}

                <Card className="min-w-0 overflow-hidden border-primary/20 shadow-2xs">
                    <CardHeader className="bg-primary/5 p-3.5 pb-2.5">
                        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <CreditCard className="size-4 text-primary" />
                                    <CardTitle className="text-base font-bold">
                                        {plans[currentPlan]?.name ?? currentPlan}
                                    </CardTitle>
                                    <Badge
                                        variant="outline"
                                        className="capitalize text-[10px] h-4.5 px-1.5"
                                    >
                                        {subscriptionStatus}
                                    </Badge>
                                </div>
                                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                                    <span>
                                        {subscriptionExpiresAt
                                            ? `Expires ${new Date(subscriptionExpiresAt).toLocaleDateString()}`
                                            : 'No subscription expiry date'}
                                    </span>
                                    {daysUntilExpiry !== null && (
                                        <>
                                            <span>•</span>
                                            <span className={daysUntilExpiry <= 0 ? 'text-destructive font-semibold' : ''}>
                                                {daysUntilExpiry > 0
                                                    ? `${daysUntilExpiry} days remaining`
                                                    : daysUntilExpiry === 0
                                                      ? 'Expires today'
                                                      : `Expired ${Math.abs(daysUntilExpiry)} days ago`}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className="sm:text-right">
                                <div className="flex items-baseline gap-1 sm:justify-end">
                                    <span className="text-xl font-bold tabular-nums">
                                        {price != null ? money(price) : 'Contact sales'}
                                    </span>
                                    <span className="text-[11px] text-muted-foreground">/ {validity} days</span>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-3.5 pt-2.5 space-y-2.5">
                        <div className="grid gap-1.5 sm:grid-cols-2 xl:grid-cols-3">
                            {annual?.features?.map((feature) => (
                                <div
                                    key={feature}
                                    className="flex items-center gap-1.5 text-xs text-muted-foreground"
                                >
                                    <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600" />
                                    <span className="truncate">{feature}</span>
                                </div>
                            ))}
                        </div>
                        <div className="flex flex-col items-start justify-between gap-2 border-t border-border/60 pt-2 sm:flex-row sm:items-center">
                            <p className="text-[11px] text-muted-foreground">
                                Messaging credits are managed separately in your{' '}
                                <Link
                                    href="/wallet"
                                    className="font-medium text-primary underline underline-offset-4"
                                >
                                    wallet
                                </Link>
                                .
                            </p>
                            <Button
                                disabled={busy || !checkoutReady || price == null}
                                onClick={() => void checkout({ plan: 'annual' })}
                                size="sm"
                                className="h-7 text-xs font-semibold px-3 w-full shrink-0 sm:w-auto"
                            >
                                {busy ? 'Processing…' : `${subscriptionStatus === 'active' ? 'Renew' : 'Activate'} annual plan`}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Sleek, 1-Row Compact Metrics Strip */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {[
                        {
                            title: 'Messages this month',
                            value: usage.messages ?? 0,
                        },
                        {
                            title: 'Connected numbers',
                            value: `${usage.channels ?? 0} / ${limits.channels > 0 ? limits.channels : 'Unlimited'}`,
                        },
                        { title: 'Team members', value: usage.seats ?? 0 },
                    ].map((item) => (
                        <div
                            key={item.title}
                            className="flex items-center justify-between rounded-lg border border-border/70 bg-card px-3.5 py-2 shadow-2xs"
                        >
                            <span className="text-xs font-medium text-muted-foreground">
                                {item.title}
                            </span>
                            <span className="text-base font-bold tabular-nums text-foreground">
                                {item.value}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Billing Profile & Invoices Grid */}
                <div className="grid min-w-0 items-start gap-3 md:grid-cols-2">
                    <Card className="min-w-0 shadow-2xs">
                        <CardHeader className="p-3.5 pb-1">
                            <CardTitle className="text-sm font-semibold">Billing profile</CardTitle>
                            <CardDescription className="text-[11px]">
                                These details are used for your business billing records.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-3.5 pt-1">
                            <form onSubmit={saveProfile} className="space-y-2.5">
                                <BillingNotice notice={profileNotice} />
                                <div className="grid min-w-0 gap-2.5 md:grid-cols-2">
                                    <div className="min-w-0 space-y-1">
                                        <Label htmlFor="billing-email" className="text-xs">
                                            Billing email
                                        </Label>
                                        <Input
                                            id="billing-email"
                                            type="email"
                                            autoComplete="email"
                                            required
                                            maxLength={255}
                                            value={details.billing_email}
                                            onChange={(event) =>
                                                setDetails({
                                                    ...details,
                                                    billing_email: event.target.value,
                                                })
                                            }
                                            className="h-7 text-xs"
                                        />
                                    </div>
                                    <div className="min-w-0 space-y-1">
                                        <Label htmlFor="gstin" className="text-xs">
                                            GSTIN (optional)
                                        </Label>
                                        <Input
                                            id="gstin"
                                            maxLength={15}
                                            value={details.gstin}
                                            onChange={(event) =>
                                                setDetails({
                                                    ...details,
                                                    gstin: event.target.value.toUpperCase(),
                                                })
                                            }
                                            placeholder="24AAAAA0000A1Z5"
                                            className="h-7 font-mono text-xs uppercase"
                                        />
                                    </div>
                                    <div className="space-y-1 md:col-span-2">
                                        <Label htmlFor="billing-address" className="text-xs">
                                            Billing address
                                        </Label>
                                        <textarea
                                            id="billing-address"
                                            autoComplete="street-address"
                                            rows={2}
                                            maxLength={1000}
                                            value={details.address}
                                            onChange={(event) =>
                                                setDetails({
                                                    ...details,
                                                    address: event.target.value,
                                                })
                                            }
                                            placeholder="Address, city, state, and postal code"
                                            className="w-full min-w-0 rounded-md border border-input bg-background p-1.5 text-xs focus-visible:outline-2 focus-visible:outline-ring"
                                        />
                                    </div>
                                </div>
                                <Button
                                    type="submit"
                                    disabled={saving}
                                    size="sm"
                                    className="h-7 text-xs px-3 w-full sm:w-auto"
                                >
                                    {saving ? 'Saving…' : 'Save billing profile'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    <InvoiceList
                        invoices={invoices}
                        title="Subscription invoices"
                    />
                </div>
            </div>
        </>
    );
}
