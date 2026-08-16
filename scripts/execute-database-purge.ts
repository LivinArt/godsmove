import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function executeDatabasePurge() {
  const { prisma } = await import('../src/lib/prisma');

  console.log('====================================================================');
  console.log('🧹 GODSMOVE — PRODUCTION DATABASE TEST-DATA PURGE');
  console.log('====================================================================\n');

  // Verify backup exists
  const scratchDir = path.resolve(process.cwd(), 'scratch');
  const backupFiles = fs.readdirSync(scratchDir).filter((f) => f.startsWith('db_backup_pre_purge_'));
  if (backupFiles.length === 0) {
    throw new Error('❌ SAFETY VIOLATION: No database backup JSON found! Aborting purge.');
  }
  console.log(`✅ DATABASE BACKUP VERIFIED: ${backupFiles[backupFiles.length - 1]}`);

  // Fetch target records for deletion
  const testProducts = await prisma.product.findMany({
    where: {
      OR: [
        { name: { contains: 'QA', mode: 'insensitive' } },
        { name: { contains: 'test', mode: 'insensitive' } },
        { slug: { contains: 'test', mode: 'insensitive' } },
        { slug: { contains: 'qa', mode: 'insensitive' } },
      ],
    },
    include: { variants: true },
  });

  const testProfiles = await prisma.profile.findMany({
    where: {
      OR: [
        { email: { contains: 'qatest@godsmove.in', mode: 'insensitive' } },
        { email: { contains: 'hotfix_qa@godsmove.in', mode: 'insensitive' } },
        { email: { contains: 'test@godsmove.com', mode: 'insensitive' } },
        { email: { contains: 'testnew@godsmove.com', mode: 'insensitive' } },
        { email: { contains: 'concurrency.test', mode: 'insensitive' } },
        { email: { contains: 'rishi@example.com', mode: 'insensitive' } },
        { email: { contains: 'aarav.sharma@example.com', mode: 'insensitive' } },
      ],
    },
  });

  const testProductIds = testProducts.map((p) => p.id);
  const testVariantIds = testProducts.flatMap((p) => p.variants.map((v) => v.id));
  const testProfileIds = testProfiles.map((p) => p.id);

  console.log(`Identified ${testProducts.length} TEST PRODUCTS for purge.`);
  console.log(`Identified ${testProfiles.length} TEST PROFILES for purge.`);

  // Perform transactional purge with extended timeout
  await prisma.$transaction(async (tx) => {
    // 1. Purge all InventoryMovements
    const delMovements = await tx.inventoryMovement.deleteMany({});
    console.log(`Purged ${delMovements.count} InventoryMovements.`);

    // 2. Purge all ReturnItems and ReturnRequests
    const delReturnItems = await tx.returnItem.deleteMany({});
    const delReturns = await tx.returnRequest.deleteMany({});
    console.log(`Purged ${delReturnItems.count} ReturnItem records & ${delReturns.count} ReturnRequest records.`);

    // 3. Purge Shipments and ShipmentEvents
    const delShipmentEvents = await tx.shipmentEvent.deleteMany({});
    const delShipments = await tx.shipment.deleteMany({});
    console.log(`Purged ${delShipmentEvents.count} ShipmentEvents & ${delShipments.count} Shipments.`);

    // 4. Purge Invoices and Payment logs
    const delInvoices = await tx.invoice.deleteMany({});
    const delPayLogs = await tx.paymentTransitionLog.deleteMany({});
    const delPaySessions = await tx.paymentSession.deleteMany({});
    const delCheckoutSessions = await tx.checkoutSession.deleteMany({});
    console.log(`Purged ${delInvoices.count} Invoices, ${delPaySessions.count} Payment Sessions & ${delCheckoutSessions.count} Checkout Sessions.`);

    // 5. Purge OrderItems and Orders
    const delOrderItems = await tx.orderItem.deleteMany({});
    const delOrders = await tx.order.deleteMany({});
    console.log(`Purged ${delOrderItems.count} OrderItems & ${delOrders.count} Orders.`);

    // 6. Purge Wallet Transactions & Refunds
    const delWalletRefunds = await tx.walletRefund.deleteMany({});
    const delWalletTx = await tx.walletTransaction.deleteMany({});
    console.log(`Purged ${delWalletRefunds.count} WalletRefunds & ${delWalletTx.count} WalletTransactions.`);

    // 7. Purge Wishlist items, PreBookingInterests, CareRequests, Notifications
    const delWishlist = await tx.wishlistItem.deleteMany({});
    const delPreBooking = await tx.preBookingInterest.deleteMany({});
    const delCare = await tx.careRequest.deleteMany({});
    const delNotif = await tx.notificationHistory.deleteMany({});
    console.log(`Purged ${delWishlist.count} Wishlist, ${delPreBooking.count} PreBookingInterests, ${delCare.count} CareRequests, ${delNotif.count} Notifications.`);

    // 8. Purge test products & test variants
    if (testVariantIds.length > 0) {
      await tx.inventory.deleteMany({ where: { variantId: { in: testVariantIds } } });
      await tx.productVariant.deleteMany({ where: { id: { in: testVariantIds } } });
    }
    if (testProductIds.length > 0) {
      await tx.productImage.deleteMany({ where: { productId: { in: testProductIds } } });
      await tx.productTag.deleteMany({ where: { productId: { in: testProductIds } } });
      await tx.product.deleteMany({ where: { id: { in: testProductIds } } });
    }
    console.log(`Purged ${testProductIds.length} test products & ${testVariantIds.length} test variants.`);

    // 9. Purge test profiles and addresses
    if (testProfileIds.length > 0) {
      await tx.address.deleteMany({ where: { profileId: { in: testProfileIds } } });
      await tx.profile.deleteMany({ where: { id: { in: testProfileIds } } });
    }
    console.log(`Purged ${testProfileIds.length} test customer profiles.`);

    // 10. Reset inventory for all retained launch products (soldStock = 0, reservedStock = 0)
    const resetInv = await tx.inventory.updateMany({
      data: {
        soldStock: 0,
        reservedStock: 0,
      },
    });
    console.log(`Reset ${resetInv.count} inventory records for launch products (soldStock = 0, reservedStock = 0).`);
  }, { timeout: 30000, maxWait: 15000 });

  // Post-Purge Verification
  console.log('\n--- POST-PURGE DATABASE VERIFICATION ---');
  const remainingOrders = await prisma.order.count();
  const remainingReturnRequests = await prisma.returnRequest.count();
  const remainingProfiles = await prisma.profile.count();
  const remainingProducts = await prisma.product.count();
  const remainingInventories = await prisma.inventory.findMany();

  console.log(`Orders Remaining:         ${remainingOrders}`);
  console.log(`ReturnRequests Remaining: ${remainingReturnRequests}`);
  console.log(`Profiles Remaining:       ${remainingProfiles}`);
  console.log(`Products Remaining:       ${remainingProducts}`);

  let totalAvailableStock = 0;
  for (const inv of remainingInventories) {
    totalAvailableStock += (inv.totalStock - inv.soldStock - inv.reservedStock);
  }
  console.log(`Total Available Inventory for Launch Products: ${totalAvailableStock} units`);

  if (remainingOrders === 0 && remainingReturnRequests === 0) {
    console.log('\n🎉 DATABASE PURGE COMPLETED SUCCESSFULLY WITH ZERO ORPHANS!');
  } else {
    throw new Error('❌ PURGE INCOMPLETE OR UNEXPECTED RECORDS REMAIN!');
  }

  await prisma.$disconnect();
}

executeDatabasePurge().catch((e) => {
  console.error(e);
  process.exit(1);
});
