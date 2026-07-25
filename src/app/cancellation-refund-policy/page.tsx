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
  title: 'Cancellation & Refund Policy — Order Rules & Wallet Credit | GODSMOVE',
  description:
    'Official GODSMOVE Cancellation & Refund Policy. Detailed rules on order cancellations, 7-day returns, GODSMOVE Wallet refunds, and replacements.',
  path: '/cancellation-refund-policy',
  keywords: [
    'GODSMOVE cancellation policy',
    'refund policy GODSMOVE',
    'wallet credit return GODSMOVE',
    'exchange and replacement rules',
  ],
});

const TOC_SECTIONS: TocSection[] = [
  { id: 'cancellation-rules', title: '1. Order Cancellation Policy' },
  { id: 'refund-wallet', title: '2. Return & Wallet Refund Rules' },
  { id: 'size-exchange', title: '3. Size Exchange Flow' },
  { id: 'wrong-product', title: '4. Wrong Product Delivered' },
  { id: 'damaged-product', title: '5. Damaged Product Policy' },
  { id: 'unfulfilled-prepaid', title: '6. Unfulfilled Prepaid Orders' },
  { id: 'wallet-terms-detail', title: '7. Wallet Credits & Validity' },
];

export default function CancellationRefundPolicyPage() {
  const breadcrumbJsonLd = getBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Cancellation & Refund Policy', url: '/cancellation-refund-policy' },
  ]);

  return (
    <>
      <JsonLd schema={breadcrumbJsonLd} />
      <Navbar />
      <CartDrawer />
      <main>
        <LegalPageLayout
          title="Cancellation & Refund Policy"
          subtitle="Clear, transparent business rules governing order cancellations, 7-day return requests, and instant GODSMOVE Wallet refunds."
          lastUpdated="July 2026"
          sections={TOC_SECTIONS}
        >
          {/* Section 1 */}
          <section id="cancellation-rules">
            <h2>1. Order Cancellation Policy</h2>
            <div className={styles.highlightBox}>
              <h4>Immediate Concierge Evaluation Required</h4>
              <p>
                Orders once placed enter immediate automated warehouse dispatch and <strong>cannot normally be cancelled</strong>.
              </p>
            </div>
            <p>
              If cancellation is absolutely necessary, customers must immediately contact GODSMOVE via:
            </p>
            <ul>
              <li><strong>Email:</strong> support@godsmove.in</li>
              <li><strong>WhatsApp:</strong> +91 8827175801</li>
              <li><strong>Phone:</strong> +91 8827175801</li>
            </ul>
            <p>
              Our Concierge team will evaluate whether cancellation is possible depending on the exact order processing stage. <strong>Cancellation is NOT guaranteed.</strong>
            </p>
          </section>

          {/* Section 2 */}
          <section id="refund-wallet">
            <h2>2. Return &amp; Wallet Refund Rules</h2>
            <p>
              If a customer does not like a product or wishes to return a garment:
            </p>
            <ul>
              <li>Return request must be initiated within <strong>7 days of delivery</strong>.</li>
              <li>The garment must pass quality inspection (unworn, unwashed, original luxury tags intact).</li>
              <li><strong>Refunds are issued exclusively to your GODSMOVE Wallet balance.</strong> No direct cash or bank transfer refunds are provided for change-of-mind returns.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section id="size-exchange">
            <h2>3. Size Exchange Flow</h2>
            <p>
              To maintain inventory accuracy across limited drops, GODSMOVE operates a streamlined Wallet Exchange model:
            </p>
            <div className={styles.highlightBox}>
              <h4>Size Exchange Workflow</h4>
              <p>
                Customer Initiates Return &rarr; Quality Inspection &rarr; Instant GODSMOVE Wallet Credit &rarr; Customer Places Fresh Order in Desired Size.
              </p>
            </div>
            <p>Direct manual size exchanges are not processed to prevent stock reservation delays.</p>
          </section>

          {/* Section 4 */}
          <section id="wrong-product">
            <h2>4. Wrong Product Delivered</h2>
            <p>
              If an incorrect style, color, or product is delivered due to a warehouse dispatch error:
            </p>
            <ul>
              <li>Notify Concierge Support within 48 hours of delivery.</li>
              <li>GODSMOVE will arrange reverse pickup and provide a <strong>Replacement of the correct product only</strong>.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section id="damaged-product">
            <h2>5. Damaged Product Policy</h2>
            <p>
              If a garment arrives damaged or defective in transit:
            </p>
            <ul>
              <li>Notify Concierge Support within 48 hours of delivery with unboxing photos/video.</li>
              <li>GODSMOVE will provide a <strong>Replacement of the exact same product</strong>.</li>
              <li>No GODSMOVE Wallet refund or cash refund is offered for damaged items where an exact replacement can be provided.</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section id="unfulfilled-prepaid">
            <h2>6. Unfulfilled Prepaid Orders</h2>
            <p>
              In the rare event that GODSMOVE is unable to fulfill a prepaid order due to unexpected inventory depletion or logistics failure:
            </p>
            <p>
              <strong>100% of the prepaid amount will be refunded directly back to the customer&apos;s original payment source</strong> (Credit Card, Debit Card, UPI, or Net Banking) within 5–7 business days.
            </p>
          </section>

          {/* Section 7 */}
          <section id="wallet-terms-detail">
            <h2>7. Wallet Credits &amp; Validity</h2>
            <p>
              GODSMOVE Wallet credits represent store value for future statement piece purchases:
            </p>
            <ul>
              <li><strong>Never Expire:</strong> Wallet credits remain active indefinitely unless otherwise stated for specific promotional events.</li>
              <li><strong>Universal Application:</strong> Can be applied seamlessly to any future GODSMOVE drop or archival collection checkout.</li>
            </ul>
          </section>
        </LegalPageLayout>
      </main>
      <Footer />
    </>
  );
}
