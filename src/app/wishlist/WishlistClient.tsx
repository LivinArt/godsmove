'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { getStorefrontProducts } from '@/actions/storefront.actions';
import WishlistCard from '@/components/WishlistCard';
import styles from './WishlistClient.module.css';

export default function WishlistClient() {
  const { wishlist, setWishlist } = useStore();
  const [liveProducts, setLiveProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Avoid fetching if wishlist is empty
    if (wishlist.length === 0) {
      setIsLoading(false);
      setLiveProducts([]);
      return;
    }

    let isMounted = true;

    async function fetchLiveProducts() {
      try {
        const productIds = wishlist.map((item) => item.productId);
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

    fetchLiveProducts();

    return () => {
      isMounted = false;
    };
  }, [wishlist, setWishlist]); // Note: depending on wishlist might cause re-fetches if not careful, but setWishlist stabilizes it

  // Determine items to show: while loading, show snapshot. Once loaded, show valid items.
  const displayItems = wishlist;

  if (!isLoading && displayItems.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>
          <Heart size={48} strokeWidth={1} />
        </div>
        <h1 className={styles.emptyTitle}>Your wishlist is empty.</h1>
        <p className={styles.emptyText}>Pieces worth claiming belong here.</p>
        <Link href="/shop" className={styles.exploreBtn}>
          Explore the Collection
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Your Wishlist</h1>
        <p className={styles.subtitle}>Pieces worth claiming.</p>
        <span className={styles.count}>
          {displayItems.length} {displayItems.length === 1 ? 'item' : 'items'}
        </span>
      </header>

      <div className={styles.grid}>
        {displayItems.map((item) => {
          const live = liveProducts.find((p) => p.id === item.productId);
          return (
            <WishlistCard 
              key={item.productId} 
              item={item} 
              liveProduct={live} 
            />
          );
        })}
      </div>
    </div>
  );
}
