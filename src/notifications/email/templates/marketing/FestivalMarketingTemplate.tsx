import React from 'react';
import { Section, Text } from '@react-email/components';
import { LuxuryEmailLayout } from '../../layouts/LuxuryEmailLayout';
import { CTAButton } from '../../components/CTAButton';

export interface FestivalMarketingTemplateProps {
  festivalName?: string;
  greetings?: string;
  offerText?: string;
  shopUrl?: string;
}

export const FestivalMarketingTemplate: React.FC<FestivalMarketingTemplateProps> = ({
  festivalName = 'FESTIVE SEASON EXCLUSIVE',
  greetings = 'Wishing you an elevated festive season with GODSMOVE archival statements.',
  offerText = 'Enjoy complimentary priority shipping on all orders this festive week.',
  shopUrl = 'https://godsmove.in/drops',
}) => {
  return (
    <LuxuryEmailLayout previewText={festivalName}>
      <Section style={{ marginBottom: '24px', textAlign: 'center' }}>
        <Text style={labelStyle}>SEASONAL CELEBRATION</Text>
        <Text style={headlineStyle}>{festivalName.toUpperCase()}</Text>
        <Text style={bodyStyle}>{greetings}</Text>
      </Section>

      <Section style={cardStyle}>
        <Text style={offerStyle}>{offerText}</Text>
      </Section>

      <Section style={{ textAlign: 'center', margin: '32px 0 16px 0' }}>
        <CTAButton href={shopUrl} variant="gold">
          SHOP FESTIVE SELECTIONS
        </CTAButton>
      </Section>
    </LuxuryEmailLayout>
  );
};

export default FestivalMarketingTemplate;

const labelStyle = { fontSize: '9px', fontWeight: 700, letterSpacing: '0.2em', color: '#c8a46a', margin: '0 0 6px 0', textTransform: 'uppercase' as const };
const headlineStyle = { fontSize: '20px', fontWeight: 800, letterSpacing: '0.08em', color: '#ffffff', margin: '0 0 12px 0' };
const bodyStyle = { fontSize: '12px', color: '#a1a1aa', lineHeight: '20px', margin: '0 0 16px 0' };
const cardStyle = { backgroundColor: '#121215', border: '1px solid rgba(200, 164, 106, 0.3)', borderRadius: '4px', padding: '20px', textAlign: 'center' as const };
const offerStyle = { fontSize: '13px', fontWeight: 700, color: '#c8a46a', margin: '0' };
