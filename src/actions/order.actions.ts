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
import { resolveProductImages } from '@/lib/image-resolver';
import { WalletService } from '@/lib/wallet-service';
import { getCodSettings } from '@/actions/cod.actions';

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

      const rawSubtotal = pricingItems.reduce((acc, it) => acc + it.price * it.quantity, 0);

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

        if (discount.minimumOrderValue && rawSubtotal < Number(discount.minimumOrderValue)) {
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
          let calc = (rawSubtotal * Number(discount.value)) / 100;
          if (discount.maximumDiscount) {
            calc = Math.min(calc, Number(discount.maximumDiscount));
          }
          couponDiscountVal = calc;
        } else if (discount.type === 'FIXED_AMOUNT') {
          couponDiscountVal = Math.min(Number(discount.value), rawSubtotal);
        }

        discountId = discount.id;
      }

      // Step 8: Fetch COD Settings & Calculate final prices
      console.log('[CHECKOUT STEP 8] Fetching COD Settings & Running PricingEngine calculation...');
      const codConfig = await getCodSettings();

      if (data.paymentMethod === 'COD' && !codConfig.isEnabled) {
        throw new Error('Cash on Delivery is currently disabled by store administration.');
      }

      let calculatedCodFee = 0;
      if (data.paymentMethod === 'COD' && codConfig.isEnabled) {
        const subtotalAfterCouponTemp = Math.max(0, rawSubtotal - couponDiscountVal);
        const shippingTemp = subtotalAfterCouponTemp >= 1999 || rawSubtotal === 0 ? 0 : 149;
        if (codConfig.chargeType === 'PERCENTAGE') {
          calculatedCodFee = Math.round((subtotalAfterCouponTemp + shippingTemp) * (codConfig.chargeValue / 100));
        } else {
          calculatedCodFee = Math.round(codConfig.chargeValue);
        }
      }

      const shippingState = data.shippingAddress.state || 'Haryana';
      const pricing = PricingEngine.calculate({
        items: pricingItems,
        couponCode: data.couponCode || null,
        couponDiscount: couponDiscountVal,
        walletAmountToUse: data.walletAmountToUse,
        shippingState,
        codFee: calculatedCodFee,
      });

      // Flow 6 Validation: Partial Wallet + COD is strictly forbidden
      if (pricing.walletCredit > 0 && pricing.finalPayable > 0 && (data.paymentMethod === 'COD' || input.paymentMethod === 'COD')) {
        throw new Error('Cash on Delivery is not supported for partial wallet payments. Please pay the remaining amount via Secure Online Payment.');
      }

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
          codFee: pricing.codFee,
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
          const custName = fullOrder.profile ? `${fullOrder.profile.firstName || ''} ${fullOrder.profile.lastName || ''}`.trim() : 'Collector';

          // Flow 4: Full Wallet Payment (Zero Payable)
          if (fullOrder.paymentMethod === 'WALLET' || (Number(fullOrder.total) === 0 && fullOrder.paymentStatus === 'PAID')) {
            // Sequence Requirement: 1. Payment Successful -> 2. Order Confirmation -> 3. Wallet Debit Notification
            await NotificationService.sendPaymentConfirmed(
              fullOrder.email,
              custName,
              fullOrder.orderNumber,
              Number(fullOrder.total),
              `WALLET_${fullOrder.orderNumber}`,
              fullOrder.id
            );
            await NotificationService.sendOrderConfirmationForOrder(fullOrder, true);
            if (Number(fullOrder.walletCredit) > 0 && fullOrder.profileId) {
              const wallet = await prisma.wallet.findUnique({ where: { profileId: fullOrder.profileId } });
              const remBalance = Number(wallet?.balance || 0);
              await NotificationService.sendWalletDebited(fullOrder.email, custName, Number(fullOrder.walletCredit), remBalance);
            }
          } else if (fullOrder.paymentMethod === 'COD') {
            // Flow 3: Cash On Delivery (Order Confirmation at creation time)
            await NotificationService.sendOrderConfirmationForOrder(fullOrder, true);
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
        const custName = fullOrder.profile ? `${fullOrder.profile.firstName || ''} ${fullOrder.profile.lastName || ''}`.trim() : 'Collector';

        // Flow 1 / Flow 5 Sequence Requirement:
        // 1. Payment Successful Email FIRST
        await NotificationService.sendPaymentConfirmed(
          fullOrder.email,
          custName,
          fullOrder.orderNumber,
          Number(fullOrder.total),
          razorpayPaymentId,
          fullOrder.id
        );
        // 2. Order Confirmation Email SECOND
        await NotificationService.sendOrderConfirmationForOrder(fullOrder, true);
        // 3. Wallet Debit Email THIRD (if applicable)
        if (Number(fullOrder.walletCredit) > 0 && fullOrder.profileId) {
          const wallet = await prisma.wallet.findUnique({ where: { profileId: fullOrder.profileId } });
          const remBalance = Number(wallet?.balance || 0);
          await NotificationService.sendWalletDebited(fullOrder.email, custName, Number(fullOrder.walletCredit), remBalance);
        }
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
    take: 20,
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

export async function notifyPaymentFailed(email: string, customerName?: string, reason?: string) {
  try {
    const result = await NotificationService.sendPaymentFailed(
      email,
      customerName || 'Valued Collector',
      undefined,
      reason || 'Payment transaction was declined or interrupted.'
    );
    return { success: true, result };
  } catch (err: any) {
    console.error('❌ [NOTIFY PAYMENT FAILED ERROR]:', err);
    return { success: false, error: err?.message || 'Failed to dispatch payment failed notice' };
  }
}

/**
 * Phase A Session Interceptor: Resolves active pending checkout session
 * for authenticated users or via explicit token orderId.
 */
export async function getActiveCheckoutSession(tokenOrderId?: string) {
  try {
    // Run background cleanup for expired sessions
    cleanupExpiredCheckoutSessions().catch(() => {});

    const user = await getCurrentUser().catch(() => null);

    // Check explicit order ID token if provided
    if (tokenOrderId) {
      const order = await prisma.order.findUnique({
        where: { id: tokenOrderId },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          paymentStatus: true,
          createdAt: true,
          total: true,
          profileId: true,
        }
      });

      if (order && order.status === 'PENDING' && order.paymentStatus !== 'PAID') {
        const ageMs = Date.now() - new Date(order.createdAt).getTime();
        if (ageMs < 30 * 60 * 1000) { // 30 mins window
          return {
            hasActiveSession: true,
            orderId: order.id,
            orderNumber: order.orderNumber,
            total: Number(order.total),
            status: order.status,
            paymentStatus: order.paymentStatus,
          };
        }
      }
    }

    // Fallback for authenticated user: find latest PENDING order created <30m ago
    if (user?.id) {
      const recentOrder = await prisma.order.findFirst({
        where: {
          profileId: user.id,
          status: 'PENDING',
          paymentStatus: { not: 'PAID' },
          createdAt: { gte: new Date(Date.now() - 30 * 60 * 1000) }
        },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          paymentStatus: true,
          createdAt: true,
          total: true,
        }
      });

      if (recentOrder) {
        return {
          hasActiveSession: true,
          orderId: recentOrder.id,
          orderNumber: recentOrder.orderNumber,
          total: Number(recentOrder.total),
          status: recentOrder.status,
          paymentStatus: recentOrder.paymentStatus,
        };
      }
    }

    return { hasActiveSession: false };
  } catch (error) {
    console.error('Failed to resolve active checkout session:', error);
    return { hasActiveSession: false };
  }
}

