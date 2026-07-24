import { Metadata } from 'next';
import WishlistClient from './WishlistClient';
import Navbar from '@/components/Navbar';
import CartDrawer from '@/components/CartDrawer';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Wishlist — GODSMOVE',
  description: 'Pieces worth claiming.',
};

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
