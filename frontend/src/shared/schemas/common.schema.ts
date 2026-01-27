import { z } from 'zod';

// Phone validation (international format)
export const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number');

// Email validation (optional or empty string)
export const emailSchema = z
  .string()
  .email('Invalid email')
  .optional()
  .or(z.literal(''));

// Postal code (5 digits)
export const postalCodeSchema = z
  .string()
  .regex(/^\d{5}$/, 'Invalid postal code (5 digits required)');

// Date schemas
export const dateStringSchema = z.string().datetime();
export const dateSchema = z.coerce.date();

// Numeric ranges
export const positiveIntSchema = z.number().int().positive();
export const percentageSchema = z.number().min(0).max(100);

// Text constraints
export const nonEmptyString = z.string().min(1, 'This field is required');
export const nameSchema = z.string().min(2).max(100);
