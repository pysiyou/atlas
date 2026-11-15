/**
 * App Providers Composition
 * Combines context providers into a single component.
 */

import { type ComponentType, type ReactNode } from 'react';
import { QueryProvider } from '@/lib/query';
import { ModalProvider } from '@/lib/context/ModalContext';
import { ToastProvider } from '@/feedback';
import { ConfigLoader } from './ConfigLoader';

interface AppProvidersProps {
  children: ReactNode;
}

function composeProviders(
  providers: Array<ComponentType<{ children: ReactNode }>>
): ComponentType<{ children: ReactNode }> {
  return function ComposedProviders({ children }: { children: ReactNode }) {
    return providers.reduceRight((acc, Provider) => <Provider>{acc}</Provider>, children);
  };
}

const featureProviders = [ToastProvider, ModalProvider];
const ComposedProviders = composeProviders(featureProviders);

export function AppProviders({ children }: AppProvidersProps) { return (
  <QueryProvider>
    <ComposedProviders>
      <ConfigLoader>{children}</ConfigLoader>
    </ComposedProviders>
  </QueryProvider>
); }

export { QueryProvider, ModalProvider };
