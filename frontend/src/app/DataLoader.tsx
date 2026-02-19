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

  // Use TanStack Query hooks - they handle loading/error states automatically
  const {
    isLoading: patientsLoading,
    isError: patientsError,
    error: patientsErrorObj,
    refetch: refetchPatients,
  } = usePatientsList();
  const {
    isLoading: ordersLoading,
    isError: ordersError,
    error: ordersErrorObj,
    refetch: refetchOrders,
  } = useOrdersList();
  const {
    isLoading: testsLoading,
    isError: testsError,
    error: testsErrorObj,
    refetch: refetchTests,
  } = useTestCatalog();
  const {
    isLoading: samplesLoading,
    isError: samplesError,
    error: samplesErrorObj,
    refetch: refetchSamples,
  } = useSamplesList();

  // Check if any data is currently loading
  const isLoading = patientsLoading || ordersLoading || testsLoading || samplesLoading;

  // Collect all errors
  const errors = [
    patientsError
      ? {
          message:
            patientsErrorObj instanceof Error
              ? patientsErrorObj.message
              : 'Failed to load patients',
        }
      : null,
    ordersError
      ? {
          message:
            ordersErrorObj instanceof Error ? ordersErrorObj.message : 'Failed to load orders',
        }
      : null,
    testsError
      ? { message: testsErrorObj instanceof Error ? testsErrorObj.message : 'Failed to load tests' }
      : null,
    samplesError
      ? {
          message:
            samplesErrorObj instanceof Error ? samplesErrorObj.message : 'Failed to load samples',
        }
      : null,
  ].filter(Boolean);

  // Retry loading all data
  const handleRetry = async () => {
    await Promise.all([refetchPatients(), refetchOrders(), refetchTests(), refetchSamples()]);
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
