import React from 'react';
import { Section, Text } from '@react-email/components';
import { LuxuryEmailLayout } from '../layouts/LuxuryEmailLayout';
import { CTAButton } from '../components/CTAButton';

export interface PaymentConfirmationTemplateProps {
  customerName?: string;
  orderNumber?: string;
  total?: number;
  transactionId?: string;
  paymentMethod?: string;
  viewInvoiceUrl?: string;
  downloadInvoiceUrl?: string;
  trackOrderUrl?: string;
}

export const PaymentConfirmationTemplate: React.FC<PaymentConfirmationTemplateProps> = ({
  customerName = 'Valued Collector',
  orderNumber = 'GM-2026-8801',
  total = 0,
  transactionId = 'pay_razorpay_default',
  paymentMethod = 'Online Payment (Razorpay)',
  viewInvoiceUrl = 'https://godsmove.in/profile',
  downloadInvoiceUrl = 'https://godsmove.in/profile',
  trackOrderUrl = 'https://godsmove.in/profile?tab=collection',
}) => {
  const previewText = `Payment Confirmed: Order ${orderNumber} | GODSMOVE`;

  return (
    <LuxuryEmailLayout previewText={previewText}>
      <Section style={{ marginBottom: '24px' }}>
        <Text style={greetingStyle}>PAYMENT CONFIRMED</Text>
        <Text style={bodyStyle}>
          Dear {customerName.toUpperCase()}, your payment of{' '}
          <strong style={{ color: '#22c55e' }}>₹{total.toLocaleString('en-IN')}</strong> for Order{' '}
          <strong style={{ color: '#ffffff' }}>{orderNumber}</strong> has been received and verified. Your allocation is now fully secured.
        </Text>
      </Section>

      <Section style={cardStyle}>
        <Text style={labelStyle}>PAYMENT RECEIPT DETAILS</Text>
        <Text style={valueStyle}><strong>Transaction Reference:</strong> {transactionId}</Text>
        <Text style={valueStyle}><strong>Payment Channel:</strong> {paymentMethod}</Text>
        <Text style={valueStyle}><strong>Amount Paid:</strong> ₹{total.toLocaleString('en-IN')}</Text>
        <Text style={{ ...valueStyle, marginTop: '8px', color: '#c8a46a' }}>
          ✓ OFFICIAL TAX INVOICE ATTACHED (PDF)
        </Text>
      </Section>

      <Section style={{ textAlign: 'center', margin: '32px 0 16px 0' }}>
        <table width="100%" cellPadding="0" cellSpacing="0">
          <tr>
            <td style={{ textAlign: 'center', paddingBottom: '12px' }}>
              <CTAButton href={trackOrderUrl} variant="gold">
                TRACK YOUR ALLOCATION
              </CTAButton>
            </td>
          </tr>
          <tr>
            <td style={{ textAlign: 'center' }}>
              <CTAButton href={viewInvoiceUrl} variant="secondary">
                VIEW TAX INVOICE
              </CTAButton>
            </td>
          </tr>
        </table>
      </Section>
    </LuxuryEmailLayout>
  );
};

export default PaymentConfirmationTemplate;

const greetingStyle = { fontSize: '14px', fontWeight: 800, letterSpacing: '0.1em', color: '#22c55e', margin: '0 0 12px 0' };
const bodyStyle = { fontSize: '12px', color: '#a1a1aa', lineHeight: '20px', margin: '0' };
const cardStyle = { backgroundColor: '#121215', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '4px', padding: '20px', marginBottom: '28px' };
const labelStyle = { fontSize: '9px', fontWeight: 700, letterSpacing: '0.15em', color: '#8c857b', margin: '0 0 8px 0', textTransform: 'uppercase' as const };
const valueStyle = { fontSize: '11px', color: '#ffffff', margin: '4px 0 0 0' };
