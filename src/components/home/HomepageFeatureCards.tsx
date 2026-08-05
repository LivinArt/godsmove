import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import styles from './HomepageFeatureCards.module.css';

interface HomepageFeatureCardsProps {
  content?: Record<string, string>;
}

export default function HomepageFeatureCards({ content }: HomepageFeatureCardsProps) {
  const card1Title = content?.feature_card_1_title || 'DROPS';
  const card1Desc = content?.feature_card_1_desc || 'Discover the latest releases.';
  const card1Image = content?.feature_card_1_image || '/images/campaign/editorial-01.png';

  const card2Title = content?.feature_card_2_title || 'EXCLUSIVE RACK';
  const card2Desc = content?.feature_card_2_desc || 'Reserved for exclusive access.';
  const card2Image = content?.feature_card_2_image || '/images/campaign/editorial-02.png';

  return (
    <section className={styles.section} id="discover-godsmove">
      <div className={styles.splitBanner}>
        {/* Left Panel: DROPS */}
        <Link href="/drops" className={`${styles.panel} ${styles.panelDrops}`} aria-label="Explore Drops Collection">
          <div className={styles.imageWrap}>
            <Image
              src={card1Image}
              alt={card1Title}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className={styles.image}
              priority
            />
            <div className={styles.overlay} />
          </div>
          <div className={styles.panelContent}>
            <span className={styles.eyebrow}>COLLECTION</span>
            <h2 className={styles.title}>{card1Title}</h2>
            <p className={styles.description}>{card1Desc}</p>
            <div className={styles.arrowWrap}>
              <ArrowRight className={styles.arrowIcon} size={18} strokeWidth={1.5} />
            </div>
          </div>
        </Link>

        {/* Ultra-thin 1px Center Divider Line */}
        <div className={styles.divider} />

        {/* Right Panel: EXCLUSIVE RACK */}
        <Link href="/exclusive-rack" className={`${styles.panel} ${styles.panelExclusive}`} aria-label="Enter Exclusive Rack">
          <div className={styles.imageWrap}>
            <Image
              src={card2Image}
              alt={card2Title}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className={styles.image}
            />
            <div className={styles.overlay} />
          </div>
          <div className={styles.panelContent}>
            <span className={styles.eyebrow}>MEMBERS</span>
            <h2 className={styles.title}>{card2Title}</h2>
            <p className={styles.description}>{card2Desc}</p>
            <div className={styles.arrowWrap}>
              <ArrowRight className={styles.arrowIcon} size={18} strokeWidth={1.5} />
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
}
