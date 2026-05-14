'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

async function requireAdminOrEditor() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('UNAUTHORIZED');

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { role: true },
  });

  if (!profile || !['ADMIN', 'CONTENT_EDITOR'].includes(profile.role)) {
    throw new Error('FORBIDDEN');
  }

  return user;
}

// ── ARCHIVE POSTS ─────────────────────────────────────────────────────────────

export async function getArchivePosts(params?: {
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  type?: string;
  take?: number;
  skip?: number;
}) {
  return prisma.archivePost.findMany({
    where: {
      ...(params?.status
        ? { status: params.status }
        : { status: 'PUBLISHED' }), // public default = only published
      ...(params?.type && { type: params.type as any }),
    },
    orderBy: { publishedAt: 'desc' },
    take: params?.take ?? 20,
    skip: params?.skip ?? 0,
  });
}

export async function getArchivePostBySlug(slug: string) {
  return prisma.archivePost.findUnique({ where: { slug } });
}

const ArchivePostSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  type: z.enum(['EDITORIAL', 'MOODBOARD', 'OBSERVATION', 'ARTIFACT', 'CAMPAIGN']),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('DRAFT'),
  excerpt: z.string().min(1).max(500),
  body: z.string().optional(),
  coverImage: z.string().url().optional().nullable(),
  tags: z.array(z.string()).default([]),
});

export async function createArchivePost(input: z.infer<typeof ArchivePostSchema>) {
  const user = await requireAdminOrEditor();
  const data = ArchivePostSchema.parse(input);

  const post = await prisma.archivePost.create({
    data: {
      ...data,
      authorId: user.id,
      publishedAt: data.status === 'PUBLISHED' ? new Date() : null,
    },
  });

  revalidatePath('/archive');
  revalidatePath('/admin/editorial');
  return post;
}

export async function updateArchivePost(
  id: string,
  input: Partial<z.infer<typeof ArchivePostSchema>>
) {
  const user = await requireAdminOrEditor();
  const data = ArchivePostSchema.partial().parse(input);

  const existing = await prisma.archivePost.findUnique({ where: { id } });
  const becomingPublished =
    existing?.status !== 'PUBLISHED' && data.status === 'PUBLISHED';

  const post = await prisma.archivePost.update({
    where: { id },
    data: {
      ...data,
      ...(becomingPublished && { publishedAt: new Date() }),
    },
  });

  revalidatePath('/archive');
  revalidatePath(`/archive/${post.slug}`);
  revalidatePath('/admin/editorial');
  return post;
}

export async function deleteArchivePost(id: string) {
  await requireAdminOrEditor();
  await prisma.archivePost.delete({ where: { id } });
  revalidatePath('/archive');
  revalidatePath('/admin/editorial');
}

// ── HOMEPAGE CONTENT ──────────────────────────────────────────────────────────

export async function getHomepageContent() {
  const entries = await prisma.homepageContent.findMany();
  return Object.fromEntries(entries.map((e) => [e.key, e.value]));
}

export async function updateHomepageContent(key: string, value: string) {
  const user = await requireAdminOrEditor();

  const content = await prisma.homepageContent.upsert({
    where: { key },
    update: { value, updatedBy: user.id },
    create: { key, value, updatedBy: user.id },
  });

  revalidatePath('/');
  revalidatePath('/admin/editorial');
  return content;
}

// ── CAMPAIGN ASSETS ───────────────────────────────────────────────────────────

export async function getCampaignAssets(type?: string) {
  return prisma.campaignAsset.findMany({
    where: {
      isActive: true,
      ...(type && { type: type as any }),
    },
    orderBy: { position: 'asc' },
  });
}

export async function upsertCampaignAsset(input: {
  id?: string;
  name: string;
  type: string;
  url: string;
  alt?: string;
  dropId?: string;
  position?: number;
}) {
  await requireAdminOrEditor();

  if (input.id) {
    return prisma.campaignAsset.update({
      where: { id: input.id },
      data: input as any,
    });
  }

  const asset = await prisma.campaignAsset.create({ data: input as any });
  revalidatePath('/admin/editorial');
  return asset;
}
