import { prisma } from '../src/lib/prisma';
import { getOfficialLaunchDate, calculateMembershipExpiry, isStoreLaunched } from '../src/lib/launch-config';

async function runReconciliation() {
  const isExecute = process.argv.includes('--execute');
  const isDryRun = !isExecute;

  console.log(`====================================================================`);
  console.log(`🔍 GODSMOVƎ EARLY ACCESS MEMBERSHIP RECONCILIATION SCRIPT`);
  console.log(`MODE: ${isDryRun ? 'DRY-RUN (NO DB MUTATIONS)' : 'EXECUTE (DATABASE MUTATIONS ENABLED)'}`);
  console.log(`CANONICAL LAUNCH DATE: ${getOfficialLaunchDate().toISOString()}`);
  console.log(`====================================================================\n`);

  const launchDate = getOfficialLaunchDate();
  const launchExpiry = calculateMembershipExpiry(launchDate);
  const now = new Date();
  const storeLaunched = isStoreLaunched(now);

  // Fetch all Early Access profiles
  const eaProfiles = await prisma.profile.findMany({
    where: { earlyAccessRegistered: true },
    include: {
      membership: true,
      wallet: { include: { transactions: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  console.log(`Found ${eaProfiles.length} Early Access customer record(s) in database.\n`);

  const tableData: Array<{
    Customer: string;
    GM_ID: string;
    Current_Status: string;
    Current_Start: string;
    Current_Expiry: string;
    Expected_Status: string;
    Expected_Start: string;
    Expected_Expiry: string;
    Reward_Status: string;
    Action: string;
  }> = [];

  let countToCorrect = 0;

  for (const p of eaProfiles) {
    const mem = p.membership;
    const name = `${p.firstName || ''} ${p.lastName || ''}`.trim() || p.email;
    const gmId = p.godsmoveId || 'MISSING';

    const currentStatus = mem ? mem.status : 'NO_MEMBERSHIP';
    const currentStart = mem?.activatedAt ? mem.activatedAt.toISOString().split('T')[0] : 'N/A';
    const currentExpiry = mem?.expiresAt ? mem.expiresAt.toISOString().split('T')[0] : 'N/A';

    let expectedStatus = storeLaunched ? 'ACTIVE' : 'SCHEDULED';
    let expectedStart = (storeLaunched ? now : launchDate).toISOString().split('T')[0];
    let expectedExpiry = (storeLaunched ? calculateMembershipExpiry(now) : launchExpiry).toISOString().split('T')[0];

    const hasRewardTransaction = p.wallet?.transactions.some((t) =>
      t.description?.includes('Early Access Assured Reward')
    );
    const rewardStatus = hasRewardTransaction ? 'CREDITED' : 'NOT_CREDITED';

    let recommendedAction = 'NO_CHANGE_NEEDED';

    if (!mem) {
      recommendedAction = 'CREATE_SCHEDULED_MEMBERSHIP';
      countToCorrect++;
    } else if (mem.source === 'EARLY_ACCESS') {
      if (!storeLaunched && mem.status === 'ACTIVE') {
        recommendedAction = 'CORRECT_TO_SCHEDULED';
        countToCorrect++;
      } else if (storeLaunched && mem.status === 'SCHEDULED') {
        recommendedAction = 'ACTIVATE_ON_LAUNCH';
        countToCorrect++;
      }
    } else {
      // Paid or Pre-booking membership
      expectedStatus = mem.status;
      expectedStart = currentStart;
      expectedExpiry = currentExpiry;
      recommendedAction = `PRESERVE_${mem.source}_MEMBERSHIP`;
    }

    tableData.push({
      Customer: name.substring(0, 20),
      GM_ID: gmId,
      Current_Status: currentStatus,
      Current_Start: currentStart,
      Current_Expiry: currentExpiry,
      Expected_Status: expectedStatus,
      Expected_Start: expectedStart,
      Expected_Expiry: expectedExpiry,
      Reward_Status: rewardStatus,
      Action: recommendedAction,
    });

    if (isExecute && recommendedAction !== 'NO_CHANGE_NEEDED' && !recommendedAction.startsWith('PRESERVE_')) {
      if (!mem) {
        await prisma.membership.create({
          data: {
            profileId: p.id,
            status: expectedStatus as any,
            source: 'EARLY_ACCESS',
            activatedAt: storeLaunched ? now : launchDate,
            expiresAt: storeLaunched ? calculateMembershipExpiry(now) : launchExpiry,
            tier: 'VIP',
          },
        });
      } else {
        await prisma.membership.update({
          where: { id: mem.id },
          data: {
            status: expectedStatus as any,
            activatedAt: storeLaunched ? now : launchDate,
            expiresAt: storeLaunched ? calculateMembershipExpiry(now) : launchExpiry,
          },
        });
      }
    }
  }

  console.table(tableData);

  console.log(`\n====================================================================`);
  console.log(`📊 RECONCILIATION SUMMARY:`);
  console.log(`Total Early Access Customers: ${eaProfiles.length}`);
  console.log(`Records Needing Correction: ${countToCorrect}`);
  if (isDryRun) {
    console.log(`\n👉 DRY-RUN COMPLETE. To apply database corrections, run:`);
    console.log(`   npx.cmd tsx --env-file=.env.local scripts/reconcile-early-access-memberships.ts --execute`);
  } else {
    console.log(`\n✅ DATABASE MUTATIONS EXECUTED SUCCESSFULLY.`);
  }
  console.log(`====================================================================\n`);

  await prisma.$disconnect();
}

runReconciliation().catch((err) => {
  console.error('Reconciliation error:', err);
  prisma.$disconnect();
  process.exit(1);
});
