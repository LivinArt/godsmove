import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import ExclusiveRackClient from './ExclusiveRackClient';
import { getStorefrontProducts } from '@/actions/storefront.actions';
import { constructMetadata } from '@/lib/seo-metadata';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = constructMetadata({
  title: 'Exclusive Collection | Curated Apparel | GODSMOVE',
  description: 'Explore GODSMOVE Exclusive Rack. Curated limited edition clothing, premium statement pieces, and distinctive apparel crafted in India.',
  path: '/exclusive-rack',
  keywords: ['exclusive rack', 'GODSMOVE vault', 'curated apparel', 'distinctive clothing India', 'premium clothing online'],
});

export default async function ExclusiveRackPage() {
  // Query by the isExclusiveRack PIM flag (set in Admin Merchandising tab)
  // Also fetch channel-tagged products as a fallback
  const [rackProducts, channelProducts] = await Promise.all([
    getStorefrontProducts({ isExclusiveRack: true }),
    getStorefrontProducts({ channel: 'EXCLUSIVE_RACK' }),
  ]);

  // Merge and deduplicate by id
  const seen = new Set<string>();
  const products = [...rackProducts, ...channelProducts].filter((p) => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });

  return (
    <>
      <Navbar />
      <CartDrawer />

      <main className={styles.page}>
        {products.length > 0 ? (
          <ExclusiveRackClient products={products} />
        ) : (
          <div className={`container ${styles.empty}`}>
            <span className={styles.emptyLabel}>EXCLUSIVE RACK</span>
            <p className={styles.emptyTitle}>The Archive Is Sealed.</p>
            <p className={styles.emptyText}>
              No pieces have been curated for this space yet.<br />
              Check back soon — or explore what&apos;s currently available.
            </p>
            <Link href="/drops" className="btn btn-secondary">
              Explore Drops
              <ArrowRight size={14} />
            </Link>
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}
