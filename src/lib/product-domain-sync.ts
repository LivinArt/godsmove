import type { PrismaClient, ProductChannel, ProductDomain } from '@prisma/client';

/**
 * Canonical mapping: legacy ProductChannel (runtime authority) → ProductDomain (architectural boundary).
 * Keep in sync on writes only; storefront and business logic continue to use `channel` until Phase 2.
 */
const CHANNEL_TO_DOMAIN: Record<ProductChannel, ProductDomain> = {
  DROP: 'PREMIUM_WEAR',
  EXCLUSIVE_RACK: 'EXCLUSIVE_RACK',
  EXCLUSIVE_UNLOCK: 'EXCLUSIVE_UNLOCK',
};

export function domainFromChannel(channel: ProductChannel | string): ProductDomain {
  const mapped = CHANNEL_TO_DOMAIN[channel as ProductChannel];
  if (mapped) return mapped;

  console.warn(
    '[product-domain-sync] Unknown ProductChannel; defaulting domain to PREMIUM_WEAR.',
    { channel: String(channel) }
  );
  return 'PREMIUM_WEAR';
}

/**
 * PostgreSQL snippet: count products where `domain` disagrees with `channel` under the canonical map.
 * Run in SQL editor, admin tooling, or via `countProductChannelDomainMismatches`.
 */
export const PRODUCT_CHANNEL_DOMAIN_DIVERGENCE_COUNT_SQL = `
SELECT COUNT(*)::bigint AS mismatch_count
FROM products
WHERE (channel::text = 'DROP' AND domain::text <> 'PREMIUM_WEAR')
   OR (channel::text = 'EXCLUSIVE_RACK' AND domain::text <> 'EXCLUSIVE_RACK')
   OR (channel::text = 'EXCLUSIVE_UNLOCK' AND domain::text <> 'EXCLUSIVE_UNLOCK');
`.trim();

/** Operational helper: how many rows violate channel↔domain coherence. */
export async function countProductChannelDomainMismatches(
  db: Pick<PrismaClient, '$queryRaw'>
): Promise<number> {
  const rows = await db.$queryRaw<{ mismatch_count: bigint }[]>`
    SELECT COUNT(*)::bigint AS mismatch_count
    FROM products
    WHERE (channel::text = 'DROP' AND domain::text <> 'PREMIUM_WEAR')
       OR (channel::text = 'EXCLUSIVE_RACK' AND domain::text <> 'EXCLUSIVE_RACK')
       OR (channel::text = 'EXCLUSIVE_UNLOCK' AND domain::text <> 'EXCLUSIVE_UNLOCK');
  `;
  return Number(rows[0]?.mismatch_count ?? 0);
}
