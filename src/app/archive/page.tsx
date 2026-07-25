import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import ScrollReveal from '@/components/ScrollReveal';
import { getArchivePosts } from '@/actions/editorial.actions';
import { archiveEntries } from '@/data/collections';
import { constructMetadata } from '@/lib/seo-metadata';
import styles from './page.module.css';

export const metadata: Metadata = constructMetadata({
  title: 'The Archive Journal & Editorial — GODSMOVE',
  description: 'Production notes, colour studies, and architectural garment observations. Explore the GODSMOVE editorial journal.',
  path: '/archive',
  keywords: ['GODSMOVE journal', 'fashion editorial', 'colour studies', 'garment observations'],
});

const typeLabels: Record<string, string> = {
  EDITORIAL: 'Editorial',
  MOODBOARD: 'Colour Study',
  OBSERVATION: 'Observation',
  ARTIFACT: 'Process',
  CAMPAIGN: 'Campaign',
  editorial: 'Editorial',
  moodboard: 'Colour Study',
  observation: 'Observation',
  artifact: 'Process',
};

const parseTags = (rawTags: any): string[] => {
  if (Array.isArray(rawTags)) return rawTags;
  if (typeof rawTags === 'string') return rawTags.split(',').map((t) => t.trim()).filter(Boolean);
  return ['Atelier', 'Tailoring'];
};

export default async function ArchivePage() {
  const dbPosts = await getArchivePosts({ status: 'PUBLISHED', take: 12 }).catch(() => []);
  
  // Combine DB posts with fallback archiveEntries if DB is empty
  const articles = (dbPosts && dbPosts.length > 0)
    ? dbPosts.map((post: any) => ({
        id: post.id,
        title: post.title,
        type: post.type,
        date: post.publishedAt || post.createdAt,
        excerpt: post.excerpt,
        image: post.coverImage || '/images/campaign/editorial-01.png',
        tags: parseTags(post.tags),
        slug: post.slug,
      }))
    : archiveEntries.map((entry: any) => ({
        ...entry,
        tags: parseTags(entry.tags),
      }));

  const featuredArticle = articles[0];
  const remainingArticles = articles.slice(1);

  return (
    <>
      <Navbar />
      <CartDrawer />

      <main className={styles.publicationPage}>
        {/* ── PUBLICATION HERO HEADER ── */}
        <section className={styles.publicationHeaderSection}>
          <div className={styles.pubContainer}>
            <ScrollReveal>
              <div className={styles.headerTopMeta}>
                <span className={styles.journalTag}>GODSMOVE GAZETTE & ARCHIVE</span>
                <span className={styles.issueDate}>EDITION 2026</span>
              </div>
              <h1 className={styles.publicationTitle}>INSIDE THE SPHERE</h1>
              <p className={styles.publicationLead}>
                Production notes, textile science, colour studies, and cultural observations. 
                Fragments from the process of making garments that command presence.
              </p>
              <div className={styles.pubHeaderDivider} />
            </ScrollReveal>
          </div>
        </section>

        {/* ── FEATURED EDITORIAL LEAD COVER ARTICLE ── */}
        {featuredArticle && (
          <section className={styles.featuredSection}>
            <div className={styles.pubContainer}>
              <ScrollReveal>
                <div className={styles.featuredArticleCard}>
                  <div className={styles.featuredImageWrap}>
                    <Image
                      src={featuredArticle.image}
                      alt={featuredArticle.title}
                      fill
                      className={styles.featuredImg}
                      priority
                      sizes="(max-width: 1024px) 100vw, 60vw"
                    />
                    <div className={styles.featuredBadge}>FEATURED ARTICLE</div>
                  </div>

                  <div className={styles.featuredContentCol}>
                    <div className={styles.articleMetaRow}>
                      <span className={styles.cardTypeLabel}>
                        {typeLabels[featuredArticle.type] || featuredArticle.type}
                      </span>
                      <span className={styles.dotSeparator}>·</span>
                      <span className={styles.readTime}>4 MIN READ</span>
                    </div>

                    <h2 className={styles.featuredTitle}>{featuredArticle.title}</h2>
                    <p className={styles.featuredExcerpt}>{featuredArticle.excerpt}</p>

                    <div className={styles.tagsRow}>
                      {featuredArticle.tags.map((tag: string) => (
                        <span key={tag} className={styles.tagPill}>#{tag}</span>
                      ))}
                    </div>

                    <div className={styles.featuredCtaRow}>
                      <Link href="/drops" className={styles.readArticleBtn}>
                        EXPLORE FORMULATED ALLOCATIONS →
                      </Link>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </section>
        )}

        {/* ── EDITORIAL ARTICLES GRID ── */}
        <section className={styles.articlesGridSection}>
          <div className={styles.pubContainer}>
            <ScrollReveal>
              <div className={styles.gridHeader}>
                <span className={styles.gridTitleTag}>ARCHIVAL DISPATCHES</span>
                <h2 className={styles.gridMainHeading}>LATEST OBSERVATIONS</h2>
              </div>
            </ScrollReveal>

            <div className={styles.editorialGrid}>
              {remainingArticles.map((entry: any, i: number) => (
                <ScrollReveal key={entry.id || i} delay={i * 60}>
                  <article className={styles.journalCard}>
                    <div className={styles.journalImageWrap}>
                      <Image
                        src={entry.image}
                        alt={entry.title}
                        width={600}
                        height={420}
                        className={styles.journalImg}
                      />
                      <span className={styles.journalCategoryTag}>
                        {typeLabels[entry.type] || entry.type}
                      </span>
                    </div>

                    <div className={styles.journalBody}>
                      <div className={styles.journalMeta}>
                        <span className={styles.journalDate}>
                          {new Date(entry.date).toLocaleDateString('en-IN', { 
                            day: 'numeric', 
                            month: 'short', 
                            year: 'numeric' 
                          })}
                        </span>
                        <span className={styles.dotSeparator}>·</span>
                        <span>ATELIER NOTE</span>
                      </div>

                      <h3 className={styles.journalTitle}>{entry.title}</h3>
                      <p className={styles.journalExcerpt}>{entry.excerpt}</p>

                      <div className={styles.journalCardFooter}>
                        <div className={styles.tagsInline}>
                          {entry.tags.slice(0, 2).map((tag: string) => (
                            <span key={tag} className={styles.tagText}>#{tag}</span>
                          ))}
                        </div>
                        <Link href="/drops" className={styles.discoverLink}>
                          DISCOVER →
                        </Link>
                      </div>
                    </div>
                  </article>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── CONVERSION & SEO LEAD-GEN CTA BANNER ── */}
        <section className={styles.newsletterLeadBanner}>
          <div className={styles.pubContainer}>
            <ScrollReveal>
              <div className={styles.bannerBox}>
                <span className={styles.bannerEyebrow}>PRIVATE ARCHIVE ACCESS</span>
                <h2 className={styles.bannerHeading}>RECEIVE PRIVATE ALLOCATION ALERTS</h2>
                <p className={styles.bannerSubtitle}>
                  Join the GODSMOVE Inner Circle to receive instant notification of future drops, secret unlock codes, and archival releases.
                </p>
                <div className={styles.bannerBtnGroup}>
                  <Link href="/drops" className={styles.bannerGoldBtn}>
                    EXPLORE ACTIVE DROPS
                  </Link>
                  <Link href="/profile" className={styles.bannerOutlineBtn}>
                    JOIN INNER CIRCLE
                  </Link>
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
