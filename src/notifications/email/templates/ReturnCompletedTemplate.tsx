import React from 'react';
import { Section, Text } from '@react-email/components';
import { LuxuryEmailLayout } from '../layouts/LuxuryEmailLayout';
import { CTAButton } from '../components/CTAButton';
import { GODSMOVE_WORDMARK } from '../brand';

export interface ReturnCompletedTemplateProps {
  customerName: string;
  returnId: string;
  refundAmount: number;
  refundDestination?: string;
  walletUrl?: string;
}

export const ReturnCompletedTemplate: React.FC<ReturnCompletedTemplateProps> = ({
  customerName = 'Valued Collector',
  returnId = 'RET-001',
  refundAmount = 2999,
  refundDestination = `Original Payment Source / ${GODSMOVE_WORDMARK} Archival Vault`,
  walletUrl = 'https://godsmove.in/profile',
}) => {
  const previewText = `Return Settlement Completed: ${returnId}`;

  return (
    <LuxuryEmailLayout previewText={previewText}>
      <Section style={{ marginBottom: '24px' }}>
        <Text style={greetingStyle}>RETURN SETTLED</Text>
        <Text style={bodyStyle}>
          Dear {customerName.toUpperCase()}, return process for{' '}
          <strong style={{ color: '#ffffff' }}>{returnId}</strong> has been finalized and settled.
        </Text>
      </Section>

      <Section style={cardStyle}>
        <Text style={labelStyle}>REFUND AMOUNT</Text>
        <Text style={amountStyle}>₹{refundAmount.toLocaleString('en-IN')}</Text>

        <Text style={{ ...labelStyle, marginTop: '12px' }}>SETTLEMENT DESTINATION</Text>
        <Text style={valueStyle}>{refundDestination}</Text>
      </Section>

      <Section style={{ textAlign: 'center', margin: '32px 0 16px 0' }}>
        <CTAButton href={walletUrl} variant="gold">
          VIEW VAULT ACCOUNT
        </CTAButton>
      </Section>
    </LuxuryEmailLayout>
  );
};

export default ReturnCompletedTemplate;

const greetingStyle = { fontSize: '14px', fontWeight: 800, letterSpacing: '0.1em', color: '#22c55e', margin: '0 0 12px 0' };
const bodyStyle = { fontSize: '12px', color: '#a1a1aa', lineHeight: '20px', margin: '0' };
const cardStyle = { backgroundColor: '#121215', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '4px', padding: '20px', marginBottom: '28px' };
const labelStyle = { fontSize: '9px', fontWeight: 700, letterSpacing: '0.15em', color: '#8c857b', margin: '0', textTransform: 'uppercase' as const };
const valueStyle = { fontSize: '12px', color: '#ffffff', margin: '2px 0 0 0' };
const amountStyle = { fontSize: '20px', fontWeight: 800, color: '#22c55e', margin: '2px 0 0 0' };
