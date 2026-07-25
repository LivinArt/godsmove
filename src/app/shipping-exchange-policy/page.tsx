import { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import LegalPageLayout, { TocSection } from '@/components/LegalPageLayout';
import { constructMetadata } from '@/lib/seo-metadata';
import JsonLd from '@/components/JsonLd';
import { getBreadcrumbSchema } from '@/lib/json-ld';
import styles from '@/components/LegalPageLayout.module.css';

export const metadata: Metadata = constructMetadata({
  title: 'Shipping & Exchange Policy — Pan-India Delivery & Quality Rules | GODSMOVE',
  description:
    'GODSMOVE Shipping & Exchange Policy. Complimentary shipping across India, delivery timelines, 7-day return window, quality inspection, and rejected return conditions.',
  path: '/shipping-exchange-policy',
  keywords: [
    'GODSMOVE shipping policy',
    'free delivery India streetwear',
    'exchange and return guidelines',
    'quality inspection rules GODSMOVE',
  ],
});

const TOC_SECTIONS: TocSection[] = [
  { id: 'shipping-rates', title: '1. Shipping Rates & Coverage' },
  { id: 'processing-timelines', title: '2. Processing & Dispatch Timelines' },
  { id: 'delivery-estimates', title: '3. Delivery Estimates' },
  { id: 'return-window', title: '4. 7-Day Return Window' },
  { id: 'replacement-process', title: '5. Replacement Process' },
  { id: 'wallet-credit-flow', title: '6. Wallet Credit Flow' },
  { id: 'quality-inspection', title: '7. Quality Inspection Criteria' },
  { id: 'rejected-returns', title: '8. Rejected Return Conditions' },
];

export default function ShippingExchangePolicyPage() {
  const breadcrumbJsonLd = getBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Shipping & Exchange Policy', url: '/shipping-exchange-policy' },
  ]);

  return (
    <>
      <JsonLd schema={breadcrumbJsonLd} />
      <Navbar />
      <CartDrawer />
      <main>
        <LegalPageLayout
          title="Shipping & Exchange Policy"
          subtitle="Comprehensive logistics overview detailing Pan-India complimentary shipping, dispatch timelines, and quality inspection criteria."
          lastUpdated="July 2026"
          sections={TOC_SECTIONS}
        >
          <section id="shipping-rates">
            <h2>1. Shipping Rates &amp; Coverage</h2>
            <div className={styles.highlightBox}>
              <h4>Complimentary Pan-India Shipping</h4>
              <p>
                GODSMOVE provides 100% complimentary shipping on all orders across India, with zero hidden delivery fees or minimum cart constraints.
              </p>
            </div>
          </section>

          <section id="processing-timelines">
            <h2>2. Processing &amp; Dispatch Timelines</h2>
            <p>
              Orders are dispatched with urgency from our central fulfillment facility:
            </p>
            <ul>
              <li><strong>Standard Orders:</strong> Processed and dispatched within <strong>24 to 48 hours</strong> of order confirmation.</li>
              <li><strong>Archival Drop Launches:</strong> Due to heavy allocation volume during drop launches, dispatch may take up to 72 hours.</li>
              <li>Tracking links are transmitted automatically via Email and SMS once dispatched.</li>
            </ul>
          </section>

          <section id="delivery-estimates">
            <h2>3. Delivery Estimates</h2>
            <p>Estimated transit times post-dispatch across India:</p>
            <ul>
              <li><strong>Metro Cities (Delhi NCR, Mumbai, Bengaluru, Hyderabad, Chennai, Kolkata):</strong> 3 to 5 business days.</li>
              <li><strong>Tier 2 &amp; Tier 3 Regions:</strong> 5 to 7 business days.</li>
              <li><strong>Special Locations / Remote Areas:</strong> Up to 8 business days.</li>
            </ul>
          </section>

          <section id="return-window">
            <h2>4. 7-Day Return Window</h2>
            <p>
              Customers may request a return within <strong>7 calendar days</strong> from the official delivery date marked by our courier partner. Return requests submitted past 7 days will not be accepted.
            </p>
          </section>

          <section id="replacement-process">
            <h2>5. Replacement Process</h2>
            <p>
              In cases involving wrong item delivery or verified garment damage:
            </p>
            <ul>
              <li>Concierge Support schedules a reverse pickup at your delivery address.</li>
              <li>Once received at our facility and verified, an exact replacement garment is dispatched immediately with priority tracking.</li>
            </ul>
          </section>

          <section id="wallet-credit-flow">
            <h2>6. Wallet Credit Flow</h2>
            <p>
              For standard change-of-mind or size preference returns:
            </p>
            <ul>
              <li>Item is returned &rarr; Quality Inspection passed &rarr; Instant 100% credit issued to your GODSMOVE Wallet.</li>
              <li>Use your wallet balance at checkout for any fresh size or new drop purchase.</li>
            </ul>
          </section>

          <section id="quality-inspection">
            <h2>7. Quality Inspection Criteria</h2>
            <p>
              To maintain luxury standards, every returned garment undergoes rigorous inspection upon arrival:
            </p>
            <ul>
              <li>Unworn, unwashed, and free from any signs of wear.</li>
              <li>Original luxury tags, neck labels, and archival dust bags must remain attached and intact.</li>
              <li>Free from odors, perfume, makeup stains, or detergent scents.</li>
            </ul>
          </section>

          <section id="rejected-returns">
            <h2>8. Rejected Return Conditions</h2>
            <div className={styles.highlightBox}>
              <h4>Conditions Resulting in Return Rejection</h4>
              <p>
                Returns will be rejected and sent back to the customer if:
              </p>
            </div>
            <ul>
              <li>The garment shows evidence of being worn, washed, altered, or damaged by the customer.</li>
              <li>Original tags or branded packaging are missing or detached.</li>
              <li>The return request was initiated after the 7-day window.</li>
              <li>Traces of perfume, deodorant, smoke, or body odor are detected during inspection.</li>
            </ul>
            <p>
              Rejected return shipments will be sent back to the customer at the customer&apos;s expense.
            </p>
          </section>
        </LegalPageLayout>
      </main>
      <Footer />
    </>
  );
}
