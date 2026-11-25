import { Link } from '@inertiajs/react';
import { CheckCircle2, MessageCircle, Moon, Sun } from 'lucide-react';
import { useAppearance } from '@/hooks/use-appearance';

export function LoginBrand() {
    return (
        <Link href="/" className="inline-flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-foreground text-background">
                <MessageCircle className="size-5" />
            </span>
            <span className="text-base font-bold tracking-tight">
                Sathwara
                <span className="block text-xs font-normal tracking-normal text-muted-foreground">
                    WhatsApp Business Platform
                </span>
            </span>
        </Link>
    );
}

export function LoginThemeToggle() {
    const { resolvedAppearance, updateAppearance } = useAppearance();
    const label =
        resolvedAppearance === 'dark'
            ? 'Switch to light theme'
            : 'Switch to dark theme';
    return (
        <button
            type="button"
            onClick={() =>
                updateAppearance(
                    resolvedAppearance === 'dark' ? 'light' : 'dark',
                )
            }
            aria-label={label}
            title={label}
            className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
            {resolvedAppearance === 'dark' ? (
                <Sun className="size-4" />
            ) : (
                <Moon className="size-4" />
            )}
        </button>
    );
}

export function LoginStatus({ status }: { status?: string }) {
    return status ? (
        <div
            role="status"
            className="mb-6 flex items-start gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/10 p-3 text-sm text-emerald-800 dark:text-emerald-300"
        >
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
            <span>{status}</span>
        </div>
    ) : null;
}

export function LoginFooter() {
    return (
        <footer className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
            <span>© {new Date().getFullYear()} Sathwara InfoTech</span>
            <div className="flex gap-4">
                <Link href="/privacy" className="hover:text-foreground">
                    Privacy
                </Link>
                <Link href="/terms" className="hover:text-foreground">
                    Terms
                </Link>
            </div>
        </footer>
    );
}