/**
 * Phase B Server Action: Resolves full order status and recovery details for an order ID.
 */
export async function getOrderPaymentStatus(orderId: string) {
  try {
    let order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: true,
              }
            }
          }
        }
      }
    });

    if (!order) {
      return { success: false, error: 'Order not found' };
    }

    // Active Gateway Resolution: If order is still PENDING in DB, query Razorpay REST API out-of-band
    let gatewayState = 'created';
    if (order.status === 'PENDING' && order.paymentStatus !== 'PAID' && order.razorpayOrderId) {
      try {
        const { PaymentService } = await import('@/lib/payments/payment-service');
        const gatewayCheck = await PaymentService.verifyPaymentStatusOnGateway(order.razorpayOrderId);
        gatewayState = gatewayCheck.status || 'created';
        if (gatewayCheck.isCaptured && gatewayCheck.paymentId) {
          console.log(`[ACTIVE_GATEWAY_RECOVERY] Found captured payment ${gatewayCheck.paymentId} for Order ${order.id}. Auto-confirming...`);
          await confirmOrder(order.id, gatewayCheck.paymentId, order.razorpayOrderId);
          
          // Re-query order state after confirmation
          order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { items: { include: { variant: { include: { product: true } } } } }
          }) || order;
          gatewayState = 'captured';
        }
      } catch (gatewayErr) {
        console.error('Active gateway verification error during recovery:', gatewayErr);
      }
    }

    const ageMs = Date.now() - new Date(order.createdAt).getTime();
    const isExpired = order.status === 'PENDING' && ageMs > 30 * 60 * 1000;

    return {
      success: true,
      gatewayState: order.paymentStatus === 'PAID' ? 'captured' : gatewayState,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        razorpayOrderId: order.razorpayOrderId,
        total: Number(order.total),
        subtotal: Number(order.subtotal),
        discountAmount: Number(order.discountAmount),
        walletCredit: Number(order.walletCredit),
        shippingAddress: order.shippingAddress as any,
        createdAt: order.createdAt,
        isExpired,
        items: order.items.map((item) => ({
          id: item.id,
          variantId: item.variantId,
          productId: item.variant.productId,
          productName: item.variant.product.name,
          size: item.variant.size,
          color: item.variant.color,
          quantity: item.quantity,
          price: Number(item.price),
          image: resolveProductImages(item.variant.product).frontImage || '',
          channel: item.variant.product.channel,
        }))
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to fetch order status' };
  }
}

