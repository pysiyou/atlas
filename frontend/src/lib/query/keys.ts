/**
 * Query Key Factory
 *
 * Centralized, type-safe query keys for TanStack Query.
 * Following the query key factory pattern for consistency and maintainability.
 *
 * @see https://tkdodo.eu/blog/effective-react-query-keys
 */

import type { OrderStatus, PaymentStatus, SampleStatus, TestCategory } from '@/types';

/**
 * Pagination parameters for paginated queries
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

/**
 * Query key factory for all application queries.
 * Hierarchical structure enables granular cache invalidation.
 *
 * Usage:
 * - queryKeys.tests.all -> ['tests']
 * - queryKeys.tests.byCode('CBC') -> ['tests', 'detail', 'CBC']
 * - queryKeys.orders.list({ status: 'pending' }) -> ['orders', 'list', { status: 'pending' }]
 */
export const queryKeys = {
  /**
   * Test catalog queries (static data)
   */
  tests: {
    all: ['tests'] as const,
    lists: () => [...queryKeys.tests.all, 'list'] as const,
    list: (filters?: { category?: TestCategory; activeOnly?: boolean }) =>
      [...queryKeys.tests.lists(), filters] as const,
    details: () => [...queryKeys.tests.all, 'detail'] as const,
    byCode: (code: string) => [...queryKeys.tests.details(), code] as const,
    search: (query: string) => [...queryKeys.tests.all, 'search', query] as const,
  },

  /**
   * Users queries (static data)
   */
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: () => [...queryKeys.users.lists()] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    byId: (id: string) => [...queryKeys.users.details(), id] as const,
  },

  /**
   * Patient queries (semi-static data)
   */
  patients: {
    all: ['patients'] as const,
    lists: () => [...queryKeys.patients.all, 'list'] as const,
    list: (filters?: { search?: string } & PaginationParams) =>
      [...queryKeys.patients.lists(), filters] as const,
    paginated: (params: { search?: string } & PaginationParams) =>
      [...queryKeys.patients.all, 'paginated', params] as const,
    details: () => [...queryKeys.patients.all, 'detail'] as const,
    byId: (id: string) => [...queryKeys.patients.details(), id] as const,
    search: (query: string) => [...queryKeys.patients.all, 'search', query] as const,
  },

  /**
   * Order queries (dynamic data)
   */
  orders: {
    all: ['orders'] as const,
    lists: () => [...queryKeys.orders.all, 'list'] as const,
    list: (
      filters?: {
        patientId?: string;
        status?: OrderStatus;
        paymentStatus?: PaymentStatus;
      } & PaginationParams
    ) => [...queryKeys.orders.lists(), filters] as const,
    paginated: (
      params: {
        patientId?: string;
        status?: OrderStatus;
        paymentStatus?: PaymentStatus;
      } & PaginationParams
    ) => [...queryKeys.orders.all, 'paginated', params] as const,
    details: () => [...queryKeys.orders.all, 'detail'] as const,
    byId: (id: string) => [...queryKeys.orders.details(), id] as const,
    byPatient: (patientId: string) => [...queryKeys.orders.all, 'patient', patientId] as const,
  },

  /**
   * Sample queries (dynamic data)
   */
  samples: {
    all: ['samples'] as const,
    lists: () => [...queryKeys.samples.all, 'list'] as const,
    list: (filters?: { status?: SampleStatus; orderId?: string } & PaginationParams) =>
      [...queryKeys.samples.lists(), filters] as const,
    paginated: (params: { status?: SampleStatus; orderId?: string } & PaginationParams) =>
      [...queryKeys.samples.all, 'paginated', params] as const,
    details: () => [...queryKeys.samples.all, 'detail'] as const,
    byId: (id: string) => [...queryKeys.samples.details(), id] as const,
    byOrder: (orderId: string) => [...queryKeys.samples.all, 'order', orderId] as const,
    pending: () => [...queryKeys.samples.all, 'pending'] as const,
  },

  /**
   * Payment queries (dynamic data)
   */
  payments: {
    all: ['payments'] as const,
    lists: () => [...queryKeys.payments.all, 'list'] as const,
    list: (filters?: { orderId?: string; paymentMethod?: string }) =>
      [...queryKeys.payments.lists(), filters] as const,
    details: () => [...queryKeys.payments.all, 'detail'] as const,
    byId: (id: string) => [...queryKeys.payments.details(), id] as const,
    byOrder: (orderId: string) => [...queryKeys.payments.all, 'order', orderId] as const,
  },

  /**
   * Quality issues (unified rejection / remedy flow)
   */
  qualityIssues: {
    all: ['quality-issues'] as const,
    options: (targetType?: string, targetId?: number) =>
      [...queryKeys.qualityIssues.all, 'options', targetType, targetId] as const,
    forOrder: (orderId?: number) =>
      [...queryKeys.qualityIssues.all, 'order', orderId] as const,
  },

  /**
   * Lab results / escalation (role-gated)
   */
  results: {
    all: ['results'] as const,
    pendingEscalation: () => [...queryKeys.results.all, 'pending-escalation'] as const,
  },

  recollectionRequests: {
    all: ['recollection-requests'] as const,
    pending: () => [...queryKeys.recollectionRequests.all, 'pending'] as const,
  },

  /**
   * Critical value notifications
   */
  criticalValues: {
    all: ['critical-values'] as const,
    pending: () => [...queryKeys.criticalValues.all, 'pending'] as const,
  },

  /**
   * Lab monitoring (command center timeline)
   */
  monitoring: {
    all: ['monitoring'] as const,
    timeline: (params: { hoursBack: number; limit: number }) =>
      [...queryKeys.monitoring.all, 'timeline', params] as const,
  },

  /**
   * Affiliation pricing (static data)
   */
  affiliations: {
    all: ['affiliations'] as const,
    pricing: () => [...queryKeys.affiliations.all, 'pricing'] as const,
    priceByDuration: (duration: number) =>
      [...queryKeys.affiliations.all, 'pricing', duration] as const,
  },
} as const;

/**
 * Cache invalidation rules (use invalidateOrderQueries, invalidatePatientQueries, invalidateResultQueries from ./invalidate):
 *
 * - After any ORDER mutation: invalidate queryKeys.orders.all; if order or samples change, also invalidate samples.all
 *   (and payments.all when payment status changes).
 * - After any PATIENT mutation: invalidate queryKeys.patients.all.
 * - After RESULT mutations (entry/validate/reject): invalidate orders.all, samples.all (when relevant), results.all;
 *   when resolving escalation also invalidate results.pendingEscalation().
 * - After PAYMENT mutations: invalidate payments.all and orders.all.
 */

/**
 * Query key prefixes for static data (no refetch on window focus).
 * Used by query client refetchOnWindowFocus; add new static domains here.
 */
export const STATIC_QUERY_KEY_PREFIXES = ['tests', 'users', 'affiliations'] as const;

export type QueryKeys = typeof queryKeys;
