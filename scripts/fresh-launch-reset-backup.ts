import fs from 'fs';
import path from 'path';
import { prisma } from '../src/lib/prisma';

async function performSafetyBackup() {
  console.log('====================================================================');
  console.log('📦 PHASE 0: EXECUTING MANDATORY DATABASE SAFETY BACKUP');
  console.log('====================================================================\n');

  const timestamp = Date.now();
  const scratchDir = path.join(process.cwd(), 'scratch');
  if (!fs.existsSync(scratchDir)) {
    fs.mkdirSync(scratchDir, { recursive: true });
  }

  const backupFilePath = path.join(scratchDir, `fresh-launch-reset-backup-${timestamp}.json`);

  console.log('Fetching all database records for backup...');

  const backupData = {
    timestamp: new Date().toISOString(),
    records: {
      siteConfig: await prisma.siteConfig.findMany(),
      codConfig: await prisma.codConfig.findMany(),
      profiles: await prisma.profile.findMany(),
      memberships: await prisma.membership.findMany(),
      addresses: await prisma.address.findMany(),
      wallets: await prisma.wallet.findMany(),
      walletTransactions: await prisma.walletTransaction.findMany(),
      categories: await prisma.category.findMany(),
      products: await prisma.product.findMany(),
      productVariants: await prisma.productVariant.findMany(),
      productImages: await prisma.productImage.findMany(),
      productTags: await prisma.productTag.findMany(),
      wishlistItems: await prisma.wishlistItem.findMany(),
      drops: await prisma.drop.findMany(),
      discounts: await prisma.discount.findMany(),
      inventory: await prisma.inventory.findMany(),
      inventoryMovements: await prisma.inventoryMovement.findMany(),
      orders: await prisma.order.findMany(),
      orderItems: await prisma.orderItem.findMany(),
      checkoutSessions: await prisma.checkoutSession.findMany(),
      paymentSessions: await prisma.paymentSession.findMany(),
      paymentTransitionLogs: await prisma.paymentTransitionLog.findMany(),
      invoices: await prisma.invoice.findMany(),
      shipments: await prisma.shipment.findMany(),
      shipmentEvents: await prisma.shipmentEvent.findMany(),
      returnRequests: await prisma.returnRequest.findMany(),
      returnItems: await prisma.returnItem.findMany(),
      returnEvents: await prisma.returnEvent.findMany(),
      reverseShipments: await prisma.reverseShipment.findMany(),
      walletRefunds: await prisma.walletRefund.findMany(),
      careRequests: await prisma.careRequest.findMany(),
      unlockAccessTokens: await prisma.unlockAccessToken.findMany(),
      productUnlocks: await prisma.productUnlock.findMany(),
      exclusiveDraws: await prisma.exclusiveDraw.findMany(),
      exclusiveReservations: await prisma.exclusiveReservation.findMany(),
      exclusiveDrawWinners: await prisma.exclusiveDrawWinner.findMany(),
      campaigns: await prisma.campaign.findMany(),
      campaignRecipients: await prisma.campaignRecipient.findMany(),
      segments: await prisma.segment.findMany(),
      customerTags: await prisma.customerTag.findMany(),
      notificationHistory: await prisma.notificationHistory.findMany(),
      templateVersions: await prisma.templateVersion.findMany(),
      draftCampaigns: await prisma.draftCampaign.findMany(),
      preBookingInterests: await prisma.preBookingInterest.findMany(),
    },
  };

  const backupJson = JSON.stringify(backupData, null, 2);
  fs.writeFileSync(backupFilePath, backupJson, 'utf-8');

  // Verify backup
  const stats = fs.statSync(backupFilePath);
  assertBackupValid(backupFilePath, stats.size, backupData);

  console.log(`\n✅ Backup successfully written and verified!`);
  console.log(`📍 Backup location: ${backupFilePath}`);
  console.log(`📊 Backup file size: ${(stats.size / 1024).toFixed(2)} KB\n`);
  
  return { backupFilePath, recordCount: Object.keys(backupData.records).length };
}

function assertBackupValid(filePath: string, sizeBytes: number, data: any) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Backup file creation failed at ${filePath}`);
  }
  if (sizeBytes < 100) {
    throw new Error(`Backup file is suspiciously small (${sizeBytes} bytes)`);
  }
  if (!data.timestamp || !data.records) {
    throw new Error(`Backup payload is incomplete or invalid JSON`);
  }
}

performSafetyBackup().catch((err) => {
  console.error('❌ SAFETY BACKUP FAILED:', err);
  process.exit(1);
});
