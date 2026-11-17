/**
 * Zod schemas for API response validation at service boundaries.
 */
import { z } from 'zod';
import { paymentSchema } from '@/features/payments/schemas/payment.schema';
import { employeeNumberSchema } from '@/types/zod';

export const userLookupResponseSchema = z.object({
  id: employeeNumberSchema,
  name: z.string(),
  username: z.string(),
});

export const userLookupListSchema = z.array(userLookupResponseSchema);

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
  id: employeeNumberSchema,
  username: z.string(),
  name: z.string(),
  role: z.string(),
  /** API sends `null` when unset; `.optional()` alone does not accept null. */
  email: z.string().nullable().optional(),
});

/** API payment payloads — aligned with `features/payments/schemas/payment.schema.ts`. */
export const paymentResponseSchema = paymentSchema;

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
