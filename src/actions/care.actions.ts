'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { NotificationService } from '@/lib/notification';

// Assert user is logged in
async function getAuthedUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    if (process.env.NODE_ENV === 'development') {
      const firstCustomer = await prisma.profile.findFirst({
        where: { role: 'CUSTOMER' }
      });
      if (firstCustomer) {
        return { id: firstCustomer.id, email: firstCustomer.email } as any;
      }
      return { id: 'dev-bypass', email: 'guest@godsmove.com' } as any;
    }
    throw new Error('UNAUTHORIZED');
  }
  return user;
}

// Assert user is Admin
async function requireAdmin() {
  const user = await getAuthedUser();
  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { role: true },
  });
  const adminRoles = ['ADMIN', 'CONTENT_EDITOR', 'OPERATIONS', 'SUPPORT', 'MARKETING'];
  if (!profile || !adminRoles.includes(profile.role)) {
    throw new Error('FORBIDDEN');
  }
  return user;
}

// 1. Get user's purchased products to select from
export async function getPurchasedProducts() {
  const user = await getAuthedUser();
  
  // Find all orders for this user
  const orders = await prisma.order.findMany({
    where: {
      profileId: user.id
    },
    include: {
      items: true
    }
  });

  // Flatten and return items with a derived product code
  const products = orders.flatMap(order => 
    order.items.map(item => ({
      orderId: order.id,
      orderNumber: order.orderNumber,
      orderItemId: item.id,
      productName: item.productName,
      size: item.size,
      price: Number(item.price),
      purchaseDate: order.createdAt,
      productCode: `GM-ART-${item.id.toUpperCase()}`
    }))
  );

  return products;
}

// 2. Verify product code
export async function verifyProductCode(code: string) {
  await getAuthedUser(); // must be logged in

  const cleanedCode = code.trim().toUpperCase();
  if (!cleanedCode.startsWith('GM-ART-')) {
    throw new Error('Invalid format. Code must start with GM-ART-');
  }

  const itemId = cleanedCode.replace('GM-ART-', '').toLowerCase();

  // Query order item matching this ID
  const item = await prisma.orderItem.findUnique({
    where: { id: itemId },
    include: {
      order: {
        include: {
          profile: true
        }
      }
    }
  });

  if (!item) {
    throw new Error('Product serial code not found in registry.');
  }

  return {
    orderId: item.order.id,
    orderNumber: item.order.orderNumber,
    orderItemId: item.id,
    productName: item.productName,
    size: item.size,
    price: Number(item.price),
    purchaseDate: item.order.createdAt,
    productCode: cleanedCode,
    owner: item.order.profile ? `${item.order.profile.firstName || ''} ${item.order.profile.lastName || ''}`.trim() : item.order.email,
    status: item.order.status
  };
}

// 3. Submit care request
export async function submitCareRequest(data: {
  orderItemId: string;
  productCode: string;
  category: string;
  description: string;
}) {
  const user = await getAuthedUser();

  const item = await prisma.orderItem.findUnique({
    where: { id: data.orderItemId }
  });
  const productName = item ? item.productName : 'GODSMOVE Garment';

  const request = await prisma.careRequest.create({
    data: {
      profileId: user.id,
      orderItemId: data.orderItemId,
      productCode: data.productCode,
      category: data.category,
      description: data.description,
      status: 'SUBMITTED'
    }
  });

  try {
    await NotificationService.sendCareRequestSubmitted(
      user.email || '',
      request.id,
      productName,
      data.category
    );
  } catch (err) {
    console.error('Failed to send care submitted email:', err);
  }

  revalidatePath('/profile');
  revalidatePath('/admin/care');
  return JSON.parse(JSON.stringify(request));
}

