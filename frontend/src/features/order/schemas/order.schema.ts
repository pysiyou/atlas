import { z } from 'zod';
import { dateStringSchema, positiveIntSchema } from '@/shared/schemas/common.schema';

export const orderTestSchema = z.object({
  id: z.number().int().positive().optional(),
  testCode: z.string(),
  testName: z.string(),
  sampleType: z.string(),
  status: z.enum(['pending', 'collected', 'processing', 'validated', 'escalated', 'superseded', 'removed']),
  priceAtOrder: z.number().min(0),
  sampleId: z.number().int().positive().nullable().optional(), // Backend returns null
  results: z.record(z.string(), z.unknown()).nullable().optional(),
  resultEnteredAt: z.string().datetime().nullable().optional(), // Backend returns null
  enteredBy: z.string().nullable().optional(), // Backend returns null
  resultValidatedAt: z.string().datetime().nullable().optional(), // Backend returns null
  validatedBy: z.string().nullable().optional(), // Backend returns null
  validationNotes: z.string().nullable().optional(), // Backend returns null
  flags: z.array(z.string()).nullable().optional(), // Backend returns null
  technicianNotes: z.string().nullable().optional(), // Backend returns null
  isReflexTest: z.boolean().optional(),
  triggeredBy: z.string().optional(),
  reflexRule: z.string().optional(),
  isRepeatTest: z.boolean().optional(),
  repeatReason: z.string().optional(),
  originalTestId: z.number().int().positive().optional(),
  repeatNumber: z.number().int().nonnegative().optional(), // Backend returns 0 for original, allow 0
  isRetest: z.boolean().optional(),
  retestOfTestId: z.number().int().positive().nullable().optional(), // Backend returns null
  retestNumber: z.number().int().nonnegative().optional(), // Backend returns 0 for original, allow 0
  retestOrderTestId: z.number().int().positive().nullable().optional(), // Backend returns null
  resultRejectionHistory: z.array(z.object({
    rejectedAt: z.string(),
    rejectedBy: z.string(),
    rejectionReason: z.string(),
    rejectionType: z.enum(['re-test', 're-collect', 'escalate', 'authorize_retest']),
  })).nullable().optional(), // Backend returns null
});

export const orderSchema = z.object({
  orderId: positiveIntSchema, // Backend returns orderId, not id
  patientId: positiveIntSchema,
  patientName: z.string(), // From backend relationship
  orderDate: dateStringSchema,
  tests: z.array(orderTestSchema).min(1, 'At least one test is required'),
  totalPrice: z.number().min(0),
  paymentStatus: z.enum(['unpaid', 'paid', 'refunded']),
  overallStatus: z.enum(['ordered', 'in-progress', 'completed', 'cancelled']), // Backend returns overallStatus, not orderStatus
  priority: z.enum(['routine', 'urgent', 'stat']),
  referringPhysician: z.string().nullable().optional(), // Backend allows null
  clinicalNotes: z.string().nullable().optional(), // Backend allows null
  specialInstructions: z.array(z.string()).nullable().optional(), // Backend optional
  patientPrepInstructions: z.string().nullable().optional(), // Backend optional
  createdBy: z.string(), // Backend returns string user ID
  createdAt: dateStringSchema,
  updatedAt: dateStringSchema,
});

export type Order = z.infer<typeof orderSchema>;
export type OrderTest = z.infer<typeof orderTestSchema>;

// Form schema for CREATE (all required fields enforced)
export const orderCreateSchema = z.object({
  patientId: positiveIntSchema,
  referringPhysician: z.string().min(1),
  priority: z.enum(['routine', 'urgent', 'stat']),
  clinicalNotes: z.string().optional(),
  testCodes: z.array(z.string()).min(1, 'At least one test is required'),
  paymentMethod: z.enum(['cash', 'credit-card', 'debit-card', 'insurance', 'bank-transfer', 'mobile-money']).optional(),
});

// Form schema for UPDATE (all fields optional for partial updates)
export const orderUpdateSchema = orderCreateSchema.partial();

// Legacy: keep orderFormSchema as alias to createSchema for backwards compatibility
export const orderFormSchema = orderCreateSchema;

export type OrderFormInput = z.infer<typeof orderFormSchema>;
export type OrderCreateInput = z.infer<typeof orderCreateSchema>;
export type OrderUpdateInput = z.infer<typeof orderUpdateSchema>;
