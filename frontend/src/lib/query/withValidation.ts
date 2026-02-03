/**
 * Zod Validation Utilities for TanStack Query
 *
 * Provides utilities for validating API responses at the network boundary
 * using Zod schemas. This ensures type safety at runtime, not just compile time.
 *
 * @module lib/query/withValidation
 */

import type { ZodSchema, ZodError } from 'zod';

/**
 * Error thrown when API response validation fails.
 * Contains the original Zod error for debugging.
 */
export class ValidationError extends Error {
  public readonly zodError: ZodError;
  public readonly rawData: unknown;

  constructor(message: string, zodError: ZodError, rawData: unknown) {
    super(message);
    this.name = 'ValidationError';
    this.zodError = zodError;
    this.rawData = rawData;
  }
}

/**
 * Creates a validated query function that parses the API response with a Zod schema.
 *
 * Use this to ensure API responses match expected types at runtime.
 * If validation fails, throws a ValidationError with details.
 *
 * @param fetcher - The async function that fetches data from the API
 * @param schema - Zod schema to validate the response
 * @returns A query function that validates the response
 *
 * @example
 * ```tsx
 * import { z } from 'zod';
 * import { createValidatedQueryFn } from '@/lib/query/withValidation';
 *
 * const orderSchema = z.object({
 *   orderId: z.number(),
 *   patientName: z.string(),
 *   // ...
 * });
 *
 * useQuery({
 *   queryKey: queryKeys.orders.byId(orderId),
 *   queryFn: createValidatedQueryFn(
 *     () => orderAPI.getOrder(orderId),
 *     orderSchema
 *   ),
 * });
 * ```
 */
export function createValidatedQueryFn<T>(
  fetcher: () => Promise<unknown>,
  schema: ZodSchema<T>
): () => Promise<T> {
  return async () => {
    const data = await fetcher();
    const result = schema.safeParse(data);

    if (!result.success) {
      // In development, log the validation error for debugging
      if (process.env.NODE_ENV === 'development') {
        console.error('API Response Validation Failed:', result.error.format());
        console.error('Raw data:', data);
      }
      throw new ValidationError(
        `API response validation failed: ${result.error.message}`,
        result.error,
        data
      );
    }

    return result.data;
  };
}

/**
 * Creates a validated query function for array responses.
 *
 * Validates that the response is an array and each item matches the schema.
 *
 * @param fetcher - The async function that fetches data from the API
 * @param itemSchema - Zod schema for individual array items
 * @returns A query function that validates the array response
 *
 * @example
 * ```tsx
 * import { z } from 'zod';
 * import { createValidatedArrayQueryFn } from '@/lib/query/withValidation';
 *
 * const patientSchema = z.object({
 *   patientId: z.number(),
 *   fullName: z.string(),
 * });
 *
 * useQuery({
 *   queryKey: queryKeys.patients.list(),
 *   queryFn: createValidatedArrayQueryFn(
 *     () => patientAPI.getAll(),
 *     patientSchema
 *   ),
 * });
 * ```
 */
export function createValidatedArrayQueryFn<T>(
  fetcher: () => Promise<unknown>,
  itemSchema: ZodSchema<T>
): () => Promise<T[]> {
  return async () => {
    const data = await fetcher();

    if (!Array.isArray(data)) {
      throw new ValidationError(
        'Expected array response but received non-array',
        // Create a synthetic ZodError for consistency
        {
          issues: [{ code: 'custom', message: 'Expected array', path: [] }],
          format: () => ({ _errors: ['Expected array'] }),
        } as unknown as ZodError,
        data
      );
    }

    const validatedItems: T[] = [];
    const errors: Array<{ index: number; error: ZodError }> = [];

    for (let i = 0; i < data.length; i++) {
      const result = itemSchema.safeParse(data[i]);
      if (result.success) {
        validatedItems.push(result.data);
      } else {
        errors.push({ index: i, error: result.error });
      }
    }

    // If any items failed validation, throw with details
    if (errors.length > 0) {
      if (process.env.NODE_ENV === 'development') {
        console.error(`Array validation failed for ${errors.length} items:`, errors);
      }
      throw new ValidationError(
        `Array validation failed for ${errors.length}/${data.length} items`,
        errors[0].error,
        data
      );
    }

    return validatedItems;
  };
}

/**
 * Wraps a schema validator to be used with useQuery's select option.
 *
 * This is useful when you want to validate AND transform data in one step.
 *
 * @param schema - Zod schema to validate and potentially transform
 * @returns A selector function for useQuery
 *
 * @example
 * ```tsx
 * const responseSchema = z.object({
 *   id: z.number(),
 *   name: z.string(),
 *   createdAt: z.string().transform(s => new Date(s)),
 * });
 *
 * useQuery({
 *   queryKey: ['data'],
 *   queryFn: fetchData,
 *   select: createValidatedSelector(responseSchema),
 * });
 * ```
 */
export function createValidatedSelector<TInput, TOutput>(
  schema: ZodSchema<TOutput, any, TInput>
): (data: TInput) => TOutput {
  return (data: TInput) => {
    const result = schema.safeParse(data);
    if (!result.success) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Select validation failed:', result.error.format());
      }
      throw new ValidationError(
        `Select validation failed: ${result.error.message}`,
        result.error,
        data
      );
    }
    return result.data;
  };
}