// 4. Get active & completed care requests for customer
export async function getCustomerCareRequests() {
  const user = await getAuthedUser();

  const requests = await prisma.careRequest.findMany({
    where: { profileId: user.id },
    include: {
      orderItem: true
    },
    orderBy: { createdAt: 'desc' }
  });

  return requests.map(r => ({
    id: r.id,
    productCode: r.productCode,
    productName: r.orderItem?.productName || 'GODSMOVE Garment',
    imageUrl: r.orderItem?.imageUrl || '/images/placeholder.svg',
    category: r.category,
    description: r.description,
    status: r.status,
    pickupCharge: Number(r.pickupCharge || 0),
    repairCharge: Number(r.repairCharge || 0),
    returnCharge: Number(r.returnCharge || 0),
    totalCharge: Number(r.totalCharge || 0),
    paymentStatus: r.paymentStatus,
    rejectReason: r.rejectReason,
    additionalNotes: r.additionalNotes,
    createdAt: r.createdAt
  }));
}

// 5. Admin: Get all care requests
export async function getAdminCareRequests() {
  await requireAdmin();

  const requests = await prisma.careRequest.findMany({
    include: {
      orderItem: true,
      profile: true
    },
    orderBy: { createdAt: 'desc' }
  });

  return requests.map(r => {
    const customerName = r.profile 
      ? `${r.profile.firstName || ''} ${r.profile.lastName || ''}`.trim() || r.profile.email 
      : 'Customer';
    const customerEmail = r.profile?.email || 'guest@godsmove.com';
    const productName = r.orderItem?.productName || 'GODSMOVE Garment';
    const imageUrl = r.orderItem?.imageUrl || '/images/placeholder.svg';

    return {
      id: r.id,
      customerEmail,
      customerName,
      productName,
      productCode: r.productCode,
      imageUrl,
      category: r.category,
      description: r.description,
      status: r.status,
      pickupCharge: Number(r.pickupCharge || 0),
      repairCharge: Number(r.repairCharge || 0),
      returnCharge: Number(r.returnCharge || 0),
      totalCharge: Number(r.totalCharge || 0),
      paymentStatus: r.paymentStatus,
      rejectReason: r.rejectReason,
      additionalNotes: r.additionalNotes,
      createdAt: r.createdAt
    };
  });
}

// 6. Admin: Approve/Reject care request
export async function reviewCareRequest(data: {
  id: string;
  action: 'APPROVE' | 'REJECT';
  rejectReason?: string;
  pickupCharge?: number;
  repairCharge?: number;
  returnCharge?: number;
  additionalNotes?: string;
}) {
  await requireAdmin();

  const existing = await prisma.careRequest.findUnique({
    where: { id: data.id },
    include: { profile: true, orderItem: true }
  });
  if (!existing) throw new Error('Care request not found');

  if (data.action === 'REJECT') {
    const request = await prisma.careRequest.update({
      where: { id: data.id },
      data: {
        status: 'REJECTED',
        rejectReason: data.rejectReason || 'No reason provided.'
      }
    });

    try {
      await NotificationService.sendCareRequestRejected(
        existing.profile.email,
        request.id,
        data.rejectReason || 'No reason provided.'
      );
    } catch (err) {
      console.error('Failed to send rejection email:', err);
    }

    revalidatePath('/admin/care');
    return JSON.parse(JSON.stringify(request));
  } else {
    const pickup = Number(data.pickupCharge || 0);
    const repair = Number(data.repairCharge || 0);
    const retLog = Number(data.returnCharge || 0);

    const gstPercent = await getCareGstPercentage();
    const subtotal = pickup + repair + retLog;
    const gstAmt = (subtotal * gstPercent) / 100;
    const total = subtotal + gstAmt;

    const notesJson = {
      adminNotes: data.additionalNotes || '',
      subtotal,
      gstPercentage: gstPercent,
      gstAmount: gstAmt,
      logistics: null
    };

    const status = total > 0 ? 'AWAITING_PAYMENT' : 'APPROVED';
    const request = await prisma.careRequest.update({
      where: { id: data.id },
      data: {
        pickupCharge: pickup,
        repairCharge: repair,
        returnCharge: retLog,
        totalCharge: total,
        paymentStatus: total > 0 ? 'PENDING' : 'PAID',
        status: status,
        additionalNotes: JSON.stringify(notesJson)
      }
    });

    try {
      if (total > 0) {
        await NotificationService.sendCareRequestApproved(
          existing.profile.email,
          request.id,
          `₹${total.toLocaleString('en-IN')}`
        );
      } else {
        await NotificationService.sendCareStatusUpdate(
          existing.profile.email,
          request.id,
          'APPROVED',
          'Your restoration request has been approved without any service charges.'
        );
      }
    } catch (err) {
      console.error('Failed to send approval email:', err);
    }

    revalidatePath('/admin/care');
    return JSON.parse(JSON.stringify(request));
  }
}

