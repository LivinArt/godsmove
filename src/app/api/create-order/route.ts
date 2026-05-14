import { NextResponse } from 'next/server';

// NOTE: Razorpay integration requires RAZORPAY_KEY_SECRET env variable
// This is scaffolded for production use - currently returns mock order

export async function POST(req: Request) {
  try {
    const { amount } = await req.json();

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    // In production, uncomment and use:
    // const Razorpay = (await import('razorpay')).default;
    // const razorpay = new Razorpay({
    //   key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
    //   key_secret: process.env.RAZORPAY_KEY_SECRET!,
    // });
    //
    // const order = await razorpay.orders.create({
    //   amount: amount * 100, // Convert to paise
    //   currency: 'INR',
    //   receipt: `receipt_${Date.now()}`,
    // });
    //
    // return NextResponse.json(order);

    // Mock order for development
    const mockOrder = {
      id: `order_${Date.now()}`,
      entity: 'order',
      amount: amount * 100,
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      status: 'created',
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
