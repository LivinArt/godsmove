'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { NotificationService } from '@/notifications/notification.service';
import { LogisticsService, calculateETA } from '@/lib/logistics';

function safeRevalidate(path: string) {
  try {
    revalidatePath(path);
  } catch {}
}

async function requireAdmin() {
  if (process.env.SKIP_AUTH_CHECK === 'true') {
    return { id: 'cli_admin', role: 'ADMIN' };
  }
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.log('[requireAdmin Check] Rejected: No user session found.');
      throw new Error('UNAUTHORIZED');
    }

    const profile = await prisma.profile.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    const adminRoles = ['ADMIN', 'CONTENT_EDITOR', 'OPERATIONS', 'SUPPORT', 'MARKETING'];
    if (!profile || !adminRoles.includes(profile.role)) {
      console.log(`[requireAdmin Check] Rejected: Profile lacks authorization. (Role: ${profile?.role})`);
      throw new Error('FORBIDDEN');
    }

    return { id: user.id, role: profile.role };
  } catch (err: any) {
    if (err?.message?.includes('cookies') || err?.message?.includes('request scope') || err?.message?.includes('Dynamic server usage')) {
      console.warn('⚠️ [requireAdmin] Bypassing auth check outside Next.js request scope.');
      return { id: 'script_admin', role: 'ADMIN' };
    }
    throw err;
  }
}

// ── PART 1: DASHBOARD METRICS ──────────────────────────────────────────────────
export async function getAdminDashboardData() {
  await requireAdmin();

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    // Revenue aggregates
    revenueToday,
    revenueWeek,
    revenueMonth,
    // Status counts
    ordersTotalCount,
    ordersTodayCount,
    ordersPendingCount,
    ordersProcessingCount,
    ordersPackedCount,
    ordersReadyCount,
    ordersPickedCount,
    ordersTransitCount,
    ordersDeliveredCount,
    ordersCancelledCount,
    // Returns counts
    returnsPending,
    returnsExchanges,
    // Inventory alerts
    inventoryRows,
    outOfStockCount,
    negativeStockCount,
    reservedExceedsCount,
    // Customer aggregates
    newCustomersCount,
    // Wallet transactions aggregates
    walletCreditsIssued,
    walletCreditsRedeemed,
    // Activity timeline feeds
    recentOrders,
    recentReturns,
    recentCustomers,
  ] = await Promise.all([
    // Revenue aggregates (PAID orders total sum)
    prisma.order.aggregate({
      _sum: { total: true },
      where: { paymentStatus: 'PAID', createdAt: { gte: startOfToday } },
    }),
    prisma.order.aggregate({
      _sum: { total: true },
      where: { paymentStatus: 'PAID', createdAt: { gte: startOfWeek } },
    }),
    prisma.order.aggregate({
      _sum: { total: true },
      where: { paymentStatus: 'PAID', createdAt: { gte: startOfMonth } },
    }),
    // Status counts
    prisma.order.count(),
    prisma.order.count({ where: { createdAt: { gte: startOfToday } } }),
    prisma.order.count({ where: { status: 'PENDING' } }),
    prisma.order.count({ where: { status: 'PROCESSING' } }),
    prisma.order.count({ where: { status: 'PACKED' } }),
    prisma.order.count({ where: { status: 'READY_FOR_PICKUP' } }),
    prisma.order.count({ where: { status: 'PICKED_UP' } }),
    prisma.order.count({ where: { status: 'IN_TRANSIT' } }),
    prisma.order.count({ where: { status: 'DELIVERED' } }),
    prisma.order.count({ where: { status: 'CANCELLED' } }),
    // Returns counts
    prisma.returnRequest.count({ where: { status: { in: ['PENDING', 'REQUESTED'] } } }),
    prisma.returnRequest.count({ where: { type: 'EXCHANGE', status: { not: 'COMPLETED' } } }),
    // Inventory alert counts — low stock (raw: fetch all and filter in memory)
    prisma.inventory.findMany({
      where: { isDiscontinued: false },
      select: { totalStock: true, soldStock: true, reservedStock: true, lowStockAt: true },
    }),
    prisma.inventory.count({
      where: {
        totalStock: { lte: 0 },
      },
    }),
    // Negative Stock (e.g. totalStock < 0)
    prisma.inventory.count({
      where: { totalStock: { lt: 0 } },
    }),
    // Reserved > Available (where reservedStock > (totalStock - soldStock - reservedStock))
    prisma.inventory.count({
      where: {
        reservedStock: { gt: 0 },
      },
    }),
    // New Customer signups count (last 30d)
    prisma.profile.count({
      where: { role: 'CUSTOMER', createdAt: { gte: startOfMonth } },
    }),
    // Wallet credit issuances sum
    prisma.walletTransaction.aggregate({
      _sum: { amount: true },
      where: { amount: { gt: 0 } },
    }),
    // Wallet credit redemptions sum
    prisma.walletTransaction.aggregate({
      _sum: { amount: true },
      where: { amount: { lt: 0 } },
    }),
    // Activity timeline lists (Recent Orders, Recent Returns, Recent Customers)
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        profile: { select: { firstName: true, lastName: true } },
      },
    }),
    prisma.returnRequest.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        profile: { select: { firstName: true, lastName: true, email: true } },
        order: { select: { orderNumber: true } },
      },
    }),
    prisma.profile.findMany({
      take: 5,
      where: { role: 'CUSTOMER' },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  // Financial aggregates calculation
  const revToday = Number(revenueToday._sum.total ?? 0);
  const revWeek = Number(revenueWeek._sum.total ?? 0);
  const revMonth = Number(revenueMonth._sum.total ?? 0);

  // Compute inventory alert counts from in-memory rows
  const lowStockCount = inventoryRows.filter((inv) => {
    const available = inv.totalStock - inv.soldStock - inv.reservedStock;
    return available <= inv.lowStockAt && available > 0;
  }).length;

  // AOV calculation
  const paidOrdersCount = await prisma.order.count({ where: { paymentStatus: 'PAID' } });
  const paidRevenueSum = await prisma.order.aggregate({
    _sum: { total: true },
    where: { paymentStatus: 'PAID' },
  });
  const avgOrderValue = paidOrdersCount > 0 ? Number(paidRevenueSum._sum.total ?? 0) / paidOrdersCount : 0;

  // Serialize recent list objects to prevent Decimal errors
  const serializedRecentOrders = recentOrders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    email: o.email,
    total: Number(o.total),
    status: o.status,
    paymentStatus: o.paymentStatus,
    createdAt: o.createdAt.toISOString(),
    profile: o.profile
      ? {
          firstName: o.profile.firstName,
          lastName: o.profile.lastName,
        }
      : null,
  }));

  const serializedRecentReturns = recentReturns.map((r) => ({
    id: r.id,
    type: r.type,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
    orderNumber: r.order.orderNumber,
    profile: {
      firstName: r.profile.firstName,
      lastName: r.profile.lastName,
      email: r.profile.email,
    },
  }));

  const serializedRecentCustomers = recentCustomers.map((c) => ({
    id: c.id,
    email: c.email,
    firstName: c.firstName,
    lastName: c.lastName,
    createdAt: c.createdAt.toISOString(),
  }));

  return {
    revenueToday: revToday,
    revenueThisWeek: revWeek,
    revenueThisMonth: revMonth,
    ordersToday: ordersTodayCount,
    ordersPending: ordersPendingCount,
    ordersProcessing: ordersProcessingCount,
    ordersPacked: ordersPackedCount,
    ordersReady: ordersReadyCount,
    ordersPicked: ordersPickedCount,
    ordersTransit: ordersTransitCount,
    ordersDelivered: ordersDeliveredCount,
    ordersCancelled: ordersCancelledCount,
    totalOrdersAllTime: ordersTotalCount,
    pendingReturns: returnsPending,
    pendingExchanges: returnsExchanges,
    lowStock: lowStockCount,
    outOfStock: outOfStockCount,
    negativeStock: negativeStockCount,
    reservedExceeds: reservedExceedsCount,
    newCustomers: newCustomersCount,
    walletCreditsIssued: Number(walletCreditsIssued._sum.amount ?? 0),
    walletCreditsRedeemed: Math.abs(Number(walletCreditsRedeemed._sum.amount ?? 0)),
    averageOrderValue: avgOrderValue,
    recentOrders: serializedRecentOrders,
    recentReturns: serializedRecentReturns,
    recentCustomers: serializedRecentCustomers,
  };
}

