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
  console.log('\n====================================================================');
  console.log('[CHECKOUT STEP 1] Checkout API Called. Parsing Input Payload...');
  console.log('Payload:', JSON.stringify(input, null, 2));

  let data: CreateOrderInput;
  try {
    data = CreateOrderSchema.parse(input);
  } catch (parseErr: any) {
    console.error('❌ [CHECKOUT ERROR] Input validation failed:', parseErr);
    throw new Error(`Invalid checkout data: ${parseErr.message || 'Validation error'}`);
  }

  const user = await getCurrentUser();
  console.log(`[CHECKOUT STEP 2] User session: ${user ? `${user.email} (${user.id})` : 'GUEST'}`);

  try {
    const createdOrder = await prisma.$transaction(async (tx) => {
      // Step 3: Fetch variants & inventory
      console.log('[CHECKOUT STEP 3] Fetching product variants & inventory...');
      const variantIds = data.items.map((i) => i.variantId);
      const variants = await tx.productVariant.findMany({
        where: { id: { in: variantIds } },
        include: {
          inventory: true,
          product: { select: { name: true, status: true, channel: true } },
        },
      });

      // Step 4: Validate stock & exclusive limits
      console.log('[CHECKOUT STEP 4] Validating stock & availability...');
      const exclusiveQtyByProduct = new Map<string, number>();

      for (const item of data.items) {
        const variant = variants.find((v) => v.id === item.variantId);
        if (!variant) {
          throw new Error(`Product variant not found in database (ID: ${item.variantId})`);
        }
        if (variant.product.status !== 'ACTIVE') {
          throw new Error(`Product "${variant.product.name}" is no longer available`);
        }

        if (isExclusiveChannel(variant.product.channel)) {
          if (item.quantity > 1) {
            throw new Error(EXCLUSIVE_CART_TOAST_MESSAGE);
          }
          exclusiveQtyByProduct.set(
            variant.productId,
            (exclusiveQtyByProduct.get(variant.productId) ?? 0) + item.quantity
          );
        }

        // Soft stock check: fallback to 100 if inventory record not initialized
        const total = variant.inventory?.totalStock ?? 100;
        const reserved = variant.inventory?.reservedStock ?? 0;
        const sold = variant.inventory?.soldStock ?? 0;
        const available = total - reserved - sold;

        console.log(`- Variant ${variant.sku} (${variant.product.name}): Total=${total}, Reserved=${reserved}, Sold=${sold}, Available=${available}`);

        if (available < item.quantity && available <= 0) {
          throw new Error(`Item "${variant.product.name} (${variant.size})" is out of stock.`);
        }
      }

      for (const totalQty of exclusiveQtyByProduct.values()) {
        if (totalQty > 1) {
          throw new Error(EXCLUSIVE_CART_TOAST_MESSAGE);
        }
      }

      const orderNumber = generateOrderNumber();
      console.log(`[CHECKOUT STEP 5] Generated Order Number: ${orderNumber}`);

      // Step 6: Build pricing engine items
      const pricingItems = variants.map((v) => {
        const item = data.items.find((it) => it.variantId === v.id)!;
        return {
          price: Number(v.price),
          comparePrice: v.comparePrice ? Number(v.comparePrice) : null,
          quantity: item.quantity,
          productName: v.product.name,
        };
      });

      // Step 7: Validate coupon code if applied
      let couponDiscountVal = 0;
      let discountId: string | null = null;

      if (data.couponCode) {
        console.log(`[CHECKOUT STEP 7] Validating discount coupon "${data.couponCode}"...`);
        const discount = await tx.discount.findUnique({
          where: { code: data.couponCode.toUpperCase() },
        });

        if (!discount || !discount.isActive) throw new Error('Invalid discount code');
        if (discount.endsAt && discount.endsAt < new Date()) throw new Error('Discount has expired');
        if (discount.startsAt && discount.startsAt > new Date()) throw new Error('Discount is not yet active');
        if (discount.usageLimit && discount.usageCount >= discount.usageLimit) throw new Error('Discount usage limit reached');

        const subtotalTemp = pricingItems.reduce((acc, it) => acc + it.price * it.quantity, 0);
        if (discount.minimumOrderValue && subtotalTemp < Number(discount.minimumOrderValue)) {
          throw new Error(`Minimum order amount for this discount is ₹${discount.minimumOrderValue}`);
        }

        if (user && discount.perCustomerLimit > 0) {
          const userUsages = await tx.order.count({
            where: { discountId: discount.id, profileId: user.id },
          });
          if (userUsages >= discount.perCustomerLimit) {
            throw new Error('You have already used this discount');
          }
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

      // Step 8: Calculate final prices
      console.log('[CHECKOUT STEP 8] Running PricingEngine calculation...');
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
        const breakdown = pricing.items.find(i => i.productName === variant.product.name);
        const itemTotal = breakdown ? breakdown.total : Number(variant.price) * item.quantity;
        return {
          variantId: variant.id,
          productName: variant.product.name,
          variantSku: variant.sku,
          size: variant.size,
          color: variant.color ?? undefined,
          price: variant.price,
          quantity: item.quantity,
          total: itemTotal,
        };
      });

      // Step 9: Verify Profile FK safely
      let validProfileId: string | null = null;
      if (user) {
        const prof = await tx.profile.findUnique({ where: { id: user.id }, select: { id: true } });
        if (prof) validProfileId = prof.id;
      }

      // Step 10: Create Order Record
      console.log('[CHECKOUT STEP 10] Inserting Order into Database...');
      const isZeroPayable = pricing.finalPayable === 0;

      const order = await tx.order.create({
        data: {
          orderNumber,
          profileId: validProfileId,
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

      console.log(`✅ [CHECKOUT SUCCESS] Order #${order.orderNumber} created in DB! ID: ${order.id}`);

      // Step 11: Debit wallet credits if applicable
      if (pricing.walletCredit > 0 && validProfileId) {
        console.log(`[CHECKOUT STEP 11] Debiting ₹${pricing.walletCredit} wallet credits...`);
        const wallet = await tx.wallet.findUnique({ where: { profileId: validProfileId } });
        const available = Number(wallet?.balance ?? 0);
        if (available < pricing.walletCredit) {
          throw new Error('Insufficient wallet balance');
        }

        await WalletService.adjustBalance(tx, {
          profileId: validProfileId,
          amount: -pricing.walletCredit,
          type: 'DEBIT_ORDER',
          description: `Applied credits to Order #${orderNumber}`,
          createdBy: user?.email || 'SYSTEM',
          orderId: order.id,
        });
      }

      // Step 12: Reserve inventory safely (upsert if missing)
      console.log('[CHECKOUT STEP 12] Reserving inventory in database...');
      for (const item of data.items) {
        const variant = variants.find((v) => v.id === item.variantId)!;

        const inv = await tx.inventory.upsert({
          where: { variantId: item.variantId },
          create: {
            variantId: item.variantId,
            totalStock: 100,
            reservedStock: item.quantity,
            soldStock: 0,
          },
          update: {
            reservedStock: { increment: item.quantity },
          },
        });

        await tx.inventoryMovement.create({
          data: {
            inventoryId: inv.id,
            delta: -item.quantity,
            type: 'RESERVE',
            reason: `Order ${order.orderNumber} checkout started`,
            orderId: order.id,
          },
        });
      }

      // Step 13: Increment discount counter
      if (discountId) {
        await tx.discount.update({
          where: { id: discountId },
          data: { usageCount: { increment: 1 } },
        });
      }

      return order;
    });

    if (createdOrder) {
      try {
        const fullOrder = await prisma.order.findUnique({
          where: { id: createdOrder.id },
          include: { items: true, profile: true },
        });
        if (fullOrder) {
          await NotificationService.sendOrderConfirmationForOrder(fullOrder, true);
          if (Number(fullOrder.walletCredit) > 0 && fullOrder.profileId) {
            const wallet = await prisma.wallet.findUnique({ where: { profileId: fullOrder.profileId } });
            const remBalance = Number(wallet?.balance || 0);
            const custName = fullOrder.profile ? `${fullOrder.profile.firstName || ''} ${fullOrder.profile.lastName || ''}`.trim() : 'Collector';
            await NotificationService.sendWalletDebited(fullOrder.email, custName, Number(fullOrder.walletCredit), remBalance);
          }
        }
      } catch (err: any) {
        console.error(`❌ [POST-ORDER NOTIFICATION TASK ERROR] Order ${createdOrder.id}:`, err);
      }
    }

    console.log('====================================================================');
    console.log(`✅ [CHECKOUT COMPLETE] Returning Order ${createdOrder.orderNumber} to Client`);
    console.log('====================================================================\n');

    return {
      success: true,
      order: JSON.parse(JSON.stringify(createdOrder)),
    };
  } catch (error: any) {
    console.error('\n====================================================================');
    console.error('❌ [CHECKOUT RUNTIME EXCEPTION DETECTED]');
    console.error('====================================================================');
    console.error('File Name    : src/actions/order.actions.ts');
    console.error('Function Name: createOrder');
    console.error('Error Message:', error?.message || error);
    console.error('Stack Trace  :', error?.stack || 'N/A');
    console.error('====================================================================\n');

    return {
      success: false,
      error: error?.message || 'Checkout failed due to server error',
    };
  }
}

// ── CONFIRM ORDER (after payment) ────────────────────────────────────────────

export async function confirmOrder(
  orderId: string,
  razorpayPaymentId: string,
  razorpayOrderId: string
) {
  console.log(`\n[CONFIRM ORDER] Confirming payment for Order ID ${orderId}...`);

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });
      if (!order) throw new Error('Order not found');
      if (order.paymentStatus === 'PAID') return order;

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

      for (const item of order.items) {
        const inv = await tx.inventory.upsert({
          where: { variantId: item.variantId },
          create: {
            variantId: item.variantId,
            totalStock: 100,
            reservedStock: 0,
            soldStock: item.quantity,
          },
          update: {
            reservedStock: { decrement: item.quantity },
            soldStock: { increment: item.quantity },
          },
        });

        await tx.inventoryMovement.create({
          data: {
            inventoryId: inv.id,
            delta: -item.quantity,
            type: 'PURCHASE',
            reason: `Order ${order.orderNumber} payment confirmed`,
            orderId: order.id,
          },
        });
      }

      return updatedOrder;
    });

    try {
      await InvoiceService.updatePaymentStatus(orderId, 'PAID', razorpayPaymentId, 'RAZORPAY');
      const fullOrder = await prisma.order.findUnique({
        where: { id: orderId },
        include: { items: true, profile: true },
      });
      if (fullOrder) {
        await NotificationService.sendOrderConfirmationForOrder(fullOrder, true);
        await NotificationService.sendPaymentConfirmed(
          fullOrder.email,
          fullOrder.profile ? `${fullOrder.profile.firstName || ''} ${fullOrder.profile.lastName || ''}`.trim() : 'Collector',
          fullOrder.orderNumber,
          Number(fullOrder.total),
          razorpayPaymentId,
          fullOrder.id
        );
      }
    } catch (err: any) {
      console.error(`❌ [CONFIRM ORDER NOTIFICATION ERROR] Order ${orderId}:`, err);
    }

    try {
      revalidatePath('/admin/orders');
      revalidatePath('/profile');
    } catch {}

    console.log(`✅ [CONFIRM ORDER SUCCESS] Order ${orderId} marked PAID`);
    return {
      success: true,
      order: JSON.parse(JSON.stringify(updated)),
    };
  } catch (err: any) {
    console.error('❌ [CONFIRM ORDER ERROR]:', err);
    return {
      success: false,
      error: err?.message || 'Payment confirmation failed',
    };
  }
}

