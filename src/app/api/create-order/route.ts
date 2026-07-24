import { NextResponse } from 'next/server';
import { EXCLUSIVE_CART_TOAST_MESSAGE, isExclusiveChannel } from '@/lib/cart-rules';
import { prisma } from '@/lib/prisma';

// NOTE: Razorpay integration requires RAZORPAY_KEY_SECRET env variable
// This is scaffolded for production use - currently returns mock order

export async function POST(req: Request) {
  try {
    const { amount, items, orderId } = await req.json();

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    if (items && Array.isArray(items)) {
      const exclusiveQtyByProduct = new Map<string, number>();

      for (const item of items) {
        if (!item.productId) continue;

        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: { channel: true },
        });

        if (!isExclusiveChannel(product?.channel)) continue;

        const qty = Number(item.quantity) || 0;
        if (qty > 1) {
          return NextResponse.json({ error: EXCLUSIVE_CART_TOAST_MESSAGE }, { status: 400 });
        }

        exclusiveQtyByProduct.set(
          item.productId,
          (exclusiveQtyByProduct.get(item.productId) ?? 0) + qty
        );
      }

      for (const totalQty of exclusiveQtyByProduct.values()) {
        if (totalQty > 1) {
          return NextResponse.json({ error: EXCLUSIVE_CART_TOAST_MESSAGE }, { status: 400 });
        }
      }
    }

    // In production, uncomment and use:
    // const Razorpay = (await import('razorpay')).default;
    // const razorpay = new Razorpay({
    //   key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
    //   key_secret: process.env.RAZORPAY_KEY_SECRET!,
    // });
    //
    // const order = await razorpay.orders.create({
    //   amount: Math.round(amount * 100), // Convert to paise
    //   currency: 'INR',
    //   receipt: `receipt_${Date.now()}`,
    //   notes: { orderId },
    // });
    //
    // return NextResponse.json(order);

    // Mock order for development
    const mockOrder = {
      id: `order_${Date.now()}`,
      entity: 'order',
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      status: 'created',
      notes: { orderId },
    };

    return NextResponse.json(mockOrder);
  } catch (error) {
    console.error('Order creation failed:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}
