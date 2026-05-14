'use server';

import { prisma } from '@/lib/prisma';
import { serializePrisma } from '@/lib/serialize-prisma';

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
  isFeatured?: boolean;
  isExclusiveRack?: boolean;
  ids?: string[];
  take?: number;
  skip?: number;
}) {
  const data = await prisma.product.findMany({
    where: {
      status: 'ACTIVE',
      ...(params?.categoryId && { categoryId: params.categoryId }),
      ...(params?.dropId && { dropId: params.dropId }),
      ...(params?.isFeatured !== undefined && { isFeatured: params.isFeatured }),
      ...(params?.isExclusiveRack !== undefined && { isExclusiveRack: params.isExclusiveRack }),
      ...(params?.ids && params.ids.length > 0 && { id: { in: params.ids } }),
    },
    include: {
      category: true,
      drop: { select: { id: true, name: true, slug: true, status: true, season: true } },
      images: { orderBy: { position: 'asc' } },
      variants: {
        where: { isActive: true },
        include: { inventory: true },
        orderBy: { position: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: params?.take ?? 50,
    skip: params?.skip ?? 0,
  });

  return serializePrisma(data);
}

export async function getStorefrontProductBySlug(slug: string) {
  const data = await prisma.product.findFirst({
    where: {
      slug,
      status: 'ACTIVE',
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
    orderBy: { releaseAt: 'desc' },
  });

  return serializePrisma(data);
}

export async function getActiveDrop() {
  const data = await prisma.drop.findFirst({
    where: { status: 'LIVE' },
    orderBy: { releaseAt: 'desc' },
  });

  return data ? serializePrisma(data) : null;
}

export async function getStorefrontCategories() {
  const data = await prisma.category.findMany({
    orderBy: { position: 'asc' },
  });

  return serializePrisma(data);
}
