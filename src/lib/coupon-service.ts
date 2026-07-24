/**
 * CouponService — Promotion and Coupon eligibility engine
 */

import { prisma } from './prisma';

export interface CouponValidationResult {
  valid: boolean;
  error?: string;
  coupon?: {
    id: string;
    code: string;
    type: string;
    value: number;
    discountAmount: number;
    minimumOrderValue: number | null;
    maximumDiscount: number | null;
    endsAt: Date | null;
  };
}

export const CouponService = {
  /**
   * Find the highest-value active and eligible coupon for the current cart amount.
   */
  async getBestCoupon(subtotal: number, profileId?: string): Promise<any | null> {
    const now = new Date();
    
    // Fetch all active promotions
    const activeCoupons = await prisma.discount.findMany({
      where: {
        isActive: true,
        status: 'ACTIVE',
        AND: [
          {
            OR: [
              { startsAt: null },
              { startsAt: { lte: now } },
            ]
          },
          {
            OR: [
              { endsAt: null },
              { endsAt: { gte: now } },
            ]
          }
        ],
      },
    });

    let bestCoupon: any = null;
    let maxDiscountAmount = 0;

    for (const coupon of activeCoupons) {
      // 1. Check usage limit
      if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) continue;
      
      // 2. Check minimum order value
      if (coupon.minimumOrderValue && subtotal < Number(coupon.minimumOrderValue)) continue;

      // 3. Check customer-specific limit
      if (profileId && coupon.perCustomerLimit > 0) {
        const usages = await prisma.order.count({
          where: { discountId: coupon.id, profileId },
        });
        if (usages >= coupon.perCustomerLimit) continue;
      }

      // 4. Calculate hypothetical discount
      let discountAmount = 0;
      if (coupon.type === 'PERCENTAGE') {
        let calc = (subtotal * Number(coupon.value)) / 100;
        if (coupon.maximumDiscount) {
          calc = Math.min(calc, Number(coupon.maximumDiscount));
        }
        discountAmount = calc;
      } else if (coupon.type === 'FIXED_AMOUNT') {
        discountAmount = Math.min(Number(coupon.value), subtotal);
      }

      if (discountAmount > maxDiscountAmount) {
        maxDiscountAmount = discountAmount;
        bestCoupon = {
          ...coupon,
          discountAmount,
        };
      }
    }

    return bestCoupon;
  },

  /**
   * Validate a specific coupon code against a subtotal.
   */
  async validate(code: string, subtotal: number, profileId?: string): Promise<CouponValidationResult> {
    const coupon = await prisma.discount.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon || !coupon.isActive || coupon.status !== 'ACTIVE') {
      return { valid: false, error: 'Invalid discount code' };
    }

    const now = new Date();
    if (coupon.startsAt && coupon.startsAt > now) {
      return { valid: false, error: 'Discount is not yet active' };
    }
    if (coupon.endsAt && coupon.endsAt < now) {
      return { valid: false, error: 'Discount has expired' };
    }
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return { valid: false, error: 'Discount usage limit reached' };
    }
    if (coupon.minimumOrderValue && subtotal < Number(coupon.minimumOrderValue)) {
      return {
        valid: false,
        error: `Minimum order value of ₹${Number(coupon.minimumOrderValue).toLocaleString('en-IN')} required`,
      };
    }

    if (profileId && coupon.perCustomerLimit > 0) {
      const usages = await prisma.order.count({
        where: { discountId: coupon.id, profileId },
      });
      if (usages >= coupon.perCustomerLimit) {
        return { valid: false, error: 'You have already used this discount' };
      }
    }

    let discountAmount = 0;
    if (coupon.type === 'PERCENTAGE') {
      let calc = (subtotal * Number(coupon.value)) / 100;
      if (coupon.maximumDiscount) {
        calc = Math.min(calc, Number(coupon.maximumDiscount));
      }
      discountAmount = calc;
    } else if (coupon.type === 'FIXED_AMOUNT') {
      discountAmount = Math.min(Number(coupon.value), subtotal);
    }

    return {
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        type: coupon.type,
        value: Number(coupon.value),
        discountAmount,
        minimumOrderValue: coupon.minimumOrderValue ? Number(coupon.minimumOrderValue) : null,
        maximumDiscount: coupon.maximumDiscount ? Number(coupon.maximumDiscount) : null,
        endsAt: coupon.endsAt,
      },
    };
  }
};
