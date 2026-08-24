import { prisma } from '../src/lib/prisma';
import { execSync } from 'child_process';

async function main() {
  console.log('Applying enum migration...');
  try {
    await prisma.$executeRawUnsafe(`ALTER TYPE "MembershipSource" ADD VALUE IF NOT EXISTS 'EARLY_ACCESS';`);
    console.log('✅ Migration SQL executed successfully.');
  } catch (err: any) {
    console.log('Migration SQL execution notice:', err.message);
  }

  console.log('Regenerating Prisma client...');
  const output = execSync('npx.cmd prisma generate', { encoding: 'utf-8' });
  console.log(output);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
