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
  paidAt: dateStringSchema,
  receivedBy: positiveIntSchema,
  receiptGenerated: z.boolean(),
  notes: z.string().optional(),
  // Computed fields from relationships
  orderTotalPrice: z.number().min(0).optional(),
  numberOfTests: z.number().int().min(0).optional(),
  patientName: z.string().optional(),
});

export const paymentFormSchema = z.object({
  orderId: positiveIntSchema,
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  paymentMethod: paymentMethodSchema,
  notes: z.string().optional(),
});

export type Payment = z.infer<typeof paymentSchema>;
export type PaymentFormInput = z.infer<typeof paymentFormSchema>;
export type PaymentMethod = z.infer<typeof paymentMethodSchema>;
