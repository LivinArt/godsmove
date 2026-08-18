import { constructMetadata, toPlainText } from '../src/lib/seo-metadata';
import { getOrganizationSchema, getWebSiteSchema, getProductSchema } from '../src/lib/json-ld';

async function runMetadataEntitiesQASuite() {
  console.log('====================================================================');
  console.log('🔍 GODSMOVE — SEO METADATA HTML ENTITY QA & GOOGLE PREVIEW SUITE');
  console.log('====================================================================\n');

  let passed = 0;
  let failed = 0;

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

  // ------------------------------------------------------------------
  // 1. HOMEPAGE METADATA EXACT DESCRIPTION & ENTITY AUDIT
  // ------------------------------------------------------------------
  console.log('--- 1. Homepage Metadata Description & HTML Entity Audit ---');
  const homepageMeta = constructMetadata({
    title: "GODSMOVE | Modern Apparel & Premium Clothing Online India",
    description:
      "Explore GODSMOVE's modern apparel collection featuring premium T-shirts, oversized tees, hoodies, denim jackets, and distinctive everyday clothing.",
    path: "/",
  });

  const expectedDesc =
    "Explore GODSMOVE's modern apparel collection featuring premium T-shirts, oversized tees, hoodies, denim jackets, and distinctive everyday clothing.";

  if (homepageMeta.description === expectedDesc) {
    assertPass('Homepage metadata description matches target string exactly', `Description: "${homepageMeta.description}"`);
  } else {
    assertFail('Homepage metadata description mismatch', `Expected: "${expectedDesc}"\n   Received: "${homepageMeta.description}"`);
  }

  const descStr = homepageMeta.description || '';
  const forbiddenEntities = ['&#39;', '&#x27;', '&apos;', '&quot;', '&lt;', '&gt;'];
  const foundEntities = forbiddenEntities.filter((e) => descStr.includes(e));

  if (foundEntities.length === 0) {
    assertPass('Zero raw HTML entities (&#39;, &#x27;, &apos;, &quot;, &lt;, &gt;) in Homepage description');
  } else {
    assertFail(`Raw HTML entities found in Homepage description: ${foundEntities.join(', ')}`);
  }

  if (homepageMeta.description?.includes("GODSMOVE's")) {
    assertPass('Homepage description contains natural apostrophe "GODSMOVE\'s"');
  } else {
    assertFail('Homepage description does NOT contain natural apostrophe "GODSMOVE\'s"');
  }

  // ------------------------------------------------------------------
  // 2. OPENGRAPH & TWITTER METADATA AUDIT
  // ------------------------------------------------------------------
  console.log('\n--- 2. OpenGraph & Twitter Metadata Pipeline Audit ---');
  const ogDesc = homepageMeta.openGraph?.description;
  const twDesc = homepageMeta.twitter?.description;

  if (ogDesc === expectedDesc) {
    assertPass('OpenGraph description receives exact plain-text string', `og:description = "${ogDesc}"`);
  } else {
    assertFail('OpenGraph description does not match expected plain text', `og:description = "${ogDesc}"`);
  }

  if (twDesc === expectedDesc) {
    assertPass('Twitter description receives exact plain-text string', `twitter:description = "${twDesc}"`);
  } else {
    assertFail('Twitter description does not match expected plain text', `twitter:description = "${twDesc}"`);
  }

  // ------------------------------------------------------------------
  // 3. TO-PLAIN-TEXT UTILITY SANITIZATION QA
  // ------------------------------------------------------------------
  console.log('\n--- 3. toPlainText Utility HTML Entity Decoding QA ---');
  const testInput = "Explore GODSMOVE&#39;s modern apparel &amp; oversized tees &quot;crafted&quot; with &lt;quality&gt;.";
  const decoded = toPlainText(testInput);
  const expectedDecoded = "Explore GODSMOVE's modern apparel & oversized tees \"crafted\" with <quality>.";

  if (decoded === expectedDecoded) {
    assertPass('toPlainText cleanly converts HTML entities to natural plain-text characters', `Result: "${decoded}"`);
  } else {
    assertFail('toPlainText failed to convert HTML entities', `Result: "${decoded}"`);
  }

  // ------------------------------------------------------------------
  // 4. PUBLIC PAGES METADATA ENTITY AUDIT
  // ------------------------------------------------------------------
  console.log('\n--- 4. Public Pages Metadata Entity Audit ---');
  const publicPages = [
    { name: 'Drops', meta: constructMetadata({ title: 'New Collection | GODSMOVE', description: 'Discover the latest GODSMOVE clothing collection featuring new T-shirts.', path: '/drops' }) },
    { name: 'Exclusive Rack', meta: constructMetadata({ title: 'Exclusive Collection | GODSMOVE', description: 'Explore GODSMOVE Exclusive Rack. Curated limited edition clothing.', path: '/exclusive-rack' }) },
    { name: 'Library', meta: constructMetadata({ title: 'GODSMOVE Library', description: 'Explore the GODSMOVE Library. Comprehensive editorial articles on garment construction.', path: '/library' }) },
    { name: 'Our Story', meta: constructMetadata({ title: 'Our Story | GODSMOVE', description: 'Explore the philosophy of GODSMOVE: honoring tailors, craftsmen, and human hands.', path: '/our-story' }) },
    { name: 'Terms', meta: constructMetadata({ title: 'Terms & Conditions | GODSMOVE', description: 'GODSMOVE Terms & Conditions. Detailed terms of service governing orders.', path: '/terms' }) },
    { name: 'Privacy', meta: constructMetadata({ title: 'Privacy Policy | GODSMOVE', description: 'GODSMOVE Privacy Policy. Learn how we safeguard your personal data.', path: '/privacy' }) },
    { name: 'Shipping Policy', meta: constructMetadata({ title: 'Shipping Policy | GODSMOVE', description: 'GODSMOVE Shipping Policy. Complimentary shipping across India.', path: '/shipping-exchange-policy' }) },
    { name: 'Cancellation Policy', meta: constructMetadata({ title: 'Cancellation & Refund Policy | GODSMOVE', description: 'Official GODSMOVE Cancellation & Refund Policy.', path: '/cancellation-refund-policy' }) },
  ];

  for (const page of publicPages) {
    const pageDesc = page.meta.description || '';
    const entities = forbiddenEntities.filter((e) => pageDesc.includes(e));
    if (entities.length === 0) {
      assertPass(`${page.name} metadata description is clean without HTML entities`);
    } else {
      assertFail(`${page.name} metadata description contains forbidden entities: ${entities.join(', ')}`);
    }
  }

  // ------------------------------------------------------------------
  // 5. JSON-LD STRUCTURED DATA INVARIANT AUDIT
  // ------------------------------------------------------------------
  console.log('\n--- 5. JSON-LD Structured Data Invariant Audit ---');
  const org = getOrganizationSchema();
  if (org.name === 'GODSMOVE' && !org.description.includes('&#39;')) {
    assertPass('Organization JSON-LD retains valid string formatting without HTML entities', `Org Name: "${org.name}"`);
  } else {
    assertFail('Organization JSON-LD contains HTML entity corruption');
  }

  const website = getWebSiteSchema();
  if (website.name === 'GODSMOVE' && website.url === 'https://www.godsmove.in') {
    assertPass('WebSite JSON-LD schema is valid', `URL: "${website.url}"`);
  } else {
    assertFail('WebSite JSON-LD schema is invalid');
  }

  console.log('\n====================================================================');
  console.log(`📊 METADATA ENTITIES QA SUMMARY: ${passed} PASSED / ${failed} FAILED`);
  console.log('====================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runMetadataEntitiesQASuite().catch((err) => {
  console.error('Fatal error in Metadata Entities QA:', err);
  process.exit(1);
});
