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
  title: 'Privacy Policy — Confidentiality & Data Rights | GODSMOVE',
  description:
    'GODSMOVE Privacy Policy. Learn how we safeguard your personal data, encryption protocols, cookies, and privacy rights across India.',
  path: '/privacy',
  keywords: [
    'GODSMOVE privacy policy',
    'data privacy streetwear',
    'luxury ecommerce privacy India',
    'personal data rights GODSMOVE',
  ],
});

const TOC_SECTIONS: TocSection[] = [
  { id: 'introduction', title: '1. Introduction & Overview' },
  { id: 'data-collection', title: '2. Information We Collect' },
  { id: 'data-usage', title: '3. How We Use Your Data' },
  { id: 'cookies', title: '4. Cookies & Analytics' },
  { id: 'sharing', title: '5. Data Disclosure & Logistics' },
  { id: 'security', title: '6. Encryption & Storage Security' },
  { id: 'rights', title: '7. Your Data Rights' },
  { id: 'contact-dpo', title: '8. Privacy Contact & DPO' },
];

export default function PrivacyPolicyPage() {
  const breadcrumbJsonLd = getBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Privacy Policy', url: '/privacy' },
  ]);

  return (
    <>
      <JsonLd schema={breadcrumbJsonLd} />
      <Navbar />
      <CartDrawer />
      <main>
        <LegalPageLayout
          title="Privacy Policy"
          subtitle="At GODSMOVE, your privacy and data security are integral to our luxury brand experience."
          lastUpdated="July 2026"
          sections={TOC_SECTIONS}
        >
          <section id="introduction">
            <h2>1. Introduction & Overview</h2>
            <p>
              GODSMOVE (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to respecting your privacy and safeguarding your personal information. This Privacy Policy governs your use of our digital platforms, including <strong>godsmove.in</strong>, mobile applications, and concierge interactions across India.
            </p>
            <p>
              By accessing our platform, placing orders, or engaging with our concierge services, you agree to the collection, processing, and storage practices detailed herein.
            </p>
          </section>

          <section id="data-collection">
            <h2>2. Information We Collect</h2>
            <p>We collect personal information necessary to deliver bespoke luxury apparel and concierge assistance:</p>
            <ul>
              <li><strong>Identity & Contact Details:</strong> Full name, telephone number, email address, shipping and billing address.</li>
              <li><strong>Authentication Data:</strong> Encrypted Google OAuth identifiers, password hashes, and session tokens.</li>
              <li><strong>Transaction & Wallet History:</strong> Order allocations, payment confirmation references, Razorpay transaction tokens, and GODSMOVE Wallet balance credits.</li>
              <li><strong>Device & Behavioral Technical Data:</strong> IP address, browser specification, device type, page view analytics via Google Analytics 4, and referrer logs.</li>
            </ul>
          </section>

          <section id="data-usage">
            <h2>3. How We Use Your Data</h2>
            <p>Your data is processed strictly for legitimate operational and luxury service objectives:</p>
            <ul>
              <li>Fulfilling drop allocations, processing prepaid orders, and dispatching Pan-India shipments.</li>
              <li>Crediting instant refunds to your GODSMOVE Wallet upon return verification.</li>
              <li>Providing 24×7 Concierge support via WhatsApp, phone, and email.</li>
              <li>Detecting fraudulent activity, verifying VVIP tier access, and securing payment transactions.</li>
              <li>Transmitting exclusive archival drop notifications and editorial communications (where opted in).</li>
            </ul>
          </section>

          <section id="cookies">
            <h2>4. Cookies & Tracking Technologies</h2>
            <p>
              We utilize essential session cookies, local storage tokens, and Google Analytics 4 tracking tags to analyze site traffic, preserve cart items across sessions, and prevent duplicate conversion dispatch. You may disable non-essential cookies via your browser settings without restricting checkout functionality.
            </p>
          </section>

          <section id="sharing">
            <h2>5. Data Disclosure & Logistics Partners</h2>
            <p>
              GODSMOVE strictly refrains from selling, renting, or trading customer personal data. Information is disclosed solely to authorized infrastructure partners:
            </p>
            <ul>
              <li><strong>Logistics Providers:</strong> Premium courier services (Blue Dart, Delhivery) for order fulfillment and address validation.</li>
              <li><strong>Payment Gateways:</strong> Razorpay for PCI-DSS compliant payment processing.</li>
              <li><strong>Database Services:</strong> Supabase for secure, encrypted cloud data storage.</li>
              <li><strong>Legal Authorities:</strong> Where compelled under applicable statutory law or judicial order in India.</li>
            </ul>
          </section>

          <section id="security">
            <h2>6. Encryption & Storage Security</h2>
            <div className={styles.highlightBox}>
              <h4>Enterprise Encryption Assurance</h4>
              <p>
                All communications between your device and GODSMOVE are encrypted using 256-bit Transport Layer Security (TLS 1.3). Payment data is handled directly by PCI-DSS Level 1 certified gateways.
              </p>
            </div>
          </section>

          <section id="rights">
            <h2>7. Your Data Rights</h2>
            <p>Under Indian data protection laws, you possess fundamental rights regarding your personal records:</p>
            <ul>
              <li><strong>Access & Inspection:</strong> Request a digital copy of your personal data stored in our system.</li>
              <li><strong>Rectification:</strong> Modify incorrect contact information directly within your Profile dashboard.</li>
              <li><strong>Erasure:</strong> Request the deletion of non-transactional account records.</li>
            </ul>
          </section>

          <section id="contact-dpo">
            <h2>8. Privacy Contact & Data Officer</h2>
            <p>
              For privacy inquiries, data deletion requests, or compliance concerns, contact our Data Privacy Desk:
            </p>
            <p>
              <strong>Email:</strong> privacy@godsmove.in / support@godsmove.in<br />
              <strong>Phone:</strong> +91 8827175801<br />
              <strong>Address:</strong> GODSMOVE Atelier Concierge, India
            </p>
          </section>
        </LegalPageLayout>
      </main>
      <Footer />
    </>
  );
}
