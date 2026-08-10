import React from 'react';
import { Section, Text, Img, Row, Column } from '@react-email/components';
import { LuxuryEmailLayout } from '../layouts/LuxuryEmailLayout';
import { CTAButton } from '../components/CTAButton';

export interface PreBookingLaunchedTemplateProps {
  customerName: string;
  orderNumber: string;
  productName: string;
  productSlug: string;
  productImage?: string | null;
  size: string;
  launchDateText: string;
  expectedDispatchText: string;
  hasExtraStock: boolean;
  productUrl?: string;
  viewPreOrdersUrl?: string;
}

export const PreBookingLaunchedTemplate: React.FC<PreBookingLaunchedTemplateProps> = ({
  customerName = 'Valued Collector',
  orderNumber = 'SS-202608-5001',
  productName = 'Premium Urban Tee, Drop Shoulder Tee, Drop1',
  productSlug = 'premium-urban-tee',
  productImage,
  size = 'L',
  launchDateText = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
  expectedDispatchText = 'Within 24 Hours of Launch',
  hasExtraStock = true,
  productUrl = `https://godsmove.in/product/${productSlug}`,
  viewPreOrdersUrl = 'https://godsmove.in/profile?tab=prebookings',
}) => {
  const previewText = `YOUR PRE-BOOKED PIECE IS NOW LIVE: ${productName} | GODSMOVE`;

  return (
    <LuxuryEmailLayout previewText={previewText}>
      {/* 1. Header Statement */}
      <Section style={{ marginBottom: '24px' }}>
        <Text style={eyebrowStyle}>OFFICIAL RELEASE</Text>
        <Text style={headingStyle}>YOUR PRE-BOOKED PIECE IS NOW LIVE.</Text>
        <Text style={bodyTextStyle}>
          Dear {customerName.toUpperCase()}, the wait is over. The official release for <strong style={{ color: '#ffffff' }}>{productName}</strong> is now live, and your pre-booked piece is moving directly into fulfillment.
        </Text>
      </Section>

      {/* 2. Product Details Card */}
      <Section style={cardStyle}>
        <Text style={cardTitle}>RESERVED ALLOCATION MOVING TO FULFILLMENT</Text>

        <Row style={{ marginTop: '16px', marginBottom: '16px' }}>
          {productImage && (
            <Column style={{ width: '90px', verticalAlign: 'top', paddingRight: '16px' }}>
              <Img
                src={productImage}
                alt={productName}
                width="90"
                height="110"
                style={{ borderRadius: '2px', objectFit: 'cover' }}
              />
            </Column>
          )}
          <Column style={{ verticalAlign: 'top' }}>
            <Text style={productTitleStyle}>{productName}</Text>
            <Text style={productMetaStyle}>SIZE: <strong style={{ color: '#ffffff' }}>{size}</strong></Text>
            <Text style={metaLabel}>ORDER REFERENCE</Text>
            <Text style={metaVal}>#{orderNumber}</Text>
          </Column>
        </Row>

        <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '16px', marginTop: '16px' }}>
          <Row>
            <Column style={{ width: '50%' }}>
              <Text style={metaLabel}>OFFICIAL LAUNCH DATE</Text>
              <Text style={metaVal}>{launchDateText}</Text>
            </Column>
            <Column style={{ width: '50%' }}>
              <Text style={metaLabel}>SCHEDULED DISPATCH</Text>
              <Text style={metaValGold}>{expectedDispatchText}</Text>
            </Column>
          </Row>
        </div>
      </Section>

      {/* 3. Stock Status Banner */}
      <Section style={{ marginBottom: '24px' }}>
        {hasExtraStock ? (
          <div style={noticeBoxStyle}>
            <Text style={noticeTitleStyle}>PUBLIC RELEASE ACTIVE</Text>
            <Text style={noticeBodyStyle}>
              Additional pieces may still be available for a limited time in public release.
            </Text>
          </div>
        ) : (
          <div style={soldOutNoticeBoxStyle}>
            <Text style={soldOutTitleStyle}>PUBLIC ALLOCATION SOLD OUT</Text>
            <Text style={noticeBodyStyle}>
              Your reserved allocation remains 100% secured and prioritized in fulfillment.
            </Text>
          </div>
        )}
      </Section>

      {/* 4. Action CTAs */}
      <Section style={{ textAlign: 'center', margin: '32px 0 16px 0' }}>
        {hasExtraStock && (
          <div style={{ display: 'inline-block', margin: '4px' }}>
            <CTAButton href={productUrl} variant="gold">
              SHOP THE LIVE RELEASE
            </CTAButton>
          </div>
        )}
        <div style={{ display: 'inline-block', margin: '4px' }}>
          <CTAButton href={viewPreOrdersUrl} variant={hasExtraStock ? 'outline' : 'gold'}>
            VIEW MY PRE-ORDERS
          </CTAButton>
        </div>
      </Section>
    </LuxuryEmailLayout>
  );
};

export default PreBookingLaunchedTemplate;

const eyebrowStyle = { fontSize: '11px', fontWeight: 800, letterSpacing: '0.2em', color: '#c8a46a', margin: '0 0 8px 0', textTransform: 'uppercase' as const };
const headingStyle = { fontSize: '18px', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.01em', margin: '0 0 12px 0' };
const bodyTextStyle = { fontSize: '13px', color: '#a1a1aa', lineHeight: '20px', margin: '0 0 12px 0' };
const cardStyle = { backgroundColor: '#121215', border: '1px solid rgba(200, 164, 106, 0.3)', borderRadius: '4px', padding: '24px', marginBottom: '24px' };
const cardTitle = { fontSize: '10px', fontWeight: 800, letterSpacing: '0.15em', color: '#c8a46a', margin: '0 0 12px 0', textTransform: 'uppercase' as const };
const productTitleStyle = { fontSize: '15px', fontWeight: 600, color: '#ffffff', margin: '0 0 6px 0' };
const productMetaStyle = { fontSize: '11px', color: '#a1a1aa', margin: '0 0 10px 0', textTransform: 'uppercase' as const, letterSpacing: '0.05em' };
const metaLabel = { fontSize: '9px', fontWeight: 700, letterSpacing: '0.15em', color: '#71717a', margin: '0 0 2px 0', textTransform: 'uppercase' as const };
const metaVal = { fontSize: '12px', fontWeight: 600, color: '#ffffff', margin: '0' };
const metaValGold = { fontSize: '12px', fontWeight: 700, color: '#c8a46a', margin: '0' };
const noticeBoxStyle = { backgroundColor: 'rgba(200, 164, 106, 0.08)', border: '1px solid rgba(200, 164, 106, 0.2)', padding: '16px', borderRadius: '4px', textAlign: 'center' as const };
const noticeTitleStyle = { fontSize: '10px', fontWeight: 800, letterSpacing: '0.15em', color: '#c8a46a', margin: '0 0 4px 0', textTransform: 'uppercase' as const };
const soldOutNoticeBoxStyle = { backgroundColor: '#09090b', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '16px', borderRadius: '4px', textAlign: 'center' as const };
const soldOutTitleStyle = { fontSize: '10px', fontWeight: 800, letterSpacing: '0.15em', color: '#a1a1aa', margin: '0 0 4px 0', textTransform: 'uppercase' as const };
const noticeBodyStyle = { fontSize: '12px', color: '#d4d4d8', margin: '0' };
