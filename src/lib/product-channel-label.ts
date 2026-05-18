/** Storefront collection label by merchandising channel */
export function getProductChannelLabel(product: {
  channel?: string;
  drop?: { name?: string } | null;
}): string {
  switch (product.channel) {
    case 'EXCLUSIVE_UNLOCK':
      return 'CLASSIFIED RELEASE';
    case 'EXCLUSIVE_RACK':
      return 'PERMANENT ARCHIVE';
    case 'DROP':
      return product.drop?.name || 'CURRENT COLLECTION';
    default:
      return product.drop?.name || 'CURRENT COLLECTION';
  }
}

export function getProductBreadcrumb(product: { channel?: string }): {
  href: string;
  label: string;
} {
  switch (product.channel) {
    case 'EXCLUSIVE_UNLOCK':
      return { href: '/exclusive-unlock', label: 'Access' };
    case 'EXCLUSIVE_RACK':
      return { href: '/exclusive-rack', label: 'Exclusive Rack' };
    default:
      return { href: '/drops', label: 'Drops' };
  }
}