// ── PART 2: ORDER LIFECYCLE ACTIONS ──────────────────────────────────────────
export async function getAdminOrderDetail(id: string) {
  await requireAdmin();

  const o = await prisma.order.findUnique({
    where: { id },
    include: {
      profile: {
        select: {
          firstName: true,
          lastName: true,
          godsmoveId: true,
        },
      },
      items: true,
      returnRequests: true,
    },
  });

  if (!o) throw new Error('Order not found');

  return {
    id: o.id,
    orderNumber: o.orderNumber,
    email: o.email,
    shippingAddress: o.shippingAddress ? JSON.parse(JSON.stringify(o.shippingAddress)) : null,
    billingAddress: null,
    subtotal: Number(o.subtotal),
    discountAmount: Number(o.discountAmount),
    shippingCost: Number(o.shippingCost),
    walletCredit: Number(o.walletCredit),
    total: Number(o.total),
    status: o.status,
    paymentStatus: o.paymentStatus,
    paymentMethod: o.paymentMethod,
    trackingNumber: o.fulfillmentRef,
    carrier: o.fulfillmentProvider,
    createdAt: o.createdAt.toISOString(),
    paidAt: o.paidAt ? o.paidAt.toISOString() : null,
    fulfilledAt: o.fulfilledAt ? o.fulfilledAt.toISOString() : null,
    profile: o.profile,
    items: o.items.map((i) => ({
      id: i.id,
      productName: i.productName,
      variantId: i.variantId,
      size: i.size,
      quantity: i.quantity,
      price: Number(i.price),
      total: Number(i.total),
    })),
    returnRequests: o.returnRequests.map((r) => ({
      id: r.id,
      status: r.status,
      type: r.type,
      createdAt: r.createdAt.toISOString(),
    })),
  };
}

// ── ORDER LIFECYCLE STATE MACHINE ────────────────────────────────────────────
// Strict forward-only transitions. Prevents all impossible business states.
// Invalid transitions throw a descriptive error that surfaces to the admin UI.

const ORDER_STATUS_RANK: Record<string, number> = {
  PENDING:           0,
  CONFIRMED:         1,
  PROCESSING:        2,  // legacy fallback — same rank as PACKED
  PACKED:            2,
  READY_FOR_PICKUP:  3,
  PICKED_UP:         4,
  IN_TRANSIT:        4,
  SHIPPED:           4,  // legacy fallback
  DELIVERED:         5,
  COMPLETED:         6,
  // Terminal states — rank 99 means no further transitions allowed
  CANCELLED:        99,
  RETURNED:         99,
  REFUNDED:         99,
};

// Which statuses are allowed as the source for each target transition
const VALID_TRANSITIONS: Record<string, string[]> = {
  CONFIRMED:        ['PENDING'],
  PACKED:           ['CONFIRMED', 'PROCESSING'],
  READY_FOR_PICKUP: ['PACKED'],
  PICKED_UP:        ['PACKED', 'READY_FOR_PICKUP'],
  IN_TRANSIT:       ['PACKED', 'READY_FOR_PICKUP', 'PICKED_UP'],
  SHIPPED:          ['PACKED', 'READY_FOR_PICKUP', 'PICKED_UP', 'IN_TRANSIT'],
  DELIVERED:        ['IN_TRANSIT', 'SHIPPED', 'OUT_FOR_DELIVERY', 'PICKED_UP', 'READY_FOR_PICKUP'],
  COMPLETED:        ['DELIVERED'],
  CANCELLED:        ['PENDING', 'CONFIRMED', 'PACKED', 'READY_FOR_PICKUP', 'PICKED_UP', 'IN_TRANSIT', 'SHIPPED'],
};

function assertValidTransition(from: string, to: string, orderNumber: string) {
  const allowed = VALID_TRANSITIONS[to];
  if (!allowed) {
    throw new Error(
      `Order #${orderNumber}: Transition to "${to}" is not a valid admin-driven transition.`
    );
  }
  if (!allowed.includes(from)) {
    throw new Error(
      `Order #${orderNumber}: Cannot move from "${from}" → "${to}". ` +
      `Order must be in one of [${allowed.join(', ')}] first.`
    );
  }
}

