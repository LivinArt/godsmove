import React from 'react';
import { Section, Text } from '@react-email/components';
import { LuxuryEmailLayout } from '../layouts/LuxuryEmailLayout';
import { CTAButton } from '../components/CTAButton';

export interface CouponTemplateProps {
  customerName: string;
  couponCode: string;
  discountDescription: string;
  validUntil?: string;
  shopUrl?: string;
}

export const CouponTemplate: React.FC<CouponTemplateProps> = ({
  customerName = 'Valued Collector',
  couponCode = 'ARCHIVAL15',
  discountDescription = '15% Off Your Next Archival Piece',
  validUntil = 'Limited Window',
  shopUrl = 'https://godsmove.in/drops',
}) => {
  const previewText = `Exclusive Privilege Pass: ${couponCode}`;

  return (
    <LuxuryEmailLayout previewText={previewText}>
      <Section style={{ marginBottom: '24px' }}>
        <Text style={greetingStyle}>EXCLUSIVE PRIVILEGE PASS</Text>
        <Text style={bodyStyle}>
          Dear {customerName.toUpperCase()}, you have been granted an exclusive archival privilege pass.
        </Text>
      </Section>

      <Section style={cardStyle}>
        <Text style={labelStyle}>PRIVILEGE CODE</Text>
        <Text style={codeStyle}>{couponCode}</Text>
        <Text style={{ ...labelStyle, marginTop: '12px' }}>PRIVILEGE DETAILS</Text>
        <Text style={valueStyle}>{discountDescription}</Text>
        <Text style={{ ...labelStyle, marginTop: '12px' }}>VALIDITY</Text>
        <Text style={{ ...valueStyle, color: '#8c857b' }}>{validUntil}</Text>
      </Section>

      <Section style={{ textAlign: 'center', margin: '32px 0 16px 0' }}>
        <CTAButton href={shopUrl} variant="gold">
          REDEEM PRIVILEGE
        </CTAButton>
      </Section>
    </LuxuryEmailLayout>
  );
};

export default CouponTemplate;

const greetingStyle = { fontSize: '14px', fontWeight: 800, letterSpacing: '0.1em', color: '#c8a46a', margin: '0 0 12px 0' };
const bodyStyle = { fontSize: '12px', color: '#a1a1aa', lineHeight: '20px', margin: '0' };
const cardStyle = { backgroundColor: '#121215', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '4px', padding: '24px', marginBottom: '28px', textAlign: 'center' as const };
const labelStyle = { fontSize: '9px', fontWeight: 700, letterSpacing: '0.15em', color: '#8c857b', margin: '0', textTransform: 'uppercase' as const };
const codeStyle = { fontSize: '22px', fontWeight: 800, letterSpacing: '0.2em', color: '#ffffff', margin: '4px 0 0 0' };
const valueStyle = { fontSize: '13px', fontWeight: 700, color: '#c8a46a', margin: '2px 0 0 0' };
