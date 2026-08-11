import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

// Prisma 7 requires a driver adapter for PostgreSQL (Rust-free client engine)
// Using @prisma/adapter-pg with the transaction pooler URL from Supabase
// https://pris.ly/d/adapter-pg

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    // During build time without DB — return a placeholder (pages using Prisma will fail at runtime, not build time)
    throw new Error(
      'DATABASE_URL environment variable is not set. ' +
      'Please configure your Supabase connection string in .env.local'
    );
  }

  const adapter = new PrismaPg({ connectionString });

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });
}

// Singleton — prevents connection exhaustion in serverless/hot-reload and build workers
export const prisma = global.prisma ?? createPrismaClient();

if (!global.prisma) {
  global.prisma = prisma;
  if (process.env.NODE_ENV === 'development') {
    const fields = Object.keys((prisma as any).profile?.fields || {});
    console.log(`[PROFILE PRISMA RUNTIME DIAGNOSTIC] gender field present in model: ${fields.includes('gender')}`);
  }
}
