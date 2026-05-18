import { z } from 'zod';
import { ProductChannelEnum } from './product';

const emptyStringToNull = (val: unknown) => (val === '' ? null : val);

const positiveDecimal = z.coerce
  .number()
  .positive('Amount must be positive')
  .max(100000, 'Amount exceeds maximum');

export const ExclusiveProductConfigSchema = z
  .object({
    channel: ProductChannelEnum.default('DROP'),
    unlockTeaser: z.string().max(500).optional().nullable(),
    exclusiveStory: z.string().max(5000).optional().nullable(),
    countdownDurationDays: z.coerce.number().int().min(1).max(90).default(10),
    winnerCount: z.coerce.number().int().min(1).max(100).default(3),
    reservationPrice: z.preprocess(
      emptyStringToNull,
      positiveDecimal.optional().nullable()
    ),
    refundNonWinnersToWallet: z.boolean().default(true),
    refundWinnersToWallet: z.boolean().default(true),
    exclusiveBadgeText: z.string().max(80).optional().nullable(),
    unlockButtonText: z.string().max(60).optional().nullable(),
    reserveButtonText: z.string().max(60).optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.channel === 'EXCLUSIVE_UNLOCK') {
      if (data.reservationPrice == null || data.reservationPrice <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Reservation price is required for exclusive unlock products',
          path: ['reservationPrice'],
        });
      }
      if (data.winnerCount < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'At least one winner is required',
          path: ['winnerCount'],
        });
      }
    }
  });

export const UnlockProductSchema = z.object({
  productId: z.string().cuid(),
});

export const CreateReservationSchema = z.object({
  productId: z.string().cuid(),
  variantId: z.string().cuid(),
});

export const ConfirmReservationPaymentSchema = z.object({
  reservationId: z.string().cuid(),
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
});

export const RunExclusiveDrawSchema = z.object({
  drawId: z.string().cuid(),
});

export const RefundParticipantsSchema = z.object({
  drawId: z.string().cuid(),
  reservationIds: z.array(z.string().cuid()).optional(),
});

export type ExclusiveProductConfigInput = z.infer<typeof ExclusiveProductConfigSchema>;
export type UnlockProductInput = z.infer<typeof UnlockProductSchema>;
export type CreateReservationInput = z.infer<typeof CreateReservationSchema>;
export type ConfirmReservationPaymentInput = z.infer<typeof ConfirmReservationPaymentSchema>;
export type RunExclusiveDrawInput = z.infer<typeof RunExclusiveDrawSchema>;
export type RefundParticipantsInput = z.infer<typeof RefundParticipantsSchema>;
