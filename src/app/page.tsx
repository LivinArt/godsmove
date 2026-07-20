import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import ProductCard from '@/components/ProductCard';
import CinematicHero, { type CinematicHeroSlide } from '@/components/CinematicHero';
import RecentlyViewed from '@/components/RecentlyViewed';
import { 
  getHomeHeroSlides, 
  getStorefrontProducts, 
  getActiveDrop, 
  getStorefrontCategories 
} from '@/actions/storefront.actions';
import { getMyProfile } from '@/actions/profile.actions';
import { getMyOrders } from '@/actions/order.actions';
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
    activeDrop,
    heroSlidesRaw
  ] = await Promise.all([
    getStorefrontProducts({ take: 4 }),
    getStorefrontProducts({ featured: true, take: 4 }),
    getStorefrontProducts({ channel: 'EXCLUSIVE_RACK', take: 3 }),
    getStorefrontCategories(),
    getActiveDrop(),
    getHomeHeroSlides(),
  ]);

  const heroSlides: CinematicHeroSlide[] =
    Array.isArray(heroSlidesRaw) && heroSlidesRaw.length > 0
      ? (heroSlidesRaw as CinematicHeroSlide[])
      : FALLBACK_HERO_SLIDES;

  const currentDrop = activeDrop || {
    name: 'Drop 001',
    tagline: 'First contact.',
    description: 'Heavyweight essentials for the interior monologue. 300 GSM. Oversized.',
    heroImageUrl: '/images/campaign/editorial-01.png',
  };

  // 2. Retrieve User Credentials for Personalized Curation
  let profile: any = null;
  let orderedProductIds: string[] = [];
  try {
    profile = await getMyProfile();
    const orders = await getMyOrders();
    if (orders && orders.length > 0) {
      orderedProductIds = (orders as any[]).flatMap((o: any) => (o.items as any[]).map((i: any) => i.productId));
    }
  } catch (error) {
    // Guest session
  }

  // Filter recommendations based on purchase ledger
  const recommendedProducts = editorSelection
    .filter(p => !orderedProductIds.includes(p.id))
    .slice(0, 4);

  return (
    <>
      <Navbar />
      <CartDrawer />

      <main className={styles.flagshipMain}>
        {/* Subtle editorial greeting — only for logged-in users, above the hero */}
        {profile && (
          <div className={styles.greetingBar}>
            <span className={styles.greetingText}>
              Welcome back, {profile.firstName}.
            </span>
          </div>
        )}

        {/* 1. Full Cinematic Campaign Hero */}
        <CinematicHero slides={heroSlides} />

        {/* 2. New Arrivals (Magazine Composition) */}
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

        {/* 3. Shop By Category (Editorial Grid) */}
        {categories.length > 0 && (
          <section className={styles.section} id="shop-categories">
            <div className="container">
              <ScrollReveal>
                <div className={styles.header}>
                  <span className="caption">Rooms</span>
                  <h2 className={styles.sectionTitle}>Shop by Category</h2>
                </div>
              </ScrollReveal>
              <div className={styles.categoryGrid}>
                {categories.map((cat: any) => {
                  let image = '/images/campaign/editorial-01.png';
                  let desc = 'Minimalist silhouettes designed for posture.';
                  if (cat.slug === 'tees') {
                    image = '/images/products/tee-black.png';
                    desc = 'Heavyweight combed cotton essentials holding shape through wear.';
                  } else if (cat.slug === 'hoodies') {
                    image = '/images/products/tee-charcoal.png';
                    desc = 'Tailored weights formulated for density, depth, and comfort.';
                  } else if (cat.slug === 'accessories') {
                    image = '/images/products/tee-ivory.png';
                    desc = 'Deliberate design details completing the signature look.';
                  }
                  return (
                    <Link href={`/drops?category=${cat.id}`} key={cat.id} className={styles.categoryCard}>
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

        {/* 4. Featured Drop (Cinematic Banner) */}
        <section className={styles.section} id="featured-collection">
          <div className="container">
            <ScrollReveal>
              <div className={styles.featuredBox}>
                <div className={styles.featuredImage}>
                  <Image 
                    src={currentDrop.heroImageUrl || '/images/campaign/editorial-01.png'} 
                    alt={currentDrop.name} 
                    fill 
                    style={{ objectFit: 'cover' }} 
                  />
                </div>
                <div className={styles.featuredText}>
                  <span className="caption">Curation</span>
                  <h2>{currentDrop.name}</h2>
                  <p>{currentDrop.description || currentDrop.tagline || 'Curated releases mapped with strict limits.'}</p>
                  <Link href="/drops" className="btn btn-secondary">
                    View Collection
                  </Link>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* 5. Exclusive Rack (Vault Lounge) */}
        {exclusiveRackProducts.length > 0 && (
          <section className={styles.exclusiveSection} id="exclusive-rack">
            <div className="container">
              <ScrollReveal>
                <div className={styles.exclusiveHeader}>
                  <span className={styles.exclusiveEyebrow}>Vault</span>
                  <h2 className={styles.exclusiveTitle}>Exclusive Rack</h2>
                  <p className={styles.exclusiveSub}>
                    Limited allocation pieces. Private selection accessible by active rank.
                  </p>
                </div>
              </ScrollReveal>
              
              <div className={styles.exclusiveContainer}>
                {exclusiveRackProducts.map((p, idx) => {
                  const isEven = idx % 2 === 0;
                  return (
                    <ScrollReveal key={p.id}>
                      <div className={`${styles.exclusiveRow} ${isEven ? styles.rowNormal : styles.rowReverse}`}>
                        <div className={styles.exclusiveImgPanel}>
                          <div className={styles.exclusiveImageContainer}>
                            <Image 
                              src={p.images?.[0]?.url || '/placeholder.png'} 
                              alt={p.name} 
                              fill 
                              style={{ objectFit: 'cover' }} 
                              className={styles.exclusiveImg}
                            />
                            {p.featuredBadge && (
                              <span className={styles.exclusiveCardBadge}>{p.featuredBadge}</span>
                            )}
                          </div>
                        </div>
                        
                        <div className={styles.exclusiveInfoPanel}>
                          <span className={styles.exclusiveGoldLabel}>{p.collectionName || 'Archival Vault'}</span>
                          <h3 className={styles.exclusiveItemTitle}>{p.name}</h3>
                          <p className={styles.exclusiveItemDesc}>{p.tagline || p.shortDesc || 'Limited production item.'}</p>
                          <div className={styles.exclusiveDetailsRow}>
                            <span>{p.category?.name || 'Archival'}</span>
                            <span className={styles.exclusiveGoldDot}>•</span>
                            <span>{p.variants?.[0]?.price ? `₹${p.variants[0].price}` : 'Private Allocation'}</span>
                          </div>
                          <Link href={`/product/${p.slug}`} className={styles.exclusiveCtaButton}>
                            Request Allocation
                          </Link>
                        </div>
                      </div>
                    </ScrollReveal>
                  );
                })}
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
