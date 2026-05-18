import { z } from 'zod';

const ProductStatusEnum = z.enum(['DRAFT', 'ACTIVE', 'HIDDEN', 'ARCHIVED', 'SOLD_OUT']);
const ProductImageSideEnum = z.enum(['front', 'back']);
export const ProductChannelEnum = z.enum(['DROP', 'EXCLUSIVE_UNLOCK', 'EXCLUSIVE_RACK']);

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
  status: ProductStatusEnum.default('DRAFT'),
  isFeatured: z.boolean().default(false),
  categoryId: z.string().cuid('Invalid category'),
  dropId: z.string().cuid().optional().nullable(),
  channel: ProductChannelEnum.default('DROP'),
  unlockTeaser: z.string().max(500).optional().nullable(),
  exclusiveStory: z.string().max(5000).optional().nullable(),
  countdownDurationDays: z.number().int().min(1).max(90).default(10),
  winnerCount: z.number().int().min(1).max(100).default(3),
  reservationPrice: z.number().positive().max(100000).optional().nullable(),
  refundNonWinnersToWallet: z.boolean().default(true),
  refundWinnersToWallet: z.boolean().default(true),
  exclusiveBadgeText: z.string().max(80).optional().nullable(),
  unlockButtonText: z.string().max(60).optional().nullable(),
  reserveButtonText: z.string().max(60).optional().nullable(),
  enableImageToggle: z.boolean().default(false),
  frontImageUrl: z.string().url().optional().nullable().or(z.literal('')),
  backImageUrl: z.string().url().optional().nullable().or(z.literal('')),
  defaultImageSide: ProductImageSideEnum.default('front'),
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
}).superRefine((data, ctx) => {
  if (data.channel === 'EXCLUSIVE_UNLOCK') {
    if (data.reservationPrice == null || data.reservationPrice <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Reservation price is required when Exclusive Unlock is enabled',
        path: ['reservationPrice'],
      });
    }
  }
  if (data.enableImageToggle) {
    if (!data.frontImageUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Front Image URL is required when Image Toggle is enabled',
        path: ['frontImageUrl'],
      });
    }
    if (!data.backImageUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Back Image URL is required when Image Toggle is enabled',
        path: ['backImageUrl'],
      });
    }
  }
});

export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;
export type CreateVariantInput = z.infer<typeof CreateVariantSchema>;
export type FormVariantInput = z.infer<typeof FormVariantSchema>;
export type UpsertProductInput = z.infer<typeof UpsertProductSchema>;
export type ProductImageInput = z.infer<typeof ProductImageSchema>;
