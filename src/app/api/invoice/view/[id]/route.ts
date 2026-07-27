import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import { prisma } from '@/lib/prisma';
import { InvoiceService } from '@/lib/invoice';
import { createClient as createServerClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Retrieve order by ID or orderNumber
    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id }, { orderNumber: id }],
      },
      include: { items: true, profile: true },
    });

    if (!order) {
      return new NextResponse('Order not found', { status: 404 });
    }

    if (user) {
      const isOwner = order.profileId === user.id || order.email === user.email;
      const profile = await prisma.profile.findUnique({
        where: { id: user.id },
        select: { role: true },
      });
      const isAdmin = profile && ['ADMIN', 'OPERATIONS', 'SUPPORT'].includes(profile.role);
      if (!isOwner && !isAdmin) {
        return new NextResponse('Forbidden', { status: 403 });
      }
    }

    // Get or generate invoice from secure private storage
    const invoiceResult = await InvoiceService.generateAndStoreInvoice(order);

    let htmlContent = '';
    if (fs.existsSync(invoiceResult.htmlPath)) {
      htmlContent = fs.readFileSync(invoiceResult.htmlPath, 'utf8');
    } else {
      htmlContent = invoiceResult.htmlContent;
    }

    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="invoice_${order.orderNumber}.html"`,
      },
    });
  } catch (err: any) {
    console.error('Failed to view stored invoice:', err);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
