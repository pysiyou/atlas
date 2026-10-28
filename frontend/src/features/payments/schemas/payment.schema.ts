import { z } from 'zod';
import { dateStringSchema, positiveIntSchema } from '@/types/schemas/common.schema';
import { zEnumFromValues } from '@/types/schemas/enumFromValues';
import { PAYMENT_METHOD_VALUES, type PaymentMethod } from '@/types/enums';

export type { PaymentMethod };

export const paymentMethodSchema = zEnumFromValues(PAYMENT_METHOD_VALUES);

export const paymentSchema = z.object({
  paymentId: positiveIntSchema,
  orderId: positiveIntSchema,
  invoiceId: z.number().int().positive().nullable(),
  amount: z.number().min(0),
  paymentMethod: paymentMethodSchema,
  paidAt: dateStringSchema,
  createdBy: z.string(),
  receiptGenerated: z.boolean(),
  notes: z.string().nullable().optional(),
  orderTotalPrice: z.number().min(0).optional(),
  numberOfTests: z.number().int().min(0).optional(),
  patientName: z.string().optional(),
});

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

export const paymentUpdateSchema = paymentCreateSchema.partial();

export type Payment = z.infer<typeof paymentSchema>;
export type PaymentFormInput = z.infer<typeof paymentCreateSchema>;
export type PaymentCreateInput = z.infer<typeof paymentCreateSchema>;
export type PaymentUpdateInput = z.infer<typeof paymentUpdateSchema>;
