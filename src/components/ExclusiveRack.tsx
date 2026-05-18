'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './ExclusiveRack.module.css';
import ExclusiveRackImage from './ExclusiveRackImage';

export type ExclusiveRackProduct = {
  id: string;
  name: string;
  slug: string;
  shortDesc?: string | null;
  description?: string;
  tagline?: string | null;
  symbolism?: string | null;
  enableImageToggle?: boolean;
  frontImageUrl?: string | null;
  backImageUrl?: string | null;
  defaultImageSide?: 'front' | 'back' | string;
  images?: { url: string }[];
  variants?: { size: string; price?: number }[];
};

interface ExclusiveRackProps {
  products: ExclusiveRackProduct[];
}

const HIGHLIGHTS = [
  { title: 'Limited Allocation', copy: 'Reserved exclusively for individual ownership.' },
  { title: 'Statement Piece', copy: 'Designed to command attention in any room.' },
  { title: 'One Per Customer', copy: "Scarcity enforced. Once it's gone, it's gone." },
  { title: 'Built with Intent', copy: 'No coincidence. Everything means something.' },
] as const;

export default function ExclusiveRack({ products }: ExclusiveRackProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!products?.length) return null;

  const product = products[activeIndex] ?? products[0];
  const hasMultiple = products.length > 1;

  const goTo = useCallback(
    (index: number) => {
      if (index < 0) {
        setActiveIndex(products.length - 1);
        return;
      }
      if (index >= products.length) {
        setActiveIndex(0);
        return;
      }
      setActiveIndex(index);
    },
    [products.length]
  );

  const variant = product.variants?.[0];
  const price = variant?.price != null ? Number(variant.price) : null;

  return (
    <section className={styles.section} id="exclusive-rack" aria-label="Exclusive Rack">
      <div className="container">
        <div className={styles.layout}>
          <div className={styles.leftCol}>
            <span className={styles.label}>EXCLUSIVE RACK</span>
            {hasMultiple && (
              <span className={styles.indexBadge}>
                {String(activeIndex + 1).padStart(2, '0')} / {String(products.length).padStart(2, '0')}
              </span>
            )}
            <h2 className={styles.headline}>
              Icons.
              <br />
              Not for
              <br />
              Everyone.
            </h2>
            <p className={styles.copy}>
              Exceptional pieces for a rare breed.
              <br />
              Designed with intent. Worn with purpose.
            </p>
            <Link
              href={`/product/${product.slug}`}
              className={`btn btn-primary ${styles.cta}`}
              id="exclusive-cta"
            >
              MAKE IT YOURS!
            </Link>

            {hasMultiple && (
              <div className={styles.carouselNav} aria-label="Exclusive Rack navigation">
                <button
                  type="button"
                  className={styles.navBtn}
                  onClick={() => goTo(activeIndex - 1)}
                  aria-label="Previous piece"
                >
                  <ChevronLeft size={18} />
                </button>
                <div className={styles.navDots}>
                  {products.map((p, i) => (
                    <button
                      key={p.id}
                      type="button"
                      className={`${styles.navDot} ${i === activeIndex ? styles.navDotActive : ''}`}
                      onClick={() => goTo(i)}
                      aria-label={`View ${p.name}`}
                      aria-current={i === activeIndex ? 'true' : undefined}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className={styles.navBtn}
                  onClick={() => goTo(activeIndex + 1)}
                  aria-label="Next piece"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </div>

          <div className={styles.centerCol}>
            <div className={styles.haloRing} />
            <div className={styles.imageWrap} key={product.id}>
              <ExclusiveRackImage product={product} />
            </div>
            <div className={styles.shadow} />
          </div>

          <div className={styles.rightCol}>
            <h3 className={styles.productName}>{product.name}</h3>
            {product.tagline && <p className={styles.tagline}>{product.tagline}</p>}
            <p className={styles.shortDesc}>
              {product.shortDesc ||
                (product.description && product.description.slice(0, 120) + '...')}
            </p>
            {price != null && (
              <p className={styles.price}>₹{price.toLocaleString('en-IN')}</p>
            )}

            <ul className={styles.highlights}>
              {HIGHLIGHTS.map((item) => (
                <li key={item.title}>
                  <strong>{item.title}</strong>
                  <span>{item.copy}</span>
                </li>
              ))}
            </ul>

            {product.symbolism && (
              <p className={styles.symbolism}>{product.symbolism}</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
