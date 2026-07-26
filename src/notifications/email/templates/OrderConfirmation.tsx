import React from 'react';
import { Section, Text } from '@react-email/components';
import { LuxuryEmailLayout } from '../layouts/LuxuryEmailLayout';
import { ProductCard, EmailOrderItem } from '../components/ProductCard';
import { PriceSummary } from '../components/PriceSummary';
import { OrderSummary, EmailShippingAddress } from '../components/OrderSummary';
import { CTAButton } from '../components/CTAButton';

export interface OrderConfirmationEmailProps {
  customerName: string;
  orderNumber: string;
  orderDate: string;
  items: EmailOrderItem[];
  subtotal: number;
  shipping: number;
  walletDiscount?: number;
  couponDiscount?: number;
  total: number;
  shippingAddress: EmailShippingAddress;
  trackOrderUrl?: string;
  continueShoppingUrl?: string;
}

export const OrderConfirmationEmail: React.FC<OrderConfirmationEmailProps> = ({
  customerName = 'Valued Collector',
  orderNumber = 'GM-2026-8801',
  orderDate = '26 July 2026',
  items = [
    {
      id: '1',
      title: 'Architectural Heavyweight Oversized Tee',
      size: 'L',
      color: 'Washed Black',
      quantity: 1,
      price: 2999,
      imageUrl: 'https://godsmove.in/images/hero-1.jpg',
    },
  ],
  subtotal = 2999,
  shipping = 0,
  walletDiscount = 0,
  couponDiscount = 0,
  total = 2999,
  shippingAddress = {
    name: 'Valued Collector',
    line1: '402 Archival Towers, Bandra West',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400050',
    phone: '+91 98765 43210',
  },
  trackOrderUrl = 'https://godsmove.in/profile',
  continueShoppingUrl = 'https://godsmove.in/drops',
}) => {
  const previewText = `Allocation Confirmed: Order ${orderNumber} for ${customerName}`;

  return (
    <LuxuryEmailLayout previewText={previewText}>
      <Section style={introSection}>
        <Text style={greetingStyle}>DEAR {customerName.toUpperCase()},</Text>
        <Text style={bodyStyle}>
          Your statement piece allocation has been confirmed. Our archival artisans are preparing your order for technical inspection and dispatch.
        </Text>
      </Section>

      <OrderSummary
        orderNumber={orderNumber}
        orderDate={orderDate}
        shippingAddress={shippingAddress}
      />

      <ProductCard items={items} />

      <PriceSummary
        subtotal={subtotal}
        shipping={shipping}
        walletDiscount={walletDiscount}
        couponDiscount={couponDiscount}
        total={total}
      />

      <Section style={actionContainer}>
        <table width="100%" cellPadding="0" cellSpacing="0">
          <tr>
            <td style={{ textAlign: 'center', paddingBottom: '12px' }}>
              <CTAButton href={trackOrderUrl} variant="gold">
                TRACK YOUR ALLOCATION
              </CTAButton>
            </td>
          </tr>
          <tr>
            <td style={{ textAlign: 'center' }}>
              <CTAButton href={continueShoppingUrl} variant="secondary">
                EXPLORE ARCHIVAL DROPS
              </CTAButton>
            </td>
          </tr>
        </table>
      </Section>
    </LuxuryEmailLayout>
  );
};

export default OrderConfirmationEmail;

const introSection = {
  marginBottom: '24px',
};

const greetingStyle = {
  fontSize: '14px',
  fontWeight: 800,
  letterSpacing: '0.1em',
  color: '#ffffff',
  margin: '0 0 12px 0',
};

const bodyStyle = {
  fontSize: '12px',
  color: '#a1a1aa',
  lineHeight: '20px',
  margin: '0',
};

const actionContainer = {
  margin: '32px 0 16px 0',
};
