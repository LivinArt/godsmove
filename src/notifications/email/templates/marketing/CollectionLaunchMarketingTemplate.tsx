import React from 'react';
import { Section, Text } from '@react-email/components';
import { LuxuryEmailLayout } from '../../layouts/LuxuryEmailLayout';
import { CTAButton } from '../../components/CTAButton';

export interface CollectionLaunchMarketingTemplateProps {
  collectionName?: string;
  season?: string;
  conceptText?: string;
  collectionUrl?: string;
}

export const CollectionLaunchMarketingTemplate: React.FC<CollectionLaunchMarketingTemplateProps> = ({
  collectionName = 'MONOCHROME ARCHIVE 2026',
  season = 'AUTUMN / WINTER',
  conceptText = 'An exploration into architectural tailoring, high-density cotton weaves, and understated luxury streetwear silhouettes.',
  collectionUrl = 'https://godsmove.in/drops',
}) => {
  return (
    <LuxuryEmailLayout previewText={`Collection Launch: ${collectionName}`}>
      <Section style={{ marginBottom: '24px', textAlign: 'center' }}>
        <Text style={labelStyle}>{season} COLLECTION</Text>
        <Text style={headlineStyle}>{collectionName.toUpperCase()}</Text>
        <Text style={bodyStyle}>{conceptText}</Text>
      </Section>

      <Section style={{ textAlign: 'center', margin: '32px 0 16px 0' }}>
        <CTAButton href={collectionUrl} variant="gold">
          EXPLORE COLLECTION
        </CTAButton>
      </Section>
    </LuxuryEmailLayout>
  );
};

export default CollectionLaunchMarketingTemplate;

const labelStyle = { fontSize: '9px', fontWeight: 700, letterSpacing: '0.2em', color: '#c8a46a', margin: '0 0 6px 0', textTransform: 'uppercase' as const };
const headlineStyle = { fontSize: '20px', fontWeight: 800, letterSpacing: '0.08em', color: '#ffffff', margin: '0 0 12px 0' };
const bodyStyle = { fontSize: '12px', color: '#a1a1aa', lineHeight: '20px', margin: '0' };
