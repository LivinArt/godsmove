import { Metadata } from 'next';
import WishlistClient from './WishlistClient';

export const metadata: Metadata = {
  title: 'Wishlist — GODSMOVE',
  description: 'Pieces worth claiming.',
};

export default function WishlistPage() {
  return (
    <main style={{ minHeight: '100vh', paddingTop: 'var(--nav-height, 80px)' }}>
      <WishlistClient />
    </main>
  );
}