// 7. Admin: Update care timeline stage
export async function updateCareStage(id: string, stage: string) {
  await requireAdmin();

  const request = await prisma.careRequest.update({
    where: { id },
    data: { status: stage },
    include: { profile: true }
  });

  try {
    await NotificationService.sendCareStatusUpdate(
      request.profile.email,
      request.id,
      stage,
      `Your garment service stage is now: ${stage.replace(/_/g, ' ')}`
    );
  } catch (err) {
    console.error('Failed to send status update email:', err);
  }

  revalidatePath('/admin/care');
  return JSON.parse(JSON.stringify(request));
}

// 8. Customer: Pay for approved care request via credits
export async function payCareRequestWithCredits(id: string) {
  const user = await getAuthedUser();

  const request = await prisma.careRequest.findUnique({
    where: { id },
    include: { orderItem: true }
  });

  if (!request || request.profileId !== user.id) {
    throw new Error('Care request not found.');
  }

  if (request.status !== 'AWAITING_PAYMENT' || request.paymentStatus === 'PAID') {
    throw new Error('Request is not awaiting payment.');
  }

  const wallet = await prisma.wallet.findUnique({
    where: { profileId: user.id }
  });

  if (!wallet || Number(wallet.balance) < Number(request.totalCharge)) {
    throw new Error('Insufficient wallet balance to cover care charges.');
  }

  const totalCost = Number(request.totalCharge);

  // Perform debit transaction
  await prisma.$transaction([
    prisma.wallet.update({
      where: { profileId: user.id },
      data: { balance: { decrement: totalCost } }
    }),
    prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        amount: -totalCost,
        type: 'DEBIT_ORDER', // Debit for service
        description: `GODSMOVE Care service payment for request ${id.substring(0,8).toUpperCase()}`
      }
    }),
    prisma.careRequest.update({
      where: { id },
      data: {
        paymentStatus: 'PAID',
        status: 'PAYMENT_COMPLETED'
      }
    })
  ]);

  try {
    await NotificationService.sendCarePaymentReceived(
      user.email || '',
      request.id,
      String(totalCost)
    );
  } catch (err) {
    console.error('Failed to send payment confirmation email:', err);
  }

  revalidatePath('/profile');
  return { success: true };
}

// 9. Get Configured GST Percentage
export async function getCareGstPercentage() {
  const content = await prisma.homepageContent.findUnique({
    where: { key: 'care_gst_percentage' }
  });
  return content ? Number(content.value) : 18; // default to 18% if not configured
}

// 10. Save Configured GST Percentage
export async function saveCareGstPercentage(percentage: number) {
  await requireAdmin();
  const val = String(percentage);
  const content = await prisma.homepageContent.upsert({
    where: { key: 'care_gst_percentage' },
    update: { value: val },
    create: { key: 'care_gst_percentage', value: val }
  });
  revalidatePath('/admin/care');
  revalidatePath('/profile');
  return Number(content.value);
}

