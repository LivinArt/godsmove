import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import ProductCard from '@/components/ProductCard';
import ScrollReveal from '@/components/ScrollReveal';
import ExclusiveRack, { type ExclusiveRackProduct } from '@/components/ExclusiveRack';
import CinematicHero, { type CinematicHeroSlide } from '@/components/CinematicHero';
import { getHomeHeroSlides, getStorefrontProducts } from '@/actions/storefront.actions';
import styles from './page.module.css';

/** Merchandising must reflect live DB — avoid stale static homepage without rack/unlock products */
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
  const [featuredDropProducts, exclusiveUnlockProducts, exclusiveRackProducts, heroSlidesRaw] =
    await Promise.all([
      getStorefrontProducts({ channel: 'DROP', featured: true }),
      getStorefrontProducts({ channel: 'EXCLUSIVE_UNLOCK' }),
      getStorefrontProducts({ channel: 'EXCLUSIVE_RACK' }),
      getHomeHeroSlides(),
    ]);

  const heroSlides: CinematicHeroSlide[] =
    Array.isArray(heroSlidesRaw) && heroSlidesRaw.length > 0
      ? (heroSlidesRaw as CinematicHeroSlide[])
      : FALLBACK_HERO_SLIDES;

  return (
    <>
      <Navbar />
      <CartDrawer />

      <main>
        {/* 1. Cinematic hero — admin-managed slides */}
        <CinematicHero slides={heroSlides} />

        {/* 2. Exclusive Unlock System */}
        {exclusiveUnlockProducts.length > 0 && (
          <section
            className={styles.products}
            id="exclusive-unlock"
            style={{ backgroundColor: 'var(--black)' }}
          >
            <div className="container">
              <ScrollReveal>
                <div className={styles.productsHeader}>
                  <span className="caption" style={{ color: 'var(--admin-warning)' }}>
                    Classified
                  </span>
                  <h2 className="h2">Exclusive Unlock System</h2>
                  <p className={styles.limitedDesc} style={{ color: 'var(--muted)', marginTop: '8px' }}>
                    Gated artifacts. Strictly limited to one per custodian.
                  </p>
                </div>
              </ScrollReveal>
              <div className={styles.productsGrid}>
                {exclusiveUnlockProducts.map((product, i) => (
                  <ProductCard key={product.id} product={product} index={i} theme="dark" showCta />
                ))}
              </div>
              <ScrollReveal delay={200}>
                <div className={styles.productsCta}>
                  <Link
                    href="/exclusive-unlock"
                    className="btn btn-primary"
                    id="exclusive-unlock-cta"
                  >
                    Enter Locked Drops
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </ScrollReveal>
            </div>
          </section>
        )}

        {/* 3. Exclusive Rack */}
        {exclusiveRackProducts.length > 0 && (
          <>
            <ExclusiveRack
              products={exclusiveRackProducts as unknown as ExclusiveRackProduct[]}
            />
            <section className={styles.products} style={{ backgroundColor: 'var(--black)' }}>
              <div className="container">
                <ScrollReveal delay={200}>
                  <div className={styles.productsCta}>
                    <Link
                      href="/exclusive-rack"
                      className="btn btn-primary"
                      id="exclusive-rack-cta"
                    >
                      View Full Archive
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </ScrollReveal>
              </div>
            </section>
          </>
        )}

        {/* 4. Explore Our Ranges — featured DROP products only */}
        {featuredDropProducts.length > 0 && (
          <section className={styles.products} id="explore-ranges">
            <div className="container">
              <ScrollReveal>
                <div className={styles.productsHeader}>
                  <span className="caption">Catalogue</span>
                  <h2 className="h2">Explore Our Ranges</h2>
                  <p className={styles.limitedDesc} style={{ color: 'var(--muted)', marginTop: '8px' }}>
                    Discover the worlds we are building.
                  </p>
                </div>
              </ScrollReveal>
              <div className={styles.productsGrid}>
                {featuredDropProducts.map((product, i) => (
                  <ProductCard key={product.id} product={product} index={i} />
                ))}
              </div>
              <ScrollReveal delay={200}>
                <div className={styles.productsCta}>
                  <Link href="/drops" className="btn btn-secondary" id="explore-ranges-cta">
                    View All Pieces
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </ScrollReveal>
            </div>
          </section>
        )}

        {/* 5. Philosophy / Our Story */}
        <section className={styles.editorial} id="editorial">
          <div className={styles.editorialImageWrap}>
            <Image
              src="/images/campaign/editorial-02.png"
              alt="GODSMOVE Editorial"
              fill
              className={styles.editorialImage}
              sizes="100vw"
            />
            <div className={styles.editorialOverlay} />
          </div>
          <div className={styles.editorialContent}>
            <ScrollReveal>
              <span className="caption" style={{ color: 'var(--fog)' }}>
                Philosophy
              </span>
              <h2 className={styles.editorialQuote}>
                Nothing is accidental. Every design carries meaning.
              </h2>
              <Link href="/our-story" className={`btn btn-secondary ${styles.editorialCta}`}>
                Read Our Story
              </Link>
            </ScrollReveal>
          </div>
        </section>

        {/* 6. Newsletter */}
        <section className={styles.newsletter} id="newsletter">
          <div className="container">
            <ScrollReveal>
              <div className={styles.nlInner}>
                <h2 className="h2">Get Early Access.</h2>
                <p className={styles.nlDesc}>Be first when the next move drops.</p>
                <form className={styles.nlForm} action="/api/newsletter" method="POST">
                  <input
                    type="email"
                    name="email"
                    placeholder="your@email.com"
                    className={styles.nlInput}
                    id="newsletter-email"
                    aria-label="Email for newsletter"
                  />
                  <button type="submit" className="btn btn-primary" id="newsletter-submit">
                    Join the Inner Circle
                  </button>
                </form>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </main>

      {/* 7. Footer */}
      <Footer />
    </>
  );
}
