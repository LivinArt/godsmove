'use server';

import type { ProductChannel } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { serializePrisma } from '@/lib/serialize-prisma';

import { hasAdminBypass } from '@/lib/admin-auth';

/**
 * Storefront Actions: Public read-only queries for the storefront.
 * These queries enforce status: 'ACTIVE' to ensure drafts/hidden products are never leaked.
 *
 * All results are passed through serializePrisma() before being returned —
 * Prisma.Decimal and Date objects are converted to plain JS primitives so they
 * can be safely serialized across the Next.js Server → Client Component boundary.
 */

export async function getStorefrontProducts(params?: {
  categoryId?: string;
  dropId?: string;
  /** @deprecated Use `featured` — kept for backward compatibility */
  isFeatured?: boolean;
  /** Featured DROP products for Explore Our Ranges (ignored for exclusive channels) */
  featured?: boolean;
  channel?: ProductChannel;
  ids?: string[];
  take?: number;
  skip?: number;
  isExclusiveRack?: boolean;
  showOnHomepage?: boolean;
  showOnExclusivePage?: boolean;
}) {
  const channel = params?.channel;
  const applyFeaturedFilter = params?.featured !== undefined || params?.isFeatured !== undefined;
  const featuredFilter = params?.featured ?? params?.isFeatured ?? false;

  const data = await prisma.product.findMany({
    where: {
      status: 'ACTIVE',
      ...(params?.categoryId && { categoryId: params.categoryId }),
      ...(params?.dropId && { dropId: params.dropId }),
      ...(channel && { channel }),
      ...(applyFeaturedFilter && { isFeatured: featuredFilter }),
      ...(params?.ids && params.ids.filter(Boolean).length > 0 && { id: { in: params.ids.filter((id): id is string => typeof id === 'string' && id.trim().length > 0) } }),
      ...(params?.isExclusiveRack !== undefined && { isExclusiveRack: params.isExclusiveRack }),
      ...(params?.showOnHomepage !== undefined && { showOnHomepage: params.showOnHomepage }),
      ...(params?.showOnExclusivePage !== undefined && { showOnExclusivePage: params.showOnExclusivePage }),
    },
    include: {
      category: true,
      drop: { select: { id: true, name: true, slug: true, status: true } },
      images: { orderBy: { position: 'asc' } },
      variants: {
        where: { isActive: true },
        include: { inventory: true },
        orderBy: { position: 'asc' },
      },
    },
    orderBy: [
      { featuredPriority: 'desc' },
      { createdAt: 'desc' }
    ],
    take: params?.take ?? 50,
    skip: params?.skip ?? 0,
  });

  return serializePrisma(data);
}

export async function getStorefrontProductBySlug(slug: string) {
  const isAdmin = await hasAdminBypass();
  const data = await prisma.product.findFirst({
    where: {
      slug,
      ...(!isAdmin && { status: 'ACTIVE' }),
    },
    include: {
      category: true,
      drop: true,
      images: { orderBy: { position: 'asc' } },
      variants: {
        where: { isActive: true },
        include: { inventory: true },
        orderBy: { position: 'asc' },
      },
      tags: true,
    },
  });

  return data ? serializePrisma(data) : null;
}

export async function getStorefrontDrops() {
  const data = await prisma.drop.findMany({
    where: {
      status: {
        in: ['LIVE', 'ENDED'],
      },
    },
    include: {
      products: {
        where: { status: 'ACTIVE' },
        select: { id: true, name: true, slug: true, images: { take: 1, orderBy: { position: 'asc' } } },
      },
    },
    orderBy: { launchAt: 'desc' },
  });

  return serializePrisma(data);
}

export async function getActiveDrop() {
  const data = await prisma.drop.findFirst({
    where: { status: 'LIVE' },
    orderBy: { launchAt: 'desc' },
  });

  return data ? serializePrisma(data) : null;
}

export async function getStorefrontCategories() {
  const data = await prisma.category.findMany({
    orderBy: { position: 'asc' },
  });

  return serializePrisma(data);
}

/** Public homepage hero frames — active only, editorial order */
export async function getHomeHeroSlides() {
  const slides = await prisma.heroSlide.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  });
  return serializePrisma(slides);
}
