'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import {
  CreateDiscountSchema,
  UpdateDiscountSchema,
  type CreateDiscountInput,
  type UpdateDiscountInput,
} from '@/lib/validations/discount';
import { computeEffectiveDiscountStatus } from '@/lib/discount-status';

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

async function syncDiscountProducts(
  tx: Omit<typeof prisma, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>,
  discountId: string,
  productIds: string[],
  appliesToAll: boolean
) {
  // Always disconnect all products first
  await tx.discount.update({
    where: { id: discountId },
    data: {
      products: {
        set: [], // Disconnect all
      },
    },
  });

  // Re-connect if not appliesToAll
  if (!appliesToAll && productIds.length > 0) {
    await tx.discount.update({
      where: { id: discountId },
      data: {
        products: {
          connect: productIds.map((id) => ({ id })),
        },
      },
    });
  }
}

function revalidateDiscountPaths() {
  revalidatePath('/admin/discounts');
  revalidatePath('/checkout');
}

// ── READ ─────────────────────────────────────────────────────────────────────

export async function getDiscounts(params?: {
  search?: string;
  status?: string;
  isActive?: boolean;
  take?: number;
  skip?: number;
}) {
  return prisma.discount.findMany({
    where: {
      ...(params?.search && {
        OR: [
          { name: { contains: params.search, mode: 'insensitive' } },
          { code: { contains: params.search, mode: 'insensitive' } },
        ],
      }),
      ...(params?.status && { status: params.status as any }),
      ...(params?.isActive !== undefined && { isActive: params.isActive }),
    },
    include: {
      _count: {
        select: { products: true }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: params?.take ?? 100,
    skip: params?.skip ?? 0,
  });
}

export async function getDiscountById(id: string) {
  return prisma.discount.findUnique({
    where: { id },
    include: {
      products: {
        select: { id: true, name: true, slug: true, status: true },
      },
    },
  });
}

export async function getDiscountByCode(code: string) {
  return prisma.discount.findUnique({
    where: { code: code.toUpperCase() },
    include: {
      products: {
        select: { id: true },
      },
    },
  });
}

// ── CREATE ────────────────────────────────────────────────────────────────────

export async function createDiscount(input: CreateDiscountInput) {
  await requireAdmin();
  const { productIds, startsAt, endsAt, code, ...rest } = CreateDiscountSchema.parse(input);

  const upperCode = code.toUpperCase();

  // Check if code exists
  const existing = await prisma.discount.findUnique({ where: { code: upperCode } });
  if (existing) throw new Error('Discount code already exists');

  const derivedStatus = computeEffectiveDiscountStatus(
    rest.status,
    rest.isActive,
    startsAt ? new Date(startsAt) : null,
    endsAt ? new Date(endsAt) : null
  );

  const discount = await prisma.$transaction(async (tx) => {
    const d = await tx.discount.create({
      data: {
        ...rest,
        code: upperCode,
        startsAt: startsAt ? new Date(startsAt) : null,
        endsAt: endsAt ? new Date(endsAt) : null,
        status: rest.status === 'ARCHIVED' ? 'ARCHIVED' : derivedStatus,
        products: rest.appliesToAll ? undefined : {
          connect: productIds.map((id) => ({ id }))
        }
      },
    });

    return d;
  });

  revalidateDiscountPaths();
  return discount;
}

// ── UPDATE ────────────────────────────────────────────────────────────────────

export async function updateDiscount(input: UpdateDiscountInput) {
  await requireAdmin();
  const { id, productIds, startsAt, endsAt, code, ...rest } = UpdateDiscountSchema.parse(input);

  const existing = await prisma.discount.findUnique({ where: { id } });
  if (!existing) throw new Error('Discount not found');

  const upperCode = code ? code.toUpperCase() : existing.code;

  if (code && upperCode !== existing.code) {
    const codeExists = await prisma.discount.findUnique({ where: { code: upperCode } });
    if (codeExists) throw new Error('Discount code already exists');
  }

  const resolvedStartsAt = startsAt !== undefined ? (startsAt ? new Date(startsAt) : null) : existing.startsAt;
  const resolvedEndsAt = endsAt !== undefined ? (endsAt ? new Date(endsAt) : null) : existing.endsAt;
  const resolvedStatus = rest.status ?? existing.status;
  const resolvedIsActive = rest.isActive ?? existing.isActive;

  const derivedStatus = computeEffectiveDiscountStatus(
    resolvedStatus,
    resolvedIsActive,
    resolvedStartsAt,
    resolvedEndsAt
  );

  const discount = await prisma.$transaction(async (tx) => {
    const d = await tx.discount.update({
      where: { id },
      data: {
        ...rest,
        code: upperCode,
        startsAt: resolvedStartsAt,
        endsAt: resolvedEndsAt,
        status: resolvedStatus === 'ARCHIVED' ? 'ARCHIVED' : derivedStatus,
      },
    });

    const finalAppliesToAll = rest.appliesToAll ?? existing.appliesToAll;

    if (productIds !== undefined || rest.appliesToAll !== undefined) {
      const idsToSync = productIds !== undefined ? productIds : [];
      await syncDiscountProducts(tx, id, idsToSync, finalAppliesToAll);
    }

    return d;
  });

  revalidateDiscountPaths();
  return discount;
}

// ── DELETE ────────────────────────────────────────────────────────────────────

export async function deleteDiscount(id: string) {
  await requireAdmin();

  const discount = await prisma.discount.findUnique({
    where: { id },
  });

  if (!discount) throw new Error('Discount not found');

  if (discount.usageCount > 0) {
     throw new Error(`Cannot delete a discount that has already been used (${discount.usageCount} times). Please archive it instead.`);
  }

  await prisma.discount.delete({ where: { id } });

  revalidateDiscountPaths();
}
