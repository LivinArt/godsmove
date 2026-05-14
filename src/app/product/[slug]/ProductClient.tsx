'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, ChevronDown } from 'lucide-react';
import SizeSelector from '@/components/SizeSelector';
import ImageGallery from '@/components/ImageGallery';
import QuantitySelector from '@/components/QuantitySelector';
import { useStore } from '@/store/useStore';
import styles from './page.module.css';

export default function ProductClient({ product, availableSizes }: { product: any, availableSizes: { label: string, available: boolean }[] }) {
  const router = useRouter();
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [sizeError, setSizeError] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const { addToCart, setInstantCheckout, toggleWishlist, isInWishlist } = useStore();
  const wishlisted = isInWishlist(product.id);

  const baseVariant = product.variants?.[0];
  const price = baseVariant?.price ? Number(baseVariant.price) : 0;
  const comparePrice = baseVariant?.comparePrice ? Number(baseVariant.comparePrice) : null;
  const colorName = baseVariant?.color || 'Standard';

  const hasDiscount = comparePrice && comparePrice > price;
  const discountPercent = hasDiscount ? Math.round(((comparePrice - price) / comparePrice) * 100) : 0;
  const savingsAmount = hasDiscount ? comparePrice - price : 0;

  // Calculate available stock for the selected variant, or default to overall max
  const selectedVariantData = product.variants?.find((v: any) => v.size === selectedSize);
  const availableStock = selectedVariantData?.inventory 
    ? selectedVariantData.inventory.totalStock - selectedVariantData.inventory.soldStock - selectedVariantData.inventory.reservedStock 
    : 99;

  // Split details from symbolism or use full description
  const detailsArray = product.symbolism ? product.symbolism.split('.').filter((s: string) => s.trim()) : [];
  if (detailsArray.length === 0) detailsArray.push('100% premium materials', 'Designed in-house');

  const handleAddToCart = () => {
    if (!selectedSize) {
      setSizeError(true);
      return;
    }
    setSizeError(false);
    addToCart(product, selectedSize, quantity);
  };

  const handleBuyNow = () => {
    if (!selectedSize) {
      setSizeError(true);
      return;
    }
    setSizeError(false);
    setInstantCheckout({ product, size: selectedSize, quantity });
    router.push('/checkout');
  };

  return (
    <div className={styles.layout}>
      {/* Image Gallery */}
      <div className={styles.gallery}>
        <ImageGallery 
          images={product.images?.map((i: any) => i.url) || ['/placeholder.png']} 
          alt={product.name} 
          enableToggle={product.enableImageToggle}
          frontImage={product.frontImageUrl}
          backImage={product.backImageUrl}
          defaultSide={product.defaultImageSide}
        />
      </div>

      {/* Product Info */}
      <div className={styles.info}>
        <div className={styles.infoTop}>
          <span className="caption">{product.drop?.name || 'Permanent Collection'}</span>
          <h1 className={styles.name}>{product.name}</h1>
          
          <div className={styles.priceRow}>
            {hasDiscount && (
              <span className={styles.comparePrice}>₹{comparePrice.toLocaleString('en-IN')}</span>
            )}
            <span className={styles.price}>₹{price.toLocaleString('en-IN')}</span>
          </div>
          {hasDiscount && (
            <div className={styles.discountBadge}>
              <span className={styles.percentOff}>{discountPercent}% OFF</span>
              <span className={styles.savings}>You save ₹{savingsAmount.toLocaleString('en-IN')}</span>
            </div>
          )}
          
          <p className={styles.color}>{colorName}</p>
        </div>

        <div className={styles.sizeWrap}>
          <SizeSelector
            sizes={availableSizes}
            selected={selectedSize}
            onSelect={(size) => {
              setSelectedSize(size);
              setSizeError(false);
            }}
          />
          {sizeError && (
            <p className={styles.sizeError}>Select a size</p>
          )}
        </div>

        <div className={styles.quantityWrap} style={{ marginBottom: '24px' }}>
          <QuantitySelector
            quantity={quantity}
            onChange={setQuantity}
            max={availableStock}
            isExclusiveRack={product.isExclusiveRack}
          />
        </div>

        <div className={styles.actions}>
          <button
            className={`btn btn-primary ${styles.buyNowBtn}`}
            onClick={handleBuyNow}
            id="buy-now"
          >
            Buy Now
          </button>
          <div className={styles.actionRow}>
            <button
              className={`btn btn-secondary ${styles.addBtn}`}
              onClick={handleAddToCart}
              id="add-to-cart"
            >
              Add to Cart
            </button>
            <button
              className={`${styles.wishBtn} ${wishlisted ? styles.wishlisted : ''}`}
              onClick={() => toggleWishlist(product)}
              aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              id="product-wishlist"
            >
              <Heart size={18} fill={wishlisted ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>

        <div className={styles.trustSignals}>
          <span>Secure Checkout</span>
          <span className={styles.trustDivider}>·</span>
          <span>Free Shipping on orders over ₹1,999</span>
        </div>

        <p className={styles.description}>{product.description}</p>

        {/* Details Accordion */}
        <div className={styles.details}>
          <button
            className={styles.detailsToggle}
            onClick={() => setDetailsOpen(!detailsOpen)}
            aria-expanded={detailsOpen}
            id="product-details-toggle"
          >
            <span>Details & Context</span>
            <ChevronDown
              size={16}
              className={`${styles.detailsIcon} ${detailsOpen ? styles.detailsIconOpen : ''}`}
            />
          </button>
          {detailsOpen && (
            <ul className={styles.detailsList}>
              {detailsArray.map((detail: string, i: number) => (
                <li key={i}>{detail.trim()}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
