'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import {
  CreateProductSchema,
  UpdateProductSchema,
  CreateVariantSchema,
  CreateDropSchema,
  UpsertProductSchema,
  type CreateProductInput,
  type UpdateProductInput,
  type CreateVariantInput,
  type CreateDropInput,
  type UpsertProductInput,
} from '@/lib/validations/product';

// ── HELPERS ─────────────────────────────────────────────────────────────────

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
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

// ── PRODUCTS ─────────────────────────────────────────────────────────────────

export async function getProducts(params?: {
  search?: string;
  status?: string;
  dropId?: string;
  categoryId?: string;
  isFeatured?: boolean;
  take?: number;
  skip?: number;
}) {
  return prisma.product.findMany({
    where: {
      ...(params?.search && {
        OR: [
          { name: { contains: params.search, mode: 'insensitive' } },
          { slug: { contains: params.search, mode: 'insensitive' } },
          { variants: { some: { sku: { contains: params.search, mode: 'insensitive' } } } },
        ],
      }),
      ...(params?.status && { status: params.status as any }),
      ...(params?.dropId && { dropId: params.dropId }),
      ...(params?.categoryId && { categoryId: params.categoryId }),
      ...(params?.isFeatured !== undefined && { isFeatured: params.isFeatured }),
    },
    include: {
      category: true,
      drop: { select: { id: true, name: true, slug: true, status: true } },
      images: { orderBy: { position: 'asc' } },
      variants: {
        include: { inventory: true },
        orderBy: { position: 'asc' },
      },
      tags: true,
    },
    orderBy: { createdAt: 'desc' },
    take: params?.take ?? 50,
    skip: params?.skip ?? 0,
  });
}

export async function getProductBySlug(slug: string) {
  return prisma.product.findUnique({
    where: { slug },
    include: {
      category: true,
      drop: true,
      images: { orderBy: { position: 'asc' } },
      variants: {
        include: { inventory: true },
        orderBy: { position: 'asc' },
      },
      tags: true,
    },
  });
}

export async function getProductById(id: string) {
  return prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      drop: true,
      images: { orderBy: { position: 'asc' } },
      variants: {
        include: { inventory: true },
        orderBy: { position: 'asc' },
      },
      tags: true,
    },
  });
}


export async function createProduct(input: CreateProductInput) {
  await requireAdmin();
  const data = CreateProductSchema.parse(input);

  const product = await prisma.product.create({
    data: {
      ...data,
      publishedAt: data.status === 'ACTIVE' ? new Date() : null,
    },
  });

  revalidatePath('/admin/products');
  revalidatePath('/drops');
  return product;
}

export async function updateProduct(input: UpdateProductInput) {
  await requireAdmin();
  const { id, ...data } = UpdateProductSchema.parse(input);

  const existing = await prisma.product.findUnique({ where: { id } });
  const becomingActive =
    existing?.status !== 'ACTIVE' && data.status === 'ACTIVE';

  const product = await prisma.product.update({
    where: { id },
    data: {
      ...data,
      ...(becomingActive && { publishedAt: new Date() }),
    },
  });

  revalidatePath('/admin/products');
  revalidatePath(`/product/${product.slug}`);
  revalidatePath('/drops');
  return product;
}

