/**
 * Query Provider Component
 *
 * Wraps the application with TanStack Query's QueryClientProvider.
 *
 * Features:
 * - Query cache persistence to localStorage (static/semi-static data only)
 * - Automatic cache restoration on app load
 */

import React, { type ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { getQueryClient } from './client';
import { createPersister, dehydrateOptions, PERSIST_MAX_AGE } from './persistor';

interface QueryProviderProps {
  children: ReactNode;
}

/**
 * QueryProvider Component
 *
 * Provides TanStack Query context to the application with cache persistence.
 *
 * Cache Persistence:
 * - Static data (tests, users) is persisted to localStorage
 * - Persisted cache expires after 24 hours
 * - Dynamic data (orders, samples) is NOT persisted
 *
 * @example
 * ```tsx
 * <QueryProvider>
 *   <App />
 * </QueryProvider>
 * ```
 */
export const QueryProvider: React.FC<QueryProviderProps> = ({ children }) => {
  // Get singleton QueryClient instance
  const queryClient = getQueryClient();

  // Create the storage persister (returns undefined on server)
  const persister = createPersister();

  // If persister is available, use PersistQueryClientProvider
  if (persister) {
    return (
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister,
          maxAge: PERSIST_MAX_AGE,
          dehydrateOptions,
          // Don't block rendering while restoring cache
          buster: undefined,
        }}
      >
        {children}
      </PersistQueryClientProvider>
    );
  }

  // Fallback to standard QueryClientProvider (SSR or no localStorage)
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};
