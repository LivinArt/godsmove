import React from 'react';
import { Section, Text } from '@react-email/components';
import { LuxuryEmailLayout } from '../../layouts/LuxuryEmailLayout';
import { CTAButton } from '../../components/CTAButton';

export interface NewsletterMarketingTemplateProps {
  headline?: string;
  subheadline?: string;
  bodyContent?: string;
  ctaText?: string;
  ctaUrl?: string;
}

export const NewsletterMarketingTemplate: React.FC<NewsletterMarketingTemplateProps> = ({
  headline = 'ARCHIVAL DISPATCH — VOL. 04',
  subheadline = 'Inside High-Density Fabrics & Minimalist Design',
  bodyContent = 'Exploring the design ethos behind our heavyweight custom knits, precision drop shoulders, and monochromatic luxury silhouettes.',
  ctaText = 'READ DISPATCH',
  ctaUrl = 'https://godsmove.in/our-story',
}) => {
  return (
    <LuxuryEmailLayout previewText={headline}>
      <Section style={{ marginBottom: '24px', textAlign: 'center' }}>
        <Text style={labelStyle}>MONTHLY INSIGHTS</Text>
        <Text style={headlineStyle}>{headline.toUpperCase()}</Text>
        <Text style={subheadlineStyle}>{subheadline}</Text>
      </Section>

      <Section style={cardStyle}>
        <Text style={bodyStyle}>{bodyContent}</Text>
      </Section>

      <Section style={{ textAlign: 'center', margin: '32px 0 16px 0' }}>
        <CTAButton href={ctaUrl} variant="gold">
          {ctaText}
        </CTAButton>
      </Section>
    </LuxuryEmailLayout>
  );
};

export default NewsletterMarketingTemplate;

const labelStyle = { fontSize: '9px', fontWeight: 700, letterSpacing: '0.2em', color: '#c8a46a', margin: '0 0 6px 0', textTransform: 'uppercase' as const };
const headlineStyle = { fontSize: '20px', fontWeight: 800, letterSpacing: '0.08em', color: '#ffffff', margin: '0 0 6px 0' };
const subheadlineStyle = { fontSize: '13px', fontWeight: 600, color: '#a1a1aa', margin: '0 0 20px 0' };
const cardStyle = { backgroundColor: '#121215', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '4px', padding: '24px', marginBottom: '24px' };
const bodyStyle = { fontSize: '12px', color: '#d4d4d8', lineHeight: '22px', margin: '0' };
