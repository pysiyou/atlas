import { z } from 'zod';
import {
  accessionSchema,
  dateStringSchema,
  orderIdSchema,
  patientIdSchema,
  referentDoctorIdSchema,
  nullableApiDatetimeSchema,
  employeeNumberSchema,
  labActorUserIdSchema,
  testMnemonicSchema,
} from '@/types/zod';
import { GENDER_VALUES, PAYMENT_STATUS_VALUES } from '@/types/generated/enums';
import {
  ORDER_STATUS_VALUES,
  PRIORITY_LEVEL_VALUES,
  TEST_STATUS_VALUES,
  PAYMENT_METHOD_VALUES,
} from '@/types/generated/enums';
import { zEnumFromValues } from '@/types/zod';
import type { TestStatus } from '@/types';

const apiTestStatusSchema = zEnumFromValues(TEST_STATUS_VALUES);
const normalizedStatusSchema = apiTestStatusSchema.transform((s): TestStatus => s as TestStatus);

export const orderTestSchema = z.object({
  id: z.number().int().positive().optional(),
  testCode: z.string(),
  testName: z.string(),
  sampleType: z.string(),
  status: normalizedStatusSchema,
  priceAtOrder: z.number().min(0),
  sampleId: accessionSchema
    .nullable()
    .optional()
    .transform(v => (v === null ? undefined : v)),
  results: z.record(z.string(), z.unknown()).nullable().optional(),
  resultEnteredAt: nullableApiDatetimeSchema,
  enteredBy: labActorUserIdSchema.nullable().optional(),
  resultValidatedAt: nullableApiDatetimeSchema,
  validatedBy: labActorUserIdSchema.nullable().optional(),
  validationNotes: z.string().nullable().optional(), // Backend returns null
  flags: z.array(z.string()).nullable().optional(), // Backend returns null
  technicianNotes: z.string().nullable().optional(), // Backend returns null
  isReflexTest: z.boolean().optional(),
  triggeredBy: z.string().optional(),
  reflexRule: z.string().optional(),
  isRetest: z.boolean().optional(),
  retestOfTestId: z.number().int().positive().nullable().optional(), // Backend returns null
  retestNumber: z.number().int().nonnegative().optional(), // Backend returns 0 for original, allow 0
  retestOrderTestId: z.number().int().positive().nullable().optional(),
  hasCriticalValues: z.boolean().optional(),
  criticalNotificationSent: z.boolean().optional(),
  criticalNotifiedAt: nullableApiDatetimeSchema,
  criticalNotifiedTo: z.string().nullable().optional(),
  criticalAcknowledgedAt: nullableApiDatetimeSchema,
  lab: z
    .object({
      pipelineStage: z.enum(['collection', 'entry', 'validation', 'completed', 'cancelled']),
      attentionReason: z.string().nullable().optional(),
      attentionLabel: z.string().nullable().optional(),
      denyReason: z.string().nullable().optional(),
      denyMessage: z.string().nullable().optional(),
      allowedActions: z
        .object({
          collect: z.boolean().optional(),
          enterResults: z.boolean().optional(),
          validate: z.boolean().optional(),
          reject: z.boolean().optional(),
        })
        .optional(),
      statusPresentation: z.unknown().nullable().optional(),
      escalation: z.unknown().nullable().optional(),
    })
    .passthrough()
    .nullable()
    .optional(),
  createdAt: dateStringSchema,
  updatedAt: dateStringSchema,
});

export const orderSchema = z.object({
  orderId: orderIdSchema,
  placerNumber: z.string().nullable().optional(),
  patientId: patientIdSchema,
  patientName: z.string(), // From backend relationship
  patientDob: dateStringSchema.optional(),
  patientGender: zEnumFromValues(GENDER_VALUES).optional(),
  orderDate: dateStringSchema,
  tests: z.array(orderTestSchema).min(1, 'At least one test is required'),
  totalPrice: z.number().min(0),
  paymentStatus: zEnumFromValues(PAYMENT_STATUS_VALUES),
  overallStatus: zEnumFromValues(ORDER_STATUS_VALUES),
  priority: zEnumFromValues(PRIORITY_LEVEL_VALUES),
  referentDoctorId: referentDoctorIdSchema.nullable().optional(),
  referentDoctorName: z.string().nullable().optional(),
  referentDoctorEmail: z.string().nullable().optional(),
  referentDoctorPhone: z.string().nullable().optional(),
  referentDoctorHospital: z.string().nullable().optional(),
  referentDoctorUsername: z.string().nullable().optional(),
  clinicalNotes: z.string().nullable().optional(), // Backend allows null
  specialInstructions: z.array(z.string()).nullable().optional(), // Backend optional
  patientPrepInstructions: z.string().nullable().optional(), // Backend optional
  createdBy: employeeNumberSchema,
  createdAt: dateStringSchema,
  updatedAt: dateStringSchema,
});

export type Order = z.infer<typeof orderSchema>;
export type OrderTest = z.infer<typeof orderTestSchema>;

/** List/summary rows from GET /orders?summary=true — validate clinical ids only. */
export const orderSummaryBoundarySchema = z
  .object({
    orderId: orderIdSchema,
    patientId: patientIdSchema,
    createdBy: employeeNumberSchema.optional(),
  })
  .passthrough();

export const orderSummaryListSchema = z.array(orderSummaryBoundarySchema);

// Form schema for CREATE (all required fields enforced)
export const orderCreateSchema = z.object({
  patientId: patientIdSchema,
  referentDoctorId: referentDoctorIdSchema.nullable().optional(),
  priority: zEnumFromValues(PRIORITY_LEVEL_VALUES),
  clinicalNotes: z.string().optional(),
  testCodes: z.array(testMnemonicSchema).min(1, 'At least one test is required'),
  paymentMethod: zEnumFromValues(PAYMENT_METHOD_VALUES).optional(),
});

// Form schema for UPDATE (all fields optional for partial updates)
export const orderUpdateSchema = orderCreateSchema.partial();

export type OrderFormInput = z.infer<typeof orderCreateSchema>;
export type OrderCreateInput = z.infer<typeof orderCreateSchema>;
export type OrderUpdateInput = z.infer<typeof orderUpdateSchema>;
