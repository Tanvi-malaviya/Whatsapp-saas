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
            <div className="w-full min-w-0 space-y-6 p-4 [overflow-wrap:anywhere] sm:p-6 lg:p-8">
                <header>
                    <p className="text-xs font-semibold tracking-wider text-primary uppercase">
                        Your business plan
                    </p>
                    <h1 className="mt-2 text-2xl font-semibold tracking-tight">
                        Subscription
                    </h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Manage your plan, renewal, billing details, and
                        subscription invoices.
                    </p>
                </header>
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
                <Card className="min-w-0 overflow-hidden border-primary/20">
                    <CardHeader className="bg-primary/5">
                        <div className="flex flex-col justify-between gap-5 sm:flex-row">
                            <div className="min-w-0">
                                <div className="mb-3 flex flex-wrap items-center gap-2">
                                    <CreditCard className="size-5 text-primary" />
                                    <Badge
                                        variant="outline"
                                        className="capitalize"
                                    >
                                        {subscriptionStatus}
                                    </Badge>
                                </div>
                                <CardTitle className="text-xl">
                                    {plans[currentPlan]?.name ?? currentPlan}
                                </CardTitle>
                                <CardDescription className="mt-2">
                                    {subscriptionExpiresAt
                                        ? `Expires ${new Date(subscriptionExpiresAt).toLocaleDateString()}`
                                        : 'No subscription expiry date recorded.'}
                                </CardDescription>
                                {daysUntilExpiry !== null && (
                                    <p
                                        className={`mt-2 text-sm font-medium ${daysUntilExpiry <= 0 ? 'text-destructive' : 'text-muted-foreground'}`}
                                    >
                                        {daysUntilExpiry > 0
                                            ? `${daysUntilExpiry} days remaining`
                                            : daysUntilExpiry === 0
                                              ? 'Expires today'
                                              : `Expired ${Math.abs(daysUntilExpiry)} days ago`}
                                    </p>
                                )}
                            </div>
                            <div className="sm:text-right">
                                <p className="text-xs text-muted-foreground">
                                    {annual?.name ?? 'Annual plan'}
                                </p>
                                <p className="mt-2 text-3xl font-bold tabular-nums">
                                    {price != null
                                        ? money(price)
                                        : 'Contact sales'}
                                </p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    {validity} days validity
                                </p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                            {annual?.features?.map((feature) => (
                                <div
                                    key={feature}
                                    className="flex items-start gap-2 text-sm"
                                >
                                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                                    <span>{feature}</span>
                                </div>
                            ))}
                        </div>
                        <div className="flex flex-col items-start justify-between gap-4 border-t pt-5 lg:flex-row lg:items-center">
                            <p className="text-sm leading-6 text-muted-foreground">
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
                                disabled={
                                    busy || !checkoutReady || price == null
                                }
                                onClick={() =>
                                    void checkout({ plan: 'annual' })
                                }
                                className="h-11 w-full shrink-0 sm:w-auto"
                            >
                                {busy
                                    ? 'Processing…'
                                    : `${subscriptionStatus === 'active' ? 'Renew' : 'Activate'} annual plan`}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
                <div className="grid gap-4 sm:grid-cols-3">
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
                        <Card key={item.title} className="min-w-0">
                            <CardContent className="pt-6">
                                <p className="text-sm text-muted-foreground">
                                    {item.title}
                                </p>
                                <p className="mt-3 text-2xl font-semibold tabular-nums">
                                    {item.value}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
                <div className="grid min-w-0 items-start gap-6 xl:grid-cols-2">
                    <Card className="min-w-0">
                        <CardHeader>
                            <CardTitle>Billing profile</CardTitle>
                            <CardDescription>
                                These details are used for your business billing
                                records.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={saveProfile} className="space-y-5">
                                <BillingNotice notice={profileNotice} />
                                <div className="grid min-w-0 gap-5 md:grid-cols-2">
                                    <div className="min-w-0 space-y-2">
                                        <Label htmlFor="billing-email">
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
                                                    billing_email:
                                                        event.target.value,
                                                })
                                            }
                                            className="h-11 text-base md:text-sm"
                                        />
                                    </div>
                                    <div className="min-w-0 space-y-2">
                                        <Label htmlFor="gstin">
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
                                            className="h-11 font-mono text-base md:text-sm"
                                        />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <Label htmlFor="billing-address">
                                            Billing address
                                        </Label>
                                        <textarea
                                            id="billing-address"
                                            autoComplete="street-address"
                                            rows={3}
                                            maxLength={1000}
                                            value={details.address}
                                            onChange={(event) =>
                                                setDetails({
                                                    ...details,
                                                    address: event.target.value,
                                                })
                                            }
                                            placeholder="Address, city, state, and postal code"
                                            className="w-full min-w-0 rounded-md border border-input bg-background p-3 text-base focus-visible:outline-2 focus-visible:outline-ring md:text-sm"
                                        />
                                    </div>
                                </div>
                                <Button
                                    type="submit"
                                    disabled={saving}
                                    className="h-11 w-full sm:w-auto"
                                >
                                    {saving
                                        ? 'Saving…'
                                        : 'Save billing profile'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                    <InvoiceList
                        invoices={invoices}
                        title="Subscription invoices"
                    />
                </div>
                <Link
                    href="/wallet"
                    className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-primary hover:underline"
                >
                    Open messaging wallet
                    <ExternalLink className="size-4" />
                </Link>
            </div>
        </>
    );
}
