import { NextRequest, NextResponse } from 'next/server';
import { NotificationService } from '@/notifications/notification.service';

export async function POST(req: NextRequest) {
  // Security check: restrict test endpoint in production unless explicitly authorized
  if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_EMAIL_TEST) {
    return NextResponse.json(
      { error: 'Test email endpoint is disabled in production' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const targetEmail = body.to || 'support@godsmove.in';
    const type = body.type || 'order_confirmation';

    console.log(`[TEST EMAIL ROUTE] Triggering ${type} email test to ${targetEmail}...`);

    let result;
    const recipient = {
      name: body.customerName || 'Test Collector',
      email: targetEmail,
      phone: '+919876543210',
    };

    if (type === 'order_confirmation') {
      result = await NotificationService.notifyOrderConfirmation(recipient, {
        customerName: recipient.name,
        orderNumber: 'GM-TEST-8801',
        orderDate: new Date().toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
        items: [
          {
            id: 'item_1',
            title: 'GODSMOVE Oversized Archival Heavyweight Hoodie',
            size: 'L',
            color: 'Washed Black',
            quantity: 1,
            price: 3499,
            imageUrl: 'https://godsmove.in/images/hero-1.jpg',
          },
          {
            id: 'item_2',
            title: 'Drop-Shoulder Core Statement Tee',
            size: 'M',
            color: 'Off-White',
            quantity: 1,
            price: 1999,
            imageUrl: 'https://godsmove.in/images/hero-2.jpg',
          },
        ],
        subtotal: 5498,
        shipping: 0,
        walletDiscount: 500,
        couponDiscount: 0,
        total: 4998,
        shippingAddress: {
          name: recipient.name,
          line1: '101 Privilege Bay, Bandra Reclamation',
          line2: 'Bandra West',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400050',
          phone: '+91 98765 43210',
        },
        trackOrderUrl: 'https://godsmove.in/profile',
        continueShoppingUrl: 'https://godsmove.in/drops',
      });
    } else if (type === 'wallet_credit') {
      result = await NotificationService.notifyWalletCredit(recipient, {
        customerName: recipient.name,
        amount: 1000,
        newBalance: 2500,
        reason: 'Exclusive Member Privileges Loyalty Reward',
        walletUrl: 'https://godsmove.in/profile',
      });
    } else {
      result = await NotificationService.notifyOrderConfirmation(recipient, {
        customerName: recipient.name,
        orderNumber: 'GM-TEST-8801',
        orderDate: '26 July 2026',
        items: [
          {
            id: 'item_1',
            title: 'GODSMOVE Heavyweight Hoodie',
            size: 'L',
            color: 'Black',
            quantity: 1,
            price: 2999,
          },
        ],
        subtotal: 2999,
        shipping: 0,
        total: 2999,
        shippingAddress: {
          name: recipient.name,
          line1: 'Test Address Line 1',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400050',
          phone: '+91 98765 43210',
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Test email dispatched to ${targetEmail}`,
      result,
    });
  } catch (err: any) {
    console.error('❌ [TEST EMAIL ERROR]:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to send test email' },
      { status: 500 }
    );
  }
}
