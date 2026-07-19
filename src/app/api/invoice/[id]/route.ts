import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { InvoiceService } from '@/lib/invoice';
import { createClient as createServerClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check auth
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Retrieve order
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        profile: true
      }
    });

    if (!order) {
      return new NextResponse('Order not found', { status: 404 });
    }

    // Check authorization: must be order owner or admin
    const isAdmin = user.email === 'dev@godsmove.com' || user.role === 'admin';
    const isOwner = order.profileId === user.id || order.email === user.email;

    if (!isAdmin && !isOwner) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    // Attempt to parse shippingAddress
    let shippingAddress: any = {};
    try {
      if (typeof order.shippingAddress === 'string') {
        shippingAddress = JSON.parse(order.shippingAddress);
      } else {
        shippingAddress = order.shippingAddress || {};
      }
    } catch (e) {
      console.error('Failed to parse shippingAddress:', e);
    }

    // Construct InvoiceData
    const invoiceData = {
      orderNumber: order.orderNumber,
      createdAt: order.createdAt,
      email: order.email,
      customerName: `${shippingAddress.firstName || ''} ${shippingAddress.lastName || ''}`.trim() || order.email,
      shippingAddress: {
        firstName: shippingAddress.firstName || '',
        lastName: shippingAddress.lastName || '',
        line1: shippingAddress.line1 || '',
        line2: shippingAddress.line2 || '',
        landmark: shippingAddress.landmark || '',
        city: shippingAddress.city || '',
        state: shippingAddress.state || '',
        pincode: shippingAddress.pincode || '',
        phone: shippingAddress.phone || '',
      },
      items: order.items.map((i) => ({
        productName: i.productName,
        size: i.size || 'OS',
        quantity: i.quantity,
        price: Number(i.price),
        total: Number(i.total),
      })),
      subtotal: Number(order.subtotal),
      discountAmount: Number(order.discountAmount),
      walletCredit: Number(order.walletCredit),
      shippingCost: Number(order.shippingCost),
      total: Number(order.total),
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
    };

    const html = InvoiceService.generateInvoiceHtml(invoiceData);

    // Auto-trigger window.print() and format for download
    const printableHtml = `
      ${html}
      <script>
        window.onload = function() {
          window.print();
        }
      </script>
    `;

    return new NextResponse(printableHtml, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="invoice_${order.orderNumber}.html"`
      }
    });
  } catch (err: any) {
    console.error('Failed to generate printable invoice:', err);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
