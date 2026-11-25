import { AlertCircle, CheckCircle2 } from 'lucide-react';
import type { Notice } from './types';

export function BillingNotice({ notice }: { notice: Notice | null }) {
    if (!notice) return null;
    const Icon = notice.type === 'success' ? CheckCircle2 : AlertCircle;
    return (
        <div
            role={notice.type === 'error' ? 'alert' : 'status'}
            className={`flex items-start gap-2 rounded-xl border p-4 text-sm ${notice.type === 'success' ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300' : 'border-destructive/25 bg-destructive/10 text-destructive'}`}
        >
            <Icon className="mt-0.5 size-4 shrink-0" />
            <span className="min-w-0 break-words">{notice.message}</span>
        </div>
    );
}
