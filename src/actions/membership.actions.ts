'use server';

import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

async function getCurrentUser() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) throw new Error('UNAUTHORIZED');

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { role: true },
  });

  const adminRoles = ['ADMIN', 'OPERATIONS', 'SUPPORT', 'MARKETING'];
  if (!profile || !adminRoles.includes(profile.role)) {
    throw new Error('FORBIDDEN');
  }

  return user;
}

export interface GetAdminMembersParams {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export async function getAdminMembers(params: GetAdminMembersParams = {}) {
  await requireAdmin();

  const { status, search, page = 1, limit = 20 } = params;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (status && status !== 'ALL') {
    where.status = status;
  }

  if (search && search.trim() !== '') {
    const term = search.trim();
    where.OR = [
      { profile: { email: { contains: term, mode: 'insensitive' } } },
      { profile: { firstName: { contains: term, mode: 'insensitive' } } },
      { profile: { lastName: { contains: term, mode: 'insensitive' } } },
      { sourceOrderId: { contains: term, mode: 'insensitive' } },
      { sourceOrder: { orderNumber: { contains: term, mode: 'insensitive' } } },
    ];
  }

  const [memberships, totalCount] = await Promise.all([
    prisma.membership.findMany({
      where,
      include: {
        profile: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            tier: true,
          },
        },
        sourceOrder: {
          select: {
            id: true,
            orderNumber: true,
            total: true,
            createdAt: true,
          },
        },
      },
      orderBy: { activatedAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.membership.count({ where }),
  ]);

  return {
    memberships,
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
    currentPage: page,
  };
}

export async function getMyMembership() {
  const user = await getCurrentUser();
  if (!user) return null;

  const membership = await prisma.membership.findUnique({
    where: { profileId: user.id },
    include: {
      sourceOrder: {
        select: {
          id: true,
          orderNumber: true,
          total: true,
          createdAt: true,
          preBookingExpectedDispatch: true,
        },
      },
    },
  });

  return membership;
}

export async function endAdminMembership(membershipId: string) {
  await requireAdmin();

  const membership = await prisma.membership.findUnique({
    where: { id: membershipId },
  });

  if (!membership) {
    throw new Error('Membership record not found.');
  }

  const updated = await prisma.membership.update({
    where: { id: membershipId },
    data: {
      status: 'CANCELLED',
    },
  });

  return { success: true, membership: updated };
}

export async function renewAdminMembership(membershipId: string, monthsCount: number = 12) {
  await requireAdmin();

  const membership = await prisma.membership.findUnique({
    where: { id: membershipId },
  });

  if (!membership) {
    throw new Error('Membership record not found.');
  }

  const now = new Date();
  let baseDate = now;

  // Extend from current expiresAt if currently active and in the future
  if (membership.expiresAt && membership.expiresAt > now && membership.status === 'ACTIVE') {
    baseDate = new Date(membership.expiresAt);
  }

  const newExpiresAt = new Date(baseDate);
  newExpiresAt.setMonth(newExpiresAt.getMonth() + monthsCount);

  const updated = await prisma.membership.update({
    where: { id: membershipId },
    data: {
      status: 'ACTIVE',
      expiresAt: newExpiresAt,
      // Retain original activatedAt date!
    },
  });

  return { success: true, membership: updated };
}
