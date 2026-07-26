import { z } from 'zod';

const ProductStatusEnum = z.enum(['DRAFT', 'ACTIVE', 'HIDDEN', 'ARCHIVED', 'SOLD_OUT']);
const ProductImageSideEnum = z.enum(['front', 'back']);
export const ProductChannelEnum = z.enum(['DROP', 'EXCLUSIVE_UNLOCK', 'EXCLUSIVE_RACK']);

// Allows relative paths (like local dev uploads) and fully qualified absolute URLs
export const imagePathOrUrl = z.string().min(1, 'Image URL/Path is required').refine(
  (val) => val.startsWith('/') || /^(https?:\/\/)/.test(val),
  'Must be a valid relative path or absolute URL'
);

/** HTML number inputs submit strings; empty string should become null for optional fields */
const emptyStringToNull = (val: unknown) => (val === '' ? null : val);

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
  countdownDurationDays: z.coerce.number().int().min(1).max(90).default(10),
  winnerCount: z.coerce.number().int().min(1).max(100).default(3),
  reservationPrice: z.preprocess(
    emptyStringToNull,
    z.coerce.number().positive().max(100000).optional().nullable()
  ),
  refundNonWinnersToWallet: z.boolean().default(true),
  refundWinnersToWallet: z.boolean().default(true),
  exclusiveBadgeText: z.string().max(80).optional().nullable(),
  unlockButtonText: z.string().max(60).optional().nullable(),
  reserveButtonText: z.string().max(60).optional().nullable(),
  enableImageToggle: z.boolean().default(false),
  frontImageUrl: imagePathOrUrl.optional().nullable().or(z.literal('')),
  backImageUrl: imagePathOrUrl.optional().nullable().or(z.literal('')),
  defaultImageSide: ProductImageSideEnum.default('front'),
  seoTitle: z.string().max(60).optional(),
  seoDescription: z.string().max(160).optional(),

  // Merchandising flags (Phase 1)
  isExclusiveRack: z.boolean().default(false),
  showOnHomepage: z.boolean().default(false),
  showOnExclusivePage: z.boolean().default(false),
  featuredPriority: z.coerce.number().int().default(0),
  featuredBadge: z.string().max(100).optional().nullable(),
  featuredHeadline: z.string().max(200).optional().nullable(),
  featuredDescription: z.string().max(1000).optional().nullable(),
  editorStory: z.string().max(10000).optional().nullable(),
  
  // Curated Collection details
  collectionName: z.string().max(120).optional().nullable(),
  collectionBanner: z.string().optional().nullable().or(z.literal('')),
  collectionHeroImage: z.string().optional().nullable().or(z.literal('')),
  collectionHeroVideo: z.string().optional().nullable().or(z.literal('')),
  featuredFrom: z.preprocess(
    emptyStringToNull,
    z.coerce.date().optional().nullable()
  ),
  featuredUntil: z.preprocess(
    emptyStringToNull,
    z.coerce.date().optional().nullable()
  ),
  theme: z.string().default('Black'),

  // Editorial Content (Phase 2)
  whyWeMadeThis: z.string().optional().nullable(),

  // Craftsmanship Stories
  fabricName: z.string().optional().nullable(),
  fabricWhy: z.string().optional().nullable(),
  constructionName: z.string().optional().nullable(),
  constructionWhy: z.string().optional().nullable(),
  printName: z.string().optional().nullable(),
  printWhy: z.string().optional().nullable(),

  // Technical Details
  material: z.string().optional().nullable(),
  fit: z.string().optional().nullable(),
  origin: z.string().optional().nullable(),
  washCare: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  manufacturer: z.string().optional().nullable(),
  mrp: z.preprocess(
    emptyStringToNull,
    z.coerce.number().positive().optional().nullable()
  ),
  comparePrice: z.preprocess(
    emptyStringToNull,
    z.coerce.number().positive().optional().nullable()
  ),
  hsn: z.string().optional().nullable(),
  netQuantity: z.coerce.number().int().default(1),

  // Additional PIM attributes
  barcode: z.string().optional().nullable(),
  costPrice: z.preprocess(
    emptyStringToNull,
    z.coerce.number().positive().optional().nullable()
  ),
  gstPercentage: z.coerce.number().optional().nullable().default(12.0),
  weight: z.preprocess(
    emptyStringToNull,
    z.coerce.number().positive().optional().nullable()
  ),
  weightWithPackaging: z.preprocess(
    emptyStringToNull,
    z.coerce.number().positive().optional().nullable()
  ),
  dimensions: z.string().optional().nullable(),
  shippingClass: z.string().optional().nullable(),
  returnEligible: z.boolean().default(true),
  returnWindowDays: z.coerce.number().int().min(0).default(7),

  // PIM V3.0 Guided creation validation schemas
  brand: z.string().optional().nullable().default('GODSMOVE'),
  warehouse: z.string().optional().nullable().default('Main Warehouse'),
  lowStockThreshold: z.coerce.number().int().min(0).optional().nullable().default(5),
  currency: z.string().optional().nullable().default('INR'),
  lifestyleImages: z.array(z.string()).default([]),
  editorialImages: z.array(z.string()).default([]),
  videos: z.array(z.string()).default([]),
  packaging: z.string().optional().nullable(),
  warranty: z.string().optional().nullable(),
  ownershipInfo: z.string().optional().nullable(),
  editorialNotes: z.string().optional().nullable(),
  garmentLifeCycle: z.string().optional().nullable(),
  useCoverImage: z.boolean().default(true),
  seoCanonicalUrl: z.string().optional().nullable().or(z.literal('')),
  seoOgImage: z.string().optional().nullable().or(z.literal('')),
  seoTwitterTitle: z.string().optional().nullable(),
  seoTwitterDesc: z.string().optional().nullable(),

  // Style curation & association
  styleWithIds: z.array(z.string()).default([]),

  // Future-Proof Extensibility JSON metadata
  metadata: z.any().optional(),
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
  price: z.coerce
    .number()
    .positive('Price must be positive')
    .max(100000, 'Price seems unrealistic'),
  comparePrice: z.preprocess(
    emptyStringToNull,
    z.coerce.number().positive().max(100000).optional().nullable()
  ),
  position: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  initialStock: z.coerce.number().int().min(0).default(0).optional(),
});

// Used inside UpsertProductSchema — productId NOT required from the client.
// The server action assigns productId: p.id after creating/resolving the product.
export const FormVariantSchema = CreateVariantSchema.omit({ productId: true });

export const ProductImageSchema = z.object({
  id: z.string().optional(),
  url: imagePathOrUrl,
  alt: z.string().optional().nullable(),
  position: z.coerce.number().int().default(0),
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
