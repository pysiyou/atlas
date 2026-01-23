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
    list: (filters?: { search?: string }) => [...queryKeys.patients.lists(), filters] as const,
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
    list: (filters?: { patientId?: string; status?: OrderStatus; paymentStatus?: PaymentStatus }) =>
      [...queryKeys.orders.lists(), filters] as const,
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
    list: (filters?: { status?: SampleStatus; orderId?: string }) =>
      [...queryKeys.samples.lists(), filters] as const,
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
   * Billing queries (dynamic data)
   */
  billing: {
    all: ['billing'] as const,
    lists: () => [...queryKeys.billing.all, 'list'] as const,
    list: () => [...queryKeys.billing.lists()] as const,
  },

  /**
   * Aliquot queries (dynamic data)
   */
  aliquots: {
    all: ['aliquots'] as const,
    lists: () => [...queryKeys.aliquots.all, 'list'] as const,
    list: (filters?: { sampleId?: string }) => [...queryKeys.aliquots.lists(), filters] as const,
    details: () => [...queryKeys.aliquots.all, 'detail'] as const,
    byId: (id: string) => [...queryKeys.aliquots.details(), id] as const,
    bySample: (sampleId: string) => [...queryKeys.aliquots.all, 'sample', sampleId] as const,
  },

  /**
   * Appointment queries (dynamic data)
   */
  appointments: {
    all: ['appointments'] as const,
    lists: () => [...queryKeys.appointments.all, 'list'] as const,
    list: (filters?: { patientId?: string; date?: string }) =>
      [...queryKeys.appointments.lists(), filters] as const,
    details: () => [...queryKeys.appointments.all, 'detail'] as const,
    byId: (id: string) => [...queryKeys.appointments.details(), id] as const,
  },
} as const;

/**
 * Type helper to extract query key types
 */
export type QueryKeys = typeof queryKeys;
