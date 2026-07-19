/**
 * GODSMOVE — Prisma Seed Script
 * Seeds the database with initial data migrated from static files.
 * Run: npx prisma db seed
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' }); // must be before PrismaClient import

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { domainFromChannel } from '../src/lib/product-domain-sync';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  console.log('🌱 Seeding GODSMOVE database...');

  // ── CATEGORIES ───────────────────────────────────────────────────────────────
  const tees = await prisma.category.upsert({
    where: { slug: 'tees' },
    update: {},
    create: { name: 'Tees', slug: 'tees', position: 0 },
  });

  const hoodies = await prisma.category.upsert({
    where: { slug: 'hoodies' },
    update: {},
    create: { name: 'Hoodies', slug: 'hoodies', position: 1 },
  });

  const accessories = await prisma.category.upsert({
    where: { slug: 'accessories' },
    update: {},
    create: { name: 'Accessories', slug: 'accessories', position: 2 },
  });

  console.log('✅ Categories created');

  // ── DROPS ─────────────────────────────────────────────────────────────────────
  const drop001 = await prisma.drop.upsert({
    where: { slug: 'drop-001' },
    update: {},
    create: {
      name: 'Drop 001',
      slug: 'drop-001',
      tagline: 'First contact.',
      description:
        'Heavyweight essentials for the interior monologue. 300 GSM. Oversized. Washed. Quiet on the outside.',
      status: 'LIVE',
      launchAt: new Date('2026-05-15'),
      heroImageUrl: '/images/campaign/editorial-01.png',
    },
  });

  const drop002 = await prisma.drop.upsert({
    where: { slug: 'drop-002' },
    update: {},
    create: {
      name: 'Drop 002',
      slug: 'drop-002',
      tagline: 'Signal decay.',
      description:
        'Heavier weight. Heavier wash. The same quiet rebellion at 320 GSM.',
      status: 'SCHEDULED',
      launchAt: new Date('2026-06-01'),
      heroImageUrl: '/images/campaign/editorial-02.png',
    },
  });

  console.log('✅ Drops created');

  // ── PRODUCTS ──────────────────────────────────────────────────────────────────
  const productData = [
    {
      name: 'Void Tee',
      slug: 'void-tee-black',
      tagline: 'Absorbs everything.',
      shortDesc: 'Oversized heavyweight in Void Black.',
      description:
        '300 GSM heavyweight cotton. Oversized drop-shoulder cut. Ribbed collar. Bio-washed finish.',
      symbolism:
        'Void Black. The colour of empty browser tabs and 3AM thoughts.',
      status: 'ACTIVE' as const,
      isFeatured: true,
      categoryId: tees.id,
      dropId: drop001.id,
      variants: [
        { sku: 'SS-VOID-BLK-S', size: 'S', price: 2999, stock: 15 },
        { sku: 'SS-VOID-BLK-M', size: 'M', price: 2999, stock: 20 },
        { sku: 'SS-VOID-BLK-L', size: 'L', price: 2999, stock: 18 },
        { sku: 'SS-VOID-BLK-XL', size: 'XL', price: 2999, stock: 12 },
        { sku: 'SS-VOID-BLK-XXL', size: 'XXL', price: 2999, stock: 0 },
      ],
      images: [
        { url: '/images/products/tee-black.png', isCover: true, position: 0 },
      ],
      tags: ['drop-001', 'heavyweight', 'black'],
    },
    {
      name: 'Static Tee',
      slug: 'static-tee-charcoal',
      tagline: 'Enzyme-washed quiet.',
      shortDesc: 'Oversized heavyweight in Washed Charcoal.',
      description:
        '300 GSM heavyweight cotton. Oversized drop-shoulder cut. Enzyme-washed charcoal finish.',
      symbolism: 'Static. The sound between frequencies. The noise inside stillness.',
      status: 'ACTIVE' as const,
      isFeatured: true,
      categoryId: tees.id,
      dropId: drop001.id,
      variants: [
        { sku: 'SS-STAT-CHR-S', size: 'S', price: 2999, stock: 10 },
        { sku: 'SS-STAT-CHR-M', size: 'M', price: 2999, stock: 22 },
        { sku: 'SS-STAT-CHR-L', size: 'L', price: 2999, stock: 18 },
        { sku: 'SS-STAT-CHR-XL', size: 'XL', price: 2999, stock: 14 },
        { sku: 'SS-STAT-CHR-XXL', size: 'XXL', price: 2999, stock: 8 },
      ],
      images: [
        { url: '/images/products/tee-charcoal.png', isCover: true, position: 0 },
      ],
      tags: ['drop-001', 'heavyweight', 'charcoal'],
    },
    {
      name: 'Noise Tee',
      slug: 'noise-tee-ivory',
      tagline: 'Raw ivory tone.',
      shortDesc: 'Oversized heavyweight in Off-White.',
      description:
        '300 GSM heavyweight cotton. Oversized drop-shoulder cut. Raw ivory tone with natural texture.',
      symbolism: 'Noise is what makes the signal meaningful.',
      status: 'ACTIVE' as const,
      isFeatured: true,
      categoryId: tees.id,
      dropId: drop001.id,
      variants: [
        { sku: 'SS-NOIS-IVR-S', size: 'S', price: 2999, stock: 0 },
        { sku: 'SS-NOIS-IVR-M', size: 'M', price: 2999, stock: 16 },
        { sku: 'SS-NOIS-IVR-L', size: 'L', price: 2999, stock: 20 },
        { sku: 'SS-NOIS-IVR-XL', size: 'XL', price: 2999, stock: 15 },
        { sku: 'SS-NOIS-IVR-XXL', size: 'XXL', price: 2999, stock: 9 },
      ],
      images: [
        { url: '/images/products/tee-ivory.png', isCover: true, position: 0 },
      ],
      tags: ['drop-001', 'heavyweight', 'ivory'],
    },
    {
      name: 'Signal Tee',
      slug: 'signal-tee-olive',
      tagline: 'Faded olive. Garment-dyed.',
      shortDesc: 'Oversized heavyweight in Faded Olive.',
      description:
        '300 GSM heavyweight cotton. Oversized drop-shoulder cut. Garment-dyed olive with faded wash.',
      symbolism: 'Signal is what you send when words run out.',
      status: 'ACTIVE' as const,
      isFeatured: false,
      categoryId: tees.id,
      dropId: drop001.id,
      variants: [
        { sku: 'SS-SGNL-OLV-S', size: 'S', price: 3199, stock: 8 },
        { sku: 'SS-SGNL-OLV-M', size: 'M', price: 3199, stock: 12 },
        { sku: 'SS-SGNL-OLV-L', size: 'L', price: 3199, stock: 11 },
        { sku: 'SS-SGNL-OLV-XL', size: 'XL', price: 3199, stock: 0 },
        { sku: 'SS-SGNL-OLV-XXL', size: 'XXL', price: 3199, stock: 0 },
      ],
      images: [
        { url: '/images/products/tee-olive.png', isCover: true, position: 0 },
      ],
      tags: ['drop-001', 'heavyweight', 'olive'],
    },
    {
      name: 'Drift Tee',
      slug: 'drift-tee-washed-grey',
      tagline: 'Stone-washed lived-in softness.',
      shortDesc: 'Oversized heavyweight in Washed Stone.',
      description:
        '300 GSM heavyweight cotton. Oversized drop-shoulder cut. Stone-washed grey.',
      symbolism: 'Drift. To move without urgency. To exist without explaining.',
      status: 'ACTIVE' as const,
      isFeatured: true,
      categoryId: tees.id,
      dropId: drop001.id,
      variants: [
        { sku: 'SS-DRFT-STN-S', size: 'S', price: 2999, stock: 14 },
        { sku: 'SS-DRFT-STN-M', size: 'M', price: 2999, stock: 20 },
        { sku: 'SS-DRFT-STN-L', size: 'L', price: 2999, stock: 18 },
        { sku: 'SS-DRFT-STN-XL', size: 'XL', price: 2999, stock: 13 },
        { sku: 'SS-DRFT-STN-XXL', size: 'XXL', price: 2999, stock: 7 },
      ],
      images: [
        { url: '/images/products/tee-washed-grey.png', isCover: true, position: 0 },
      ],
      tags: ['drop-001', 'heavyweight', 'grey'],
    },
    {
      name: 'Echo Tee',
      slug: 'echo-tee-charcoal',
      tagline: 'Extra-heavyweight boxy cut.',
      shortDesc: '320 GSM double-collared in Dark Charcoal.',
      description:
        '320 GSM heavyweight cotton. Oversized boxy cut. Double-layered collar. Heavy enzyme wash.',
      symbolism: 'Echo. Everything you send out returns. Eventually.',
      status: 'ACTIVE' as const,
      isFeatured: false,
      categoryId: tees.id,
      dropId: drop002.id,
      variants: [
        { sku: 'SS-ECHO-DCH-S', size: 'S', price: 3199, comparePrice: 3599, stock: 10 },
        { sku: 'SS-ECHO-DCH-M', size: 'M', price: 3199, comparePrice: 3599, stock: 15 },
        { sku: 'SS-ECHO-DCH-L', size: 'L', price: 3199, comparePrice: 3599, stock: 0 },
        { sku: 'SS-ECHO-DCH-XL', size: 'XL', price: 3199, comparePrice: 3599, stock: 8 },
        { sku: 'SS-ECHO-DCH-XXL', size: 'XXL', price: 3199, comparePrice: 3599, stock: 0 },
      ],
      images: [
        { url: '/images/products/tee-charcoal.png', isCover: true, position: 0 },
      ],
      tags: ['drop-002', 'extra-heavyweight', 'charcoal'],
    },
  ];

  for (const p of productData) {
    const { variants, images, tags, ...productFields } = p;
    const channel = (productFields as { channel?: 'DROP' | 'EXCLUSIVE_UNLOCK' | 'EXCLUSIVE_RACK' }).channel ?? 'DROP';
    const domain = domainFromChannel(channel);

    const product = await prisma.product.upsert({
      where: { slug: productFields.slug },
      update: { domain },
      create: {
        ...productFields,
        domain,
        publishedAt: productFields.status === 'ACTIVE' ? new Date() : null,
      },
    });

    for (const img of images) {
      await prisma.productImage.upsert({
        where: { id: `${product.id}-img-${img.position}` },
        update: {},
        create: { ...img, productId: product.id, id: `${product.id}-img-${img.position}` },
      }).catch(() => {
        // May already exist with auto-id — skip
      });
    }

    for (const tag of tags) {
      await prisma.productTag.upsert({
        where: { productId_tag: { productId: product.id, tag } },
        update: {},
        create: { productId: product.id, tag },
      });
    }

    for (const v of variants) {
      const variant = await prisma.productVariant.upsert({
        where: { sku: v.sku },
        update: {},
        create: {
          productId: product.id,
          sku: v.sku,
          size: v.size,
          price: v.price,
          comparePrice: 'comparePrice' in v ? (v as any).comparePrice : null,
        },
      });

      await prisma.inventory.upsert({
        where: { variantId: variant.id },
        update: {},
        create: {
          variantId: variant.id,
          type: 'LIMITED',
          totalStock: v.stock,
          soldStock: 0,
          reservedStock: 0,
          lowStockAt: 5,
        },
      });
    }
  }

  console.log('✅ Products + variants + inventory seeded');

  // ── ARCHIVE POSTS ─────────────────────────────────────────────────────────────
  const archivePosts = [
    {
      slug: 'weight-of-a-tshirt',
      title: 'The Weight of a T-Shirt',
      type: 'ARTIFACT' as const,
      status: 'PUBLISHED' as const,
      excerpt: '300 grams per square meter. Enough to feel something when you put it on.',
      tags: ['fabric', 'process', 'identity'],
      coverImage: '/images/textures/fabric-texture.png',
      publishedAt: new Date('2026-05-07'),
    },
    {
      slug: 'scroll-fatigue',
      title: 'Scroll Fatigue',
      type: 'OBSERVATION' as const,
      status: 'PUBLISHED' as const,
      excerpt: "Everyone has an opinion. Most of them are screenshots of someone else's.",
      tags: ['internet', 'culture', 'observation'],
      coverImage: '/images/campaign/editorial-01.png',
      publishedAt: new Date('2026-05-05'),
    },
    {
      slug: 'colour-theory-void-black',
      title: 'Colour Theory: Void Black',
      type: 'MOODBOARD' as const,
      status: 'PUBLISHED' as const,
      excerpt: "Black absorbs everything. That's the point.",
      tags: ['colour', 'design', 'void'],
      coverImage: '/images/products/tee-black.png',
      publishedAt: new Date('2026-05-03'),
    },
    {
      slug: 'drop-001-development',
      title: 'Drop 001 Development',
      type: 'ARTIFACT' as const,
      status: 'PUBLISHED' as const,
      excerpt: 'From 240 GSM rejects to 300 GSM conviction. Process notes from the first production run.',
      tags: ['process', 'production', 'drop-001'],
      coverImage: '/images/campaign/editorial-02.png',
      publishedAt: new Date('2026-04-28'),
    },
  ];

  for (const post of archivePosts) {
    await prisma.archivePost.upsert({
      where: { slug: post.slug },
      update: {},
      create: post,
    });
  }

  console.log('✅ Archive posts seeded');

  const heroCount = await prisma.heroSlide.count();
  if (heroCount === 0) {
    await prisma.heroSlide.create({
      data: {
        image: '/images/hero/hero-main.png',
        mobileImage: null,
        eyebrow: 'SS26 / DROP 001',
        headline: 'Worn With Intent.',
        narrative:
          'Heavy in symbolism.\nLimited in quantity.\nBuilt for custodians, not consumers.',
        ctaLabel: 'ENTER THE DROP',
        ctaHref: '/drops',
        alignment: 'left',
        overlayOpacity: 0.45,
        sortOrder: 0,
        isActive: true,
      },
    });
    await prisma.heroSlide.create({
      data: {
        image: '/images/campaign/editorial-01.png',
        mobileImage: null,
        eyebrow: 'Archive / Signal',
        headline: 'Custody over consumption.',
        narrative: 'Artifacts with intent. Each release is finite — built for those who carry the meaning forward.',
        ctaLabel: 'READ THE ARCHIVE',
        ctaHref: '/archive',
        alignment: 'left',
        overlayOpacity: 0.5,
        sortOrder: 1,
        isActive: true,
      },
    });
    console.log('✅ Homepage hero slides seeded');
  }

  console.log('\n🎉 Database seed complete. GODSMOVE is ready.');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