// 11. Admin: Update logistics details
export async function updateCareLogistics(id: string, logistics: {
  partner: string;
  trackingNumber: string;
  pickupDate?: string;
  deliveryDate?: string;
  estimatedDelivery?: string;
  status?: string;
}) {
  await requireAdmin();

  const existing = await prisma.careRequest.findUnique({
    where: { id }
  });

  if (!existing) throw new Error('Request not found');

  // Decode existing notes
  let adminNotes = '';
  let subtotal = Number(existing.pickupCharge) + Number(existing.repairCharge) + Number(existing.returnCharge);
  let gstPercentage = 18;
  let gstAmount = Number(existing.totalCharge) - subtotal;

  if (existing.additionalNotes) {
    try {
      const parsed = JSON.parse(existing.additionalNotes);
      if (parsed && typeof parsed === 'object') {
        adminNotes = parsed.adminNotes || '';
        subtotal = parsed.subtotal || subtotal;
        gstPercentage = parsed.gstPercentage || gstPercentage;
        gstAmount = parsed.gstAmount || gstAmount;
      }
    } catch (e) {
      adminNotes = existing.additionalNotes;
    }
  }

  const updatedNotes = {
    adminNotes,
    subtotal,
    gstPercentage,
    gstAmount,
    logistics
  };

  const request = await prisma.careRequest.update({
    where: { id },
    data: {
      additionalNotes: JSON.stringify(updatedNotes)
    }
  });

  revalidatePath('/admin/care');
  revalidatePath('/profile');
  return JSON.parse(JSON.stringify(request));
}

// 12. Customer: Create Razorpay order for care payment
export async function createCareRazorpayOrder(id: string, usedCredits: number) {
  const user = await getAuthedUser();
  const request = await prisma.careRequest.findUnique({
    where: { id }
  });

  if (!request || request.profileId !== user.id) {
    throw new Error('Request not found');
  }

  const grandTotal = Number(request.totalCharge);
  const remaining = Math.max(0, grandTotal - usedCredits);

  if (remaining === 0) {
    return { id: null, amount: 0 };
  }

  const { razorpayService } = await import('@/lib/razorpay-service');
  const rzpOrder = await razorpayService.createRazorpayOrder(remaining, id);
  return {
    id: rzpOrder.id,
    amount: rzpOrder.amount
  };
}

// 13. Customer: Verify and settle Razorpay payment
export async function verifyCarePayment(data: {
  requestId: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  usedCredits: number;
}) {
  const user = await getAuthedUser();
  const request = await prisma.careRequest.findUnique({
    where: { id: data.requestId }
  });

  if (!request || request.profileId !== user.id) {
    throw new Error('Request not found');
  }

  const grandTotal = Number(request.totalCharge);
  const remaining = Math.max(0, grandTotal - data.usedCredits);

  // 1. Verify Razorpay Signature
  if (remaining > 0) {
    if (!data.razorpayOrderId || !data.razorpayPaymentId || !data.razorpaySignature) {
      throw new Error('Missing Razorpay signature details');
    }
    const { razorpayService } = await import('@/lib/razorpay-service');
    const isValid = razorpayService.verifyPaymentSignature(
      data.razorpayOrderId,
      data.razorpayPaymentId,
      data.razorpaySignature
    );
    if (!isValid) {
      throw new Error('Payment signature verification failed');
    }
  }

  // 2. Perform wallet updates if credits were used
  if (data.usedCredits > 0) {
    const wallet = await prisma.wallet.findUnique({
      where: { profileId: user.id }
    });
    if (!wallet || Number(wallet.balance) < data.usedCredits) {
      throw new Error('Insufficient wallet balance');
    }

    await prisma.$transaction([
      prisma.wallet.update({
        where: { profileId: user.id },
        data: { balance: { decrement: data.usedCredits } }
      }),
      prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount: -data.usedCredits,
          type: 'DEBIT_ORDER',
          description: `Credits applied to care request ${data.requestId.substring(0,8).toUpperCase()}`
        }
      })
    ]);
  }

  // 3. Mark request as PAID
  const updatedRequest = await prisma.careRequest.update({
    where: { id: data.requestId },
    data: {
      paymentStatus: 'PAID',
      status: 'PAYMENT_COMPLETED',
      razorpayOrderId: data.razorpayOrderId || null
    }
  });

  try {
    await NotificationService.sendCarePaymentReceived(
      user.email || '',
      request.id,
      String(grandTotal)
    );
  } catch (err) {
    console.error('Failed to send payment confirmation email:', err);
  }

  revalidatePath('/profile');
  return JSON.parse(JSON.stringify(updatedRequest));
}
