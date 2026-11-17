/**
 * Zod schemas for API response validation at service boundaries.
 */
import { z } from 'zod';

export const loginTokenResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  role: z.string().optional(),
});

export const setupStatusResponseSchema = z.object({
  required: z.boolean(),
});

export const refreshTokenResponseSchema = z.object({
  access_token: z.string(),
});

export const authUserResponseSchema = z.object({
  id: z.string(),
  username: z.string(),
  name: z.string(),
  role: z.string(),
  /** API sends `null` when unset; `.optional()` alone does not accept null. */
  email: z.string().nullable().optional(),
});

export const paymentResponseSchema = z.object({
  paymentId: z.string(),
  orderId: z.string(),
  invoiceId: z.string().nullable().optional(),
  amount: z.number(),
  paymentMethod: z.string(),
  paidAt: z.string(),
  createdBy: z.string(),
  receiptGenerated: z.boolean().optional(),
  notes: z.string().optional().nullable(),
  orderTotalPrice: z.number().optional(),
  numberOfTests: z.number().optional(),
  patientName: z.string().optional(),
  orderPaymentStatus: z.string().optional().nullable(),
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
