'use client';

import { useEffect, useState } from 'react';
import { getStorefrontProducts } from '@/actions/storefront.actions';
import ProductCard from './ProductCard';
import styles from './RecentlyViewed.module.css';

export default function RecentlyViewed() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRecentlyViewed() {
      try {
        const stored = localStorage.getItem('gm_recently_viewed');
        if (stored) {
          const ids = JSON.parse(stored);
          if (Array.isArray(ids) && ids.length > 0) {
            const res = await getStorefrontProducts({ ids: ids.slice(0, 4) });
            setProducts(res);
          }
        }
      } catch (e) {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    loadRecentlyViewed();
  }, []);

  if (loading || products.length === 0) return null;

  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.header}>
          <span className="caption">Memory</span>
          <h2 className={styles.title}>Recently Viewed</h2>
        </div>
        <div className={styles.grid}>
          {products.map((p, idx) => (
            <ProductCard key={p.id} product={p} index={idx} />
          ))}
        </div>
      </div>
    </section>
  );
}
