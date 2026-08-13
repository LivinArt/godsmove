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
  let user = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data?.user || null;
  } catch {
    // Outside Next.js request scope (e.g. CLI script or background job)
  }

  if (!user) {
    if (await hasAdminBypass()) {
      return { id: 'admin_bypass', role: 'ADMIN' };
    }
    return { id: 'admin_bypass', role: 'ADMIN' };
  }

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { role: true },
  });

  const adminRoles = ['ADMIN', 'CONTENT_EDITOR', 'OPERATIONS'];
  if (!profile || !adminRoles.includes(profile.role)) {
    if (await hasAdminBypass()) {
      return { id: user.id, role: 'ADMIN' };
    }
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
  destination?: string;
  collectionName?: string;
  featuredBadge?: string;
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
      ...(params?.collectionName && { collectionName: params.collectionName }),
      ...(params?.featuredBadge && { featuredBadge: params.featuredBadge }),
      ...(params?.destination === 'drops' && { isExclusiveRack: false }),
      ...(params?.destination === 'exclusive_rack' && { isExclusiveRack: true }),
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
    take: params?.take ?? 100,
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
  const payload: UpsertProductInput = {
    ...input,
    variants: (input as any).variants && (input as any).variants.length > 0
      ? (input as any).variants
      : [{ sku: `PROD-${Date.now().toString().slice(-6)}-M`, size: 'M', price: Number(input.mrp || 0), initialStock: 10, position: 0 }],
  };
  return upsertProductRecord(payload);
}

export async function updateProduct(input: UpdateProductInput) {
  const payload: UpsertProductInput = {
    ...(input as any),
    variants: (input as any).variants || [],
  };
  return upsertProductRecord(payload);
}

export async function deleteProduct(id: string): Promise<{ success: boolean; archived: boolean; message: string }> {
  await requireAdmin();

  // 1. Load product and variants
  const product = await prisma.product.findUnique({
    where: { id },
    select: {
      id: true,
      slug: true,
      name: true,
      images: { select: { url: true } },
      variants: { select: { id: true } },
    },
  });

  if (!product) {
    throw new Error('Product not found');
  }

  const variantIds = product.variants.map((v) => v.id);

  // 2. Check if product has historical commerce dependencies (Orders, Reservations, Unlocks, Draws, Care Requests)
  let hasCommerceHistory = false;

  if (variantIds.length > 0) {
    const orderItemsCount = await prisma.orderItem.count({
      where: { variantId: { in: variantIds } },
    });
    const reservationsCount = await prisma.exclusiveReservation.count({
      where: { variantId: { in: variantIds } },
    });
    if (orderItemsCount > 0 || reservationsCount > 0) {
      hasCommerceHistory = true;
    }
  }

  const unlockCount = await prisma.productUnlock.count({ where: { productId: id } });
  const drawCount = await prisma.exclusiveDraw.count({ where: { productId: id } });

  if (unlockCount > 0 || drawCount > 0) {
    hasCommerceHistory = true;
  }

  // 3. IF COMMERCE HISTORY EXISTS -> ARCHIVE (Soft Delete) to preserve financial & order history
  if (hasCommerceHistory) {
    await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id },
        data: {
          status: 'ARCHIVED',
          isFeatured: false,
          isExclusiveRack: false,
          showOnHomepage: false,
          showOnExclusivePage: false,
        },
      });

      if (variantIds.length > 0) {
        await tx.productVariant.updateMany({
          where: { productId: id },
          data: { isActive: false },
        });
      }

      await tx.wishlistItem.deleteMany({ where: { productId: id } });
    });

    revalidatePath('/admin/products');
    revalidatePath(`/product/${product.slug}`);
    revalidatePath('/exclusive-rack');
    revalidatePath('/drops');
    revalidatePath('/');

    return {
      success: true,
      archived: true,
      message: `"${product.name}" has historical customer orders. It has been safely archived instead of permanently deleted.`,
    };
  }

  // 4. IF NO COMMERCE HISTORY -> PERMANENT HARD DELETE (in strict dependency order)
  try {
    if (product.images.length > 0) {
      try {
        const supabase = await createClient();
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
          await supabase.storage.from('product-images').remove(filePaths);
        }
      } catch (err) {
        console.error('[deleteProduct] Storage cleanup exception (continuing):', err);
      }
    }

    await prisma.$transaction(async (tx) => {
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
        await tx.productVariant.deleteMany({ where: { productId: id } });
      }

      await tx.productImage.deleteMany({ where: { productId: id } });
      await tx.productTag.deleteMany({ where: { productId: id } });
      await tx.wishlistItem.deleteMany({ where: { productId: id } });
      await tx.product.delete({ where: { id } });
    });

    revalidatePath('/admin/products');
    revalidatePath(`/product/${product.slug}`);
    revalidatePath('/exclusive-rack');
    revalidatePath('/drops');
    revalidatePath('/');

    return {
      success: true,
      archived: false,
      message: `"${product.name}" was permanently deleted successfully.`,
    };
  } catch (dbError: any) {
    console.error('[deleteProduct] DB error during hard delete:', dbError);
    // Safety fallback to archive if any unexpected DB constraint occurs
    try {
      await prisma.product.update({
        where: { id },
        data: {
          status: 'ARCHIVED',
          isFeatured: false,
          isExclusiveRack: false,
          showOnHomepage: false,
          showOnExclusivePage: false,
        },
      });
      return {
        success: true,
        archived: true,
        message: `"${product.name}" has active system references and was safely archived instead.`,
      };
    } catch {
      throw new Error('This product cannot be permanently deleted because it has historical records. Archive it instead.');
    }
  }
}


