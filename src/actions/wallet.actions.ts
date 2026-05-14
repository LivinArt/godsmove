'use server';

import { revalidatePath } from 'next/cache';
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

// ── VALIDATE COUPON ───────────────────────────────────────────────────────────

export async function validateCoupon(
  code: string,
  orderAmount: number,
  profileId?: string
) {
  const coupon = await prisma.coupon.findUnique({
    where: { code: code.toUpperCase() },
  });

  if (!coupon || !coupon.isActive) {
    return { valid: false, error: 'Invalid coupon code' };
  }

  const now = new Date();
  if (coupon.expiresAt && coupon.expiresAt < now) {
    return { valid: false, error: 'Coupon has expired' };
  }
  if (coupon.startsAt && coupon.startsAt > now) {
    return { valid: false, error: 'Coupon is not yet active' };
  }
  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
    return { valid: false, error: 'Coupon usage limit reached' };
  }
  if (coupon.minOrderAmount && orderAmount < Number(coupon.minOrderAmount)) {
    return {
      valid: false,
      error: `Minimum order of ₹${coupon.minOrderAmount} required`,
    };
  }

  if (profileId && coupon.perUserLimit > 0) {
    const usages = await prisma.couponUsage.count({
      where: { couponId: coupon.id, profileId },
    });
    if (usages >= coupon.perUserLimit) {
      return { valid: false, error: 'You have already used this coupon' };
    }
  }

  let discountAmount = 0;
  if (coupon.type === 'PERCENTAGE') {
    discountAmount = (orderAmount * Number(coupon.value)) / 100;
  } else if (coupon.type === 'FLAT_AMOUNT') {
    discountAmount = Math.min(Number(coupon.value), orderAmount);
  }

  return {
    valid: true,
    coupon: {
      id: coupon.id,
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      discountAmount,
    },
  };
}
