import { z } from 'zod';

export const CreateReturnSchema = z.object({
  orderId: z.string().cuid('Invalid order ID'),
  type: z.enum(['EXCHANGE', 'RETURN_FOR_CREDIT']),
  reason: z.string().min(20, 'Please provide more detail (at least 20 characters)').max(1000),
  items: z
    .array(
      z.object({
        orderItemId: z.string().cuid(),
        quantity: z.number().int().positive(),
        reason: z.string().optional(),
      })
    )
    .min(1, 'Select at least one item to return'),
  evidenceUrls: z.array(z.string().url()).max(5).default([]),
});

export const ProcessReturnSchema = z.object({
  returnId: z.string().cuid(),
  status: z.enum(['APPROVED', 'REJECTED', 'RECEIVED', 'COMPLETED']),
  resolution: z.enum(['STORE_CREDIT', 'EXCHANGE_SAME', 'EXCHANGE_DIFF']).optional(),
  creditAmount: z.number().positive().optional(),
  adminNotes: z.string().max(1000).optional(),
});

export const IssueWalletCreditSchema = z.object({
  profileId: z.string(),
  amount: z
    .number()
    .positive('Amount must be positive')
    .max(50000, 'Single credit cannot exceed ₹50,000'),
  type: z.enum([
    'CREDIT_RETURN',
    'CREDIT_PROMOTIONAL',
    'CREDIT_REFERRAL',
    'CREDIT_ADJUSTMENT',
  ]),
  description: z.string().min(1, 'Provide a description for this credit').max(300),
  expiresAt: z.string().datetime().optional().nullable(),
  returnId: z.string().cuid().optional().nullable(),
  orderId: z.string().cuid().optional().nullable(),
});

export type CreateReturnInput = z.infer<typeof CreateReturnSchema>;
export type ProcessReturnInput = z.infer<typeof ProcessReturnSchema>;
export type IssueWalletCreditInput = z.infer<typeof IssueWalletCreditSchema>;
