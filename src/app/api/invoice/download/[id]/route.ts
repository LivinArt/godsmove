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

    const invoiceResult = await InvoiceService.generateAndStoreInvoice(order);

    let pdfBuffer: Buffer;
    if (fs.existsSync(invoiceResult.pdfPath)) {
      pdfBuffer = fs.readFileSync(invoiceResult.pdfPath);
    } else {
      pdfBuffer = invoiceResult.pdfBuffer;
    }

    return new NextResponse(pdfBuffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="GODSMOVE_Tax_Invoice_${order.orderNumber}.pdf"`,
      },
    });
  } catch (err: any) {
    console.error('Failed to download stored invoice PDF:', err);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
