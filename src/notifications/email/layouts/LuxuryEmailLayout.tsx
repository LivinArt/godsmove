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

interface LuxuryEmailLayoutProps {
  previewText: string;
  children: React.ReactNode;
}

export const LuxuryEmailLayout: React.FC<LuxuryEmailLayoutProps> = ({
  previewText,
  children,
}) => {
  return (
    <Html lang="en">
      <Head>
        <meta name="color-scheme" content="dark" />
        <meta name="supported-color-schemes" content="dark" />
      </Head>
      <Preview>{previewText}</Preview>
      <Body style={mainStyle}>
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
