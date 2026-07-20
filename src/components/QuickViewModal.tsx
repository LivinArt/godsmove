'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X, Heart, ShoppingBag } from 'lucide-react';
import { useStore } from '@/store/useStore';
import SizeSelector from './SizeSelector';
import QuantitySelector from './QuantitySelector';
import styles from './QuickViewModal.module.css';

interface QuickViewModalProps {
  product: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function QuickViewModal({ product, isOpen, onClose }: QuickViewModalProps) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [sizeError, setSizeError] = useState(false);
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  const { addToCart, toggleWishlist, isInWishlist, showToast } = useStore();
  const wishlisted = product ? isInWishlist(product.id) : false;

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setSelectedSize(null);
      setQuantity(1);
      setActiveImageIdx(0);
      setSizeError(false);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !product) return null;

  // Resolve sizes
  const allSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'ONE_SIZE'];
  const variants = product.variants || [];
  
  const availableSizes = allSizes.map(sizeLabel => {
    const variant = variants.find((v: any) => v.size === sizeLabel);
    if (!variant) return null;
    const inv = variant.inventory;
    const isAvailable = inv ? (inv.totalStock - inv.reservedStock - inv.soldStock) > 0 : false;
    return {
      label: sizeLabel,
      available: isAvailable
    };
  }).filter(Boolean) as { label: string, available: boolean }[];

  const selectedVariantData = product.variants?.find((v: any) => v.size === selectedSize);
  const availableStock = selectedVariantData?.inventory 
    ? selectedVariantData.inventory.totalStock - selectedVariantData.inventory.soldStock - selectedVariantData.inventory.reservedStock 
    : 99;

  const baseVariant = product.variants?.[0];
  const price = baseVariant?.price ? Number(baseVariant.price) : 0;
  const comparePrice = baseVariant?.comparePrice ? Number(baseVariant.comparePrice) : null;
  const colorName = baseVariant?.color || 'Standard';

  const hasDiscount = comparePrice != null && comparePrice > price && price > 0;
  const discountPercent = hasDiscount ? Math.round(((comparePrice - price) / comparePrice) * 100) : 0;

  const handleAddToBag = () => {
    if (!selectedSize) {
      setSizeError(true);
      return;
    }
    addToCart(product, selectedSize, quantity);
    showToast('Added to Bag', `${product.name} (Size ${selectedSize}) has been added to your bag.`);
    onClose();
  };

  const images = product.images?.map((i: any) => i.url) || [product.frontImageUrl || '/placeholder.png'];

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
          <X size={20} />
        </button>

        <div className={styles.grid}>
          {/* Left Pane: Image Gallery */}
          <div className={styles.galleryZone}>
            <div className={styles.mainImageWrap}>
              <Image
                src={images[activeImageIdx] || '/placeholder.png'}
                alt={product.name}
                fill
                className={styles.mainImg}
                priority
              />
            </div>
            {images.length > 1 && (
              <div className={styles.thumbnails}>
                {images.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    className={`${styles.thumbBtn} ${idx === activeImageIdx ? styles.thumbActive : ''}`}
                    onClick={() => setActiveImageIdx(idx)}
                  >
                    <Image src={img} alt="" width={60} height={75} className={styles.thumbImg} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Pane: Purchase and Story Details */}
          <div className={styles.detailsZone}>
            <span className={styles.eyebrow}>
              {product.channel?.replace('_', ' ') || 'Collection'}
            </span>
            <h2 className={styles.title}>{product.name}</h2>

            <div className={styles.priceRow}>
              {hasDiscount && <span className={styles.comparePrice}>₹{comparePrice.toLocaleString('en-IN')}</span>}
              <span className={styles.price}>₹{price.toLocaleString('en-IN')}</span>
              {hasDiscount && <span className={styles.discountTag}>{discountPercent}% OFF</span>}
            </div>

            <p className={styles.colorLabel}>Colour: <strong>{colorName}</strong></p>

            {/* Sizes */}
            <div className={styles.sizeSection}>
              <SizeSelector
                sizes={availableSizes}
                selected={selectedSize}
                onSelect={(size) => {
                  setSelectedSize(size);
                  setSizeError(false);
                }}
              />
              {sizeError && <p className={styles.error}>Select a size to proceed</p>}
            </div>

            {/* Qty */}
            <div className={styles.qtySection}>
              <span className={styles.qtyLabel}>Quantity</span>
              <QuantitySelector
                quantity={quantity}
                onChange={setQuantity}
                max={availableStock}
              />
            </div>

            {/* Action Buttons */}
            <div className={styles.actions}>
              <button className="btn btn-primary" onClick={handleAddToBag} style={{ flex: 1 }}>
                <ShoppingBag size={16} style={{ marginRight: 8 }} />
                Add to Bag
              </button>
              <button
                className={`${styles.wishBtn} ${wishlisted ? styles.wishlisted : ''}`}
                onClick={() => toggleWishlist(product)}
                aria-label="Toggle Wishlist"
              >
                <Heart size={18} fill={wishlisted ? 'currentColor' : 'none'} />
              </button>
            </div>

            <div className={styles.divider} />

            {/* Brand Narrative Story */}
            <div className={styles.storySection}>
              <h3 className={styles.storyHeader}>The Story</h3>
              <p className={styles.storyText}>
                {product.whyWeMadeThis || product.exclusiveStory || product.description || 'Thoughtfully constructed and designed to become a timeless part of your collection.'}
              </p>
            </div>

            <Link href={`/product/${product.slug}`} className={styles.viewFullLink} onClick={onClose}>
              View Full Ownership Details
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
