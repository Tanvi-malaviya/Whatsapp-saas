import { router } from '@inertiajs/react';
import { useState } from 'react';
import { api } from '@/lib/api';
import type { Notice } from './types';

type PaymentResult = {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
};
type Order = {
    requested?: boolean;
    message?: string;
    key: string;
    order_id: string;
    amount: number;
    currency: string;
    name: string;
    description: string;
    prefill: { email: string };
};
type RazorpayOptions = Order & {
    handler: (result: PaymentResult) => Promise<void>;
    modal: { ondismiss: () => void };
};
type RazorpayConstructor = new (options: RazorpayOptions) => {
    open: () => void;
    on: (
        event: string,
        handler: (result: { error?: { description?: string } }) => void,
    ) => void;
};

export function useCheckout(onSuccess?: () => void) {
    const [busy, setBusy] = useState(false);
    const [notice, setNotice] = useState<Notice | null>(null);

    const checkout = async (payload: {
        plan: string;
        messages_count?: number;
        category?: string;
    }) => {
        if (busy) return;
        setBusy(true);
        setNotice(null);
        try {
            const order = await api<Order>(
                '/settings/billing/checkout',
                'POST',
                payload,
            );
            if (order.requested) {
                setNotice({
                    type: 'success',
                    message: order.message ?? 'Request recorded.',
                });
                setBusy(false);
                return;
            }
            const checkoutWindow = window as Window & {
                Razorpay?: RazorpayConstructor;
            };
            if (!checkoutWindow.Razorpay) {
                await new Promise<void>((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
                    script.onload = () => resolve();
                    script.onerror = () =>
                        reject(
                            new Error(
                                'Could not load checkout. Please try again.',
                            ),
                        );
                    document.body.appendChild(script);
                });
            }
            if (!checkoutWindow.Razorpay)
                throw new Error('Checkout is unavailable. Please try again.');
            const widget = new checkoutWindow.Razorpay({
                ...order,
                handler: async (result) => {
                    try {
                        await api('/settings/billing/verify', 'POST', result);
                        setNotice({
                            type: 'success',
                            message: 'Payment verified successfully.',
                        });
                        onSuccess?.();
                        router.reload();
                    } catch (error) {
                        setNotice({
                            type: 'error',
                            message: (error as Error).message,
                        });
                    } finally {
                        setBusy(false);
                    }
                },
                modal: { ondismiss: () => setBusy(false) },
            });
            widget.on('payment.failed', (result) => {
                setNotice({
                    type: 'error',
                    message: result.error?.description ?? 'Payment failed.',
                });
                setBusy(false);
            });
            widget.open();
        } catch (error) {
            setNotice({ type: 'error', message: (error as Error).message });
            setBusy(false);
        }
    };
    return { busy, notice, setNotice, checkout };
}
