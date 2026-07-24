'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getMyAddresses() {
  const user = await getCurrentUser();
  if (!user) throw new Error('UNAUTHORIZED');

  return prisma.address.findMany({
    where: { profileId: user.id },
    orderBy: { isDefault: 'desc' },
  });
}

export async function createAddress(data: {
  firstName: string;
  lastName: string;
  line1: string;
  line2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  isDefault?: boolean;
  label?: string;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error('UNAUTHORIZED');

  return prisma.$transaction(async (tx) => {
    // If setting default, unset other defaults
    if (data.isDefault) {
      await tx.address.updateMany({
        where: { profileId: user.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    const address = await tx.address.create({
      data: {
        profileId: user.id,
        firstName: data.firstName,
        lastName: data.lastName,
        line1: data.line1,
        line2: data.line2,
        landmark: data.landmark,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        phone: data.phone,
        isDefault: data.isDefault ?? false,
        label: data.label ?? 'Home',
      },
    });

    revalidatePath('/profile');
    return address;
  });
}

export async function updateAddress(
  id: string,
  data: {
    firstName?: string;
    lastName?: string;
    line1?: string;
    line2?: string;
    landmark?: string;
    city?: string;
    state?: string;
    pincode?: string;
    phone?: string;
    isDefault?: boolean;
    label?: string;
  }
) {
  const user = await getCurrentUser();
  if (!user) throw new Error('UNAUTHORIZED');

  // Verify ownership
  const existing = await prisma.address.findUnique({ where: { id } });
  if (!existing || existing.profileId !== user.id) throw new Error('FORBIDDEN');

  return prisma.$transaction(async (tx) => {
    if (data.isDefault) {
      await tx.address.updateMany({
        where: { profileId: user.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    const address = await tx.address.update({
      where: { id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        line1: data.line1,
        line2: data.line2,
        landmark: data.landmark,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        phone: data.phone,
        isDefault: data.isDefault,
        label: data.label,
      },
    });

    revalidatePath('/profile');
    return address;
  });
}

export async function deleteAddress(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('UNAUTHORIZED');

  const existing = await prisma.address.findUnique({ where: { id } });
  if (!existing || existing.profileId !== user.id) throw new Error('FORBIDDEN');

  const address = await prisma.address.delete({ where: { id } });
  revalidatePath('/profile');
  return address;
}

export async function setDefaultAddress(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('UNAUTHORIZED');

  const existing = await prisma.address.findUnique({ where: { id } });
  if (!existing || existing.profileId !== user.id) throw new Error('FORBIDDEN');

  return prisma.$transaction(async (tx) => {
    await tx.address.updateMany({
      where: { profileId: user.id, isDefault: true },
      data: { isDefault: false },
    });

    const address = await tx.address.update({
      where: { id },
      data: { isDefault: true },
    });

    revalidatePath('/profile');
    return address;
  });
}
