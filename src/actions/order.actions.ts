'use server';

import { revalidatePath } from 'next/cache';
import { hasAdminBypass } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import {
  EXCLUSIVE_CART_TOAST_MESSAGE,
  isExclusiveChannel,
} from '@/lib/cart-rules';
import {
  CreateOrderSchema,
  UpdateOrderStatusSchema,
  AddTrackingSchema,
  type CreateOrderInput,
} from '@/lib/validations/order';
import { InvoiceService } from '@/lib/invoice';
import { NotificationService } from '@/notifications/notification.service';
import { calculateETA } from '@/lib/logistics';
import { PricingEngine } from '@/lib/pricing-engine';
import { WalletService } from '@/lib/wallet-service';

// ── HELPERS ─────────────────────────────────────────────────────────────────

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

  const createdOrder = await prisma.$transaction(async (tx) => {
    // 1. Validate and fetch all variants with inventory
    const variantIds = data.items.map((i) => i.variantId);
    const variants = await tx.productVariant.findMany({
      where: { id: { in: variantIds } },
      include: {
        inventory: true,
        product: { select: { name: true, status: true, channel: true } },
      },
    });

    // 2. Validate stock, exclusive channel limits, and availability
    const exclusiveQtyByProduct = new Map<string, number>();

    for (const item of data.items) {
      const variant = variants.find((v) => v.id === item.variantId);
      if (!variant) throw new Error(`Product variant not found: ${item.variantId}`);
      if (variant.product.status !== 'ACTIVE')
        throw new Error(`Product "${variant.product.name}" is no longer available`);

      if (isExclusiveChannel(variant.product.channel)) {
        if (item.quantity > 1) {
          throw new Error(EXCLUSIVE_CART_TOAST_MESSAGE);
        }
        exclusiveQtyByProduct.set(
          variant.productId,
          (exclusiveQtyByProduct.get(variant.productId) ?? 0) + item.quantity
        );
      }

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

    for (const totalQty of exclusiveQtyByProduct.values()) {
      if (totalQty > 1) {
        throw new Error(EXCLUSIVE_CART_TOAST_MESSAGE);
      }
    }

    const orderNumber = generateOrderNumber();

    // 3. Build items array for the pricing engine
    const pricingItems = variants.map((v) => {
      const item = data.items.find((it) => it.variantId === v.id)!;
      return {
        price: Number(v.price),
        comparePrice: v.comparePrice ? Number(v.comparePrice) : null,
        quantity: item.quantity,
        productName: v.product.name,
      };
    });

    // 4. Validate and apply discount
    let couponDiscountVal = 0;
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
      
      const subtotalTemp = pricingItems.reduce((acc, it) => acc + it.price * it.quantity, 0);
      if (discount.minimumOrderValue && subtotalTemp < Number(discount.minimumOrderValue))
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
        let calc = (subtotalTemp * Number(discount.value)) / 100;
        if (discount.maximumDiscount) {
          calc = Math.min(calc, Number(discount.maximumDiscount));
        }
        couponDiscountVal = calc;
      } else if (discount.type === 'FIXED_AMOUNT') {
        couponDiscountVal = Math.min(Number(discount.value), subtotalTemp);
      }

      discountId = discount.id;
    }

    // 5. Apply PricingEngine calculations
    const shippingState = data.shippingAddress.state || 'Haryana';
    const pricing = PricingEngine.calculate({
      items: pricingItems,
      couponCode: data.couponCode || null,
      couponDiscount: couponDiscountVal,
      walletAmountToUse: data.walletAmountToUse,
      shippingState,
    });

    const itemSnapshots = data.items.map((item) => {
      const variant = variants.find((v) => v.id === item.variantId)!;
      const breakdown = pricing.items.find(i => i.productName === variant.product.name)!;
      return {
        variantId: variant.id,
        productName: variant.product.name,
        variantSku: variant.sku,
        size: variant.size,
        color: variant.color ?? undefined,
        price: variant.price,
        quantity: item.quantity,
        total: breakdown.total,
      };
    });

    // 6. Create order (Auto-mark PAID & CONFIRMED if final payable is ₹0 via credits/discounts)
    const isZeroPayable = pricing.finalPayable === 0;

    const order = await tx.order.create({
      data: {
        orderNumber,
        profileId: user?.id ?? null,
        email: data.shippingAddress.email,
        status: isZeroPayable ? 'CONFIRMED' : 'PENDING',
        paymentStatus: isZeroPayable ? 'PAID' : 'UNPAID',
        paidAt: isZeroPayable ? new Date() : null,
        paymentMethod: isZeroPayable && data.paymentMethod === 'COD' ? 'WALLET' : (data.paymentMethod as any),
        subtotal: pricing.subtotal,
        shippingCost: pricing.shippingCost,
        discountAmount: pricing.couponDiscount,
        walletCredit: pricing.walletCredit,
        taxableAmount: pricing.taxableAmount,
        gstAmount: pricing.gstAmount,
        total: pricing.finalPayable,
        discountId,
        shippingAddress: data.shippingAddress,
        items: {
          create: itemSnapshots,
        },
      },
    });

    // 7. Debit wallet credits immediately upon checkout if used
    if (pricing.walletCredit > 0 && user) {
      const wallet = await tx.wallet.findUnique({ where: { profileId: user.id } });
      const available = Number(wallet?.balance ?? 0);
      if (available < pricing.walletCredit) {
        throw new Error('Insufficient wallet balance');
      }

      await WalletService.adjustBalance(tx, {
        profileId: user.id,
        amount: -pricing.walletCredit,
        type: 'DEBIT_ORDER',
        description: `Applied credits to Order #${orderNumber}`,
        createdBy: user.email || 'SYSTEM',
        orderId: order.id,
      });
    }

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

  // Non-blocking Order Confirmation Email trigger for COD & Zero Payable orders (after DB commit)
  if (createdOrder && (createdOrder.paymentMethod === 'COD' || Number(createdOrder.total) === 0 || createdOrder.status === 'CONFIRMED')) {
    try {
      const fullOrder = await prisma.order.findUnique({
        where: { id: createdOrder.id },
        include: {
          items: {
            include: {
              variant: {
                include: {
                  product: {
                    include: { images: { orderBy: { position: 'asc' } } },
                  },
                },
              },
            },
          },
        },
      });
      if (fullOrder) {
        NotificationService.sendOrderConfirmationForOrder(fullOrder).catch((err: any) => {
          console.error(`❌ [ORDER SERVICE] Non-critical email error for COD order ${createdOrder.id}:`, err);
        });
      }
    } catch (err: any) {
      console.error(`❌ [ORDER SERVICE] Non-critical error fetching order details for email:`, err);
    }
  }

  return createdOrder;
}

