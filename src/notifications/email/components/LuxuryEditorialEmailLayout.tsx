import React from 'react';
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Link,
  Hr,
} from '@react-email/components';

export interface LuxuryEditorialEmailLayoutProps {
  previewText?: string;
  issueTag?: string;
  headline: string;
  customerName?: string;
  editorialNote: string;
  children: React.ReactNode;
  ctaText?: string;
  ctaUrl?: string;
}

export const LuxuryEditorialEmailLayout: React.FC<LuxuryEditorialEmailLayoutProps> = ({
  previewText,
  issueTag = 'ISSUE // ARCHIVAL DISPATCH',
  headline,
  customerName,
  editorialNote,
  children,
  ctaText,
  ctaUrl,
}) => {
  return (
    <Html lang="en">
      <Head>
        <title>{headline} — GODSMOVE</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      {previewText && (
        <div style={{ display: 'none', maxHeight: '0px', overflow: 'hidden' }}>
          {previewText}
        </div>
      )}

      <Body style={mainBodyStyle}>
        <Container style={containerStyle}>
          {/* LUXURY EDITORIAL HEADER */}
          <Section style={headerSectionStyle}>
            <Text style={logoStyle}>G O D S M O V E</Text>
            <Text style={issueTagStyle}>{issueTag}</Text>
          </Section>

          <Hr style={dividerStyle} />

          {/* MAIN EDITORIAL HERO SECTION */}
          <Section style={heroSectionStyle}>
            <Text style={headlineStyle}>{headline}</Text>

            {/* PERSONALISED LETTER / EDITORIAL NOTE */}
            <div style={editorialNoteCardStyle}>
              {customerName && (
                <Text style={salutationStyle}>Dear {customerName},</Text>
              )}
              <Text style={editorialBodyStyle}>{editorialNote}</Text>
              <Text style={signoffStyle}>— The GODSMOVE Archival Team</Text>
            </div>
          </Section>

          {/* DYNAMIC EVENT BODY CONTENT */}
          <Section style={contentSectionStyle}>{children}</Section>

          {/* CALL TO ACTION BUTTON */}
          {ctaText && ctaUrl && (
            <Section style={ctaSectionStyle}>
              <Link href={ctaUrl} style={ctaButtonStyle}>
                {ctaText.toUpperCase()}
              </Link>
            </Section>
          )}

          <Hr style={dividerStyle} />

          {/* LUXURY BRAND FOOTER */}
          <Section style={footerSectionStyle}>
            <Text style={footerLogoStyle}>GODSMOVE ARCHIVAL DIVISION</Text>
            <Text style={footerSubStyle}>
              Built around craftsmanship, permanence and intentional design.
            </Text>
            <Text style={footerAddressStyle}>
              Mumbai • Tokyo • London | Concierge Support: support@godsmove.in
            </Text>
            <Text style={footerCopyrightStyle}>
              © {new Date().getFullYear()} GODSMOVE. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

// ─────────────────────────────────────────────
// LUXURY EDITORIAL STYLES (WARM IVORY & CHARCOAL PALETTE)
// ─────────────────────────────────────────────

const mainBodyStyle: React.CSSProperties = {
  backgroundColor: '#F7F5F0',
  fontFamily:
    'Helvetica Neue, Helvetica, Arial, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  margin: 0,
  padding: '40px 12px',
  color: '#1A1918',
};

const containerStyle: React.CSSProperties = {
  backgroundColor: '#FBF9F5',
  border: '1px solid #EAE5DB',
  borderRadius: '8px',
  maxWidth: '620px',
  margin: '0 auto',
  padding: '40px 36px',
  boxShadow: '0 10px 30px rgba(26, 25, 24, 0.04)',
};

const headerSectionStyle: React.CSSProperties = {
  textAlign: 'center',
  paddingBottom: '20px',
};

const logoStyle: React.CSSProperties = {
  fontSize: '22px',
  fontWeight: 800,
  letterSpacing: '0.3em',
  color: '#1A1918',
  margin: '0 0 6px 0',
  textTransform: 'uppercase',
};

const issueTagStyle: React.CSSProperties = {
  fontSize: '9px',
  fontWeight: 800,
  letterSpacing: '0.25em',
  color: '#C8A46A',
  margin: 0,
  textTransform: 'uppercase',
};

const dividerStyle: React.CSSProperties = {
  borderColor: '#EAE5DB',
  margin: '24px 0',
};

const heroSectionStyle: React.CSSProperties = {
  paddingBottom: '16px',
};

const headlineStyle: React.CSSProperties = {
  fontSize: '26px',
  fontWeight: 800,
  lineHeight: '34px',
  color: '#1A1918',
  margin: '0 0 20px 0',
  letterSpacing: '-0.01em',
};

const editorialNoteCardStyle: React.CSSProperties = {
  backgroundColor: '#F4F0E8',
  borderLeft: '3px solid #C8A46A',
  borderRadius: '4px',
  padding: '24px',
  marginBottom: '28px',
};

const salutationStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 700,
  color: '#1A1918',
  margin: '0 0 10px 0',
};

const editorialBodyStyle: React.CSSProperties = {
  fontSize: '13px',
  lineHeight: '22px',
  color: '#4A4742',
  margin: '0 0 14px 0',
};

const signoffStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '0.05em',
  color: '#C8A46A',
  margin: 0,
};

const contentSectionStyle: React.CSSProperties = {
  paddingBottom: '20px',
};

const ctaSectionStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '16px 0 28px 0',
};

const ctaButtonStyle: React.CSSProperties = {
  display: 'inline-block',
  backgroundColor: '#1A1918',
  color: '#FBF9F5',
  fontSize: '11px',
  fontWeight: 800,
  letterSpacing: '0.2em',
  textDecoration: 'none',
  padding: '16px 32px',
  borderRadius: '4px',
  boxShadow: '0 4px 12px rgba(26, 25, 24, 0.15)',
};

const footerSectionStyle: React.CSSProperties = {
  textAlign: 'center',
  paddingTop: '16px',
};

const footerLogoStyle: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 800,
  letterSpacing: '0.2em',
  color: '#1A1918',
  margin: '0 0 6px 0',
};

const footerSubStyle: React.CSSProperties = {
  fontSize: '11px',
  color: '#6E6B65',
  margin: '0 0 12px 0',
};

const footerAddressStyle: React.CSSProperties = {
  fontSize: '10px',
  color: '#99948B',
  margin: '0 0 8px 0',
};

const footerCopyrightStyle: React.CSSProperties = {
  fontSize: '9px',
  color: '#B0AA9F',
  margin: 0,
};
