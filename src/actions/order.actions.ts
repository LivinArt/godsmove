'use server';

import { revalidatePath } from 'next/cache';
import { hasAdminBypass } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import {
  CreateOrderSchema,
  UpdateOrderStatusSchema,
  AddTrackingSchema,
  type CreateOrderInput,
} from '@/lib/validations/order';

// ── HELPERS ─────────────────────────────────────────────────────────────────

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

  const adminRoles = ['ADMIN', 'OPERATIONS', 'SUPPORT'];
  if (!profile || !adminRoles.includes(profile.role)) {
    throw new Error('FORBIDDEN');
  }

  return user;
}

function generateOrderNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `SS-${year}${month}-${random}`;
}

// ── CREATE ORDER ─────────────────────────────────────────────────────────────

export async function createOrder(input: CreateOrderInput) {
  const data = CreateOrderSchema.parse(input);
  const user = await getCurrentUser();

  return prisma.$transaction(async (tx) => {
    // 1. Validate and fetch all variants with inventory
    const variantIds = data.items.map((i) => i.variantId);
    const variants = await tx.productVariant.findMany({
      where: { id: { in: variantIds } },
      include: {
        inventory: true,
        product: { select: { name: true, status: true } },
      },
    });

    // 2. Validate stock availability — atomic check
    for (const item of data.items) {
      const variant = variants.find((v) => v.id === item.variantId);
      if (!variant) throw new Error(`Product variant not found: ${item.variantId}`);
      if (variant.product.status !== 'ACTIVE')
        throw new Error(`Product "${variant.product.name}" is no longer available`);

      const available =
        (variant.inventory?.totalStock ?? 0) -
        (variant.inventory?.reservedStock ?? 0) -
        (variant.inventory?.soldStock ?? 0);

      if (available < item.quantity) {
        throw new Error(
          `Insufficient stock for ${variant.product.name} (${variant.size}). Only ${available} left.`
        );
      }
    }

    // 3. Calculate order totals
    let subtotal = 0;
    const itemSnapshots = data.items.map((item) => {
      const variant = variants.find((v) => v.id === item.variantId)!;
      const lineTotal = Number(variant.price) * item.quantity;
      subtotal += lineTotal;
      return {
        variantId: variant.id,
        productName: variant.product.name,
        variantSku: variant.sku,
        size: variant.size,
        color: variant.color ?? undefined,
        price: variant.price,
        quantity: item.quantity,
        total: lineTotal,
      };
    });

    // 4. Validate and apply discount
    let discountAmount = 0;
    let discountId: string | null = null;

    if (data.couponCode) {
      const discount = await tx.discount.findUnique({
        where: { code: data.couponCode.toUpperCase() },
      });

      if (!discount || !discount.isActive) throw new Error('Invalid discount code');
      if (discount.endsAt && discount.endsAt < new Date())
        throw new Error('Discount has expired');
      if (discount.startsAt && discount.startsAt > new Date())
        throw new Error('Discount is not yet active');
      if (discount.usageLimit && discount.usageCount >= discount.usageLimit)
        throw new Error('Discount usage limit reached');
      if (discount.minimumOrderValue && subtotal < Number(discount.minimumOrderValue))
        throw new Error(
          `Minimum order amount for this discount is ₹${discount.minimumOrderValue}`
        );

      // Per-user limit check
      if (user && discount.perCustomerLimit > 0) {
        const userUsages = await tx.order.count({
          where: { discountId: discount.id, profileId: user.id },
        });
        if (userUsages >= discount.perCustomerLimit)
          throw new Error('You have already used this discount');
      }

      if (discount.type === 'PERCENTAGE') {
        let calc = (subtotal * Number(discount.value)) / 100;
        if (discount.maximumDiscount) {
          calc = Math.min(calc, Number(discount.maximumDiscount));
        }
        discountAmount = calc;
      } else if (discount.type === 'FIXED_AMOUNT') {
        discountAmount = Math.min(Number(discount.value), subtotal);
      } else if (discount.type === 'FREE_SHIPPING') {
        // Free shipping is handled in shipping cost calculation
      }

      discountId = discount.id;
    }

    // 5. Apply wallet credit
    let walletCredit = 0;
    if (data.walletAmountToUse > 0 && user) {
      const wallet = await tx.wallet.findUnique({ where: { profileId: user.id } });
      const available = Number(wallet?.balance ?? 0);
      walletCredit = Math.min(data.walletAmountToUse, available, subtotal - discountAmount);
    }

    // 6. Calculate shipping
    const afterDiscount = subtotal - discountAmount;
    const shippingCost = afterDiscount >= 1999 ? 0 : 149;
    const total = afterDiscount - walletCredit + shippingCost;

    // 7. Create order
    const order = await tx.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        profileId: user?.id ?? null,
        email: data.shippingAddress.email,
        status: 'PENDING',
        paymentStatus: 'UNPAID',
        paymentMethod: data.paymentMethod as any,
        subtotal: subtotal,
        shippingCost: shippingCost,
        discountAmount: discountAmount,
        walletCredit: walletCredit,
        total: total,
        discountId,
        shippingAddress: data.shippingAddress,
        items: {
          create: itemSnapshots,
        },
      },
    });

    // 8. Reserve inventory (soft reserve during checkout)
    for (const item of data.items) {
      const variant = variants.find((v) => v.id === item.variantId)!;
      await tx.inventory.update({
        where: { variantId: item.variantId },
        data: { reservedStock: { increment: item.quantity } },
      });
      await tx.inventoryMovement.create({
        data: {
          inventoryId: variant.inventory!.id,
          delta: -item.quantity,
          type: 'RESERVE',
          reason: `Order ${order.orderNumber} checkout started`,
          orderId: order.id,
        },
      });
    }

    // 9. Update discount usage counter
    if (discountId) {
      await tx.discount.update({
        where: { id: discountId },
        data: { usageCount: { increment: 1 } },
      });
    }

    return order;
  });
}