/**
 * Phase B Server Action: Cancels a pending order, restores reserved stock,
 * and returns item details to re-populate the cart.
 */
export async function cancelAndRestoreOrder(orderId: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            variant: {
              include: { product: true }
            }
          }
        }
      }
    });

    if (!order) return { success: false, error: 'Order not found' };

    // Active check before cancelling: ensure payment was NOT captured on gateway
    if (order.status === 'PENDING' && order.razorpayOrderId) {
      try {
        const { PaymentService } = await import('@/lib/payments/payment-service');
        const gatewayCheck = await PaymentService.verifyPaymentStatusOnGateway(order.razorpayOrderId);
        if (gatewayCheck.isCaptured && gatewayCheck.paymentId) {
          console.log(`[CANCEL_GUARD] Payment ${gatewayCheck.paymentId} was captured on Razorpay! Auto-confirming instead of cancelling.`);
          await confirmOrder(order.id, gatewayCheck.paymentId, order.razorpayOrderId);
          return { success: true, restored: false, alreadyPaid: true };
        }
      } catch (err) {}
    }

    if (order.status === 'PENDING') {
      await prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: orderId },
          data: { status: 'CANCELLED', paymentStatus: 'FAILED' }
        });

        for (const item of order.items) {
          const inv = await tx.inventory.findFirst({ where: { variantId: item.variantId } });
          if (inv) {
            await tx.inventory.update({
              where: { id: inv.id },
              data: { reservedStock: { decrement: item.quantity } }
            });
          }
        }
      });
    }

    const itemsToRestore = order.items.map((item) => ({
      product: item.variant.product,
      size: item.variant.size,
      quantity: item.quantity,
    }));

    return { success: true, items: itemsToRestore };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to restore order' };
  }
}

