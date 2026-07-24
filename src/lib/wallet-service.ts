/**
 * WalletService — Enterprise Wallet and Credits Ledger Service
 */

import { prisma } from './prisma';
import { revalidatePath } from 'next/cache';

export interface CreditAdjustmentInput {
  profileId: string;
  amount: number;
  type: 'CREDIT_RETURN' | 'CREDIT_PROMOTIONAL' | 'CREDIT_REFERRAL' | 'CREDIT_ADJUSTMENT' | 'DEBIT_ORDER' | 'DEBIT_EXPIRED';
  description: string;
  source?: string | null;      // Welcome, Birthday, etc.
  createdBy?: string | null;   // Creator admin profile ID or name
  expiresAt?: Date | null;     // Optional expiry datetime
  orderId?: string | null;
  returnId?: string | null;
}

export const WalletService = {
  /**
   * Adjust customer wallet balance and write an audit-compliant transaction ledger record.
   */
  async adjustBalance(tx: any, input: CreditAdjustmentInput) {
    let wallet = await tx.wallet.findUnique({
      where: { profileId: input.profileId },
    });

    if (!wallet) {
      wallet = await tx.wallet.create({
        data: { profileId: input.profileId, balance: 0 },
      });
    }

    const updated = await tx.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: { increment: input.amount },
      },
    });

    const txn = await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        amount: input.amount,
        type: input.type,
        description: input.description,
        source: input.source ?? null,
        createdBy: input.createdBy ?? null,
        expiresAt: input.expiresAt ?? null,
        orderId: input.orderId ?? null,
        returnId: input.returnId ?? null,
      },
    });

    return { wallet: updated, transaction: txn };
  },

  /**
   * Adjust balance directly in a standard or transaction-isolated query.
   */
  async adjustBalanceDirect(input: CreditAdjustmentInput) {
    return prisma.$transaction(async (tx) => {
      const res = await this.adjustBalance(tx, input);
      revalidatePath(`/admin/customers/${input.profileId}`);
      revalidatePath('/admin/customers');
      return res;
    });
  },

  /**
   * Process expired promotional credits.
   */
  async expirePromoCredits() {
    const expiredTxns = await prisma.walletTransaction.findMany({
      where: {
        type: 'CREDIT_PROMOTIONAL',
        isExpired: false,
        expiresAt: { lt: new Date() },
        amount: { gt: 0 },
      },
      include: { wallet: true },
    });

    let expiredCount = 0;

    for (const txn of expiredTxns) {
      await prisma.$transaction(async (tx) => {
        // Mark original credit transaction as expired
        await tx.walletTransaction.update({
          where: { id: txn.id },
          data: { isExpired: true },
        });

        // Debit the wallet balance
        await this.adjustBalance(tx, {
          profileId: txn.wallet.profileId,
          amount: -Number(txn.amount),
          type: 'DEBIT_EXPIRED',
          description: `Promotional credit expired (Ref: ${txn.id})`,
          createdBy: 'SYSTEM_CRON',
        });
      });
      expiredCount++;
    }

    return expiredCount;
  }
};
