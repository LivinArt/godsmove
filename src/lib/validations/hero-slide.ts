import { z } from 'zod';

const alignment = z.enum(['left', 'center', 'right']);

const imageRef = z
  .string()
  .min(1)
  .max(2000)
  .refine(
    (s) => s.startsWith('/') || /^https?:\/\//i.test(s),
    'Image must be a site path (/) or absolute URL'
  );

export const HeroSlideUpsertSchema = z.object({
  image: imageRef,
  mobileImage: z
    .string()
    .max(2000)
    .nullish()
    .transform((s) => {
      if (s == null) return null;
      const t = s.trim();
      return t === '' ? null : t;
    })
    .refine((s) => s == null || s.startsWith('/') || /^https?:\/\//i.test(s), {
      message: 'Mobile image must be a site path or URL',
    }),
  eyebrow: z.string().min(1).max(120),
  headline: z.string().min(1).max(200),
  narrative: z.string().min(1).max(1200),
  ctaLabel: z.string().min(1).max(80),
  ctaHref: z.string().min(1).max(500),
  alignment: alignment.default('left'),
  overlayOpacity: z.coerce.number().min(0).max(1),
  sortOrder: z.coerce.number().int().min(0).max(9999).optional(),
  isActive: z.coerce.boolean().default(true),
});

export type HeroSlideUpsertInput = z.infer<typeof HeroSlideUpsertSchema>;
