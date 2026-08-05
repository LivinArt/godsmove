import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import ProductCard from '@/components/ProductCard';
import ScrollReveal from '@/components/ScrollReveal';
import CinematicHero, { type CinematicHeroSlide } from '@/components/CinematicHero';
import RecentlyViewed from '@/components/RecentlyViewed';
import { 
  getHomeHeroSlides, 
  getStorefrontProducts, 
  getStorefrontCategories 
} from '@/actions/storefront.actions';
import { getProfileSummary } from '@/actions/profile.actions';
import HomepageFeatureCards from '@/components/home/HomepageFeatureCards';
import VaultProductCard from '@/components/home/VaultProductCard';
import { getHomepageFeatureCardsData } from '@/actions/feature-cards.actions';
import MobileCategoryCarousel from '@/components/MobileCategoryCarousel';
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
    newArrivals,
    editorSelection,
    exclusiveRackProducts,
    categories,
    heroSlidesRaw,
    featureCardsContent
  ] = await Promise.all([
    getStorefrontProducts({ take: 4 }),
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

  // 2. Retrieve User Credentials for Personalized Curation
  const summary = await getProfileSummary();

  const profile = summary ? { firstName: summary.firstName, lastName: summary.lastName, email: summary.email } : null;
  const walletBalance = summary?.walletBalance ?? 0;
  const hasRecentlyDelivered = summary?.hasRecentlyDelivered ?? false;
  const hasApprovedReturn = summary?.hasApprovedReturn ?? false;
  const hasActiveCare = summary?.hasActiveCare ?? false;
  const orderedProductIds = summary?.orderedProductIds ?? [];

  // Filter recommendations based on purchase ledger
  const recommendedProducts = editorSelection
    .filter(p => !orderedProductIds.includes(p.id))
    .slice(0, 4);

  return (
    <>
      <Navbar />
      <CartDrawer />

      <main className={styles.flagshipMain}>
        {/* 1. Full Cinematic Campaign Hero */}
        <CinematicHero slides={heroSlides} />

        {/* 2. Full-Width Editorial Split Campaign Banner (DROPS & EXCLUSIVE RACK) */}
        <HomepageFeatureCards content={featureCardsContent} />

        {/* 3. New Arrivals (Magazine Composition) */}
        {newArrivals.length > 0 && (
          <section className={styles.section} id="new-arrivals">
            <div className="container">
              <ScrollReveal>
                <div className={styles.header}>
                  <span className="caption">Releases</span>
                  <h2 className={styles.sectionTitle}>New Arrivals</h2>
                </div>
              </ScrollReveal>
              
              <div className={styles.grid}>
                {newArrivals.map((product, i) => (
                  <ProductCard key={product.id} product={product} index={i} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 4. Shop By Category (Editorial Grid) */}
        {categories.length > 0 && (
          <section className={styles.section} id="shop-categories">
            <div className="container">
              <ScrollReveal>
                <div className={styles.header}>
                  <span className="caption">Rooms</span>
                  <h2 className={styles.sectionTitle}>Shop by Category</h2>
                </div>
              </ScrollReveal>

              {/* Mobile: horizontal auto-scrolling carousel */}
              <MobileCategoryCarousel categories={categories.map((cat: any) => ({ id: cat.id, name: cat.name, slug: cat.slug, imageUrl: cat.imageUrl }))} />

              {/* Desktop: editorial grid (hidden on mobile via CSS) */}
              <div className={styles.categoryGrid}>
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
                        <span className={styles.categoryLink}>Enter Room</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* 5. Exclusive Rack (The Vault Lounge) */}
        {exclusiveRackProducts.length > 0 && (
          <section className={styles.exclusiveSection} id="exclusive-rack">
            <div className="container">
              <ScrollReveal>
                <div className={styles.exclusiveHeader}>
                  <span className={styles.exclusiveEyebrow}>THE VAULT</span>
                  <h2 className={styles.exclusiveTitle}>Exclusive Rack</h2>
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

        {/* 6. Curated For You / Allocated For You (Only show if logged in) */}
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

        {/* 7. Recently Viewed (Logged in only) */}
        {profile && <RecentlyViewed />}

        {/* 8. Journal (Archival Writings) */}
        <section className={styles.journalSection}>
          <div className="container">
            <ScrollReveal>
              <div className={styles.journalHeader}>
                <span className="caption">Journal</span>
                <h2 className={styles.sectionTitle}>Archival Writings</h2>
              </div>
              <div className={styles.journalGrid}>
                <div className={styles.journalCard}>
                  <span className={styles.journalTag}>Edition 01</span>
                  <h3>The Seam Architecture</h3>
                  <p>How we design drop-shoulder sleeves to hold form across frames.</p>
                  <span className={styles.journalRead}>Read Entry</span>
                </div>
                <div className={styles.journalCard}>
                  <span className={styles.journalTag}>Edition 02</span>
                  <h3>Slow Curation</h3>
                  <p>The philosophy of rejecting mass retail and embracing selective allocation.</p>
                  <span className={styles.journalRead}>Read Entry</span>
                </div>
                <div className={styles.journalCard}>
                  <span className={styles.journalTag}>Edition 03</span>
                  <h3>Textiles Care</h3>
                  <p>Caring for fine combed long-staple cotton fibers to extend product lifetime.</p>
                  <span className={styles.journalRead}>Read Entry</span>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
