'use client';

import { useCallback } from 'react';

export interface RazorpayOptions {
  amount: number;
  currency?: string;
  name?: string;
  description?: string;
  orderId?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  onSuccess?: (response: RazorpayResponse) => void;
  onError?: (error: unknown) => void;
  onDismiss?: () => void;
}

export interface RazorpayResponse {
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

// Module-level singleton promise guard to ensure script loads strictly once per page lifecycle
let razorpayScriptLoadingPromise: Promise<boolean> | null = null;

export function loadRazorpaySDKScript(): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if ((window as any).Razorpay) return Promise.resolve(true);

  if (!razorpayScriptLoadingPromise) {
    razorpayScriptLoadingPromise = new Promise<boolean>((resolve) => {
      const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve(true));
        existingScript.addEventListener('error', () => resolve(false));
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  return razorpayScriptLoadingPromise;
}

export function useRazorpay() {
  const loadScript = useCallback((): Promise<boolean> => {
    return loadRazorpaySDKScript();
  }, []);

  const initiatePayment = useCallback(
    async ({
      amount,
      currency = 'INR',
      name = 'GODSMOVE',
      description = 'GODSMOVE Purchase',
      prefill,
      onSuccess,
      onError,
      onDismiss,
    }: RazorpayOptions) => {
      const loaded = await loadScript();
      if (!loaded) {
        onError?.(new Error('Failed to load Razorpay Checkout SDK script.'));
        return;
      }

      try {
        // Create Razorpay order via secure server API endpoint
        const res = await fetch('/api/payments/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount, currency }),
        });

        const orderData = await res.json();

        if (!res.ok || !orderData.orderId) {
          throw new Error(orderData.error || 'Failed to create payment gateway order.');
        }

        const options = {
          key: orderData.key,
          amount: orderData.amount,
          currency: orderData.currency,
          name,
          description,
          order_id: orderData.orderId,
          prefill: {
            name: prefill?.name || '',
            email: prefill?.email || '',
            contact: prefill?.contact || '',
          },
          theme: {
            color: '#0A0A0A',
          },
          handler: (response: RazorpayResponse) => {
            onSuccess?.(response);
          },
          modal: {
            ondismiss: () => {
              onDismiss?.();
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } catch (error) {
        onError?.(error);
      }
    },
    [loadScript]
  );

  return { initiatePayment, openRazorpayCheckout: initiatePayment, loadScript };
}
