// Script to elevate a user's role to ADMIN in the database
// Run: node scripts/set-admin-role.mjs <email>

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const targetEmail = process.argv[2];

if (!targetEmail) {
  console.error('Usage: node scripts/set-admin-role.mjs <email>');
  process.exit(1);
}

async function setAdmin() {
  const profile = await prisma.profile.findFirst({
    where: { email: targetEmail },
    select: { id: true, email: true, role: true }
  });

  if (!profile) {
    console.error(`No profile found for email: ${targetEmail}`);
    process.exit(1);
  }

  console.log('Current profile:', profile);

  const updated = await prisma.profile.update({
    where: { id: profile.id },
    data: { role: 'ADMIN' }
  });

  console.log('Updated profile role:', updated.role);
  console.log(`✅ Admin role successfully set for ${targetEmail}`);
}

setAdmin()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
