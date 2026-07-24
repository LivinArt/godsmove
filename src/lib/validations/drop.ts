import { z } from 'zod';

// ── ENUMS ────────────────────────────────────────────────────────────────────

export const DropStatusEnum = z.enum([
  'DRAFT',
  'SCHEDULED',
  'LIVE',
  'ENDED',
  'ARCHIVED',
]);

// ── HELPERS ──────────────────────────────────────────────────────────────────

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const optionalDatetime = z
  .string()
  .datetime({ message: 'Must be a valid ISO datetime' })
  .optional()
  .nullable();

// ── FIELD DEFINITIONS ─────────────────────────────────────────────────────────
// NOTE: No .superRefine() here — .partial() cannot be used on refined schemas.
// Refinements are applied individually to each derived schema below.

const DropFields = z.object({
  name: z.string().min(1, 'Name is required').max(120),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .regex(slugRegex, 'Slug must be lowercase letters, numbers, and hyphens only'),
  tagline: z.string().max(200).optional().nullable(),
  description: z.string().optional().nullable(),
  manifesto: z.string().optional().nullable(),
  heroImageUrl: z
    .string()
    .url('Must be a valid URL')
    .optional()
    .nullable()
    .or(z.literal('')),
  launchAt: optionalDatetime,
  endAt: optionalDatetime,
  status: DropStatusEnum.default('DRAFT'),
  isFeatured: z.boolean().default(false),
  showCountdown: z.boolean().default(true),
  maxUnits: z
    .number()
    .int()
    .positive('Must be a positive integer')
    .optional()
    .nullable(),
  productIds: z.array(z.string()).default([]),
});

// ── DATE VALIDATION REFINE ───────────────────────────────────────────────────

function validateDates(
  data: { launchAt?: string | null; endAt?: string | null },
  ctx: z.RefinementCtx
) {
  if (data.launchAt && data.endAt) {
    if (new Date(data.endAt) <= new Date(data.launchAt)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'End date must be after launch date',
        path: ['endAt'],
      });
    }
  }
}

// ── CRUD SCHEMAS ─────────────────────────────────────────────────────────────

/** Create — full field set + date cross-validation */
export const CreateDropSchema = DropFields.superRefine(validateDates);

/** Update — all fields optional except id; date cross-validation */
export const UpdateDropSchema = DropFields.partial()
  .extend({
    id: z.string().cuid('Invalid drop ID'),
    productIds: z.array(z.string()).optional(),
  })
  .superRefine(validateDates);

/** Upsert — used by DropForm for both create and edit paths */
export const UpsertDropSchema = DropFields.extend({
  id: z.string().cuid().optional(),
}).superRefine(validateDates);

// ── TYPES ─────────────────────────────────────────────────────────────────────

export type DropStatusType = z.infer<typeof DropStatusEnum>;
export type CreateDropInput = z.infer<typeof CreateDropSchema>;
export type UpdateDropInput = z.infer<typeof UpdateDropSchema>;
export type UpsertDropInput = z.infer<typeof UpsertDropSchema>;
