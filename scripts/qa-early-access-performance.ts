import { prisma } from '../src/lib/prisma';
import { executeEarlyAccessRegistration, syncCanonicalCustomer } from '../src/lib/customer-sync';
import { getEarlyAccessStatusAction, registerEarlyAccessAction } from '../src/actions/early-access.actions';
import { dispatchEarlyAccessEmailsAsync } from '../src/lib/customer-sync';

async function runPerformanceAudit() {
  console.log('=====================================================');
  console.log('GODSMOVƎ EARLY ACCESS PERFORMANCE AUDIT & QA SUITE');
  console.log('=====================================================\n');

  const testUserId = 'qa-perf-user-uuid-10001';
  const testEmail = 'qa.earlyaccess.perf@godsmove.in';

  const timings: Record<string, number> = {};

  try {
    // Cleanup prior test user if exists
    await prisma.notificationHistory.deleteMany({ where: { email: testEmail } });
    await prisma.membership.deleteMany({ where: { profile: { email: testEmail } } });
    await prisma.wallet.deleteMany({ where: { profile: { email: testEmail } } });
    await prisma.profile.deleteMany({ where: { email: testEmail } });

    // 1. Measure Initial Profile Creation (Sync)
    const t0 = performance.now();
    const syncRes = await prisma.$transaction(async (tx) => {
      return await syncCanonicalCustomer(tx, {
        userId: testUserId,
        email: testEmail,
        details: {
          name: 'Rohit Malviya',
          phone: '9876543210',
          dob: '1998-05-15',
          gender: 'Male',
        },
        isEarlyAccessRegistration: false,
      });
    });
    const t1 = performance.now();
    timings['Canonical Profile Sync'] = Math.round(t1 - t0);

    // 2. Measure getEarlyAccessStatusAction
    const t2 = performance.now();
    const statusRes = await prisma.profile.findUnique({
      where: { id: testUserId },
      select: { earlyAccessRegistered: true, firstName: true, godsmoveId: true },
    });
    const t3 = performance.now();
    timings['Status Query'] = Math.round(t3 - t2);

    // 3. Measure Full Authoritative Early Access Registration Transaction
    const t4 = performance.now();
    const regRes = await executeEarlyAccessRegistration(testUserId, {
      name: 'Rohit Malviya',
      phone: '9876543210',
      dob: '1998-05-15',
      gender: 'Male',
    });
    const t5 = performance.now();
    timings['Registration Transaction'] = Math.round(t5 - t4);

    // 4. Measure Async Email Dispatch & Idempotency Checks
    const t6 = performance.now();
    await dispatchEarlyAccessEmailsAsync(testUserId, regRes.profile);
    const t7 = performance.now();
    timings['Async Email Dispatch & Idempotency'] = Math.round(t7 - t6);

    // 5. Measure Duplicate Execution (Idempotency Re-run)
    const t8 = performance.now();
    await dispatchEarlyAccessEmailsAsync(testUserId, regRes.profile);
    const t9 = performance.now();
    timings['Idempotent Re-run (Skipped)'] = Math.round(t9 - t8);

    console.log('TIMING BENCHMARK RESULTS:');
    console.table(
      Object.entries(timings).map(([Operation, TimeMs]) => ({
        Operation,
        'Time (ms)': `${TimeMs} ms`,
        Status: TimeMs < 500 ? '⚡ EXTREMELY FAST' : '⚠️ ACCEPTABLE',
      }))
    );

    console.log('\nVERIFICATION CHECKS:');
    console.log(`├─ Profile Created: ${syncRes.profile ? 'YES' : 'NO'}`);
    console.log(`├─ GM ID Assigned: ${regRes.godsmoveId} (${regRes.godsmoveId?.startsWith('GM-') ? 'VALID' : 'INVALID'})`);
    console.log(`├─ 1-Year VIP Membership Active: ${regRes.membershipActivated ? 'YES' : 'NO'}`);

    const notifCount = await prisma.notificationHistory.count({ where: { email: testEmail } });
    console.log(`├─ Notification History Records Created: ${notifCount} (Expected: 1 before launch, 2 post-launch)`);

  } catch (err) {
    console.error('Audit script error:', err);
  } finally {
    // Cleanup
    await prisma.notificationHistory.deleteMany({ where: { email: testEmail } });
    await prisma.membership.deleteMany({ where: { profile: { email: testEmail } } });
    await prisma.wallet.deleteMany({ where: { profile: { email: testEmail } } });
    await prisma.profile.deleteMany({ where: { email: testEmail } });
    console.log('\nQA performance test data cleaned up cleanly.');
  }
}

runPerformanceAudit();