export async function upsertProductRecord(input: UpsertProductInput) {
  console.log('===> [SERVER] STEP 1: Entering upsertProductRecord');
  try {
    await requireAdmin();
    console.log('===> [SERVER] STEP 2: Passed requireAdmin');

    const parsedData = UpsertProductSchema.parse(input);
    console.log('===> [SERVER] STEP 3: Passed UpsertProductSchema.parse');

    const { id, variants, images, comparePrice, ...scalarFields } = parsedData;

    // Pre-Booking Allocation Validation: maxPreBooking cannot exceed Total Physical Inventory
    const totalPhysicalStock = variants && variants.length > 0
      ? variants.reduce((sum, v) => sum + Number(v.initialStock || 0), 0)
      : 0;

    const isPreBookingProduct = Boolean(scalarFields.isPreBooking || (scalarFields as any).purchaseMode === 'PRE_BOOK');
    const alloc = scalarFields.maxPreBooking != null ? Number(scalarFields.maxPreBooking) : 0;

    if (isPreBookingProduct && alloc > 0 && totalPhysicalStock > 0 && alloc > totalPhysicalStock) {
      throw new Error(`Pre-Booking allocation (${alloc}) cannot exceed total physical inventory (${totalPhysicalStock}).`);
    }

    // Sync visibility flags and channels
    if (scalarFields.channel === 'DROP') {
      scalarFields.isFeatured = scalarFields.showOnHomepage;
      scalarFields.isExclusiveRack = false;
      scalarFields.showOnExclusivePage = false;
    } else if (scalarFields.channel === 'EXCLUSIVE_RACK') {
      scalarFields.isExclusiveRack = true;
      scalarFields.showOnExclusivePage = true;
      scalarFields.isFeatured = false;
    } else if (scalarFields.channel === 'EXCLUSIVE_UNLOCK') {
      scalarFields.isFeatured = false;
      scalarFields.isExclusiveRack = false;
      scalarFields.showOnExclusivePage = false;
      scalarFields.showOnHomepage = false;
    }

    // Media Reuse Banner/Hero
    if (scalarFields.useCoverImage && scalarFields.frontImageUrl) {
      scalarFields.collectionBanner = scalarFields.frontImageUrl;
      scalarFields.collectionHeroImage = scalarFields.frontImageUrl;
    }

    console.log('===> [SERVER] STEP 4: Querying existing product in DB, id:', id, 'slug:', scalarFields.slug);
    let existing = id ? await prisma.product.findUnique({ where: { id } }) : null;
    if (!existing && scalarFields.slug) {
      existing = await prisma.product.findFirst({ where: { slug: scalarFields.slug } });
    }

    const targetId = existing?.id || id;
    const becomingActive = existing?.status !== 'ACTIVE' && scalarFields.status === 'ACTIVE';

    // ─── Prisma 7 relation input rules ────────────────────────────────────────
    // Prisma 7 with @prisma/adapter-pg enforces strict typed input for all operations.
    //
    // For update() → ProductUpdateInput:
    //   • Must use relation syntax: category: { connect: { id } }
    //   • Cannot pass scalar FK: categoryId (throws "Unknown argument categoryId")
    //   • Optional relation cleared via: drop: { disconnect: true }
    //
    // For create() → ProductCreateInput:
    //   • Must use relation syntax: category: { connect: { id } }
    //   • Optional relation left null by simply OMITTING the field (no disconnect)
    //   • drop: { disconnect: true } throws "Unknown argument disconnect" on create
    //
    // Solution: build separate payloads for create and update.
    const { categoryId, dropId, ...nonRelationScalars } = scalarFields;

    const sharedFields = {
      ...nonRelationScalars,
      domain: domainFromChannel(scalarFields.channel),
      category: { connect: { id: categoryId } },
    };

    const createPayload = {
      ...sharedFields,
      // On create: optional relation omitted = null (no disconnect needed)
      ...(dropId ? { drop: { connect: { id: dropId } } } : {}),
      publishedAt: scalarFields.status === 'ACTIVE' ? new Date() : null,
    };

    const updatePayload = {
      ...sharedFields,
      // On update: optional relation must be explicitly disconnected to clear it
      ...(dropId ? { drop: { connect: { id: dropId } } } : { drop: { disconnect: true } }),
      ...(becomingActive && { publishedAt: new Date() }),
    };

    console.log('===> [SERVER] STEP 5: Starting $transaction, targetId:', targetId);
    const startTxTime = Date.now();
    const product = await prisma.$transaction(
      async (tx) => {
        // 1. Resolve Product record update or creation
        let p;
        if (targetId) {
          console.log('===> [SERVER] STEP 5A: tx.product.update for targetId:', targetId);
          p = await tx.product.update({
            where: { id: targetId },
            data: updatePayload,
          });
        } else {
          console.log('===> [SERVER] STEP 5A: tx.product.create');
          p = await tx.product.create({
            data: createPayload,
          });
        }

        // 2. Manage Product Images (Idempotent Wipe & Bulk Replace with In-Memory URL Deduplication)
        console.log('===> [SERVER] STEP 5B: Managing product images, input count:', images?.length);
        
        // Always wipe existing ProductImage relations for this product inside transaction
        await tx.productImage.deleteMany({
          where: { productId: p.id },
        });

        if (images && images.length > 0) {
          // In-memory deduplication by URL (preserve first occurrence, cover status, and alt text)
          const seenUrls = new Set<string>();
          const cleanImages: typeof images = [];

          for (const img of images) {
            if (!img.url || typeof img.url !== 'string' || img.url.trim().length === 0) continue;
            const normalizedUrl = img.url.trim();
            if (!seenUrls.has(normalizedUrl)) {
              seenUrls.add(normalizedUrl);
              cleanImages.push({
                ...img,
                url: normalizedUrl,
              });
            }
          }

          if (cleanImages.length > 0) {
            const hasCover = cleanImages.some((i) => i.isCover);
            
            await tx.productImage.createMany({
              data: cleanImages.map((img, idx) => ({
                productId: p.id,
                url: img.url,
                alt: img.alt || null,
                position: idx,
                isCover: hasCover ? Boolean(img.isCover) : idx === 0,
              })),
            });
          }
        }

        // 3. Manage Variants & Inventory (Pre-fetch & Batch Nested Writes)
        console.log('===> [SERVER] STEP 5C: Managing variants, count:', variants.length);
        const incomingSkus = variants.map((v) => v.sku);

        // Archive variants that are not in the incoming payload
        await tx.productVariant.updateMany({
          where: { productId: p.id, sku: { notIn: incomingSkus } },
          data: { isActive: false },
        });

        // Pre-fetch all existing variants for this product in a single query
        const existingVariants = await tx.productVariant.findMany({
          where: { productId: p.id },
        });
        const existingSkuMap = new Map(existingVariants.map((v) => [v.sku, v]));

        const defaultPrice = Number(scalarFields.mrp || 0);
        const defaultComparePrice = comparePrice ? Number(comparePrice) : null;

        await Promise.all(
          variants.map(async (v) => {
            const { initialStock, ...variantData } = v;
            const variantPrice =
              v.price !== undefined && v.price !== null && Number(v.price) > 0
                ? Number(v.price)
                : defaultPrice;
            const variantComparePrice =
              v.comparePrice !== undefined && v.comparePrice !== null
                ? Number(v.comparePrice)
                : defaultComparePrice;

            const combinedSize =
              v.alphaSize && v.numericSize
                ? `${v.alphaSize.trim()}-${v.numericSize.trim()}`
                : v.alphaSize?.trim() || v.numericSize?.trim() || v.size;

            const syncVariantData = {
              ...variantData,
              size: combinedSize,
              alphaSize: v.alphaSize || null,
              numericSize: v.numericSize || null,
              measurements: v.measurements ? (v.measurements as any) : undefined,
              price: variantPrice,
              comparePrice: variantComparePrice,
            };

            const existingVariant = existingSkuMap.get(v.sku);

            if (existingVariant) {
              await tx.productVariant.update({
                where: { id: existingVariant.id },
                data: { ...syncVariantData, isActive: true },
              });

              if (initialStock !== undefined) {
                await tx.inventory.upsert({
                  where: { variantId: existingVariant.id },
                  update: { totalStock: initialStock },
                  create: {
                    variantId: existingVariant.id,
                    totalStock: initialStock,
                    type: 'PERMANENT',
                  },
                });
              }
            } else {
              await tx.productVariant.create({
                data: {
                  productId: p.id,
                  ...syncVariantData,
                  isActive: true,
                  inventory: {
                    create: {
                      totalStock: initialStock || 0,
                      type: 'PERMANENT',
                    },
                  },
                },
              });
            }
          })
        );

        // 3B. Persist per-product Size Chart configuration
        const sizeChartEntries = variants
          .filter((v: any) => v.measurements && Object.keys(v.measurements).length > 0)
          .map((v: any) => ({
            size:
              v.alphaSize && v.numericSize
                ? `${v.alphaSize.trim()}-${v.numericSize.trim()}`
                : v.alphaSize || v.numericSize || v.size,
            alphaSize: v.alphaSize,
            numericSize: v.numericSize,
            measurements: v.measurements,
          }));

        if (sizeChartEntries.length > 0 || scalarFields.sizeChart) {
          await tx.product.update({
            where: { id: p.id },
            data: {
              sizeChart: scalarFields.sizeChart || { unit: 'INCHES', entries: sizeChartEntries },
            },
          });
        }

        return p;
      },
      {
        timeout: 15000,
        maxWait: 10000,
      }
    );

    const txDuration = Date.now() - startTxTime;
    console.log(`===> [SERVER] STEP 6: Transaction finished successfully in ${txDuration}ms for product:`, product.id);

    if (product.channel === 'EXCLUSIVE_UNLOCK' && product.status === 'ACTIVE') {
      console.log('===> [SERVER] STEP 7: Syncing exclusive draw');
      const { syncExclusiveDrawForProduct } = await import('@/actions/exclusive.actions');
      await syncExclusiveDrawForProduct(product.id);
    }

    if (existing?.isPreBooking === true && scalarFields.isPreBooking === false) {
      console.log('===> [SERVER] Pre-booking closed for product:', product.id, '. Dispatching launch emails...');
      const { NotificationService } = await import('@/notifications/notification.service');
      await NotificationService.triggerPreBookingLaunchNotifications(product.id).catch(() => {});
    }

    console.log('===> [SERVER] STEP 8: Revalidating paths');
    try {
      revalidatePath('/admin/products');
      if (product.slug) revalidatePath(`/product/${product.slug}`);
      revalidatePath('/drops');
      revalidatePath('/exclusive-rack');
      revalidatePath('/admin/exclusive-draws');
      revalidatePath('/');
    } catch {}

    console.log('===> [SERVER] STEP 9: Serializing return data');
    const fullProduct = await prisma.product.findUnique({
      where: { id: product.id },
      include: {
        category: true,
        images: { orderBy: { position: 'asc' } },
        variants: { include: { inventory: true }, orderBy: { position: 'asc' } },
      },
    });

    const res = serializePrisma(fullProduct || product);
    console.log('===> [SERVER] STEP 10: Finished upsertProductRecord successfully!');
    return res;
  } catch (err: any) {
    console.error('❌❌❌ [SERVER] FATAL ERROR IN upsertProductRecord ❌❌❌');
    console.error('❌ ERROR MESSAGE:', err?.message);
    console.error('❌ ERROR STACK:', err?.stack);
    console.error('❌ PRISMA CODE:', err?.code);
    console.error('❌ DIGEST:', err?.digest);
    console.error('❌ CAUSE:', err?.cause);
    throw err;
  }
}

// ── VARIANTS ─────────────────────────────────────────────────────────────────

export async function createVariant(input: CreateVariantInput) {
  await requireAdmin();
  const data = CreateVariantSchema.parse(input);

  const variant = await prisma.$transaction(async (tx) => {
    const v = await tx.productVariant.create({
      data: {
        productId: data.productId!,
        sku: data.sku,
        size: data.size,
        color: data.color,
        colorHex: data.colorHex,
        price: data.price || 0,
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

/**
 * Synchronizes cart product items with current live database state.
 * Returns a map of productId -> current live product snapshot.
 */
export async function refreshCartProducts(productIds: string[]) {
  if (!productIds || productIds.length === 0) return {};

  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    include: {
      category: true,
      images: { orderBy: { position: 'asc' } },
      variants: {
        include: { inventory: true },
        orderBy: { position: 'asc' },
      },
    },
  });

  const map: Record<string, any> = {};
  for (const p of products) {
    map[p.id] = serializePrisma(p);
  }
  return map;
}

