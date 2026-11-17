import { PAYMENT_METHOD_VALUES, PAYMENT_STATUS_VALUES, type PaymentMethod } from '@/types/generated/enums';
import {
  dateStringSchema,
  orderIdSchema,
  invoiceIdSchema,
  receiptIdSchema,
  employeeNumberSchema,
  zEnumFromValues,
} from '@/types/zod';
import { z } from 'zod';

export type { PaymentMethod };

export const paymentMethodSchema = zEnumFromValues(PAYMENT_METHOD_VALUES);

export const paymentSchema = z.object({
  paymentId: receiptIdSchema,
  orderId: orderIdSchema,
  invoiceId: invoiceIdSchema.nullable(),
  amount: z.number().min(0),
  paymentMethod: paymentMethodSchema,
  paidAt: dateStringSchema,
  createdBy: employeeNumberSchema,
  receiptGenerated: z.boolean(),
  notes: z.string().nullable().optional(),
  orderTotalPrice: z.number().min(0).optional(),
  numberOfTests: z.number().int().min(0).optional(),
  patientName: z.string().optional(),
  orderPaymentStatus: zEnumFromValues(PAYMENT_STATUS_VALUES).optional().nullable(),
});

export const paymentCreateSchema = z.object({
  orderId: orderIdSchema,
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  paymentMethod: paymentMethodSchema,
  notes: z.string().optional(),
});

export const paymentUpdateSchema = paymentCreateSchema.partial();

export type Payment = z.infer<typeof paymentSchema>;
export type PaymentFormInput = z.infer<typeof paymentCreateSchema>;
export type PaymentCreateInput = z.infer<typeof paymentCreateSchema>;
export type PaymentUpdateInput = z.infer<typeof paymentUpdateSchema>;