/**
 * Enterprise Background Reconciliation Worker:
 * Scans all PENDING orders, queries Razorpay REST API out-of-band,
 * and auto-confirms any captured payments without browser involvement.
 */
export async function reconcilePendingPayments() {
  try {
    const pendingOrders = await prisma.order.findMany({
      where: {
        status: 'PENDING',
        paymentStatus: { not: 'PAID' },
        razorpayOrderId: { not: null },
      },
      select: { id: true, razorpayOrderId: true, orderNumber: true },
      take: 100,
    });

    if (pendingOrders.length === 0) {
      return { success: true, reconciledCount: 0 };
    }

    const { PaymentService } = await import('@/lib/payments/payment-service');
    let reconciledCount = 0;

    for (const order of pendingOrders) {
      if (!order.razorpayOrderId) continue;
      const gatewayCheck = await PaymentService.verifyPaymentStatusOnGateway(order.razorpayOrderId);
      if (gatewayCheck.isCaptured && gatewayCheck.paymentId) {
        console.log(`[BACKGROUND_RECONCILER] Auto-confirming captured Order ${order.orderNumber} (Payment ID: ${gatewayCheck.paymentId})`);
        await confirmOrder(order.id, gatewayCheck.paymentId, order.razorpayOrderId);
        reconciledCount++;
      }
    }

    console.log(`[BACKGROUND_RECONCILER] Reconciliation completed. Reconciled ${reconciledCount} orders.`);
    return { success: true, reconciledCount };
  } catch (error: any) {
    console.error('Failed to reconcile pending payments:', error);
    return { success: false, error: error.message || 'Reconciliation error' };
  }
}

/**
 * Phase C Server Action: Automatically cancels abandoned checkout sessions (>30m old)
 * after verifying payment was NOT captured on Razorpay.
 */
export async function cleanupExpiredCheckoutSessions() {
  try {
    // Run active background reconciliation worker first
    await reconcilePendingPayments().catch(() => {});

    const expirationThreshold = new Date(Date.now() - 30 * 60 * 1000);

    const expiredOrders = await prisma.order.findMany({
      where: {
        status: 'PENDING',
        paymentStatus: { not: 'PAID' },
        createdAt: { lt: expirationThreshold },
      },
      include: { items: true },
      take: 50,
    });

    if (expiredOrders.length === 0) {
      return { success: true, cleanedCount: 0 };
    }

    let cleanedCount = 0;

    for (const expiredOrder of expiredOrders) {
      await prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: expiredOrder.id },
          data: { status: 'CANCELLED', paymentStatus: 'FAILED' },
        });

        for (const item of expiredOrder.items) {
          const inv = await tx.inventory.findFirst({ where: { variantId: item.variantId } });
          if (inv && inv.reservedStock > 0) {
            await tx.inventory.update({
              where: { id: inv.id },
              data: {
                reservedStock: { decrement: Math.min(inv.reservedStock, item.quantity) }
              }
            });
          }
        }
      });
      cleanedCount++;
    }

    console.log(`[CLEANUP_EXPIRED_SESSIONS] Cleaned up ${cleanedCount} expired checkout sessions.`);
    return { success: true, cleanedCount };
  } catch (error: any) {
    console.error('Failed to cleanup expired checkout sessions:', error);
    return { success: false, error: error.message || 'Cleanup error' };
  }
}

/**
 * Phase C Verification Helper: Verifies HMAC-SHA256 Razorpay payment signature.
 */
export async function verifyPaymentSignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
): Promise<boolean> {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return true; // Graceful fallback in local dev without secret

  try {
    const crypto = await import('crypto');
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(`${razorpayOrderId}|${razorpayPaymentId}`);
    const generatedSignature = hmac.digest('hex');
    return generatedSignature === razorpaySignature;
  } catch (err) {
    console.error('Signature verification failed:', err);
    return false;
  }
}

