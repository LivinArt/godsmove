/**
 * centralized image resolver for GODSMOVE storefront.
 * Handles full URLs, relative paths (/uploads, /images), and raw Supabase bucket paths (e.g. starting with products/).
 */

const BUCKET_URL_PREFIX = `${process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fxgbkmuqlizeosvidezm.supabase.co'}/storage/v1/object/public/product-images`;

export function resolveImageUrl(path: string | null | undefined): string {
  if (!path || path === 'null') {
    return '/images/placeholder.svg';
  }

  // If it's already a full HTTP(S) URL, return it
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // If it's an absolute local path (like /images/... or /uploads/...), return it
  if (path.startsWith('/')) {
    return path;
  }

  // If it is a raw path from the bucket (e.g., products/filename.jpg or uploads/filename.jpg), format it
  return `${BUCKET_URL_PREFIX}/${path}`;
}

export interface ResolvedProductImages {
  frontImage: string;
  backImage: string;
}

export function resolveProductImages(product: any): ResolvedProductImages {
  if (!product) {
    return {
      frontImage: '/images/placeholder.svg',
      backImage: '/images/placeholder.svg',
    };
  }

  let front: string | null = null;
  let back: string | null = null;

  // 1. Resolve from images array
  if (Array.isArray(product.images) && product.images.length > 0) {
    // If it's an array of objects like { url: string }
    const firstImg = product.images[0];
    if (typeof firstImg === 'string') {
      front = firstImg;
      if (product.images.length > 1) {
        back = product.images[1];
      }
    } else if (firstImg && typeof firstImg === 'object') {
      // Find the cover image or sort by position
      const cover = product.images.find((img: any) => img.isCover);
      front = cover ? cover.url : firstImg.url;
      
      // Look for a second image for the back/toggle
      const otherImages = product.images.filter((img: any) => img.url !== front);
      if (otherImages.length > 0) {
        back = otherImages[0].url;
      }
    }
  }

  // 2. Fallbacks
  if (!front) {
    front = product.frontImageUrl || product.frontImage || product.thumbnail || product.heroImage || null;
  }

  if (!back) {
    back = product.backImageUrl || product.backImage || null;
  }

  // If back image is still empty, fall back to front image
  if (!back) {
    back = front;
  }

  return {
    frontImage: resolveImageUrl(front),
    backImage: resolveImageUrl(back),
  };
}

const PRODUCT_NAME_IMAGE_MAP: Record<string, string> = {
  'Void Tee': '/images/products/tee-black.png',
  'Static Tee': '/images/products/tee-charcoal.png',
  'Noise Tee': '/images/products/tee-ivory.png',
  'Signal Tee': '/images/products/tee-olive.png',
  'Drift Tee': '/images/products/tee-washed-grey.png',
  'Echo Tee': '/images/products/tee-charcoal.png',
};

export function resolveOrderItemImageUrl(item: any): string {
  if (!item) return '/images/placeholder.svg';
  
  if (item.imageUrl && item.imageUrl !== 'null') {
    return resolveImageUrl(item.imageUrl);
  }
  
  // Try mapping by product name
  if (item.productName && PRODUCT_NAME_IMAGE_MAP[item.productName]) {
    return PRODUCT_NAME_IMAGE_MAP[item.productName];
  }
  
  // Check if product relation is loaded
  if (item.product) {
    return resolveProductImages(item.product).frontImage;
  }
  
  return '/images/placeholder.svg';
}
