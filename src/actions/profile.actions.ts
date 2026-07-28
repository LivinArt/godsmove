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
    await NotificationService.sendProfileUpdated(updated.email, fullName);
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
