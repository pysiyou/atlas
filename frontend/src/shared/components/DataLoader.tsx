/**
 * Data Loader Component
 * Loads initial data from backend after authentication
 * Provides centralized data initialization for all features
 */

import React from 'react';
import { useAuth } from '@/features/auth/useAuth';
import { usePatientsList, useOrdersList, useTestCatalog, useSamplesList } from '@/hooks/queries';
import { SkeletonPage } from '@/shared/ui/Skeleton';
import { Alert } from '@/shared/ui/Alert';
import { Button } from '@/shared/ui/Button';

interface DataLoaderProps {
  children: React.ReactNode;
  /** Show loading skeleton while data is being fetched */
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
  const { isAuthenticated } = useAuth();

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

  // Show loading skeleton during initial load
  if (isAuthenticated && isLoading && showLoadingSkeleton) {
    return (
      <div className="h-screen flex flex-col">
        <div className="flex-1 overflow-hidden">
          <SkeletonPage />
        </div>
      </div>
    );
  }

  // Show error state if any provider has errors
  if (isAuthenticated && errors.length > 0 && !isLoading) {
    return (
      <div className="h-screen flex items-center justify-center p-8">
        <div className="max-w-md w-full">
          <Alert variant="danger">
            <div className="space-y-4">
              <p className="font-medium">Failed to load application data</p>
              <ul className="text-sm list-disc list-inside space-y-1">
                {errors.map((err, index) => (
                  <li key={index}>{err?.message || 'Unknown error'}</li>
                ))}
              </ul>
              <Button onClick={handleRetry} variant="retry">
                Retry
              </Button>
            </div>
          </Alert>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
