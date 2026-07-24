'use server';

import { revalidatePath } from 'next/cache';
import { hasAdminBypass } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

async function requireAdmin() {
  const bypass = await hasAdminBypass();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (bypass) return user || { id: 'bypass-admin', email: 'admin@godsmove.in' } as any;

  if (!user) throw new Error('UNAUTHORIZED');

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { role: true },
  });

  const adminRoles = ['ADMIN', 'CONTENT_EDITOR', 'OPERATIONS'];
  if (!profile || !adminRoles.includes(profile.role)) {
    throw new Error('FORBIDDEN');
  }

  return user;
}

export async function getCollections() {
  const products = await prisma.product.findMany({
    where: {
      collectionName: { not: null, notIn: [''] }
    },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      collectionName: true,
      collectionBanner: true,
      collectionHeroImage: true,
      editorStory: true,
      theme: true,
      createdAt: true
    },
    orderBy: { createdAt: 'desc' }
  });

  // Group by collectionName
  const map = new Map<string, {
    name: string;
    banner?: string | null;
    heroImage?: string | null;
    story?: string | null;
    theme?: string | null;
    productsCount: number;
    products: any[];
  }>();

  for (const p of products) {
    const cName = p.collectionName?.trim();
    if (!cName) continue;

    if (!map.has(cName)) {
      map.set(cName, {
        name: cName,
        banner: p.collectionBanner,
        heroImage: p.collectionHeroImage,
        story: p.editorStory,
        theme: p.theme,
        productsCount: 0,
        products: []
      });
    }

    const group = map.get(cName)!;
    group.productsCount += 1;
    group.products.push(p);
  }

  return Array.from(map.values());
}

export async function createCollection(name: string, editorStory?: string) {
  await requireAdmin();
  if (!name || !name.trim()) throw new Error('Collection title is required');
  const collectionName = name.trim();

  revalidatePath('/admin/products');
  revalidatePath('/admin/collections');
  return { name: collectionName, editorStory: editorStory ? editorStory.trim() : null };
}

export async function updateCollection(
  oldName: string,
  data: {
    newName: string;
    banner?: string | null;
    heroImage?: string | null;
    editorStory?: string | null;
    theme?: string | null;
  }
) {
  await requireAdmin();
  if (!oldName.trim()) throw new Error('Collection name required');

  await prisma.product.updateMany({
    where: { collectionName: oldName },
    data: {
      collectionName: data.newName.trim(),
      ...(data.banner !== undefined && { collectionBanner: data.banner }),
      ...(data.heroImage !== undefined && { collectionHeroImage: data.heroImage }),
      ...(data.editorStory !== undefined && { editorStory: data.editorStory }),
      ...(data.theme !== undefined && { theme: data.theme })
    }
  });

  revalidatePath('/admin/products');
  revalidatePath('/admin/collections');
}

export async function deleteCollection(collectionName: string) {
  await requireAdmin();
  if (!collectionName.trim()) return;

  // Safely disassociate collection from products (never delete products!)
  await prisma.product.updateMany({
    where: { collectionName },
    data: {
      collectionName: null
    }
  });

  revalidatePath('/admin/products');
  revalidatePath('/admin/collections');
}
