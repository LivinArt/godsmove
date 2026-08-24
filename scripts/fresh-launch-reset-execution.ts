import { prisma } from '../src/lib/prisma';

async function executeFreshLaunchReset() {
  console.log('====================================================================');
  console.log('🧹 EXECUTING FRESH-LAUNCH DATABASE RESET (PHASE 1 - 24)');
  console.log('====================================================================\n');

  // Verify Admin accounts exist before deleting
  const adminProfiles = await prisma.profile.findMany({
    where: { role: { not: 'CUSTOMER' } },
  });

  console.log(`Found ${adminProfiles.length} Administrative Account(s) to preserve:`);
  for (const admin of adminProfiles) {
    console.log(` 🔑 Admin Account: ${admin.email} (ID: ${admin.id}, Role: ${admin.role})`);
  }

  if (adminProfiles.length === 0) {
    console.log('⚠️ No dedicated admin profile found. Promoting earliest test user to ADMIN to prevent lockout...');
    const firstProfile = await prisma.profile.findFirst({ orderBy: { createdAt: 'asc' } });
    if (firstProfile) {
      await prisma.profile.update({
        where: { id: firstProfile.id },
        data: { role: 'ADMIN' },
      });
      console.log(` 🔑 Promoted ${firstProfile.email} to ADMIN.`);
    }
  }

  // Preserve non-customer profile IDs
  const preservedAdminIds = (await prisma.profile.findMany({
    where: { role: { not: 'CUSTOMER' } },
    select: { id: true },
  })).map((p) => p.id);

  console.log('\n--- Step 1: Deleting Dependent Return, Refund, Care, & Draw Records ---');
  const dReturnItem = await prisma.returnItem.deleteMany();
  const dReturnEvent = await prisma.returnEvent.deleteMany();
  const dReverseShipment = await prisma.reverseShipment.deleteMany();
  const dWalletRefund = await prisma.walletRefund.deleteMany();
  const dCareRequest = await prisma.careRequest.deleteMany();
  const dWalletTxn = await prisma.walletTransaction.deleteMany();
  const dDrawWinner = await prisma.exclusiveDrawWinner.deleteMany();
  const dReservation = await prisma.exclusiveReservation.deleteMany();
  const dDraw = await prisma.exclusiveDraw.deleteMany();
  const dUnlockToken = await prisma.unlockAccessToken.deleteMany();
  const dProductUnlock = await prisma.productUnlock.deleteMany();
  const dPreBookingInterest = await prisma.preBookingInterest.deleteMany();
  const dWishlistItem = await prisma.wishlistItem.deleteMany();

  console.log(` Deleted ReturnItems: ${dReturnItem.count}, ReturnEvents: ${dReturnEvent.count}, ReverseShipments: ${dReverseShipment.count}`);
  console.log(` Deleted WalletRefunds: ${dWalletRefund.count}, CareRequests: ${dCareRequest.count}, WalletTxns: ${dWalletTxn.count}`);

  console.log('\n--- Step 2: Deleting Order, Payment, Shipment, & Invoice Records ---');
  const dOrderItem = await prisma.orderItem.deleteMany();
  const dShipmentEvent = await prisma.shipmentEvent.deleteMany();
  const dShipment = await prisma.shipment.deleteMany();
  const dInvoice = await prisma.invoice.deleteMany();
  const dPaymentLog = await prisma.paymentTransitionLog.deleteMany();
  const dPaymentSession = await prisma.paymentSession.deleteMany();
  const dCheckoutSession = await prisma.checkoutSession.deleteMany();
  const dReturnReq = await prisma.returnRequest.deleteMany();
  const dOrder = await prisma.order.deleteMany();

  console.log(` Deleted OrderItems: ${dOrderItem.count}, Shipments: ${dShipment.count}, Invoices: ${dInvoice.count}`);
  console.log(` Deleted CheckoutSessions: ${dCheckoutSession.count}, Orders: ${dOrder.count}`);

  console.log('\n--- Step 3: Deleting Marketing, Communication, & Customer Logs ---');
  const dCustomerTag = await prisma.customerTag.deleteMany();
  const dRecipient = await prisma.campaignRecipient.deleteMany();
  const dNotif = await prisma.notificationHistory.deleteMany();
  const dCampaign = await prisma.campaign.deleteMany();
  const dDraftCampaign = await prisma.draftCampaign.deleteMany();
  const dSegment = await prisma.segment.deleteMany({ where: { isSystem: false } });

  console.log(` Deleted CustomerTags: ${dCustomerTag.count}, Notifications: ${dNotif.count}, Campaigns: ${dCampaign.count}`);

  console.log('\n--- Step 4: Resetting Customer Accounts, Addresses, Memberships, & Wallets ---');
  const dAddress = await prisma.address.deleteMany(); // Delete ALL test shipping addresses
  const dWallet = await prisma.wallet.deleteMany(); // Delete ALL test wallets
  const dMembership = await prisma.membership.deleteMany(); // Delete ALL test memberships
  const dCustomerProfiles = await prisma.profile.deleteMany({ where: { id: { notIn: preservedAdminIds } } });

  // Reset Early Access flags on preserved Admin profiles
  await prisma.profile.updateMany({
    where: { id: { in: preservedAdminIds } },
    data: {
      earlyAccessRegistered: false,
      earlyAccessRegisteredAt: null,
      earlyAccessBenefitsEligible: false,
    },
  });

  console.log(` Deleted Customer Addresses: ${dAddress.count}, Wallets: ${dWallet.count}, Memberships: ${dMembership.count}`);
  console.log(` Deleted Customer Profiles: ${dCustomerProfiles.count}`);

  console.log('\n--- Step 5: Deleting Catalog Products, Variants, Inventory, Drops, Categories, & Discounts ---');
  const dInvMovement = await prisma.inventoryMovement.deleteMany();
  const dInventory = await prisma.inventory.deleteMany();
  const dProductTag = await prisma.productTag.deleteMany();
  const dProductImage = await prisma.productImage.deleteMany();
  const dVariant = await prisma.productVariant.deleteMany();
  const dDiscount = await prisma.discount.deleteMany();
  const dProduct = await prisma.product.deleteMany();
  const dDrop = await prisma.drop.deleteMany();
  const dCategory = await prisma.category.deleteMany();

  console.log(` Deleted InventoryMovements: ${dInvMovement.count}, Inventory: ${dInventory.count}`);
  console.log(` Deleted Variants: ${dVariant.count}, Products: ${dProduct.count}, Drops: ${dDrop.count}, Categories: ${dCategory.count}`);

  console.log('\n--- Step 6: Ensuring Preserved Site & System Configurations ---');
  await prisma.siteConfig.upsert({
    where: { id: 'default_site_config' },
    update: { siteMode: 'PRELAUNCH' },
    create: { id: 'default_site_config', siteMode: 'PRELAUNCH', updatedBy: 'SYSTEM' },
  });

  await prisma.codConfig.upsert({
    where: { id: 'default_cod_config' },
    update: { isEnabled: true, chargeType: 'FIXED', chargeValue: 0 },
    create: { id: 'default_cod_config', isEnabled: true, chargeType: 'FIXED', chargeValue: 0, displayLabel: 'Cash on Delivery' },
  });

  console.log(' ✅ System SiteConfig & CodConfig preserved/verified.');

  console.log('\n====================================================================');
  console.log('✨ FRESH-LAUNCH DATABASE RESET COMPLETE');
  console.log('====================================================================\n');
}

executeFreshLaunchReset().catch((err) => {
  console.error('❌ RESET EXECUTION ERROR:', err);
  process.exit(1);
});
