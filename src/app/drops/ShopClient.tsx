'use client';

import { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductCard from '@/components/ProductCard';
import ScrollReveal from '@/components/ScrollReveal';
import styles from './page.module.css';

type SortOption = 'newest' | 'price-low' | 'price-high';

export default function ShopClient({ initialProducts, drops, categories }: { initialProducts: any[], drops: any[], categories: any[] }) {
  const searchParams = useSearchParams();
  const collectionFilter = searchParams.get('collection');

  const [sort, setSort] = useState<SortOption>('newest');
  const [activeCollection, setActiveCollection] = useState<string | null>(collectionFilter);

  // We extract unique collections based on drops and categories present in the products, 
  // or just use the drop names for filtering
  const collections = useMemo(() => {
    const activeDrops = [...new Set(initialProducts.map((p) => p.drop?.name).filter(Boolean))];
    return activeDrops;
  }, [initialProducts]);

  const filtered = useMemo(() => {
    let result = [...initialProducts];
    if (activeCollection) {
      result = result.filter((p) => {
        const pCollection = p.drop?.name || '';
        return pCollection.toLowerCase().replace(/\s/g, '-') === activeCollection || pCollection === activeCollection;
      });
    }
    switch (sort) {
      case 'price-low':
        result.sort((a, b) => {
          const priceA = a.variants?.[0]?.price ? Number(a.variants[0].price) : 0;
          const priceB = b.variants?.[0]?.price ? Number(b.variants[0].price) : 0;
          return priceA - priceB;
        });
        break;
      case 'price-high':
        result.sort((a, b) => {
          const priceA = a.variants?.[0]?.price ? Number(a.variants[0].price) : 0;
          const priceB = b.variants?.[0]?.price ? Number(b.variants[0].price) : 0;
          return priceB - priceA;
        });
        break;
      default:
        // newest
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }
    return result;
  }, [sort, activeCollection, initialProducts]);

  return (
    <>
      <ScrollReveal>
        <div className={styles.header}>
          <h1 className="h1">Shop</h1>
          <p className={styles.count}>{filtered.length} {filtered.length === 1 ? 'piece' : 'pieces'}</p>
        </div>
      </ScrollReveal>

      <div className={styles.controls}>
        <div className={styles.filters}>
          <button
            className={`${styles.filterBtn} ${!activeCollection ? styles.filterActive : ''}`}
            onClick={() => setActiveCollection(null)}
          >
            All
          </button>
          {collections.map((col: string) => (
            <button
              key={col}
              className={`${styles.filterBtn} ${activeCollection === col ? styles.filterActive : ''}`}
              onClick={() => setActiveCollection(activeCollection === col ? null : col)}
            >
              {col}
            </button>
          ))}
        </div>
        <select
          className={styles.sort}
          value={sort}
          onChange={(e) => setSort(e.target.value as SortOption)}
          id="shop-sort"
          aria-label="Sort products"
        >
          <option value="newest">Newest</option>
          <option value="price-low">Price: Low → High</option>
          <option value="price-high">Price: High → Low</option>
        </select>
      </div>

      <div className={styles.grid}>
        {filtered.map((product, i) => (
          <ProductCard key={product.id} product={product} index={i} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className={styles.empty}>
          <p>No pieces match your selection.</p>
        </div>
      )}
    </>
  );
}
