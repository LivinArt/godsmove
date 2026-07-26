import React from 'react';
import { Section, Text } from '@react-email/components';
import { LuxuryEmailLayout } from '../layouts/LuxuryEmailLayout';
import { CTAButton } from '../components/CTAButton';

export interface NewsletterTemplateProps {
  headline: string;
  bodyContent: string;
  ctaText?: string;
  ctaUrl?: string;
}

export const NewsletterTemplate: React.FC<NewsletterTemplateProps> = ({
  headline = 'ARCHIVAL DISPATCH: VOLUME 01',
  bodyContent = 'Exploring high-density double-weave cotton, drop-shoulder silhouettes, and the philosophy behind our upcoming launch.',
  ctaText = 'READ MANIFESTO',
  ctaUrl = 'https://godsmove.in/our-story',
}) => {
  return (
    <LuxuryEmailLayout previewText={headline}>
      <Section style={{ marginBottom: '24px' }}>
        <Text style={greetingStyle}>{headline.toUpperCase()}</Text>
        <Text style={bodyStyle}>{bodyContent}</Text>
      </Section>

      {ctaUrl && (
        <Section style={{ textAlign: 'center', margin: '32px 0 16px 0' }}>
          <CTAButton href={ctaUrl} variant="gold">
            {ctaText}
          </CTAButton>
        </Section>
      )}
    </LuxuryEmailLayout>
  );
};

export default NewsletterTemplate;

const greetingStyle = { fontSize: '14px', fontWeight: 800, letterSpacing: '0.1em', color: '#c8a46a', margin: '0 0 12px 0' };
const bodyStyle = { fontSize: '12px', color: '#a1a1aa', lineHeight: '20px', margin: '0' };
