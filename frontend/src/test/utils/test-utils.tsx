/**
 * Custom test utilities for rendering components with providers
 */

/* eslint-disable react-refresh/only-export-components */

import type { ReactElement } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

/**
 * Creates a fresh QueryClient for each test
 */
export const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
      },
      mutations: {
        retry: false,
      },
    },
  });

/**
 * Wrapper component that provides common providers for testing
 */
interface AllProvidersProps {
  children: React.ReactNode;
  queryClient?: QueryClient;
}

export const AllProviders = ({ children, queryClient }: AllProvidersProps) => {
  const client = queryClient || createTestQueryClient();

  return (
    <QueryClientProvider client={client}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
};

/**
 * Custom render function that wraps components with common providers
 */
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
}

export const renderWithProviders = (ui: ReactElement, options?: CustomRenderOptions) => {
  const { queryClient, ...renderOptions } = options || {};

  return render(ui, {
    wrapper: ({ children }) => <AllProviders queryClient={queryClient}>{children}</AllProviders>,
    ...renderOptions,
  });
};

// Re-export everything from React Testing Library
export * from '@testing-library/react';
export { renderWithProviders as render };
