import 'server-only';
import { getRazorpayClient, getRazorpayCredentials } from './razorpay';
import crypto from 'crypto';

export interface CreatePaymentOrderInput {
  amount: number;
  currency?: string; // Default: 'INR'
  orderId?: string; // Internal PostgreSQL DB Order ID
  orderNumber?: string;
}

export interface CreatePaymentOrderResult {
  orderId: string;
  amount: number; // Subunit (paisa)
  currency: string;
  key: string; // Razorpay Public Key ID
}

export interface PaymentVerificationInput {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export interface PaymentVerificationResult {
  success: boolean;
  message: string;
}

export interface GatewayPaymentCheckResult {
  isCaptured: boolean;
  paymentId?: string;
  status?: string;
}

/**
 * Enterprise Payment Service Abstraction Layer.
 * Decouples payment gateway operations from Application routes and business logic.
 * Manages server receipts, notes injection, and active gateway reconciliation.
 */
export class PaymentService {
  static getGatewayName(): string {
    return 'Razorpay';
  }

  private static generateServerReceipt(): string {
    const timestamp = Math.floor(Date.now() / 1000);
    const randomSuffix = crypto.randomBytes(3).toString('hex');
    return `GM_${timestamp}_${randomSuffix}`;
  }

  private static resolveOrderAmount(inputAmount: number): number {
    if (typeof inputAmount !== 'number' || isNaN(inputAmount) || inputAmount <= 0) {
      throw new Error('Invalid payment amount. Amount must be a positive number.');
    }
    return Math.round(inputAmount * 100);
  }

  /**
   * Creates a payment order on Razorpay with robust server notes correlation.
   */
  static async createOrder(input: CreatePaymentOrderInput): Promise<CreatePaymentOrderResult> {
    const { amount: rawAmount, currency = 'INR', orderId, orderNumber } = input;

    const amountInSubunits = this.resolveOrderAmount(rawAmount);

    const validCurrency = (currency || 'INR').toUpperCase().trim();
    if (validCurrency !== 'INR') {
      throw new Error(`Unsupported currency: ${validCurrency}. Currently only INR is supported.`);
    }

    const serverReceipt = orderNumber || this.generateServerReceipt();

    // Robust Metadata Notes Injection: Ensures Webhooks and Gateway queries can ALWAYS correlate
    const serverNotes: Record<string, string> = {
      platform: 'GODSMOVE_ECOM',
      environment: process.env.NODE_ENV || 'development',
      generatedAt: new Date().toISOString(),
    };

    if (orderId) {
      serverNotes.orderId = orderId;
      serverNotes.internalOrderId = orderId;
    }
    if (orderNumber) {
      serverNotes.orderNumber = orderNumber;
    }

    try {
      const razorpay = getRazorpayClient();
      const { keyId } = getRazorpayCredentials();

      const orderOptions = {
        amount: amountInSubunits,
        currency: validCurrency,
        receipt: serverReceipt,
        notes: serverNotes,
      };

      const razorpayOrder = await razorpay.orders.create(orderOptions);

      return {
        orderId: razorpayOrder.id,
        amount: typeof razorpayOrder.amount === 'number' ? razorpayOrder.amount : Number(razorpayOrder.amount),
        currency: razorpayOrder.currency,
        key: keyId,
      };
    } catch (error: any) {
      console.error('[PaymentService.createOrder] Razorpay API Execution Error:', error);
      throw new Error('Payment gateway order creation failed. Please try again later.');
    }
  }

  /**
   * Active Gateway Reconciliation: Fetches payments linked to a Razorpay Order ID
   * directly from Razorpay REST API (/v1/orders/{id}/payments).
   */
  static async verifyPaymentStatusOnGateway(razorpayOrderId: string): Promise<GatewayPaymentCheckResult> {
    if (!razorpayOrderId) return { isCaptured: false };

    try {
      const razorpay = getRazorpayClient();
      const paymentsResponse = await razorpay.orders.fetchPayments(razorpayOrderId);
      
      if (!paymentsResponse || !Array.isArray((paymentsResponse as any).items)) {
        return { isCaptured: false };
      }

      const items = (paymentsResponse as any).items;
      
      // Search for any payment item with status 'captured' or 'authorized'
      const capturedPayment = items.find(
        (p: any) => p.status === 'captured' || p.status === 'authorized'
      );

      if (capturedPayment) {
        return {
          isCaptured: true,
          paymentId: capturedPayment.id,
          status: capturedPayment.status,
        };
      }

      return { isCaptured: false, status: items[0]?.status || 'created' };
    } catch (error: any) {
      console.error(`[PaymentService.verifyPaymentStatusOnGateway] Failed for ${razorpayOrderId}:`, error?.message || error);
      return { isCaptured: false };
    }
  }

  /**
   * Verifies HMAC-SHA256 Razorpay payment signature.
   */
  static async verifyPayment(input: PaymentVerificationInput): Promise<PaymentVerificationResult> {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = input;
    const secret = process.env.RAZORPAY_KEY_SECRET;

    if (!secret) {
      return { success: true, message: 'Dev environment: secret unconfigured' };
    }

    try {
      const hmac = crypto.createHmac('sha256', secret);
      hmac.update(`${razorpayOrderId}|${razorpayPaymentId}`);
      const generatedSignature = hmac.digest('hex');

      if (generatedSignature === razorpaySignature) {
        return { success: true, message: 'Signature verified successfully.' };
      }
      return { success: false, message: 'Invalid payment signature.' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Signature verification error.' };
    }
  }
}
