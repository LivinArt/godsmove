'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import {
  CreateDropSchema,
  UpdateDropSchema,
  type CreateDropInput,
  type UpdateDropInput,
} from '@/lib/validations/drop';
import { computeEffectiveStatus } from '@/lib/drop-status';

// ── HELPERS ──────────────────────────────────────────────────────────────────

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('UNAUTHORIZED');

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { role: true },
  });

  const adminRoles = ['ADMIN', 'CONTENT_EDITOR', 'MARKETING', 'OPERATIONS'];
  if (!profile || !adminRoles.includes(profile.role)) {
    throw new Error('FORBIDDEN');
  }

  return user;
}


/**
 * Sync product associations: disconnect all products not in productIds,
 * connect all products in productIds to this drop.
 */
async function syncProducts(
  tx: Omit<typeof prisma, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>,
  dropId: string,
  productIds: string[]
) {
  // Disconnect all currently assigned products for this drop
  await tx.product.updateMany({
    where: { dropId },
    data: { dropId: null },
  });

  // Connect new selection
  if (productIds.length > 0) {
    await tx.product.updateMany({
      where: { id: { in: productIds } },
      data: { dropId },
    });
  }
}

function revalidateDropPaths() {
  revalidatePath('/admin/drops');
  revalidatePath('/drops');
  revalidatePath('/');
}

// ── READ ─────────────────────────────────────────────────────────────────────

export async function getDrops(params?: {
  search?: string;
  status?: string;
  isFeatured?: boolean;
  take?: number;
  skip?: number;
}) {
  return prisma.drop.findMany({
    where: {
      ...(params?.search && {
        OR: [
          { name: { contains: params.search, mode: 'insensitive' } },
          { slug: { contains: params.search, mode: 'insensitive' } },
          { tagline: { contains: params.search, mode: 'insensitive' } },
        ],
      }),
      ...(params?.status && { status: params.status as any }),
      ...(params?.isFeatured !== undefined && { isFeatured: params.isFeatured }),
    },
    include: {
      products: {
        select: { id: true, name: true, status: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: params?.take ?? 100,
    skip: params?.skip ?? 0,
  });
}

export async function getDropById(id: string) {
  return prisma.drop.findUnique({
    where: { id },
    include: {
      products: {
        select: { id: true, name: true, slug: true, status: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  });
}

export async function getFeaturedDrop() {
  return prisma.drop.findFirst({
    where: { isFeatured: true },
    include: {
      products: {
        select: { id: true, name: true, slug: true },
        take: 6,
      },
    },
    orderBy: { updatedAt: 'desc' },
  });
}

export async function getLiveDrops() {
  return prisma.drop.findMany({
    where: { status: 'LIVE' },
    include: {
      products: {
        select: { id: true, name: true, slug: true, status: true },
      },
    },
    orderBy: { launchAt: 'asc' },
  });
}

// ── CREATE ────────────────────────────────────────────────────────────────────

export async function createDrop(input: CreateDropInput) {
  await requireAdmin();
  const { productIds, heroImageUrl, launchAt, endAt, ...rest } = CreateDropSchema.parse(input);

  // Derive status if not explicitly overridden
  const derivedStatus = computeEffectiveStatus(
    rest.status,
    launchAt ? new Date(launchAt) : null,
    endAt ? new Date(endAt) : null
  );

  const drop = await prisma.$transaction(async (tx) => {
    const d = await tx.drop.create({
      data: {
        ...rest,
        heroImageUrl: heroImageUrl || null,
        launchAt: launchAt ? new Date(launchAt) : null,
        endAt: endAt ? new Date(endAt) : null,
        // Allow explicit ARCHIVED override; otherwise auto-derive
        status: rest.status === 'ARCHIVED' ? 'ARCHIVED' : derivedStatus,
      },
    });

    if (productIds.length > 0) {
      await tx.product.updateMany({
        where: { id: { in: productIds } },
        data: { dropId: d.id },
      });
    }

    return d;
  });

  revalidateDropPaths();
  return drop;
}

// ── UPDATE ────────────────────────────────────────────────────────────────────

export async function updateDrop(input: UpdateDropInput) {
  await requireAdmin();
  const { id, productIds, heroImageUrl, launchAt, endAt, ...rest } = UpdateDropSchema.parse(input);

  const existing = await prisma.drop.findUnique({ where: { id } });
  if (!existing) throw new Error('Drop not found');

  const resolvedLaunchAt = launchAt !== undefined ? (launchAt ? new Date(launchAt) : null) : existing.launchAt;
  const resolvedEndAt = endAt !== undefined ? (endAt ? new Date(endAt) : null) : existing.endAt;
  const resolvedStatus = rest.status ?? existing.status;

  const derivedStatus = computeEffectiveStatus(
    resolvedStatus,
    resolvedLaunchAt,
    resolvedEndAt
  );

  const drop = await prisma.$transaction(async (tx) => {
    const d = await tx.drop.update({
      where: { id },
      data: {
        ...rest,
        ...(heroImageUrl !== undefined && { heroImageUrl: heroImageUrl || null }),
        launchAt: resolvedLaunchAt,
        endAt: resolvedEndAt,
        status: resolvedStatus === 'ARCHIVED' ? 'ARCHIVED' : derivedStatus,
      },
    });

    if (productIds !== undefined) {
      await syncProducts(tx, id, productIds);
    }

    return d;
  });

  revalidateDropPaths();
  revalidatePath(`/drops/${drop.slug}`);
  return drop;
}

// ── DELETE ────────────────────────────────────────────────────────────────────

export async function deleteDrop(id: string, force = false) {
  await requireAdmin();

  const drop = await prisma.drop.findUnique({
    where: { id },
    include: { products: { select: { id: true, name: true } } },
  });

  if (!drop) throw new Error('Drop not found');

  if (drop.products.length > 0 && !force) {
    throw new Error(
      `This drop has ${drop.products.length} associated product${drop.products.length === 1 ? '' : 's'}. Pass force=true to disconnect and delete.`
    );
  }

  await prisma.$transaction(async (tx) => {
    // Disconnect products first
    if (drop.products.length > 0) {
      await tx.product.updateMany({
        where: { dropId: id },
        data: { dropId: null },
      });
    }

    await tx.drop.delete({ where: { id } });
  });

  revalidateDropPaths();
}
