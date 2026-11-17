import { z } from 'zod';
import {
  dateStringSchema,
  employeeNumberSchema,
  labActorUserIdSchema,
  orderIdSchema,
  sampleIdSchema,
  testMnemonicSchema,
} from '@/types/zod';

/** Boundary validation for sample API payloads (IDs + actor fields). */
export const sampleResponseSchema = z
  .object({
    sampleId: sampleIdSchema,
    orderId: orderIdSchema,
    testCodes: z.array(testMnemonicSchema),
    createdBy: employeeNumberSchema,
    updatedBy: employeeNumberSchema,
    collectedBy: labActorUserIdSchema.nullable().optional(),
    rejectedBy: labActorUserIdSchema.nullable().optional(),
    parentSampleId: sampleIdSchema.nullable().optional(),
    originalSampleId: sampleIdSchema.nullable().optional(),
    recollectionSampleId: sampleIdSchema.nullable().optional(),
    createdAt: dateStringSchema,
    updatedAt: dateStringSchema,
    sampleType: z.string(),
    status: z.string(),
    requiredVolume: z.number(),
    priority: z.string(),
    requiredContainerTypes: z.array(z.string()),
    requiredContainerColors: z.array(z.string()),
  })
  .passthrough();

export type SampleResponse = z.infer<typeof sampleResponseSchema>;

export function parseSampleResponse(data: unknown): SampleResponse {
  return sampleResponseSchema.parse(data);
}

export function parseSampleList(data: unknown): SampleResponse[] {
  return z.array(sampleResponseSchema).parse(data);
}