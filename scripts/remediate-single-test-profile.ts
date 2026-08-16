import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function remediateTestProfile() {
  const { prisma } = await import('../src/lib/prisma');

  const targetProfileId = 'fadd47a8-a395-4746-8461-40e375fed279';
  const targetEmail = 'test@gmail.com';

  console.log('====================================================================');
  console.log('🧹 GODSMOVE — REMEDIATION: TARGETED SINGLE TEST PROFILE DELETION');
  console.log('====================================================================\n');

  // 1. Inspect target profile & dependent records
  const targetProf = await prisma.profile.findUnique({
    where: { id: targetProfileId },
    include: {
      addresses: true,
      orders: true,
      returnReqs: true,
      wallet: true,
      wishlistItems: true,
      preBookingInterests: true,
      careRequests: true,
    },
  });

  if (!targetProf) {
    console.log(`⚠️ Profile ${targetProfileId} (${targetEmail}) NOT FOUND or already deleted!`);
    await prisma.$disconnect();
    return;
  }

  console.log(`FOUND TARGET TEST PROFILE:`);
  console.log(`• Profile ID: ${targetProf.id}`);
  console.log(`• Email:      ${targetProf.email}`);
  console.log(`• Role:       ${targetProf.role}`);
  console.log(`• Addresses:  ${targetProf.addresses.length}`);
  console.log(`• Orders:     ${targetProf.orders.length}`);
  console.log(`• Returns:    ${targetProf.returnReqs.length}`);
  console.log(`• Wallet:     ${targetProf.wallet ? 'YES' : 'NONE'}`);
  console.log(`• Wishlists:  ${targetProf.wishlistItems.length}\n`);

  // 2. Targeted Backup before deletion
  const scratchDir = path.resolve(process.cwd(), 'scratch');
  if (!fs.existsSync(scratchDir)) {
    fs.mkdirSync(scratchDir, { recursive: true });
  }
  const backupPath = path.resolve(scratchDir, `target_profile_backup_${targetProfileId}.json`);
  fs.writeFileSync(backupPath, JSON.stringify(targetProf, null, 2));
  console.log(`💾 TARGETED BACKUP WRITTEN TO: ${backupPath}\n`);

  // 3. Delete dependent records & target profile
  await prisma.$transaction(async (tx) => {
    // Delete addresses
    await tx.address.deleteMany({ where: { profileId: targetProfileId } });
    // Delete wallet
    if (targetProf.wallet) {
      await tx.wallet.delete({ where: { profileId: targetProfileId } });
    }
    // Delete wishlist items
    await tx.wishlistItem.deleteMany({ where: { profileId: targetProfileId } });
    // Delete prebooking interests
    await tx.preBookingInterest.deleteMany({ where: { profileId: targetProfileId } });
    // Delete profile
    await tx.profile.delete({ where: { id: targetProfileId } });
  });

  console.log(`✅ TARGET TEST PROFILE ${targetProfileId} (${targetEmail}) DELETED SAFELY!\n`);

  // 4. Post-deletion verification
  const checkProf = await prisma.profile.findUnique({ where: { id: targetProfileId } });
  const checkEmail = await prisma.profile.findFirst({ where: { email: targetEmail } });
  const totalRemainingProfiles = await prisma.profile.count();

  console.log('--- POST-REMEDIATION VERIFICATION ---');
  console.log(`Profile ID Exists:     ${checkProf ? 'YES (ERROR)' : 'NO (CLEAN ✅)'}`);
  console.log(`Email Exists:          ${checkEmail ? 'YES (ERROR)' : 'NO (CLEAN ✅)'}`);
  console.log(`Total Profiles:        ${totalRemainingProfiles} (22 Launch/Admin profiles remaining)\n`);

  await prisma.$disconnect();
}

remediateTestProfile().catch(console.error);
