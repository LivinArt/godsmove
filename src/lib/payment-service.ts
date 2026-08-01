import { prisma } from '@/lib/prisma';
import { razorpayService } from './razorpay-service';
import { CouponService } from './coupon-service';

export interface CheckoutInput {
  profileId: string;
  items: {
    productId: string;
    variantSku: string;
    quantity: number;
  }[];
  couponCode?: string;
  useWalletBalance?: boolean;
}

class PaymentService {
  /**
   * Calculate checkout balances, taxes, wallet offsets, and coupons discount deductions
   */
  async calculateCheckoutTotals(input: CheckoutInput) {
    const { profileId, items, couponCode, useWalletBalance } = input;

    let subtotal = 0;
    let gstAmount = 0;
    
    // Resolve variant details
    const resolvedItems = [];
    for (const item of items) {
      const variant = await prisma.productVariant.findUnique({
        where: { sku: item.variantSku },
        include: { product: true },
      });
      if (!variant || !variant.isActive) {
        throw new Error(`Variant SKU ${item.variantSku} is no longer active.`);
      }

      const itemPrice = Number(variant.price);
      const itemSubtotal = itemPrice * item.quantity;
      subtotal += itemSubtotal;

      // Compute GST splits per product rate
      const gstRate = variant.product.gstPercentage || 12.0;
      const baseNet = itemSubtotal / (1 + gstRate / 100);
      const itemGst = itemSubtotal - baseNet;
      gstAmount += itemGst;

      resolvedItems.push({
        variantId: variant.id,
        sku: variant.sku,
        name: variant.product.name,
        size: variant.size,
        color: variant.color,
        quantity: item.quantity,
        price: itemPrice,
        subtotal: itemSubtotal,
        gstRate,
        gstAmount: itemGst,
      });
    }

    // Process coupon code
    let discountAmount = 0;
    if (couponCode) {
      const discount = await CouponService.validate(couponCode, subtotal, profileId);
      if (discount.valid && discount.coupon) {
        discountAmount = discount.coupon.discountAmount;
      }
    }

    const priceAfterDiscount = Math.max(0, subtotal - discountAmount);

    // Process wallet offset
    let walletUsedAmount = 0;
    if (useWalletBalance) {
      const wallet = await prisma.wallet.findUnique({ where: { profileId } });
      if (wallet && Number(wallet.balance) > 0) {
        const availableBalance = Number(wallet.balance);
        walletUsedAmount = Math.min(priceAfterDiscount, availableBalance);
      }
    }

    const finalAmountPayable = Math.max(0, priceAfterDiscount - walletUsedAmount);

    return {
      resolvedItems,
      subtotal,
      discountAmount,
      gstAmount,
      walletUsedAmount,
      finalAmountPayable,
    };
  }

