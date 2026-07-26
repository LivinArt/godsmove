import React from 'react';
import { Section, Text } from '@react-email/components';
import { LuxuryEmailLayout } from '../../layouts/LuxuryEmailLayout';
import { CTAButton } from '../../components/CTAButton';

export interface SeasonalMarketingTemplateProps {
  seasonTitle?: string;
  editorialText?: string;
  seasonUrl?: string;
}

export const SeasonalMarketingTemplate: React.FC<SeasonalMarketingTemplateProps> = ({
  seasonTitle = 'AUTUMN ARCHIVE DISPATCH',
  editorialText = 'Heavy knit textiles, muted earth tones, and stormproof finishing. Designed for cold weather layering.',
  seasonUrl = 'https://godsmove.in/drops',
}) => {
  return (
    <LuxuryEmailLayout previewText={seasonTitle}>
      <Section style={{ marginBottom: '24px', textAlign: 'center' }}>
        <Text style={labelStyle}>SEASONAL EDITORIAL</Text>
        <Text style={headlineStyle}>{seasonTitle}</Text>
        <Text style={bodyStyle}>{editorialText}</Text>
      </Section>

      <Section style={{ textAlign: 'center', margin: '32px 0 16px 0' }}>
        <CTAButton href={seasonUrl} variant="gold">
          EXPLORE SEASONAL EDITORIAL
        </CTAButton>
      </Section>
    </LuxuryEmailLayout>
  );
};

export default SeasonalMarketingTemplate;

const labelStyle = { fontSize: '9px', fontWeight: 700, letterSpacing: '0.2em', color: '#c8a46a', margin: '0 0 6px 0', textTransform: 'uppercase' as const };
const headlineStyle = { fontSize: '18px', fontWeight: 800, letterSpacing: '0.08em', color: '#ffffff', margin: '0 0 12px 0' };
const bodyStyle = { fontSize: '12px', color: '#a1a1aa', lineHeight: '20px', margin: '0' };
