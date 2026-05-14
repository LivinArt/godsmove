import { Prisma } from '@prisma/client';

/**
 * serializePrisma — converts non-JSON-serializable Prisma output
 * to plain JavaScript objects safe for passing across the
 * Next.js Server → Client Component boundary.
 *
 * Handles:
 *   - Prisma.Decimal  → number
 *   - Date            → ISO 8601 string
 *
 * Usage:
 *   return serializePrisma(await prisma.product.findMany(...));
 */
export function serializePrisma<T>(data: T): T {
  return JSON.parse(
    JSON.stringify(data, (_key, value) => {
      if (value instanceof Prisma.Decimal) {
        return value.toNumber();
      }
      if (value instanceof Date) {
        return value.toISOString();
      }
      return value;
    })
  );
}
