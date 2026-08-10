'use server';

import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

export async function togglePreBookingInterestAction(productId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !user.email) {
      return { success: false, requiresAuth: true, error: 'Authentication required' };
    }

    const profile = await prisma.profile.findUnique({
      where: { email: user.email },
    });

    if (!profile) {
      return { success: false, requiresAuth: true, error: 'Profile not found' };
    }

    const existing = await prisma.preBookingInterest.findUnique({
      where: {
        productId_profileId: {
          productId,
          profileId: profile.id,
        },
      },
    });

    if (existing) {
      await prisma.preBookingInterest.delete({
        where: { id: existing.id },
      });
      return {
        success: true,
        registered: false,
        alreadyRegistered: false,
        message: 'No notification on launch.',
      };
    } else {
      await prisma.preBookingInterest.create({
        data: {
          productId,
          profileId: profile.id,
        },
      });
      return {
        success: true,
        registered: true,
        alreadyRegistered: false,
        message: 'You will be notified on launch.',
      };
    }
  } catch (error: any) {
    console.error('Error toggling PreBooking interest:', error);
    return { success: false, error: error.message || 'Failed to update notification settings' };
  }
}


export const registerPreBookingInterestAction = togglePreBookingInterestAction;

export async function checkPreBookingInterestAction(productId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !user.email) {
      return { isRegistered: false };
    }

    const profile = await prisma.profile.findUnique({
      where: { email: user.email },
      select: { id: true },
    });

    if (!profile) {
      return { isRegistered: false };
    }

    const existing = await prisma.preBookingInterest.findUnique({
      where: {
        productId_profileId: {
          productId,
          profileId: profile.id,
        },
      },
      select: { id: true },
    });

    return { isRegistered: Boolean(existing) };
  } catch (error) {
    return { isRegistered: false };
  }
}

export async function checkBatchPreBookingInterestAction(productIds: string[]) {
  try {
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return { interests: {} };
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !user.email) {
      return { interests: {} };
    }

    const profile = await prisma.profile.findUnique({
      where: { email: user.email },
      select: { id: true },
    });

    if (!profile) {
      return { interests: {} };
    }

    const interestsList = await prisma.preBookingInterest.findMany({
      where: {
        profileId: profile.id,
        productId: { in: productIds },
      },
      select: {
        productId: true,
      },
    });

    const map: Record<string, boolean> = {};
    interestsList.forEach((item) => {
      map[item.productId] = true;
    });

    return { interests: map };
  } catch (error) {
    return { interests: {} };
  }
}


