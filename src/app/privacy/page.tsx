import { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import PrivacyPolicyContent from '@/components/legal/PrivacyPolicyContent';
import { constructMetadata } from '@/lib/seo-metadata';
import JsonLd from '@/components/JsonLd';
import { getBreadcrumbSchema } from '@/lib/json-ld';

export const metadata: Metadata = constructMetadata({
  title: 'Privacy Policy | Confidentiality & Data Rights | GODSMOVE',
  description:
    'GODSMOVE Privacy Policy. Learn how we safeguard your personal data, encryption protocols, cookies, and privacy rights across India.',
  path: '/privacy',
  keywords: [
    'GODSMOVE privacy policy',
    'data privacy GODSMOVE',
    'modern apparel privacy India',
    'personal data rights GODSMOVE',
  ],
});

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
        <PrivacyPolicyContent />
      </main>
      <Footer />
    </>
  );
}
