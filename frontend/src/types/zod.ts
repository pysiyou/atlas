/**
 * Shared Zod schemas and helpers for forms and API error parsing.
 */
import { ID_PATTERNS } from '@/utils/id';
import { z } from 'zod';

export function zEnumFromValues<const T extends readonly [string, ...string[]]>(values: T) {
  return z.enum(values);
}

export const phoneSchema = z
  .string()
  .min(10, 'Phone number must be at least 10 characters')
  .max(20, 'Phone number must be at most 20 characters')
  .regex(/^[\d\s\-+()]+$/, 'Invalid phone number format');

export const emailSchema = z
  .string()
  .email('Invalid email')
  .optional()
  .or(z.literal(''))
  .or(z.null());

export const postalCodeSchema = z
  .string()
  .min(1, 'Postal code is required')
  .max(20, 'Postal code must be at most 20 characters')
  .regex(/^[\w\s-]+$/, 'Invalid postal code format');

export const dateStringSchema = z.string().refine(
  val => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return true;
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val)) return true;
    return true;
  },
  { message: 'Invalid date format' }
);

export const nullableApiDatetimeSchema = z.preprocess(
  val => (val === null || val === '' ? undefined : val),
  z
    .string()
    .refine(val => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(val), {
      message: 'Invalid datetime format',
    })
    .optional()
);

export const dateSchema = z.coerce.date();
export const positiveIntSchema = z.number().int().positive();
export const mrnSchema = z.string().regex(ID_PATTERNS.mrn, 'Invalid patient id');
export const orderIdSchema = z.string().regex(ID_PATTERNS.filler, 'Invalid order id');
export const accessionSchema = z.string().min(1, 'Sample id is required');
export const employeeNumberSchema = z
  .string()
  .regex(ID_PATTERNS.employeeNumber, 'Invalid user id');
export const npiSchema = z.string().regex(ID_PATTERNS.npi, 'Invalid NPI');
export const invoiceIdSchema = z.string().regex(ID_PATTERNS.invoiceNumber, 'Invalid invoice id');
export const receiptIdSchema = z.string().regex(ID_PATTERNS.receiptNumber, 'Invalid payment id');
export const percentageSchema = z.number().min(0).max(100);
export const nonEmptyString = z.string().min(1, 'This field is required');
export const nameSchema = z.string().min(2).max(100);

export const apiErrorDetailSchema = z.object({
  field: z.string().optional(),
  message: z.string(),
});

export type ApiErrorDetail = z.infer<typeof apiErrorDetailSchema>;

export const apiErrorSchema = z.object({
  message: z.string(),
  code: z.string().optional(),
  field: z.string().optional(),
  status: z.number().optional(),
  details: z.array(apiErrorDetailSchema).optional(),
  matches: z.array(z.unknown()).optional(),
});

export type ApiError = z.infer<typeof apiErrorSchema>;