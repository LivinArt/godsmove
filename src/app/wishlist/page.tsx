import { Metadata } from 'next';
import WishlistClient from './WishlistClient';
import Navbar from '@/components/Navbar';
import CartDrawer from '@/components/CartDrawer';
import Footer from '@/components/Footer';
import { constructMetadata } from '@/lib/seo-metadata';

export const metadata: Metadata = constructMetadata({
  title: 'Wishlist — Saved Pieces | GODSMOVE',
  description: 'Your saved statement pieces and reserved allocations.',
  path: '/wishlist',
  noIndex: true,
});

export default function WishlistPage() {
  return (
    <>
      <Navbar />
      <CartDrawer />
      <main style={{ minHeight: '100vh', paddingTop: 'var(--nav-height, 80px)' }}>
        <WishlistClient />
      </main>
      <Footer />
    </>
  );
}