// ── CONFIRM ORDER (after payment) ────────────────────────────────────────────

export async function confirmOrder(
  orderId: string,
  razorpayPaymentId: string,
  razorpayOrderId: string
) {
  const updated = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) throw new Error('Order not found');
    if (order.paymentStatus === 'PAID') return order; // idempotent

    // Update order to confirmed
    const updatedOrder = await tx.order.update({
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

    // Wallet credit is now debited immediately during checkout (createOrder). No duplicate debit here.

    return updatedOrder;
  });

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: {
                  include: { images: { orderBy: { position: 'asc' } } },
                },
              },
            },
          },
        },
        profile: true,
      },
    });
    if (order) {
      const addr = typeof order.shippingAddress === 'string'
        ? JSON.parse(order.shippingAddress)
        : (order.shippingAddress as any);

      const invoiceData = {
        orderNumber: order.orderNumber,
        createdAt: order.createdAt,
        email: order.email,
        customerName: addr ? `${addr.firstName} ${addr.lastName}` : (order.profile ? `${order.profile.firstName || ''} ${order.profile.lastName || ''}`.trim() || 'Customer' : 'Customer'),
        shippingAddress: {
          firstName: addr?.firstName || '',
          lastName: addr?.lastName || '',
          line1: addr?.line1 || '',
          line2: addr?.line2 || '',
          landmark: addr?.landmark || '',
          city: addr?.city || '',
          state: addr?.state || '',
          pincode: addr?.pincode || '',
          phone: addr?.phone || '',
        },
        items: order.items.map((i) => ({
          productName: i.productName,
          size: i.size,
          quantity: i.quantity,
          price: Number(i.price),
          total: Number(i.total),
        })),
        subtotal: Number(order.subtotal),
        discountAmount: Number(order.discountAmount),
        walletCredit: Number(order.walletCredit),
        shippingCost: Number(order.shippingCost),
        total: Number(order.total),
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
      };

      // 1. Generate & Save invoice
      await InvoiceService.saveInvoiceFile(invoiceData);

      // 2. Dispatch Order Confirmation Notification (Idempotency protected)
      NotificationService.sendOrderConfirmationForOrder(order).catch((err: any) => {
        console.error(`❌ [ORDER SERVICE] Non-critical email error for confirmed order ${orderId}:`, err);
      });
    }
  } catch (err) {
    console.error('Invoice or notification generation failed:', err);
  }

  try {
    revalidatePath('/admin/orders');
    revalidatePath('/profile');
  } catch {}
  return updated;
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

    // Refund wallet credit if applied
    if (Number(order.walletCredit) > 0 && order.profileId) {
      await WalletService.adjustBalance(tx, {
        profileId: order.profileId,
        amount: Number(order.walletCredit),
        type: 'CREDIT_ADJUSTMENT',
        description: `Refunded from cancelled Order #${order.orderNumber}`,
        createdBy: user?.email || 'SYSTEM_REFUND',
        orderId: order.id,
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

  // Trigger event notification
  try {
    if (data.status === 'SHIPPED') {
      NotificationService.sendOrderShipped(order, 'Express Courier', 'AWB-PENDING').catch(() => {});
    } else if (data.status === 'DELIVERED') {
      NotificationService.sendOrderDelivered(order).catch(() => {});
    } else if (data.status === 'CANCELLED') {
      NotificationService.sendOrderCancelled(order, data.adminNotes).catch(() => {});
    }
  } catch {}

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

  const order = await prisma.order.findUnique({
    where: { id: data.orderId },
    select: { shippingAddress: true, orderNumber: true },
  });
  if (!order) throw new Error('Order not found');

  const addr = typeof order.shippingAddress === 'string'
    ? JSON.parse(order.shippingAddress)
    : (order.shippingAddress as any);

  const destPincode = addr?.pincode || '';
  const estimatedDelivery = calculateETA('110001', destPincode, data.carrier);

  const [shipment] = await prisma.$transaction([
    prisma.shipment.create({
      data: {
        orderId: data.orderId,
        carrier: data.carrier,
        trackingNumber: data.trackingNumber,
        trackingUrl: data.trackingUrl,
        estimatedDelivery,
      },
    }),
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
  revalidatePath(`/admin/orders/${data.orderId}`);
  revalidatePath('/profile');
  revalidatePath(`/orders/${order.orderNumber}`);
  return shipment;
}

// ── CUSTOMER: GET OWN ORDERS ─────────────────────────────────────────────────

export async function getMyOrders() {
  const user = await getCurrentUser();
  if (!user) throw new Error('UNAUTHORIZED');

  const orders = await prisma.order.findMany({
    where: { profileId: user.id },
    include: {
      items: {
        include: {
          // Per-item return context: item.returnItems[0]?.returnReq gives the full return
          // request for that specific product without UI-level cross-joins.
          returnItems: {
            include: {
              returnReq: {
                select: {
                  id: true,
                  status: true,
                  type: true,
                  creditAmount: true,
                  reason: true,
                  adminNotes: true,
                  createdAt: true,
                  resolvedAt: true,
                  events: { orderBy: { timestamp: 'asc' } },
                  reverseShipment: true,
                  walletRefund: true,
                },
              },
            },
          },
          shipment: {
            include: {
              events: {
                orderBy: { timestamp: 'asc' },
              },
            },
          },
        },
      },
      shipments: { orderBy: { createdAt: 'desc' } },
      returnRequests: {
        include: {
          items: true,
          events: {
            orderBy: { timestamp: 'asc' },
          },
          reverseShipment: true,
          walletRefund: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Serialize Prisma Decimal fields to plain JS numbers for Client Components
  return JSON.parse(JSON.stringify(orders));
}

export async function emailInvoice(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) throw new Error('Order not found');

  const result = await NotificationService.sendOrderConfirmationForOrder(order);
  return { success: true, result };
}

