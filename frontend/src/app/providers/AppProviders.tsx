/**
 * App Providers Composition
 * Combines context providers into a single component.
 */

import React, { type ReactNode } from 'react';
import { QueryProvider } from '@/lib/query';
import { ModalProvider } from '@/lib/context/ModalContext';
import { LoadingScopeProvider } from '@/components/loaders';

interface AppProvidersProps {
  children: ReactNode;
}

function composeProviders(
  providers: Array<React.ComponentType<{ children: ReactNode }>>
): React.FC<{ children: ReactNode }> {
  return ({ children }) =>
    providers.reduceRight((acc, Provider) => <Provider>{acc}</Provider>, children);
}

const featureProviders = [LoadingScopeProvider, ModalProvider];
const ComposedProviders = composeProviders(featureProviders);

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => (
  <QueryProvider>
    <ComposedProviders>{children}</ComposedProviders>
  </QueryProvider>
);

export { QueryProvider, ModalProvider, LoadingScopeProvider };
