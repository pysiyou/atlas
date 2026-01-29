/**
 * Query Hooks Module
 *
 * Centralized exports for all TanStack Query hooks.
 * Organized by data tier:
 * - Static: Tests, Users (Infinity cache)
 * - Semi-static: Patients (5 min cache)
 * - Dynamic: Orders, Samples, Payments (30s cache)
 */

// =============================================================================
// Static Data Hooks (Infinity Cache)
// =============================================================================

// Test Catalog
export {
  useTestCatalog,
  useTest,
  useTestSearch,
  useTestsByCategory,
  useActiveTests,
  useTestNameLookup,
  useInvalidateTestCatalog,
} from './useTestCatalog';

// Users
export { useUsersList, useUsersMap, useUserLookup, useUser, useInvalidateUsers } from './useUsers';
export type { UserDisplayInfo } from './useUsers';

// =============================================================================
// Semi-Static Data Hooks (5 min Cache)
// =============================================================================

// Patients
export {
  usePatientsList,
  usePatient,
  usePatientSearch,
  usePatientNameLookup,
  useCreatePatient,
  useUpdatePatient,
  useDeletePatient,
  useInvalidatePatients,
} from './usePatients';

// =============================================================================
// Dynamic Data Hooks (30s Cache)
// =============================================================================

// Orders (refactored into focused modules)
export {
  // Queries
  useOrdersList,
  useOrder,
  useOrdersByPatient,
  useOrdersByStatus,
  // Mutations
  useCreateOrder,
  useUpdateOrder,
  useDeleteOrder,
  useUpdateTestStatus,
  useUpdatePaymentStatus,
  useMarkTestCritical,
  // Utils
  useOrderSearch,
  useOrderLookup,
  useInvalidateOrders,
} from './orders';
export type { OrdersFilters } from './orders';

// Samples
export {
  useSamplesList,
  useSample,
  useSamplesByOrder,
  useSamplesByStatus,
  usePendingSamples,
  useSampleLookup,
  useCollectSample,
  useRejectSample,
  useRequestRecollection,
  useInvalidateSamples,
} from './useSamples';
export type { SamplesFilters } from './useSamples';

// Payments
export {
  usePaymentsList,
  usePayment,
  usePaymentsByOrder,
  usePaymentMethodByOrder,
  useCreatePayment,
  useInvalidatePayments,
} from './usePayments';
export type { PaymentsFilters, CreatePaymentData } from './usePayments';

// Lab results / escalation (role-gated)
export { usePendingEscalation } from './usePendingEscalation';