export async function deleteProduct(id: string) {
  await requireAdmin();

  // 1. Load the product with its images so we can attempt Storage cleanup
  const product = await prisma.product.findUnique({
    where: { id },
    select: {
      slug: true,
      images: { select: { url: true } },
      variants: { select: { id: true } },
    },
  });

  if (!product) throw new Error('Product not found');

  // 2. Attempt to delete files from Supabase Storage (best-effort — never blocks DB delete)
  if (product.images.length > 0) {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      // Extract the storage path from the public URL
      // URL format: https://<project>.supabase.co/storage/v1/object/public/product-images/<path>
      const filePaths = product.images
        .map((img) => {
          try {
            const url = new URL(img.url);
            const marker = '/object/public/product-images/';
            const idx = url.pathname.indexOf(marker);
            return idx !== -1 ? url.pathname.slice(idx + marker.length) : null;
          } catch {
            return null;
          }
        })
        .filter(Boolean) as string[];

      if (filePaths.length > 0) {
        const { error } = await supabaseAdmin.storage
          .from('product-images')
          .remove(filePaths);
        if (error) {
          console.error('[deleteProduct] Storage cleanup failed (continuing):', error.message);
        }
      }
    } catch (err) {
      console.error('[deleteProduct] Storage cleanup exception (continuing):', err);
    }
  }

  // 3. Transactional database teardown — children before parent
  await prisma.$transaction(async (tx) => {
    const variantIds = product.variants.map((v) => v.id);

    // 3a. Inventory movements → Inventory
    if (variantIds.length > 0) {
      const inventoryRecords = await tx.inventory.findMany({
        where: { variantId: { in: variantIds } },
        select: { id: true },
      });
      const inventoryIds = inventoryRecords.map((i) => i.id);

      if (inventoryIds.length > 0) {
        await tx.inventoryMovement.deleteMany({ where: { inventoryId: { in: inventoryIds } } });
      }
      await tx.inventory.deleteMany({ where: { variantId: { in: variantIds } } });
    }

    // 3b. Order items that reference these variants — disconnect by nullifying or skip
    //     (OrderItems store snapshots; they survive product deletion by design)

    // 3c. Variants → Images → Tags → Wishlist items → Product
    await tx.productVariant.deleteMany({ where: { productId: id } });
    await tx.productImage.deleteMany({ where: { productId: id } });
    await tx.productTag.deleteMany({ where: { productId: id } });
    await tx.wishlistItem.deleteMany({ where: { productId: id } });
    await tx.product.delete({ where: { id } });
  });

  revalidatePath('/admin/products');
  revalidatePath(`/product/${product.slug}`);
  revalidatePath('/drops');
  revalidatePath('/');
}


export async function upsertProductRecord(input: UpsertProductInput) {
  await requireAdmin();
  const { id, variants, images, ...productData } = UpsertProductSchema.parse(input);

  const existing = id ? await prisma.product.findUnique({ where: { id } }) : null;
  const becomingActive = existing?.status !== 'ACTIVE' && productData.status === 'ACTIVE';

  const product = await prisma.$transaction(async (tx) => {
    // 1. Upsert Product
    const p = await tx.product.upsert({
      where: { id: id || 'new_record' },
      update: {
        ...productData,
        ...(becomingActive && { publishedAt: new Date() }),
      },
      create: {
        ...productData,
        publishedAt: productData.status === 'ACTIVE' ? new Date() : null,
      },
    });

    // 2. Manage Images (Delete removed, Upsert active)
    if (images) {
      const incomingImageUrls = images.map((img) => img.url);
      await tx.productImage.deleteMany({
        where: { productId: p.id, url: { notIn: incomingImageUrls } },
      });

      for (const img of images) {
        if (img.id) {
          await tx.productImage.update({
            where: { id: img.id },
            data: { position: img.position, isCover: img.isCover, alt: img.alt },
          });
        } else {
          await tx.productImage.create({
            data: {
              productId: p.id,
              url: img.url,
              position: img.position,
              isCover: img.isCover,
              alt: img.alt,
            },
          });
        }
      }
    }

    // 3. Manage Variants & Inventory (Archive removed, Upsert active)
    const incomingSkus = variants.map((v) => v.sku);

    // Archive variants that are not in the incoming payload
    await tx.productVariant.updateMany({
      where: { productId: p.id, sku: { notIn: incomingSkus } },
      data: { isActive: false },
    });

    for (const v of variants) {
      const { initialStock, ...variantData } = v;
      const existingVariant = await tx.productVariant.findUnique({ where: { sku: v.sku } });
      let variantId = existingVariant?.id;

      if (existingVariant) {
        await tx.productVariant.update({
          where: { id: existingVariant.id },
          data: { ...variantData, isActive: true }, // reactivate if archived
        });
        
        // Update stock if initialStock is provided during edit
        if (initialStock !== undefined) {
          await tx.inventory.update({
             where: { variantId: existingVariant.id },
             data: { totalStock: initialStock }
          });
        }
      } else {
        const newV = await tx.productVariant.create({
          data: { ...variantData, productId: p.id },
        });
        variantId = newV.id;

        // Create initial inventory for new variant
        await tx.inventory.create({
          data: {
            variantId: variantId,
            totalStock: initialStock || 0,
            type: 'PERMANENT',
          },
        });
      }
    }
    return p;
  });

  revalidatePath('/admin/products');
  if (product.slug) revalidatePath(`/product/${product.slug}`);
  revalidatePath('/drops');
  return product;
}

