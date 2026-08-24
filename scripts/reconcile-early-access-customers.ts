import { prisma } from '../src/lib/prisma';
import { createAdminClient } from '../src/lib/supabase/server';
import { generateUniqueGodsmoveId, isEmailUsernameFallback } from '../src/lib/customer-sync';

async function runReconciliation() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run') || !args.includes('--execute');

  console.log('====================================================================');
  console.log(`🚀 GODSMOVE EARLY ACCESS DATA RECONCILIATION (${isDryRun ? 'DRY-RUN MODE' : 'EXECUTION MODE'})`);
  console.log('====================================================================\n');

  if (isDryRun) {
    console.log('ℹ️  DRY-RUN MODE ACTIVE: No database records will be modified.');
    console.log('   Pass --execute to apply proposed repairs.\n');
  }

  // 1. Query Supabase Auth Users for Google Metadata recovery
  let authUsers: any[] = [];
  try {
    const supabaseAdmin = await createAdminClient();
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    if (!error && data?.users) {
      authUsers = data.users;
    }
  } catch (err) {
    console.warn('Notice: Could not list Supabase auth users directly, using database profiles.');
  }

  // 2. Fetch all database profiles with memberships
  const profiles = await prisma.profile.findMany({
    include: { membership: true },
    orderBy: { createdAt: 'asc' },
  });

  const stats = {
    totalProfiles: profiles.length,
    totalEarlyAccessRegistrations: 0,
    missingGmIdsBefore: 0,
    gmIdsGenerated: 0,
    missingMembershipsBefore: 0,
    membershipsCreated: 0,
    emailNamesCleanedBefore: 0,
    emailNamesCleaned: 0,
    recordsRequiringManualReview: 0,
    duplicatesDetected: 0,
    duplicatesResolved: 0,
  };

  const dryRunReport: Array<{
    id: string;
    email: string;
    existingGmId: string | null;
    proposedGmId: string | null;
    existingName: string | null;
    proposedName: string | null;
    isEarlyAccess: boolean;
    existingMembership: string | null;
    proposedMembershipAction: string;
    notes: string;
  }> = [];

  for (const p of profiles) {
    const isEa = p.earlyAccessRegistered;
    if (isEa) stats.totalEarlyAccessRegistrations++;

    const authUser = authUsers.find((u) => u.id === p.id);
    const googleMetadata = authUser?.user_metadata || {};

    let proposedGmId: string | null = null;
    if (!p.godsmoveId) {
      stats.missingGmIdsBefore++;
      proposedGmId = 'PROPOSED_GM_ID'; // Will be generated in transaction
    } else {
      proposedGmId = p.godsmoveId;
    }

    // Name cleaning check
    let proposedName: string | null = p.firstName;
    let nameAction = 'PRESERVE';
    if (p.firstName && isEmailUsernameFallback(p.firstName, p.email)) {
      stats.emailNamesCleanedBefore++;
      nameAction = 'CLEAN_EMAIL_PREFIX';
      const googleName = googleMetadata.full_name || googleMetadata.name || googleMetadata.given_name;
      proposedName = googleName ? googleName.split(' ')[0] : null;
    }

    // Membership action check
    let membershipAction = 'NONE';
    if (!p.membership) {
      if (isEa) {
        stats.missingMembershipsBefore++;
        membershipAction = 'CREATE_1YR_VIP_EARLY_ACCESS';
      }
    } else if (p.membership.status !== 'ACTIVE' && isEa) {
      stats.missingMembershipsBefore++;
      membershipAction = 'REACTIVATE_1YR_VIP_EARLY_ACCESS';
    } else {
      membershipAction = `PRESERVE_EXISTING (${p.membership.source})`;
    }

    // Notes for manual review
    const notesArr: string[] = [];
    if (!p.phone) notesArr.push('Missing Phone');
    if (!p.dob) notesArr.push('Missing DOB');
    if (proposedName === null) notesArr.push('Missing Real Name');
    if (notesArr.length > 0) stats.recordsRequiringManualReview++;

    dryRunReport.push({
      id: p.id,
      email: p.email,
      existingGmId: p.godsmoveId,
      proposedGmId,
      existingName: p.firstName,
      proposedName,
      isEarlyAccess: isEa,
      existingMembership: p.membership ? `${p.membership.status} (${p.membership.source})` : 'NONE',
      proposedMembershipAction: membershipAction,
      notes: notesArr.join(', ') || 'Complete',
    });
  }

  // Print Dry-Run Report Table
  console.log('--- RECONCILIATION DRY-RUN REPORT ---');
  console.table(
    dryRunReport.map((r) => ({
      Email: r.email,
      'Early Access': r.isEarlyAccess ? 'YES' : 'NO',
      'Current GM ID': r.existingGmId || 'MISSING',
      'Current Name': r.existingName || 'NULL',
      'Proposed Name': r.proposedName || 'NULL',
      'Membership Action': r.proposedMembershipAction,
      Status: r.notes,
    }))
  );

  console.log('\n--- PRE-REPAIR METRICS SUMMARY ---');
  console.log(`Total Customer Profiles:           ${stats.totalProfiles}`);
  console.log(`Total Early Access Registrations:   ${stats.totalEarlyAccessRegistrations}`);
  console.log(`Missing GM IDs:                    ${stats.missingGmIdsBefore}`);
  console.log(`Missing Early Access Memberships:  ${stats.missingMembershipsBefore}`);
  console.log(`Email-Prefix Names to Clean:       ${stats.emailNamesCleanedBefore}`);
  console.log(`Records Requiring Manual Review:   ${stats.recordsRequiringManualReview}`);

  if (isDryRun) {
    console.log('\n====================================================================');
    console.log('DRY-RUN COMPLETE. Run with --execute to apply database repairs.');
    console.log('====================================================================\n');
    return;
  }

  // 3. EXECUTION MODE: Perform atomic repairs
  console.log('\nExecuting atomic database repairs...');

  for (const p of profiles) {
    await prisma.$transaction(async (tx) => {
      const authUser = authUsers.find((u) => u.id === p.id);
      const googleMetadata = authUser?.user_metadata || {};

      // 1. GM ID
      let godsmoveId = p.godsmoveId;
      if (!godsmoveId) {
        godsmoveId = await generateUniqueGodsmoveId(tx);
        stats.gmIdsGenerated++;
      }

      // 2. Name Cleaning
      let firstName = p.firstName;
      let lastName = p.lastName;
      if (firstName && isEmailUsernameFallback(firstName, p.email)) {
        stats.emailNamesCleaned++;
        const googleFullName = googleMetadata.full_name || googleMetadata.name;
        if (googleFullName && googleFullName.trim()) {
          const parts = googleFullName.trim().split(' ');
          firstName = parts[0];
          lastName = parts.slice(1).join(' ') || null;
        } else if (googleMetadata.given_name) {
          firstName = googleMetadata.given_name;
          lastName = googleMetadata.family_name || null;
        } else {
          firstName = null;
          lastName = null;
        }
      }

      // 3. Update Profile
      await tx.profile.update({
        where: { id: p.id },
        data: {
          godsmoveId,
          firstName,
          lastName,
        },
      });

      // 4. Provision Early Access Membership
      if (p.earlyAccessRegistered) {
        const regDate = p.earlyAccessRegisteredAt || p.createdAt;
        const oneYearFromReg = new Date(regDate.getTime() + 365 * 24 * 60 * 60 * 1000);

        const existingMembership = await tx.membership.findUnique({
          where: { profileId: p.id },
        });

        if (!existingMembership) {
          await tx.membership.create({
            data: {
              profileId: p.id,
              status: 'ACTIVE',
              source: 'EARLY_ACCESS',
              activatedAt: regDate,
              expiresAt: oneYearFromReg,
              tier: 'VIP',
            },
          });
          stats.membershipsCreated++;
        } else if (existingMembership.status !== 'ACTIVE') {
          await tx.membership.update({
            where: { profileId: p.id },
            data: {
              status: 'ACTIVE',
              source: 'EARLY_ACCESS',
              activatedAt: existingMembership.activatedAt || regDate,
              expiresAt: oneYearFromReg,
              tier: 'VIP',
            },
          });
          stats.membershipsCreated++;
        }
      }
    });
  }

  console.log('\n====================================================================');
  console.log('✅ RECONCILIATION EXECUTION COMPLETED SUCCESSFULLY');
  console.log('====================================================================');
  console.log(`Total Profiles Processed:         ${stats.totalProfiles}`);
  console.log(`GM IDs Generated & Attached:       ${stats.gmIdsGenerated}`);
  console.log(`Early Access Memberships Created:  ${stats.membershipsCreated}`);
  console.log(`Email-Prefix Names Repaired:       ${stats.emailNamesCleaned}`);
  console.log(`Records Flagged for Review:       ${stats.recordsRequiringManualReview}`);
  console.log('====================================================================\n');
}

runReconciliation()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Reconciliation error:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
