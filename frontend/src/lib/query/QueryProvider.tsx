/**
 * Query Provider Component
 * 
 * Wraps the application with TanStack Query's QueryClientProvider
 * and includes DevTools in development mode.
 */

import React, { type ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { getQueryClient } from './client';

interface QueryProviderProps {
  children: ReactNode;
}

/**
 * QueryProvider Component
 * 
 * Provides TanStack Query context to the application.
 * Includes React Query DevTools in development mode for debugging.
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

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* DevTools only visible in development */}
      <ReactQueryDevtools 
        initialIsOpen={false} 
        buttonPosition="bottom-left"
      />
    </QueryClientProvider>
  );
};
