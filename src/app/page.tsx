import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ArrowDown } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import ProductCard from '@/components/ProductCard';
import ScrollReveal from '@/components/ScrollReveal';
import ExclusiveRack, { type ExclusiveRackProduct } from '@/components/ExclusiveRack';
import { getStorefrontProducts, getActiveDrop } from '@/actions/storefront.actions';
import styles from './page.module.css';

/** Merchandising must reflect live DB — avoid stale static homepage without rack/unlock products */
export const dynamic = 'force-dynamic';

export default async function Home() {
  const [featuredDropProducts, exclusiveUnlockProducts, exclusiveRackProducts, activeDrop] =
    await Promise.all([
      getStorefrontProducts({ channel: 'DROP', featured: true }),
      getStorefrontProducts({ channel: 'EXCLUSIVE_UNLOCK' }),
      getStorefrontProducts({ channel: 'EXCLUSIVE_RACK' }),
      getActiveDrop(),
    ]);

  const drop001 = activeDrop || {
    name: 'Permanent Collection',
    tagline: 'Always available.',
    description: 'The foundation of the GODSMOVE wardrobe.',
    heroImageUrl: '/images/hero/hero-main.png',
    slug: 'permanent',
  };

  return (
    <>
      <Navbar />
      <CartDrawer />

      <main>
        {/* 1. Hero Section */}
        <section className={styles.hero} id="hero">
          <div className={styles.heroImageWrap}>
            <Image
              src="/images/hero/hero-main.png"
              alt="GODSMOVE Campaign"
              fill
              className={styles.heroImage}
              priority
              sizes="100vw"
            />
            <div className={styles.heroOverlay} />
          </div>

          <div className={styles.heroContent}>
            <div className={styles.heroBadge}>
              <span className="caption">SS26 / {drop001.name}</span>
            </div>
            <h1 className={styles.heroTitle}>
              Doomed<br />to <span className={styles.heroTitleAccent}>Drip.</span>
            </h1>
            <p className={styles.heroSub}>No Coincidence.</p>
            <p className={styles.heroDesc}>
              Every piece is deliberate. Limited in quantity. Heavy in meaning.
            </p>
            <div className={styles.heroCtas}>
              <Link href="/drops" className={`btn btn-primary ${styles.heroCta}`} id="hero-cta">
                Explore the Drop
              </Link>
              <Link
                href="/our-story"
                className={`btn btn-secondary ${styles.heroCtaSecondary}`}
                id="hero-cta-secondary"
              >
                Our Story
              </Link>
            </div>
          </div>

          <div className={styles.heroScroll}>
            <ArrowDown size={16} />
            <span>Scroll</span>
          </div>
        </section>

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
                  <ProductCard key={product.id} product={product} index={i} theme="dark" />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 3. Exclusive Rack */}
        {exclusiveRackProducts.length > 0 && (
          <ExclusiveRack
            products={exclusiveRackProducts as unknown as ExclusiveRackProduct[]}
          />
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
