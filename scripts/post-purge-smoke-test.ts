import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function postPurgeSmokeTest() {
  const { prisma } = await import('../src/lib/prisma');

  console.log('====================================================================');
  console.log('🔬 GODSMOVE — POST-PURGE LIVE SMOKE TEST & FORENSIC SECURITY AUDIT');
  console.log('====================================================================\n');

  // 1. Database Table Counts
  const profiles = await prisma.profile.findMany();
  const addresses = await prisma.address.findMany();
  const categories = await prisma.category.findMany();
  const products = await prisma.product.findMany({
    include: {
      images: true,
      variants: {
        include: {
          inventory: true,
        },
      },
    },
  });
  const productVariants = await prisma.productVariant.findMany();
  const inventories = await prisma.inventory.findMany();
  const orders = await prisma.order.findMany();
  const orderItems = await prisma.orderItem.findMany();
  const returns = await prisma.returnRequest.findMany();
  const memberships = await prisma.membership.findMany();
  const wishlists = await prisma.wishlistItem.findMany();
  const archivePosts = await prisma.archivePost.findMany();
  const codConfigs = await prisma.codConfig.findMany();
  const heroSlides = await prisma.heroSlide.findMany();
  const discounts = await prisma.discount.findMany();

  console.log('--- POST-PURGE DATABASE COUNTS ---');
  console.log(`Profiles:              ${profiles.length}`);
  console.log(`Addresses:             ${addresses.length}`);
  console.log(`Categories:            ${categories.length}`);
  console.log(`Products:              ${products.length}`);
  console.log(`ProductVariants:       ${productVariants.length}`);
  console.log(`Inventories:           ${inventories.length}`);
  console.log(`Orders:                ${orders.length}`);
  console.log(`OrderItems:            ${orderItems.length}`);
  console.log(`ReturnRequests:        ${returns.length}`);
  console.log(`Memberships:           ${memberships.length}`);
  console.log(`WishlistItems:         ${wishlists.length}`);
  console.log(`ArchivePosts (CMS):    ${archivePosts.length}`);
  console.log(`CodConfig:             ${codConfigs.length}`);
  console.log(`HeroSlide:             ${heroSlides.length}`);
  console.log(`Discounts:             ${discounts.length}\n`);

  // 2. Critical Retained Customer Data Classification
  console.log('====================================================================');
  console.log('👤 RETAINED CUSTOMER PROFILE CLASSIFICATION AUDIT');
  console.log('====================================================================');

  const knownAdmins = ['admin@godsmove.com', 'livinarttech@gmail.com', 'admin@godsmove.in'];
  const knownLaunchAccounts = [
    'rishi@godsmove.com',
    'rishi@gmail.com',
    'uat_customer@godsmove.com',
    'customer@godsmove.com',
    'decisive@creator.com',
    'bilaspurrrbrailway@gmail.com',
    'vectorvariations@gmail.com',
    'bhavnadevesh79@gmail.com',
    'arorakomal209@gmail.com',
    'kanwalpreetarora1@gmail.com',
    'mohitbde007@gmail.com',
    'sagarsirotiyaa@gmail.com',
    'mjainstartup@gmail.com',
    'jamesallen6788@gmail.com',
    'justzaidk@gmail.com',
    'realzaidk@gmail.com',
    'malviyarishi330@gmail.com',
    'malviyarohit2007@gmail.com',
    'broc1990gfr@gmail.com',
    'churasiyagungun@gmail.com',
  ];

  let unclassifiedCount = 0;
  for (const prof of profiles) {
    let classification = 'UNKNOWN';
    if (prof.role === 'ADMIN' || knownAdmins.includes(prof.email?.toLowerCase())) {
      classification = 'ADMIN';
    } else if (knownLaunchAccounts.includes(prof.email?.toLowerCase())) {
      classification = 'PRODUCTION / LAUNCH CUSTOMER';
    } else if (prof.email?.toLowerCase().includes('test') || prof.email?.toLowerCase().includes('qa') || prof.email?.toLowerCase().includes('example')) {
      classification = 'TEST ACCOUNT (UNPURGED)';
      unclassifiedCount++;
    } else {
      classification = 'PRODUCTION CUSTOMER';
    }

    console.log(`• Profile ID: ${prof.id} | Email: ${prof.email} | Name: "${prof.firstName || ''} ${prof.lastName || ''}" | Role: ${prof.role} | Classification: [${classification}]`);
  }

  // 3. Inventory Stock Invariant Check
  console.log('\n====================================================================');
  console.log('📦 RETAINED PRODUCT INVENTORY STOCK INVARIANT CHECK');
  console.log('====================================================================');

  let stockViolations = 0;
  for (const p of products) {
    const totalInventory = p.variants.reduce((sum, v) => sum + (v.inventory?.totalStock || 0), 0);
    const soldInventory = p.variants.reduce((sum, v) => sum + (v.inventory?.soldStock || 0), 0);
    const reservedInventory = p.variants.reduce((sum, v) => sum + (v.inventory?.reservedStock || 0), 0);
    const availableInventory = totalInventory - soldInventory - reservedInventory;

    if (soldInventory !== 0 || reservedInventory !== 0) {
      stockViolations++;
    }

    console.log(`• Product: "${p.name}" (Slug: ${p.slug})`);
    console.log(`  Variants: ${p.variants.length} | Total Stock: ${totalInventory} | Sold: ${soldInventory} | Reserved: ${reservedInventory} | Available: ${availableInventory}`);
  }

  console.log(`Stock Invariant Summary: ${stockViolations === 0 ? '✅ 100% INVENTORY CLEAN (All soldStock = 0, reservedStock = 0)' : `❌ VIOLATION (${stockViolations} products have non-zero sold/reserved)`}`);

  // 4. Forensic Search for Test Data Leakage
  console.log('\n====================================================================');
  console.log('🔍 FORENSIC SEARCH FOR TEST DATA LEAKAGE');
  console.log('====================================================================');

  const testKeywords = ['test', 'qa', 'dummy', 'last test', 'sample', 'localhost'];
  let totalMatches = 0;

  // Search Products
  for (const p of products) {
    for (const kw of testKeywords) {
      if (p.name.toLowerCase().includes(kw) || p.slug.toLowerCase().includes(kw)) {
        console.log(`⚠️ MATCH FOUND in Product name/slug: "${p.name}" (${p.slug}) matches "${kw}"`);
        totalMatches++;
      }
    }
  }

  // Search Articles
  for (const a of archivePosts) {
    for (const kw of testKeywords) {
      if (a.title.toLowerCase().includes(kw) || a.slug.toLowerCase().includes(kw)) {
        console.log(`⚠️ MATCH FOUND in Article title/slug: "${a.title}" (${a.slug}) matches "${kw}"`);
        totalMatches++;
      }
    }
  }

  // Search Profiles
  for (const prof of profiles) {
    for (const kw of ['qatest', 'hotfix_qa', 'concurrency.test', 'aarav.sharma@example.com']) {
      if (prof.email.toLowerCase().includes(kw)) {
        console.log(`⚠️ MATCH FOUND in Profile email: "${prof.email}" matches "${kw}"`);
        totalMatches++;
      }
    }
  }

  console.log(`Forensic Test Leakage Search Result: ${totalMatches === 0 ? '✅ ZERO TEST LEAKAGE MATCHES FOUND' : `⚠️ ${totalMatches} LEAKAGE MATCHES FOUND`}`);

  // 5. Environment & Integration Check
  console.log('\n====================================================================');
  console.log('⚙️ ENVIRONMENT & PAYMENT CONFIGURATION AUDIT');
  console.log('====================================================================');

  const rzpKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.godsmove.in';
  const resendKey = process.env.RESEND_API_KEY;

  console.log(`• Site Domain:                ${siteUrl}`);
  console.log(`• Razorpay Key ID:            ${rzpKeyId ? `${rzpKeyId.slice(0, 8)}... (${rzpKeyId.startsWith('rzp_live') ? 'LIVE PRODUCTION 🟢' : 'TEST KEY 🟡'})` : 'NOT SET'}`);
  console.log(`• Resend Email API Key:       ${resendKey ? 'CONFIGURED 🟢' : 'NOT SET'}`);
  console.log(`• COD Handling Fee Config:    ${codConfigs.length > 0 ? `Enabled (Fee: ₹${codConfigs[0].chargeValue})` : 'DEFAULT'}`);

  await prisma.$disconnect();
}

postPurgeSmokeTest().catch(console.error);