// ── CONFIRM ORDER (after payment) ────────────────────────────────────────────

export async function confirmOrder(
  orderId: string,
  razorpayPaymentId: string,
  razorpayOrderId: string
) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) throw new Error('Order not found');
    if (order.paymentStatus === 'PAID') return order; // idempotent

    // Update order to confirmed
    const updated = await tx.order.update({
      where: { id: orderId },
      data: {
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        paymentMethod: 'RAZORPAY',
        razorpayPaymentId,
        razorpayOrderId,
        paidAt: new Date(),
      },
    });

    // Convert reserved → sold stock
    for (const item of order.items) {
      await tx.inventory.update({
        where: { variantId: item.variantId },
        data: {
          reservedStock: { decrement: item.quantity },
          soldStock: { increment: item.quantity },
        },
      });
      await tx.inventoryMovement.create({
        data: {
          inventoryId: (
            await tx.inventory.findUnique({ where: { variantId: item.variantId } })
          )!.id,
          delta: -item.quantity,
          type: 'PURCHASE',
          reason: `Order ${order.orderNumber} payment confirmed`,
          orderId: order.id,
        },
      });
    }

    // Debit wallet credit if applied
    if (Number(order.walletCredit) > 0 && order.profileId) {
      const wallet = await tx.wallet.findUnique({
        where: { profileId: order.profileId },
      });
      if (wallet) {
        await tx.wallet.update({
          where: { id: wallet.id },
          data: { balance: { decrement: order.walletCredit } },
        });
        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            amount: -Number(order.walletCredit),
            type: 'DEBIT_ORDER',
            orderId: order.id,
            description: `Applied to order ${order.orderNumber}`,
          },
        });
      }
    }

    revalidatePath('/admin/orders');
    return updated;
  });
}

// ── CANCEL ORDER ─────────────────────────────────────────────────────────────

export async function cancelOrder(orderId: string, reason?: string) {
  const user = await getCurrentUser();

  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true, profile: { select: { id: true } } },
    });
    if (!order) throw new Error('Order not found');

    // Customers can only cancel their own pending orders
    if (order.profileId && order.profileId !== user?.id) {
      const isAdmin = await tx.profile.findUnique({
        where: { id: user?.id ?? '' },
        select: { role: true },
      });
      if (!isAdmin || !['ADMIN', 'OPERATIONS'].includes(isAdmin.role)) {
        throw new Error('FORBIDDEN');
      }
    }

    if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
      throw new Error('Order cannot be cancelled at this stage');
    }

    // Restore inventory
    for (const item of order.items) {
      const type = order.paymentStatus === 'PAID' ? 'CANCEL' : 'UNRESERVE';
      const field =
        order.paymentStatus === 'PAID' ? 'soldStock' : 'reservedStock';

      await tx.inventory.update({
        where: { variantId: item.variantId },
        data: { [field]: { decrement: item.quantity } },
      });
    }

    const updated = await tx.order.update({
      where: { id: orderId },
      data: {
        status: 'CANCELLED',
        adminNotes: reason,
      },
    });

    revalidatePath('/admin/orders');
    return updated;
  });
}

// ── ADMIN: GET ORDERS ────────────────────────────────────────────────────────

export async function getOrders(params?: {
  status?: string;
  paymentStatus?: string;
  take?: number;
  skip?: number;
}) {
  await requireAdmin();

  return prisma.order.findMany({
    where: {
      ...(params?.status && { status: params.status as any }),
      ...(params?.paymentStatus && { paymentStatus: params.paymentStatus as any }),
    },
    include: {
      items: { include: { variant: { select: { size: true, sku: true } } } },
      profile: { select: { firstName: true, lastName: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: params?.take ?? 50,
    skip: params?.skip ?? 0,
  });
}

export async function getOrderById(orderId: string) {
  await requireAdmin();

  return prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: { select: { name: true, slug: true } },
            },
          },
        },
      },
      profile: true,
      shipments: { orderBy: { createdAt: 'desc' } },
      returnRequests: {
        include: { items: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  });
}

export async function updateOrderStatus(input: {
  orderId: string;
  status: string;
  adminNotes?: string;
}) {
  await requireAdmin();
  const data = UpdateOrderStatusSchema.parse(input);

  const order = await prisma.order.update({
    where: { id: data.orderId },
    data: {
      status: data.status as any,
      adminNotes: data.adminNotes,
      ...(data.status === 'DELIVERED' && { fulfilledAt: new Date() }),
    },
  });

  revalidatePath('/admin/orders');
  return order;
}

export async function addShipmentTracking(input: {
  orderId: string;
  carrier: string;
  trackingNumber: string;
  trackingUrl?: string;
}) {
  await requireAdmin();
  const data = AddTrackingSchema.parse(input);

  const [shipment] = await prisma.$transaction([
    prisma.shipment.create({ data }),
    prisma.order.update({
      where: { id: data.orderId },
      data: {
        status: 'SHIPPED',
        fulfillmentStatus: 'FULFILLED',
        fulfilledAt: new Date(),
      },
    }),
  ]);

  revalidatePath('/admin/orders');
  return shipment;
}

// ── CUSTOMER: GET OWN ORDERS ─────────────────────────────────────────────────

export async function getMyOrders() {
  const user = await getCurrentUser();
  if (!user) throw new Error('UNAUTHORIZED');

  return prisma.order.findMany({
    where: { profileId: user.id },
    include: {
      items: true,
      shipments: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
    orderBy: { createdAt: 'desc' },
  });
}
