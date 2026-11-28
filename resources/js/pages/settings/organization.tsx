import { Head, Link, useForm } from '@inertiajs/react';
import { Building2, Radio, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import InputError from '@/components/input-error';

type Organization = {
    name: string;
    slug: string;
    billing_email: string | null;
    timezone: string;
    currency: string;
};
type Member = {
    id: number;
    name: string;
    email: string;
    pivot?: { role: string };
};
type Channel = {
    id: string;
    name: string;
    phone_number: string;
    waba_id: string;
    status: string;
};

export default function OrganizationSettings({
    organization,
    members = [],
    channels = [],
}: {
    organization: Organization;
    members?: Member[];
    channels?: Channel[];
}) {
    const form = useForm({
        name: organization.name ?? '',
        slug: organization.slug ?? '',
        billing_email: organization.billing_email ?? '',
        timezone: organization.timezone ?? 'Asia/Kolkata',
        currency: organization.currency ?? 'INR',
    });
    const fields = [
        {
            key: 'name',
            label: 'Business name',
            placeholder: 'Your business name',
            type: 'text',
            autoComplete: 'organization',
        },
        {
            key: 'slug',
            label: 'Workspace slug',
            placeholder: 'your-business',
            type: 'text',
            autoComplete: 'off',
        },
        {
            key: 'billing_email',
            label: 'Billing email',
            placeholder: 'billing@company.com',
            type: 'email',
            autoComplete: 'email',
        },
        {
            key: 'timezone',
            label: 'Timezone',
            placeholder: 'Asia/Kolkata',
            type: 'text',
            autoComplete: 'off',
        },
    ] as const;

    return (
        <>
            <Head title="Organization settings" />
            <Card className="min-w-0">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Building2 className="size-5 text-primary" />
                        <CardTitle>Business profile</CardTitle>
                    </div>
                    <CardDescription>
                        Update your organization details and workspace
                        preferences.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            form.put('/settings/organization', {
                                preserveScroll: true,
                            });
                        }}
                        className="space-y-6"
                    >
                        <div className="grid min-w-0 gap-5 md:grid-cols-2 xl:grid-cols-3">
                            {fields.map(
                                ({
                                    key,
                                    label,
                                    placeholder,
                                    type,
                                    autoComplete,
                                }) => (
                                    <div
                                        key={key}
                                        className="min-w-0 space-y-2"
                                    >
                                        <Label htmlFor={`organization-${key}`}>
                                            {label}
                                        </Label>
                                        <Input
                                            id={`organization-${key}`}
                                            name={key}
                                            required
                                            type={type}
                                            autoComplete={autoComplete}
                                            maxLength={
                                                key === 'billing_email'
                                                    ? 255
                                                    : key === 'timezone'
                                                      ? undefined
                                                      : 100
                                            }
                                            value={form.data[key]}
                                            onChange={(event) =>
                                                form.setData(
                                                    key,
                                                    event.target.value,
                                                )
                                            }
                                            placeholder={placeholder}
                                            className="h-11 text-base md:text-sm"
                                            aria-invalid={!!form.errors[key]}
                                            aria-describedby={
                                                form.errors[key]
                                                    ? `${key}-error`
                                                    : undefined
                                            }
                                        />
                                        <InputError
                                            id={`${key}-error`}
                                            message={form.errors[key]}
                                        />
                                        {key === 'timezone' && (
                                            <p className="text-xs text-muted-foreground">
                                                Use an IANA timezone, such as
                                                Asia/Kolkata or UTC.
                                            </p>
                                        )}
                                    </div>
                                ),
                            )}
                            <div className="min-w-0 space-y-2">
                                <Label htmlFor="organization-currency">
                                    Currency
                                </Label>
                                <select
                                    id="organization-currency"
                                    name="currency"
                                    value={form.data.currency}
                                    onChange={(event) =>
                                        form.setData(
                                            'currency',
                                            event.target.value,
                                        )
                                    }
                                    className="h-11 w-full rounded-md border border-input bg-background px-3 text-base focus-visible:outline-2 focus-visible:outline-ring md:text-sm"
                                >
                                    {[
                                        {
                                            value: 'INR',
                                            label: 'INR — Indian rupee',
                                        },
                                        {
                                            value: 'USD',
                                            label: 'USD — US dollar',
                                        },
                                        { value: 'EUR', label: 'EUR — Euro' },
                                        {
                                            value: 'GBP',
                                            label: 'GBP — British pound',
                                        },
                                        {
                                            value: 'AED',
                                            label: 'AED — UAE dirham',
                                        },
                                    ].map(({ value, label }) => (
                                        <option key={value} value={value}>
                                            {label}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={form.errors.currency} />
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 border-t pt-5">
                            <Button
                                type="submit"
                                disabled={form.processing}
                                className="h-11 w-full sm:w-auto"
                            >
                                {form.processing ? 'Saving…' : 'Save settings'}
                            </Button>
                            {form.recentlySuccessful && (
                                <span
                                    role="status"
                                    className="text-sm text-emerald-700 dark:text-emerald-400"
                                >
                                    Settings saved successfully.
                                </span>
                            )}
                        </div>
                    </form>
                </CardContent>
            </Card>
            <div className="grid min-w-0 items-start gap-6 xl:grid-cols-2">
                <Card className="min-w-0">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Radio className="size-5 text-primary" />
                            <CardTitle>WhatsApp numbers</CardTitle>
                        </div>
                        <CardDescription>
                            Connections available in this workspace.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {channels.length ? (
                            channels.map((channel) => (
                                <div
                                    className="flex min-w-0 flex-col justify-between gap-3 rounded-xl border p-4 sm:flex-row sm:items-start"
                                    key={channel.id}
                                >
                                    <div className="min-w-0 space-y-1">
                                        <p className="text-sm font-medium">
                                            {channel.name}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {channel.phone_number}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            WABA {channel.waba_id}
                                        </p>
                                        <Badge
                                            variant="outline"
                                            className="capitalize"
                                        >
                                            {channel.status}
                                        </Badge>
                                    </div>
                                    <Link
                                        className="inline-flex min-h-10 shrink-0 items-center text-sm font-medium text-primary underline underline-offset-4"
                                        href={`/channels/${channel.id}`}
                                    >
                                        Manage connection
                                    </Link>
                                </div>
                            ))
                        ) : (
                            <p className="py-4 text-sm text-muted-foreground">
                                No numbers connected.
                            </p>
                        )}
                        <Button
                            asChild
                            variant="outline"
                            className="h-11 w-full sm:w-auto"
                        >
                            <Link href="/whatsapp/connect">
                                Manage WhatsApp numbers
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
