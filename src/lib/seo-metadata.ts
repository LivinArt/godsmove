import { Metadata } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.godsmove.in';
const SITE_NAME = 'GODSMOVE';

export function toPlainText(str: string | undefined | null): string {
  if (!str) return '';
  return str
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

interface ConstructMetadataInput {
  title: string;
  description: string;
  path?: string;
  keywords?: string[];
  image?: string | null;
  type?: 'website' | 'article';
  noIndex?: boolean;
}

export function constructMetadata({
  title,
  description,
  path = '',
  keywords = [],
  image,
  type = 'website',
  noIndex = false,
}: ConstructMetadataInput): Metadata {
  const cleanTitle = toPlainText(title);
  const cleanDescription = toPlainText(description);
  const cleanKeywords = keywords.map((k) => toPlainText(k));

  const canonicalUrl = `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  const metaTitle = cleanTitle.includes(SITE_NAME) ? cleanTitle : `${cleanTitle} | ${SITE_NAME}`;
  const ogImageUrl = image || `${BASE_URL}/images/campaign/editorial-01.png`;

  const defaultKeywords = [
    'GODSMOVE',
    'modern apparel India',
    'premium clothing brands India',
    "men's clothing online",
    'oversized t shirts for men',
    'premium t shirts India',
    'hoodies for men',
    'denim jackets for men',
    'contemporary clothing',
    'craftsmanship apparel',
  ];

  const mergedKeywords = Array.from(new Set([...cleanKeywords, ...defaultKeywords]));

  return {
    title: metaTitle,
    description: cleanDescription,
    keywords: mergedKeywords,
    metadataBase: new URL(BASE_URL),
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: metaTitle,
      description: cleanDescription,
      url: canonicalUrl,
      siteName: SITE_NAME,
      locale: 'en_IN',
      type,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: metaTitle,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: metaTitle,
      description: cleanDescription,
      images: [ogImageUrl],
    },
    ...(noIndex
      ? {
          robots: {
            index: false,
            follow: false,
          },
        }
      : {}),
  };
}

