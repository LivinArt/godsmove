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
import { NotificationService } from '@/lib/notification';

async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user && process.env.NODE_ENV === 'development') {
    const firstCustomer = await prisma.profile.findFirst({
      where: { role: 'CUSTOMER' },
      select: { id: true, email: true },
    });
    if (firstCustomer) {
      return { id: firstCustomer.id, email: firstCustomer.email } as any;
    }
    return { id: 'dev-bypass', email: 'dev@godsmove.com' } as any;
  }
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

  // Validate item-level return limits:
  const requestedItemIds = data.items.map((i) => i.orderItemId);
  const existingReturnItems = await prisma.returnItem.findFirst({
    where: {
      orderItemId: { in: requestedItemIds },
      returnReq: {
        status: { notIn: ['REJECTED'] },
      },
    },
  });
  if (existingReturnItems) {
    throw new Error('One or more selected items already have an active return request.');
  }

  const returnReq = await prisma.$transaction(async (tx) => {
    const req = await tx.returnRequest.create({
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

    // Create a ReturnEvent for PENDING status
    await tx.returnEvent.create({
      data: {
        returnReqId: req.id,
        status: 'PENDING',
        description: 'Return request submitted by customer.',
      },
    });

    // Update returnStatus for order_items
    for (const itemId of requestedItemIds) {
      await tx.orderItem.update({
        where: { id: itemId },
        data: {
          returnStatus: 'PENDING',
        },
      });
    }

    // Item-level architecture: Only update Order.status if ALL items in the order
    // are being returned in this request. Partial returns must NOT change Order.status
    // so the remaining unreturned items stay eligible for future returns.
    const allOrderItems = await tx.orderItem.findMany({
      where: { orderId: data.orderId },
      select: { id: true },
    });
    const allItemsBeingReturned = allOrderItems.every((oi) =>
      requestedItemIds.includes(oi.id)
    );
    if (allItemsBeingReturned) {
      await tx.order.update({
        where: { id: data.orderId },
        data: {
          status: data.type === 'EXCHANGE' ? 'EXCHANGE_REQUESTED' : 'RETURN_REQUESTED',
        },
      });
    }
    // Partial return: Order.status stays COMPLETED — return state lives on OrderItem only.

    return req;
  });

  // Dispatch luxury email notification
  try {
    await NotificationService.sendReturnRequested(
      order.email,
      returnReq.id,
      order.orderNumber
    );
  } catch (err) {
    console.error('Failed to send return request email notification:', err);
  }

  revalidatePath('/account/orders');
  revalidatePath('/profile');
  return JSON.parse(JSON.stringify(returnReq));
}

// ── ADMIN: GET RETURN REQUESTS ────────────────────────────────────────────────

export async function getReturnRequests(params?: {
  status?: string;
  take?: number;
  skip?: number;
}) {
  await requireAdmin();

  const requests = await prisma.returnRequest.findMany({
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

  return JSON.parse(JSON.stringify(requests));
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

    // Update order items return status to keep the denormalized mirror field in sync
    for (const item of returnReq.items) {
      await tx.orderItem.update({
        where: { id: item.orderItemId },
        data: {
          returnStatus: data.status as any,
        },
      });
    }

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
    return JSON.parse(JSON.stringify(updated));
  });
}

// ── CUSTOMER: GET OWN RETURNS ────────────────────────────────────────────────

export async function getMyReturns() {
  const user = await getCurrentUser();
  if (!user) throw new Error('UNAUTHORIZED');

  const returns = await prisma.returnRequest.findMany({
    where: { profileId: user.id },
    include: {
      items: {
        include: {
          orderItem: {
            select: { productName: true, size: true, color: true, imageUrl: true, price: true },
          },
        },
      },
      order: {
        select: { orderNumber: true },
      },
      events: {
        orderBy: { timestamp: 'asc' },
      },
      reverseShipment: true,
      walletRefund: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return JSON.parse(JSON.stringify(returns));
}

export async function customerUpdateReturnRequest(payload: {
  returnId: string;
  reasonUpdate: string;
  evidenceUrls: string[];
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error('UNAUTHORIZED');

  const returnReq = await prisma.returnRequest.findUnique({
    where: { id: payload.returnId },
    include: { items: true },
  });

  if (!returnReq) throw new Error('Return request not found');
  if (returnReq.profileId !== user.id) throw new Error('FORBIDDEN');
  if (returnReq.status !== 'REQUESTED') {
    throw new Error('You can only update return requests that are in the "Information Requested" status.');
  }

  const updated = await prisma.$transaction(async (tx) => {
    const req = await tx.returnRequest.update({
      where: { id: payload.returnId },
      data: {
        reason: payload.reasonUpdate,
        evidenceUrls: payload.evidenceUrls,
        status: 'PENDING',
      },
    });

    await tx.returnEvent.create({
      data: {
        returnReqId: payload.returnId,
        status: 'PENDING',
        description: 'Customer updated return request details with requested information.',
      },
    });

    // Update returnStatus for order_items in this return request
    for (const item of returnReq.items) {
      await tx.orderItem.update({
        where: { id: item.orderItemId },
        data: {
          returnStatus: 'PENDING',
        },
      });
    }

    return req;
  });

  revalidatePath('/profile');
  return JSON.parse(JSON.stringify(updated));
}
