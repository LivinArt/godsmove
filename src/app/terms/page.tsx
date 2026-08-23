import { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import TermsContent from '@/components/legal/TermsContent';
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
        <TermsContent />
      </main>
      <Footer />
    </>
  );
}
