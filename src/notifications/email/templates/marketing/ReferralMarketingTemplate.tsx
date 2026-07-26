import React from 'react';
import { Section, Text } from '@react-email/components';
import { LuxuryEmailLayout } from '../../layouts/LuxuryEmailLayout';
import { CTAButton } from '../../components/CTAButton';

export interface ReferralMarketingTemplateProps {
  referralCode?: string;
  referrerBonus?: number;
  refereeDiscount?: string;
  shareUrl?: string;
}

export const ReferralMarketingTemplate: React.FC<ReferralMarketingTemplateProps> = ({
  referralCode = 'GM-COLLECTOR-88',
  referrerBonus = 500,
  refereeDiscount = '₹500 OFF THEIR FIRST PIECE',
  shareUrl = 'https://godsmove.in/profile',
}) => {
  return (
    <LuxuryEmailLayout previewText="Invite Fellow Collectors to GODSMOVE">
      <Section style={{ marginBottom: '24px', textAlign: 'center' }}>
        <Text style={labelStyle}>COLLECTOR CIRCLE</Text>
        <Text style={headlineStyle}>INVITE FELLOW COLLECTORS</Text>
        <Text style={bodyStyle}>
          Share your referral code. When a friend acquires their first GODSMOVE statement piece, they get {refereeDiscount} and you receive ₹{referrerBonus.toLocaleString('en-IN')} in vault credits.
        </Text>
      </Section>

      <Section style={cardStyle}>
        <Text style={codeLabel}>YOUR PERSONAL REFERRAL CODE</Text>
        <Text style={codeStyle}>{referralCode}</Text>
      </Section>

      <Section style={{ textAlign: 'center', margin: '32px 0 16px 0' }}>
        <CTAButton href={shareUrl} variant="gold">
          SHARE REFERRAL LINK
        </CTAButton>
      </Section>
    </LuxuryEmailLayout>
  );
};

export default ReferralMarketingTemplate;

const labelStyle = { fontSize: '9px', fontWeight: 700, letterSpacing: '0.2em', color: '#c8a46a', margin: '0 0 6px 0', textTransform: 'uppercase' as const };
const headlineStyle = { fontSize: '20px', fontWeight: 800, letterSpacing: '0.08em', color: '#ffffff', margin: '0 0 12px 0' };
const bodyStyle = { fontSize: '12px', color: '#a1a1aa', lineHeight: '20px', margin: '0 0 16px 0' };
const cardStyle = { backgroundColor: '#121215', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '4px', padding: '24px', textAlign: 'center' as const };
const codeLabel = { fontSize: '9px', fontWeight: 700, letterSpacing: '0.15em', color: '#8c857b', margin: '0 0 4px 0' };
const codeStyle = { fontSize: '22px', fontWeight: 800, letterSpacing: '0.2em', color: '#c8a46a', margin: '0' };
