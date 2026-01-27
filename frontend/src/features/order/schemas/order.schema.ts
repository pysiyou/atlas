import { z } from 'zod';
import { dateStringSchema, positiveIntSchema } from '@/shared/schemas/common.schema';

export const orderTestSchema = z.object({
  id: z.number().int().positive().optional(),
  testCode: z.string(),
  testName: z.string(),
  sampleType: z.string(),
  status: z.enum(['pending', 'collected', 'processing', 'validated', 'superseded', 'removed']),
  priceAtOrder: z.number().min(0),
  sampleId: z.number().int().positive().optional(),
  results: z.record(z.string(), z.unknown()).nullable().optional(),
  resultEnteredAt: z.string().datetime().optional(),
  enteredBy: z.string().optional(),
  resultValidatedAt: z.string().datetime().optional(),
  validatedBy: z.string().optional(),
  validationNotes: z.string().optional(),
  flags: z.array(z.string()).optional(),
  technicianNotes: z.string().optional(),
  isReflexTest: z.boolean().optional(),
  triggeredBy: z.string().optional(),
  reflexRule: z.string().optional(),
  isRepeatTest: z.boolean().optional(),
  repeatReason: z.string().optional(),
  originalTestId: z.number().int().positive().optional(),
  repeatNumber: z.number().int().positive().optional(),
  isRetest: z.boolean().optional(),
});

export const orderSchema = z.object({
  id: positiveIntSchema,
  orderNumber: z.string(),
  patientId: positiveIntSchema,
  referringPhysician: z.string().min(1),
  priority: z.enum(['routine', 'urgent', 'stat']),
  clinicalNotes: z.string().optional(),
  tests: z.array(orderTestSchema).min(1, 'At least one test is required'),
  totalPrice: z.number().min(0),
  orderStatus: z.enum(['pending', 'collected', 'processing', 'validated', 'cancelled']),
  paymentStatus: z.enum(['unpaid', 'paid', 'refunded']),
  orderDate: dateStringSchema,
  createdAt: dateStringSchema,
  updatedAt: dateStringSchema,
});

export type Order = z.infer<typeof orderSchema>;
export type OrderTest = z.infer<typeof orderTestSchema>;

export const orderFormSchema = z.object({
  patientId: positiveIntSchema,
  referringPhysician: z.string().min(1),
  priority: z.enum(['routine', 'urgent', 'stat']),
  clinicalNotes: z.string().optional(),
  testCodes: z.array(z.string()).min(1, 'At least one test is required'),
  paymentMethod: z.enum(['cash', 'credit-card', 'debit-card', 'insurance', 'bank-transfer', 'mobile-money']).optional(),
});

export type OrderFormInput = z.infer<typeof orderFormSchema>;
