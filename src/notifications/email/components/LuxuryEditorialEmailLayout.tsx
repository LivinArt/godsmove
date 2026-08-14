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
  Img,
} from '@react-email/components';

import { GODSMOVE_WORDMARK, GODSMOVE_LOGO_WHITE_URL, GODSMOVE_LOGO_BLACK_URL } from '../brand';

export interface LuxuryEditorialEmailLayoutProps {
  previewText?: string;
  issueTag?: string;
  headline: string;
  customerName?: string;
  editorialNote: string;
  children: React.ReactNode;
  ctaText?: string;
  ctaUrl?: string;
  invoiceUrl?: string;
  theme?: 'dark' | 'light';
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
  invoiceUrl,
  theme = 'light',
}) => {
  const isDark = theme === 'dark';

  // Base background & text colors
  const bodyBg = isDark ? '#09090B' : '#F7F5F0';
  const containerBg = isDark ? '#121215' : '#FBF9F5';
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : '#EAE5DB';
  const primaryText = isDark ? '#FFFFFF' : '#1A1918';
  const cardBg = isDark ? '#18181C' : '#F4F0E8';
  const bodyText = isDark ? '#A1A1AA' : '#4A4742';

  // Official Brand Logo Visual Anchor (Crisp rendering across all clients)
  const logoUrl = isDark ? GODSMOVE_LOGO_WHITE_URL : GODSMOVE_LOGO_BLACK_URL;

  return (
    <Html lang="en">
      <Head>
        <title>{`${headline} — ${GODSMOVE_WORDMARK}`}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      {previewText && (
        <div style={{ display: 'none', maxHeight: '0px', overflow: 'hidden' }}>
          {previewText}
        </div>
      )}

      <Body style={{ ...mainBodyStyle, backgroundColor: bodyBg, color: primaryText }}>
        <Container style={{ ...containerStyle, backgroundColor: containerBg, borderColor }}>
          {/* BRAND LOGO HEADER (SCROLL LOGO ON DARK, BANNER LOGO ON LIGHT) */}
          <Section style={headerSectionStyle}>
            <Img
              src={logoUrl}
              alt={GODSMOVE_WORDMARK}
              width="240"
              height="60"
              style={logoImgStyle}
            />
            <Text style={issueTagStyle}>{issueTag}</Text>
          </Section>

          <Hr style={{ ...dividerStyle, borderColor }} />

          {/* EDITORIAL HERO SECTION */}
          <Section style={heroSectionStyle}>
            <Text style={{ ...headlineStyle, color: primaryText }}>{headline}</Text>

            {/* PERSONALISED EDITORIAL LETTER BLOCK */}
            <div style={{ ...editorialNoteCardStyle, backgroundColor: cardBg }}>
              {customerName && (
                <Text style={{ ...salutationStyle, color: primaryText }}>Dear {customerName},</Text>
              )}
              <Text style={{ ...editorialBodyStyle, color: bodyText }}>{editorialNote}</Text>
              <Text style={signoffStyle}>— The {GODSMOVE_WORDMARK} Archival Team</Text>
            </div>
          </Section>

          {/* EVENT BODY CONTENT */}
          <Section style={contentSectionStyle}>{children}</Section>

          {/* PRIMARY CTAS (ACTION + INVOICE) */}
          {(ctaText || invoiceUrl) && (
            <Section style={ctaSectionStyle}>
              {ctaText && ctaUrl && (
                <Link href={ctaUrl} style={{ ...ctaButtonStyle, backgroundColor: isDark ? '#C8A46A' : '#1A1918', color: isDark ? '#000000' : '#FBF9F5' }}>
                  {ctaText.toUpperCase()}
                </Link>
              )}
              {invoiceUrl && (
                <div style={{ marginTop: '12px' }}>
                  <Link href={invoiceUrl} style={invoiceLinkStyle}>
                    📄 VIEW & DOWNLOAD TAX INVOICE
                  </Link>
                </div>
              )}
            </Section>
          )}

          <Hr style={{ ...dividerStyle, borderColor }} />

          {/* BRAND FOOTER */}
          <Section style={footerSectionStyle}>
            <Text style={{ ...footerLogoStyle, color: primaryText }}>{GODSMOVE_WORDMARK} ARCHIVAL DIVISION</Text>
            <Text style={{ ...footerSubStyle, color: bodyText }}>
              Built around craftsmanship, permanence and intentional design.
            </Text>
            <Text style={footerAddressStyle}>
              Mumbai • Tokyo • London | Concierge Support: support@godsmove.in
            </Text>
            <Text style={footerCopyrightStyle}>
              © {new Date().getFullYear()} {GODSMOVE_WORDMARK} CLOTHING PRIVATE LIMITED. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

const mainBodyStyle: React.CSSProperties = {
  fontFamily: 'Helvetica Neue, Helvetica, Arial, -apple-system, sans-serif',
  margin: 0,
  padding: '40px 12px',
};

const containerStyle: React.CSSProperties = {
  border: '1px solid #EAE5DB',
  borderRadius: '8px',
  maxWidth: '620px',
  margin: '0 auto',
  padding: '40px 36px',
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.05)',
};

const headerSectionStyle: React.CSSProperties = {
  textAlign: 'center',
  paddingBottom: '16px',
};

const logoImgStyle: React.CSSProperties = {
  margin: '0 auto 8px auto',
  display: 'block',
  maxWidth: '240px',
  height: 'auto',
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
  margin: '24px 0',
};

const heroSectionStyle: React.CSSProperties = {
  paddingBottom: '16px',
};

const headlineStyle: React.CSSProperties = {
  fontSize: '26px',
  fontWeight: 800,
  lineHeight: '34px',
  margin: '0 0 20px 0',
  letterSpacing: '-0.01em',
};

const editorialNoteCardStyle: React.CSSProperties = {
  borderLeft: '3px solid #C8A46A',
  borderRadius: '4px',
  padding: '24px',
  marginBottom: '28px',
};

const salutationStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 700,
  margin: '0 0 10px 0',
};

const editorialBodyStyle: React.CSSProperties = {
  fontSize: '13px',
  lineHeight: '22px',
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
  fontSize: '11px',
  fontWeight: 800,
  letterSpacing: '0.2em',
  textDecoration: 'none',
  padding: '16px 32px',
  borderRadius: '4px',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
};

const invoiceLinkStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 800,
  color: '#C8A46A',
  textDecoration: 'underline',
  letterSpacing: '0.1em',
};

const footerSectionStyle: React.CSSProperties = {
  textAlign: 'center',
  paddingTop: '16px',
};

const footerLogoStyle: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 800,
  letterSpacing: '0.2em',
  margin: '0 0 6px 0',
};

const footerSubStyle: React.CSSProperties = {
  fontSize: '11px',
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