// ── CANCEL ORDER ─────────────────────────────────────────────────────────────

export async function cancelOrder(orderId: string, reason?: string) {
  const user = await getCurrentUser();

  const updatedOrder = await prisma.$transaction(async (tx) => {
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

  // Async dispatch order cancelled notification email
  (async () => {
    try {
      await NotificationService.sendOrderCancelled(updatedOrder, reason);
    } catch (err: any) {
      console.error('Order cancellation notification error:', err);
    }
  })();

  return updatedOrder;
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
    const fullOrder = await prisma.order.findUnique({
      where: { id: data.orderId },
      include: { items: true, profile: true },
    });
    if (fullOrder) {
      if (data.status === 'SHIPPED') {
        await NotificationService.sendOrderShipped(fullOrder, 'Express Courier', 'AWB-PENDING');
      } else if (data.status === 'DELIVERED') {
        await NotificationService.sendOrderDelivered(fullOrder);
      } else if (data.status === 'CANCELLED') {
        await NotificationService.sendOrderCancelled(fullOrder, data.adminNotes);
      }
    }
  } catch (err: any) {
    console.error(`❌ [UPDATE ORDER STATUS NOTIFICATION ERROR] Order ${data.orderId}:`, err);
  }

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

export async function requestInvoiceEmail(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) throw new Error('Order not found');

  const result = await NotificationService.sendInvoiceRequest(order);
  return { success: true, result };
}

export async function emailInvoice(orderId: string) {
  return requestInvoiceEmail(orderId);
}

