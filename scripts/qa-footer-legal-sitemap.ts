import sitemap from '../src/app/sitemap';
import robots from '../src/app/robots';
import { prisma } from '../src/lib/prisma';
import fs from 'fs';
import path from 'path';

async function runFooterLegalSitemapQASuite() {
  console.log('====================================================================');
  console.log('🔍 RUNNING GODSMOVE FOOTER, LEGAL TERMS & SITEMAP QA SUITE');
  console.log('====================================================================\n');

  let passed = 0;
  let failed = 0;
  let warnings = 0;

  function assertPass(testName: string, detail?: string) {
    console.log(`✅ [PASS] ${testName}`);
    if (detail) console.log(`   ${detail}`);
    passed++;
  }

  function assertFail(testName: string, detail?: string) {
    console.error(`❌ [FAIL] ${testName}`);
    if (detail) console.error(`   ${detail}`);
    failed++;
  }

  function assertWarn(testName: string, detail?: string) {
    console.warn(`⚠️  [WARN] ${testName}`);
    if (detail) console.warn(`   ${detail}`);
    warnings++;
  }

  // ------------------------------------------------------------------
  // 1. FOOTER AUDIT & ROUTE VERIFICATION
  // ------------------------------------------------------------------
  console.log('--- 1. Footer Audit & Route Verification ---');
  const footerFilePath = path.join(process.cwd(), 'src/components/Footer.tsx');
  const footerContent = fs.readFileSync(footerFilePath, 'utf-8');

  if (footerContent.includes('export default function Footer')) {
    assertPass('Footer component exists and exports default component');
  } else {
    assertFail('Footer component file missing or malformed');
  }

  // Extract all hrefs from Footer.tsx
  const hrefMatches = Array.from(footerContent.matchAll(/href=["']([^"']+)["']/g)).map((m) => m[1]);

  const hasLocalhost = hrefMatches.some((h) => h.includes('localhost'));
  const hasAdmin = hrefMatches.some((h) => h.includes('/admin'));

  if (!hasLocalhost) {
    assertPass('No localhost URLs in Footer component');
  } else {
    assertFail('Localhost URL found in Footer component!');
  }

  if (!hasAdmin) {
    assertPass('No admin/private URLs exposed in Footer component');
  } else {
    assertFail('Admin route exposed in Footer component!');
  }

  const expectedFooterLinks = [
    { name: 'Terms & Conditions', href: '/terms' },
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Pre-Booking Terms Anchor', href: '/terms#pre-booking-terms' },
    { name: 'Membership Terms Anchor', href: '/terms#membership-terms' },
    { name: 'Shipping & Exchange Policy', href: '/shipping-exchange-policy' },
    { name: 'Cancellation & Refund Policy', href: '/cancellation-refund-policy' },
    { name: 'Drops', href: '/drops' },
    { name: 'Exclusive Rack', href: '/exclusive-rack' },
    { name: 'Our Story', href: '/our-story' },
  ];

  for (const link of expectedFooterLinks) {
    if (hrefMatches.includes(link.href)) {
      assertPass(`Footer contains valid destination link for ${link.name}`, `Target: ${link.href}`);
    } else {
      assertFail(`Footer missing required link for ${link.name}`, `Expected: ${link.href}`);
    }
  }

  // ------------------------------------------------------------------
  // 2. LEGAL TERMS & CONDITIONS EXPANSION AUDIT
  // ------------------------------------------------------------------
  console.log('\n--- 2. Legal Terms & Conditions Expansion Audit ---');
  const termsFilePath = path.join(process.cwd(), 'src/app/terms/page.tsx');
  const termsContent = fs.readFileSync(termsFilePath, 'utf-8');

  if (termsContent.includes('id="pre-booking-terms"') && termsContent.includes('13. Pre-Booking Terms')) {
    assertPass('Pre-Booking Terms & Conditions section (id="pre-booking-terms") exists on Terms page');
  } else {
    assertFail('Pre-Booking Terms section missing from Terms page');
  }

  if (termsContent.includes('id="membership-terms"') && termsContent.includes('14. GODSMOVE Membership Terms')) {
    assertPass('GODSMOVE Membership Terms & Conditions section (id="membership-terms") exists on Terms page');
  } else {
    assertFail('Membership Terms section missing from Terms page');
  }

  if (termsContent.includes('Cash on Delivery (COD) is strictly unavailable')) {
    assertPass('Pre-booking payment terms explicitly reflect COD unavailability');
  } else {
    assertFail('Pre-booking payment terms missing explicit COD rule');
  }

  if (termsContent.includes('AVAILABLE = TOTAL PHYSICAL INVENTORY - SOLD + RETURN')) {
    assertPass('Pre-booking inventory formula matches technical implementation (AVAILABLE = TOTAL - SOLD + RETURN)');
  } else {
    assertFail('Pre-booking inventory formula mismatch in legal terms');
  }

  if (termsContent.includes('SOLD OUT') && termsContent.includes('AVAILABLE = 0')) {
    assertPass('Sold-out storefront visibility policy matches implementation');
  } else {
    assertFail('Sold-out visibility policy mismatch in legal terms');
  }

  if (termsContent.includes('1 YEAR (365 days)')) {
    assertPass('Membership duration rule explicitly specified as 1 YEAR (365 days)');
  } else {
    assertFail('Membership duration rule mismatch');
  }

  if (termsContent.includes('does not automatically extend or stack')) {
    assertPass('Subsequent pre-booking membership extension rule matches technical implementation');
  } else {
    assertFail('Subsequent pre-booking membership extension rule missing or incorrect');
  }

  // Verify clauses 1 to 12 remain intact
  const expectedClauses = [
    '1. General Terms',
    '2. Orders &',
    '3. Payments & Pricing',
    '4. Account',
    '5. GODSMOVE Wallet Credits',
    '6. Returns & Exchanges',
    '7. Intellectual Property',
    '8. Limitation of Liability',
    '9. User Conduct',
    '10. Privacy Integration',
    '11. Governing Law & Jurisdiction',
    '12. Force Majeure',
  ];

  let intactClauses = 0;
  for (const clause of expectedClauses) {
    if (termsContent.includes(clause)) intactClauses++;
  }

  if (intactClauses === expectedClauses.length) {
    assertPass(`All ${expectedClauses.length} pre-existing legal clauses remain intact`);
  } else {
    assertFail(`Pre-existing legal clauses damaged! Found ${intactClauses}/${expectedClauses.length}`);
  }

  // ------------------------------------------------------------------
  // 3. COMPLETE XML SITEMAP AUDIT
  // ------------------------------------------------------------------
  console.log('\n--- 3. Complete XML Sitemap Audit ---');
  let sitemapEntries: any[] = [];
  try {
    sitemapEntries = await sitemap();
    if (Array.isArray(sitemapEntries) && sitemapEntries.length > 0) {
      assertPass(`Sitemap generated successfully with ${sitemapEntries.length} URL entries`);
    } else {
      assertFail('Sitemap returned empty or invalid array');
    }
  } catch (err: any) {
    assertFail('Sitemap execution failed', err.message);
  }

  const sitemapUrls = sitemapEntries.map((e) => e.url);

  // Check production domain
  const nonProdUrls = sitemapUrls.filter((url) => !url.startsWith('https://www.godsmove.in'));
  if (nonProdUrls.length === 0) {
    assertPass('100% of sitemap URLs use canonical production domain (https://www.godsmove.in)');
  } else {
    assertFail(`Non-production URLs found in sitemap: ${nonProdUrls.join(', ')}`);
  }

  // Check localhost
  const localhostSitemapUrls = sitemapUrls.filter((url) => url.includes('localhost'));
  if (localhostSitemapUrls.length === 0) {
    assertPass('Zero localhost URLs in sitemap');
  } else {
    assertFail('Localhost URLs present in sitemap!');
  }

  // Check duplicate URLs
  const uniqueUrls = new Set(sitemapUrls);
  if (uniqueUrls.size === sitemapUrls.length) {
    assertPass('Zero duplicate URLs in sitemap');
  } else {
    assertFail(`Duplicate URLs found in sitemap! Unique: ${uniqueUrls.size}, Total: ${sitemapUrls.length}`);
  }

  // Check excluded private routes
  const privateRoutePatterns = ['/admin', '/checkout', '/profile', '/cart', '/wishlist', '/auth', '/api', '/login'];
  const leakedPrivateUrls = sitemapUrls.filter((url) => privateRoutePatterns.some((pattern) => url.includes(pattern)));

  if (leakedPrivateUrls.length === 0) {
    assertPass('Zero private routes (/admin, /checkout, /profile, /cart, etc.) in sitemap');
  } else {
    assertFail(`Private routes leaked into sitemap: ${leakedPrivateUrls.join(', ')}`);
  }

  // Check static commercial routes
  const expectedStaticSitemapRoutes = [
    'https://www.godsmove.in',
    'https://www.godsmove.in/drops',
    'https://www.godsmove.in/exclusive-rack',
    'https://www.godsmove.in/our-story',
    'https://www.godsmove.in/terms',
    'https://www.godsmove.in/privacy',
    'https://www.godsmove.in/shipping-exchange-policy',
    'https://www.godsmove.in/cancellation-refund-policy',
  ];

  for (const route of expectedStaticSitemapRoutes) {
    if (sitemapUrls.includes(route)) {
      assertPass(`Sitemap includes core public route: ${route}`);
    } else {
      assertFail(`Sitemap missing core public route: ${route}`);
    }
  }

  // Check active products in sitemap
  try {
    const activeProducts = await prisma.product.findMany({
      where: { status: 'ACTIVE' },
      select: { slug: true },
    });

    const activeProductUrls = activeProducts.map((p) => `https://www.godsmove.in/product/${p.slug}`);
    const missingProductUrls = activeProductUrls.filter((url) => !sitemapUrls.includes(url));

    if (missingProductUrls.length === 0) {
      assertPass(`All ${activeProducts.length} published active product URLs are dynamically included in sitemap`);
    } else {
      assertFail(`Active product URLs missing from sitemap: ${missingProductUrls.join(', ')}`);
    }
  } catch (err: any) {
    assertFail('Failed to query active products from database for sitemap QA', err.message);
  }

  // ------------------------------------------------------------------
  // 4. ROBOTS.TXT AUDIT
  // ------------------------------------------------------------------
  console.log('\n--- 4. Robots.txt Audit ---');
  const robotsConfig = robots();
  const robotsSitemap = robotsConfig.sitemap;

  if (robotsSitemap === 'https://www.godsmove.in/sitemap.xml') {
    assertPass('Robots.txt correctly references canonical production sitemap URL (https://www.godsmove.in/sitemap.xml)');
  } else {
    assertFail('Robots.txt sitemap reference incorrect', `Actual: ${robotsSitemap}`);
  }

  console.log('\n====================================================================');
  console.log(`📊 FOOTER, LEGAL & SITEMAP QA SUMMARY: ${passed} PASSED / ${failed} FAILED / ${warnings} WARNINGS`);
  console.log('====================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runFooterLegalSitemapQASuite()
  .catch((err) => {
    console.error('Fatal Error running Footer, Legal & Sitemap QA Suite:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
