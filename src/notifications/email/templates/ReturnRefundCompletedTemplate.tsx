import React from 'react';
import { Section, Text } from '@react-email/components';
import { LuxuryEmailLayout } from '../layouts/LuxuryEmailLayout';
import { CTAButton } from '../components/CTAButton';

export interface ReturnRefundCompletedTemplateProps {
  customerName?: string;
  returnId?: string;
  amount?: number | string;
  deductionHtml?: string;
  walletUrl?: string;
}

export const ReturnRefundCompletedTemplate: React.FC<ReturnRefundCompletedTemplateProps> = ({
  customerName = 'Valued Collector',
  returnId = 'RET-001',
  amount = 4499,
  walletUrl = 'https://godsmove.in/profile?tab=wallet',
}) => {
  const previewText = `Return Refund Completed: ${returnId} | GODSMOVE`;

  const formattedAmount = typeof amount === 'number'
    ? `₹${amount.toLocaleString('en-IN')}`
    : (String(amount).startsWith('₹') ? String(amount) : `₹${amount}`);

  return (
    <LuxuryEmailLayout previewText={previewText}>
      <Section style={{ marginBottom: '24px' }}>
        <Text style={greetingStyle}>RETURN REFUND COMPLETED</Text>
        <Text style={bodyStyle}>
          Dear {customerName.toUpperCase()}, the refund for return request{' '}
          <strong style={{ color: '#ffffff' }}>{returnId}</strong> has been finalized and credited to your GODSMOVE Archival Privilege Vault.
        </Text>
      </Section>

      <Section style={cardStyle}>
        <Text style={labelStyle}>NET REFUND CREDITED</Text>
        <Text style={amountStyle}>{formattedAmount}</Text>

        <Text style={{ ...labelStyle, marginTop: '14px' }}>DESTINATION VAULT ACCOUNT</Text>
        <Text style={valueStyle}>GODSMOVE Privilege Credits (Available Immediately for Checkout)</Text>
      </Section>

      <Section style={{ textAlign: 'center', margin: '32px 0 16px 0' }}>
        <CTAButton href={walletUrl} variant="gold">
          VIEW VAULT BALANCE
        </CTAButton>
      </Section>
    </LuxuryEmailLayout>
  );
};

export default ReturnRefundCompletedTemplate;

const greetingStyle = { fontSize: '14px', fontWeight: 800, letterSpacing: '0.1em', color: '#22c55e', margin: '0 0 12px 0' };
const bodyStyle = { fontSize: '12px', color: '#a1a1aa', lineHeight: '20px', margin: '0' };
const cardStyle = { backgroundColor: '#121215', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '4px', padding: '20px', marginBottom: '28px' };
const labelStyle = { fontSize: '9px', fontWeight: 700, letterSpacing: '0.15em', color: '#8c857b', margin: '0 0 6px 0', textTransform: 'uppercase' as const };
const valueStyle = { fontSize: '11px', color: '#ffffff', margin: '2px 0 0 0' };
const amountStyle = { fontSize: '22px', fontWeight: 800, color: '#22c55e', margin: '2px 0 0 0' };
