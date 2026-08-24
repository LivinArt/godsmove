import { prisma } from '../src/lib/prisma';

async function main() {
  const profiles = await prisma.profile.findMany({
    include: { membership: true },
    orderBy: { createdAt: 'desc' },
  });
  
  console.log(`Total Profiles: ${profiles.length}`);
  const eaProfiles = profiles.filter(p => p.earlyAccessRegistered);
  console.log(`Total Early Access Profiles: ${eaProfiles.length}`);
  
  console.log('\n--- Profiles Detail ---');
  for (const p of profiles) {
    console.log({
      id: p.id,
      email: p.email,
      godsmoveId: p.godsmoveId,
      firstName: p.firstName,
      lastName: p.lastName,
      phone: p.phone,
      dob: p.dob,
      gender: p.gender,
      role: p.role,
      earlyAccessRegistered: p.earlyAccessRegistered,
      membership: p.membership ? { id: p.membership.id, status: p.membership.status, source: p.membership.source, expiresAt: p.membership.expiresAt } : null,
    });
  }
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
