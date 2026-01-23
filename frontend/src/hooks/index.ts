/**
 * Central export for all hooks
 *
 * This module re-exports hooks from various locations for convenient imports.
 *
 * RECOMMENDED: Use the new TanStack Query hooks from @/hooks/queries for:
 * - Better caching (static, semi-static, dynamic tiers)
 * - Request deduplication
 * - Automatic background refetching
 * - Optimistic updates for mutations
 */

// =============================================================================
// TanStack Query Hooks (RECOMMENDED for new code)
// =============================================================================
export * from './queries';

// =============================================================================
// Filtering Hooks
// =============================================================================
export { useFiltering, useSearch, useMultiSelect } from '@/utils/filtering';

// =============================================================================
// Auth Hooks
// =============================================================================
export { useAuth } from '@/features/auth/useAuth';

// =============================================================================
// Responsive Layout Hooks
// =============================================================================
export { useBreakpoint, isBreakpointAtLeast, isBreakpointAtMost } from './useBreakpoint';
export type { Breakpoint } from './useBreakpoint';
export { useResponsiveLayout } from './useResponsiveLayout';
export type { ResponsiveLayoutConfig } from './useResponsiveLayout';

// =============================================================================
// Legacy Context Hooks (DEPRECATED - for backward compatibility only)
// These delegate to TanStack Query hooks internally but maintain the old API.
//
// ⚠️ DEPRECATED: New components should use TanStack Query hooks directly:
// - usePatientsList() instead of usePatients()
// - useOrdersList() instead of useOrders()
// - useSamplesList() instead of useSamples()
// - useTestCatalog() instead of useTests()
// - useUsersList() instead of useUsers()
//
// These will be removed in a future version once all consumers are migrated.
// =============================================================================
/**
 * @deprecated Use usePatientsList() from @/hooks/queries instead
 */
export { usePatients } from '@/features/patient/PatientContext';
/**
 * @deprecated Use useOrdersList() from @/hooks/queries instead
 */
export { useOrders } from '@/features/order/OrderContext';
/**
 * @deprecated Use useSamplesList() from @/hooks/queries instead
 */
export { useSamples } from '@/features/lab/SamplesContext';
/**
 * @deprecated Use useTestCatalog() from @/hooks/queries instead
 */
export { useTests } from '@/features/test/TestsContext';
/**
 * @deprecated Use useUsersList() from @/hooks/queries instead
 */
export { useUsers } from '@/features/user';