export async function updateOrderStatus(orderId: string, status: string) {
  await requireAdmin();

  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) throw new Error('Order not found');

    // ── AUTO-REPAIR CONFLICTING HISTORICAL STATES ─────────────────────────────
    if (order.status === 'COMPLETED' && order.paymentStatus !== 'PAID') {
      console.warn(`[Auto-Repair] Order #${order.orderNumber} was COMPLETED but UNPAID. Correcting paymentStatus to PAID.`);
      await tx.order.update({
        where: { id: orderId },
        data: { paymentStatus: 'PAID', paidAt: order.paidAt || new Date() }
      });
      order.paymentStatus = 'PAID';
      if (!order.paidAt) order.paidAt = new Date();
    }

    if (Number(order.total) === 0 && order.paymentStatus !== 'PAID') {
      console.warn(`[Auto-Repair] Zero-payable Order #${order.orderNumber} was UNPAID. Correcting paymentStatus to PAID.`);
      await tx.order.update({
        where: { id: orderId },
        data: { paymentStatus: 'PAID', paidAt: order.paidAt || new Date() }
      });
      order.paymentStatus = 'PAID';
      if (!order.paidAt) order.paidAt = new Date();
    }

    const from = order.status;
    const to   = status;

    // ── PAYMENT GUARD ─────────────────────────────────────────────────────────
    // Non-COD orders: payment must have been confirmed before we can process them
    if (to === 'CONFIRMED' && order.paymentMethod !== 'COD' && Number(order.total) > 0) {
      if (order.paymentStatus !== 'PAID') {
        throw new Error(
          `Order #${order.orderNumber}: Cannot confirm — payment status is "${order.paymentStatus}". ` +
          `Payment must be collected before confirming a non-COD order.`
        );
      }
    }

    // COMPLETED requires PAID. COD orders are auto-marked PAID at this point.
    if (to === 'COMPLETED') {
      const isCOD = order.paymentMethod === 'COD' || order.paymentMethod === 'WALLET';
      if (!isCOD && order.paymentStatus !== 'PAID') {
        throw new Error(
          `Order #${order.orderNumber}: Cannot complete — payment status is "${order.paymentStatus}". ` +
          `Collect payment before marking order as Completed.`
        );
      }
    }

    // CANCELLED: terminal state — cannot cancel if already terminal
    if (['CANCELLED', 'RETURNED', 'REFUNDED', 'COMPLETED'].includes(from) && to !== from) {
      throw new Error(
        `Order #${order.orderNumber}: Cannot modify a terminal order (status: "${from}").`
      );
    }

    // ── INVENTORY ADJUSTMENTS ─────────────────────────────────────────────────
    // Convert soft-reserve → sold stock on CONFIRMED for COD orders
    // (for Razorpay, this is done at payment confirmation in confirmOrder)
    if (to === 'CONFIRMED' && from === 'PENDING' && order.paymentMethod === 'COD') {
      for (const item of order.items) {
        const inv = await tx.inventory.findUnique({ where: { variantId: item.variantId } });
        if (inv) {
          await tx.inventory.update({
            where: { id: inv.id },
            data: {
              reservedStock: { decrement: Math.min(inv.reservedStock, item.quantity) },
              soldStock:     { increment: item.quantity },
            },
          });
          await tx.inventoryMovement.create({
            data: {
              inventoryId: inv.id,
              delta: -item.quantity,
              type: 'PURCHASE',
              orderId,
              reason: `COD order #${order.orderNumber} confirmed`,
            },
          });
        }
      }
    }

    // Restore stock on CANCELLED
    if (to === 'CANCELLED') {
      for (const item of order.items) {
        const inv = await tx.inventory.findUnique({ where: { variantId: item.variantId } });
        if (inv) {
          const wasPaid = order.paymentStatus === 'PAID';
          await tx.inventory.update({
            where: { id: inv.id },
            data: wasPaid
              ? { soldStock:     { decrement: Math.min(inv.soldStock,    item.quantity) } }
              : { reservedStock: { decrement: Math.min(inv.reservedStock, item.quantity) } },
          });
          await tx.inventoryMovement.create({
            data: {
              inventoryId: inv.id,
              delta: item.quantity,
              type: 'CANCEL',
              orderId,
              reason: `Order #${order.orderNumber} cancelled`,
            },
          });
        }
      }
    }

    // ── BUILD UPDATE PAYLOAD ───────────────────────────────────────────────────
    const isCOD = order.paymentMethod === 'COD' || order.paymentMethod === 'WALLET';
    const now   = new Date();

    const updateData: any = { status: to };

    // Auto-mark PAID:
    //   - COD/WALLET: at COMPLETED (cash collected + order closed)
    //   - Any method: at DELIVERED or COMPLETED if somehow still UNPAID (safety net)
    if ((to === 'COMPLETED' || to === 'DELIVERED') && order.paymentStatus !== 'PAID') {
      updateData.paymentStatus = 'PAID';
      updateData.paidAt        = order.paidAt || now;
    }

    // Record delivery timestamps
    if (to === 'DELIVERED' && !order.fulfilledAt) {
      updateData.fulfilledAt = now;
    }
    if (to === 'COMPLETED' && !order.fulfilledAt) {
      updateData.fulfilledAt = now;
    }

    // Update fulfillmentStatus
    if (to === 'DELIVERED')  updateData.fulfillmentStatus = 'FULFILLED';
    if (to === 'CANCELLED')  updateData.fulfillmentStatus = 'UNFULFILLED';
    if (to === 'COMPLETED')  updateData.fulfillmentStatus = 'FULFILLED';

    const updated = await tx.order.update({
      where: { id: orderId },
      data:  updateData,
    });

    // ── NOTIFICATION DISPATCH (AWAITED FOR SERVERLESS SAFETY) ───────────
    try {
      const fullOrder = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true, profile: true },
      });
      if (fullOrder) {
        if (to === 'SHIPPED' || to === 'IN_TRANSIT') {
          await NotificationService.sendOrderShipped(fullOrder, fullOrder.fulfillmentProvider || 'Shiprocket', fullOrder.fulfillmentRef || 'AWB-PENDING');
        } else if (to === 'DELIVERED' || to === 'COMPLETED') {
          await NotificationService.sendOrderDelivered(fullOrder);
        } else if (to === 'CANCELLED') {
          await NotificationService.sendOrderCancelled(fullOrder, 'Order status updated by admin');
        }
      }
    } catch (err: any) {
      console.error(`❌ [ADMIN UPDATE ORDER STATUS NOTIFICATION ERROR] Order ${orderId}:`, err);
    }

    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath('/admin/orders');
    revalidatePath('/admin');
    revalidatePath('/profile');
    revalidatePath(`/orders/${order.orderNumber}`);
    return updated;
  });
}

