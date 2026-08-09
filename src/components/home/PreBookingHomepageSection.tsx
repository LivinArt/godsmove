'use client';

import React, { useState } from 'react';
import ScrollReveal from '@/components/ScrollReveal';
import PreBookingProductCard from './PreBookingProductCard';
import PreBookingBenefitsModal from '@/components/PreBookingBenefitsModal';
import PreBookingQuickSelectModal from './PreBookingQuickSelectModal';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { useAuth } from '@/context/AuthContext';
import styles from './PreBookingHomepageSection.module.css';

interface PreBookingHomepageSectionProps {
  products: any[];
}

export default function PreBookingHomepageSection({ products }: PreBookingHomepageSectionProps) {
  const router = useRouter();
  const { beginInstantCheckout } = useStore();
  const { requireAuth } = useAuth();

  const [isBenefitsModalOpen, setIsBenefitsModalOpen] = useState(false);
  const [benefitsProductName, setBenefitsProductName] = useState('');

  const [isQuickSelectOpen, setIsQuickSelectOpen] = useState(false);
  const [selectedQuickProduct, setSelectedQuickProduct] = useState<any>(null);

  // Filter products where pre-booking is open
  const openPreBookingProducts = Array.isArray(products)
    ? products.filter((p) => p && p.isPreBooking)
    : [];

  // Gracefully hide section if no active pre-booking products
  if (openPreBookingProducts.length === 0) {
    return null;
  }

  const handleOpenBenefits = (productName: string) => {
    setBenefitsProductName(productName);
    setIsBenefitsModalOpen(true);
  };

  const handlePreBookClick = (product: any) => {
    const variants = product.variants || [];
    const activeVariants = variants.filter((v: any) => v.isActive !== false);

    // If product has multiple sizes/variants, open quick size selection modal on homepage
    if (activeVariants.length > 1) {
      setSelectedQuickProduct(product);
      setIsQuickSelectOpen(true);
    } else {
      // Single size / default variant — proceed directly to instant pre-booking checkout
      const defaultSize = activeVariants[0]?.size || 'FREE';
      const orderType = 'PRE_BOOKING';
      requireAuth(
        'checkout',
        () => {
          beginInstantCheckout({ product, size: defaultSize, quantity: 1, orderType });
          router.push('/checkout');
        },
        { type: 'checkout', product, size: defaultSize, quantity: 1, orderType }
      );
    }
  };

  return (
    <>
      <section className={styles.section} id="pre-booking-allocations">
        <div className="container">
          <ScrollReveal>
            <div className={styles.header}>
              <span className={styles.eyebrow}>EARLY ACCESS</span>
              <h2 className={styles.title}>PRE-BOOKING ALLOCATIONS</h2>
              <p className={styles.subtitle}>
                Reserve statement pieces before official public release. Limited allocation window.
              </p>
            </div>
          </ScrollReveal>

          <div className={styles.grid}>
            {openPreBookingProducts.map((product) => (
              <ScrollReveal key={product.id}>
                <PreBookingProductCard
                  product={product}
                  onOpenBenefits={handleOpenBenefits}
                  onPreBookClick={handlePreBookClick}
                />
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Privileges Modal */}
      <PreBookingBenefitsModal
        isOpen={isBenefitsModalOpen}
        onClose={() => setIsBenefitsModalOpen(false)}
        productName={benefitsProductName}
      />

      {/* Quick Size Select Modal */}
      <PreBookingQuickSelectModal
        isOpen={isQuickSelectOpen}
        onClose={() => {
          setIsQuickSelectOpen(false);
          setSelectedQuickProduct(null);
        }}
        product={selectedQuickProduct}
      />
    </>
  );
}
