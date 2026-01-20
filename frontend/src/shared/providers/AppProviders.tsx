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
import { UsersProvider } from '@/features/user';
import { PatientsProvider } from '@/features/patient/PatientProvider';
import { OrdersProvider } from '@/features/order/OrderProvider';
import { TestsProvider } from '@/features/test/TestsProvider';
import { SamplesProvider } from '@/features/lab/SamplesProvider';
import { AliquotsProvider } from '@/features/lab/AliquotsProvider';
import { AppointmentsProvider } from '@/features/appointment/AppointmentsProvider';
import { BillingProvider } from '@/features/billing/BillingProvider';
import { ModalProvider } from '@/shared/contexts/ModalContext';

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
    providers.reduceRight(
      (acc, Provider) => <Provider>{acc}</Provider>,
      children
    );
}

/**
 * All feature providers in dependency order
 * Order matters: providers listed later can depend on those listed earlier
 */
const featureProviders = [
  AuthProvider,
  UsersProvider, // Must come after AuthProvider (depends on authentication state)
  PatientsProvider,
  OrdersProvider,
  TestsProvider,
  SamplesProvider,
  AliquotsProvider,
  AppointmentsProvider,
  BillingProvider,
  ModalProvider,
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
export {
  QueryProvider,
  AuthProvider,
  UsersProvider,
  PatientsProvider,
  OrdersProvider,
  TestsProvider,
  SamplesProvider,
  AliquotsProvider,
  AppointmentsProvider,
  BillingProvider,
  ModalProvider,
};