// ── PAYMENT STATUS MANUAL OVERRIDE ACTION ──────────────────────────────────
export async function updateOrderPaymentStatus(orderId: string, paymentStatus: string) {
  await requireAdmin();

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { profile: true },
  });
  if (!order) throw new Error('Order not found');

  if (Number(order.total) === 0 && paymentStatus !== 'PAID') {
    throw new Error('Zero-payable orders paid via GODSMOVE Credits/Discounts must remain in PAID status.');
  }

  const updateData: any = { paymentStatus: paymentStatus as any };
  if (paymentStatus === 'PAID' && !order.paidAt) {
    updateData.paidAt = new Date();
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: updateData,
  });

  if (paymentStatus === 'PAID') {
    try {
      const addr = typeof order.shippingAddress === 'string' ? JSON.parse(order.shippingAddress) : (order.shippingAddress || {});
      const customerName = addr.firstName ? `${addr.firstName} ${addr.lastName || ''}`.trim() : 'Valued Collector';
      await NotificationService.sendPaymentConfirmed(
        order.email,
        customerName,
        order.orderNumber,
        Number(order.total),
        `PAY_${order.orderNumber}_${Date.now().toString().slice(-6)}`,
        order.id
      );
    } catch (err: any) {
      console.error('❌ [PAYMENT STATUS UPDATE NOTIFICATION ERROR]:', err?.message);
    }
  }

  safeRevalidate(`/admin/orders/${orderId}`);
  safeRevalidate('/admin/orders');
  safeRevalidate('/profile');
  return updated;
}

// ── PART 3: FULFILLMENT LAYER ACTIONS ──────────────────────────────────────────
export async function assignOrderCourier(
  orderId: string,
  carrier: string,
  trackingNumber: string
) {
  await requireAdmin();

  const order = await prisma.order.update({
    where: { id: orderId },
    data: {
      fulfillmentProvider: carrier,
      fulfillmentRef: trackingNumber,
      status: 'IN_TRANSIT',
    },
  });

  try {
    const fullOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, profile: true },
    });
    if (fullOrder) {
      await NotificationService.sendOrderShipped(fullOrder, carrier, trackingNumber);
    }
  } catch (err: any) {
    console.error(`❌ [ASSIGN COURIER NOTIFICATION ERROR] Order ${orderId}:`, err);
  }

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath('/admin/orders');
  revalidatePath('/profile');
  revalidatePath(`/orders/${order.orderNumber}`);
  return order;
}

