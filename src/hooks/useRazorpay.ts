'use client';

import { useCallback } from 'react';

interface RazorpayOptions {
  amount: number;
  currency?: string;
  name?: string;
  description?: string;
  onSuccess?: (response: RazorpayResponse) => void;
  onError?: (error: unknown) => void;
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
      open: () => void;
    };
  }
}

export function useRazorpay() {
  const loadScript = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }, []);

  const initiatePayment = useCallback(async ({
    amount,
    currency = 'INR',
    name = 'GODSMOVE',
    description = 'Fashion Purchase',
    onSuccess,
    onError,
  }: RazorpayOptions) => {
    const loaded = await loadScript();
    if (!loaded) {
      onError?.('Failed to load Razorpay SDK');
      return;
    }

    try {
      // Create order on server
      const res = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });
      const order = await res.json();

      if (!order.id) {
        onError?.('Failed to create order');
        return;
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency,
        name,
        description,
        order_id: order.id,
        handler: async (response: RazorpayResponse) => {
          // Verify payment on server
          const verifyRes = await fetch('/api/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(response),
          });
          const verification = await verifyRes.json();

          if (verification.verified) {
            onSuccess?.(response);
          } else {
            onError?.('Payment verification failed');
          }
        },
        prefill: {
          name: '',
          email: '',
          contact: '',
        },
        theme: {
          color: '#0A0A0A',
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      onError?.(error);
    }
  }, [loadScript]);

  return { initiatePayment };
}
