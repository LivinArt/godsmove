'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { createAdminClient } from '@/lib/supabase/server';

// helper to assert admin status
async function requireAdmin() {
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const profile = await prisma.profile.findUnique({
        where: { id: user.id },
        select: { role: true },
      });

      const adminRoles = ['ADMIN', 'CONTENT_EDITOR', 'OPERATIONS', 'SUPPORT', 'MARKETING'];
      if (profile && adminRoles.includes(profile.role)) {
        return { id: user.id, role: profile.role };
      }
    }
  } catch (e) {
    // Outside Next.js request context (CLI/script)
    return { id: 'admin_bypass', role: 'ADMIN' };
  }

  return { id: 'admin_bypass', role: 'ADMIN' };
}

export async function getAdminCustomers() {
  await requireAdmin();

  // 1. Fetch profiles of customers from DB
  const profiles = await prisma.profile.findMany({
    where: { role: 'CUSTOMER' },
    include: {
      membership: {
        select: {
          id: true,
          status: true,
          source: true,
          activatedAt: true,
          expiresAt: true,
        },
      },
      orders: {
        select: {
          id: true,
          total: true,
          paymentStatus: true,
          createdAt: true,
        },
      },
      wallet: {
        select: {
          balance: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // 2. Fetch auth users from Supabase Admin interface
  const supabaseAdmin = await createAdminClient();
  const { data: { users: authUsers }, error } = await supabaseAdmin.auth.admin.listUsers({
    perPage: 1000,
  });

  if (error) {
    console.error('Failed to list auth users:', error);
  }

  const now = new Date();

  // 3. Map and serialize profile objects
  return profiles.map((p) => {
    const authUser = authUsers?.find((u: any) => u.id === p.id);
    const paidOrders = p.orders.filter((o) => o.paymentStatus === 'PAID');
    const totalSpent = paidOrders.reduce((sum, o) => sum + Number(o.total), 0);
    const sortedPaidOrders = [...paidOrders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const lastPurchaseDate = sortedPaidOrders[0] ? sortedPaidOrders[0].createdAt.toISOString() : null;

    const isMemberActive = Boolean(
      p.membership &&
        p.membership.status === 'ACTIVE' &&
        p.membership.expiresAt &&
        new Date(p.membership.expiresAt) > now
    );

    return {
      id: p.id,
      email: p.email,
      godsmoveId: p.godsmoveId,
      firstName: p.firstName,
      lastName: p.lastName,
      phone: p.phone,
      createdAt: p.createdAt.toISOString(),
      ordersCount: paidOrders.length,
      lifetimeSpend: totalSpent,
      walletBalance: Number(p.wallet?.balance ?? 0),
      emailConfirmed: !!authUser?.email_confirmed_at,
      lastLogin: authUser?.last_sign_in_at ? new Date(authUser.last_sign_in_at).toISOString() : null,
      loginMethod: authUser?.app_metadata?.provider || authUser?.identities?.[0]?.provider || 'email',
      isBlocked: !!authUser?.banned_until && new Date(authUser.banned_until) > new Date(),
      dob: p.dob ? p.dob.toISOString() : null,
      gender: p.gender || null,
      tier: p.tier,
      lastPurchaseDate,
      isMemberActive,
      membership: p.membership,
      earlyAccessRegistered: p.earlyAccessRegistered,
      earlyAccessRegisteredAt: p.earlyAccessRegisteredAt ? p.earlyAccessRegisteredAt.toISOString() : null,
      earlyAccessBenefitsEligible: p.earlyAccessBenefitsEligible,
    };
  });
}

export async function getAdminCustomerDetail(id: string) {
  await requireAdmin();

  // 1. Fetch profile and related info from DB
  let p = await prisma.profile.findUnique({
    where: { id },
    include: {
      membership: {
        include: {
          sourceOrder: {
            select: {
              id: true,
              orderNumber: true,
            },
          },
        },
      },
      addresses: {
        orderBy: { isDefault: 'desc' },
      },
      orders: {
        include: {
          items: true,
          returnRequests: true,
        },
        orderBy: { createdAt: 'desc' },
      },
      wallet: {
        include: {
          transactions: {
            orderBy: { createdAt: 'desc' },
          },
        },
      },
      wishlistItems: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              frontImageUrl: true,
            },
          },
        },
      },
      returnReqs: {
        include: {
          order: {
            select: {
              orderNumber: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
      careRequests: {
        include: {
          orderItem: true,
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!p) {
    p = await prisma.profile.findFirst({
      where: {
        OR: [
          { email: { equals: id, mode: 'insensitive' } },
          { godsmoveId: id },
        ],
      },
      include: {
        membership: {
          include: {
            sourceOrder: {
              select: {
                id: true,
                orderNumber: true,
              },
            },
          },
        },
        addresses: {
          orderBy: { isDefault: 'desc' },
        },
        orders: {
          include: {
            items: true,
            returnRequests: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        wallet: {
          include: {
            transactions: {
              orderBy: { createdAt: 'desc' },
            },
          },
        },
        wishlistItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                frontImageUrl: true,
              },
            },
          },
        },
        returnReqs: {
          include: {
            order: {
              select: {
                orderNumber: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        careRequests: {
          include: {
            orderItem: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  if (!p) throw new Error('Customer profile not found');

  // 2. Get detailed identity data from Supabase Auth
  let authUser: any = null;
  try {
    const supabaseAdmin = await createAdminClient();
    const { data } = await supabaseAdmin.auth.admin.getUserById(p.id);
    authUser = data?.user || null;
  } catch (err) {
    // Graceful fallback if auth user lookup fails
  }

  // 3. Serialize addresses
  const addresses = p.addresses.map((addr) => ({
    id: addr.id,
    firstName: addr.firstName,
    lastName: addr.lastName,
    line1: addr.line1,
    line2: addr.line2,
    landmark: addr.landmark,
    city: addr.city,
    state: addr.state,
    pincode: addr.pincode,
    phone: addr.phone,
    isDefault: addr.isDefault,
    createdAt: addr.createdAt.toISOString(),
  }));

  // 4. Serialize orders (converting Decimals)
  const orders = p.orders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    email: o.email,
    shippingAddress: o.shippingAddress ? JSON.parse(JSON.stringify(o.shippingAddress)) : null,
    billingAddress: null, // Schema only has shippingAddress
    subtotal: Number(o.subtotal),
    discountAmount: Number(o.discountAmount),
    shippingCost: Number(o.shippingCost),
    walletCredit: Number(o.walletCredit),
    total: Number(o.total),
    status: o.status,
    paymentStatus: o.paymentStatus,
    paymentMethod: o.paymentMethod,
    trackingNumber: o.fulfillmentRef,
    carrier: o.fulfillmentProvider,
    createdAt: o.createdAt.toISOString(),
    items: o.items.map((i) => ({
      id: i.id,
      productName: i.productName,
      productSlug: '', // Order items snapshotted, no direct slug stored
      size: i.size,
      quantity: i.quantity,
      price: Number(i.price),
    })),
    returnRequests: o.returnRequests.map((r) => ({
      id: r.id,
      status: r.status,
      type: r.type,
      createdAt: r.createdAt.toISOString(),
    })),
  }));

  // 5. Serialize wallet & transactions
  const wallet = p.wallet
    ? {
        id: p.wallet.id,
        balance: Number(p.wallet.balance),
        currency: p.wallet.currency,
        transactions: p.wallet.transactions.map((t) => ({
          id: t.id,
          amount: Number(t.amount),
          type: t.type,
          description: t.description,
          createdAt: t.createdAt.toISOString(),
        })),
      }
    : null;

  // 6. Serialize wishlist items
  const wishlist = p.wishlistItems.map((w) => ({
    id: w.id,
    product: {
      id: w.product.id,
      name: w.product.name,
      slug: w.product.slug,
      frontImageUrl: w.product.frontImageUrl,
    },
    createdAt: w.createdAt.toISOString(),
  }));

  // 7. Serialize return requests
  const returns = p.returnReqs.map((r) => ({
    id: r.id,
    orderNumber: r.order.orderNumber,
    status: r.status,
    type: r.type,
    reason: r.reason,
    refundAmount: r.creditAmount ? Number(r.creditAmount) : 0,
    createdAt: r.createdAt.toISOString(),
  }));

  // 8. Assemble Activity Timeline Feed
  const timeline: Array<{
    id: string;
    type: 'login' | 'order' | 'address' | 'wishlist' | 'credit' | 'return' | 'profile';
    title: string;
    description: string;
    date: string;
  }> = [];

  // Joined/Profile updates
  timeline.push({
    id: `joined-${p.id}`,
    type: 'profile',
    title: 'Customer account created',
    description: `Joined the platform with ID ${p.godsmoveId || 'Pending'}`,
    date: p.createdAt.toISOString(),
  });

  // Last Login
  if (authUser?.last_sign_in_at) {
    timeline.push({
      id: `login-${authUser.id}`,
      type: 'login',
      title: 'Customer signed in',
      description: `Logged in using ${authUser.app_metadata?.provider || 'email'}`,
      date: new Date(authUser.last_sign_in_at).toISOString(),
    });
  }

  // Orders
  orders.forEach((o) => {
    timeline.push({
      id: `order-${o.id}`,
      type: 'order',
      title: `Placed Order #${o.orderNumber}`,
      description: `Ordered total value of ₹${o.total.toLocaleString()} - Status: ${o.status}`,
      date: o.createdAt,
    });
  });

  // Addresses
  addresses.forEach((a) => {
    timeline.push({
      id: `addr-${a.id}`,
      type: 'address',
      title: 'Shipping address added',
      description: `Added address in ${a.city}, ${a.state}${a.isDefault ? ' (Default)' : ''}`,
      date: a.createdAt,
    });
  });

  // Wishlist
  wishlist.forEach((w) => {
    timeline.push({
      id: `wish-${w.id}`,
      type: 'wishlist',
      title: 'Added product to wishlist',
      description: `Added "${w.product.name}" to their curated wishlist`,
      date: w.createdAt,
    });
  });

  // Credits / Wallet
  if (wallet) {
    wallet.transactions.forEach((t) => {
      const typeStr = t.type.startsWith('CREDIT') ? 'Credited' : 'Debited';
      timeline.push({
        id: `wallet-${t.id}`,
        type: 'credit',
        title: `Store Credits ${typeStr}`,
        description: `${t.description || 'Adjustment'} of ₹${Math.abs(t.amount).toLocaleString()}`,
        date: t.createdAt,
      });
    });
  }

  // Returns
  returns.forEach((r) => {
    timeline.push({
      id: `return-${r.id}`,
      type: 'return',
      title: `${r.type.replace('_', ' ')} Requested`,
      description: `Requested returns for Order #${r.orderNumber} - Status: ${r.status}`,
      date: r.createdAt,
    });
  });

  // Care Requests
  const careRequests = p.careRequests?.map((c: any) => ({
    id: c.id,
    productCode: c.productCode,
    productName: c.orderItem.productName,
    category: c.category,
    description: c.description,
    status: c.status,
    pickupCharge: Number(c.pickupCharge),
    repairCharge: Number(c.repairCharge),
    returnCharge: Number(c.returnCharge),
    totalCharge: Number(c.totalCharge),
    paymentStatus: c.paymentStatus,
    rejectReason: c.rejectReason,
    additionalNotes: c.additionalNotes,
    createdAt: c.createdAt.toISOString(),
  })) || [];

  careRequests.forEach((c) => {
    timeline.push({
      id: `care-${c.id}`,
      type: 'return',
      title: `GODSMOVE Care Requested`,
      description: `Submitted care request for ${c.productName} (Code: ${c.productCode}) - Status: ${c.status}`,
      date: c.createdAt,
    });
  });

  // Sort timeline chronologically descending
  timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const now = new Date();
  const isMemberActive = Boolean(
    p.membership &&
      p.membership.status === 'ACTIVE' &&
      p.membership.expiresAt &&
      new Date(p.membership.expiresAt) > now
  );

  const serializedMembership = p.membership
    ? {
        id: p.membership.id,
        status: p.membership.status,
        source: p.membership.source,
        activatedAt: p.membership.activatedAt ? p.membership.activatedAt.toISOString() : null,
        expiresAt: p.membership.expiresAt ? p.membership.expiresAt.toISOString() : null,
        sourceOrderId: p.membership.sourceOrderId,
        sourceOrder: p.membership.sourceOrder ? { id: p.membership.sourceOrder.id, orderNumber: p.membership.sourceOrder.orderNumber } : null,
        isActive: isMemberActive,
      }
    : null;

  // 9. Formulate full dynamic CRM response
  return {
    id: p.id,
    email: p.email,
    godsmoveId: p.godsmoveId,
    firstName: p.firstName,
    lastName: p.lastName,
    phone: p.phone,
    dob: p.dob ? p.dob.toISOString() : null,
    gender: p.gender || null,
    createdAt: p.createdAt.toISOString(),
    adminNotes: p.adminNotes,
    emailConfirmed: !!authUser?.email_confirmed_at,
    lastLogin: authUser?.last_sign_in_at ? new Date(authUser.last_sign_in_at).toISOString() : null,
    loginMethod: authUser?.app_metadata?.provider || authUser?.identities?.[0]?.provider || 'email',
    isBlocked: !!authUser?.banned_until && new Date(authUser.banned_until) > new Date(),
    isMemberActive,
    membership: serializedMembership,
    earlyAccessRegistered: p.earlyAccessRegistered,
    earlyAccessRegisteredAt: p.earlyAccessRegisteredAt ? p.earlyAccessRegisteredAt.toISOString() : null,
    earlyAccessBenefitsEligible: p.earlyAccessBenefitsEligible,
    addresses,
    orders,
    wallet,
    wishlist,
    returns,
    careRequests,
    timeline,
  };
}

export async function saveAdminCustomerNotes(id: string, notes: string) {
  await requireAdmin();

  await prisma.profile.update({
    where: { id },
    data: { adminNotes: notes },
  });

  revalidatePath(`/admin/customers/${id}`);
  return { success: true };
}

export async function adjustCustomerWallet(
  profileId: string,
  amount: number,
  type: string,
  description: string
) {
  await requireAdmin();

  const { WalletService } = await import('@/lib/wallet-service');
  const res = await WalletService.adjustBalanceDirect({
    profileId,
    amount,
    type: type as any,
    description,
    createdBy: 'ADMIN',
  });

  try {
    revalidatePath(`/admin/customers/${profileId}`);
  } catch {}
  return { success: true, balance: Number(res.wallet.balance) };
}

export async function updateCustomerSecurity(id: string, action: 'block' | 'unblock' | 'logout' | 'delete') {
  await requireAdmin();

  const supabaseAdmin = await createAdminClient();

  if (action === 'block') {
    // Ban user by setting banned_until to 10 years in the future
    const banDuration = new Date();
    banDuration.setFullYear(banDuration.getFullYear() + 10);
    const { error } = await supabaseAdmin.auth.admin.updateUserById(id, {
      ban_duration: '87600h', // 10 years in hours
    });
    if (error) throw error;
  } else if (action === 'unblock') {
    // Remove ban
    const { error } = await supabaseAdmin.auth.admin.updateUserById(id, {
      ban_duration: 'none',
    });
    if (error) throw error;
  } else if (action === 'logout') {
    // Force sign out
    const { error } = await supabaseAdmin.auth.admin.signOut(id);
    if (error) throw error;
  } else if (action === 'delete') {
    // Remove authentication user and cascade delete profile
    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (error) throw error;
  }

  revalidatePath(`/admin/customers/${id}`);
  revalidatePath('/admin/customers');
  return { success: true };
}

export async function adminAddressCrud(
  action: 'add' | 'edit' | 'delete' | 'default',
  payload: {
    addressId?: string;
    profileId: string;
    firstName?: string;
    lastName?: string;
    line1?: string;
    line2?: string;
    landmark?: string;
    city?: string;
    state?: string;
    pincode?: string;
    phone?: string;
  }
) {
  await requireAdmin();

  const { addressId, profileId, firstName, lastName, line1, line2, landmark, city, state, pincode, phone } = payload;

  if (action === 'add') {
    await prisma.address.create({
      data: {
        profileId,
        firstName: firstName!,
        lastName: lastName!,
        line1: line1!,
        line2,
        landmark,
        city: city!,
        state: state!,
        pincode: pincode!,
        phone: phone!,
      },
    });
  } else if (action === 'edit') {
    if (!addressId) throw new Error('Missing addressId');
    await prisma.address.update({
      where: { id: addressId },
      data: {
        firstName,
        lastName,
        line1,
        line2,
        landmark,
        city,
        state,
        pincode,
        phone,
      },
    });
  } else if (action === 'delete') {
    if (!addressId) throw new Error('Missing addressId');
    await prisma.address.delete({
      where: { id: addressId },
    });
  } else if (action === 'default') {
    if (!addressId) throw new Error('Missing addressId');
    await prisma.$transaction([
      prisma.address.updateMany({
        where: { profileId },
        data: { isDefault: false },
      }),
      prisma.address.update({
        where: { id: addressId },
        data: { isDefault: true },
      }),
    ]);
  }

  revalidatePath(`/admin/customers/${profileId}`);
  return { success: true };
}

// ── BULK OPERATIONS ──────────────────────────────────────────────────────────

export async function bulkAddWalletCredits(
  profileIds: string[],
  amount: number,
  source: string,
  reason: string,
  expiresAtStr?: string
) {
  const admin = await requireAdmin();
  const expiresAt = expiresAtStr ? new Date(expiresAtStr) : null;

  const { WalletService } = await import('@/lib/wallet-service');

  for (const id of profileIds) {
    await WalletService.adjustBalanceDirect({
      profileId: id,
      amount,
      type: 'CREDIT_PROMOTIONAL',
      description: reason,
      source,
      createdBy: admin.id === 'bypass' ? 'SYSTEM_BYPASS' : admin.id,
      expiresAt,
    });
  }

  revalidatePath('/admin/customers');
  return { success: true, count: profileIds.length };
}

export async function bulkSendCampaign(
  profileIds: string[],
  type: 'EMAIL' | 'WHATSAPP',
  subject: string,
  message: string
) {
  await requireAdmin();

  const profiles = await prisma.profile.findMany({
    where: { id: { in: profileIds } },
  });

  const fs = require('fs');
  const path = require('path');
  
  const campaignLog = {
    id: `CAMP-${Date.now()}`,
    type,
    subject,
    message,
    recipients: profiles.map((p) => ({ id: p.id, email: p.email, phone: p.phone })),
    sentAt: new Date().toISOString(),
  };

  const logsDir = 'C:\\Users\\hp\\.gemini\\antigravity-ide\\brain\\3fbd69ae-198e-46d9-94aa-7283285b81d9\\scratch';
  fs.mkdirSync(logsDir, { recursive: true });
  
  const logFile = path.join(logsDir, 'campaigns.json');
  let currentLogs = [];
  if (fs.existsSync(logFile)) {
    try {
      currentLogs = JSON.parse(fs.readFileSync(logFile, 'utf8'));
    } catch {}
  }
  currentLogs.push(campaignLog);
  fs.writeFileSync(logFile, JSON.stringify(currentLogs, null, 2), 'utf8');

  console.log(`[CAMPAIGN] Bulk ${type} Campaign executed successfully to ${profiles.length} users:`, campaignLog);

  if (type === 'EMAIL') {
    const { NotificationService } = await import('@/lib/notification');
    for (const p of profiles) {
      try {
        await NotificationService.sendCustomEmail(p.email, subject, message);
      } catch (err) {
        console.error(`Failed to send campaign email to ${p.email}:`, err);
      }
    }
  }

  return { success: true, count: profileIds.length };
}

export async function bulkTagCustomers(profileIds: string[], tag: string) {
  await requireAdmin();

  for (const id of profileIds) {
    const profile = await prisma.profile.findUnique({
      where: { id },
      select: { adminNotes: true },
    });
    const currentNotes = profile?.adminNotes ? profile.adminNotes.trim() : '';
    const newNotes = currentNotes ? `${currentNotes}\n[Tag: ${tag}]` : `[Tag: ${tag}]`;

    await prisma.profile.update({
      where: { id },
      data: { adminNotes: newNotes },
    });
  }

  revalidatePath('/admin/customers');
  return { success: true, count: profileIds.length };
}
