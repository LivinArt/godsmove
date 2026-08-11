/**
 * Backfill expiresAt for memberships that were created before the calendar-year expiry fix.
 * Applies exactly one calendar year from each membership's activatedAt date.
 */
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  console.log('=== MEMBERSHIP expiresAt BACKFILL ===\n');

  const memberships = await prisma.membership.findMany({
    where: { expiresAt: null },
    select: { id: true, profileId: true, activatedAt: true, status: true },
  });

  console.log(`Found ${memberships.length} memberships with expiresAt=null`);

  for (const m of memberships) {
    const expDate = new Date(m.activatedAt);
    expDate.setFullYear(expDate.getFullYear() + 1);

    await prisma.membership.update({
      where: { id: m.id },
      data: { expiresAt: expDate },
    });

    console.log(`  ✅ Updated membership ${m.id.slice(-8)}: activatedAt=${m.activatedAt.toISOString().split('T')[0]} → expiresAt=${expDate.toISOString().split('T')[0]}`);
  }

  if (memberships.length === 0) {
    console.log('  No memberships need backfilling.');
  }

  console.log('\n=== BACKFILL COMPLETE ===');
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); prisma.$disconnect(); process.exit(1); });
