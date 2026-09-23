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
  invoiceId: z.number().nullable().optional(),
  amount: z.number(),
  paymentMethod: z.string(),
  paidAt: z.string(),
  createdBy: z.string(),
  receiptGenerated: z.boolean().optional(),
  notes: z.string().optional().nullable(),
  orderTotalPrice: z.number().optional(),
  numberOfTests: z.number().optional(),
  patientName: z.string().optional(),
});

export const operationResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
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
