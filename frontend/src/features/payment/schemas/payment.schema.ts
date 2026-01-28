import { z } from 'zod';
import { dateStringSchema, positiveIntSchema } from '@/shared/schemas/common.schema';

export const paymentMethodSchema = z.enum([
  'cash',
  'credit-card',
  'debit-card',
  'insurance',
  'bank-transfer',
  'mobile-money',
]);

export const paymentSchema = z.object({
  paymentId: positiveIntSchema,
  orderId: positiveIntSchema,
  invoiceId: z.number().int().positive().nullable(),
  amount: z.number().min(0),
  paymentMethod: paymentMethodSchema,
  paidAt: dateStringSchema, // Uses dateStringSchema which accepts ISO datetime strings
  receivedBy: z.string(), // Backend returns string user ID, not number
  receiptGenerated: z.boolean(),
  notes: z.string().nullable().optional(), // Backend allows null
  // Computed fields from relationships
  orderTotalPrice: z.number().min(0).optional(),
  numberOfTests: z.number().int().min(0).optional(),
  patientName: z.string().optional(),
});

// Form schema for CREATE (all required fields enforced)
export const paymentCreateSchema = z.object({
  orderId: z.union([z.string(), positiveIntSchema]).transform(val => {
    const num = typeof val === 'string' ? parseInt(val, 10) : val;
    if (isNaN(num) || num <= 0) {
      throw new Error('Invalid orderId');
    }
    return num;
  }),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  paymentMethod: paymentMethodSchema,
  notes: z.string().optional(),
});

// Form schema for UPDATE (all fields optional for partial updates)
export const paymentUpdateSchema = paymentCreateSchema.partial();

// Legacy: keep paymentFormSchema as alias to createSchema for backwards compatibility
export const paymentFormSchema = paymentCreateSchema;

export type Payment = z.infer<typeof paymentSchema>;
export type PaymentFormInput = z.infer<typeof paymentFormSchema>;
export type PaymentCreateInput = z.infer<typeof paymentCreateSchema>;
export type PaymentUpdateInput = z.infer<typeof paymentUpdateSchema>;
export type PaymentMethod = z.infer<typeof paymentMethodSchema>;
