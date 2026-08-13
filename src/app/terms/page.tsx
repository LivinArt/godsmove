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
        </LegalPageLayout>
      </main>
      <Footer />
    </>
  );
}
