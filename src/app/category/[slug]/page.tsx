import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import ProductCard from '@/components/ProductCard';
import ScrollReveal from '@/components/ScrollReveal';
import {
  getStorefrontProducts,
  getStorefrontCategories,
} from '@/actions/storefront.actions';
import { constructMetadata } from '@/lib/seo-metadata';
import JsonLd from '@/components/JsonLd';
import { getCollectionSchema, getBreadcrumbSchema } from '@/lib/json-ld';
import styles from './category.module.css';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Randomised luxury editorial lines — seeded by category slug for SSR consistency
const EDITORIAL_LINES: Record<string, string> = {
  tees:        'Every silhouette here reflects restrained craftsmanship.',
  hoodies:     'Curated garments built with architectural precision.',
  bottoms:     'Selected pieces designed for permanence.',
  accessories: 'Quiet essentials shaped through deliberate craftsmanship.',
  caps:        'Headwear conceived as an extension of posture.',
  bags:        'Objects of utility elevated to archival status.',
};
const DEFAULT_EDITORIAL_LINES = [
  'Every silhouette here reflects restrained craftsmanship.',
  'Curated garments built with architectural precision.',
  'Selected pieces designed for permanence.',
  'Quiet essentials shaped through deliberate craftsmanship.',
];

// Section 3 — exclusive rack editorial lines
const EXCLUSIVE_EDITORIAL = 'The rarest allocations remain reserved inside the archive.';

// Section 4 — drops editorial lines
const DROPS_EDITORIAL = 'New allocations released from the archive.';

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const categories = await getStorefrontCategories();
  const category = categories.find((c: any) => c.slug === slug);
  
  if (!category) {
    return constructMetadata({
      title: 'Category Not Found',
      description: 'The requested category archive could not be located.',
      path: `/category/${slug}`,
      noIndex: true,
    });
  }

  const categoryTitle = `${category.name} | Premium ${category.name} for Men | GODSMOVE`;
  const categoryDesc = `Explore ${category.name} from GODSMOVE. ${EDITORIAL_LINES[slug] || DEFAULT_EDITORIAL_LINES[0]} Crafted with premium heavy cotton, contemporary drop-shoulder silhouettes, and distinctive finishes.`;

  return constructMetadata({
    title: categoryTitle,
    description: categoryDesc,
    path: `/category/${slug}`,
    image: category.imageUrl || null,
    keywords: [
      category.name,
      `GODSMOVE ${category.name}`,
      `premium ${category.name} India`,
      `${category.name} for men`,
      'modern apparel collection',
    ],
  });
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;

  // Resolve category
  const categories = await getStorefrontCategories();
  const category = categories.find((c: any) => c.slug === slug);
  if (!category) {
    notFound();
  }

  // Fetch all four data streams in parallel — reuse existing storefront action
  const [categoryProducts, exclusiveRackProducts, allDropProducts] =
    await Promise.all([
      // Section 2: products in this specific category
      getStorefrontProducts({ categoryId: category.id }),
      // Section 3: exclusive rack — top 6
      getStorefrontProducts({ isExclusiveRack: true, take: 6 }),
      // Section 4: all latest drops — top 6
      getStorefrontProducts({ take: 6 }),
    ]);

  const editorialLine =
    EDITORIAL_LINES[slug] ||
    DEFAULT_EDITORIAL_LINES[Math.abs(slug.charCodeAt(0) - 97) % DEFAULT_EDITORIAL_LINES.length];

  const collectionJsonLd = getCollectionSchema(
    `${category.name} Collection`,
    editorialLine,
    `/category/${slug}`,
    categoryProducts
  );

  const breadcrumbJsonLd = getBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: category.name, url: `/category/${slug}` },
  ]);

  return (
    <>
      <JsonLd schema={[collectionJsonLd, breadcrumbJsonLd]} />
      <Navbar />
      <CartDrawer />

      <main className={styles.page}>
        {/* ============================================================
            SECTION 1 — CATEGORY HERO
            ============================================================ */}
        <section className={styles.heroSection}>
          <div className="container">
            <ScrollReveal>
              <div className={styles.heroInner}>
                <span className={styles.heroEyebrow}>The Archive</span>
                <h1 className={styles.heroTitle}>{category.name.toUpperCase()}</h1>
                <p className={styles.heroEditorial}>{editorialLine}</p>
                <div className={styles.heroDivider} />
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ============================================================
            SECTION 2 — CATEGORY PRODUCTS
            ============================================================ */}
        <section className={styles.productsSection}>
          <div className="container">
            <ScrollReveal>
              <div className={styles.sectionMeta}>
                <span className={styles.sectionCount}>
                  {categoryProducts.length} {categoryProducts.length === 1 ? 'piece' : 'pieces'} allocated
                </span>
              </div>
            </ScrollReveal>

            {categoryProducts.length > 0 ? (
              <div className={styles.productGrid}>
                {categoryProducts.map((product: any, i: number) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    index={i}
                    isDominant={i % 5 === 0}
                  />
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <p>No pieces allocated to this category yet.</p>
                <Link href="/drops" className={styles.emptyLink}>
                  Explore All Drops
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* ============================================================
            SECTION 3 — CHECKOUT EXCLUSIVE RACK
            ============================================================ */}
        {exclusiveRackProducts.length > 0 && (
          <section className={styles.spotlightSection}>
            <div className="container">
              <ScrollReveal>
                <div className={styles.spotlightHeader}>
                  <span className={styles.heroEyebrow}>Vault Edition</span>
                  <h2 className={styles.spotlightTitle}>CHECKOUT EXCLUSIVE RACK</h2>
                  <p className={styles.spotlightEditorial}>{EXCLUSIVE_EDITORIAL}</p>
                </div>
              </ScrollReveal>

              <div className={styles.spotlightGrid}>
                {exclusiveRackProducts.slice(0, 6).map((product: any, i: number) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    index={i}
                    theme="dark"
                  />
                ))}
              </div>

              <div className={styles.spotlightCta}>
                <Link href="/exclusive-rack" className={styles.ctaLink}>
                  Enter Exclusive Rack
                  <span className={styles.ctaArrow}>→</span>
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* ============================================================
            SECTION 4 — EXPLORE DROPS
            ============================================================ */}
        {allDropProducts.length > 0 && (
          <section className={styles.dropsSection}>
            <div className="container">
              <ScrollReveal>
                <div className={styles.spotlightHeader}>
                  <span className={styles.heroEyebrow}>Latest Releases</span>
                  <h2 className={styles.spotlightTitle}>EXPLORE DROPS</h2>
                  <p className={styles.spotlightEditorial}>{DROPS_EDITORIAL}</p>
                </div>
              </ScrollReveal>

              <div className={styles.spotlightGrid}>
                {allDropProducts.slice(0, 6).map((product: any, i: number) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    index={i}
                  />
                ))}
              </div>

              <div className={styles.spotlightCta}>
                <Link href="/drops" className={styles.ctaLink}>
                  Enter the Archive
                  <span className={styles.ctaArrow}>→</span>
                </Link>
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </>
  );
}
