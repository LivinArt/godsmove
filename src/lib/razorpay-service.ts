import Razorpay from 'razorpay';
import crypto from 'crypto';

class RazorpayService {
  private razorpay: Razorpay | null = null;

  constructor() {
    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (keyId && keySecret && keyId !== 'rzp_test_placeholder') {
      this.razorpay = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      });
    }
  }

  /**
   * Create order in Razorpay
   * @param amount Amount in INR (will be converted to paisa internally)
   * @param receipt Receipt identifier (usually internal Order ID)
   */
  async createRazorpayOrder(amount: number, receipt: string) {
    if (!this.razorpay) {
      console.warn('[RazorpayService] Razorpay key parameters not configured. Returning mock order.');
      return {
        id: `mock_rzp_order_${Math.random().toString(36).substring(7)}`,
        amount: amount * 100,
        currency: 'INR',
        receipt,
        status: 'created',
      };
    }

    try {
      const order = await this.razorpay.orders.create({
        amount: Math.round(amount * 100), // convert to paisa
        currency: 'INR',
        receipt,
        notes: {
          platform: 'GODSMOVE',
        },
      });
      return order;
    } catch (error) {
      console.error('[RazorpayService] Failed to create order:', error);
      throw new Error('Razorpay order initialization failed');
    }
  }

  /**
   * Verify Razorpay Payment Signature
   */
  verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
    const keySecret = process.env.RAZORPAY_KEY_SECRET || 'your_razorpay_secret_here';
    
    try {
      const generatedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      return generatedSignature === signature;
    } catch (error) {
      console.error('[RazorpayService] Signature verification exception:', error);
      return false;
    }
  }

  /**
   * Verify Webhook Signature
   */
  verifyWebhookSignature(rawBody: string, signature: string): boolean {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.warn('[RazorpayService] Webhook secret not defined. Skipping verification.');
      return true; // fail-open in local test sandboxes if secret is missing
    }

    try {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');

      return expectedSignature === signature;
    } catch (error) {
      console.error('[RazorpayService] Webhook validation failed:', error);
      return false;
    }
  }

  /**
   * Raise refund on a transaction
   * @param paymentId Razorpay payment reference
   * @param amount Amount in INR
   */
  async createRefund(paymentId: string, amount?: number, notes?: any) {
    if (!this.razorpay) {
      console.warn('[RazorpayService] Keys missing. Mocking successful refund.');
      return {
        id: `mock_rfnd_${Math.random().toString(36).substring(7)}`,
        payment_id: paymentId,
        amount: amount ? amount * 100 : 0,
        status: 'processed',
      };
    }

    try {
      const refund = await this.razorpay.payments.refund(paymentId, {
        ...(amount && { amount: Math.round(amount * 100) }), // in paisa
        notes: notes || {},
      });
      return refund;
    } catch (error) {
      console.error('[RazorpayService] Refund execution failed:', error);
      throw new Error('Razorpay refund execution failed');
    }
  }
}

export const razorpayService = new RazorpayService();
