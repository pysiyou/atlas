/**
 * Query Module Exports
 *
 * Centralized exports for TanStack Query configuration and utilities.
 */

// Query client and configuration
export { getQueryClient, createQueryClient, resetQueryClient, cacheConfig } from './client';

// Query keys factory
export { queryKeys } from './keys';
export type { QueryKeys } from './keys';

// Invalidation helpers
export {
  invalidateOrderQueries,
  invalidatePatientQueries,
  invalidateResultQueries,
} from './invalidate';
export type {
  InvalidateOrderOptions,
  InvalidatePatientOptions,
  InvalidateResultOptions,
} from './invalidate';

// Provider component
export { QueryProvider } from './QueryProvider';

// Validation utilities
export {
  createValidatedQueryFn,
  createValidatedArrayQueryFn,
  createValidatedSelector,
  ValidationError,
} from './withValidation';
