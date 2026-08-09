import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import ProductCard from '@/components/ProductCard';
import ScrollReveal from '@/components/ScrollReveal';
import CinematicHero, { type CinematicHeroSlide } from '@/components/CinematicHero';
import RecentlyViewed from '@/components/RecentlyViewed';
import PreBookingHomepageSection from '@/components/home/PreBookingHomepageSection';
import VaultProductCard from '@/components/home/VaultProductCard';
import HomepageFeatureCards from '@/components/home/HomepageFeatureCards';
import MobileCategoryCarousel from '@/components/MobileCategoryCarousel';
import { 
  getHomeHeroSlides, 
  getStorefrontProducts, 
  getStorefrontCategories 
} from '@/actions/storefront.actions';
import { getProfileSummary } from '@/actions/profile.actions';
import { getHomepageFeatureCardsData } from '@/actions/feature-cards.actions';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

const FALLBACK_HERO_SLIDES: CinematicHeroSlide[] = [
  {
    id: 'fallback-editorial',
    image: '/images/hero/hero-main.png',
    mobileImage: null,
    eyebrow: 'SS26 / DROP 001',
    headline: 'Worn With Intent.',
    narrative:
      'Heavy in symbolism.\nLimited in quantity.\nBuilt for custodians, not consumers.',
    ctaLabel: 'ENTER THE DROP',
    ctaHref: '/drops',
    alignment: 'left',
    overlayOpacity: 0.45,
  },
];

