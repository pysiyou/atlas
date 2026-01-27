import { z } from 'zod';
import { dateStringSchema, positiveIntSchema } from '@/shared/schemas/common.schema';

export const rejectionRecordSchema = z.object({
  rejectedAt: dateStringSchema,
  rejectedBy: z.string(),
  rejectionReasons: z.array(z.string()),
  rejectionNotes: z.string().optional(),
  recollectionRequired: z.boolean(),
});

export const sampleSchema = z.object({
  sampleId: positiveIntSchema,
  orderId: positiveIntSchema,
  sampleType: z.enum(['blood', 'urine', 'stool', 'serum', 'plasma', 'other']),
  testCodes: z.array(z.string()),
  requiredVolume: z.number().min(0),
  priority: z.enum(['routine', 'urgent', 'stat']),
  requiredContainerTypes: z.array(z.string()),
  requiredContainerColors: z.array(z.string()),
  rejectionHistory: z.array(rejectionRecordSchema).optional(),
  isRecollection: z.boolean().optional(),
  originalSampleId: z.number().int().positive().optional(),
  recollectionReason: z.string().optional(),
  recollectionAttempt: z.number().int().positive().optional(),
  status: z.enum(['pending', 'collected', 'rejected', 'processing', 'validated']),
  sampleNumber: z.string().optional(),
  containerType: z.string().optional(),
  collectedAt: dateStringSchema.optional(),
  collectedBy: z.number().int().positive().optional(),
  rejectionReason: z.string().optional(),
  rejectionNotes: z.string().optional(),
  createdAt: dateStringSchema,
  createdBy: positiveIntSchema,
  updatedAt: dateStringSchema,
  updatedBy: positiveIntSchema,
});

export type Sample = z.infer<typeof sampleSchema>;
export type RejectionRecord = z.infer<typeof rejectionRecordSchema>;
