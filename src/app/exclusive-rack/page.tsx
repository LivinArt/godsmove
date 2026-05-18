import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import ExclusiveRack, { type ExclusiveRackProduct } from '@/components/ExclusiveRack';
import { getStorefrontProducts } from '@/actions/storefront.actions';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Exclusive Rack — GODSMOVE',
  description: 'The permanent archive of curated GODSMOVE artifacts.',
};

export default async function ExclusiveRackPage() {
  const products = await getStorefrontProducts({ channel: 'EXCLUSIVE_RACK' });

  return (
    <>
      <Navbar />
      <CartDrawer />

      <main className={styles.page}>
        {products.length > 0 ? (
          <ExclusiveRack products={products as unknown as ExclusiveRackProduct[]} />
        ) : (
          <div className={`container ${styles.empty}`}>
            <p className={styles.emptyText}>The archive is currently sealed.</p>
            <Link href="/" className="btn btn-secondary">
              Return Home
              <ArrowRight size={14} />
            </Link>
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}
