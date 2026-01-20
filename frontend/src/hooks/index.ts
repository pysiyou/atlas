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
// Legacy Context Hooks (for backward compatibility)
// These delegate to TanStack Query hooks internally but maintain the old API.
// New components should use the query hooks directly.
// =============================================================================
export { useSamples } from '@/features/lab/SamplesContext';
export { useAliquots } from '@/features/lab/AliquotsContext';
export { useUserDisplay } from '@/features/lab/useUserDisplay';
export { useOrders } from '@/features/order/OrderContext';
export { useTests } from '@/features/test/TestsContext';
export { usePatients } from '@/features/patient/PatientContext';
