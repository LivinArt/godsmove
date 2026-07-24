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

    // Retrieve Care Request
    const care = await prisma.careRequest.findUnique({
      where: { id },
      include: {
        orderItem: true,
        profile: true
      }
    });

    if (!care) {
      return new NextResponse('Care Request not found', { status: 404 });
    }

    // Check authorization: must be request owner or admin
    const isAdmin = user.email === 'dev@godsmove.com' || user.role === 'admin';
    const isOwner = care.profileId === user.id || care.profile.email === user.email;

    if (!isAdmin && !isOwner) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const subtotal = Number(care.pickupCharge) + Number(care.repairCharge) + Number(care.returnCharge);
    const total = Number(care.totalCharge);

    // Parse additional notes for GST info if present
    let gstRate = 18;
    if (care.additionalNotes) {
      try {
        const parsed = JSON.parse(care.additionalNotes);
        if (parsed && typeof parsed.gstPercentage === 'number') {
          gstRate = parsed.gstPercentage;
        }
      } catch (e) {
        // legacy or simple text notes
      }
    }

    // Construct InvoiceData mapping
    const invoiceData = {
      orderNumber: `CARE-${care.id.substring(0, 8).toUpperCase()}`,
      createdAt: care.createdAt,
      email: care.profile.email,
      customerName: `${care.profile.firstName || ''} ${care.profile.lastName || ''}`.trim() || care.profile.email,
      shippingAddress: {
        firstName: care.profile.firstName || 'Valued',
        lastName: care.profile.lastName || 'Collector',
        line1: 'Atelier Reverse Pickup Schedule',
        line2: '',
        landmark: '',
        city: '',
        state: '',
        pincode: '',
        phone: care.profile.phone || '',
      },
      items: [
        {
          productCode: care.productCode,
          productName: `Garment Restoration & Atelier Service [${care.category}]`,
          size: care.orderItem.size || 'OS',
          quantity: 1,
          price: subtotal,
          total: subtotal,
        }
      ],
      subtotal: subtotal,
      discountAmount: 0,
      walletCredit: 0,
      shippingCost: 0,
      total: total, // Grand total inclusive of GST
      paymentMethod: care.razorpayOrderId ? 'Razorpay Gateway' : 'GODSMOVE Ledger Credits',
      paymentStatus: care.paymentStatus,
    };

    const html = InvoiceService.generateInvoiceHtml(invoiceData);

    // Append auto print script
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
        'Content-Disposition': `inline; filename="invoice_care_${care.id.substring(0, 8)}.html"`
      }
    });
  } catch (err: any) {
    console.error('Failed to generate care printable invoice:', err);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
