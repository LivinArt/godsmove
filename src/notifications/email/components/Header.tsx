import React from 'react';
import { Section, Text, Link, Img } from '@react-email/components';
import { GODSMOVE_WORDMARK, GODSMOVE_LOGO_WHITE_URL } from '../brand';

interface HeaderProps {
  logoUrl?: string;
  baseUrl?: string;
}

export const Header: React.FC<HeaderProps> = ({
  logoUrl = GODSMOVE_LOGO_WHITE_URL,
  baseUrl = 'https://godsmove.in',
}) => {
  return (
    <Section style={headerStyle}>
      <Text style={taglineStyle}>STATEMENT APPAREL & ARCHIVAL CUTS</Text>
      <Link href={baseUrl} style={brandLinkStyle}>
        <Img
          src={logoUrl}
          alt={GODSMOVE_WORDMARK}
          width="220"
          height="55"
          style={logoImgStyle}
        />
      </Link>
      <Section style={goldDividerStyle} />
    </Section>
  );
};

const headerStyle = {
  textAlign: 'center' as const,
  paddingTop: '32px',
  paddingBottom: '24px',
};

const taglineStyle = {
  fontSize: '9px',
  letterSpacing: '0.25em',
  color: '#8c857b',
  margin: '0 0 12px 0',
  fontWeight: 600,
  textTransform: 'uppercase' as const,
};

const brandLinkStyle = {
  display: 'inline-block' as const,
  textDecoration: 'none' as const,
};

const logoImgStyle = {
  display: 'block' as const,
  margin: '0 auto',
  maxWidth: '220px',
  height: 'auto',
  outline: 'none',
  border: 'none',
  textDecoration: 'none' as const,
};

const goldDividerStyle = {
  height: '1px',
  backgroundColor: '#c8a46a',
  width: '60px',
  margin: '20px auto 0 auto',
};
