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
  title: 'GODSMOVE Library | Stories, Ideas & Craftsmanship',
  description: 'Explore the GODSMOVE Library. Comprehensive editorial articles on garment construction, textile science, craftsmanship, new releases, and design philosophy.',
  path: '/library',
  keywords: [
    'GODSMOVE Library',
    'garment craftsmanship',
    'textile design India',
    'fashion education',
    'clothing philosophy',
    'behind the scenes GODSMOVE',
  ],
});

const CATEGORIES = [
  'ALL',
  'CRAFTSMANSHIP',
  'NEW RELEASES',
  'COLLECTIONS',
  'GARMENT KNOWLEDGE',
  'DESIGN',
  'STORIES',
  'CULTURE',
];

interface LibraryPageProps {
  searchParams: Promise<{ category?: string }>;
}

export default async function LibraryPage({ searchParams }: LibraryPageProps) {
  const { category = 'ALL' } = await searchParams;

  const dbPosts = await getArchivePosts({
    status: 'PUBLISHED',
    category: category !== 'ALL' ? category : undefined,
    take: 30,
  }).catch(() => []);

  // Combine DB posts with fallback archiveEntries if DB is empty
  const articles =
    dbPosts && dbPosts.length > 0
      ? dbPosts.map((post: any) => ({
          id: post.id,
          title: post.title,
          subtitle: post.subtitle || post.excerpt,
          category: post.category || 'STORIES',
          date: post.publishedAt || post.createdAt,
          excerpt: post.excerpt,
          image: post.coverImage || '/images/campaign/editorial-01.png',
          slug: post.slug,
          readingTime: post.readingTime || '3 min read',
          isFeatured: post.isFeatured,
        }))
      : archiveEntries.map((entry: any) => ({
          id: entry.id,
          title: entry.title,
          subtitle: entry.excerpt,
          category: 'CRAFTSMANSHIP',
          date: new Date(),
          excerpt: entry.excerpt,
          image: entry.image || '/images/campaign/editorial-01.png',
          slug: entry.slug || entry.id,
          readingTime: '3 min read',
          isFeatured: false,
        }));

  const featuredArticle = articles.find((a) => a.isFeatured) || articles[0];
  const remainingArticles = articles.filter((a) => a.id !== featuredArticle?.id);

  return (
    <>
      <Navbar />
      <CartDrawer />

      <main className={styles.libraryContainer}>
        {/* ── LIBRARY HEADER ── */}
        <section className={styles.headerSection}>
          <div className={styles.container}>
            <ScrollReveal>
              <div className={styles.headerMeta}>
                <span className={styles.badge}>PUBLIC EDITORIAL ARCHIVE</span>
                <span className={styles.edition}>VOLUME 2026</span>
              </div>
              <h1 className={styles.title}>GODSMOVE LIBRARY</h1>
              <p className={styles.lead}>
                Stories, ideas, textile science, and craftsmanship from GODSMOVE. 
                Fragments from the process of designing garments built with purpose.
              </p>
              <div className={styles.divider} />
            </ScrollReveal>
          </div>
        </section>

        {/* ── TOPIC / CATEGORY FILTER BAR ── */}
        <section className={styles.filterSection}>
          <div className={styles.container}>
            <div className={styles.filterBar}>
              {CATEGORIES.map((cat) => {
                const isActive = (category === 'ALL' && cat === 'ALL') || category === cat;
                return (
                  <Link
                    key={cat}
                    href={cat === 'ALL' ? '/library' : `/library?category=${cat}`}
                    className={`${styles.filterTab} ${isActive ? styles.filterTabActive : ''}`}
                  >
                    {cat}
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── FEATURED HERO ARTICLE ── */}
        {featuredArticle && (
          <section className={styles.featuredSection}>
            <div className={styles.container}>
              <ScrollReveal>
                <div className={styles.featuredCard}>
                  <div className={styles.featuredImageWrap}>
                    <Image
                      src={featuredArticle.image}
                      alt={featuredArticle.title}
                      fill
                      className={styles.featuredImg}
                      priority
                      sizes="(max-width: 1024px) 100vw, 60vw"
                    />
                    <div className={styles.featuredBadge}>FEATURED STORY</div>
                  </div>
                  <div className={styles.featuredContent}>
                    <div className={styles.cardMeta}>
                      <span className={styles.categoryBadge}>{featuredArticle.category}</span>
                      <span className={styles.dot}>•</span>
                      <span className={styles.readingTime}>{featuredArticle.readingTime}</span>
                    </div>
                    <h2 className={styles.featuredTitle}>{featuredArticle.title}</h2>
                    <p className={styles.featuredExcerpt}>{featuredArticle.subtitle || featuredArticle.excerpt}</p>
                    <div className={styles.cardFooter}>
                      <span className={styles.date}>
                        {new Intl.DateTimeFormat('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }).format(
                          new Date(featuredArticle.date)
                        )}
                      </span>
                      <Link href={`/library/${featuredArticle.slug}`} className={styles.readBtn}>
                        Read Story →
                      </Link>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </section>
        )}

        {/* ── LATEST STORIES GRID ── */}
        <section className={styles.gridSection}>
          <div className={styles.container}>
            <ScrollReveal>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>LATEST ARTICLES</h2>
                <span className={styles.countText}>{articles.length} Stories</span>
              </div>
            </ScrollReveal>

            {remainingArticles.length === 0 ? (
              <div className={styles.emptyState}>
                <p>No additional articles found in this category.</p>
              </div>
            ) : (
              <div className={styles.articlesGrid}>
                {remainingArticles.map((art) => (
                  <ScrollReveal key={art.id}>
                    <article className={styles.articleCard}>
                      <Link href={`/library/${art.slug}`} className={styles.cardImgLink}>
                        <div className={styles.cardImgWrap}>
                          <Image
                            src={art.image}
                            alt={art.title}
                            fill
                            className={styles.cardImg}
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          />
                        </div>
                      </Link>
                      <div className={styles.cardBody}>
                        <div className={styles.cardMeta}>
                          <span className={styles.categoryBadge}>{art.category}</span>
                          <span className={styles.dot}>•</span>
                          <span className={styles.readingTime}>{art.readingTime}</span>
                        </div>
                        <h3 className={styles.cardTitle}>
                          <Link href={`/library/${art.slug}`}>{art.title}</Link>
                        </h3>
                        <p className={styles.cardExcerpt}>{art.excerpt}</p>
                        <div className={styles.cardFooter}>
                          <span className={styles.date}>
                            {new Intl.DateTimeFormat('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }).format(
                              new Date(art.date)
                            )}
                          </span>
                          <Link href={`/library/${art.slug}`} className={styles.cardReadLink}>
                            Read Article →
                          </Link>
                        </div>
                      </div>
                    </article>
                  </ScrollReveal>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
