import React from 'react';
import { Section, Text } from '@react-email/components';
import { LuxuryEmailLayout } from '../../layouts/LuxuryEmailLayout';
import { CTAButton } from '../../components/CTAButton';

export interface LoyaltyUpgradeMarketingTemplateProps {
  customerName?: string;
  newTier?: string;
  tierBenefits?: string;
  accountUrl?: string;
}

export const LoyaltyUpgradeMarketingTemplate: React.FC<LoyaltyUpgradeMarketingTemplateProps> = ({
  customerName = 'Valued Collector',
  newTier = 'ARCHIVAL BLACK TIER',
  tierBenefits = 'Early Drop Access, Dedicated Concierge Support & 5% Automatic Store Cash',
  accountUrl = 'https://godsmove.in/profile',
}) => {
  return (
    <LuxuryEmailLayout previewText={`Tier Upgrade: ${newTier}`}>
      <Section style={{ marginBottom: '24px', textAlign: 'center' }}>
        <Text style={labelStyle}>PRIVILEGE STATUS ELEVATED</Text>
        <Text style={headlineStyle}>WELCOME TO {newTier}</Text>
        <Text style={bodyStyle}>
          Dear {customerName.toUpperCase()}, your order history has elevated your account status. You now enjoy elite privileges.
        </Text>
      </Section>

      <Section style={cardStyle}>
        <Text style={cardLabel}>UNLOCKED PRIVILEGES</Text>
        <Text style={benefitStyle}>{tierBenefits}</Text>
      </Section>

      <Section style={{ textAlign: 'center', margin: '32px 0 16px 0' }}>
        <CTAButton href={accountUrl} variant="gold">
          EXPLORE TIER PRIVILEGES
        </CTAButton>
      </Section>
    </LuxuryEmailLayout>
  );
};

export default LoyaltyUpgradeMarketingTemplate;

const labelStyle = { fontSize: '9px', fontWeight: 700, letterSpacing: '0.2em', color: '#c8a46a', margin: '0 0 6px 0', textTransform: 'uppercase' as const };
const headlineStyle = { fontSize: '20px', fontWeight: 800, letterSpacing: '0.08em', color: '#ffffff', margin: '0 0 12px 0' };
const bodyStyle = { fontSize: '12px', color: '#a1a1aa', lineHeight: '20px', margin: '0 0 16px 0' };
const cardStyle = { backgroundColor: '#121215', border: '1px solid rgba(200, 164, 106, 0.4)', borderRadius: '4px', padding: '24px', textAlign: 'center' as const };
const cardLabel = { fontSize: '9px', fontWeight: 700, letterSpacing: '0.15em', color: '#8c857b', margin: '0 0 6px 0' };
const benefitStyle = { fontSize: '13px', fontWeight: 700, color: '#c8a46a', lineHeight: '20px', margin: '0' };
