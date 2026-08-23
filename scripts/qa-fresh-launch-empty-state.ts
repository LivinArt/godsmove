import { prisma } from '../src/lib/prisma';

async function runFreshLaunchEmptyStateQA() {
  console.log('====================================================================');
  console.log('🚀 RUNNING GODSMOVE FRESH-LAUNCH FORENSIC ZERO-STATE QA SUITE');
  console.log('====================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      if (detail) console.log(`   └─ ${detail}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      if (detail) console.error(`   └─ ${detail}`);
      failed++;
    }
  }

  try {
    // 1. Database Connection & Schema Health
    const siteConfig = await prisma.siteConfig.findUnique({ where: { id: 'default_site_config' } });
    assert(Boolean(siteConfig), 'Database Connection & Schema Health', `SiteConfig mode: ${siteConfig?.siteMode}`);

    // 2. Admin Account Preserved
    const adminProfiles = await prisma.profile.findMany({ where: { role: { not: 'CUSTOMER' } } });
    assert(adminProfiles.length > 0, 'Administrative Account Preserved', `Active Admins: ${adminProfiles.map(a => a.email).join(', ')}`);

    // 3. Customer Profiles Zero-State
    const customerCount = await prisma.profile.count({ where: { role: 'CUSTOMER' } });
    assert(customerCount === 0, 'Customer Profiles Zero-State', `CUSTOMERS = ${customerCount}`);

    // 4. Addresses Zero-State
    const addressCount = await prisma.address.count();
    assert(addressCount === 0, 'Customer Addresses Zero-State', `ADDRESSES = ${addressCount}`);

    // 5. Orders Zero-State
    const orderCount = await prisma.order.count();
    assert(orderCount === 0, 'Orders Zero-State', `ORDERS = ${orderCount}`);

    // 6. Order Items Zero-State
    const orderItemCount = await prisma.orderItem.count();
    assert(orderItemCount === 0, 'Order Items Zero-State', `ORDER ITEMS = ${orderItemCount}`);

    // 7. Returns & Exchange Zero-State
    const returnCount = await prisma.returnRequest.count();
    const returnItemCount = await prisma.returnItem.count();
    assert(returnCount === 0 && returnItemCount === 0, 'Return Requests & Items Zero-State', `RETURNS = ${returnCount}, RETURN ITEMS = ${returnItemCount}`);

    // 8. Shipments & Tracking Zero-State
    const shipmentCount = await prisma.shipment.count();
    const shipmentEventCount = await prisma.shipmentEvent.count();
    assert(shipmentCount === 0 && shipmentEventCount === 0, 'Shipments & Events Zero-State', `SHIPMENTS = ${shipmentCount}, EVENTS = ${shipmentEventCount}`);

    // 9. Payment & Checkout Sessions Zero-State
    const checkoutSessionCount = await prisma.checkoutSession.count();
    const paymentSessionCount = await prisma.paymentSession.count();
    assert(checkoutSessionCount === 0 && paymentSessionCount === 0, 'Checkout & Payment Sessions Zero-State', `CHECKOUT SESSIONS = ${checkoutSessionCount}, PAYMENT SESSIONS = ${paymentSessionCount}`);

    // 10. Customer Memberships Zero-State
    const customerMembershipCount = await prisma.membership.count({
      where: { profile: { role: 'CUSTOMER' } },
    });
    assert(customerMembershipCount === 0, 'Customer Memberships Zero-State', `MEMBERSHIPS = ${customerMembershipCount}`);

    // 11. Customer Wallets & Transactions Zero-State
    const customerWalletCount = await prisma.wallet.count({
      where: { profile: { role: 'CUSTOMER' } },
    });
    const walletTxnCount = await prisma.walletTransaction.count();
    assert(customerWalletCount === 0 && walletTxnCount === 0, 'Customer Wallets & Transactions Zero-State', `WALLETS = ${customerWalletCount}, TRANSACTIONS = ${walletTxnCount}`);

    // 12. Wishlists Zero-State
    const wishlistItemCount = await prisma.wishlistItem.count();
    assert(wishlistItemCount === 0, 'Wishlist Items Zero-State', `WISHLISTS = ${wishlistItemCount}`);

    // 13. Early Access Registrations Zero-State
    const earlyAccessCount = await prisma.profile.count({ where: { earlyAccessRegistered: true } });
    assert(earlyAccessCount === 0, 'Early Access Registrations Zero-State', `EARLY ACCESS REGISTRATIONS = ${earlyAccessCount}`);

    // 14. Pre-Booking Customer Records Zero-State
    const preBookingCount = await prisma.preBookingInterest.count();
    assert(preBookingCount === 0, 'Pre-Booking Customer Records Zero-State', `PRE-BOOKING INTERESTS = ${preBookingCount}`);

    // 15. Active Products Zero-State
    const productCount = await prisma.product.count();
    const activeProductCount = await prisma.product.count({ where: { status: 'ACTIVE' } });
    assert(productCount === 0 && activeProductCount === 0, 'Products & Active Catalog Zero-State', `PRODUCTS = ${productCount}`);

    // 16. Product Variants Zero-State
    const variantCount = await prisma.productVariant.count();
    assert(variantCount === 0, 'Product Variants Zero-State', `VARIANTS = ${variantCount}`);

    // 17. Inventory Levels Zero-State
    const inventoryCount = await prisma.inventory.count();
    const totalInventoryStock = await prisma.inventory.aggregate({
      _sum: { totalStock: true, reservedStock: true, soldStock: true },
    });
    const sumTotal = totalInventoryStock._sum.totalStock || 0;
    const sumReserved = totalInventoryStock._sum.reservedStock || 0;
    const sumSold = totalInventoryStock._sum.soldStock || 0;
    assert(inventoryCount === 0 && sumTotal === 0 && sumReserved === 0 && sumSold === 0, 'Inventory Stock Zero-State', `INVENTORY = ${inventoryCount}, AVAILABLE = ${sumTotal}, RESERVED = ${sumReserved}, SOLD = ${sumSold}`);

    // 18. Drops Catalog Assignments Zero-State
    const dropCount = await prisma.drop.count();
    const dropProductAssignmentCount = await prisma.product.count({ where: { dropId: { not: null } } });
    assert(dropCount === 0 && dropProductAssignmentCount === 0, 'Drops Catalog Assignments Zero-State', `DROPS = ${dropCount}, ASSIGNMENTS = ${dropProductAssignmentCount}`);

    // 19. Exclusive Rack Assignments Zero-State
    const exclusiveRackCount = await prisma.product.count({ where: { isExclusiveRack: true } });
    assert(exclusiveRackCount === 0, 'Exclusive Rack Assignments Zero-State', `EXCLUSIVE RACK PRODUCTS = ${exclusiveRackCount}`);

    // 20. Categories Zero-State
    const categoryCount = await prisma.category.count();
    assert(categoryCount === 0, 'Product Categories Zero-State', `CATEGORIES = ${categoryCount}`);

    // 21. Badges & Merchandising Zero-State
    const badgeCount = await prisma.product.count({ where: { featuredBadge: { not: null } } });
    assert(badgeCount === 0, 'Product Badge Assignments Zero-State', `BADGES = ${badgeCount}`);

    // 22. Discounts & Test Promotions Zero-State
    const discountCount = await prisma.discount.count();
    assert(discountCount === 0, 'Discounts & Promotional Data Zero-State', `DISCOUNTS = ${discountCount}`);

    // 23. Test Notifications History Cleaned
    const notifCount = await prisma.notificationHistory.count();
    assert(notifCount === 0, 'Notification History Cleaned', `NOTIFICATION LOGS = ${notifCount}`);

    // 24. Orphan Foreign Key Integrity Check
    const orphanOrders = await prisma.order.count({ where: { profileId: { not: null }, profile: null } });
    assert(orphanOrders === 0, 'Orphan Foreign Key Integrity Check', `ORPHAN ORDERS = ${orphanOrders}`);

    // 25. Mandatory System Configurations Intact
    const codConfig = await prisma.codConfig.findUnique({ where: { id: 'default_cod_config' } });
    assert(Boolean(codConfig), 'Mandatory System Configs Preserved', `CodConfig enabled: ${codConfig?.isEnabled}`);

  } catch (err: any) {
    console.error('CRITICAL QA ERROR:', err);
    failed++;
  }

  console.log('\n====================================================================');
  console.log(`📊 FORENSIC QA SUMMARY: ${passed} PASSED, ${failed} FAILED out of ${passed + failed} TESTS`);
  console.log('====================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runFreshLaunchEmptyStateQA();
