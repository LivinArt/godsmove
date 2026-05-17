import { z } from 'zod';

// ── ENUMS ────────────────────────────────────────────────────────────────────

export const DiscountTypeEnum = z.enum([
  'PERCENTAGE',
  'FIXED_AMOUNT',
  'FREE_SHIPPING',
]);

export const DiscountStatusEnum = z.enum([
  'DRAFT',
  'ACTIVE',
  'SCHEDULED',
  'EXPIRED',
  'ARCHIVED',
]);

// ── HELPERS ──────────────────────────────────────────────────────────────────

const optionalDatetime = z
  .string()
  .datetime({ message: 'Must be a valid ISO datetime' })
  .optional()
  .nullable();

// ── FIELD DEFINITIONS ─────────────────────────────────────────────────────────

const DiscountFields = z.object({
  name: z.string().min(1, 'Name is required').max(120),
  code: z
    .string()
    .min(3, 'Code must be at least 3 characters')
    .max(50, 'Code must be under 50 characters')
    .regex(/^[A-Z0-9_-]+$/, 'Code can only contain uppercase letters, numbers, hyphens, and underscores'),
  description: z.string().optional().nullable(),
  
  type: DiscountTypeEnum,
  value: z.number().min(0, 'Value must be positive'),
  
  status: DiscountStatusEnum.default('DRAFT'),
  isActive: z.boolean().default(true),
  
  startsAt: optionalDatetime,
  endsAt: optionalDatetime,
  
  minimumOrderValue: z.number().min(0).optional().nullable(),
  maximumDiscount: z.number().min(0).optional().nullable(),
  
  usageLimit: z.number().int().min(1).optional().nullable(),
  perCustomerLimit: z.number().int().min(1).default(1),
  
  appliesToAll: z.boolean().default(true),
  productIds: z.array(z.string()).default([]),
});

// ── VALIDATION REFINE ───────────────────────────────────────────────────

function validateDiscountRules(
  data: Record<string, any>,
  ctx: z.RefinementCtx
) {
  // Date validation
  if (data.startsAt && data.endsAt) {
    if (new Date(data.endsAt) <= new Date(data.startsAt)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'End date must be after start date',
        path: ['endsAt'],
      });
    }
  }

  // Value validation based on type
  if (data.type === 'PERCENTAGE') {
    if (data.value < 0 || data.value > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Percentage discount must be between 0 and 100',
        path: ['value'],
      });
    }
  }

  if (data.type === 'FREE_SHIPPING') {
    // Value could be forced to 0 or ignored, but let's ensure it isn't invalid
    if (data.value < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Value must be 0 for free shipping',
        path: ['value'],
      });
    }
  }
}

// ── CRUD SCHEMAS ─────────────────────────────────────────────────────────────

/** Create — full field set + rule cross-validation */
export const CreateDiscountSchema = DiscountFields.superRefine(validateDiscountRules);

/** Update — all fields optional except id; rule cross-validation */
export const UpdateDiscountSchema = DiscountFields.partial()
  .extend({
    id: z.string().cuid('Invalid discount ID'),
    productIds: z.array(z.string()).optional(),
  })
  .superRefine(validateDiscountRules);

/** Upsert — used by Form for both create and edit paths */
export const UpsertDiscountSchema = DiscountFields.extend({
  id: z.string().cuid().optional(),
}).superRefine(validateDiscountRules);

// ── TYPES ─────────────────────────────────────────────────────────────────────

export type DiscountTypeType = z.infer<typeof DiscountTypeEnum>;
export type DiscountStatusType = z.infer<typeof DiscountStatusEnum>;
export type CreateDiscountInput = z.infer<typeof CreateDiscountSchema>;
export type UpdateDiscountInput = z.infer<typeof UpdateDiscountSchema>;
export type UpsertDiscountInput = z.infer<typeof UpsertDiscountSchema>;