// ── VARIANTS ─────────────────────────────────────────────────────────────────

export async function createVariant(input: CreateVariantInput) {
  await requireAdmin();
  const data = CreateVariantSchema.parse(input);

  const variant = await prisma.$transaction(async (tx) => {
    const v = await tx.productVariant.create({
      data: {
        productId: data.productId,
        sku: data.sku,
        size: data.size,
        color: data.color,
        colorHex: data.colorHex,
        price: data.price,
        comparePrice: data.comparePrice,
        position: data.position,
      },
    });

    // Create empty inventory record for the new variant
    await tx.inventory.create({
      data: {
        variantId: v.id,
        totalStock: 0,
        type: 'PERMANENT',
      },
    });

    return v;
  });

  revalidatePath('/admin/products');
  return variant;
}

// ── INVENTORY ────────────────────────────────────────────────────────────────

export async function adjustInventory(
  variantId: string,
  delta: number,
  reason: string,
  type:
    | 'RESTOCK'
    | 'ADJUSTMENT'
    | 'PURCHASE'
    | 'CANCEL'
    | 'RETURN' = 'ADJUSTMENT'
) {
  await requireAdmin();

  return prisma.$transaction(async (tx) => {
    const inventory = await tx.inventory.findUnique({
      where: { variantId },
    });
    if (!inventory) throw new Error('Inventory record not found');

    const updated = await tx.inventory.update({
      where: { variantId },
      data: { totalStock: { increment: delta } },
    });

    await tx.inventoryMovement.create({
      data: {
        inventoryId: inventory.id,
        delta,
        type,
        reason,
      },
    });

    return updated;
  });
}

// ── DROPS ────────────────────────────────────────────────────────────────────

export async function getDrops() {
  return prisma.drop.findMany({
    include: {
      products: {
        select: { id: true, name: true, status: true },
      },
    },
    orderBy: { releaseAt: 'desc' },
  });
}

export async function createDrop(input: CreateDropInput) {
  await requireAdmin();
  const data = CreateDropSchema.parse(input);

  const drop = await prisma.drop.create({ data: data as any });
  revalidatePath('/admin/drops');
  return drop;
}

export async function updateDropStatus(
  dropId: string,
  status: 'DRAFT' | 'SCHEDULED' | 'LIVE' | 'ENDED' | 'ARCHIVED'
) {
  await requireAdmin();
  const drop = await prisma.drop.update({
    where: { id: dropId },
    data: { status },
  });
  revalidatePath('/admin/drops');
  revalidatePath('/drops');
  return drop;
}

// ── CATEGORIES ───────────────────────────────────────────────────────────────

export async function getCategories() {
  return prisma.category.findMany({ orderBy: { position: 'asc' } });
}

export async function createCategory(name: string, slug: string) {
  await requireAdmin();
  const category = await prisma.category.create({ data: { name, slug } });
  revalidatePath('/admin/products');
  return category;
}
