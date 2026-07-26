'use server';

import { revalidatePath } from 'next/cache';
import { hasAdminBypass } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { domainFromChannel } from '@/lib/product-domain-sync';
import { serializePrisma } from '@/lib/serialize-prisma';
import {
  CreateProductSchema,
  UpdateProductSchema,
  CreateVariantSchema,
  UpsertProductSchema,
  type CreateProductInput,
  type UpdateProductInput,
  type CreateVariantInput,
  type UpsertProductInput,
} from '@/lib/validations/product';

// ── HELPERS ─────────────────────────────────────────────────────────────────

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

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
  const data = await prisma.product.findMany({
    where: {
      ...(params?.search && {
        OR: [
          { name: { contains: params.search, mode: 'insensitive' } },
          { slug: { contains: params.search, mode: 'insensitive' } },
          { variants: { some: { sku: { contains: params.search, mode: 'insensitive' } } } },
        ],
      }),
      ...(params?.status ? { status: params.status as any } : {}),
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
  return serializePrisma(data);
}

export async function getProductBySlug(slug: string) {
  const data = await prisma.product.findUnique({
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
  return data ? serializePrisma(data) : null;
}

export async function getProductById(id: string) {
  const data = await prisma.product.findUnique({
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
  return data ? serializePrisma(data) : null;
}


export async function createProduct(input: CreateProductInput) {
  await requireAdmin();
  const data = CreateProductSchema.parse(input);

  const product = await prisma.product.create({
    data: {
      ...data,
      domain: domainFromChannel(data.channel),
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

  const existing = await prisma.product.findUnique({
    where: { id },
    select: { status: true },
  });
  const becomingActive =
    existing?.status !== 'ACTIVE' && data.status === 'ACTIVE';

  const channelChanged =
    'channel' in data && data.channel !== undefined && data.channel !== null;

  const product = await prisma.product.update({
    where: { id },
    data: {
      ...data,
      ...(channelChanged && data.channel != null
        ? { domain: domainFromChannel(data.channel) }
        : {}),
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
      const supabase = await createClient();

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
        const { error } = await supabase.storage
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
  const parsedInput = UpsertProductSchema.parse(input);
  const { id, variants, images, ...productData } = parsedInput;

  // Sync visibility flags and channels
  if (productData.channel === 'DROP') {
    productData.isFeatured = productData.showOnHomepage;
    productData.isExclusiveRack = false;
    productData.showOnExclusivePage = false;
  } else if (productData.channel === 'EXCLUSIVE_RACK') {
    productData.isExclusiveRack = true;
    productData.showOnExclusivePage = true;
    productData.isFeatured = false;
  } else if (productData.channel === 'EXCLUSIVE_UNLOCK') {
    productData.isFeatured = false;
    productData.isExclusiveRack = false;
    productData.showOnExclusivePage = false;
    productData.showOnHomepage = false;
  }

  // Media Reuse Banner/Hero
  if (productData.useCoverImage && productData.frontImageUrl) {
    productData.collectionBanner = productData.frontImageUrl;
    productData.collectionHeroImage = productData.frontImageUrl;
  }

  let existing = id ? await prisma.product.findUnique({ where: { id } }) : null;
  if (!existing && productData.slug) {
    existing = await prisma.product.findFirst({ where: { slug: productData.slug } });
  }

  const targetId = existing?.id || id;
  const becomingActive = existing?.status !== 'ACTIVE' && productData.status === 'ACTIVE';

  const productWrite = {
    ...productData,
    domain: domainFromChannel(productData.channel),
  };

  const product = await prisma.$transaction(async (tx) => {
    // 1. Resolve Product record update or creation
    let p;
    if (targetId) {
      p = await tx.product.update({
        where: { id: targetId },
        data: {
          ...productWrite,
          ...(becomingActive && { publishedAt: new Date() }),
        },
      });
    } else {
      p = await tx.product.create({
        data: {
          ...productWrite,
          publishedAt: productData.status === 'ACTIVE' ? new Date() : null,
        },
      });
    }

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

  if (product.channel === 'EXCLUSIVE_UNLOCK' && product.status === 'ACTIVE') {
    const { syncExclusiveDrawForProduct } = await import('@/actions/exclusive.actions');
    await syncExclusiveDrawForProduct(product.id);
  }

  revalidatePath('/admin/products');
  if (product.slug) revalidatePath(`/product/${product.slug}`);
  revalidatePath('/drops');
  revalidatePath('/exclusive-rack');
  revalidatePath('/admin/exclusive-draws');
  revalidatePath('/');
  return serializePrisma(product);
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

// ── CATEGORIES ───────────────────────────────────────────────────────────────

export async function getCategories() {
  return prisma.category.findMany({ orderBy: { position: 'asc' } });
}

export async function getCategoriesWithProductCount() {
  return prisma.category.findMany({
    orderBy: { position: 'asc' },
    include: {
      _count: {
        select: { products: true }
      },
      products: {
        select: { id: true, name: true, slug: true, status: true, isFeatured: true }
      }
    }
  });
}

export async function createCategory(name: string, slug?: string, position = 0, imageUrl?: string | null) {
  await requireAdmin();
  if (!name || !name.trim()) throw new Error('Category name is required');
  
  const trimmedName = name.trim();

  // If a category with this exact name already exists, reuse it!
  const existingCategory = await prisma.category.findFirst({
    where: { name: { equals: trimmedName, mode: 'insensitive' } }
  });
  if (existingCategory) {
    return existingCategory;
  }

  let baseSlug = (slug && slug.trim()) ? slug.trim() : trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  if (!baseSlug) baseSlug = 'category';

  let uniqueSlug = baseSlug;
  let counter = 1;
  while (await prisma.category.findUnique({ where: { slug: uniqueSlug } })) {
    uniqueSlug = `${baseSlug}-${counter++}`;
  }

  const category = await prisma.category.create({
    data: {
      name: trimmedName,
      slug: uniqueSlug,
      position: position || 0,
      imageUrl: imageUrl || null
    }
  });
  revalidatePath('/admin/products');
  revalidatePath('/admin/categories');
  return category;
}

export async function updateCategory(id: string, name: string, slug: string, position?: number, imageUrl?: string | null) {
  await requireAdmin();
  const category = await prisma.category.update({
    where: { id },
    data: {
      name,
      slug,
      ...(position !== undefined && { position }),
      ...(imageUrl !== undefined && { imageUrl: imageUrl || null })
    }
  });
  revalidatePath('/admin/products');
  revalidatePath('/admin/categories');
  revalidatePath('/');
  revalidatePath('/drops');
  revalidatePath('/category/[slug]', 'page');
  return category;
}

export async function deleteCategory(id: string, reassignCategoryId?: string) {
  await requireAdmin();
  
  await prisma.$transaction(async (tx) => {
    if (reassignCategoryId) {
      await tx.product.updateMany({
        where: { categoryId: id },
        data: { categoryId: reassignCategoryId }
      });
    } else {
      // Reassign to fallback category or first available category if exists
      const fallback = await tx.category.findFirst({
        where: { id: { not: id } }
      });
      if (fallback) {
        await tx.product.updateMany({
          where: { categoryId: id },
          data: { categoryId: fallback.id }
        });
      }
    }

    await tx.category.delete({ where: { id } });
  });

  revalidatePath('/admin/products');
  revalidatePath('/admin/categories');
}

export async function isSlugAvailable(slug: string, excludeProductId?: string) {
  const existing = await prisma.product.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!existing) return true;
  if (excludeProductId && existing.id === excludeProductId) return true;
  return false;
}
