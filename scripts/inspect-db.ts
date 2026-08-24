import { prisma } from '../src/lib/prisma';
import { createAdminClient } from '../src/lib/supabase/server';

async function main() {
  const url = process.env.DATABASE_URL || '';
  const maskedUrl = url.replace(/:[^:@]+@/, ':****@');
  console.log('====================================================================');
  console.log(`📌 DATABASE TARGET ENVIRONMENT: ${maskedUrl}`);
  console.log('====================================================================\n');

  // 1. Fetch Supabase Auth Users
  let authUsers: any[] = [];
  try {
    const supabaseAdmin = await createAdminClient();
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    if (!error && data?.users) {
      authUsers = data.users;
    }
  } catch (err) {
    console.warn('Could not list auth users directly via Supabase admin client.');
  }

  // 2. Fetch Profiles with Membership & Orders & Wallet & Notifications
  const profiles = await prisma.profile.findMany({
    include: {
      membership: true,
      orders: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  const notifications = await prisma.notificationHistory.findMany({
    orderBy: { createdAt: 'asc' },
  });

  console.log(`Total Profiles in DB: ${profiles.length}`);
  console.log(`Total Notification Logs in DB: ${notifications.length}\n`);

  console.log('--- DEFINITIVE CUSTOMER IDENTITY & EARLY ACCESS POPULATION TABLE ---');
  const tableData = [];

  for (const p of profiles) {
    const authUser = authUsers.find((u) => u.id === p.id);
    const userNotifs = notifications.filter((n) => n.profileId === p.id || n.email.toLowerCase() === p.email.toLowerCase());
    const eaNotif = userNotifs.find((n) => n.eventType === 'EARLY_ACCESS_CONFIRMED');

    // Provenance Analysis:
    // How did this profile register Early Access?
    // Check: p.earlyAccessRegistered, eaNotif, or notification history
    let eaRecordStatus = p.earlyAccessRegistered ? 'YES (Flagged in Profile)' : 'NO';
    if (eaNotif) {
      eaRecordStatus = `YES (Confirmed via Notif Log: ${eaNotif.createdAt.toISOString()})`;
    }

    const eaDate = p.earlyAccessRegisteredAt
      ? p.earlyAccessRegisteredAt.toISOString()
      : eaNotif
      ? eaNotif.createdAt.toISOString()
      : null;

    // Membership Provenance Analysis
    let provenanceNote = 'No Membership';
    if (p.membership) {
      if (p.membership.source === 'EARLY_ACCESS') {
        provenanceNote = 'EARLY_ACCESS (Verified EA Entitlement)';
      } else if (p.membership.source === 'MANUAL') {
        if (p.earlyAccessRegistered || eaNotif) {
          provenanceNote = 'MANUAL (Candidate for EARLY_ACCESS Migration)';
        } else {
          provenanceNote = 'MANUAL (Admin Manual Grant - Unrelated to EA)';
        }
      } else {
        provenanceNote = `${p.membership.source} (Preserved)`;
      }
    }

    tableData.push({
      Email: p.email,
      'Auth ID': p.id.slice(0, 8) + '...',
      'Profile ID': p.id.slice(0, 8) + '...',
      'GM ID': p.godsmoveId || 'MISSING',
      'EA Record': eaRecordStatus,
      'EA Date': eaDate ? eaDate.split('T')[0] : 'N/A',
      Name: p.firstName ? `${p.firstName} ${p.lastName || ''}`.trim() : 'NULL',
      Phone: p.phone || 'NULL',
      DOB: p.dob ? p.dob.toISOString().split('T')[0] : 'NULL',
      Gender: p.gender || 'NULL',
      Membership: p.membership ? p.membership.status : 'NONE',
      Source: p.membership ? p.membership.source : 'N/A',
      'Mem Start': p.membership?.activatedAt ? p.membership.activatedAt.toISOString().split('T')[0] : 'N/A',
      'Mem Expiry': p.membership?.expiresAt ? p.membership.expiresAt.toISOString().split('T')[0] : 'N/A',
      'Provenance Note': provenanceNote,
    });
  }

  console.table(tableData);

  console.log('\n--- DETAILED PERSON-BY-PERSON FORENSIC ANALYSIS ---');
  for (const p of profiles) {
    const userNotifs = notifications.filter((n) => n.profileId === p.id || n.email.toLowerCase() === p.email.toLowerCase());
    console.log(`\n👤 Customer: ${p.email}`);
    console.log(`   ├─ ID: ${p.id}`);
    console.log(`   ├─ GM ID: ${p.godsmoveId || 'NONE'}`);
    console.log(`   ├─ Role: ${p.role}`);
    console.log(`   ├─ Name: ${p.firstName || 'NULL'} ${p.lastName || ''}`);
    console.log(`   ├─ Phone: ${p.phone || 'NULL'}`);
    console.log(`   ├─ Early Access Registered: ${p.earlyAccessRegistered} (At: ${p.earlyAccessRegisteredAt})`);
    console.log(`   ├─ Membership: ${p.membership ? JSON.stringify({ id: p.membership.id, status: p.membership.status, source: p.membership.source, activatedAt: p.membership.activatedAt, expiresAt: p.membership.expiresAt }) : 'NONE'}`);
    console.log(`   └─ Notifications (${userNotifs.length}): ${userNotifs.map(n => `${n.eventType} @ ${n.createdAt.toISOString()}`).join(', ') || 'None'}`);
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
