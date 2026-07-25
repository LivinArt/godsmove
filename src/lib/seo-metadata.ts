import { Metadata } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.godsmove.in';
const SITE_NAME = 'GODSMOVE';

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
  const canonicalUrl = `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  const metaTitle = title.includes(SITE_NAME) ? title : `${title} — ${SITE_NAME}`;
  const ogImageUrl = image || `${BASE_URL}/images/campaign/editorial-01.png`;

  const defaultKeywords = [
    'GODSMOVE',
    'luxury streetwear',
    'Indian streetwear',
    'oversized t-shirts',
    'drop shoulder tees',
    'architectural wear',
    'decisive creators',
    'premium apparel India',
  ];

  const mergedKeywords = Array.from(new Set([...keywords, ...defaultKeywords]));

  return {
    title: metaTitle,
    description,
    keywords: mergedKeywords,
    metadataBase: new URL(BASE_URL),
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: metaTitle,
      description,
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
      description,
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
