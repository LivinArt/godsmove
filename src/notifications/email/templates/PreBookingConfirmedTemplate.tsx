import React from 'react';
import { Section, Text, Img, Row, Column } from '@react-email/components';
import { LuxuryEmailLayout } from '../layouts/LuxuryEmailLayout';
import { CTAButton } from '../components/CTAButton';

export interface PreBookingConfirmedTemplateProps {
  customerName: string;
  orderNumber: string;
  orderId: string;
  productName: string;
  productImage?: string | null;
  size: string;
  quantity: number;
  price: number;
  bookingDate: string;
  launchDateText: string;
  launchTimeText: string;
  countdownText: string;
  expectedDispatchText: string;
  viewInvoiceUrl?: string;
  viewPreOrdersUrl?: string;
  membershipUrl?: string;
}

export const PreBookingConfirmedTemplate: React.FC<PreBookingConfirmedTemplateProps> = ({
  customerName = 'Valued Collector',
  orderNumber = 'SS-202608-5001',
  orderId = 'ord_123',
  productName = 'Premium Urban Tee, Drop Shoulder Tee, Drop1',
  productImage,
  size = 'L',
  quantity = 1,
  price = 5399,
  bookingDate = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
  launchDateText = '15 August 2026',
  launchTimeText = '18:00 IST',
  countdownText = 'Launches in 13 days, 18 hours',
  expectedDispatchText = 'Within 24 Hours of Launch',
  viewInvoiceUrl = `https://godsmove.in/api/invoice/view/${orderId}`,
  viewPreOrdersUrl = 'https://godsmove.in/profile?tab=prebookings',
  membershipUrl = 'https://godsmove.in/membership',
}) => {
  const previewText = `Pre-Booking Confirmed: ${productName} | GODSMOVE`;

  return (
    <LuxuryEmailLayout previewText={previewText}>
      {/* 1. Header Statement */}
      <Section style={{ marginBottom: '24px' }}>
        <Text style={eyebrowStyle}>PRE-BOOKING CONFIRMED</Text>
        <Text style={headingStyle}>Thank you for trusting GODSMOVE before the release.</Text>
        <Text style={bodyTextStyle}>
          Dear {customerName.toUpperCase()}, your pre-booking reservation is officially locked in our digital registry. You trusted us before the world saw it, and your piece has been reserved exclusively for you.
        </Text>
      </Section>

      {/* 2. Pre-Booking Details Card */}
      <Section style={cardStyle}>
        <Text style={cardTitle}>YOUR PRE-BOOKING IS SECURED</Text>

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
            <Text style={productMetaStyle}>
              SIZE: <strong style={{ color: '#ffffff' }}>{size}</strong> &nbsp;|&nbsp; QTY: <strong style={{ color: '#ffffff' }}>{quantity}</strong>
            </Text>
            <Text style={priceStyle}>₹{price.toLocaleString('en-IN')}</Text>
          </Column>
        </Row>

        <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '16px', marginTop: '16px' }}>
          <Row>
            <Column style={{ width: '50%' }}>
              <Text style={metaLabel}>ORDER NUMBER</Text>
              <Text style={metaVal}>#{orderNumber}</Text>
            </Column>
            <Column style={{ width: '50%' }}>
              <Text style={metaLabel}>BOOKING DATE</Text>
              <Text style={metaVal}>{bookingDate}</Text>
            </Column>
          </Row>

          <Row style={{ marginTop: '12px' }}>
            <Column style={{ width: '50%' }}>
              <Text style={metaLabel}>LAUNCH TIMELINE</Text>
              <Text style={metaValGold}>{countdownText}</Text>
            </Column>
            <Column style={{ width: '50%' }}>
              <Text style={metaLabel}>EXPECTED DISPATCH</Text>
              <Text style={metaVal}>{expectedDispatchText}</Text>
            </Column>
          </Row>
        </div>
      </Section>

      {/* 3. Pre-Booking Privilege Statement */}
      <Section style={{ marginBottom: '28px' }}>
        <Text style={quoteStyle}>
          &ldquo;You have secured your allocation before public release. You are now part of GODSMOVE.&rdquo;
        </Text>
      </Section>

      {/* 4. Complimentary Membership Announcement */}
      <Section style={membershipCardStyle}>
        <Text style={membershipTag}>COMPLIMENTARY MEMBERSHIP ACTIVATED</Text>
        <Text style={membershipTitle}>
          Your Pre-Booking includes 1 Year of Complimentary GODSMOVE Membership.
        </Text>
        <Text style={bodyTextStyle}>
          Your GODSMOVE Membership has been automatically activated because you completed a Pre-Booking. Enjoy full collector privileges for 365 days:
        </Text>

        <ul style={benefitListStyle}>
          <li style={benefitItemStyle}>• Additional offers & discounts on eligible statement pieces</li>
          <li style={benefitItemStyle}>• Early access window for upcoming drops & collections</li>
          <li style={benefitItemStyle}>• Exclusive product reveals & private previews</li>
          <li style={benefitItemStyle}>• Invite-only community & atelier event access</li>
          <li style={benefitItemStyle}>• Collector privileges & sponsored brand experiences</li>
        </ul>

        <Text style={membershipExpiryStyle}>Active Status: 1 Year Verified</Text>
      </Section>

      {/* 5. CTAs Stack */}
      <Section style={{ textAlign: 'center', margin: '32px 0 16px 0' }}>
        <div style={{ display: 'inline-block', margin: '4px' }}>
          <CTAButton href={viewInvoiceUrl} variant="gold">
            VIEW INVOICE
          </CTAButton>
        </div>
        <div style={{ display: 'inline-block', margin: '4px' }}>
          <CTAButton href={viewPreOrdersUrl} variant="outline">
            VIEW MY PRE-ORDERS
          </CTAButton>
        </div>
        <div style={{ display: 'inline-block', margin: '4px' }}>
          <CTAButton href={membershipUrl} variant="outline">
            EXPLORE MEMBERSHIP
          </CTAButton>
        </div>
      </Section>
    </LuxuryEmailLayout>
  );
};

