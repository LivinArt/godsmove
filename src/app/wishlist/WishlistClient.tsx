'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { getStorefrontProducts } from '@/actions/storefront.actions';
import WishlistCard from '@/components/WishlistCard';
import ProductCard from '@/components/ProductCard';
import QuickViewModal from '@/components/QuickViewModal';
import ScrollReveal from '@/components/ScrollReveal';
import styles from './WishlistClient.module.css';

export default function WishlistClient() {
  const { wishlist, setWishlist } = useStore();
  const [liveProducts, setLiveProducts] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      try {
        // Fetch recommendations (Latest drops or Editor selection)
        const recData = await getStorefrontProducts({ take: 6 });
        if (isMounted) setRecommendations(recData);

        if (wishlist.length === 0) {
          if (isMounted) setIsLoading(false);
          return;
        }

        const productIds = wishlist.map((item) => item.productId).filter((id): id is string => typeof id === 'string' && id.trim().length > 0);
        if (productIds.length === 0) {
          if (isMounted) setIsLoading(false);
          return;
        }

        const data = await getStorefrontProducts({ ids: productIds });
        
        if (!isMounted) return;

        // Prune the wishlist to remove products that no longer exist or are inactive
        const liveIds = new Set(data.map((p: any) => p.id));
        const validWishlist = wishlist.filter((item) => liveIds.has(item.productId));
        
        if (validWishlist.length !== wishlist.length) {
          setWishlist(validWishlist);
        }

        setLiveProducts(data);
      } catch (error) {
        console.error('Failed to fetch live products for wishlist:', error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [wishlist, setWishlist]);

  const displayItems = wishlist;

  if (!isLoading && displayItems.length === 0) {
    return (
      <div className={styles.emptyContainer}>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <Heart size={44} strokeWidth={1.5} />
          </div>
          <h1 className={styles.emptyTitle}>Private Archive</h1>
          <p className={styles.emptyText}>Your private collection is waiting to be curated.</p>
          <Link href="/drops" className={styles.exploreBtn}>
            Explore Drops
          </Link>
        </div>

        {/* Symmetrical horizontal recommendation strip below empty state */}
        {recommendations.length > 0 && (
          <div className={styles.recSection}>
            <div className={styles.recHeader}>
              <span className={styles.recEyebrow}>Discovery</span>
              <h2 className={styles.recTitle}>Formulated Archive Selection</h2>
            </div>
            <div className={styles.recScrollContainer}>
              <div className={styles.recRow}>
                {recommendations.map((prod) => (
                  <div key={prod.id} className={styles.recCardWrap}>
                    <ProductCard product={prod} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <ScrollReveal>
          <span className={styles.eyebrow}>Curated Registry</span>
          <h1 className={styles.title}>Private Archive</h1>
          <p className={styles.subtitle} style={{ color: '#c8a46a' }}>Pieces worth returning to.</p>
          <span className={styles.count}>
            {displayItems.length} {displayItems.length === 1 ? 'curated piece' : 'curated pieces'}
          </span>
        </ScrollReveal>
      </header>

      <div className={styles.grid}>
        {displayItems.map((item) => {
          const live = liveProducts.find((p) => p.id === item.productId);
          return (
            <WishlistCard 
              key={item.productId} 
              item={item} 
              liveProduct={live} 
              onQuickView={(prod) => {
                const target = prod || live || {
                  id: item.productId,
                  name: item.name,
                  slug: item.slug,
                  images: item.images,
                  variants: [{ id: 'default', size: 'M', price: item.price, comparePrice: item.comparePrice }],
                };
                setSelectedProduct(target);
              }}
            />
          );
        })}
      </div>

      <QuickViewModal
        product={selectedProduct}
        isOpen={Boolean(selectedProduct)}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  );
}