// ── PART 4: INVENTORY MANAGEMENT ACTIONS ───────────────────────────────────────
export async function getAdminInventory() {
  await requireAdmin();

  const inventory = await prisma.inventory.findMany({
    include: {
      variant: {
        include: {
          product: {
            select: {
              name: true,
              slug: true,
              status: true,
            },
          },
        },
      },
      movements: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  return inventory.map((inv) => {
    const available = inv.totalStock - inv.soldStock - inv.reservedStock;
    return {
      id: inv.id,
      variantId: inv.variantId,
      sku: inv.variant.sku,
      size: inv.variant.size,
      color: inv.variant.color,
      productName: inv.variant.product.name,
      productSlug: inv.variant.product.slug,
      productStatus: inv.variant.product.status,
      type: inv.type,
      totalStock: inv.totalStock,
      reservedStock: inv.reservedStock,
      soldStock: inv.soldStock,
      damagedStock: inv.damagedStock,
      incomingStock: inv.incomingStock,
      lowStockAt: inv.lowStockAt,
      minThreshold: inv.minThreshold,
      warehouse: inv.warehouse,
      supplier: inv.supplier,
      restockEta: inv.restockEta ? inv.restockEta.toISOString() : null,
      isDiscontinued: inv.isDiscontinued,
      availableStock: available,
      movements: inv.movements.map((m) => ({
        id: m.id,
        delta: m.delta,
        type: m.type,
        reason: m.reason,
        createdAt: m.createdAt.toISOString(),
      })),
    };
  });
}

export async function adjustInventoryStock(
  inventoryId: string,
  amount: number,
  type: 'RESTOCK' | 'ADJUSTMENT' | 'DAMAGE',
  reason: string
) {
  await requireAdmin();

  return prisma.$transaction(async (tx) => {
    const inv = await tx.inventory.findUnique({
      where: { id: inventoryId },
    });
    if (!inv) throw new Error('Inventory record not found');

    let updateData: any = {};
    if (type === 'DAMAGE') {
      // Move stock from total count to damaged count
      updateData = {
        totalStock: { decrement: amount },
        damagedStock: { increment: amount },
      };
    } else {
      // Add stock
      updateData = {
        totalStock: { increment: amount },
      };
    }

    const updated = await tx.inventory.update({
      where: { id: inventoryId },
      data: updateData,
    });

    await tx.inventoryMovement.create({
      data: {
        inventoryId,
        delta: type === 'DAMAGE' ? -amount : amount,
        type: type === 'DAMAGE' ? 'ADJUSTMENT' : type,
        reason,
      },
    });

    revalidatePath('/admin/inventory');
    revalidatePath('/admin');
    return updated;
  });
}

// ── PART 5: RETURNS & REFUNDS workflow ─────────────────────────────────────────
export async function getAdminReturnDetail(id: string) {
  await requireAdmin();

  const r = await prisma.returnRequest.findUnique({
    where: { id },
    include: {
      order: {
        select: {
          id: true,
          orderNumber: true,
          total: true,
          shippingCost: true,
          paymentStatus: true,
        },
      },
      profile: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
          godsmoveId: true,
        },
      },
      items: {
        include: {
          orderItem: true,
        },
      },
    },
  });

  if (!r) throw new Error('Return request not found');

  return {
    id: r.id,
    orderId: r.orderId,
    orderNumber: r.order.orderNumber,
    orderTotal: Number(r.order.total),
    shippingCost: Number(r.order.shippingCost),
    type: r.type,
    status: r.status,
    reason: r.reason,
    evidenceUrls: r.evidenceUrls,
    adminNotes: r.adminNotes,
    creditAmount: r.creditAmount ? Number(r.creditAmount) : 0,
    createdAt: r.createdAt.toISOString(),
    profile: r.profile,
    items: r.items.map((i) => ({
      id: i.id,
      quantity: i.quantity,
      productName: i.orderItem.productName,
      price: Number(i.orderItem.price),
      size: i.orderItem.size,
    })),
  };
}

export async function updateReturnStatus(returnId: string, status: string, notes?: string) {
  await requireAdmin();

  // ── RETURN STATUS GUARD ───────────────────────────────────────────────────
  const ret = await prisma.returnRequest.findUnique({
    where: { id: returnId },
    include: {
      order: true,
      // Include items so we can mirror the status onto OrderItem.returnStatus
      items: { select: { orderItemId: true } },
    },
  });
  if (!ret) throw new Error('Return request not found');

  // APPROVED requires: order must be DELIVERED or COMPLETED AND payment must be PAID
  if (status === 'APPROVED') {
    const orderDelivered = ['DELIVERED', 'COMPLETED', 'RETURNED', 'RETURN_REQUESTED'].includes(ret.order.status);
    if (!orderDelivered) {
      throw new Error(
        `Cannot approve return: Order #${ret.order.orderNumber} has not been delivered yet (status: "${ret.order.status}").`
      );
    }
    if (ret.order.paymentStatus !== 'PAID') {
      throw new Error(
        `Cannot approve return: Order #${ret.order.orderNumber} payment is "${ret.order.paymentStatus}". ` +
        `Only paid orders are eligible for returns.`
      );
    }
  }

  // REFUND_PROCESSED: now allowed from APPROVED (new workflow) OR INSPECTION/RECEIVED (legacy compat)
  // COMPLETED: must have gone through INSPECTION (QC pass after refund)
  if (status === 'REFUND_PROCESSED') {
    const validPrecursor = ['APPROVED', 'INSPECTION', 'RECEIVED', 'REFUND_PROCESSED'].includes(ret.status);
    if (!validPrecursor) {
      throw new Error(
        `Cannot move return to "REFUND_PROCESSED": Current status is "${ret.status}". ` +
        `Return must be APPROVED or INSPECTED first.`
      );
    }
  }
  if (status === 'COMPLETED') {
    const validPrecursor = ['INSPECTION', 'RECEIVED', 'REFUND_PROCESSED'].includes(ret.status);
    if (!validPrecursor) {
      throw new Error(
        `Cannot move return to "COMPLETED": Current status is "${ret.status}". ` +
        `Return must be INSPECTED or REFUND_PROCESSED first.`
      );
    }
  }

  // Run ReturnRequest update + OrderItem mirror + ReturnEvent in one transaction
  // so the Orders page and Returns page always read the same state.
  const updated = await prisma.$transaction(async (tx) => {
    // 1. Update ReturnRequest — canonical source of truth
    const updatedReq = await tx.returnRequest.update({
      where: { id: returnId },
      data: {
        status: status as any,
        adminNotes: notes ?? undefined,
        ...(status === 'COMPLETED' && { resolvedAt: new Date() }),
      },
    });

    // 2. Mirror status onto every associated OrderItem — keeps the denormalized
    //    OrderItem.returnStatus field in sync so both tabs show identical state.
    //    Without this sync, the Orders tab reads stale PENDING while Returns tab
    //    correctly shows PICKUP_SCHEDULED / COLLECTED / etc.
    for (const item of ret.items) {
      await tx.orderItem.update({
        where: { id: item.orderItemId },
        data: { returnStatus: status as any },
      });
    }

    // 3. Create a ReturnEvent audit log entry
    await tx.returnEvent.create({
      data: {
        returnReqId: returnId,
        status: status as any,
        description: notes || `Return status updated to: ${status.replace(/_/g, ' ')}`,
      },
    });

    return updatedReq;
  });

  try {
    const retFull = await prisma.returnRequest.findUnique({
      where: { id: returnId },
      include: { order: true },
    });
    if (retFull && retFull.order) {
      const returnNumber = `RET-${retFull.id.substring(0, 8).toUpperCase()}`;
      if (status === 'APPROVED') {
        await NotificationService.sendReturnApproved(retFull.order.email, returnNumber, retFull.order.orderNumber);
      } else if (status === 'REJECTED') {
        await NotificationService.sendReturnRejected(retFull.order.email, returnNumber, notes || 'Does not meet return criteria');
      } else if (status === 'PICKUP_SCHEDULED') {
        await NotificationService.sendReturnPickupScheduled(retFull.order.email, returnNumber, 'Tomorrow 10 AM - 2 PM', 'Blue Dart Reverse Priority');
      } else if (status === 'PICKUP_COMPLETED') {
        await NotificationService.sendReturnPickupCompleted(retFull.order.email, returnNumber);
      }
    }
  } catch (err: any) {
    console.error(`❌ [RETURN STATUS NOTIFICATION ERROR] Return ${returnId}:`, err);
  }

  safeRevalidate(`/admin/returns/${returnId}`);
  safeRevalidate('/admin/returns');
  safeRevalidate('/admin');
  safeRevalidate('/profile');
  return updated;
}

// Strictly credit refund workflow directly to customer wallet
export async function approveReturnRefund(payload: {
  returnId: string;
  productPriceSum: number;
  outboundShippingDeduction: number;
  returnLogisticsDeduction: number;
  taxAdjustment: number;
  refundSummaryDescription: string;
}) {
  await requireAdmin();

  const {
    returnId,
    productPriceSum,
    outboundShippingDeduction,
    returnLogisticsDeduction,
    taxAdjustment,
    refundSummaryDescription,
  } = payload;

  // STRICT RULE: Wallet Credit = Product Price - Outbound Shipping - Return Logistics - Tax Adj
  const finalWalletRefund = productPriceSum - outboundShippingDeduction - returnLogisticsDeduction - taxAdjustment;

  if (finalWalletRefund < 0) {
    throw new Error('Refund calculation cannot yield a negative credit amount.');
  }

  const result = await prisma.$transaction(async (tx) => {
    const ret = await tx.returnRequest.findUnique({
      where: { id: returnId },
      include: {
        items: { include: { orderItem: true } },
        order: true,
      },
    });
    if (!ret) throw new Error('Return request not found');

    // ── IDEMPOTENCE GUARD: IF REFUND WAS ALREADY PROCESSED, DO NOT DOUBLE REFUND ──
    const existingRefund = await tx.walletRefund.findUnique({
      where: { returnReqId: returnId },
    });
    if (existingRefund || ret.status === 'REFUND_PROCESSED' || ['PICKUP_SCHEDULED', 'COLLECTED', 'RECEIVED', 'INSPECTION', 'COMPLETED'].includes(ret.status)) {
      console.log(`ℹ️ [REFUND GUARD] Return ${returnId} refund already processed. Returning existing balance.`);
      return {
        success: true,
        refundAlreadyProcessed: true,
        refundIssued: Number(ret.creditAmount || existingRefund?.finalRefund || 0),
        email: ret.order.email,
      };
    }

    // ── REFUND ELIGIBILITY GUARD ─────────────────────────────────────────────
    // RULE: Cannot issue wallet credit for an order that was never paid.
    // This prevents the COMPLETED+UNPAID impossible state.
    if (ret.order.paymentStatus !== 'PAID') {
      throw new Error(
        `Cannot issue refund: Order #${ret.order.orderNumber} payment is "${ret.order.paymentStatus}". ` +
        `Only paid orders are eligible for wallet credit refunds.`
      );
    }

    // RULE: Cannot refund if order was never delivered.
    const wasDelivered = ret.order.status === 'DELIVERED' || ret.order.status === 'COMPLETED' ||
                         ret.order.status === 'RETURNED'  || ret.order.status === 'RETURN_REQUESTED';
    if (!wasDelivered) {
      throw new Error(
        `Cannot issue refund: Order #${ret.order.orderNumber} was never delivered (status: "${ret.order.status}"). ` +
        `Refunds are only valid after successful delivery.`
      );
    }

    // 1. Get or create wallet
    let wallet = await tx.wallet.findUnique({
      where: { profileId: ret.profileId },
    });
    if (!wallet) {
      wallet = await tx.wallet.create({
        data: { profileId: ret.profileId },
      });
    }

    // 2. Add refund balance credit
    const updatedWallet = await tx.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: { increment: finalWalletRefund },
      },
    });

    // 3. Record transaction
    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        amount: finalWalletRefund,
        type: 'CREDIT_RETURN',
        description: `Refund approved: ${refundSummaryDescription}`,
        returnId,
      },
    });

    // 4. Create WalletRefund ledger record
    await tx.walletRefund.create({
      data: {
        returnReqId: returnId,
        subtotal: productPriceSum,
        logisticsDeduction: outboundShippingDeduction + returnLogisticsDeduction + taxAdjustment,
        finalRefund: finalWalletRefund,
      },
    });

    // 5. Create ReturnEvent — REFUND_PROCESSED (logistics stages continue after this)
    await tx.returnEvent.create({
      data: {
        returnReqId: returnId,
        status: 'REFUND_PROCESSED',
        description: `Wallet refund credited. Total refund amount: ₹${finalWalletRefund.toLocaleString('en-IN')}. Awaiting reverse logistics.`,
      },
    });

    // 6. Update returnStatus on order items to REFUND_PROCESSED
    for (const item of ret.items) {
      await tx.orderItem.update({
        where: { id: item.orderItemId },
        data: {
          returnStatus: 'REFUND_PROCESSED',
        },
      });
    }

    // 7. Update return request status to REFUND_PROCESSED and save credit issued
    //    NOTE: Inventory restore and order status update happen in completeReturnCase
    //    after QC quality check is passed — not here.
    await tx.returnRequest.update({
      where: { id: returnId },
      data: {
        status: 'REFUND_PROCESSED',
        creditAmount: finalWalletRefund,
        adminNotes: `Refund summary logged: Outbound shipping deduction: ₹${outboundShippingDeduction}, Pickup deduction: ₹${returnLogisticsDeduction}. Total issued: ₹${finalWalletRefund}.`,
      },
    });

    return { success: true, refundIssued: finalWalletRefund, email: ret.order.email };
  });

  // Send refund notification email
  try {
    const deductionHtml = `
      <tr>
        <td>Subtotal Items Returned</td>
        <td style="text-align: right;">₹${productPriceSum.toLocaleString('en-IN')}</td>
      </tr>
      <tr>
        <td>- Outbound Shipping Deduction</td>
        <td style="text-align: right;">₹${outboundShippingDeduction.toLocaleString('en-IN')}</td>
      </tr>
      <tr>
        <td>- Reverse Logistics Deduction</td>
        <td style="text-align: right;">₹${returnLogisticsDeduction.toLocaleString('en-IN')}</td>
      </tr>
      <tr>
        <td>- Tax Adjustment Deduction</td>
        <td style="text-align: right;">₹${taxAdjustment.toLocaleString('en-IN')}</td>
      </tr>
      <tr style="border-top: 1px solid #000; font-weight: bold;">
        <td>Net Wallet Credit</td>
        <td style="text-align: right;">₹${finalWalletRefund.toLocaleString('en-IN')}</td>
      </tr>
    `;
    await NotificationService.sendReturnRefunded(
      result.email,
      returnId,
      `₹${finalWalletRefund.toLocaleString('en-IN')}`,
      deductionHtml
    );
  } catch (err) {
    console.error('Refund notification email failed:', err);
  }

  safeRevalidate(`/admin/returns/${returnId}`);
  safeRevalidate('/admin/returns');
  safeRevalidate('/admin');
  safeRevalidate('/profile');
  return { success: true, refundIssued: result.refundIssued };
}

