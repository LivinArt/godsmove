'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { NotificationService } from '@/notifications/notification.service';

async function getAuthUser() {
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch (err) {
    return null;
  }
}

export async function registerEarlyAccessAction(userIdOverride?: string) {
  let userId = userIdOverride;

  if (!userId) {
    const user = await getAuthUser();
    if (!user) {
      return { success: false, error: 'Unauthenticated' };
    }
    userId = user.id;
  }

  const profile = await prisma.profile.findUnique({
    where: { id: userId },
    include: { membership: true },
  });

  if (!profile) {
    return { success: false, error: 'Profile not found' };
  }

  const alreadyRegistered = profile.earlyAccessRegistered;
  const now = new Date();
  const oneYearFromNow = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

  // 1. Update Profile Early Access state
  const updatedProfile = await prisma.profile.update({
    where: { id: userId },
    data: {
      earlyAccessRegistered: true,
      earlyAccessRegisteredAt: profile.earlyAccessRegisteredAt || now,
      earlyAccessBenefitsEligible: true,
    },
  });

  // 2. Ensure 1 Year Membership eligibility / activation
  let membershipActivated = false;
  if (!profile.membership) {
    await prisma.membership.create({
      data: {
        profileId: userId,
        status: 'ACTIVE',
        source: 'MANUAL',
        activatedAt: now,
        expiresAt: oneYearFromNow,
        tier: 'VIP',
      },
    });
    membershipActivated = true;
  } else if (profile.membership.status !== 'ACTIVE') {
    await prisma.membership.update({
      where: { profileId: userId },
      data: {
        status: 'ACTIVE',
        expiresAt: oneYearFromNow,
      },
    });
    membershipActivated = true;
  }

  // 3. Dispatch Idempotent Confirmation Email Asynchronously (Non-blocking for instant UI response)
  const idempotencyKey = `EARLY_ACCESS_${userId}`;
  prisma.notificationHistory.findUnique({
    where: { idempotencyKey },
  }).then(async (existingNotification) => {
    if (!existingNotification) {
      try {
        const recipientName = profile.firstName
          ? `${profile.firstName} ${profile.lastName || ''}`.trim()
          : 'Valued Collector';

        await NotificationService.notifyEarlyAccessConfirmation(
          {
            email: profile.email,
            name: recipientName,
            userId: profile.id,
          },
          {
            customerName: recipientName,
            email: profile.email,
          }
        );

        await prisma.notificationHistory.create({
          data: {
            idempotencyKey,
            profileId: profile.id,
            email: profile.email,
            channel: 'EMAIL',
            eventType: 'EARLY_ACCESS_CONFIRMED',
            status: 'SENT',
            subject: 'GODSMOVƎ Early Access Confirmed — Launch Benefits Active',
          },
        });
      } catch (err: any) {
        console.error('Failed to dispatch Early Access confirmation email:', err);
      }
    }
  }).catch((err) => {
    console.error('Notification check failed:', err);
  });

  try {
    revalidatePath('/profile');
    revalidatePath('/admin/customers');
  } catch {}

  return {
    success: true,
    alreadyRegistered,
    firstName: profile.firstName || null,
    earlyAccessRegisteredAt: (updatedProfile.earlyAccessRegisteredAt || now).toISOString(),
    membershipActivated,
    emailSent: true,
  };
}

export async function getEarlyAccessStatusAction() {
  const user = await getAuthUser();
  if (!user) {
    return { isRegistered: false, user: null };
  }

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      earlyAccessRegistered: true,
      earlyAccessRegisteredAt: true,
      earlyAccessBenefitsEligible: true,
    },
  });

  if (!profile) {
    return { isRegistered: false, user };
  }

  return {
    isRegistered: profile.earlyAccessRegistered,
    firstName: profile.firstName || null,
    registeredAt: profile.earlyAccessRegisteredAt ? profile.earlyAccessRegisteredAt.toISOString() : null,
    benefitsEligible: profile.earlyAccessBenefitsEligible,
    profile,
  };
}
