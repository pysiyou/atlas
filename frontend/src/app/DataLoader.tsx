/**
 * Data Loader Component
 * Loads initial data from backend after authentication
 * Provides centralized data initialization for all features
 */

import React from 'react';
import { useAuthStore } from '@/app/store';
import { useTestCatalog } from '@/features/catalog/api/useTestCatalog';
import { usePatientsList } from '@/features/patients/api/usePatients';
import { useOrdersList } from '@/features/orders/api/useOrderQueries';
import { useSamplesList } from '@/features/collection/api/useSamples';
import { LoadingState } from '@/components/loaders/LoadingState';
import { ErrorFallback } from '@/components/loaders/ErrorFallback';

function toErrorEntry(
  isError: boolean,
  errorObj: unknown,
  defaultMessage: string
): { message: string } | null {
  if (!isError) return null;
  return {
    message: errorObj instanceof Error ? errorObj.message : defaultMessage,
  };
}

interface DataLoaderProps {
  children: React.ReactNode;
  /** Show full-screen loading (DnaHelixLoader) while data is being fetched; if false, children render and queries show their own loading states */
  showLoadingSkeleton?: boolean;
}

/**
 * DataLoader Component
 * Initializes all required data after authentication
 * Shows loading state and handles initialization errors
 *
 * Note: Data loading is triggered by the individual providers on mount,
 * this component primarily handles the loading UI state
 */
export const DataLoader: React.FC<DataLoaderProps> = ({ children, showLoadingSkeleton = true }) => {
  const { isAuthenticated } = useAuthStore();

  const patientsQuery = usePatientsList();
  const ordersQuery = useOrdersList();
  const testsQuery = useTestCatalog();
  const samplesQuery = useSamplesList();

  const isLoading =
    patientsQuery.isLoading ||
    ordersQuery.isLoading ||
    testsQuery.isLoading ||
    samplesQuery.isLoading;

  const errors = [
    toErrorEntry(patientsQuery.isError, patientsQuery.error, 'Failed to load patients'),
    toErrorEntry(ordersQuery.isError, ordersQuery.error, 'Failed to load orders'),
    toErrorEntry(testsQuery.isError, testsQuery.error, 'Failed to load tests'),
    toErrorEntry(samplesQuery.isError, samplesQuery.error, 'Failed to load samples'),
  ].filter(Boolean) as { message: string }[];

  const handleRetry = async () => {
    await Promise.all([
      patientsQuery.refetch(),
      ordersQuery.refetch(),
      testsQuery.refetch(),
      samplesQuery.refetch(),
    ]);
  };

  if (isAuthenticated && isLoading && showLoadingSkeleton) {
    return <LoadingState message="Loading..." fullScreen size="lg" />;
  }

  // Show error state if any provider has errors (same layout as ErrorBoundary)
  if (isAuthenticated && errors.length > 0 && !isLoading) {
    const message = errors.map(e => e?.message ?? 'Unknown error').join('; ');
    return (
      <ErrorFallback
        error={new Error(message)}
        onRetry={() => void handleRetry()}
        homeHref="/dashboard"
      />
    );
  }

  return <>{children}</>;
};