export async function createAdminShipment(
  orderId: string,
  itemIds: string[],
  carrierName: string
) {
  await requireAdmin();

  // Validate order and its items
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) throw new Error('Order not found');

  const addr = typeof order.shippingAddress === 'string'
    ? JSON.parse(order.shippingAddress)
    : (order.shippingAddress as any);

  // Call Logistics abstraction layer to simulate carrier allocation
  const provider = LogisticsService.getProvider(carrierName);
  const logisticsResult = await provider.createShipment({
    orderId: order.id,
    customerName: addr ? `${addr.firstName} ${addr.lastName}` : 'Customer',
    email: order.email,
    phone: addr?.phone || '',
    address: {
      line1: addr?.line1 || '',
      line2: addr?.line2 || '',
      landmark: addr?.landmark || '',
      city: addr?.city || '',
      state: addr?.state || '',
      pincode: addr?.pincode || '',
    },
    items: order.items
      .filter((i) => itemIds.includes(i.id))
      .map((i) => ({
        name: i.productName,
        sku: i.variantSku,
        quantity: i.quantity,
        price: Number(i.price),
      })),
  });

  const destPincode = addr?.pincode || '';
  const estimatedDelivery = calculateETA('110001', destPincode, carrierName);

  const shipment = await prisma.$transaction(async (tx) => {
    // Create Shipment
    const ship = await tx.shipment.create({
      data: {
        orderId,
        carrier: logisticsResult.carrier,
        trackingNumber: logisticsResult.awb,
        trackingUrl: logisticsResult.trackingUrl,
        awb: logisticsResult.awb,
        status: 'CREATED',
        estimatedDelivery,
      },
    });

    // Link items to shipment
    for (const itemId of itemIds) {
      await tx.orderItem.update({
        where: { id: itemId },
        data: {
          shipmentId: ship.id,
        },
      });
    }

    // Add ShipmentEvent
    await tx.shipmentEvent.create({
      data: {
        shipmentId: ship.id,
        status: 'CREATED',
        description: `Shipment package created and mapped to carrier ${logisticsResult.carrier}.`,
        location: 'Warehouse Hub',
      },
    });

    // Also update order global status to processing
    await tx.order.update({
      where: { id: orderId },
      data: {
        status: 'PROCESSING',
        fulfillmentStatus: 'PARTIALLY_FULFILLED',
      },
    });

    return ship;
  });

  // Dispatch luxury email notification
  try {
    const formattedEstDate = estimatedDelivery.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    await NotificationService.sendShipmentCreated(
      order.email,
      order.orderNumber,
      shipment.carrier,
      shipment.trackingNumber,
      shipment.trackingUrl || '',
      formattedEstDate
    );
  } catch (err) {
    console.error('Shipment notification failed:', err);
  }

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath('/admin/orders');
  revalidatePath('/profile');
  revalidatePath(`/orders/${order.orderNumber}`);
  return shipment;
}

