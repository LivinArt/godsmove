import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import JsonLd from '@/components/JsonLd';
import { getArchivePostBySlug, getRelatedArticles } from '@/actions/editorial.actions';
import { prisma } from '@/lib/prisma';
import { constructMetadata } from '@/lib/seo-metadata';
import { getBreadcrumbSchema } from '@/lib/json-ld';
import styles from './page.module.css';

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArchivePostBySlug(slug);

  if (!article || article.status !== 'PUBLISHED') {
    return constructMetadata({
      title: 'Article Not Found | GODSMOVE Library',
      description: 'The requested GODSMOVE Library article does not exist or is not available.',
      noIndex: true,
    });
  }

  const metaTitle = article.seoTitle || `${article.title} | GODSMOVE Library`;
  const metaDesc = article.seoDescription || article.excerpt;
  const canonicalUrl = article.canonicalUrl || `https://www.godsmove.in/library/${slug}`;
  const ogImg = article.ogImage || article.coverImage || 'https://www.godsmove.in/images/campaign/editorial-01.png';

  return {
    title: metaTitle,
    description: metaDesc,
    keywords: article.seoKeywords?.length ? article.seoKeywords : ['GODSMOVE Library', article.category || 'Craftsmanship'],
    metadataBase: new URL('https://www.godsmove.in'),
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: article.ogTitle || metaTitle,
      description: article.ogDescription || metaDesc,
      url: canonicalUrl,
      siteName: 'GODSMOVE Library',
      locale: 'en_IN',
      type: 'article',
      publishedTime: article.publishedAt?.toISOString(),
      modifiedTime: article.updatedAt.toISOString(),
      authors: [article.authorName || 'GODSMOVE Editorial'],
      images: [{ url: ogImg, width: 1200, height: 630, alt: article.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.ogTitle || metaTitle,
      description: article.ogDescription || metaDesc,
      images: [ogImg],
    },
    ...(article.noIndex ? { robots: { index: false, follow: false } } : {}),
  };
}

