import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function inspectPrisma() {
  const { prisma } = await import('../src/lib/prisma');
  const modelKeys = Object.keys(prisma).filter((k) => !k.startsWith('_') && !k.startsWith('$'));
  console.log('Available Prisma Client Models:', modelKeys);
  await prisma.$disconnect();
}

inspectPrisma().catch(console.error);
