import { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import ContactClient from './ContactClient';
import { constructMetadata } from '@/lib/seo-metadata';
import JsonLd from '@/components/JsonLd';
import { getBreadcrumbSchema } from '@/lib/json-ld';

export const metadata: Metadata = constructMetadata({
  title: 'Concierge Contact & Support | GODSMOVE',
  description:
    'Reach out to GODSMOVE Concierge. 24×7 phone, WhatsApp, and email assistance for order tracking, size advice, and luxury allocations.',
  path: '/contact',
  keywords: [
    'GODSMOVE contact',
    'customer support GODSMOVE',
    'luxury concierge assistance',
    'GODSMOVE helpline phone',
  ],
});

export default function ContactPage() {
  const breadcrumbJsonLd = getBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Contact Us', url: '/contact' },
  ]);

  return (
    <>
      <JsonLd schema={breadcrumbJsonLd} />
      <Navbar />
      <CartDrawer />
      <main>
        <ContactClient />
      </main>
      <Footer />
    </>
  );
}