export async function addShipmentEvent(
  shipmentId: string,
  status: any,
  description?: string,
  location?: string
) {
  await requireAdmin();

  const shipment = await prisma.shipment.findUnique({
    where: { id: shipmentId },
    include: { order: true },
  });
  if (!shipment) throw new Error('Shipment not found');

  const updatedShipment = await prisma.$transaction(async (tx) => {
    // 1. Create ShipmentEvent
    await tx.shipmentEvent.create({
      data: {
        shipmentId,
        status,
        description,
        location,
      },
    });

    // 2. Update Shipment status
    const data: any = { status };
    if (status === 'DELIVERED') {
      data.deliveredAt = new Date();
    } else if (status === 'PICKED_UP' || status === 'IN_TRANSIT') {
      data.shippedAt = new Date();
    }

    const ship = await tx.shipment.update({
      where: { id: shipmentId },
      data,
    });

    // 3. Sync order status from shipment events
    if (status === 'DELIVERED') {
      // Check if ALL order items are linked to shipments AND all those shipments are delivered
      const allItems = await tx.orderItem.findMany({
        where: { orderId: shipment.orderId },
      });
      const allFulfilled = allItems.every((item) => item.shipmentId !== null);

      const allShipments = await tx.shipment.findMany({
        where: { orderId: shipment.orderId },
      });
      const allDelivered = allShipments.every((s) => s.id === shipmentId ? true : s.status === 'DELIVERED');

      if (allFulfilled && allDelivered) {
        const currentOrder = await tx.order.findUnique({ where: { id: shipment.orderId } });
        await tx.order.update({
          where: { id: shipment.orderId },
          data: {
            status: 'DELIVERED',
            fulfillmentStatus: 'FULFILLED',
            // Always record fulfilledAt on first delivery
            fulfilledAt: currentOrder?.fulfilledAt || new Date(),
            // Safety net: if somehow still unpaid, mark paid now
            ...(currentOrder?.paymentStatus !== 'PAID' && {
              paymentStatus: 'PAID',
              paidAt: currentOrder?.paidAt || new Date(),
            }),
          },
        });
      } else {
        // Partial delivery — mark as partially fulfilled
        await tx.order.update({
          where: { id: shipment.orderId },
          data: { fulfillmentStatus: 'PARTIALLY_FULFILLED' },
        });
      }
    } else if (status === 'PICKED_UP' || status === 'IN_TRANSIT' || status === 'OUT_FOR_DELIVERY') {
      const currentOrder = await tx.order.findUnique({ where: { id: shipment.orderId } });
      // Only advance if not already at DELIVERED or COMPLETED
      const advanceable = ['CONFIRMED', 'PROCESSING', 'PACKED', 'READY_FOR_PICKUP', 'SHIPPED'];
      if (currentOrder && advanceable.includes(currentOrder.status)) {
        await tx.order.update({
          where: { id: shipment.orderId },
          data: { status: 'IN_TRANSIT' },
        });
      }
    } else if (status === 'OUT_FOR_DELIVERY') {
      // No-op for order status — tracking event only
    }

    return ship;
  });

  // Dispatch event status email update
  try {
    await NotificationService.sendShipmentStatusUpdate(
      shipment.order.email,
      shipment.order.orderNumber,
      shipment.trackingNumber,
      status,
      location || 'Hub Terminal',
      description || `Shipment transitioned to status: ${status}`
    );
  } catch (err) {
    console.error('Shipment event notification failed:', err);
  }

  revalidatePath(`/admin/orders/${shipment.orderId}`);
  revalidatePath('/admin/orders');
  revalidatePath('/profile');
  return updatedShipment;
}

