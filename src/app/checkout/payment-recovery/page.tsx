import { Suspense } from 'react';
import PaymentRecoveryClient from './PaymentRecoveryClient';

export const metadata = {
  title: 'Payment Resilience — GODSMOVE',
  description: 'Complete your GODSMOVE order reservation.',
};

export default function PaymentRecoveryPage({
  searchParams,
}: {
  searchParams: { orderId?: string };
}) {
  return (
    <main style={{ minHeight: '100vh', background: '#050505', color: '#f5f5f5' }}>
      <Suspense fallback={
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050505', color: '#c8a46a' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '40px', height: '40px', border: '2px solid rgba(200, 164, 106, 0.2)', borderTopColor: '#c8a46a', borderRadius: '50%', animation: 'spin 0.9s linear infinite', margin: '0 auto 16px' }} />
            <p style={{ fontFamily: 'var(--font-heading)', fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase' }}>Securing your payment session...</p>
          </div>
        </div>
      }>
        <PaymentRecoveryClient initialOrderId={searchParams.orderId} />
      </Suspense>
    </main>
  );
}