export default PreBookingConfirmedTemplate;

const eyebrowStyle = { fontSize: '11px', fontWeight: 800, letterSpacing: '0.2em', color: '#c8a46a', margin: '0 0 8px 0', textTransform: 'uppercase' as const };
const headingStyle = { fontSize: '18px', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.01em', margin: '0 0 12px 0' };
const bodyTextStyle = { fontSize: '13px', color: '#a1a1aa', lineHeight: '20px', margin: '0 0 12px 0' };
const cardStyle = { backgroundColor: '#121215', border: '1px solid rgba(200, 164, 106, 0.3)', borderRadius: '4px', padding: '24px', marginBottom: '24px' };
const cardTitle = { fontSize: '10px', fontWeight: 800, letterSpacing: '0.15em', color: '#c8a46a', margin: '0 0 12px 0', textTransform: 'uppercase' as const };
const productTitleStyle = { fontSize: '15px', fontWeight: 600, color: '#ffffff', margin: '0 0 6px 0' };
const productMetaStyle = { fontSize: '11px', color: '#a1a1aa', margin: '0 0 6px 0', textTransform: 'uppercase' as const, letterSpacing: '0.05em' };
const priceStyle = { fontSize: '18px', fontWeight: 800, color: '#c8a46a', margin: '0' };
const metaLabel = { fontSize: '9px', fontWeight: 700, letterSpacing: '0.15em', color: '#71717a', margin: '0 0 2px 0', textTransform: 'uppercase' as const };
const metaVal = { fontSize: '12px', fontWeight: 600, color: '#ffffff', margin: '0' };
const metaValGold = { fontSize: '12px', fontWeight: 700, color: '#c8a46a', margin: '0' };
const quoteStyle = { fontSize: '13px', fontStyle: 'italic', color: '#e4e4e7', textAlign: 'center' as const, lineHeight: '22px', borderLeft: '2px solid #c8a46a', paddingLeft: '16px', margin: '0' };
const membershipCardStyle = { backgroundColor: '#09090b', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '4px', padding: '24px', marginBottom: '24px' };
const membershipTag = { fontSize: '9px', fontWeight: 800, letterSpacing: '0.2em', color: '#c8a46a', margin: '0 0 8px 0', textTransform: 'uppercase' as const };
const membershipTitle = { fontSize: '15px', fontWeight: 700, color: '#ffffff', margin: '0 0 12px 0' };
const benefitListStyle = { margin: '0 0 16px 0', paddingLeft: '0', listStyleType: 'none' };
const benefitItemStyle = { fontSize: '12px', color: '#d4d4d8', lineHeight: '20px', marginBottom: '6px' };
const membershipExpiryStyle = { fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: '#c8a46a', textTransform: 'uppercase' as const, margin: '0' };
