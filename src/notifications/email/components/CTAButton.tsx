import React from 'react';
import { Button } from '@react-email/components';

interface CTAButtonProps {
  href: string;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'gold';
  style?: React.CSSProperties;
}

export const CTAButton: React.FC<CTAButtonProps> = ({
  href,
  children,
  variant = 'gold',
  style,
}) => {
  let buttonStyle = goldButtonStyle;
  if (variant === 'primary') buttonStyle = primaryButtonStyle;
  if (variant === 'secondary') buttonStyle = secondaryButtonStyle;

  return (
    <Button href={href} style={{ ...buttonStyle, ...style }}>
      {children}
    </Button>
  );
};

const baseStyle: React.CSSProperties = {
  display: 'inline-block',
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '0.2em',
  textTransform: 'uppercase' as const,
  textAlign: 'center' as const,
  textDecoration: 'none',
  padding: '14px 28px',
  borderRadius: '2px',
};

const goldButtonStyle: React.CSSProperties = {
  ...baseStyle,
  backgroundColor: '#c8a46a',
  color: '#09090b',
  border: '1px solid #c8a46a',
};

const primaryButtonStyle: React.CSSProperties = {
  ...baseStyle,
  backgroundColor: '#ffffff',
  color: '#09090b',
  border: '1px solid #ffffff',
};

const secondaryButtonStyle: React.CSSProperties = {
  ...baseStyle,
  backgroundColor: 'transparent',
  color: '#ffffff',
  border: '1px solid rgba(255, 255, 255, 0.2)',
};
