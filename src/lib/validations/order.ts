import { z } from 'zod';

export const ShippingAddressSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(60),
  lastName: z.string().min(1, 'Last name is required').max(60),
  email: z.string().email('Invalid email address'),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Invalid Indian phone number (10 digits, starts with 6-9)'),
  line1: z.string().min(1, 'Address is required').max(200),
  line2: z.string().max(200).optional(),
  landmark: z.string().max(200).optional(),
  city: z.string().min(1, 'City is required').max(80),
  state: z.string().min(1, 'State is required').max(80),
  pincode: z
    .string()
    .regex(/^[1-9][0-9]{5}$/, 'Invalid Indian pincode'),
  label: z.string().max(20).optional(),
});

export const CreateOrderSchema = z.object({
  items: z
    .array(
      z.object({
        variantId: z.string().cuid(),
        quantity: z.number().int().positive().max(10),
      })
    )
    .min(1, 'Cart cannot be empty'),
  shippingAddress: ShippingAddressSchema,
  paymentMethod: z.enum(['RAZORPAY', 'COD', 'WALLET', 'MIXED']),
  couponCode: z.string().optional(),
  walletAmountToUse: z.number().min(0).default(0),
});

export const UpdateOrderStatusSchema = z.object({
  orderId: z.string().cuid(),
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
  orderId: z.string().cuid(),
  carrier: z.string().min(1),
  trackingNumber: z.string().min(1),
  trackingUrl: z.string().url().optional(),
});

export type ShippingAddressInput = z.infer<typeof ShippingAddressSchema>;
export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof UpdateOrderStatusSchema>;
export type AddTrackingInput = z.infer<typeof AddTrackingSchema>;
