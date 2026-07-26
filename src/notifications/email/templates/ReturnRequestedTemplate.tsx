import React from 'react';
import { Section, Text } from '@react-email/components';
import { LuxuryEmailLayout } from '../layouts/LuxuryEmailLayout';
import { CTAButton } from '../components/CTAButton';

export interface ReturnRequestedTemplateProps {
  customerName: string;
  returnId: string;
  orderNumber: string;
  reason?: string;
  actionUrl?: string;
}

export const ReturnRequestedTemplate: React.FC<ReturnRequestedTemplateProps> = ({
  customerName = 'Valued Collector',
  returnId = 'RET-001',
  orderNumber = 'GM-2026-8801',
  reason = 'Sizing fit adjustment',
  actionUrl = 'https://godsmove.in/profile',
}) => {
  const previewText = `Return Request Received: ${returnId}`;

  return (
    <LuxuryEmailLayout previewText={previewText}>
      <Section style={{ marginBottom: '24px' }}>
        <Text style={greetingStyle}>RETURN REQUEST RECEIVED</Text>
        <Text style={bodyStyle}>
          Dear {customerName.toUpperCase()}, your return request for order{' '}
          <strong style={{ color: '#ffffff' }}>{orderNumber}</strong> has been logged. Our quality audit team will review your request within 24 hours.
        </Text>
      </Section>

      <Section style={cardStyle}>
        <Text style={labelStyle}>RETURN REFERENCE</Text>
        <Text style={valueStyle}>{returnId}</Text>
        <Text style={{ ...labelStyle, marginTop: '12px' }}>REASON</Text>
        <Text style={{ ...valueStyle, color: '#a1a1aa' }}>{reason}</Text>
      </Section>

      <Section style={{ textAlign: 'center', margin: '32px 0 16px 0' }}>
        <CTAButton href={actionUrl} variant="gold">
          VIEW RETURN STATUS
        </CTAButton>
      </Section>
    </LuxuryEmailLayout>
  );
};

export default ReturnRequestedTemplate;

const greetingStyle = { fontSize: '14px', fontWeight: 800, letterSpacing: '0.1em', color: '#c8a46a', margin: '0 0 12px 0' };
const bodyStyle = { fontSize: '12px', color: '#a1a1aa', lineHeight: '20px', margin: '0' };
const cardStyle = { backgroundColor: '#121215', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '4px', padding: '20px', marginBottom: '28px' };
const labelStyle = { fontSize: '9px', fontWeight: 700, letterSpacing: '0.15em', color: '#8c857b', margin: '0', textTransform: 'uppercase' as const };
const valueStyle = { fontSize: '12px', color: '#ffffff', margin: '2px 0 0 0' };
