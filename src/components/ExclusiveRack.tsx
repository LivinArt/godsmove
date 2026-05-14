import Link from 'next/link';
import styles from './ExclusiveRack.module.css';
import ExclusiveRackImage from './ExclusiveRackImage';

interface ExclusiveRackProps {
  products: any[];
}

export default function ExclusiveRack({ products }: ExclusiveRackProps) {
  if (!products || products.length === 0) return null;

  // Render the first product as the signature piece
  const product = products[0];

  return (
    <section className={styles.section} id="exclusive-rack">
      <div className="container">
        <div className={styles.layout}>
          
          {/* Left Column */}
          <div className={styles.leftCol}>
            <span className={styles.label}>EXCLUSIVE RACK</span>
            <h2 className={styles.headline}>
              Icons.<br />Not for<br />Everyone.
            </h2>
            <p className={styles.copy}>
              Exceptional pieces for a rare breed.<br />
              Designed with intent. Worn with purpose.
            </p>
            <Link href={`/product/${product.slug}`} className={`btn btn-primary ${styles.cta}`} id="exclusive-cta">
              MAKE IT YOURS!
            </Link>
          </div>

          {/* Center Column */}
          <div className={styles.centerCol}>
            <div className={styles.haloRing} />
            <div className={styles.imageWrap}>
              <ExclusiveRackImage product={product} />
            </div>
            <div className={styles.shadow} />
          </div>


          {/* Right Column */}
          <div className={styles.rightCol}>
            <h3 className={styles.productName}>{product.name}</h3>
            <p className={styles.shortDesc}>{product.shortDesc || (product.description && product.description.slice(0, 100) + '...')}</p>
            
            <ul className={styles.highlights}>
              <li>
                <strong>Limited Allocation</strong>
                <span>Reserved exclusively for individual ownership.</span>
              </li>
              <li>
                <strong>Statement Piece</strong>
                <span>Designed to command attention in any room.</span>
              </li>
              <li>
                <strong>One Per Customer</strong>
                <span>Scarcity enforced. Once it's gone, it's gone.</span>
              </li>
              <li>
                <strong>Built with Intent</strong>
                <span>No coincidence. Everything means something.</span>
              </li>
            </ul>
          </div>

        </div>
      </div>
    </section>
  );
}
