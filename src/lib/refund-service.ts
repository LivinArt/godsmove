import { prisma } from '@/lib/prisma';
import { razorpayService } from './razorpay-service';

class RefundService {
  /**
   * Refund order amount back to user internal wallet
   */
  async refundToWallet(profileId: string, amount: number, orderId: string, reason: string) {
    return await prisma.$transaction(async (tx) => {
      // 1. Fetch wallet
      const wallet = await tx.wallet.findUnique({
        where: { profileId },
      });
      if (!wallet) throw new Error('Wallet not found for this profile');

      // 2. Increment balance
      const nextBalance = Number(wallet.balance) + amount;
      await tx.wallet.update({
        where: { profileId },
        data: { balance: nextBalance },
      });

      // 3. Create wallet transaction log
      const txn = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount,
          type: 'CREDIT_RETURN',
          description: `Refund for Order #${orderId}. Reason: ${reason}`,
        },
      });

      // 4. Record audit in order adminNotes
      const order = await tx.order.findUnique({ where: { id: orderId } });
      const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
      const newNote = `[Refund ${timestamp}] Wallet credit issued: ₹${amount}. Reason: ${reason}`;
      const nextAdminNotes = order?.adminNotes 
        ? `${order.adminNotes}\n${newNote}` 
        : newNote;

      await tx.order.update({
        where: { id: orderId },
        data: { adminNotes: nextAdminNotes },
      });

      return txn;
    });
  }

  /**
   * Refund order amount back to original Razorpay source
   */
  async refundToOriginalMethod(paymentId: string, amount: number, orderId: string, reason: string) {
    // 1. Raise Razorpay refund
    const rzpRefund = await razorpayService.createRefund(paymentId, amount, {
      orderId,
      reason,
    });

    // 2. Append audit log in order adminNotes
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const newNote = `[Refund ${timestamp}] Source refund processing via Razorpay (Amt: ₹${amount}). ID: ${rzpRefund.id}. Status: ${rzpRefund.status}. Reason: ${reason}`;
    const nextAdminNotes = order?.adminNotes 
      ? `${order.adminNotes}\n${newNote}` 
      : newNote;

    await prisma.order.update({
      where: { id: orderId },
      data: { 
        adminNotes: nextAdminNotes,
      },
    });

    return rzpRefund;
  }

  /**
   * General refund routing orchestrator
   */
  async processRefund(
    orderId: string,
    target: 'WALLET' | 'ORIGINAL',
    reason: string,
    customAmount?: number
  ) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) throw new Error('Order not found');
    if (order.paymentStatus !== 'PAID' && order.paymentStatus !== 'PARTIALLY_REFUNDED') {
      throw new Error('Order is not in a refundable state');
    }

    // Parse existing refund logs from admin notes if present
    const matches = order.adminNotes?.match(/Refund \d{4}-\d{2}-\d{2}[^\]]*\] [^:]+: ₹(\d+(\.\d+)?)/g) || [];
    const totalRefundedYet = matches.reduce((acc, m) => {
      const amtMatch = m.match(/₹(\d+(\.\d+)?)/);
      return acc + (amtMatch ? parseFloat(amtMatch[1]) : 0);
    }, 0);

    const maximumRefundable = Number(order.total) - totalRefundedYet;
    const refundAmount = customAmount !== undefined ? customAmount : maximumRefundable;

    if (refundAmount <= 0) throw new Error('No remaining amount left to refund');
    if (refundAmount > maximumRefundable) throw new Error('Refund amount exceeds remaining order balance');

    let result;
    if (target === 'WALLET') {
      if (!order.profileId) {
        throw new Error('Cannot refund guest order to wallet.');
      }
      result = await this.refundToWallet(order.profileId, refundAmount, orderId, reason);
    } else {
      if (!order.razorpayPaymentId) {
        throw new Error('Cannot refund to original source; no gateway payment reference exists on order.');
      }
      result = await this.refundToOriginalMethod(order.razorpayPaymentId, refundAmount, orderId, reason);
    }

    // Update order status if fully or partially refunded
    const nextStatus = refundAmount === maximumRefundable ? 'REFUNDED' : 'PARTIALLY_REFUNDED';
    await prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus: nextStatus as any },
    });

    return result;
  }
}

export const refundService = new RefundService();