export default async function ArticleDetailPage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = await getArchivePostBySlug(slug);

  if (!article || article.status !== 'PUBLISHED') {
    notFound();
  }

  // Parse modular content blocks
  const blocks = Array.isArray(article.contentBlocks) ? (article.contentBlocks as any[]) : [];
  
  // Extract product references IDs to fetch real-time DB data
  const productIds = blocks
    .filter((b) => b.type === 'productRef' && b.productId)
    .map((b) => b.productId);

  const dbProducts = productIds.length > 0
    ? await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          isPreBooking: true,
          variants: {
            take: 1,
            select: { price: true },
          },
          images: {
            take: 1,
            select: { url: true, alt: true },
          },
        },
      })
    : [];

  const productsMap = new Map(dbProducts.map((p) => [p.id, p]));

  // Related stories
  const relatedArticles = await getRelatedArticles(slug, article.category, 3);

  // Structured Data (schema.org/Article)
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://www.godsmove.in/library/${slug}`,
    },
    headline: article.title,
    description: article.excerpt,
    image: [article.coverImage || 'https://www.godsmove.in/images/campaign/editorial-01.png'],
    datePublished: article.publishedAt ? article.publishedAt.toISOString() : article.createdAt.toISOString(),
    dateModified: article.updatedAt.toISOString(),
    author: {
      '@type': 'Organization',
      name: article.authorName || 'GODSMOVE Editorial',
      url: 'https://www.godsmove.in',
    },
    publisher: {
      '@type': 'Organization',
      name: 'GODSMOVE',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.godsmove.in/images/logo/logo-horizontal-white.png',
      },
    },
  };

  const breadcrumbJsonLd = getBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'GODSMOVE Library', url: '/library' },
    { name: article.category || 'Stories', url: `/library?category=${article.category || 'STORIES'}` },
    { name: article.title, url: `/library/${slug}` },
  ]);

  return (
    <>
      <JsonLd schema={articleJsonLd} />
      <JsonLd schema={breadcrumbJsonLd} />

      <Navbar />
      <CartDrawer />

      <main className={styles.articlePage}>
        <article className={styles.articleContainer}>
          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className={styles.breadcrumbs}>
            <Link href="/">Home</Link>
            <span className={styles.bcSep}>/</span>
            <Link href="/library">GODSMOVE Library</Link>
            <span className={styles.bcSep}>/</span>
            <span className={styles.bcCurrent}>{article.category || 'Stories'}</span>
          </nav>

          {/* Article Header */}
          <header className={styles.header}>
            <div className={styles.metaRow}>
              <span className={styles.categoryBadge}>{article.category || 'STORIES'}</span>
              <span className={styles.dot}>•</span>
              <span className={styles.readingTime}>{article.readingTime || '3 min read'}</span>
            </div>

            <h1 className={styles.title}>{article.title}</h1>

            {article.subtitle && <p className={styles.subtitle}>{article.subtitle}</p>}

            <div className={styles.authorBar}>
              <div className={styles.authorInfo}>
                <span className={styles.authorName}>By {article.authorName || 'GODSMOVE Editorial'}</span>
                <span className={styles.authorDate}>
                  Published on{' '}
                  {new Intl.DateTimeFormat('en-IN', { month: 'long', day: 'numeric', year: 'numeric' }).format(
                    new Date(article.publishedAt || article.createdAt)
                  )}
                </span>
              </div>
            </div>
          </header>

          {/* Cover Image */}
          {article.coverImage && (
            <div className={styles.coverWrap}>
              <Image
                src={article.coverImage}
                alt={article.title}
                fill
                priority
                className={styles.coverImg}
                sizes="(max-width: 1024px) 100vw, 840px"
              />
            </div>
          )}

          {/* Lead Excerpt */}
          <div className={styles.leadExcerpt}>{article.excerpt}</div>

          {/* Article Blocks Renderer */}
          <div className={styles.contentBody}>
            {blocks.length === 0 && article.body && (
              <div className={styles.textBlock}>
                {article.body.split('\n\n').map((paragraph, idx) => (
                  <p key={idx}>{paragraph}</p>
                ))}
              </div>
            )}

            {blocks.map((block) => {
              if (block.type === 'text') {
                return (
                  <div key={block.id} className={styles.textBlock}>
                    {block.heading && <h2 className={styles.blockHeading}>{block.heading}</h2>}
                    {block.text &&
                      block.text.split('\n\n').map((p: string, pIdx: number) => (
                        <p key={pIdx}>{p}</p>
                      ))}
                  </div>
                );
              }

              if (block.type === 'image' && block.url) {
                return (
                  <figure key={block.id} className={styles.imageBlock}>
                    <div className={styles.inlineImageWrap}>
                      <Image
                        src={block.url}
                        alt={block.alt || article.title}
                        width={840}
                        height={500}
                        className={styles.inlineImg}
                      />
                    </div>
                    {(block.caption || block.credit) && (
                      <figcaption className={styles.caption}>
                        {block.caption} {block.credit && <span className={styles.credit}>Photo: {block.credit}</span>}
                      </figcaption>
                    )}
                  </figure>
                );
              }

              if (block.type === 'quote' && block.quote) {
                return (
                  <blockquote key={block.id} className={styles.quoteBlock}>
                    <p className={styles.quoteText}>&ldquo;{block.quote}&rdquo;</p>
                    {block.attribution && (
                      <cite className={styles.quoteCite}>
                        — {block.attribution} {block.source && <span>({block.source})</span>}
                      </cite>
                    )}
                  </blockquote>
                );
              }

              if (block.type === 'cta') {
                return (
                  <div key={block.id} className={styles.ctaBlock}>
                    {block.eyebrow && <span className={styles.ctaEyebrow}>{block.eyebrow}</span>}
                    {block.heading && <h3 className={styles.ctaHeading}>{block.heading}</h3>}
                    {block.buttonText && block.targetUrl && (
                      <Link href={block.targetUrl} className={styles.ctaBtn}>
                        {block.buttonText} →
                      </Link>
                    )}
                  </div>
                );
              }

              if (block.type === 'productRef' && block.productId) {
                const product = productsMap.get(block.productId);
                if (!product) return null;

                const primaryImg = product.images[0]?.url || '/images/campaign/editorial-01.png';
                const price = Number(product.variants[0]?.price || 0);

                return (
                  <div key={block.id} className={styles.productRefCard}>
                    <div className={styles.pRefImgWrap}>
                      <Image src={primaryImg} alt={product.name} fill className={styles.pRefImg} />
                    </div>
                    <div className={styles.pRefContent}>
                      <span className={styles.pRefTag}>REFERENCED PRODUCT</span>
                      <h4 className={styles.pRefName}>{product.name}</h4>
                      <p className={styles.pRefPrice}>₹{price.toLocaleString('en-IN')}</p>
                      <Link href={`/product/${product.slug}`} className={styles.pRefBtn}>
                        View Product →
                      </Link>
                    </div>
                  </div>
                );
              }

              return null;
            })}
          </div>

          {/* Related Articles */}
          {relatedArticles.length > 0 && (
            <section className={styles.relatedSection}>
              <h2 className={styles.relatedTitle}>RELATED STORIES</h2>
              <div className={styles.relatedGrid}>
                {relatedArticles.map((rel) => (
                  <article key={rel.id} className={styles.relatedCard}>
                    <Link href={`/library/${rel.slug}`} className={styles.relImgLink}>
                      <div className={styles.relImgWrap}>
                        <Image
                          src={rel.coverImage || '/images/campaign/editorial-01.png'}
                          alt={rel.title}
                          fill
                          className={styles.relImg}
                        />
                      </div>
                    </Link>
                    <div className={styles.relBody}>
                      <span className={styles.relCategory}>{rel.category || 'STORIES'}</span>
                      <h3 className={styles.relCardTitle}>
                        <Link href={`/library/${rel.slug}`}>{rel.title}</Link>
                      </h3>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
        </article>
      </main>

      <Footer />
    </>
  );
}
