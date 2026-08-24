'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { executeEarlyAccessRegistration, CustomerDetailsInput } from '@/lib/customer-sync';

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
  name?: string;
  phone?: string;
  dob?: string;
  gender?: string;
}

export async function registerEarlyAccessAction(
  userIdOverride?: string,
  onboardingDetails?: EarlyAccessRegistrationPayload
) {
  let userId = userIdOverride;
  let authUser: any = null;

  if (!userId) {
    authUser = await getAuthUser();
    if (!authUser) {
      return { success: false, error: 'Unauthenticated' };
    }
    userId = authUser.id;
  }

  const existingProfile = await prisma.profile.findUnique({
    where: { id: userId },
    select: { earlyAccessRegistered: true, earlyAccessRegisteredAt: true, firstName: true },
  });

  if (!existingProfile) {
    return { success: false, error: 'Profile not found' };
  }

  const alreadyRegistered = existingProfile.earlyAccessRegistered;

  const detailsInput: CustomerDetailsInput = {
    name: onboardingDetails?.name || onboardingDetails?.firstName,
    phone: onboardingDetails?.phone,
    dob: onboardingDetails?.dob,
    gender: onboardingDetails?.gender,
  };

  const syncResult = await executeEarlyAccessRegistration(
    userId!,
    detailsInput,
    authUser?.user_metadata
  );

  try {
    revalidatePath('/profile');
    revalidatePath('/admin/customers');
  } catch {}

  const updatedProfile = syncResult?.profile;
  const now = new Date();

  return {
    success: true,
    alreadyRegistered,
    godsmoveId: syncResult?.godsmoveId || updatedProfile?.godsmoveId || null,
    firstName: updatedProfile?.firstName || null,
    earlyAccessRegisteredAt: (updatedProfile?.earlyAccessRegisteredAt || now).toISOString(),
    membershipActivated: syncResult?.membershipActivated || false,
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
      godsmoveId: true,
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
    godsmoveId: profile.godsmoveId,
    firstName: profile.firstName || null,
    registeredAt: profile.earlyAccessRegisteredAt ? profile.earlyAccessRegisteredAt.toISOString() : null,
    benefitsEligible: profile.earlyAccessBenefitsEligible,
    profile,
  };
}
