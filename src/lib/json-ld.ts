const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.godsmove.in';

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function getOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'GODSMOVE',
    url: BASE_URL,
    logo: `${BASE_URL}/images/campaign/editorial-01.png`,
    description: 'GODSMOVE is an Indian luxury streetwear atelier built for decisive creators.',
    sameAs: ['https://instagram.com/godsmove'],
  };
}

export function getWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'GODSMOVE',
    url: BASE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${BASE_URL}/drops?search={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

export function getProductSchema(product: any, primaryImage?: string | null) {
  const baseVariant = product?.variants?.[0];
  const price = baseVariant?.price ? Number(baseVariant.price) : Number(product?.price || 0);
  const imageUrl = primaryImage || `${BASE_URL}/images/placeholder.svg`;

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product?.name || 'GODSMOVE Product',
    description: product?.shortDesc || product?.description || product?.tagline || 'GODSMOVE Statement Piece',
    image: [imageUrl],
    sku: product?.id || product?.slug,
    brand: {
      '@type': 'Brand',
      name: 'GODSMOVE',
    },
    offers: {
      '@type': 'Offer',
      url: `${BASE_URL}/product/${product?.slug || ''}`,
      priceCurrency: 'INR',
      price,
      availability: 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
    },
  };
}

export function getBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${BASE_URL}${item.url.startsWith('/') ? item.url : `/${item.url}`}`,
    })),
  };
}

export function getCollectionSchema(name: string, description: string, path: string, products: any[] = []) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    description,
    url: `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`,
    mainEntity: {
      '@type': 'OfferCatalog',
      name: `${name} Catalog`,
      numberOfItems: products.length,
      itemListElement: products.slice(0, 15).map((p, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        item: {
          '@type': 'Product',
          name: p.name,
          url: `${BASE_URL}/product/${p.slug}`,
          priceCurrency: 'INR',
          price: Number(p.variants?.[0]?.price || p.price || 0),
        },
      })),
    },
  };
}
