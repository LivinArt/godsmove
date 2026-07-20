import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import ExclusiveRack, { type ExclusiveRackProduct } from '@/components/ExclusiveRack';
import ProductCard from '@/components/ProductCard';
import { getStorefrontProducts } from '@/actions/storefront.actions';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Exclusive Rack — GODSMOVE',
  description: 'The permanent archive of curated GODSMOVE artifacts. Rare pieces built with intent, allocated to those who understand them.',
};

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

  // First product goes into the hero ExclusiveRack carousel
  const heroProducts = products.slice(0, 3);
  // Remaining products rendered as a catalogue grid
  const gridProducts = products.slice(3);

  return (
    <>
      <Navbar />
      <CartDrawer />

      <main className={styles.page}>
        {products.length > 0 ? (
          <>
            {/* Hero: ExclusiveRack editorial carousel */}
            <ExclusiveRack products={heroProducts as unknown as ExclusiveRackProduct[]} />

            {/* Grid: Remaining exclusive pieces */}
            {gridProducts.length > 0 && (
              <section className={styles.gridSection}>
                <div className="container">
                  <div className={styles.gridHeader}>
                    <span className={styles.gridLabel}>The Archive</span>
                    <h2 className={styles.gridTitle}>Every Piece. Selected with Intent.</h2>
                    <p className={styles.gridDesc}>
                      Each entry carries weight. Nothing here is accidental.
                    </p>
                  </div>
                  <div className={styles.grid}>
                    {gridProducts.map((product) => (
                      <div key={product.id} className={styles.gridItem}>
                        <ProductCard product={product as any} theme="dark" />
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}
          </>
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