export default async function Home() {
  // 1. Fetch Dynamic Stores Metadata & Curation Lists
  const [
    allProducts,
    editorSelection,
    exclusiveRackProducts,
    categories,
    heroSlidesRaw,
    featureCardsContent
  ] = await Promise.all([
    getStorefrontProducts({ take: 50 }),
    getStorefrontProducts({ featured: true, take: 4 }),
    getStorefrontProducts({ isExclusiveRack: true, showOnHomepage: true, take: 3 }),
    getStorefrontCategories(),
    getHomeHeroSlides(),
    getHomepageFeatureCardsData(),
  ]);

  const heroSlides: CinematicHeroSlide[] =
    Array.isArray(heroSlidesRaw) && heroSlidesRaw.length > 0
      ? (heroSlidesRaw as CinematicHeroSlide[])
      : FALLBACK_HERO_SLIDES;

  // Filter products for dedicated sections
  const preBookingProducts = allProducts.filter((p) => p && p.isPreBooking);
  const dropsProducts = allProducts.filter((p) => p && !p.isExclusiveRack).slice(0, 4);

  // 2. Retrieve User Credentials for Personalized Curation
  const summary = await getProfileSummary();

  const profile = summary ? { firstName: summary.firstName, lastName: summary.lastName, email: summary.email } : null;
  const orderedProductIds = summary?.orderedProductIds ?? [];

  // Filter recommendations based on purchase ledger
  const recommendedProducts = editorSelection
    .filter((p) => !orderedProductIds.includes(p.id))
    .slice(0, 4);

  return (
    <>
      <Navbar />
      <CartDrawer />

      <main className={styles.flagshipMain}>
        {/* ── 1. SPLIT BANNER: Cinematic Campaign Hero + Split Feature Cards ── */}
        <CinematicHero slides={heroSlides} />
        <HomepageFeatureCards content={featureCardsContent} />

        {/* ── 2. PRE-BOOKING / UPCOMING ALLOCATIONS (Immediately After Split Banner) ── */}
        <PreBookingHomepageSection products={preBookingProducts} />

        {/* ── 3. THE VAULT / EXCLUSIVE RACK ── */}
        {exclusiveRackProducts.length > 0 && (
          <section className={styles.exclusiveSection} id="exclusive-rack">
            <div className="container">
              <ScrollReveal>
                <div className={styles.exclusiveHeader}>
                  <span className={styles.exclusiveEyebrow}>THE VAULT</span>
                  <h2 className={styles.exclusiveTitle}>EXCLUSIVE RACK</h2>
                  <p className={styles.exclusiveSub}>
                    Curated garments crafted with uncompromising attention to detail.
                  </p>
                </div>
              </ScrollReveal>
              
              <div className={styles.exclusiveContainer}>
                {exclusiveRackProducts.map((p, idx) => (
                  <ScrollReveal key={p.id}>
                    <VaultProductCard product={p} isEven={idx % 2 === 0} />
                  </ScrollReveal>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── 4. ROOMS — SHOP BY CATEGORY ── */}
        {categories.length > 0 && (
          <section className={styles.section} id="shop-categories">
            <div className="container">
              <ScrollReveal>
                <div className={styles.header}>
                  <span className="caption">ROOMS</span>
                  <h2 className={styles.sectionTitle}>EXPLORE BY WORLD</h2>
                </div>
              </ScrollReveal>

              {/* Mobile: horizontal auto-scrolling carousel */}
              <MobileCategoryCarousel categories={categories.map((cat: any) => ({ id: cat.id, name: cat.name, slug: cat.slug, imageUrl: cat.imageUrl }))} />

              {/* Desktop: editorial grid */}
              <div className={styles.categoryGrid} data-count={categories.length}>
                {categories.map((cat: any) => {
                  const fallbackImage = cat.slug === 'tees' ? '/images/products/tee-black.png' :
                                       cat.slug === 'hoodies' ? '/images/products/tee-charcoal.png' :
                                       cat.slug === 'accessories' ? '/images/products/tee-ivory.png' : '/images/campaign/editorial-01.png';
                  const image = cat.imageUrl || fallbackImage;
                  let desc = 'Minimalist silhouettes designed for posture.';
                  if (cat.slug === 'tees') {
                    desc = 'Heavyweight combed cotton essentials holding shape through wear.';
                  } else if (cat.slug === 'hoodies') {
                    desc = 'Tailored weights formulated for density, depth, and comfort.';
                  } else if (cat.slug === 'accessories') {
                    desc = 'Deliberate design details completing the signature look.';
                  }
                  return (
                    <Link href={`/category/${cat.slug}`} key={cat.id} className={styles.categoryCard}>
                      <div className={styles.categoryImageWrap}>
                        <Image 
                          src={image} 
                          alt={cat.name} 
                          fill 
                          style={{ objectFit: 'cover' }} 
                          className={styles.categoryImage} 
                        />
                        <div className={styles.categoryOverlay} />
                      </div>
                      <div className={styles.categoryInfo}>
                        <h3>{cat.name}</h3>
                        <p>{desc}</p>
                        <span className={styles.categoryLink}>ENTER ROOM →</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* ── 5. DROPS / NEW RELEASES SECTION ── */}
        {dropsProducts.length > 0 && (
          <section className={styles.section} id="latest-drops">
            <div className="container">
              <ScrollReveal>
                <div className={styles.header}>
                  <span className="caption">DROPS</span>
                  <h2 className={styles.sectionTitle}>THE LATEST DROP</h2>
                </div>
              </ScrollReveal>
              
              <div className={styles.grid}>
                {dropsProducts.map((product, i) => (
                  <ProductCard key={product.id} product={product} index={i} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── 6. ALLOCATED FOR YOU (Personalized Curation for Logged-In Users) ── */}
        {profile && recommendedProducts.length > 0 && (
          <section className={styles.section} id="recommendations">
            <div className="container">
              <ScrollReveal>
                <div className={styles.header}>
                  <span className="caption">Personal Curation</span>
                  <h2 className={styles.sectionTitle}>Allocated For You</h2>
                </div>
              </ScrollReveal>
              <div className={styles.grid}>
                {recommendedProducts.map((product, i) => (
                  <ProductCard key={product.id} product={product} index={i} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── 7. RECENTLY VIEWED ── */}
        {profile && <RecentlyViewed />}
      </main>

      <Footer />
    </>
  );
}
