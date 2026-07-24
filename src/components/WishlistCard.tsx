'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X, ShoppingBag, Eye } from 'lucide-react';
import { useStore, WishlistItem } from '@/store/useStore';
import { resolveProductImages, resolveImageUrl } from '@/lib/image-resolver';
import MobileQuickAddSheet from '@/components/MobileQuickAddSheet';
import styles from './WishlistCard.module.css';

interface WishlistCardProps {
  item: WishlistItem;
  liveProduct?: any;
  onQuickView: (product: any) => void;
}

export default function WishlistCard({ item, liveProduct, onQuickView }: WishlistCardProps) {
  const { removeFromWishlist, addToCart } = useStore();
  const [sizePickerOpen, setSizePickerOpen] = useState(false);

  const name = liveProduct?.name || item.name;
  const slug = liveProduct?.slug || item.slug;
  const collectionName = liveProduct?.collectionName || liveProduct?.category?.name || 'Archival Edition';
  
  const { frontImage } = resolveProductImages(liveProduct);
  const imageUrl = liveProduct ? frontImage : resolveImageUrl(item.images?.[0]);

  // Pricing
  const baseVariant = liveProduct?.variants?.[0];
  const price = baseVariant?.price ? Number(baseVariant.price) : item.price;
  const comparePrice = baseVariant?.comparePrice ? Number(baseVariant.comparePrice) : item.comparePrice;
  const hasDiscount = comparePrice && comparePrice > price;
  const discountPercent = hasDiscount ? Math.round(((comparePrice - price) / comparePrice) * 100) : 0;

  // Inventory availability indicator
  const totalStock = liveProduct?.variants?.reduce((sum: number, v: any) => {
    const inv = v.inventory;
    return sum + (inv ? inv.totalStock - inv.soldStock - inv.reservedStock : 0);
  }, 0) ?? 0;
  
  const isAvailable = totalStock > 0;

  const cardSizes = liveProduct?.variants?.map((v: any) => {
    const inv = v.inventory;
    const avail = inv ? (inv.totalStock - inv.soldStock - inv.reservedStock) > 0 : true;
    return { size: v.size, available: avail };
  }) || [];

  const handleMoveToCart = () => {
    if (!liveProduct) return;
    const activeVariants = cardSizes.filter((s: any) => s.available);
    
    if (activeVariants.length === 1) {
      addToCart(liveProduct, activeVariants[0].size, 1);
      removeFromWishlist(item.productId);
    } else {
      // Present size selection bottom sheet directly without opening QuickView modal
      setSizePickerOpen(true);
    }
  };

  return (
    <div className={styles.card}>
      {/* Top right remove action */}
      <button 
        className={styles.removeBtn}
        onClick={() => removeFromWishlist(item.productId)}
        aria-label="Remove from curated archive"
      >
        <X size={14} />
      </button>

      {/* Main image link (fixed 4/5 aspect ratio) */}
      <Link href={`/product/${slug}`} className={styles.imageWrap}>
        <Image 
          src={imageUrl} 
          alt={name} 
          fill 
          sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 25vw"
          className={styles.image}
        />
      </Link>

      {/* Details block */}
      <div className={styles.info}>
        <span className={styles.collection}>{collectionName}</span>
        <Link href={`/product/${slug}`} className={styles.name}>
          {name}
        </Link>

        <div className={styles.metaRow}>
          <div className={styles.priceRow}>
            {hasDiscount && (
              <span className={styles.comparePrice}>₹{comparePrice.toLocaleString('en-IN')}</span>
            )}
            <span className={styles.price}>₹{price.toLocaleString('en-IN')}</span>
            {hasDiscount && (
              <span className={styles.discountBadge}>{discountPercent}% OFF</span>
            )}
          </div>

          {/* Symmetrical availability indicator */}
          <div className={styles.availability}>
            <span className={`${styles.statusDot} ${isAvailable ? styles.availableDot : styles.sealedDot}`} />
            <span className={styles.statusText}>
              {isAvailable ? 'Allocation Active' : 'Allocation Sealed'}
            </span>
          </div>
        </div>

        {/* Symmetrical CTA stack */}
        <div className={styles.actions}>
          <button 
            className={styles.cartBtn}
            onClick={handleMoveToCart}
            disabled={!liveProduct}
          >
            <ShoppingBag size={13} style={{ marginRight: 6 }} /> Move to Bag
          </button>
          <button 
            className={styles.quickViewBtn}
            onClick={() => onQuickView(liveProduct)}
            disabled={!liveProduct}
          >
            <Eye size={13} style={{ marginRight: 6 }} /> Quick View
          </button>
        </div>
      </div>

      <MobileQuickAddSheet
        isOpen={sizePickerOpen}
        onClose={() => setSizePickerOpen(false)}
        productName={name}
        sizes={cardSizes}
        addingSize={null}
        onAddSize={(size) => {
          if (liveProduct) {
            addToCart(liveProduct, size, 1);
            removeFromWishlist(item.productId);
          }
          setSizePickerOpen(false);
        }}
      />
    </div>
  );
}
