'use server';

import { revalidatePath } from 'next/cache';
import { hasAdminBypass } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import {
  CreateReturnSchema,
  ProcessReturnSchema,
  type CreateReturnInput,
  type ProcessReturnInput,
} from '@/lib/validations/return';
import { issueWalletCredit } from './wallet.actions';

async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) throw new Error('UNAUTHORIZED');

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { role: true },
  });

  if (!profile || !['ADMIN', 'OPERATIONS', 'SUPPORT'].includes(profile.role)) {
    throw new Error('FORBIDDEN');
  }

  return user;
}

// ── CUSTOMER: SUBMIT RETURN REQUEST ──────────────────────────────────────────

export async function createReturnRequest(input: CreateReturnInput) {
  const data = CreateReturnSchema.parse(input);
  const user = await getCurrentUser();
  if (!user) throw new Error('UNAUTHORIZED');

  // Validate order belongs to this user
  const order = await prisma.order.findUnique({
    where: { id: data.orderId },
    include: { items: true },
  });

  if (!order) throw new Error('Order not found');
  if (order.profileId !== user.id) throw new Error('FORBIDDEN');
  if (order.status !== 'DELIVERED') {
    throw new Error('Returns can only be requested for delivered orders');
  }

  // Check no pending return already exists
  const existingReturn = await prisma.returnRequest.findFirst({
    where: {
      orderId: data.orderId,
      status: { in: ['PENDING', 'APPROVED', 'RECEIVED'] },
    },
  });
  if (existingReturn) {
    throw new Error('A return request for this order is already in progress');
  }

  const returnReq = await prisma.returnRequest.create({
    data: {
      orderId: data.orderId,
      profileId: user.id,
      type: data.type,
      reason: data.reason,
      evidenceUrls: data.evidenceUrls,
      items: {
        create: data.items.map((item) => ({
          orderItemId: item.orderItemId,
          quantity: item.quantity,
          reason: item.reason,
        })),
      },
    },
    include: { items: true },
  });

  // Update order status
  await prisma.order.update({
    where: { id: data.orderId },
    data: {
      status:
        data.type === 'EXCHANGE' ? 'EXCHANGE_REQUESTED' : 'RETURN_REQUESTED',
    },
  });

  revalidatePath('/account/orders');
  return returnReq;
}

// ── ADMIN: GET RETURN REQUESTS ────────────────────────────────────────────────

export async function getReturnRequests(params?: {
  status?: string;
  take?: number;
  skip?: number;
}) {
  await requireAdmin();

  return prisma.returnRequest.findMany({
    where: {
      ...(params?.status && { status: params.status as any }),
    },
    include: {
      order: { select: { orderNumber: true, total: true } },
      profile: { select: { firstName: true, lastName: true, email: true } },
      items: {
        include: {
          orderItem: {
            select: { productName: true, size: true, quantity: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: params?.take ?? 50,
    skip: params?.skip ?? 0,
  });
}

// ── ADMIN: PROCESS RETURN ─────────────────────────────────────────────────────

export async function processReturn(input: ProcessReturnInput) {
  await requireAdmin();
  const data = ProcessReturnSchema.parse(input);

  return prisma.$transaction(async (tx) => {
    const returnReq = await tx.returnRequest.findUnique({
      where: { id: data.returnId },
      include: { items: true, order: true },
    });

    if (!returnReq) throw new Error('Return request not found');

    const updated = await tx.returnRequest.update({
      where: { id: data.returnId },
      data: {
        status: data.status as any,
        resolution: data.resolution as any ?? undefined,
        adminNotes: data.adminNotes,
        creditAmount: data.creditAmount ?? undefined,
        resolvedAt:
          data.status === 'COMPLETED' || data.status === 'REJECTED'
            ? new Date()
            : undefined,
      },
    });

    // Issue store credit on completion
    if (
      data.status === 'COMPLETED' &&
      data.resolution === 'STORE_CREDIT' &&
      data.creditAmount &&
      returnReq.order.profileId
    ) {
      await issueWalletCredit({
        profileId: returnReq.order.profileId,
        amount: data.creditAmount,
        type: 'CREDIT_RETURN',
        description: `Store credit for return on order ${returnReq.order.orderNumber}`,
        returnId: data.returnId,
        orderId: returnReq.orderId,
      });
    }

    // If approved, restore inventory for returned items
    if (data.status === 'RECEIVED') {
      for (const item of returnReq.items) {
        const orderItem = await tx.orderItem.findUnique({
          where: { id: item.orderItemId },
        });
        if (orderItem) {
          const inventory = await tx.inventory.findUnique({
            where: { variantId: orderItem.variantId },
          });
          if (inventory) {
            await tx.inventory.update({
              where: { variantId: orderItem.variantId },
              data: {
                soldStock: { decrement: item.quantity },
                totalStock: { increment: item.quantity },
              },
            });
            await tx.inventoryMovement.create({
              data: {
                inventoryId: inventory.id,
                delta: item.quantity,
                type: 'RETURN',
                reason: `Return ${returnReq.id} received`,
                orderId: returnReq.orderId,
              },
            });
          }
        }
      }
    }

    revalidatePath('/admin/returns');
    return updated;
  });
}
