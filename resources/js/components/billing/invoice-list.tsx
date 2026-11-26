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
        <Card className="min-w-0 shadow-2xs">
            <CardHeader className="p-3.5 pb-1">
                <CardTitle className="text-sm font-semibold">{title}</CardTitle>
                <CardDescription className="text-[11px]">
                    Download receipts for completed payments.
                </CardDescription>
            </CardHeader>
            <CardContent className="p-3.5 pt-1">
                {invoices.length ? (
                    <div className="max-h-60 divide-y divide-border overflow-y-auto">
                        {invoices.map((invoice) => (
                            <div
                                key={invoice.id}
                                className="flex min-w-0 flex-wrap items-center justify-between gap-2 py-2.5 text-xs"
                            >
                                <div className="min-w-0">
                                    <p className="font-medium capitalize">
                                        {invoice.plan.replaceAll('_', ' ')}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground">
                                        {new Date(
                                            invoice.created_at,
                                        ).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-semibold tabular-nums text-xs">
                                        {money(invoice.amount_paise)}
                                    </span>
                                    {invoice.status === 'paid' ? (
                                        <a
                                            href={`/settings/billing/invoices/${invoice.id}`}
                                            className="inline-flex h-7 items-center gap-1 rounded-md border px-2 text-[11px] font-medium hover:bg-muted"
                                            aria-label={`Download receipt dated ${new Date(invoice.created_at).toLocaleDateString()}`}
                                        >
                                            <Download className="size-3" />
                                            PDF
                                        </a>
                                    ) : (
                                        <Badge
                                            variant="outline"
                                            className="capitalize text-[10px] h-5"
                                        >
                                            {invoice.status}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center gap-1.5 py-6 text-center text-xs text-muted-foreground">
                        <FileText className="size-5 text-muted-foreground/50" />
                        <p>No invoices yet. Your payments will appear here.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
