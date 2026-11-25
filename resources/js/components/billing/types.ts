export type Invoice = {
    id: string;
    plan: string;
    created_at: string;
    amount_paise: number;
    status: string;
};

export type BillingProfile = {
    name?: string;
    billing_email: string | null;
    gstin?: string | null;
    address?: string | null;
};

export type Plan = {
    name: string;
    amount_paise: number | null;
    validity_days?: number;
    features?: string[];
};

export type Notice = { type: 'success' | 'error'; message: string };

export const money = (paise: number) =>
    new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2,
    }).format(paise / 100);
