import { NextResponse } from 'next/server';
import { PaymentService } from '@/lib/payments/payment-service';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    // TODO (Phase 2): Validate customer authentication session
    // const session = await getServerSession();
    // if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid or missing JSON payload in request body.' },
        { status: 400 }
      );
    }

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Request body must be a valid JSON object.' },
        { status: 400 }
      );
    }

    const { amount, currency, dbOrderId } = body;

    // Server-side Validation: Amount
    if (amount === undefined || amount === null || typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid or missing amount. Amount must be a positive number.' },
        { status: 400 }
      );
    }

    // Server-side Validation: Currency
    const formattedCurrency = typeof currency === 'string' ? currency.toUpperCase().trim() : 'INR';
    if (formattedCurrency !== 'INR') {
      return NextResponse.json(
        { error: 'Only INR currency is currently supported.' },
        { status: 400 }
      );
    }

    // Smart Razorpay Order Reuse Strategy:
    // Check if the DB Order already has a valid active Razorpay Order ID (< 24 hours old)
    if (dbOrderId && typeof dbOrderId === 'string') {
      const existingOrder = await prisma.order.findUnique({
        where: { id: dbOrderId },
        select: { id: true, razorpayOrderId: true, createdAt: true, status: true, paymentStatus: true }
      });

      if (existingOrder && existingOrder.razorpayOrderId) {
        const ageMs = Date.now() - new Date(existingOrder.createdAt).getTime();
        const isFresh = ageMs < 24 * 60 * 60 * 1000; // 24 hours
        if (isFresh && existingOrder.status === 'PENDING' && existingOrder.paymentStatus !== 'PAID') {
          console.log(`[SMART_ORDER_REUSE] Reusing active Razorpay Order ID ${existingOrder.razorpayOrderId} for DB Order ${existingOrder.id}`);
          const amountInPaise = Math.round(amount * 100);
          return NextResponse.json({
            orderId: existingOrder.razorpayOrderId,
            amount: amountInPaise,
            currency: formattedCurrency,
            key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
            reused: true,
          });
        }
      }
    }

    // Create a new Razorpay Order via PaymentService abstraction
    const result = await PaymentService.createOrder({
      amount,
      currency: formattedCurrency,
      orderId: dbOrderId,
    });

    // Link new Razorpay Order ID to DB Order if dbOrderId was provided
    if (dbOrderId && typeof dbOrderId === 'string') {
      await prisma.order.update({
        where: { id: dbOrderId },
        data: { razorpayOrderId: result.orderId }
      }).catch((err) => {
        console.error('Failed to link new razorpayOrderId to DB order:', err);
      });
    }

    // Return ONLY orderId, amount (subunits), currency, and public key ID. NEVER expose Secret Key.
    return NextResponse.json(
      {
        orderId: result.orderId,
        amount: result.amount,
        currency: result.currency,
        key: result.key,
        reused: false,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('❌ [API /payments/create-order ERROR]:', error);
    return NextResponse.json(
      { error: error?.message || 'An error occurred while creating the payment order.' },
      { status: 500 }
    );
  }
}
