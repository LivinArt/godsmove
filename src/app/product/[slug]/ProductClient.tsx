'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Heart, 
  ShoppingBag, 
  Compass, 
  Layers, 
  Scissors, 
  Cpu, 
  ShieldCheck, 
  Package, 
  ArrowLeftRight, 
  Share2, 
  Star,
  CheckCircle2,
  Lock,
  Minus,
  Plus
} from 'lucide-react';
import SizeSelector from '@/components/SizeSelector';
import ImageGallery from '@/components/ImageGallery';
import QuantitySelector from '@/components/QuantitySelector';
import RecentlyViewed from '@/components/RecentlyViewed';
import { useStore } from '@/store/useStore';
import styles from './page.module.css';

export default function ProductClient({
  product,
  availableSizes,
  coverImage,
  profile,
}: {
  product: any;
  availableSizes: { label: string; available: boolean }[];
  coverImage?: string | null;
  profile?: any;
}) {
  const router = useRouter();
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [sizeError, setSizeError] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [copiedShare, setCopiedShare] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('gm_recently_viewed');
      let ids = stored ? JSON.parse(stored) : [];
      if (!Array.isArray(ids)) ids = [];
      ids = [product.id, ...ids.filter((id: string) => id !== product.id)];
      localStorage.setItem('gm_recently_viewed', JSON.stringify(ids.slice(0, 8)));
    } catch (e) {
      // ignore
    }
  }, [product.id]);

  const { addToCart, setInstantCheckout, toggleWishlist, isInWishlist, toggleCompare, isInCompare, showToast } = useStore();
  const wishlisted = isInWishlist(product.id);
  const inCompare = isInCompare(product.id);

  const selectedVariantData = product.variants?.find((v: any) => v.size === selectedSize);
  const baseVariant = product.variants?.[0];
  const price = baseVariant?.price ? Number(baseVariant.price) : 0;
  const comparePrice = baseVariant?.comparePrice ? Number(baseVariant.comparePrice) : null;
  const colorName = baseVariant?.color || 'Standard';

  const hasDiscount = comparePrice != null && comparePrice > price && price > 0;
  const discountPercent = hasDiscount ? Math.round(((comparePrice - price) / comparePrice) * 100) : 0;

  const availableStock = selectedVariantData?.inventory 
    ? selectedVariantData.inventory.totalStock - selectedVariantData.inventory.soldStock - selectedVariantData.inventory.reservedStock 
    : 99;

  const handleAddToCart = () => {
    if (!selectedSize) {
      setSizeError(true);
      return;
    }
    setSizeError(false);
    addToCart(product, selectedSize, quantity);
    // Note: The global store handleAddToCart will handle loading and sliding in the cart drawer. No toast confirmation will be shown as the drawer confirms the add.
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

  const handleShare = () => {
    try {
      navigator.clipboard.writeText(window.location.href);
      setCopiedShare(true);
      showToast('Link Copied', 'Product link copied to clipboard.');
      setTimeout(() => setCopiedShare(false), 2000);
    } catch (e) {}
  };

  // Safe Metadata helper
  const getMetadataVal = (key: string, fallback: string = '') => {
    if (product.metadata && typeof product.metadata === 'object') {
      return (product.metadata as any)[key] || fallback;
    }
    return fallback;
  };

  return (
    <div className={styles.pdpContainer}>
      
      {/* ==================================================
          SECTION 1: PRODUCT HERO
          ================================================== */}
      <div className={styles.heroLayout}>
        {/* Left (60%): Large Product Gallery */}
        <div className={styles.galleryCol}>
          <ImageGallery
            images={product.images?.map((i: any) => i.url) || ['/placeholder.png']}
            alt={product.name}
            enableToggle={product.enableImageToggle}
            frontImage={product.frontImageUrl}
            backImage={product.backImageUrl}
            defaultSide={product.defaultImageSide}
          />
        </div>

        {/* Right (40%): Product Information Buy Box */}
        <div className={styles.buyBoxCol}>
          <div className={styles.stickyBuyBox}>
            
            {/* Collection Title */}
            <span className={styles.heroCollection}>
              {product.collectionName || product.category?.name || 'Archival Edition'}
            </span>

            {/* Product Name */}
            <h1 className={styles.heroName}>{product.name}</h1>

            {/* Badges Stack */}
            <div className={styles.heroBadges}>
              {product.isExclusiveRack && (
                <span className={styles.exclusiveBadge}>Vault Edition</span>
              )}
              {product.featuredBadge && (
                <span className={styles.featuredBadge}>{product.featuredBadge}</span>
              )}
              {product.channel === 'EXCLUSIVE_UNLOCK' && (
                <span className={styles.unlockBadge}>Private Draw allocation</span>
              )}
            </div>

            {/* Price Block */}
            <div className={styles.heroPriceRow}>
              {hasDiscount && comparePrice && (
                <span className={styles.heroComparePrice}>₹{comparePrice.toLocaleString('en-IN')}</span>
              )}
              <span className={styles.heroPrice}>₹{price.toLocaleString('en-IN')}</span>
              {hasDiscount && (
                <span className={styles.heroDiscountBadge}>{discountPercent}% OFF</span>
              )}
            </div>

            <div className={styles.heroDivider} />

            {/* Availability */}
            <div className={styles.heroAvailability}>
              <span className={styles.availabilityDot} />
              <span className={styles.availabilityText}>
                {availableStock === 0 
                  ? 'Sold Out' 
                  : availableStock <= 5 
                    ? `Limited Allocation — Only ${availableStock} pieces remain` 
                    : 'Allocations Available'}
              </span>
            </div>

            {/* Short Description */}
            <p className={styles.heroShortDesc}>
              {product.shortDesc || 'Timeless silhouette engineered to preserve structure and hold confidence.'}
            </p>

            {/* Size Selector */}
            <div className={styles.heroSizesWrap}>
              <span className={styles.sectionLabel}>Select Size</span>
              <SizeSelector
                sizes={availableSizes}
                selected={selectedSize}
                onSelect={(size) => {
                  setSelectedSize(size);
                  setSizeError(false);
                }}
              />
              {sizeError && (
                <p className={styles.sizeError}>Select a size to verify custody allocation</p>
              )}
            </div>

            {/* Quantity Selector */}
            <div className={styles.heroQuantityWrap}>
              <span className={styles.sectionLabel}>Allocation Count</span>
              <QuantitySelector
                quantity={quantity}
                onChange={setQuantity}
                max={availableStock}
              />
            </div>

            {/* CTA Stack */}
            <div className={styles.heroActions}>
              <button
                className={styles.buyNowBtn}
                onClick={handleBuyNow}
                id="pdp-buy-now"
                disabled={availableStock === 0}
              >
                Buy Now
              </button>
              
              <button
                className={styles.addToBagBtn}
                onClick={handleAddToCart}
                id="pdp-add-to-bag"
                disabled={availableStock === 0}
              >
                <ShoppingBag size={14} style={{ marginRight: 8 }} />
                Add to Bag
              </button>

              <div className={styles.utilitySquareActions}>
                <button
                  className={`${styles.squareActionBtn} ${wishlisted ? styles.wishlisted : ''}`}
                  onClick={() => toggleWishlist(product)}
                  aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                  id="pdp-wishlist"
                >
                  <Heart size={16} fill={wishlisted ? 'currentColor' : 'none'} />
                </button>

                <button
                  className={`${styles.squareActionBtn} ${inCompare ? styles.inCompare : ''}`}
                  onClick={() => toggleCompare(product)}
                  aria-label={inCompare ? 'Remove from comparison' : 'Add to comparison'}
                  id="pdp-compare"
                >
                  <ArrowLeftRight size={16} />
                </button>

                <button
                  className={styles.squareActionBtn}
                  onClick={handleShare}
                  aria-label="Share product link"
                  id="pdp-share"
                >
                  <Share2 size={16} />
                </button>
              </div>
            </div>

            {/* GM Passport Preview */}
            <div className={styles.passportPreviewBlock}>
              <span className={styles.passportPreviewLabel}>AUTHENTICITY ASSURED</span>
              <p className={styles.passportPreviewId}>Registered Passport: <strong>GMP-{product.id.substring(0, 8).toUpperCase()}</strong></p>
            </div>

          </div>
        </div>
      </div>

      {/* ==================================================
          SECTION 2: WHY WE MADE THIS
          ================================================== */}
      {product.whyWeMadeThis && (
        <section className={styles.storySection}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionEyebrow}>Narrative</span>
            <h2 className={styles.sectionHeadline}>Why We Made This</h2>
          </div>
          <p className={styles.storyBodyText}>
            {product.whyWeMadeThis}
          </p>
        </section>
      )}

      {/* ==================================================
          SECTION 3: BACKSTORY NARRATIVE
          ================================================== */}
      {product.description && (
        <section className={styles.storySection}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionEyebrow}>Backstory</span>
            <h2 className={styles.sectionHeadline}>Backstory Narrative</h2>
          </div>
          <p className={styles.storyBodyText}>
            {product.description}
          </p>
        </section>
      )}

      {/* ==================================================
          SECTION 4: CRAFTSMANSHIP
          ================================================== */}
      {(product.fabricWhy || product.constructionWhy || product.printWhy) && (
        <section className={styles.craftSection}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionEyebrow}>Sourcing</span>
            <h2 className={styles.sectionHeadline}>Craftsmanship</h2>
          </div>
          <div className={styles.craftGrid}>
            {product.fabricWhy && (
              <div className={styles.craftCard}>
                <h3 className={styles.craftCardTitle}>{product.fabricName || 'Textiles Sourcing'}</h3>
                <p className={styles.craftCardText}>{product.fabricWhy}</p>
              </div>
            )}
            {product.constructionWhy && (
              <div className={styles.craftCard}>
                <h3 className={styles.craftCardTitle}>{product.constructionName || 'Tailored Construction'}</h3>
                <p className={styles.craftCardText}>{product.constructionWhy}</p>
              </div>
            )}
            {product.printWhy && (
              <div className={styles.craftCard}>
                <h3 className={styles.craftCardTitle}>{product.printName || 'Artwork / Details'}</h3>
                <p className={styles.craftCardText}>{product.printWhy}</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ==================================================
          SECTION 5: FABRIC & MATERIAL
          ================================================== */}
      <section className={styles.fabricSection}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionEyebrow}>Textile Profile</span>
          <h2 className={styles.sectionHeadline}>Fabric & Material</h2>
        </div>
        <div className={styles.twoColSpecs}>
          <div className={styles.specColumn}>
            <div className={styles.specRowItem}>
              <span className={styles.specRowLabel}>Material Blend</span>
              <span className={styles.specRowValue}>{product.material || '100% Long-staple Combed Cotton'}</span>
            </div>
            <div className={styles.specRowItem}>
              <span className={styles.specRowLabel}>Weight / GSM</span>
              <span className={styles.specRowValue}>{getMetadataVal('gsm', '450 GSM Heavy French Terry')}</span>
            </div>
            <div className={styles.specRowItem}>
              <span className={styles.specRowLabel}>Texture Blend</span>
              <span className={styles.specRowValue}>{getMetadataVal('texture', 'Diagonal Fleece Loopback')}</span>
            </div>
          </div>
          <div className={styles.specColumn}>
            <div className={styles.specRowItem}>
              <span className={styles.specRowLabel}>Stretch Index</span>
              <span className={styles.specRowValue}>{getMetadataVal('stretch', 'Low (Form-retaining rib trim)')}</span>
            </div>
            <div className={styles.specRowItem}>
              <span className={styles.specRowLabel}>Transparency</span>
              <span className={styles.specRowValue}>{getMetadataVal('transparency', '100% Opaque')}</span>
            </div>
            <div className={styles.specRowItem}>
              <span className={styles.specRowLabel}>Sourcing Origin</span>
              <span className={styles.specRowValue}>{product.origin || 'Studio Sourced'}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          SECTION 6: SILHOUETTE & FIT
          ================================================== */}
      <section className={styles.fitSection}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionEyebrow}>Drape & Posture</span>
          <h2 className={styles.sectionHeadline}>Silhouette & Fit</h2>
        </div>
        <div className={styles.twoColSpecs}>
          <div className={styles.specColumn}>
            <div className={styles.specRowItem}>
              <span className={styles.specRowLabel}>Silhouette Style</span>
              <span className={styles.specRowValue}>{product.fit || 'Engineered Relaxed Silhouette'}</span>
            </div>
            <div className={styles.specRowItem}>
              <span className={styles.specRowLabel}>Model Height</span>
              <span className={styles.specRowValue}>{getMetadataVal('modelHeight', "Model is 189cm (6'2\")")}</span>
            </div>
          </div>
          <div className={styles.specColumn}>
            <div className={styles.specRowItem}>
              <span className={styles.specRowLabel}>Model Wearing</span>
              <span className={styles.specRowValue}>{getMetadataVal('modelWearing', 'Size Large (L)')}</span>
            </div>
            <div className={styles.specRowItem}>
              <span className={styles.specRowLabel}>Fit Guidelines</span>
              <span className={styles.specRowValue}>
                {getMetadataVal('fitNotes', 'Designed with dropped shoulder lines and high collar retention to maintain structured posture.')}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          SECTION 7: SPECIFICATIONS
          ================================================== */}
      <section className={styles.technicalSection}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionEyebrow}>Registry</span>
          <h2 className={styles.sectionHeadline}>Specifications</h2>
        </div>
        <div className={styles.compactSpecsCard}>
          <div className={styles.compactSpecsGrid}>
            <div className={styles.compactSpecItem}>
              <span className={styles.compactSpecLabel}>SKU Identification</span>
              <span className={styles.compactSpecValue}>{selectedVariantData?.sku || baseVariant?.sku || 'GMP-SKU-099'}</span>
            </div>
            <div className={styles.compactSpecItem}>
              <span className={styles.compactSpecLabel}>Category Space</span>
              <span className={styles.compactSpecValue}>{product.category?.name || 'Unassigned Catalog'}</span>
            </div>
            <div className={styles.compactSpecItem}>
              <span className={styles.compactSpecLabel}>Collection Group</span>
              <span className={styles.compactSpecValue}>{product.collectionName || 'Archival Series'}</span>
            </div>
            <div className={styles.compactSpecItem}>
              <span className={styles.compactSpecLabel}>Drop Release</span>
              <span className={styles.compactSpecValue}>{product.drop?.name || 'Drop 001'}</span>
            </div>
            <div className={styles.compactSpecItem}>
              <span className={styles.compactSpecLabel}>Color Hex Blend</span>
              <span className={styles.compactSpecValue}>{colorName}</span>
            </div>
            {product.weight && (
              <div className={styles.compactSpecItem}>
                <span className={styles.compactSpecLabel}>Garment Weight</span>
                <span className={styles.compactSpecValue}>{product.weight}g</span>
              </div>
            )}
            <div className={styles.compactSpecItem}>
              <span className={styles.compactSpecLabel}>Country of Origin</span>
              <span className={styles.compactSpecValue}>{product.country || product.origin || 'India'}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          SECTION 8: CARE INSTRUCTIONS
          ================================================== */}
      <section className={styles.careSection}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionEyebrow}>Maintenance</span>
          <h2 className={styles.sectionHeadline}>Care Instructions</h2>
        </div>
        <div className={styles.careGrid}>
          <div className={styles.careCard}>
            <h4 className={styles.careCardTitle}>Laundry</h4>
            <p className={styles.careCardDesc}>Machine wash cold inside out, delicate cycle.</p>
          </div>
          <div className={styles.careCard}>
            <h4 className={styles.careCardTitle}>Ironing</h4>
            <p className={styles.careCardDesc}>Iron low warmth if necessary. Avoid prints.</p>
          </div>
          <div className={styles.careCard}>
            <h4 className={styles.careCardTitle}>Drying</h4>
            <p className={styles.careCardDesc}>Dry flat. Do not tumble dry to preserve shape.</p>
          </div>
          <div className={styles.careCard}>
            <h4 className={styles.careCardTitle}>Storage</h4>
            <p className={styles.careCardDesc}>Store folded. Hanging heavy garments is not advised.</p>
          </div>
        </div>
      </section>

      {/* ==================================================
          SECTION 9: PACKAGING (OPTIONAL)
          ================================================== */}
      {product.packaging && (
        <section className={styles.packagingSection}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionEyebrow}>Curation</span>
            <h2 className={styles.sectionHeadline}>Packaging</h2>
          </div>
          <div className={styles.packagingGrid}>
            <div className={styles.packagingCard}>
              <Package size={20} className={styles.packagingIcon} />
              <h3 className={styles.packagingTitle}>Matte Linen Archival Box</h3>
              <p className={styles.packagingDesc}>{product.packaging}</p>
            </div>
            <div className={styles.packagingCard}>
              <Layers size={20} className={styles.packagingIcon} />
              <h3 className={styles.packagingTitle}>Linen Dust Sleeve</h3>
              <p className={styles.packagingDesc}>Includes a breathable raw linen storage wrap to maintain fiber freshness.</p>
            </div>
            <div className={styles.packagingCard}>
              <ShieldCheck size={20} className={styles.packagingIcon} />
              <h3 className={styles.packagingTitle}>Physical Passport Ledger</h3>
              <p className={styles.packagingDesc}>Comes with a heavy cotton printed passport containing serial verification codes.</p>
            </div>
          </div>
        </section>
      )}

      {/* ==================================================
          SECTION 10: OWNERSHIP INFORMATION
          ================================================== */}
      <section className={styles.ownershipSection}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionEyebrow}>Registry</span>
          <h2 className={styles.sectionHeadline}>Ownership Information</h2>
        </div>
        <div className={styles.registryBox}>
          <div className={styles.registryHeader}>
            <span className={styles.registryTitle}>GODSMOVE CUSTODY REGISTRY</span>
            <span className={styles.registryId}>GMP-REG-{product.id.substring(0,8).toUpperCase()}</span>
          </div>
          <div className={styles.registryGrid}>
            <div className={styles.registryItem}>
              <span className={styles.registryLabel}>Catalog Edition</span>
              <span className={styles.registryValue}>{getMetadataVal('edition', 'Limited 1 of 150 Archive Units')}</span>
            </div>
            <div className={styles.registryItem}>
              <span className={styles.registryLabel}>Production Batch</span>
              <span className={styles.registryValue}>{getMetadataVal('batch', 'Batch A-09 (India Studio)')}</span>
            </div>
            <div className={styles.registryItem}>
              <span className={styles.registryLabel}>Quality Audit Check</span>
              <span className={styles.registryValue}>Grade A Certified (Visual and seam inspection complete)</span>
            </div>
            <div className={styles.registryItem}>
              <span className={styles.registryLabel}>Warranty Stability</span>
              <span className={styles.registryValue}>Shape and seam stability 180-wash guarantee</span>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          SECTION 11: EDITORIAL NOTES (OPTIONAL)
          ================================================== */}
      {product.editorialNotes && (
        <section className={styles.editorialNotesSection}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionEyebrow}>Footnotes</span>
            <h2 className={styles.sectionHeadline}>Editorial Notes</h2>
          </div>
          <p className={styles.editorialNotesText}>
            <em>"{product.editorialNotes}"</em>
          </p>
        </section>
      )}

      {/* ==================================================
          SECTION 12: GARMENT LIFE CYCLE
          ================================================== */}
      <section className={styles.lifecycleSection}>
        <div className={styles.lifecycleHeader}>
          <span className={styles.sectionEyebrow}>GENESIS TIMELINE</span>
          <h2 className={styles.sectionHeadline}>Garment Life Cycle</h2>
          <p className={styles.lifecycleSub}>Tracing the six developmental milestones defining the creation of this piece.</p>
        </div>
        
        <div className={styles.timelineWrapper}>
          <div className={styles.timelineLine} />
          <div className={styles.timelineHorizontalGrid}>
            {(() => {
              const defaultStages = [
                { title: 'Concept Curation', desc: 'Narrative sketching and silhouette grading.', icon: 'Compass' },
                { title: 'Material Sourcing', desc: 'Acquiring premium organic cotton fibers.', icon: 'Layers' },
                { title: 'Pattern Sculpting', desc: 'Precision templates for drape structure.', icon: 'Scissors' },
                { title: 'Technical Construction', desc: 'High-density stitchwork and custom seams.', icon: 'Cpu' },
                { title: 'Quality Auditing', desc: 'Tensile test and dimensional validation.', icon: 'ShieldCheck' },
                { title: 'Archival Packaging', desc: 'Sealed in custom matte storage sleeves.', icon: 'Package' },
              ];

              let lifecycleStages = defaultStages;
              if (product.garmentLifeCycle) {
                try {
                  const parsed = JSON.parse(product.garmentLifeCycle);
                  if (Array.isArray(parsed) && parsed.length > 0) {
                    lifecycleStages = parsed;
                  }
                } catch (e) {}
              }

              const IconMap: { [key: string]: any } = {
                Compass,
                Layers,
                Scissors,
                Cpu,
                ShieldCheck,
                Package,
              };

              return lifecycleStages.slice(0, 6).map((stage, idx) => {
                const IconComponent = IconMap[stage.icon] || Package;
                return (
                  <div key={idx} className={styles.timelineHorizontalItem}>
                    <div className={styles.timelineIconDot}>
                      <IconComponent size={14} />
                    </div>
                    <span className={styles.timelineStageNum}>Stage 0{idx + 1}</span>
                    <h3 className={styles.timelineStageTitle}>{stage.title}</h3>
                    <p className={styles.timelineStageDesc}>{stage.desc}</p>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </section>

      {/* ==================================================
          SECTION 13: DIGITAL PASSPORT CARD
          ================================================== */}
      <section className={styles.passportSection}>
        <div className={styles.passportHeader}>
          <span className={styles.sectionEyebrow}>Digital Authenticity</span>
          <h2 className={styles.sectionHeadline}>GODSMOVE Passport</h2>
          <p className={styles.passportSub}>Every piece in our catalog is registered inside the GODSMOVE authenticity ledger.</p>
        </div>
        
        <div className={styles.passportCard}>
          <div className={styles.passportCardTop}>
            <span className={styles.passportTitle}>GODSMOVE PASSPORT</span>
            <span className={styles.passportId}>ID: GMP-{product.id.substring(0, 8).toUpperCase()}</span>
          </div>
          <div className={styles.passportSpecs}>
            <div className={styles.passportSpec}>
              <span className={styles.passportLabel}>Product Catalog</span>
              <span className={styles.passportValue}>{product.name}</span>
            </div>
            <div className={styles.passportSpec}>
              <span className={styles.passportLabel}>Collection Group</span>
              <span className={styles.passportValue}>{product.collectionName || 'Archival Curation'}</span>
            </div>
            <div className={styles.passportSpec}>
              <span className={styles.passportLabel}>Drop Release</span>
              <span className={styles.passportValue}>{product.drop?.name || 'Drop 001'}</span>
            </div>
            <div className={styles.passportSpec}>
              <span className={styles.passportLabel}>Origin Sourced</span>
              <span className={styles.passportValue}>{product.origin || 'Studio Checked'}</span>
            </div>
            <div className={styles.passportSpec}>
              <span className={styles.passportLabel}>Custody Status</span>
              <span className={styles.passportValue}>Untampered (Original Custody)</span>
            </div>
            <div className={styles.passportSpec}>
              <span className={styles.passportLabel}>Ledger Seal</span>
              <span className={styles.passportValue}>Grade A Verified</span>
            </div>
          </div>
          <div className={styles.passportCardFooter}>
            <span className={styles.passportSeal}>OFFICIAL ARCHIVE REGISTER</span>
            <span className={styles.passportGrade}>LEDGER VALIDATED</span>
          </div>
        </div>
      </section>

      {/* Renders dynamic products in symmetrical grid - handled in page.tsx */}
      
      {/* Browsing history list */}
      {profile && <RecentlyViewed />}
    </div>
  );
}
