import { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import LegalPageLayout, { TocSection } from '@/components/LegalPageLayout';
import { constructMetadata } from '@/lib/seo-metadata';
import JsonLd from '@/components/JsonLd';
import { getBreadcrumbSchema } from '@/lib/json-ld';

export const metadata: Metadata = constructMetadata({
  title: 'Terms & Conditions | Official Terms of Service | GODSMOVE',
  description:
    'GODSMOVE Terms & Conditions. Detailed terms of service governing orders, pricing, GODSMOVE Wallet, IP rights, and jurisdiction across India.',
  path: '/terms',
  keywords: [
    'GODSMOVE terms and conditions',
    'terms of service GODSMOVE',
    'modern apparel terms',
    'legal agreement GODSMOVE',
  ],
});

const TOC_SECTIONS: TocSection[] = [
  { id: 'general-terms', title: '1. General Terms' },
  { id: 'orders', title: '2. Orders & Allocations' },
  { id: 'payments-pricing', title: '3. Payments & Pricing' },
  { id: 'account-security', title: '4. Account Security' },
  { id: 'wallet-terms', title: '5. GODSMOVE Wallet Credits' },
  { id: 'returns-exchanges', title: '6. Returns & Exchanges' },
  { id: 'intellectual-property', title: '7. Intellectual Property' },
  { id: 'liability', title: '8. Limitation of Liability' },
  { id: 'user-conduct', title: '9. User Conduct' },
  { id: 'privacy-policy-ref', title: '10. Privacy Integration' },
  { id: 'jurisdiction', title: '11. Governing Law & Jurisdiction' },
  { id: 'force-majeure', title: '12. Force Majeure' },
  { id: 'pre-booking-terms', title: '13. Pre-Booking Terms & Conditions' },
  { id: 'membership-terms', title: '14. GODSMOVE Membership Terms & Conditions' },
];

export default function TermsPage() {
  const breadcrumbJsonLd = getBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Terms & Conditions', url: '/terms' },
  ]);

  return (
    <>
      <JsonLd schema={breadcrumbJsonLd} />
      <Navbar />
      <CartDrawer />
      <main>
        <LegalPageLayout
          title="Terms & Conditions"
          subtitle="Official legal agreement governing your purchases, account allocation, and interactions with GODSMOVE."
          lastUpdated="July 2026"
          sections={TOC_SECTIONS}
        >
          <section id="general-terms">
            <h2>1. General Terms</h2>
            <p>
              Welcome to GODSMOVE. By visiting our platform at <strong>godsmove.in</strong> or purchasing any garment, accessory, or exclusive drop item, you agree to be bound by these Terms &amp; Conditions.
            </p>
            <p>
              GODSMOVE reserves the right to modify these terms at any time. Continued use of our site following posted modifications constitutes full acceptance of the updated terms.
            </p>
          </section>

          <section id="orders">
            <h2>2. Orders &amp; Drop Allocations</h2>
            <p>
              All orders are subject to stock availability and allocation verification. Due to the limited production nature of GODSMOVE drop releases:
            </p>
            <ul>
              <li>Placing an item in your shopping cart does not reserve stock until checkout is completed and payment is confirmed.</li>
              <li>GODSMOVE reserves the right to decline or limit order quantities placed per account or delivery address to ensure fair distribution.</li>
              <li>Orders once submitted enter immediate automated processing and cannot be cancelled or modified except under exceptional Concierge review.</li>
            </ul>
          </section>

          <section id="payments-pricing">
            <h2>3. Payments &amp; Pricing</h2>
            <p>
              All prices listed on godsmove.in are expressed in Indian Rupees (INR) and are inclusive of applicable Goods and Services Tax (GST).
            </p>
            <ul>
              <li>Payments are processed securely via PCI-DSS compliant payment gateways (Razorpay).</li>
              <li>We accept Credit Cards, Debit Cards, Net Banking, UPI (Google Pay, PhonePe, Paytm), and GODSMOVE Wallet store credits.</li>
              <li>In the event of a typographical pricing error, GODSMOVE reserves the right to cancel unfulfilled orders affected by the error.</li>
            </ul>
          </section>

          <section id="account-security">
            <h2>4. Account &amp; Passport Security</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials and Google OAuth authentication sessions. You agree to notify Concierge Support immediately of any unauthorized access to your account.
            </p>
          </section>

          <section id="wallet-terms">
            <h2>5. GODSMOVE Wallet Credits</h2>
            <p>
              Store credit issued for approved returns is credited directly to your registered GODSMOVE Wallet balance:
            </p>
            <ul>
              <li>GODSMOVE Wallet credits never expire unless explicitly stated during promotional events.</li>
              <li>Wallet credits are non-transferable and cannot be withdrawn as physical cash or bank transfers.</li>
              <li>Wallet balances apply automatically during checkout toward future purchases.</li>
            </ul>
          </section>

          <section id="returns-exchanges">
            <h2>6. Returns &amp; Exchanges</h2>
            <p>
              Returns are governed strictly by our <strong>Cancellation &amp; Refund Policy</strong>. Returned items must be initiated within 7 days of delivery, unworn, unwashed, and accompanied by original luxury tags and packaging. Approved returns yield store credit in your GODSMOVE Wallet.
            </p>
          </section>

          <section id="intellectual-property">
            <h2>7. Intellectual Property</h2>
            <p>
              All content on godsmove.in — including architectural garment designs, logos, campaign photography, editorial copy, graphics, and video media — is the exclusive intellectual property of GODSMOVE. Unauthorized reproduction, resale, or commercial exploitation is strictly prohibited under Indian copyright and trademark law.
            </p>
          </section>

          <section id="liability">
            <h2>8. Limitation of Liability</h2>
            <p>
              GODSMOVE shall not be liable for indirect, incidental, or consequential damages arising from the use or inability to use our platform or products, exceeding the total amount paid by the customer for the specific order in question.
            </p>
          </section>

          <section id="user-conduct">
            <h2>9. User Conduct</h2>
            <p>
              Users agree not to engage in automated bot purchasing, unauthorized data scraping, reverse engineering, or fraudulent payment attempts. Violations will result in immediate permanent account termination.
            </p>
          </section>

          <section id="privacy-policy-ref">
            <h2>10. Privacy Integration</h2>
            <p>
              Your submission of personal data through our store is governed by our comprehensive <strong>Privacy Policy</strong>.
            </p>
          </section>

          <section id="jurisdiction">
            <h2>11. Governing Law &amp; Jurisdiction</h2>
            <p>
              These Terms &amp; Conditions are governed by and construed in accordance with the laws of India. Any legal proceedings or disputes shall be subject to the exclusive jurisdiction of the competent courts in Madhya Pradesh, India.
            </p>
          </section>

          <section id="force-majeure">
            <h2>12. Force Majeure</h2>
            <p>
              GODSMOVE shall not be held liable for failure or delay in performance caused by acts of God, extreme weather, logistics strikes, governmental restrictions, pandemics, or unforeseen infrastructure outages beyond reasonable control.
            </p>
          </section>

          <section id="pre-booking-terms">
            <h2>13. Pre-Booking Terms &amp; Conditions</h2>
            <p>
              Pre-booking allows customers to reserve limited allocations for upcoming product drops prior to standard live releases.
            </p>
            <ul>
              <li>
                <strong>13.1 Nature of Reservation:</strong> A pre-booking constitutes a confirmed garment allocation and becomes a binding order only upon successful online payment confirmation.
              </li>
              <li>
                <strong>13.2 Payment Requirements:</strong> Pre-booking transactions require full online payment via Credit/Debit Cards, Net Banking, UPI, or GODSMOVE Wallet store credits. <strong>Cash on Delivery (COD) is strictly unavailable</strong> for pre-booking orders.
              </li>
              <li>
                <strong>13.3 Allocation Limits:</strong> Pre-bookings are subject to quantitative limits set for each drop. Once the configured allocation limit is reached, additional pre-bookings will not be accepted.
              </li>
              <li>
                <strong>13.4 Inventory Accounting:</strong> Pre-booked units are actual paid orders and consume stock directly from the product&apos;s total physical inventory pool. They are not treated as separate physical stock.
              </li>
              <li>
                <strong>13.5 Canonical Inventory Calculation:</strong> Stock availability is governed by our canonical formula: <code>AVAILABLE = TOTAL PHYSICAL INVENTORY - SOLD + RETURN</code>. Units reserved under pre-booking count directly toward <code>SOLD</code>.
              </li>
              <li>
                <strong>13.6 Launch Transition:</strong> When the configured pre-booking timer reaches its launch threshold, the product seamlessly transitions to the live purchase flow. Any remaining unused allocation automatically becomes available as live inventory.
              </li>
              <li>
                <strong>13.7 Sold Out Display Policy:</strong> When available inventory reaches zero (<code>AVAILABLE = 0</code>), the product remains visible on the storefront displaying a <strong>SOLD OUT</strong> badge. Products are never automatically deleted or hidden unless explicitly unpublished by Admin.
              </li>
              <li>
                <strong>13.8 Pre-Booking Benefits:</strong> Qualifying pre-booking customers receive a complimentary 1-year GODSMOVE Membership, exclusive drop allocation, priority dispatch upon release, and drop-specific promotional benefits.
              </li>
              <li>
                <strong>13.9 Returns &amp; Store Credit:</strong> Pre-booked items are covered by our standard 7-day return policy following physical delivery. Approved returns yield store credit credited directly to the customer&apos;s GODSMOVE Wallet.
              </li>
            </ul>
          </section>

          <section id="membership-terms">
            <h2>14. GODSMOVE Membership Terms &amp; Conditions</h2>
            <p>
              The GODSMOVE Membership program offers exclusive access, priority services, and privileges for dedicated brand patrons.
            </p>
            <ul>
              <li>
                <strong>14.1 Membership Start &amp; Activation:</strong> Complimentary membership is activated automatically upon completion of a customer&apos;s first qualifying pre-booking or purchase.
              </li>
              <li>
                <strong>14.2 Duration:</strong> Granted memberships remain active for exactly <strong>1 YEAR (365 days)</strong> from the date of activation.
              </li>
              <li>
                <strong>14.3 Subsequent Pre-Bookings:</strong> Making additional pre-bookings or purchases during an active membership period does not automatically extend or stack the existing expiration date.
              </li>
              <li>
                <strong>14.4 Membership Benefits:</strong> Active members enjoy exclusive privileges including:
                <ul>
                  <li>GODSMOVE Membership status badge on account profile</li>
                  <li>Pre-launch drop access and early reservation privileges</li>
                  <li>Priority Dispatch processing for all fulfilled orders</li>
                  <li>Access to GODSMOVE Care concierge services</li>
                  <li>Members-only discounts and private archival event invitations</li>
                </ul>
              </li>
              <li>
                <strong>14.5 Membership Expiration &amp; Admin Renewal:</strong> Membership automatically becomes inactive upon reaching its 1-year end date. Administrators reserve the right to grant manual renewals or extensions via the CRM engine.
              </li>
              <li>
                <strong>14.6 Security &amp; Non-Transferability:</strong> GODSMOVE Memberships are personal, non-transferable, and bound to the registered customer account. Any fraudulent activity or misuse will result in immediate membership revocation.
              </li>
            </ul>
          </section>
        </LegalPageLayout>
      </main>
      <Footer />
    </>
  );
}
