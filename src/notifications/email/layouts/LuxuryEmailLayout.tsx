import React from 'react';
import {
  Html,
  Head,
  Body,
  Container,
  Preview,
  Section,
} from '@react-email/components';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

import { GODSMOVE_WORDMARK } from '../brand';

interface LuxuryEmailLayoutProps {
  previewText: string;
  children: React.ReactNode;
}

// Non-breaking spaces and zero-width joiner characters to prevent email clients (Gmail/Apple Mail/Outlook)
// from pulling in attachment text or body content into the inbox snippet preview
const PREVIEW_PADDING = '\xa0\u200C\u200B\xa0\u200C\u200B\xa0\u200C\u200B\xa0\u200C\u200B\xa0\u200C\u200B'.repeat(30);

export const LuxuryEmailLayout: React.FC<LuxuryEmailLayoutProps> = ({
  previewText,
  children,
}) => {
  const fullPreviewText = (previewText || `${GODSMOVE_WORDMARK} Archival Notification`) + PREVIEW_PADDING;

  return (
    <Html lang="en">
      <Head>
        <meta name="color-scheme" content="dark" />
        <meta name="supported-color-schemes" content="dark" />
      </Head>
      <Preview>{fullPreviewText}</Preview>
      <Body style={mainStyle}>
        <div
          style={{
            display: 'none',
            maxHeight: '0px',
            overflow: 'hidden',
            opacity: 0,
            fontSize: '1px',
            lineHeight: '1px',
            color: '#000000',
          }}
        >
          {previewText}
          {PREVIEW_PADDING}
        </div>
        <Container style={containerStyle}>
          <Header />
          <Section style={contentStyle}>{children}</Section>
          <Footer />
        </Container>
      </Body>
    </Html>
  );
};

const mainStyle = {
  backgroundColor: '#09090b',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  margin: '0 auto',
  padding: '20px 0',
  width: '100%',
};

const containerStyle = {
  backgroundColor: '#000000',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '4px',
  margin: '0 auto',
  padding: '0 24px',
  maxWidth: '600px',
  width: '100%',
};

const contentStyle = {
  padding: '12px 0 24px 0',
};
