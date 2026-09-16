/**
 * Zod schemas for API response validation at service boundaries.
 */
import { z } from 'zod';

export const loginTokenResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  role: z.string().optional(),
});

export const refreshTokenResponseSchema = z.object({
  access_token: z.string(),
});

export const authUserResponseSchema = z.object({
  id: z.union([z.number(), z.string()]),
  username: z.string(),
  name: z.string(),
  role: z.string(),
  email: z.string().optional(),
});

export const paymentResponseSchema = z.object({
  paymentId: z.union([z.number(), z.string()]),
  orderId: z.number(),
  amount: z.number(),
  paymentMethod: z.string(),
  paidAt: z.string(),
  notes: z.string().optional().nullable(),
});

export const operationResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export const timelineEventSchema = z.object({
  id: z.number(),
  type: z.string(),
  category: z.string().optional(),
  tone: z.string().optional(),
  entityType: z.string(),
  entityId: z.number(),
  timestamp: z.string(),
  performedBy: z.string(),
  performedByName: z.string().nullable(),
  metadata: z.record(z.string(), z.unknown()),
  beforeState: z.record(z.string(), z.unknown()).nullable().optional(),
  afterState: z.record(z.string(), z.unknown()).nullable().optional(),
  comment: z.string().nullable().optional(),
});

export const timelineResponseSchema = z.object({
  events: z.array(timelineEventSchema),
  total: z.number(),
});

export function parseApiResponse<T>(schema: z.ZodType<T>, data: unknown, label: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw {
      message: `Invalid ${label} response from server`,
      code: 'INVALID_RESPONSE',
      details: result.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
    };
  }
  return result.data;
}
