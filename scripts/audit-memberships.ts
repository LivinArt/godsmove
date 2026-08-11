import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  const memberships = await prisma.membership.findMany({
    select: {
      id: true,
      status: true,
      source: true,
      activatedAt: true,
      expiresAt: true,
      profileId: true,
    },
  });
  
  console.log('\n=== MEMBERSHIP AUDIT ===');
  console.log(`Total memberships: ${memberships.length}`);
  for (const m of memberships) {
    const activatedStr = m.activatedAt.toISOString().split('T')[0];
    const expiresStr = m.expiresAt ? m.expiresAt.toISOString().split('T')[0] : 'NOT SET';
    const expectedExpiry = new Date(m.activatedAt);
    expectedExpiry.setFullYear(expectedExpiry.getFullYear() + 1);
    const expectedStr = expectedExpiry.toISOString().split('T')[0];
    
    const isCorrect = m.expiresAt 
      ? (m.expiresAt.getFullYear() === expectedExpiry.getFullYear() &&
         m.expiresAt.getMonth() === expectedExpiry.getMonth() &&
         m.expiresAt.getDate() === expectedExpiry.getDate())
      : false;
    
    console.log(`  ID: ${m.id.slice(-8)} | Status: ${m.status} | Source: ${m.source}`);
    console.log(`    Activated: ${activatedStr} | Expires: ${expiresStr} | Expected: ${expectedStr} | ✅: ${isCorrect}`);
  }

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); prisma.$disconnect(); });
