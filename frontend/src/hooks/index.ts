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
// Auth Hooks
// =============================================================================
// useAuth removed - use useAuthStore from @/shared/stores/auth.store

// =============================================================================
// Responsive Layout Hooks (import from @/hooks/useBreakpoint or @/utils/filtering directly)
// =============================================================================
export { useResponsiveLayout } from './useResponsiveLayout';
export type { ResponsiveLayoutConfig } from './useResponsiveLayout';

// =============================================================================
// Legacy Context Hooks (DEPRECATED - for backward compatibility only)
// These delegate to TanStack Query hooks internally but maintain the old API.
//
// ⚠️ DEPRECATED: New components should use TanStack Query hooks directly:
// - useOrdersList() instead of useOrders()
// - useSamplesList() instead of useSamples()
// - useTestCatalog() instead of useTests()
// - useUsersList() instead of useUsers()
//
// These will be removed in a future version once all consumers are migrated.
// =============================================================================