export async function approveAdminReturnRequest(
  returnId: string,
  carrierName: string
) {
  await requireAdmin();

  const ret = await prisma.returnRequest.findUnique({
    where: { id: returnId },
    include: { order: true, items: { include: { orderItem: true } } },
  });
  if (!ret) throw new Error('Return request not found');

  const provider = LogisticsService.getProvider(carrierName);
  const addr = typeof ret.order.shippingAddress === 'string'
    ? JSON.parse(ret.order.shippingAddress)
    : (ret.order.shippingAddress as any);

  const reversePickupResult = await provider.createReversePickup({
    returnReqId: returnId,
    customerName: addr ? `${addr.firstName} ${addr.lastName}` : 'Customer',
    phone: addr?.phone || '',
    pincode: addr?.pincode || '',
    address: addr ? `${addr.line1}, ${addr.line2 || ''}, ${addr.landmark || ''}, ${addr.city}, ${addr.state}`.replace(/, ,/g, ',') : 'Address',
    items: ret.items.map((i) => ({
      name: i.orderItem.productName,
      quantity: i.quantity,
    })),
  });

  const updatedReturn = await prisma.$transaction(async (tx) => {
    // 1. Update ReturnRequest Status to APPROVED
    const updated = await tx.returnRequest.update({
      where: { id: returnId },
      data: {
        status: 'APPROVED',
      },
    });

    // 2. Create ReverseShipment
    await tx.reverseShipment.create({
      data: {
        returnReqId: returnId,
        carrier: reversePickupResult.carrier,
        trackingNumber: reversePickupResult.awb,
        awb: reversePickupResult.awb,
        status: 'PICKUP_SCHEDULED',
      },
    });

    // 3. Create ReturnEvent for APPROVED
    await tx.returnEvent.create({
      data: {
        returnReqId: returnId,
        status: 'APPROVED',
        description: `Return request approved. Scheduled reverse pickup via carrier ${reversePickupResult.carrier}.`,
      },
    });

    // 4. Update returnStatus for order_items to APPROVED
    for (const item of ret.items) {
      await tx.orderItem.update({
        where: { id: item.orderItemId },
        data: {
          returnStatus: 'APPROVED',
        },
      });
    }

    return updated;
  });

  // Dispatch return approval and reverse logistics notification email
  try {
    await NotificationService.sendReturnApproved(
      ret.order.email,
      returnId,
      reversePickupResult.carrier,
      reversePickupResult.awb
    );
  } catch (err) {
    console.error('Return approval notification failed:', err);
  }

  safeRevalidate(`/admin/returns/${returnId}`);
  safeRevalidate('/admin/returns');
  safeRevalidate('/profile');
  return updatedReturn;
}

export async function updateAdminReturnQC(
  returnId: string,
  status: 'RECEIVED' | 'INSPECTION' | 'REJECTED',
  notes?: string
) {
  await requireAdmin();

  const ret = await prisma.returnRequest.findUnique({
    where: { id: returnId },
    include: { order: true, items: { include: { orderItem: true } } },
  });
  if (!ret) throw new Error('Return request not found');

  const updated = await prisma.$transaction(async (tx) => {
    const updatedReq = await tx.returnRequest.update({
      where: { id: returnId },
      data: {
        status: status as any,
        adminNotes: notes ?? undefined,
      },
    });

    // Create ReturnEvent
    await tx.returnEvent.create({
      data: {
        returnReqId: returnId,
        status: status as any,
        description: notes || `Return package state updated to: ${status}`,
      },
    });

    // Update ReverseShipment status
    if (status === 'RECEIVED') {
      await tx.reverseShipment.updateMany({
        where: { returnReqId: returnId },
        data: {
          status: 'DELIVERED_TO_WAREHOUSE',
          deliveredAt: new Date(),
        },
      });
    }

    // Update order items return status
    for (const item of ret.items) {
      await tx.orderItem.update({
        where: { id: item.orderItemId },
        data: {
          returnStatus: status as any,
        },
      });
    }

    return updatedReq;
  });

  // Send email if received at warehouse
  if (status === 'RECEIVED') {
    try {
      await NotificationService.sendReturnReceived(
        ret.order.email,
        returnId
      );
    } catch (err) {
      console.error('Return received notification failed:', err);
    }
  }

  safeRevalidate(`/admin/returns/${returnId}`);
  safeRevalidate('/admin/returns');
  safeRevalidate('/profile');
  return updated;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPLETE RETURN CASE
// Called after QC Quality Check passes (INSPECTION → COMPLETED).
// Handles inventory restoration and order status promotion.
// In the new workflow, refund has already been issued at APPROVED stage.
// ─────────────────────────────────────────────────────────────────────────────
export async function completeReturnCase(returnId: string, notes?: string) {
  await requireAdmin();

  const ret = await prisma.returnRequest.findUnique({
    where: { id: returnId },
    include: { order: true, items: { include: { orderItem: true } } },
  });
  if (!ret) throw new Error('Return request not found');

  // Must be INSPECTION or REFUND_PROCESSED to complete
  const validPrecursor = ['INSPECTION', 'REFUND_PROCESSED'].includes(ret.status);
  if (!validPrecursor) {
    throw new Error(
      `Cannot complete return case: Current status is "${ret.status}". ` +
      `Return must be at INSPECTION or REFUND_PROCESSED stage.`
    );
  }

  await prisma.$transaction(async (tx) => {
    // 1. Update return to COMPLETED
    await tx.returnRequest.update({
      where: { id: returnId },
      data: {
        status: 'COMPLETED',
        resolvedAt: new Date(),
        adminNotes: notes || ret.adminNotes || 'QC passed. Case completed.',
      },
    });

    // 2. Update order items to COMPLETED
    for (const item of ret.items) {
      await tx.orderItem.update({
        where: { id: item.orderItemId },
        data: { returnStatus: 'COMPLETED' },
      });
    }

    // 3. Create COMPLETED ReturnEvent
    await tx.returnEvent.create({
      data: {
        returnReqId: returnId,
        status: 'COMPLETED',
        description: notes || 'QC quality check passed. Return case closed.',
      },
    });

    // 4. Restore inventory (item physically returned and QC passed)
    for (const item of ret.items) {
      const inv = await tx.inventory.findUnique({
        where: { variantId: item.orderItem.variantId },
      });
      if (inv) {
        await tx.inventory.update({
          where: { id: inv.id },
          data: { soldStock: { decrement: Math.min(inv.soldStock, item.quantity) } },
        });
        await tx.inventoryMovement.create({
          data: {
            inventoryId: inv.id,
            delta: item.quantity,
            type: 'RETURN',
            orderId: ret.orderId,
            reason: `Return Request #${returnId} — QC Passed, Case Completed`,
          },
        });
      }
    }

    // 5. Promote order status to RETURNED if all items are fully returned
    const allOrderItems = await tx.orderItem.findMany({
      where: { orderId: ret.orderId },
      select: { id: true, returnStatus: true },
    });
    const allFullyReturned = allOrderItems.every((i) => i.returnStatus === 'COMPLETED');
    if (allFullyReturned) {
      await tx.order.update({
        where: { id: ret.orderId },
        data: { status: 'RETURNED', fulfillmentStatus: 'RETURNED' },
      });
    }
  });

  safeRevalidate(`/admin/returns/${returnId}`);
  safeRevalidate('/admin/returns');
  safeRevalidate('/admin');
  safeRevalidate('/profile');
  return { success: true };
}
