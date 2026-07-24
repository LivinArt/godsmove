'use server';

import { revalidatePath } from 'next/cache';
import { hasAdminBypass } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { HeroSlideUpsertSchema, type HeroSlideUpsertInput } from '@/lib/validations/hero-slide';

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

function revalidateHeroPaths() {
  revalidatePath('/');
  revalidatePath('/admin/hero-slides');
}

export async function getHeroSlidesAdmin() {
  await requireHeroEditor();
  return prisma.heroSlide.findMany({
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  });
}

export async function getHeroSlideById(id: string) {
  await requireHeroEditor();
  return prisma.heroSlide.findUnique({ where: { id } });
}

export async function createHeroSlide(input: HeroSlideUpsertInput) {
  await requireHeroEditor();
  const data = HeroSlideUpsertSchema.parse(input);

  const maxOrder = await prisma.heroSlide.aggregate({ _max: { sortOrder: true } });
  const sortOrder = data.sortOrder ?? (maxOrder._max.sortOrder ?? -1) + 1;

  const slide = await prisma.heroSlide.create({
    data: {
      image: data.image,
      mobileImage: data.mobileImage ?? null,
      eyebrow: data.eyebrow,
      headline: data.headline,
      narrative: data.narrative,
      ctaLabel: data.ctaLabel,
      ctaHref: data.ctaHref,
      alignment: data.alignment,
      overlayOpacity: data.overlayOpacity,
      sortOrder,
      isActive: data.isActive,
    },
  });

  revalidateHeroPaths();
  return slide;
}

export async function updateHeroSlide(id: string, input: Partial<HeroSlideUpsertInput>) {
  await requireHeroEditor();
  const partial = HeroSlideUpsertSchema.partial().parse(input);

  const slide = await prisma.heroSlide.update({
    where: { id },
    data: {
      ...(partial.image !== undefined && { image: partial.image }),
      ...(partial.mobileImage !== undefined && {
        mobileImage: partial.mobileImage?.trim() ? partial.mobileImage.trim() : null,
      }),
      ...(partial.eyebrow !== undefined && { eyebrow: partial.eyebrow }),
      ...(partial.headline !== undefined && { headline: partial.headline }),
      ...(partial.narrative !== undefined && { narrative: partial.narrative }),
      ...(partial.ctaLabel !== undefined && { ctaLabel: partial.ctaLabel }),
      ...(partial.ctaHref !== undefined && { ctaHref: partial.ctaHref }),
      ...(partial.alignment !== undefined && { alignment: partial.alignment }),
      ...(partial.overlayOpacity !== undefined && { overlayOpacity: partial.overlayOpacity }),
      ...(partial.sortOrder !== undefined && { sortOrder: partial.sortOrder }),
      ...(partial.isActive !== undefined && { isActive: partial.isActive }),
    },
  });

  revalidateHeroPaths();
  return slide;
}

export async function deleteHeroSlide(id: string) {
  await requireHeroEditor();
  await prisma.heroSlide.delete({ where: { id } });
  revalidateHeroPaths();
}

/** Move slide one position earlier in the editorial order */
export async function moveHeroSlideUp(id: string) {
  await requireHeroEditor();
  const slides = await prisma.heroSlide.findMany({
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  });
  const idx = slides.findIndex((s) => s.id === id);
  if (idx <= 0) return;

  const reordered = [...slides];
  [reordered[idx - 1], reordered[idx]] = [reordered[idx], reordered[idx - 1]];

  await prisma.$transaction(
    reordered.map((s, i) =>
      prisma.heroSlide.update({ where: { id: s.id }, data: { sortOrder: i } })
    )
  );

  revalidateHeroPaths();
}

/** Move slide one position later in the editorial order */
export async function moveHeroSlideDown(id: string) {
  await requireHeroEditor();
  const slides = await prisma.heroSlide.findMany({
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  });
  const idx = slides.findIndex((s) => s.id === id);
  if (idx < 0 || idx >= slides.length - 1) return;

  const reordered = [...slides];
  [reordered[idx], reordered[idx + 1]] = [reordered[idx + 1], reordered[idx]];

  await prisma.$transaction(
    reordered.map((s, i) =>
      prisma.heroSlide.update({ where: { id: s.id }, data: { sortOrder: i } })
    )
  );

  revalidateHeroPaths();
}