/**
 * GODSMOVE V6 Self-Healing Commerce: Live Inventory Validation Server Action
 * Validates inventory availability and stock levels before checkout/payment.
 */
export async function validateLiveInventoryAction(items: Array<{ productId: string; variantId?: string; size: string; quantity: number }>) {
  try {
    const validatedItems = await Promise.all(
      items.map(async (item) => {
        // Look up variant by variantId or productId + size
        let variant = null;
        if (item.variantId) {
          variant = await prisma.productVariant.findUnique({
            where: { id: item.variantId },
            include: { product: true, inventory: true },
          });
        }

        if (!variant && item.productId) {
          variant = await prisma.productVariant.findFirst({
            where: { productId: item.productId, size: item.size },
            include: { product: true, inventory: true },
          });
        }

        if (!variant) {
          return {
            ...item,
            isAvailable: false,
            isSoldOut: true,
            availableStock: 0,
            price: 0,
          };
        }

        const totalStock = variant.inventory?.totalStock ?? 100;
        const reservedStock = variant.inventory?.reservedStock ?? 0;
        const netAvailable = Math.max(0, totalStock - reservedStock);

        const isAvailable = netAvailable > 0;
        const isSoldOut = netAvailable <= 0;
        const isLowStock = isAvailable && netAvailable <= 5;

        return {
          productId: variant.productId,
          variantId: variant.id,
          size: variant.size,
          color: variant.color,
          quantity: item.quantity,
          price: Number(variant.price || 0),
          name: variant.product.name,
          images: resolveProductImages(variant.product),
          isAvailable,
          isSoldOut,
          isLowStock,
          availableStock: netAvailable,
        };
      })
    );

    const hasSoldOut = validatedItems.some((i) => i.isSoldOut);
    const allSoldOut = validatedItems.every((i) => i.isSoldOut);

    return {
      success: true,
      hasSoldOut,
      allSoldOut,
      items: validatedItems,
    };
  } catch (error: any) {
    console.error('Failed to validate live inventory:', error);
    return { success: false, error: error.message || 'Inventory validation failed' };
  }
}

/**
 * GODSMOVE V6 Reorder Engine: Rebuilds checkout state from past FAILED or CANCELLED orders
 * recalculating pricing, discounts, stock, and wallet applicability using today's rules.
 */
export async function reorderOrderAction(orderId: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: {
                  include: {
                    variants: {
                      include: { inventory: true }
                    }
                  }
                },
                inventory: true,
              }
            }
          }
        }
      }
    });

    if (!order) {
      return { success: false, error: 'Order not found' };
    }

    const reorderedItems: any[] = [];
    let availableCount = 0;

    for (const item of order.items) {
      const variant = item.variant;
      const product = variant?.product;

      if (!variant || !product) {
        continue;
      }

      const totalStock = variant.inventory?.totalStock ?? 100;
      const reservedStock = variant.inventory?.reservedStock ?? 0;
      const netAvailable = Math.max(0, totalStock - reservedStock);

      const isAvailable = netAvailable > 0;
      if (isAvailable) availableCount++;

      reorderedItems.push({
        product: {
          id: product.id,
          name: product.name,
          slug: product.slug,
          price: Number(variant.price || 0),
          images: resolveProductImages(product),
          variants: product.variants.map((v) => ({
            id: v.id,
            size: v.size,
            color: v.color,
            stock: Math.max(0, (v.inventory?.totalStock ?? 100) - (v.inventory?.reservedStock ?? 0)),
          })),
        },
        size: variant.size,
        quantity: item.quantity,
        isSoldOut: !isAvailable,
        availableStock: netAvailable,
      });
    }

    return {
      success: true,
      orderNumber: order.orderNumber,
      totalOriginalItems: order.items.length,
      availableCount,
      allSoldOut: availableCount === 0,
      items: reorderedItems,
    };
  } catch (error: any) {
    console.error('Failed to execute reorder:', error);
    return { success: false, error: error.message || 'Reorder failed' };
  }
}





