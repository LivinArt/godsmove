import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import styles from './HomepageFeatureCards.module.css';

interface HomepageFeatureCardsProps {
  content?: Record<string, string>;
}

export default function HomepageFeatureCards({ content }: HomepageFeatureCardsProps) {
  const card1Title = content?.feature_card_1_title || 'DROPS';
  const card1Desc = content?.feature_card_1_desc || 'Discover the latest limited releases.';
  const card1Image = content?.feature_card_1_image || '/images/campaign/editorial-01.png';

  const card2Title = content?.feature_card_2_title || 'EXCLUSIVE RACK';
  const card2Desc = content?.feature_card_2_desc || 'Reserved pieces available only to verified members.';
  const card2Image = content?.feature_card_2_image || '/images/campaign/editorial-02.png';

  return (
    <section className={styles.section} id="discover-godsmove">
      {/* 1. Full-Width Edge-to-Edge Split Editorial Banner */}
      <div className={styles.splitBanner}>
        {/* Left Half: DROPS */}
        <Link href="/drops" className={`${styles.panel} ${styles.panelDrops}`}>
          <div className={styles.imageWrap}>
            <Image
              src={card1Image}
              alt={card1Title}
              fill
              sizes="(max-width: 768px) 50vw, 50vw"
              className={styles.image}
              priority
            />
            <div className={styles.overlayDrops} />
          </div>
          <div className={styles.panelContent}>
            <h3 className={styles.titleDrops}>{card1Title}</h3>
            <p className={styles.descDrops}>{card1Desc}</p>
            <span className={styles.ctaDrops}>
              EXPLORE <ArrowRight size={14} className={styles.ctaIconDrops} />
            </span>
          </div>
        </Link>

        {/* Thin Center Divider Line */}
        <div className={styles.divider} />

        {/* Right Half: EXCLUSIVE RACK */}
        <Link href="/exclusive-rack" className={`${styles.panel} ${styles.panelExclusive}`}>
          <div className={styles.imageWrap}>
            <Image
              src={card2Image}
              alt={card2Title}
              fill
              sizes="(max-width: 768px) 50vw, 50vw"
              className={styles.image}
            />
            <div className={styles.overlayExclusive} />
          </div>
          <div className={styles.panelContent}>
            <span className={styles.smallLabel}>PRIVATE ACCESS</span>
            <h3 className={styles.titleExclusive}>{card2Title}</h3>
            <p className={styles.descExclusive}>{card2Desc}</p>
            <span className={styles.ctaExclusive}>
              ENTER THE RACK <ArrowRight size={14} className={styles.ctaIconExclusive} />
            </span>
          </div>
        </Link>
      </div>
    </section>
  );
}
