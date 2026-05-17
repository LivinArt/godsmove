'use server';

import { revalidatePath } from 'next/cache';
import { hasAdminBypass } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import {
  IssueWalletCreditSchema,
  type IssueWalletCreditInput,
} from '@/lib/validations/return';

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

  if (!profile || !['ADMIN', 'SUPPORT', 'OPERATIONS'].includes(profile.role)) {
    throw new Error('FORBIDDEN');
  }

  return user;
}

// ── GET WALLET ───────────────────────────────────────────────────────────────

export async function getMyWallet() {
  const user = await getCurrentUser();
  if (!user) throw new Error('UNAUTHORIZED');

  let wallet = await prisma.wallet.findUnique({
    where: { profileId: user.id },
    include: {
      transactions: {
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
    },
  });

  // Auto-create wallet if it doesn't exist
  if (!wallet) {
    wallet = await prisma.wallet.create({
      data: { profileId: user.id },
      include: { transactions: true },
    });
  }

  return wallet;
}

export async function getWalletByProfileId(profileId: string) {
  await requireAdmin();

  return prisma.wallet.findUnique({
    where: { profileId },
    include: {
      transactions: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });
}

// ── ISSUE CREDIT ─────────────────────────────────────────────────────────────

export async function issueWalletCredit(input: IssueWalletCreditInput) {
  await requireAdmin();
  const data = IssueWalletCreditSchema.parse(input);

  return prisma.$transaction(async (tx) => {
    // Get or create wallet
    let wallet = await tx.wallet.findUnique({
      where: { profileId: data.profileId },
    });
    if (!wallet) {
      wallet = await tx.wallet.create({
        data: { profileId: data.profileId },
      });
    }

    // Add credit to wallet
    const updated = await tx.wallet.update({
      where: { id: wallet.id },
      data: { balance: { increment: data.amount } },
    });

    // Record the transaction
    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        amount: data.amount,
        type: data.type as any,
        description: data.description,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        orderId: data.orderId ?? null,
        returnId: data.returnId ?? null,
      },
    });

    revalidatePath('/admin/customers');
    return updated;
  });
}

// ── EXPIRE PROMOTIONAL CREDITS ───────────────────────────────────────────────
// Call this from a cron job or scheduled function

export async function expireWalletCredits() {
  await requireAdmin();

  const expiredTxns = await prisma.walletTransaction.findMany({
    where: {
      type: 'CREDIT_PROMOTIONAL',
      isExpired: false,
      expiresAt: { lt: new Date() },
      amount: { gt: 0 },
    },
    include: { wallet: true },
  });

  for (const txn of expiredTxns) {
    await prisma.$transaction(async (tx) => {
      // Mark original credit as expired
      await tx.walletTransaction.update({
        where: { id: txn.id },
        data: { isExpired: true },
      });

      // Debit the expired amount
      await tx.wallet.update({
        where: { id: txn.walletId },
        data: { balance: { decrement: txn.amount } },
      });

      // Record expiry transaction
      await tx.walletTransaction.create({
        data: {
          walletId: txn.walletId,
          amount: -Number(txn.amount),
          type: 'DEBIT_EXPIRED',
          description: `Promotional credit expired`,
        },
      });
    });
  }

  return { expired: expiredTxns.length };
}

// ── VALIDATE DISCOUNT ───────────────────────────────────────────────────────────

export async function validateDiscount(
  code: string,
  orderAmount: number,
  profileId?: string
) {
  const discount = await prisma.discount.findUnique({
    where: { code: code.toUpperCase() },
  });

  if (!discount || !discount.isActive) {
    return { valid: false, error: 'Invalid discount code' };
  }

  const now = new Date();
  if (discount.endsAt && discount.endsAt < now) {
    return { valid: false, error: 'Discount has expired' };
  }
  if (discount.startsAt && discount.startsAt > now) {
    return { valid: false, error: 'Discount is not yet active' };
  }
  if (discount.usageLimit && discount.usageCount >= discount.usageLimit) {
    return { valid: false, error: 'Discount usage limit reached' };
  }
  if (discount.minimumOrderValue && orderAmount < Number(discount.minimumOrderValue)) {
    return {
      valid: false,
      error: `Minimum order of ₹${discount.minimumOrderValue} required`,
    };
  }

  if (profileId && discount.perCustomerLimit > 0) {
    const usages = await prisma.order.count({
      where: { discountId: discount.id, profileId },
    });
    if (usages >= discount.perCustomerLimit) {
      return { valid: false, error: 'You have already used this discount' };
    }
  }

  let discountAmount = 0;
  if (discount.type === 'PERCENTAGE') {
    let calc = (orderAmount * Number(discount.value)) / 100;
    if (discount.maximumDiscount) {
      calc = Math.min(calc, Number(discount.maximumDiscount));
    }
    discountAmount = calc;
  } else if (discount.type === 'FIXED_AMOUNT') {
    discountAmount = Math.min(Number(discount.value), orderAmount);
  } else if (discount.type === 'FREE_SHIPPING') {
    // Free shipping doesn't deduct from subtotal usually, or it zeroes shipping cost
  }

  return {
    valid: true,
    discount: {
      id: discount.id,
      code: discount.code,
      type: discount.type,
      value: discount.value,
      discountAmount,
    },
  };
}
