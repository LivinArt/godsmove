'use server';

import { revalidatePath } from 'next/cache';
import { hasAdminBypass } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

async function requireHeroEditor() {
  const bypass = await hasAdminBypass();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (bypass) return user || ({ id: 'bypass-admin', email: 'admin@godsmove.in' } as const);

  if (!user) throw new Error('UNAUTHORIZED');

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { role: true },
  });

  if (!profile || !['ADMIN', 'CONTENT_EDITOR', 'MARKETING'].includes(profile.role)) {
    throw new Error('FORBIDDEN');
  }

  return user;
}

export async function getHomepageFeatureCardsData() {
  const entries = await prisma.homepageContent.findMany({
    where: {
      key: {
        in: [
          'feature_card_1_image',
          'feature_card_1_title',
          'feature_card_1_desc',
          'feature_card_2_image',
          'feature_card_2_title',
          'feature_card_2_desc',
        ],
      },
    },
  });

  return Object.fromEntries(entries.map((e) => [e.key, e.value]));
}

export async function updateHomepageFeatureCardsData(data: {
  card1Image: string;
  card1Title: string;
  card1Desc: string;
  card2Image: string;
  card2Title: string;
  card2Desc: string;
}) {
  const user = await requireHeroEditor();

  const updates = [
    { key: 'feature_card_1_image', value: data.card1Image },
    { key: 'feature_card_1_title', value: data.card1Title },
    { key: 'feature_card_1_desc', value: data.card1Desc },
    { key: 'feature_card_2_image', value: data.card2Image },
    { key: 'feature_card_2_title', value: data.card2Title },
    { key: 'feature_card_2_desc', value: data.card2Desc },
  ];

  await prisma.$transaction(
    updates.map((item) =>
      prisma.homepageContent.upsert({
        where: { key: item.key },
        update: { value: item.value, updatedBy: user.id },
        create: { key: item.key, value: item.value, updatedBy: user.id },
      })
    )
  );

  revalidatePath('/');
  revalidatePath('/admin/hero-slides');

  return { success: true };
}
