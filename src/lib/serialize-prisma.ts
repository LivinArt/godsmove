import { Prisma } from '@prisma/client';

/**
 * serializePrisma — converts non-JSON-serializable Prisma output
 * to plain JavaScript objects safe for passing across the
 * Next.js Server → Client Component boundary.
 *
 * Traverses recursively:
 *   - Prisma.Decimal  → number
 *   - Date            → ISO 8601 string
 */
export function serializePrisma<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }

  // Handle Prisma.Decimal (or Decimal-like objects with s, e, d & toNumber)
  if (
    data instanceof Prisma.Decimal ||
    (typeof data === 'object' &&
      data !== null &&
      's' in data &&
      'e' in data &&
      'd' in data &&
      typeof (data as any).toNumber === 'function')
  ) {
    return (data as any).toNumber() as unknown as T;
  }

  // Handle Date
  if (data instanceof Date) {
    return data.toISOString() as unknown as T;
  }

  // Handle Array
  if (Array.isArray(data)) {
    return data.map((item) => serializePrisma(item)) as unknown as T;
  }

  // Handle Objects
  if (typeof data === 'object' && data !== null) {
    const result: Record<string, any> = {};
    for (const key of Object.keys(data)) {
      result[key] = serializePrisma((data as any)[key]);
    }
    return result as T;
  }

  return data;
}
