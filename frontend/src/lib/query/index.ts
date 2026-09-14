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
  invalidateCriticalValueQueries,
  invalidateQualityIssueQueries,
  invalidateRecollectionQueries,
  invalidateCollectionQueries,
  invalidateCommandCenterQueries,
  invalidateLabWorkflowQueries,
  invalidateWorklistQueries,
  invalidateSampleDetailQueries,
  useInvalidateQueryKey,
} from './invalidate';
export type {
  InvalidateOrderOptions,
  InvalidatePatientOptions,
  InvalidateResultOptions,
  InvalidateCriticalValueOptions,
  InvalidateLabWorkflowOptions,
} from './invalidate';
export { QueryProvider } from './QueryProvider';
