import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function forensicAudit() {
  const { prisma } = await import('../src/lib/prisma');

  console.log('====================================================================');
  console.log('🔍 GODSMOVE GO-LIVE FORENSIC DATABASE AUDIT');
  console.log('====================================================================\n');

  // Safe table fetchers
  const profiles = await prisma.profile.findMany();
  const addresses = await prisma.address.findMany();
  const categories = await prisma.category.findMany();
  const products = await prisma.product.findMany({
    include: {
      variants: {
        include: {
          inventory: true,
        },
      },
    },
  });
  const productVariants = await prisma.productVariant.findMany();
  const inventories = await prisma.inventory.findMany();
  const inventoryMovements = await prisma.inventoryMovement.findMany();
  const orders = await prisma.order.findMany({
    include: {
      items: true,
    },
  });
  const orderItems = await prisma.orderItem.findMany();
  const returns = await prisma.returnRequest.findMany();
  const returnItems = await prisma.returnItem.findMany();
  const memberships = await prisma.membership.findMany();
  const wallets = await prisma.wallet.findMany();
  const walletTx = await prisma.walletTransaction.findMany();
  const wishlists = await prisma.wishlistItem.findMany();
  const preBookingInterests = await prisma.preBookingInterest.findMany();
  const discounts = await prisma.discount.findMany();
  const archivePosts = await prisma.archivePost.findMany();
  const codConfigs = await prisma.codConfig.findMany();
  const heroSlides = await prisma.heroSlide.findMany();

  console.log('--- DB TABLE RECORD COUNTS ---');
  console.log(`Profile:              ${profiles.length}`);
  console.log(`Address:              ${addresses.length}`);
  console.log(`Category:             ${categories.length}`);
  console.log(`Product:              ${products.length}`);
  console.log(`ProductVariant:       ${productVariants.length}`);
  console.log(`Inventory:            ${inventories.length}`);
  console.log(`InventoryMovement:    ${inventoryMovements.length}`);
  console.log(`Order:                ${orders.length}`);
  console.log(`OrderItem:            ${orderItems.length}`);
  console.log(`ReturnRequest:        ${returns.length}`);
  console.log(`ReturnItem:           ${returnItems.length}`);
  console.log(`Membership:           ${memberships.length}`);
  console.log(`Wallet:               ${wallets.length}`);
  console.log(`WalletTransaction:    ${walletTx.length}`);
  console.log(`WishlistItem:         ${wishlists.length}`);
  console.log(`PreBookingInterest:   ${preBookingInterests.length}`);
  console.log(`Discount:             ${discounts.length}`);
  console.log(`ArchivePost (CMS):    ${archivePosts.length}`);
  console.log(`CodConfig:            ${codConfigs.length}`);
  console.log(`HeroSlide:            ${heroSlides.length}`);

  console.log('\n--- PRODUCT CLASSIFICATION ---');
  for (const p of products) {
    const isTestProduct = p.name.toLowerCase().includes('test') || p.slug.toLowerCase().includes('test') || p.name.toLowerCase().includes('qa');
    console.log(`[${isTestProduct ? 'PURGE' : 'KEEP'}] Product: "${p.name}" (ID: ${p.id}, Slug: ${p.slug})`);
  }

  console.log('\n--- PROFILE CLASSIFICATION ---');
  for (const prof of profiles) {
    const isTest = prof.email?.includes('test') || prof.email?.includes('concurrency') || prof.email?.includes('qa') || prof.email?.includes('example.com');
    const isAdmin = prof.role === 'ADMIN' || prof.email?.includes('admin@godsmove.in');
    console.log(`[${isAdmin ? 'KEEP (ADMIN)' : (isTest ? 'PURGE' : 'KEEP')}] Profile: ID=${prof.id}, Email="${prof.email}", Role=${prof.role || 'CUSTOMER'}`);
  }

  console.log('\n--- ORDER CLASSIFICATION ---');
  for (const o of orders) {
    const isTestOrder = o.email?.includes('test') || o.email?.includes('concurrency') || o.email?.includes('qa') || o.orderNumber?.includes('TEST') || o.email?.includes('example.com');
    console.log(`[${isTestOrder ? 'PURGE' : 'PURGE_TEST_ORDER'}] Order: #${o.orderNumber} (ID: ${o.id}, Email: ${o.email}, Status: ${o.status}, Total: ₹${o.total})`);
  }

  console.log('\n--- CMS ARCHIVE POST CLASSIFICATION ---');
  for (const a of archivePosts) {
    const isTestArticle = a.title.toLowerCase().includes('test') || a.slug.toLowerCase().includes('test');
    console.log(`[${isTestArticle ? 'PURGE' : 'KEEP'}] ArchivePost: "${a.title}" (Slug: ${a.slug})`);
  }

  // Backup DB data to file
  const backupData = {
    timestamp: new Date().toISOString(),
    profiles,
    addresses,
    categories,
    products,
    productVariants,
    inventories,
    inventoryMovements,
    orders,
    orderItems,
    returns,
    returnItems,
    memberships,
    wallets,
    walletTx,
    wishlists,
    preBookingInterests,
    discounts,
    archivePosts,
    codConfigs,
    heroSlides,
  };

  const backupDir = path.resolve(process.cwd(), 'scratch');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  const backupPath = path.resolve(backupDir, `db_backup_pre_purge_${Date.now()}.json`);
  fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
  console.log(`\n💾 FULL DATABASE BACKUP WRITTEN TO: ${backupPath}`);

  await prisma.$disconnect();
}

forensicAudit().catch(console.error);
