import React from 'react';
import { Section, Text } from '@react-email/components';
import { LuxuryEmailLayout } from '../layouts/LuxuryEmailLayout';
import { CTAButton } from '../components/CTAButton';

export interface ReturnApprovedTemplateProps {
  customerName: string;
  returnId: string;
  pickupInstructions?: string;
  actionUrl?: string;
}

export const ReturnApprovedTemplate: React.FC<ReturnApprovedTemplateProps> = ({
  customerName = 'Valued Collector',
  returnId = 'RET-001',
  pickupInstructions = 'Our express courier partner will collect the boxed piece within 1-2 business days.',
  actionUrl = 'https://godsmove.in/profile',
}) => {
  const previewText = `Return Approved: ${returnId}`;

  return (
    <LuxuryEmailLayout previewText={previewText}>
      <Section style={{ marginBottom: '24px' }}>
        <Text style={greetingStyle}>RETURN APPROVED</Text>
        <Text style={bodyStyle}>
          Dear {customerName.toUpperCase()}, return request{' '}
          <strong style={{ color: '#ffffff' }}>{returnId}</strong> has been approved by our quality control concierge.
        </Text>
      </Section>

      <Section style={cardStyle}>
        <Text style={labelStyle}>PICKUP ADVISORY</Text>
        <Text style={valueStyle}>{pickupInstructions}</Text>
      </Section>

      <Section style={{ textAlign: 'center', margin: '32px 0 16px 0' }}>
        <CTAButton href={actionUrl} variant="gold">
          PREPARE SHIPMENT
        </CTAButton>
      </Section>
    </LuxuryEmailLayout>
  );
};

export default ReturnApprovedTemplate;

const greetingStyle = { fontSize: '14px', fontWeight: 800, letterSpacing: '0.1em', color: '#c8a46a', margin: '0 0 12px 0' };
const bodyStyle = { fontSize: '12px', color: '#a1a1aa', lineHeight: '20px', margin: '0' };
const cardStyle = { backgroundColor: '#121215', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '4px', padding: '20px', marginBottom: '28px' };
const labelStyle = { fontSize: '9px', fontWeight: 700, letterSpacing: '0.15em', color: '#8c857b', margin: '0', textTransform: 'uppercase' as const };
const valueStyle = { fontSize: '12px', color: '#ffffff', margin: '2px 0 0 0' };
