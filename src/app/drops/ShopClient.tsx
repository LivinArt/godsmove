'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import ProductCard from '@/components/ProductCard';
import ScrollReveal from '@/components/ScrollReveal';
import styles from './page.module.css';

type SortOption = 'newest' | 'price-low' | 'price-high';

interface ShopClientProps {
  initialProducts: any[];
  drops: any[];
  categories: any[];
}

export default function ShopClient({
  initialProducts,
  drops,
  categories,
}: ShopClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedDropId, setSelectedDropId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sort, setSort] = useState<SortOption>('newest');

  // Initialize filters from search parameters
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    const dropParam = searchParams.get('drop');

    if (categoryParam) {
      const match = categories.find(
        (c) => c.slug === categoryParam || c.id === categoryParam
      );
      if (match) setSelectedCategoryId(match.id);
    } else {
      setSelectedCategoryId(null);
    }

    if (dropParam) {
      const match = drops.find((d) => d.slug === dropParam || d.id === dropParam);
      if (match) setSelectedDropId(match.id);
    } else {
      setSelectedDropId(null);
    }
  }, [searchParams, categories, drops]);

  const handleCategoryToggle = (categoryId: string) => {
    const nextCat = selectedCategoryId === categoryId ? null : categoryId;
    setSelectedCategoryId(nextCat);
    updateUrlParams(nextCat, selectedDropId);
  };

  const handleDropToggle = (dropId: string | null) => {
    const nextDrop = selectedDropId === dropId ? null : dropId;
    setSelectedDropId(nextDrop);
    updateUrlParams(selectedCategoryId, nextDrop);
  };

  const updateUrlParams = (catId: string | null, dropId: string | null) => {
    const params = new URLSearchParams();
    if (catId) {
      const catObj = categories.find((c) => c.id === catId);
      params.set('category', catObj ? catObj.slug : catId);
    }
    if (dropId) {
      const dropObj = drops.find((d) => d.id === dropId);
      params.set('drop', dropObj ? dropObj.slug : dropId);
    }

    // Replace the URL state silently without full page reloads
    router.replace(pathname + '?' + params.toString(), { scroll: false });
  };

  // Perform many-to-many filtering intersections
  const filtered = useMemo(() => {
    let result = [...initialProducts];

    // 1. Category check
    if (selectedCategoryId) {
      result = result.filter((p) => p.categoryId === selectedCategoryId);
    }

    // 2. Drop check
    if (selectedDropId) {
      result = result.filter((p) => p.dropId === selectedDropId);
    }

    // 3. Search query check
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query) ||
          p.category?.name?.toLowerCase().includes(query)
      );
    }

    // 4. Sort check
    if (sort === 'price-low') {
      result.sort((a, b) => {
        const priceA = a.variants?.[0]?.price ? Number(a.variants[0].price) : 0;
        const priceB = b.variants?.[0]?.price ? Number(b.variants[0].price) : 0;
        return priceA - priceB;
      });
    } else if (sort === 'price-high') {
      result.sort((a, b) => {
        const priceA = a.variants?.[0]?.price ? Number(a.variants[0].price) : 0;
        const priceB = b.variants?.[0]?.price ? Number(b.variants[0].price) : 0;
        return priceB - priceA;
      });
    } else {
      // Default: newest
      result.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    return result;
  }, [initialProducts, selectedCategoryId, selectedDropId, searchQuery, sort]);

  return (
    <div className={styles.shopContent}>
      {/* 1. Top Section */}
      <ScrollReveal>
        <div className={styles.topSection}>
          <span className="caption">Discovery</span>
          <h1 className={styles.pageTitle}>The Archive</h1>
          <p className={styles.pageSubtitle}>
            Browse our curated collections. Limited pieces formulated with heavy structural integrity.
          </p>
        </div>
      </ScrollReveal>

      {/* 2. Category Filters (Editorial Cover Cards) */}
      {categories.length > 0 && (
        <div className={styles.categorySection}>
          <p className={styles.filterTitleLabel}>Select Space</p>
          <div className={styles.categoryGrid}>
            {categories.map((cat) => {
              const isActive = selectedCategoryId === cat.id;
              let img = '/images/campaign/editorial-01.png';
              let desc = 'Minimalist garments designed for posture.';
              if (cat.slug === 'tees') {
                img = '/images/products/tee-black.png';
                desc = 'Heavyweight combed cotton essentials.';
              } else if (cat.slug === 'hoodies') {
                img = '/images/products/tee-charcoal.png';
                desc = 'Tailored structures formulated for stability.';
              } else if (cat.slug === 'accessories') {
                img = '/images/products/tee-ivory.png';
                desc = 'Deliberate details completing the signature look.';
              }

              return (
                <button
                  key={cat.id}
                  type="button"
                  className={`${styles.categoryCard} ${
                    isActive ? styles.categoryCardActive : ''
                  }`}
                  onClick={() => handleCategoryToggle(cat.id)}
                  aria-pressed={isActive}
                >
                  <div className={styles.categoryCardImgWrap}>
                    <Image
                      src={img}
                      alt={cat.name}
                      fill
                      style={{ objectFit: 'cover' }}
                      className={styles.categoryCardImg}
                    />
                    <div className={styles.categoryCardOverlay} />
                  </div>
                  <div className={styles.categoryCardInfo}>
                    <h3>{cat.name}</h3>
                    <p>{desc}</p>
                    <span className={styles.categoryCardCta}>
                      {isActive ? 'Selected Collection' : 'View Collection'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Drop Filters & Curation Controls */}
      <div className={styles.controlsSection}>
        <div className={styles.dropFiltersWrap}>
          <span className={styles.filterTitleLabel}>Drop Release Collection</span>
          <div className={styles.dropTabs}>
            <button
              type="button"
              className={`${styles.dropTabBtn} ${
                !selectedDropId ? styles.dropTabBtnActive : ''
              }`}
              onClick={() => handleDropToggle(null)}
            >
              All Drops
            </button>
            {drops.map((drop) => {
              const isActive = selectedDropId === drop.id;
              return (
                <button
                  key={drop.id}
                  type="button"
                  className={`${styles.dropTabBtn} ${
                    isActive ? styles.dropTabBtnActive : ''
                  }`}
                  onClick={() => handleDropToggle(drop.id)}
                >
                  {drop.name}
                </button>
              );
            })}
          </div>
        </div>

        <div className={styles.searchAndSortRow}>
          <div className={styles.searchBox}>
            <input
              type="text"
              placeholder="Search the Archive..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchField}
              aria-label="Search"
            />
          </div>
          <div className={styles.sortBox}>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className={styles.sortField}
              aria-label="Sort"
            >
              <option value="newest">Newest Releases</option>
              <option value="price-low">Price: Low → High</option>
              <option value="price-high">Price: High → Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Filtered Product Grid */}
      <div className={styles.gridSection}>
        <div className={styles.gridHeader}>
          <p className={styles.resultCount}>
            {filtered.length} {filtered.length === 1 ? 'piece' : 'pieces'} allocated
          </p>
        </div>

        <div className={styles.productGrid}>
          {filtered.map((product, i) => (
            <ProductCard
              key={`${product.id}-${selectedCategoryId}-${selectedDropId}`}
              product={product}
              index={i}
              isDominant={i % 5 === 0}
            />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className={styles.noResultsBox}>
            <p>No archival pieces match your current allocation criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}
