/**
 * App Providers Composition
 * Combines all context providers into a single component
 * Reduces nesting in App.tsx and improves readability
 */

import React, { type ReactNode } from 'react';

// Query Provider (TanStack Query) - must be at the root
import { QueryProvider } from '@/lib/query';

// Feature Providers
import { AuthProvider } from '@/features/auth/AuthProvider';
// Note: All data providers removed - all consumers migrated to TanStack Query hooks
// - See @/hooks/queries for replacement hooks
// - AppointmentsProvider and BillingProvider removed - API not yet implemented
import { ModalProvider } from '@/shared/context/ModalContext';

interface AppProvidersProps {
  children: ReactNode;
}

/**
 * Utility to compose multiple providers without deep nesting
 */
function composeProviders(
  providers: Array<React.ComponentType<{ children: ReactNode }>>
): React.FC<{ children: ReactNode }> {
  return ({ children }) =>
    providers.reduceRight((acc, Provider) => <Provider>{acc}</Provider>, children);
}

/**
 * All feature providers in dependency order
 * Order matters: providers listed later can depend on those listed earlier
 *
 * NOTE: All data providers have been removed - all consumers migrated to TanStack Query hooks.
 * Remaining providers:
 * - AuthProvider: Active - manages authentication state
 * - ModalProvider: Active - manages modal state
 */
const featureProviders = [
  AuthProvider, // Active - manages authentication state
  ModalProvider, // Active - manages modal state
];

const ComposedProviders = composeProviders(featureProviders);

/**
 * AppProviders - Single component that provides all app context
 *
 * QueryProvider wraps everything to enable TanStack Query caching.
 * Feature providers are composed inside for backward compatibility
 * during migration to query hooks.
 *
 * Usage:
 * ```tsx
 * <AppProviders>
 *   <App />
 * </AppProviders>
 * ```
 */
export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => (
  <QueryProvider>
    <ComposedProviders>{children}</ComposedProviders>
  </QueryProvider>
);

/**
 * Re-export individual providers for cases where selective provision is needed
 */
export { QueryProvider, AuthProvider, ModalProvider };
