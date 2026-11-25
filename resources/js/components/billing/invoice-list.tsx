import { Download, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { money } from './types';
import type { Invoice } from './types';

export function InvoiceList({
    invoices,
    title = 'Invoices & receipts',
}: {
    invoices: Invoice[];
    title?: string;
}) {
    return (
        <Card className="min-w-0">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>
                    Download receipts for completed payments.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {invoices.length ? (
                    <div className="max-h-96 divide-y divide-border overflow-y-auto">
                        {invoices.map((invoice) => (
                            <div
                                key={invoice.id}
                                className="flex min-w-0 flex-wrap items-center justify-between gap-3 py-4 text-sm"
                            >
                                <div className="min-w-0">
                                    <p className="font-medium capitalize">
                                        {invoice.plan.replaceAll('_', ' ')}
                                    </p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        {new Date(
                                            invoice.created_at,
                                        ).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="flex flex-wrap items-center gap-3">
                                    <span className="font-semibold tabular-nums">
                                        {money(invoice.amount_paise)}
                                    </span>
                                    {invoice.status === 'paid' ? (
                                        <a
                                            href={`/settings/billing/invoices/${invoice.id}`}
                                            className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium hover:bg-muted"
                                            aria-label={`Download receipt dated ${new Date(invoice.created_at).toLocaleDateString()}`}
                                        >
                                            <Download className="size-3.5" />
                                            PDF
                                        </a>
                                    ) : (
                                        <Badge
                                            variant="outline"
                                            className="capitalize"
                                        >
                                            {invoice.status}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-3 py-10 text-center text-sm text-muted-foreground">
                        <FileText className="size-7" />
                        <p>No invoices yet. Your payments will appear here.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
