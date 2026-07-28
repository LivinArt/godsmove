import { z } from 'zod';

export const ShippingAddressSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(60),
  lastName: z.string().min(1, 'Last name is required').max(60),
  email: z.string().email('Invalid email address'),
  phone: z
    .string()
    .transform((val) => val.replace(/\D/g, '').slice(-10))
    .refine((val) => /^[6-9]\d{9}$/.test(val), {
      message: 'Invalid Indian phone number (10 digits, starts with 6-9)',
    }),
  line1: z.string().min(1, 'Address is required').max(200),
  line2: z.string().max(200).optional().nullable().transform((v) => v ?? ''),
  landmark: z.string().max(200).optional().nullable().transform((v) => v ?? ''),
  city: z.string().min(1, 'City is required').max(80),
  state: z.string().min(1, 'State is required').max(80),
  pincode: z
    .string()
    .transform((val) => val.replace(/\D/g, ''))
    .refine((val) => /^[1-9][0-9]{5}$/.test(val), {
      message: 'Invalid Indian pincode (6 digits)',
    }),
  label: z.string().max(20).optional().nullable().transform((v) => v ?? 'Home'),
});

export const CreateOrderSchema = z.object({
  items: z
    .array(
      z.object({
        variantId: z.string().min(1, 'Variant ID is required'),
        quantity: z.number().int().positive().max(10),
      })
    )
    .min(1, 'Cart cannot be empty'),
  shippingAddress: ShippingAddressSchema,
  paymentMethod: z.enum(['RAZORPAY', 'COD', 'WALLET', 'MIXED']),
  couponCode: z.string().optional().nullable().transform((v) => v ?? undefined),
  walletAmountToUse: z.number().min(0).default(0),
});

export const UpdateOrderStatusSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  status: z.enum([
    'PENDING',
    'CONFIRMED',
    'PROCESSING',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED',
    'EXCHANGE_REQUESTED',
    'RETURN_REQUESTED',
  ]),
  adminNotes: z.string().optional(),
});

export const AddTrackingSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  carrier: z.string().min(1),
  trackingNumber: z.string().min(1),
  trackingUrl: z.string().url().optional(),
});

export type ShippingAddressInput = z.infer<typeof ShippingAddressSchema>;
export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof UpdateOrderStatusSchema>;
export type AddTrackingInput = z.infer<typeof AddTrackingSchema>;
