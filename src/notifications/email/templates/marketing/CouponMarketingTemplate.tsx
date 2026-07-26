import React from 'react';
import { Section, Text } from '@react-email/components';
import { LuxuryEmailLayout } from '../../layouts/LuxuryEmailLayout';
import { CTAButton } from '../../components/CTAButton';

export interface CouponMarketingTemplateProps {
  couponCode?: string;
  discountOffer?: string;
  validUntil?: string;
  shopUrl?: string;
}

export const CouponMarketingTemplate: React.FC<CouponMarketingTemplateProps> = ({
  couponCode = 'ARCHIVAL20',
  discountOffer = '20% OFF YOUR NEXT ALLOCATION',
  validUntil = 'Expires in 48 Hours',
  shopUrl = 'https://godsmove.in/drops',
}) => {
  return (
    <LuxuryEmailLayout previewText={`Exclusive Privilege Code: ${couponCode}`}>
      <Section style={{ marginBottom: '24px', textAlign: 'center' }}>
        <Text style={labelStyle}>PRIVILEGE ACCESS CODE</Text>
        <Text style={offerStyle}>{discountOffer}</Text>
      </Section>

      <Section style={cardStyle}>
        <Text style={codeLabel}>PROMO CODE</Text>
        <Text style={codeStyle}>{couponCode}</Text>
        <Text style={expiryStyle}>{validUntil}</Text>
      </Section>

      <Section style={{ textAlign: 'center', margin: '32px 0 16px 0' }}>
        <CTAButton href={shopUrl} variant="gold">
          REDEEM AT CHECKOUT
        </CTAButton>
      </Section>
    </LuxuryEmailLayout>
  );
};

export default CouponMarketingTemplate;

const labelStyle = { fontSize: '9px', fontWeight: 700, letterSpacing: '0.2em', color: '#c8a46a', margin: '0 0 6px 0', textTransform: 'uppercase' as const };
const offerStyle = { fontSize: '18px', fontWeight: 800, color: '#ffffff', margin: '0 0 16px 0' };
const cardStyle = { backgroundColor: '#121215', border: '1px border-dashed rgba(200, 164, 106, 0.4)', borderRadius: '4px', padding: '24px', textAlign: 'center' as const, marginBottom: '24px' };
const codeLabel = { fontSize: '9px', fontWeight: 700, letterSpacing: '0.15em', color: '#8c857b', margin: '0 0 4px 0' };
const codeStyle = { fontSize: '24px', fontWeight: 800, letterSpacing: '0.25em', color: '#c8a46a', margin: '0 0 8px 0' };
const expiryStyle = { fontSize: '11px', color: '#a1a1aa', margin: '0' };
