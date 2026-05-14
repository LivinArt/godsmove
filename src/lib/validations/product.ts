import { z } from 'zod';
import { ProductStatus } from '@prisma/client';

export const CreateProductSchema = z.object({
  name: z.string().min(1, 'Name is required').max(120),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase, letters, numbers, and hyphens only'),
  tagline: z.string().max(200).optional(),
  shortDesc: z.string().max(300).optional(),
  description: z.string().min(1, 'Description is required'),
  symbolism: z.string().optional(),
  status: z.nativeEnum(ProductStatus).default('DRAFT'),
  isFeatured: z.boolean().default(false),
  categoryId: z.string().cuid('Invalid category'),
  dropId: z.string().cuid().optional().nullable(),
  seoTitle: z.string().max(60).optional(),
  seoDescription: z.string().max(160).optional(),
});

export const UpdateProductSchema = CreateProductSchema.partial().extend({
  id: z.string().cuid(),
});

// Used for the standalone createVariant action — productId is required here.
export const CreateVariantSchema = z.object({
  productId: z.string().cuid(),
  sku: z.string().min(1, 'SKU is required').max(60),
  size: z.enum(['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'ONE_SIZE']),
  color: z.string().optional().nullable(),
  colorHex: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color')
    .optional()
    .nullable(),
  price: z
    .number()
    .positive('Price must be positive')
    .max(100000, 'Price seems unrealistic'),
  comparePrice: z.number().positive().optional().nullable(),
  position: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  initialStock: z.number().int().min(0).default(0).optional(),
});

// Used inside UpsertProductSchema — productId NOT required from the client.
// The server action assigns productId: p.id after creating/resolving the product.
export const FormVariantSchema = CreateVariantSchema.omit({ productId: true });

export const ProductImageSchema = z.object({
  id: z.string().optional(),
  url: z.string().url(),
  alt: z.string().optional().nullable(),
  position: z.number().int().default(0),
  isCover: z.boolean().default(false),
});

export const UpsertProductSchema = CreateProductSchema.extend({
  id: z.string().cuid().optional(),
  variants: z.array(FormVariantSchema).min(1, 'At least one variant is required'),
  images: z.array(ProductImageSchema).optional(),
});

export const CreateDropSchema = z.object({
  name: z.string().min(1).max(80),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  tagline: z.string().min(1).max(200),
  description: z.string().min(1),
  season: z.string().optional(),
  releaseAt: z.string().datetime().optional().nullable(),
  endsAt: z.string().datetime().optional().nullable(),
  heroImageUrl: z.string().url().optional().nullable(),
  isPasswordProtected: z.boolean().default(false),
  accessPassword: z.string().min(6).optional().nullable(),
});

export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;
export type CreateVariantInput = z.infer<typeof CreateVariantSchema>;
export type FormVariantInput = z.infer<typeof FormVariantSchema>;
export type CreateDropInput = z.infer<typeof CreateDropSchema>;
export type UpsertProductInput = z.infer<typeof UpsertProductSchema>;
export type ProductImageInput = z.infer<typeof ProductImageSchema>;
