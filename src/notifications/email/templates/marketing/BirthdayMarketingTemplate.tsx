import React from 'react';
import { Section, Text } from '@react-email/components';
import { LuxuryEmailLayout } from '../../layouts/LuxuryEmailLayout';
import { CTAButton } from '../../components/CTAButton';

export interface BirthdayMarketingTemplateProps {
  customerName?: string;
  giftCredit?: number;
  claimUrl?: string;
}

export const BirthdayMarketingTemplate: React.FC<BirthdayMarketingTemplateProps> = ({
  customerName = 'Valued Collector',
  giftCredit = 1000,
  claimUrl = 'https://godsmove.in/profile',
}) => {
  return (
    <LuxuryEmailLayout previewText="Happy Birthday from GODSMOVE Archival Concierge">
      <Section style={{ marginBottom: '24px', textAlign: 'center' }}>
        <Text style={labelStyle}>ANNIVERSARY COMPLIMENTARY</Text>
        <Text style={headlineStyle}>HAPPY BIRTHDAY, {customerName.toUpperCase()}</Text>
        <Text style={bodyStyle}>
          To celebrate your birthday, we have added a complimentary store credit to your Archival Vault account.
        </Text>
      </Section>

      <Section style={cardStyle}>
        <Text style={cardLabel}>BIRTHDAY GIFT CREDIT</Text>
        <Text style={creditStyle}>+ ₹{giftCredit.toLocaleString('en-IN')}</Text>
      </Section>

      <Section style={{ textAlign: 'center', margin: '32px 0 16px 0' }}>
        <CTAButton href={claimUrl} variant="gold">
          CLAIM BIRTHDAY GIFT
        </CTAButton>
      </Section>
    </LuxuryEmailLayout>
  );
};

export default BirthdayMarketingTemplate;

const labelStyle = { fontSize: '9px', fontWeight: 700, letterSpacing: '0.2em', color: '#c8a46a', margin: '0 0 6px 0', textTransform: 'uppercase' as const };
const headlineStyle = { fontSize: '20px', fontWeight: 800, letterSpacing: '0.08em', color: '#ffffff', margin: '0 0 12px 0' };
const bodyStyle = { fontSize: '12px', color: '#a1a1aa', lineHeight: '20px', margin: '0 0 16px 0' };
const cardStyle = { backgroundColor: '#121215', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '4px', padding: '24px', textAlign: 'center' as const };
const cardLabel = { fontSize: '9px', fontWeight: 700, letterSpacing: '0.15em', color: '#8c857b', margin: '0 0 4px 0' };
const creditStyle = { fontSize: '24px', fontWeight: 800, color: '#22c55e', margin: '0' };
