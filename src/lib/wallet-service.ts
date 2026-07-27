import { prisma } from './prisma';
import { revalidatePath } from 'next/cache';
import { NotificationService } from '@/notifications/notification.service';

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
   * Adjust balance directly and automatically dispatch transactional email notification.
   * Audits EVERY wallet entry point (Admin, Manual, Refund, Promo, Referral, Checkout Debit).
   */
  async adjustBalanceDirect(input: CreditAdjustmentInput) {
    const result = await prisma.$transaction(async (tx) => {
      return this.adjustBalance(tx, input);
    });

    // Priority 7: Automatic Wallet Notification Dispatch for all wallet balance changes
    (async () => {
      try {
        const profile = await prisma.profile.findUnique({
          where: { id: input.profileId },
          select: { email: true, firstName: true, lastName: true },
        });

        if (profile && profile.email) {
          const fullName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'Collector';
          const newBalance = Number(result.wallet.balance);

          if (input.amount > 0) {
            console.log(`[WALLET NOTIFICATION] Sending WALLET_CREDITED email (+₹${input.amount}) to ${profile.email}`);
            await NotificationService.sendWalletCredited(profile.email, fullName, input.amount, newBalance);
          } else if (input.amount < 0) {
            console.log(`[WALLET NOTIFICATION] Sending WALLET_DEBITED email (-₹${Math.abs(input.amount)}) to ${profile.email}`);
            await NotificationService.sendWalletDebited(profile.email, fullName, Math.abs(input.amount), newBalance);
          }
        }
      } catch (err: any) {
        console.error(`❌ [WALLET NOTIFICATION ERROR] Profile ${input.profileId}:`, err);
      }
    })();

    try {
      revalidatePath(`/admin/customers/${input.profileId}`);
      revalidatePath('/admin/customers');
      revalidatePath('/profile');
    } catch {}

    return result;
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
      await this.adjustBalanceDirect({
        profileId: txn.wallet.profileId,
        amount: -Number(txn.amount),
        type: 'DEBIT_EXPIRED',
        description: `Promotional credit expired (Ref: ${txn.id})`,
        createdBy: 'SYSTEM_CRON',
      });

      await prisma.walletTransaction.update({
        where: { id: txn.id },
        data: { isExpired: true },
      });

      expiredCount++;
    }

    return expiredCount;
  }
};
