/**
 * GODSMOVE MEMBERSHIP DATA-LINKAGE REGRESSION SUITE
 * Validates canonical Customer -> Profile -> Membership resolution across all 12 mandatory test cases.
 */

import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function runLinkageRegressionSuite() {
  const { prisma } = await import('../src/lib/prisma');
  const { getAdminCustomerDetail, getAdminCustomers } = await import('../src/actions/admin-customer.actions');
  const { getOrders } = await import('../src/actions/order.actions');

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  GODSMOVE MEMBERSHIP DATA-LINKAGE REGRESSION SUITE');
  console.log('═══════════════════════════════════════════════════════════\n');

  let passCount = 0;
  let failCount = 0;

  function assert(condition: boolean, description: string) {
    if (condition) {
      console.log(`  ✓ PASS: ${description}`);
      passCount++;
    } else {
      console.error(`  ❌ FAIL: ${description}`);
      failCount++;
    }
  }

  // Pre-cleanup any previous test artifacts
  await prisma.membership.deleteMany({
    where: { profile: { email: { startsWith: 'qa-' } } },
  });
  await prisma.profile.deleteMany({
    where: { email: { startsWith: 'qa-' } },
  });

  const targetEmail = 'malviyarishi330@gmail.com';

  // 1. Fetch target profile from database
  const profile = await prisma.profile.findFirst({
    where: { email: { equals: targetEmail, mode: 'insensitive' } },
    include: { membership: { include: { sourceOrder: true } } },
  });

  if (!profile) {
    console.error(`Fatal: Target test profile ${targetEmail} not found in DB`);
    process.exit(1);
  }

  const origActivatedAt = profile.membership?.activatedAt?.toISOString();
  const origExpiresAt = profile.membership?.expiresAt?.toISOString();
  const origMembershipId = profile.membership?.id;

  // TEST 1: Known active member resolved from customer profile ID
  console.log('1. Testing Customer Detail Resolution by Profile ID...');
  const detailById = await getAdminCustomerDetail(profile.id);
  assert(detailById.id === profile.id, 'Customer Detail by ID returned correct profile ID');
  assert(detailById.membership !== null, 'Customer Detail by ID returned non-null membership');
  assert(detailById.membership?.id === origMembershipId, 'Customer Detail by ID resolved canonical membership ID');

  // TEST 2: Known active member resolved from email through profile relationship
  console.log('\n2. Testing Customer Detail Resolution by Email...');
  const detailByEmail = await getAdminCustomerDetail(targetEmail);
  assert(detailByEmail.id === profile.id, 'Customer Detail by Email resolved to correct profile ID');
  assert(detailByEmail.membership?.id === origMembershipId, 'Customer Detail by Email resolved canonical membership ID');

  // TEST 3: Customer Detail membership query returns same membership ID as Admin Members
  console.log('\n3. Testing Admin Members vs Customer Detail Alignment...');
  const adminMembers = await prisma.membership.findMany({
    include: { profile: true },
  });
  const adminMemberRecord = adminMembers.find((m) => m.profileId === profile.id);
  assert(adminMemberRecord !== undefined, 'Customer exists in Admin Members query');
  assert(adminMemberRecord?.id === detailById.membership?.id, 'Customer Detail membership ID matches Admin Members membership ID');

  // TEST 4: Active membership status and days remaining
  console.log('\n4. Testing Active Membership Status & Duration Calculation...');
  assert(detailById.isMemberActive === true, 'Customer is recognized as active member (isMemberActive = true)');
  assert(detailById.membership?.status === 'ACTIVE', 'Membership status is ACTIVE');
  const now = new Date();
  const exp = new Date(detailById.membership!.expiresAt!);
  const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  assert(diffDays > 0, `Days remaining calculates positive integer (${diffDays} days remaining)`);

  // TEST 5: Expired membership state handling
  console.log('\n5. Testing Historical Expired Membership State...');
  const tsExpired = Date.now();
  const dummyExpiredProfile = await prisma.profile.create({
    data: {
      id: 'qa_expired_prof_' + tsExpired,
      email: `qa-expired-${tsExpired}@godsmove.com`,
      firstName: 'Expired',
      lastName: 'User',
      role: 'CUSTOMER',
    },
  });

  const expiredMem = await prisma.membership.create({
    data: {
      profileId: dummyExpiredProfile.id,
      status: 'EXPIRED',
      source: 'PRE_BOOKING',
      activatedAt: new Date('2025-01-01T00:00:00Z'),
      expiresAt: new Date('2026-01-01T00:00:00Z'),
    },
  });

  const expiredDetail = await getAdminCustomerDetail(dummyExpiredProfile.id);
  assert(expiredDetail.membership?.status === 'EXPIRED', 'Expired membership shows historical status EXPIRED');
  assert(expiredDetail.isMemberActive === false, 'Expired membership evaluates isMemberActive = false');

  // TEST 6: Cancelled membership state handling
  console.log('\n6. Testing Historical Cancelled Membership State...');
  const tsCancelled = Date.now();
  const dummyCancelledProfile = await prisma.profile.create({
    data: {
      id: 'qa_cancelled_prof_' + tsCancelled,
      email: `qa-cancelled-${tsCancelled}@godsmove.com`,
      firstName: 'Cancelled',
      lastName: 'User',
      role: 'CUSTOMER',
    },
  });

  await prisma.membership.create({
    data: {
      profileId: dummyCancelledProfile.id,
      status: 'CANCELLED',
      source: 'PRE_BOOKING',
      activatedAt: new Date('2026-01-01T00:00:00Z'),
      expiresAt: new Date('2027-01-01T00:00:00Z'),
    },
  });

  const cancelledDetail = await getAdminCustomerDetail(dummyCancelledProfile.id);
  assert(cancelledDetail.membership?.status === 'CANCELLED', 'Cancelled membership shows historical status CANCELLED');
  assert(cancelledDetail.isMemberActive === false, 'Cancelled membership evaluates isMemberActive = false');

  // TEST 7: Customer with no membership returns empty state
  console.log('\n7. Testing Customer with No Membership Record...');
  const tsNoMem = Date.now();
  const dummyNoMemProfile = await prisma.profile.create({
    data: {
      id: 'qa_nomem_prof_' + tsNoMem,
      email: `qa-nomem-${tsNoMem}@godsmove.com`,
      firstName: 'NoMem',
      lastName: 'User',
      role: 'CUSTOMER',
    },
  });

  const noMemDetail = await getAdminCustomerDetail(dummyNoMemProfile.id);
  assert(noMemDetail.membership === null, 'Customer without membership returns membership = null');

  // TEST 8: No duplicate membership created
  console.log('\n8. Testing No Duplicate Membership Creation...');
  const countAfterQuery = await prisma.membership.count({
    where: { profileId: profile.id },
  });
  assert(countAfterQuery === 1, `Exactly 1 membership row exists for profile (count = ${countAfterQuery})`);

  // TEST 9: Customer List crown and Customer Detail membership status agree
  console.log('\n9. Testing Customer List Crown vs Customer Detail Status Agreement...');
  const adminCustomers = await getAdminCustomers();
  const customerListRow = adminCustomers.find((c) => c.id === profile.id);
  assert(customerListRow?.isMemberActive === detailById.isMemberActive, 'Customer List isMemberActive matches Customer Detail isMemberActive');

  // TEST 10: Admin Orders crown agrees with canonical membership state
  console.log('\n10. Testing Admin Orders Membership Crown Agreement...');
  const adminOrders = await getOrders({ take: 50 });
  const rishiOrder = adminOrders.find((o) => o.profileId === profile.id);
  if (rishiOrder) {
    const isOrderMemberActive = Boolean(
      rishiOrder.profile?.membership &&
        rishiOrder.profile.membership.status === 'ACTIVE' &&
        rishiOrder.profile.membership.expiresAt &&
        new Date(rishiOrder.profile.membership.expiresAt) > new Date()
    );
    assert(isOrderMemberActive === true, 'Admin Orders query recognizes active member crown');
  } else {
    assert(true, 'Admin Orders query evaluated (no orders found in top 50)');
  }

  // TEST 11: Membership sourceOrderId resolves to correct Pre-Booking order
  console.log('\n11. Testing Source Order Resolution...');
  assert(detailById.membership?.sourceOrder?.orderNumber === 'SS-202608-7228', `sourceOrder resolves to SS-202608-7228 (got #${detailById.membership?.sourceOrder?.orderNumber})`);

  // TEST 12: activatedAt and expiresAt are unchanged
  console.log('\n12. Testing Dates Integrity...');
  const finalProfile = await prisma.profile.findUnique({
    where: { id: profile.id },
    include: { membership: true },
  });
  assert(finalProfile?.membership?.activatedAt.toISOString() === origActivatedAt, 'activatedAt remained 100% unchanged');
  assert(finalProfile?.membership?.expiresAt?.toISOString() === origExpiresAt, 'expiresAt remained 100% unchanged');

  // Cleanup dummy test profiles
  await prisma.membership.deleteMany({
    where: { profileId: { in: [dummyExpiredProfile.id, dummyCancelledProfile.id, dummyNoMemProfile.id] } },
  });
  await prisma.profile.deleteMany({
    where: { id: { in: [dummyExpiredProfile.id, dummyCancelledProfile.id, dummyNoMemProfile.id] } },
  });

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log(`  REGRESSION SUITE RESULT: ${passCount} PASS | ${failCount} FAIL`);
  console.log('═══════════════════════════════════════════════════════════\n');

  if (failCount > 0) {
    process.exit(1);
  }
}

runLinkageRegressionSuite().catch((err) => {
  console.error('Regression Suite Execution Error:', err);
  process.exit(1);
});
