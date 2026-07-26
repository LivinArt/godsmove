import React from 'react';
import { Section, Text } from '@react-email/components';
import { LuxuryEmailLayout } from '../layouts/LuxuryEmailLayout';
import { CTAButton } from '../components/CTAButton';

export interface ReturnUpdateEmailProps {
  customerName: string;
  returnId: string;
  orderNumber: string;
  status: 'REQUESTED' | 'APPROVED' | 'INSPECTING' | 'REFUNDED' | 'REJECTED';
  refundAmount?: number;
  notes?: string;
  actionUrl?: string;
}

export const ReturnUpdateEmail: React.FC<ReturnUpdateEmailProps> = ({
  customerName = 'Valued Collector',
  returnId = 'RET-8801',
  orderNumber = 'GM-2026-8801',
  status = 'APPROVED',
  refundAmount = 2999,
  notes = 'Pickup scheduled via Express Logistics partner.',
  actionUrl = 'https://godsmove.in/profile',
}) => {
  const previewText = `Return Request ${returnId} Status Update: ${status}`;

  return (
    <LuxuryEmailLayout previewText={previewText}>
      <Section style={{ marginBottom: '24px' }}>
        <Text style={greetingStyle}>ARCHIVAL RETURN STATUS UPDATE</Text>
        <Text style={bodyStyle}>
          Dear {customerName.toUpperCase()}, your return request for allocation{' '}
          <strong style={{ color: '#ffffff' }}>{orderNumber}</strong> has been updated.
        </Text>
      </Section>

      <Section style={cardStyle}>
        <Text style={labelStyle}>RETURN REFERENCE</Text>
        <Text style={valueStyle}>{returnId}</Text>

        <Text style={{ ...labelStyle, marginTop: '12px' }}>STATUS</Text>
        <Text style={statusStyle}>{status}</Text>

        {refundAmount && (
          <>
            <Text style={{ ...labelStyle, marginTop: '12px' }}>REFUND AMOUNT</Text>
            <Text style={valueStyle}>₹{refundAmount.toLocaleString('en-IN')}</Text>
          </>
        )}

        {notes && (
          <>
            <Text style={{ ...labelStyle, marginTop: '12px' }}>NOTES</Text>
            <Text style={{ ...valueStyle, fontStyle: 'italic', color: '#a1a1aa' }}>{notes}</Text>
          </>
        )}
      </Section>

      <Section style={{ textAlign: 'center', margin: '32px 0 16px 0' }}>
        <CTAButton href={actionUrl} variant="gold">
          VIEW RETURN DETAILS
        </CTAButton>
      </Section>
    </LuxuryEmailLayout>
  );
};

export default ReturnUpdateEmail;

const greetingStyle = {
  fontSize: '14px',
  fontWeight: 800,
  letterSpacing: '0.1em',
  color: '#c8a46a',
  margin: '0 0 12px 0',
};

const bodyStyle = {
  fontSize: '12px',
  color: '#a1a1aa',
  lineHeight: '20px',
  margin: '0',
};

const cardStyle = {
  backgroundColor: '#121215',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: '4px',
  padding: '20px',
  marginBottom: '28px',
};

const labelStyle = {
  fontSize: '9px',
  fontWeight: 700,
  letterSpacing: '0.15em',
  color: '#8c857b',
  margin: '0',
  textTransform: 'uppercase' as const,
};

const valueStyle = {
  fontSize: '13px',
  fontWeight: 700,
  color: '#ffffff',
  margin: '2px 0 0 0',
};

const statusStyle = {
  fontSize: '14px',
  fontWeight: 800,
  color: '#c8a46a',
  letterSpacing: '0.1em',
  margin: '2px 0 0 0',
};
