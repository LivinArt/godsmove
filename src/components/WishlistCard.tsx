'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { X, ShoppingBag, Zap } from 'lucide-react';
import ImageCarousel from './ImageCarousel';
import QuantitySelector from './QuantitySelector';
import SizeSelector from '@/components/SizeSelector';
import { useStore, WishlistItem } from '@/store/useStore';
import styles from './WishlistCard.module.css';

interface WishlistCardProps {
  item: WishlistItem;
  liveProduct?: any; // The full product object fetched from DB, if available
}

export default function WishlistCard({ item, liveProduct }: WishlistCardProps) {
  const router = useRouter();
  const { removeFromWishlist, addToCart, setInstantCheckout } = useStore();
  
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [sizeError, setSizeError] = useState(false);

  // Use live data if available, fallback to snapshot
  const name = liveProduct?.name || item.name;
  const slug = liveProduct?.slug || item.slug;
  const tagline = liveProduct?.drop?.name || liveProduct?.tagline || item.tagline;
  const images = liveProduct?.images?.map((img: any) => img.url) || item.images;
  
  // Prices
  const baseVariant = liveProduct?.variants?.[0];
  const price = baseVariant?.price ? Number(baseVariant.price) : item.price;
  const comparePrice = baseVariant?.comparePrice ? Number(baseVariant.comparePrice) : item.comparePrice;
  const hasDiscount = comparePrice && comparePrice > price;
  const discountPercent = hasDiscount ? Math.round(((comparePrice - price) / comparePrice) * 100) : 0;

  // Variants & Stock
  const availableSizes = liveProduct?.variants?.filter((v: any) => v.isActive).map((v: any) => {
    const inv = v.inventory;
    const stock = inv ? inv.totalStock - inv.soldStock - inv.reservedStock : 0;
    return { label: v.size, available: stock > 0 };
  }) || [];

  const selectedVariantData = liveProduct?.variants?.find((v: any) => v.size === selectedSize);
  const availableStock = selectedVariantData?.inventory 
    ? selectedVariantData.inventory.totalStock - selectedVariantData.inventory.soldStock - selectedVariantData.inventory.reservedStock 
    : 99;

  const handleMoveToCart = () => {
    if (availableSizes.length > 0 && !selectedSize) {
      setSizeError(true);
      return;
    }
    setSizeError(false);
    
    // We must have a live product to add to cart properly (since cart relies on full product data)
    if (liveProduct) {
      addToCart(liveProduct, selectedSize || 'ONE_SIZE', quantity);
      removeFromWishlist(item.productId);
    }
  };

  const handleBuyNow = () => {
    if (availableSizes.length > 0 && !selectedSize) {
      setSizeError(true);
      return;
    }
    setSizeError(false);
    
    if (liveProduct) {
      setInstantCheckout({ product: liveProduct, size: selectedSize || 'ONE_SIZE', quantity });
      router.push('/checkout');
    }
  };

  return (
    <div className={styles.card}>
      <button 
        className={styles.removeBtn}
        onClick={() => removeFromWishlist(item.productId)}
        aria-label="Remove from wishlist"
      >
        <X size={16} />
      </button>

      <Link href={`/product/${slug}`} className={styles.imageLink}>
        <ImageCarousel images={images} alt={name} />
      </Link>

      <div className={styles.info}>
        {tagline && <span className={styles.tagline}>{tagline}</span>}
        <Link href={`/product/${slug}`} className={styles.name}>
          {name}
        </Link>

        <div className={styles.priceRow}>
          {hasDiscount && (
            <span className={styles.comparePrice}>₹{comparePrice.toLocaleString('en-IN')}</span>
          )}
          <span className={styles.price}>₹{price.toLocaleString('en-IN')}</span>
          {hasDiscount && (
            <span className={styles.discountBadge}>{discountPercent}% OFF</span>
          )}
        </div>

        {/* Controls */}
        <div className={styles.controls}>
          {availableSizes.length > 0 && (
            <div className={styles.sizeWrap}>
              <SizeSelector
                sizes={availableSizes}
                selected={selectedSize}
                onSelect={(size) => {
                  setSelectedSize(size);
                  setSizeError(false);
                }}
              />
              {sizeError && <span className={styles.errorText}>Select a size</span>}
            </div>
          )}

          <div className={styles.quantityWrap}>
            <QuantitySelector
              quantity={quantity}
              onChange={setQuantity}
              max={availableStock}
              isExclusive={liveProduct?.channel === 'EXCLUSIVE_RACK' || liveProduct?.channel === 'EXCLUSIVE_UNLOCK'}
            />
          </div>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <button 
            className={styles.buyNowBtn}
            onClick={handleBuyNow}
            disabled={!liveProduct}
          >
            <Zap size={14} /> Buy Now
          </button>
          <button 
            className={styles.cartBtn}
            onClick={handleMoveToCart}
            disabled={!liveProduct}
          >
            <ShoppingBag size={14} /> Move to Cart
          </button>
        </div>
      </div>
    </div>
  );
}
