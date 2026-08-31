/**
 * Query Module Exports
 *
 * Centralized exports for TanStack Query configuration and utilities.
 */

export { getQueryClient, createQueryClient, resetQueryClient, cacheConfig } from './client';
export { queryKeys } from './keys';
export type { QueryKeys } from './keys';
export {
  invalidateOrderQueries,
  invalidatePatientQueries,
  invalidateResultQueries,
  useInvalidateQueryKey,
} from './invalidate';
export type {
  InvalidateOrderOptions,
  InvalidatePatientOptions,
  InvalidateResultOptions,
} from './invalidate';
export { QueryProvider } from './QueryProvider';
