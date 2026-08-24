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

export interface EarlyAccessMembershipActivatedProps {
  customerName?: string;
  email?: string;
  godsmoveId?: string;
  activatedAt?: string;
  expiresAt?: string;
  tier?: string;
}

export const EarlyAccessMembershipActivatedTemplate: React.FC<EarlyAccessMembershipActivatedProps> = ({
  customerName = 'Valued Collector',
  email = '',
  godsmoveId = '',
  activatedAt = '',
  expiresAt = '',
  tier = 'VIP',
}) => {
  const firstName = customerName ? customerName.trim().split(' ')[0] : 'Valued Collector';

  const formattedActivatedAt = activatedAt
    ? typeof activatedAt === 'string'
      ? activatedAt
      : new Date(activatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : null;

  const formattedExpiresAt = expiresAt
    ? typeof expiresAt === 'string'
      ? expiresAt
      : new Date(expiresAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : null;

  return (
    <Html lang="en">
      <Head>
        <title>GODSMOVƎ Membership Activated</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="color-scheme" content="light dark" />
        <meta name="supported-color-schemes" content="light dark" />
      </Head>

      <div style={{ display: 'none', maxHeight: '0px', overflow: 'hidden' }}>
        Your 1-Year GODSMOVƎ VIP Membership is now active.
      </div>

      <Body style={mainBodyStyle}>
        <Container style={containerStyle}>
          {/* BRAND HEADER WITH OFFICIAL LOGO ARTWORK */}
          <Section style={headerSectionStyle}>
            <Img
              src="https://godsmove.in/images/logo/godsmove-official-logo-white.png"
              alt="GODSMOVƎ"
              width="240"
              height="31"
              style={logoImgStyle}
            />
          </Section>

          {/* SUBHEADER BADGE */}
          <Section style={badgeSectionStyle}>
            <Text style={badgeTextStyle}>YOUR MEMBERSHIP IS ACTIVE</Text>
          </Section>

          <Hr style={dividerStyle} />

          {/* SALUTATION & PERSONALIZED ANNOUNCEMENT */}
          <Section style={bodySectionStyle}>
            <Text style={greetingStyle}>{firstName},</Text>

            <Text style={leadTextStyle}>
              Your GODSMOVƎ Membership is now active.
            </Text>
          </Section>

          {/* MEMBERSHIP SUMMARY CARD */}
          <Section style={cardSectionStyle}>
            <Text style={sectionHeaderStyle}>MEMBERSHIP DETAILS</Text>

            <table width="100%" border={0} cellPadding={0} cellSpacing={0} style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td style={labelStyle}>MEMBERSHIP TIER</td>
                  <td style={valStyle}>1 YEAR {tier.toUpperCase()}</td>
                </tr>
                {formattedActivatedAt ? (
                  <tr>
                    <td style={labelStyle}>ACTIVE FROM</td>
                    <td style={valStyle}>{formattedActivatedAt}</td>
                  </tr>
                ) : null}
                {formattedExpiresAt ? (
                  <tr>
                    <td style={labelStyle}>VALID UNTIL</td>
                    <td style={valStyle}>{formattedExpiresAt}</td>
                  </tr>
                ) : null}
                {godsmoveId ? (
                  <tr>
                    <td style={labelStyle}>GODSMOVƎ ID</td>
                    <td style={{ ...valStyle, color: '#C8A46A' }}>{godsmoveId}</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </Section>

          {/* ACTIVE BENEFITS (ACCORDING TO EXISTING MEMBERSHIP ENGINE) */}
          <Section style={cardSectionStyle}>
            <Text style={sectionHeaderStyle}>ACTIVE MEMBERSHIP PRIVILEGES</Text>

            <table width="100%" border={0} cellPadding={0} cellSpacing={0} style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr style={{ marginBottom: '10px' }}>
                  <td style={checkColStyle} valign="top">✔</td>
                  <td style={perkTextStyle}>Up to ₹1,000 Assured Shopping Rewards</td>
                </tr>
                <tr>
                  <td style={checkColStyle} valign="top">✔</td>
                  <td style={perkTextStyle}>Priority Access to Drops & Exclusive Rack</td>
                </tr>
                <tr>
                  <td style={checkColStyle} valign="top">✔</td>
                  <td style={perkTextStyle}>Complimentary Launch Shipping Benefits</td>
                </tr>
                <tr>
                  <td style={checkColStyle} valign="top">✔</td>
                  <td style={perkTextStyle}>Dedicated Concierge Member Support</td>
                </tr>
              </tbody>
            </table>
          </Section>

          {/* PRIMARY CTA */}
          <Section style={ctaSectionStyle}>
            <Link href="https://www.godsmove.in/" style={ctaButtonStyle}>
              [ EXPLORE GODSMOVƎ ]
            </Link>
          </Section>

          <Hr style={dividerStyle} />

          {/* BRAND FOOTER (THEME IMMUNE) */}
          <Section style={footerSectionStyle}>
            <Text style={footerLogoStyle}>GODSMOVƎ</Text>
            <Text style={footerTaglineStyle}>MADE IN INDIA</Text>
            <Text style={footerCompanyStyle}>LIVINART TECHNOLOGIES PRIVATE LIMITED</Text>

            <Text style={footerDetailsStyle}>
              Instagram: <Link href="https://instagram.com/godsmove.in" style={footerLinkStyle}>@godsmove.in</Link><br />
              Email: <Link href="mailto:support@godsmove.in" style={footerLinkStyle}>support@godsmove.in</Link><br />
              Phone: <Link href="tel:+918827175801" style={footerLinkStyle}>+91 8827175801</Link>
            </Text>

            <Text style={footerCountryStyle}>INDIA</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

// HARDCODED INLINE CSS FOR 100% LIGHT/DARK MODE IMMUNITY
const mainBodyStyle: React.CSSProperties = {
  backgroundColor: '#000000',
  color: '#FFFFFF',
  fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif',
  margin: 0,
  padding: '40px 12px',
};

const containerStyle: React.CSSProperties = {
  backgroundColor: '#0A0A0C',
  border: '1px solid #222225',
  borderRadius: '8px',
  maxWidth: '580px',
  margin: '0 auto',
  padding: '36px 28px',
};

const headerSectionStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '12px 0 20px 0',
};

const logoImgStyle: React.CSSProperties = {
  margin: '0 auto',
  display: 'block',
  maxWidth: '240px',
  height: 'auto',
};

const badgeSectionStyle: React.CSSProperties = {
  textAlign: 'center',
  paddingBottom: '12px',
};

const badgeTextStyle: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 800,
  letterSpacing: '0.25em',
  color: '#C8A46A',
  margin: 0,
  textTransform: 'uppercase',
};

const dividerStyle: React.CSSProperties = {
  borderColor: '#222225',
  margin: '24px 0',
};

const bodySectionStyle: React.CSSProperties = {
  paddingBottom: '16px',
};

const greetingStyle: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 700,
  color: '#FFFFFF',
  margin: '0 0 16px 0',
};

const leadTextStyle: React.CSSProperties = {
  fontSize: '15px',
  fontWeight: 600,
  lineHeight: '24px',
  color: '#FFFFFF',
  margin: 0,
};

const cardSectionStyle: React.CSSProperties = {
  backgroundColor: '#121215',
  border: '1px solid #222225',
  borderRadius: '6px',
  padding: '20px',
  margin: '20px 0',
};

const sectionHeaderStyle: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 800,
  letterSpacing: '0.2em',
  color: '#C8A46A',
  margin: '0 0 16px 0',
  textTransform: 'uppercase',
};

const labelStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 600,
  color: '#888888',
  letterSpacing: '0.05em',
  padding: '6px 0',
  width: '40%',
};

const valStyle: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 700,
  color: '#FFFFFF',
  letterSpacing: '0.05em',
  padding: '6px 0',
  textAlign: 'right',
};

