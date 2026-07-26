import React from 'react';
import { Section, Text } from '@react-email/components';
import { LuxuryEmailLayout } from '../layouts/LuxuryEmailLayout';
import { CTAButton } from '../components/CTAButton';

export interface ReturnRejectedTemplateProps {
  customerName: string;
  returnId: string;
  reason?: string;
  supportUrl?: string;
}

export const ReturnRejectedTemplate: React.FC<ReturnRejectedTemplateProps> = ({
  customerName = 'Valued Collector',
  returnId = 'RET-001',
  reason = 'Return window exceeded or garment tags removed',
  supportUrl = 'https://godsmove.in/contact',
}) => {
  const previewText = `Return Notice: ${returnId}`;

  return (
    <LuxuryEmailLayout previewText={previewText}>
      <Section style={{ marginBottom: '24px' }}>
        <Text style={greetingStyle}>RETURN UNABLE TO PROCESS</Text>
        <Text style={bodyStyle}>
          Dear {customerName.toUpperCase()}, return request{' '}
          <strong style={{ color: '#ffffff' }}>{returnId}</strong> could not be processed under our archival policy.
        </Text>
      </Section>

      <Section style={cardStyle}>
        <Text style={labelStyle}>POLICY ADVISORY</Text>
        <Text style={valueStyle}>{reason}</Text>
      </Section>

      <Section style={{ textAlign: 'center', margin: '32px 0 16px 0' }}>
        <CTAButton href={supportUrl} variant="secondary">
          CONTACT CONCIERGE
        </CTAButton>
      </Section>
    </LuxuryEmailLayout>
  );
};

export default ReturnRejectedTemplate;

const greetingStyle = { fontSize: '14px', fontWeight: 800, letterSpacing: '0.1em', color: '#ef4444', margin: '0 0 12px 0' };
const bodyStyle = { fontSize: '12px', color: '#a1a1aa', lineHeight: '20px', margin: '0' };
const cardStyle = { backgroundColor: '#121215', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '4px', padding: '20px', marginBottom: '28px' };
const labelStyle = { fontSize: '9px', fontWeight: 700, letterSpacing: '0.15em', color: '#8c857b', margin: '0', textTransform: 'uppercase' as const };
const valueStyle = { fontSize: '12px', color: '#ffffff', margin: '2px 0 0 0' };
