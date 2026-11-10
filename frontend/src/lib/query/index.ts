/**
 * Query Module Exports
 *
 * Centralized exports for TanStack Query configuration and utilities.
 */

export { getQueryClient, createQueryClient, resetQueryClient, cacheConfig } from './client';
export {
  clearPersistedQueryCache,
  PERSIST_STORAGE_KEY,
  PERSIST_BUSTER,
  shouldPersistQuery,
} from './persistor';
export { queryKeys } from './keys';
export type { QueryKeys } from './keys';
export {
  invalidateOrderQueries,
  invalidatePatientQueries,
  invalidateResultQueries,
  invalidateAfterLabMutation,
  invalidateCriticalValueQueries,
  invalidateQualityIssueQueries,
  invalidateCollectionQueries,
  invalidateLabMonitorQueries,
  invalidateLabMonitorQueriesFull,
  invalidateLabWorkflowQueries,
  invalidateWorklistQueries,
  invalidatePendingEscalationQueries,
  invalidateAuditEventQueries,
  invalidateSampleDetailQueries,
  useInvalidateQueryKey,
} from './invalidate';
export type {
  InvalidateOrderOptions,
  InvalidatePatientOptions,
  InvalidateResultOptions,
  InvalidateCriticalValueOptions,
  InvalidateLabWorkflowOptions,
  LabMutationInvalidationKind,
  InvalidateAfterLabMutationOptions,
} from './invalidate';
export { QueryProvider } from './QueryProvider';
export { useAuthQueryEnabled } from './useAuthQueryEnabled';
