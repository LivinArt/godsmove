import React from 'react';
import { Section, Text, Link } from '@react-email/components';
import { GODSMOVE_WORDMARK } from '../brand';

interface HeaderProps {
  logoUrl?: string;
  baseUrl?: string;
}

export const Header: React.FC<HeaderProps> = ({
  logoUrl = 'https://godsmove.in/logo.png',
  baseUrl = 'https://godsmove.in',
}) => {
  return (
    <Section style={headerStyle}>
      <Text style={taglineStyle}>STATEMENT APPAREL & ARCHIVAL CUTS</Text>
      <Link href={baseUrl} style={brandStyle}>
        {GODSMOVE_WORDMARK}
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
  margin: '0 0 8px 0',
  fontWeight: 600,
  textTransform: 'uppercase' as const,
};

const brandStyle = {
  fontSize: '28px',
  fontWeight: 800,
  letterSpacing: '0.3em',
  color: '#ffffff',
  textDecoration: 'none',
  display: 'inline-block',
  fontFamily: 'Helvetica, Arial, sans-serif',
};

const goldDividerStyle = {
  height: '1px',
  backgroundColor: '#c8a46a',
  width: '60px',
  margin: '20px auto 0 auto',
};