  /**
   * Initialize a payment session/intent
   */
  async createCheckoutIntent(input: CheckoutInput, shippingAddressId: string) {
    // 1. Fetch shipping address record first
    const addressRecord = await prisma.address.findUnique({
      where: { id: shippingAddressId },
    });
    if (!addressRecord) throw new Error('Shipping address not found');

    const totals = await this.calculateCheckoutTotals(input);
    const { profileId, useWalletBalance, couponCode } = input;

    // Create checkout order record in PENDING state
    const order = await prisma.$transaction(async (tx) => {
      // 1. Double check stock availability
      for (const item of totals.resolvedItems) {
        const inv = await tx.inventory.findUnique({ where: { variantId: item.variantId } });
        if (!inv || inv.totalStock < item.quantity) {
          throw new Error(`Insufficient stock for ${item.name} (${item.size})`);
        }
      }

      // 2. Subtract stock
      for (const item of totals.resolvedItems) {
        await tx.inventory.update({
          where: { variantId: item.variantId },
          data: { totalStock: { decrement: item.quantity } },
        });

        // Log movement
        const inv = await tx.inventory.findUnique({ where: { variantId: item.variantId } });
        if (inv) {
          await tx.inventoryMovement.create({
            data: {
              inventoryId: inv.id,
              delta: -item.quantity,
              type: 'RESERVE',
              reason: `Checkout Order Draft`,
            },
          });
        }
      }

      // Generate order number
      const orderNumber = `GM-${Date.now().toString().substring(4)}-${Math.floor(100 + Math.random() * 900)}`;

      // Fetch user profile email
      const profile = await tx.profile.findUnique({ where: { id: profileId } });
      const email = profile?.email || 'guest@godsmove.com';

      // Find discount link if coupon code is active
      let discountId = null;
      if (couponCode) {
        const discRecord = await tx.discount.findUnique({ where: { code: couponCode.toUpperCase() } });
        if (discRecord) {
          discountId = discRecord.id;
        }
      }

      // 3. Create Order record matching schema design
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          profileId,
          email,
          total: totals.finalAmountPayable,
          subtotal: totals.subtotal,
          discountAmount: totals.discountAmount,
          walletCredit: totals.walletUsedAmount,
          taxableAmount: totals.subtotal - totals.discountAmount - totals.gstAmount,
          gstAmount: totals.gstAmount,
          shippingCost: 0,
          paymentStatus: totals.finalAmountPayable === 0 ? 'PAID' : 'UNPAID',
          status: 'PENDING',
          paymentMethod: totals.finalAmountPayable === 0 ? 'WALLET' : (totals.walletUsedAmount > 0 ? 'MIXED' : 'RAZORPAY'),
          discountId,
          shippingAddress: {
            firstName: addressRecord.firstName,
            lastName: addressRecord.lastName,
            line1: addressRecord.line1,
            line2: addressRecord.line2,
            landmark: addressRecord.landmark,
            city: addressRecord.city,
            state: addressRecord.state,
            pincode: addressRecord.pincode,
            phone: addressRecord.phone,
          } as any,
          items: {
            create: totals.resolvedItems.map(item => ({
              variantId: item.variantId,
              productName: item.name,
              variantSku: item.sku,
              size: item.size,
              color: item.color,
              price: item.price,
              quantity: item.quantity,
              total: item.subtotal,
            })),
          },
        },
      });

      // 4. Subtract Wallet Balance if payment is full/partial wallet
      if (totals.walletUsedAmount > 0) {
        const wallet = await tx.wallet.findUnique({ where: { profileId } });
        if (wallet) {
          await tx.wallet.update({
            where: { profileId },
            data: { balance: { decrement: totals.walletUsedAmount } },
          });

          await tx.walletTransaction.create({
            data: {
              walletId: wallet.id,
              amount: -totals.walletUsedAmount,
              type: 'DEBIT_ORDER',
              description: `Checkout offset for Order #${newOrder.id}`,
            },
          });
        }
      }

      return newOrder;
    });

    // If fully paid by wallet/coupons, skip Razorpay Order creation
    if (totals.finalAmountPayable === 0) {
      return {
        orderId: order.id,
        isCompleted: true,
        rzpOrder: null,
      };
    }

    // Create Razorpay Order
    const rzpOrder = await razorpayService.createRazorpayOrder(totals.finalAmountPayable, order.id);

    // Save gateway references to DB
    await prisma.order.update({
      where: { id: order.id },
      data: {
        razorpayOrderId: rzpOrder.id,
      },
    });

    return {
      orderId: order.id,
      isCompleted: false,
      rzpOrder,
    };
  }

  /**
   * Verify and confirm payment execution
   */
  async verifyAndConfirmPayment(
    orderId: string,
    gatewayPaymentId: string,
    gatewaySignature: string
  ) {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new Error('Order not found');

    if (!order.razorpayOrderId) {
      throw new Error('Order does not have a gateway order transaction ID mapped.');
    }

    // Verify signatures
    const isValid = razorpayService.verifyPaymentSignature(
      order.razorpayOrderId,
      gatewayPaymentId,
      gatewaySignature
    );

    if (!isValid) {
      throw new Error('Payment signature verification failed.');
    }

    // Delegate 100% of payment confirmation to PaymentStateEngine
    const { PaymentStateEngine } = await import('@/lib/payments/payment-state-engine');
    await PaymentStateEngine.executeTransition({
      transition: 'CONFIRM_PAYMENT',
      orderId,
      razorpayPaymentId: gatewayPaymentId,
      razorpayOrderId: order.razorpayOrderId,
      triggerActor: 'CALLBACK',
      reason: 'Signature verified callback',
    });

    return { success: true };
  }
}

export const paymentService = new PaymentService();
