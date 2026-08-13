import React from 'react';
import { Section, Text, Link, Hr } from '@react-email/components';
import { GODSMOVE_WORDMARK } from '../brand';

interface FooterProps {
  supportEmail?: string;
  baseUrl?: string;
}

export const Footer: React.FC<FooterProps> = ({
  supportEmail = 'support@godsmove.in',
  baseUrl = 'https://godsmove.in',
}) => {
  return (
    <Section style={footerSection}>
      <Hr style={hrStyle} />
      
      <Section style={linksContainer}>
        <Link href={`${baseUrl}/our-story`} style={linkStyle}>OUR STORY</Link>
        <Text style={separatorStyle}>•</Text>
        <Link href={`${baseUrl}/contact`} style={linkStyle}>SUPPORT</Link>
        <Text style={separatorStyle}>•</Text>
        <Link href="https://instagram.com/godsmove" style={linkStyle}>INSTAGRAM</Link>
        <Text style={separatorStyle}>•</Text>
        <Link href={`${baseUrl}/policies`} style={linkStyle}>POLICIES</Link>
      </Section>

      <Text style={supportTextStyle}>
        For inquiries regarding archival allocations, fitting, or returns, contact{' '}
        <Link href={`mailto:${supportEmail}`} style={goldLinkStyle}>
          {supportEmail}
        </Link>
      </Text>

      <Text style={copyrightStyle}>
        © {new Date().getFullYear()} {GODSMOVE_WORDMARK}. ALL RIGHTS RESERVED.
      </Text>

      <Text style={poweredByStyle}>
        POWERED BY LIVINART TECHNOLOGIES PRIVATE LIMITED
      </Text>
    </Section>
  );
};

const footerSection = {
  textAlign: 'center' as const,
  paddingTop: '32px',
  paddingBottom: '32px',
};

const hrStyle = {
  borderColor: 'rgba(255, 255, 255, 0.1)',
  margin: '0 0 24px 0',
};

const linksContainer = {
  marginBottom: '16px',
};

const linkStyle = {
  color: '#8c857b',
  fontSize: '10px',
  fontWeight: 600,
  letterSpacing: '0.15em',
  textDecoration: 'none',
  textTransform: 'uppercase' as const,
  display: 'inline-block',
};

const separatorStyle = {
  color: '#444444',
  fontSize: '10px',
  display: 'inline-block',
  margin: '0 8px',
};

const supportTextStyle = {
  fontSize: '11px',
  color: '#8c857b',
  lineHeight: '18px',
  marginBottom: '16px',
};

const goldLinkStyle = {
  color: '#c8a46a',
  textDecoration: 'underline',
};

const copyrightStyle = {
  fontSize: '10px',
  letterSpacing: '0.1em',
  color: '#555555',
  margin: '0 0 6px 0',
  textTransform: 'uppercase' as const,
};

const poweredByStyle = {
  fontSize: '9px',
  letterSpacing: '0.15em',
  color: '#c8a46a',
  margin: '0',
  fontWeight: 700,
  textTransform: 'uppercase' as const,
};