const checkColStyle: React.CSSProperties = {
  width: '24px',
  fontSize: '12px',
  fontWeight: 800,
  color: '#C8A46A',
  padding: '6px 0',
};

const perkTextStyle: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 600,
  color: '#FFFFFF',
  padding: '6px 0',
};

const ctaSectionStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '12px 0 24px 0',
};

const ctaButtonStyle: React.CSSProperties = {
  display: 'inline-block',
  backgroundColor: '#C8A46A',
  color: '#000000',
  fontSize: '11px',
  fontWeight: 800,
  letterSpacing: '0.2em',
  textDecoration: 'none',
  padding: '14px 28px',
  borderRadius: '4px',
};

const footerSectionStyle: React.CSSProperties = {
  textAlign: 'center',
  paddingTop: '12px',
};

const footerLogoStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 800,
  letterSpacing: '0.25em',
  color: '#FFFFFF',
  margin: '0 0 4px 0',
};

const footerTaglineStyle: React.CSSProperties = {
  fontSize: '9px',
  fontWeight: 800,
  letterSpacing: '0.3em',
  color: '#C8A46A',
  margin: '0 0 12px 0',
};

const footerCompanyStyle: React.CSSProperties = {
  fontSize: '10px',
  color: '#666666',
  margin: '0 0 12px 0',
  letterSpacing: '0.05em',
};

const footerDetailsStyle: React.CSSProperties = {
  fontSize: '11px',
  lineHeight: '20px',
  color: '#888888',
  margin: '0 0 16px 0',
};

const footerLinkStyle: React.CSSProperties = {
  color: '#C8A46A',
  textDecoration: 'none',
};

const footerCountryStyle: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 800,
  letterSpacing: '0.3em',
  color: '#666666',
  margin: 0,
};

export default EarlyAccessMembershipActivatedTemplate;
