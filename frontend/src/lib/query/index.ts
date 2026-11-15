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
  invalidateOrderDetailQuery,
  invalidatePatientQueries,
  invalidateAfterLabMutation,
  invalidateCriticalValueQueries,
  invalidateCollectionQueries,
  invalidateLabMonitorQueries,
  invalidateWorklistQueries,
  invalidatePendingEscalationQueries,
  invalidateAuditEventQueries,
  invalidatePaymentDetailQueries,
  patchOrderSummaryInPaginatedCaches,
  useInvalidateQueryKey,
} from './invalidate';
export type {
  InvalidateOrderOptions,
  InvalidatePatientOptions,
  InvalidateCriticalValueOptions,
  LabMutationInvalidationKind,
  InvalidateAfterLabMutationOptions,
} from './invalidate';
export { QueryProvider } from './QueryProvider';
export { useAuthQueryEnabled } from './useAuthQueryEnabled';
