import React from 'react';
import { Section, Text } from '@react-email/components';
import { LuxuryEmailLayout } from '../layouts/LuxuryEmailLayout';
import { ProductCard, EmailOrderItem } from '../components/ProductCard';
import { PriceSummary } from '../components/PriceSummary';
import { OrderSummary, EmailShippingAddress } from '../components/OrderSummary';
import { CTAButton } from '../components/CTAButton';

export interface OrderConfirmationTemplateProps {
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

export const OrderConfirmationTemplate: React.FC<OrderConfirmationTemplateProps> = ({
  customerName = 'Valued Collector',
  orderNumber = 'GM-2026-8801',
  orderDate = '26 July 2026',
  items = [],
  subtotal = 0,
  shipping = 0,
  walletDiscount = 0,
  couponDiscount = 0,
  total = 0,
  shippingAddress = {
    name: 'Valued Collector',
    line1: 'Address Line 1',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400050',
    phone: '',
  },
  trackOrderUrl = 'https://godsmove.in/profile',
  continueShoppingUrl = 'https://godsmove.in/drops',
}) => {
  const previewText = `Allocation Confirmed: Order ${orderNumber}`;

  return (
    <LuxuryEmailLayout previewText={previewText}>
      <Section style={{ marginBottom: '24px' }}>
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

      {items.length > 0 && <ProductCard items={items} />}

      <PriceSummary
        subtotal={subtotal}
        shipping={shipping}
        walletDiscount={walletDiscount}
        couponDiscount={couponDiscount}
        total={total}
      />

      <Section style={{ margin: '32px 0 16px 0', textAlign: 'center' }}>
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

export default OrderConfirmationTemplate;

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
