import { z } from 'zod';

export const CreateCouponSchema = z.object({
  code: z
    .string()
    .min(3, 'Code must be at least 3 characters')
    .max(30)
    .toUpperCase()
    .regex(/^[A-Z0-9_-]+$/, 'Only letters, numbers, underscores, and hyphens allowed'),
  type: z.enum(['PERCENTAGE', 'FLAT_AMOUNT', 'FREE_SHIPPING']),
  value: z
    .number()
    .positive()
    .refine(
      (v) => v <= 100,
      'Percentage discount cannot exceed 100%'
    )
    .or(
      z.number().positive().max(10000, 'Flat discount cannot exceed ₹10,000')
    ),
  minOrderAmount: z.number().positive().optional().nullable(),
  maxUses: z.number().int().positive().optional().nullable(),
  perUserLimit: z.number().int().positive().default(1),
  isActive: z.boolean().default(true),
  startsAt: z.string().datetime().optional().nullable(),
  expiresAt: z.string().datetime().optional().nullable(),
  applicableDropIds: z.array(z.string().cuid()).default([]),
  applicableCategoryIds: z.array(z.string().cuid()).default([]),
  description: z.string().max(300).optional(),
});

export const ValidateCouponSchema = z.object({
  code: z.string().min(1),
  orderAmount: z.number().positive(),
  profileId: z.string().optional(),
  dropIds: z.array(z.string()).default([]),
  categoryIds: z.array(z.string()).default([]),
});

export type CreateCouponInput = z.infer<typeof CreateCouponSchema>;
export type ValidateCouponInput = z.infer<typeof ValidateCouponSchema>;
