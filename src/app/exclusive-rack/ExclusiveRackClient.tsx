'use client';

import { useState, useMemo } from 'react';
import ProductCard from '@/components/ProductCard';
import styles from './page.module.css';

interface ExclusiveRackClientProps {
  products: any[];
}

export default function ExclusiveRackClient({ products }: ExclusiveRackClientProps) {
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);

  // Extract unique collectionNames from all available products
  const uniqueCollections = useMemo(() => {
    const names = new Set<string>();
    products.forEach((p) => {
      if (p.collectionName) {
        names.add(p.collectionName);
      }
    });
    return Array.from(names).sort();
  }, [products]);

  // Filter grid products based on collection selection
  const filteredProducts = useMemo(() => {
    if (!selectedCollection) return products;
    return products.filter((p) => p.collectionName === selectedCollection);
  }, [products, selectedCollection]);

  return (
    <section className={styles.gridSection}>
      <div className="container">
        {/* Editorial header for Exclusive Rack */}
        <div className={styles.gridHeader}>
          <span className={styles.gridLabel}>Exclusive Archive</span>
          <h1 className={styles.gridTitle}>The Exclusive Rack</h1>
          <p className={styles.gridDesc} style={{ color: '#c8a46a', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '11px', fontWeight: 500 }}>
            Reserved for collectors.
          </p>

          {uniqueCollections.length > 0 && (
            <div className={styles.filtersWrapper}>
              <button
                onClick={() => setSelectedCollection(null)}
                className={`${styles.filterBtn} ${!selectedCollection ? styles.filterActive : ''}`}
              >
                All Archive
              </button>
              {uniqueCollections.map((name) => (
                <button
                  key={name}
                  onClick={() => setSelectedCollection(name)}
                  className={`${styles.filterBtn} ${selectedCollection === name ? styles.filterActive : ''}`}
                >
                  {name}
                </button>
              ))}
            </div>
          )}
        </div>

        {filteredProducts.length > 0 ? (
          <div className={styles.grid}>
            {filteredProducts.map((product) => (
              <div key={product.id} className={styles.gridItem}>
                <ProductCard product={product as any} theme="dark" />
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyFilterState}>
            <p className={styles.gridDesc}>No items available in this selection.</p>
          </div>
        )}
      </div>
    </section>
  );
}
