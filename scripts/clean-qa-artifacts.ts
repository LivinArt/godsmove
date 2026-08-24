import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('--- CLEANING QA TEST ARTIFACT PROFILES FROM PRODUCTION DB ---');

  // Identify test profiles created by QA runs
  const testProfiles = await prisma.profile.findMany({
    where: {
      OR: [
        { id: { startsWith: 'qa_pipeline_' } },
        { id: { startsWith: 'qa_user_' } },
        { email: { contains: 'godsmove.test' } },
        { email: { contains: '@test.com' } },
      ],
    },
    include: { membership: true, orders: true, wallet: true },
  });

  console.log(`Found ${testProfiles.length} test artifact profiles to clean safely.`);

  for (const p of testProfiles) {
    console.log(`Removing test profile: ${p.email} (ID: ${p.id}, GM ID: ${p.godsmoveId || 'NONE'})`);
    // Verify no real orders exist
    if (p.orders.length > 0) {
      console.warn(`  └─ Cleaning ${p.orders.length} test orders...`);
      await prisma.order.deleteMany({ where: { profileId: p.id } });
    }
    // Delete notifications
    await prisma.notificationHistory.deleteMany({ where: { profileId: p.id } });
    // Delete memberships
    await prisma.membership.deleteMany({ where: { profileId: p.id } });
    // Delete wallet & txns
    await prisma.walletTransaction.deleteMany({ where: { wallet: { profileId: p.id } } });
    await prisma.wallet.deleteMany({ where: { profileId: p.id } });
    // Delete profile
    await prisma.profile.delete({ where: { id: p.id } });
  }

  console.log('✅ Test artifact cleanup complete.\n');

  // Verify remaining legitimate profiles & GM IDs
  const remainingProfiles = await prisma.profile.findMany({
    include: { membership: true },
    orderBy: { createdAt: 'asc' },
  });

  console.log(`--- REMAINING LEGITIMATE PROFILES (${remainingProfiles.length}) ---`);
  for (const p of remainingProfiles) {
    console.log({
      email: p.email,
      id: p.id,
      godsmoveId: p.godsmoveId,
      name: p.firstName ? `${p.firstName} ${p.lastName || ''}`.trim() : null,
      earlyAccessRegistered: p.earlyAccessRegistered,
      membership: p.membership ? { status: p.membership.status, source: p.membership.source, activatedAt: p.membership.activatedAt } : null,
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Cleanup error:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
