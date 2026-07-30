'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { NotificationService } from '@/notifications/notification.service';

async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function updateMyProfile(data: {
  firstName: string;
  lastName: string;
  phone: string;
  dob?: string | null;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error('UNAUTHORIZED');

  const updated = await prisma.profile.update({
    where: { id: user.id },
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      dob: data.dob ? new Date(data.dob) : null,
    },
  });

  try {
    const fullName = `${updated.firstName || ''} ${updated.lastName || ''}`.trim() || 'Collector';
    await NotificationService.sendProfileUpdated(updated.email, fullName, user.id);
  } catch (err) {
    console.error('Non-critical notification error on profile update:', err);
  }

  revalidatePath('/profile');
  return updated;
}

export async function getMyProfile() {
  const user = await getCurrentUser();
  if (!user) throw new Error('UNAUTHORIZED');

  return prisma.profile.findUnique({
    where: { id: user.id },
  });
}

// Lightweight summary for homepage greeting — single DB round-trip via parallel queries.
// Returns only what the greeting widget needs: no heavy joins, no full order rows.
export async function getProfileSummary() {
  const user = await getCurrentUser();
  if (!user) return null;

  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

    const [profile, wallet, recentOrders, recentReturn, activeCareCount] = await Promise.all([
      prisma.profile.findUnique({
        where: { id: user.id },
        select: { id: true, firstName: true, lastName: true, email: true },
      }),
      prisma.wallet.findUnique({
        where: { profileId: user.id },
        select: { balance: true },
      }),
      // Only fetch recent orders with item product IDs for recommendations
      prisma.order.findMany({
        where: { profileId: user.id },
        select: {
          id: true,
          status: true,
          updatedAt: true,
          items: {
            select: {
              variant: {
                select: { productId: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      // Only fetch returns updated recently
      prisma.returnRequest.findFirst({
        where: {
          profileId: user.id,
          status: { in: ['APPROVED', 'WALLET_CREDITED', 'COMPLETED'] },
          updatedAt: { gte: threeDaysAgo },
        },
        select: { id: true },
      }),
      prisma.careRequest.count({
        where: {
          profileId: user.id,
          status: { notIn: ['COMPLETED', 'REJECTED'] },
        },
      }),
    ]);

    if (!profile) return null;

    const orderedProductIds = recentOrders.flatMap((o: any) =>
      (o.items as any[]).map((i: any) => i.variant?.productId).filter(Boolean)
    );

    const hasRecentlyDelivered = recentOrders.some(
      (o: any) =>
        ['DELIVERED', 'COMPLETED'].includes(o.status) &&
        new Date(o.updatedAt) >= sevenDaysAgo
    );

    return {
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email,
      walletBalance: wallet ? Number(wallet.balance) : 0,
      orderCount: recentOrders.length,
      hasActiveCare: activeCareCount > 0,
      hasRecentlyDelivered,
      hasApprovedReturn: !!recentReturn,
      orderedProductIds,
    };
  } catch {
    return null;
  }
}
