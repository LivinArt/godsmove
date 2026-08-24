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

export interface EarlyAccessRegistrationPayload {
  firstName?: string;
  phone?: string;
  dob?: string;
  gender?: string;
}

export async function registerEarlyAccessAction(
  userIdOverride?: string,
  onboardingDetails?: EarlyAccessRegistrationPayload
) {
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

  // Prepare profile update data, merging onboarding details if provided
  const updateData: any = {
    earlyAccessRegistered: true,
    earlyAccessRegisteredAt: profile.earlyAccessRegisteredAt || now,
    earlyAccessBenefitsEligible: true,
  };

  if (onboardingDetails?.firstName) updateData.firstName = onboardingDetails.firstName;
  if (onboardingDetails?.phone) updateData.phone = onboardingDetails.phone;
  if (onboardingDetails?.dob) updateData.dob = new Date(onboardingDetails.dob);
  if (onboardingDetails?.gender) updateData.gender = onboardingDetails.gender;

  // 1. Update Profile Early Access & onboarding details atomically
  const updatedProfile = await prisma.profile.update({
    where: { id: userId },
    data: updateData,
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

  // 3. Non-blocking Asynchronous Email Dispatch (Zero impact on UI response time)
  const idempotencyKey = `EARLY_ACCESS_${userId}`;
  prisma.notificationHistory.findUnique({
    where: { idempotencyKey },
  }).then(async (existingNotification) => {
    if (!existingNotification) {
      try {
        const recipientName = updatedProfile.firstName
          ? `${updatedProfile.firstName} ${updatedProfile.lastName || ''}`.trim()
          : 'Valued Collector';

        await NotificationService.notifyEarlyAccessConfirmation(
          {
            email: updatedProfile.email,
            name: recipientName,
            userId: updatedProfile.id,
          },
          {
            customerName: recipientName,
            email: updatedProfile.email,
          }
        );

        await prisma.notificationHistory.create({
          data: {
            idempotencyKey,
            profileId: updatedProfile.id,
            email: updatedProfile.email,
            channel: 'EMAIL',
            eventType: 'EARLY_ACCESS_CONFIRMED',
            status: 'SENT',
            subject: 'GODSMOVƎ Early Access Confirmed — Launch Benefits Active',
          },
        });
      } catch (err: any) {
        console.error('Non-critical background email dispatch warning:', err);
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
    firstName: updatedProfile.firstName || profile.firstName || null,
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
