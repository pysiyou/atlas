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
// Legacy Context Hooks (for backward compatibility)
// These delegate to TanStack Query hooks internally but maintain the old API.
// New components should use the query hooks directly.
// =============================================================================
export { useSamples } from '@/features/lab/SamplesContext';
export { useUsers } from '@/features/user';
export { useOrders } from '@/features/order/OrderContext';
export { useTests } from '@/features/test/TestsContext';
export { usePatients } from '@/features/patient/PatientContext';
