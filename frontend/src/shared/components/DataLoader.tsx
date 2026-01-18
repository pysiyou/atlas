/**
 * Data Loader Component
 * Loads initial data from backend after authentication
 * Provides centralized data initialization for all features
 */

import React, { useRef, useEffect } from 'react';
import { useAuth } from '@/features/auth/useAuth';
import { usePatients } from '@/features/patient/PatientContext';
import { useOrders } from '@/features/order/OrderContext';
import { useTests } from '@/features/test/TestsContext';
import { useSamples } from '@/features/lab/SamplesContext';
import { SkeletonPage } from '@/shared/ui/Skeleton';
import { Alert } from '@/shared/ui/Alert';
import { Button } from '@/shared/ui/Button';
import { RefreshCw } from 'lucide-react';

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
export const DataLoader: React.FC<DataLoaderProps> = ({ 
  children,
  showLoadingSkeleton = true,
}) => {
  const { isAuthenticated } = useAuth();
  const { loading: patientsLoading, error: patientsError, refreshPatients } = usePatients();
  const { loading: ordersLoading, error: ordersError, refreshOrders } = useOrders();
  const { loading: testsLoading, error: testsError, refreshTests } = useTests();
  const { loading: samplesLoading, error: samplesError, refreshSamples } = useSamples();

  // Track if initial load has been attempted
  const hasLoadedRef = useRef(false);

  // Trigger initial load when authenticated
  // Using ref to prevent re-triggering on re-renders
  useEffect(() => {
    if (isAuthenticated && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      // Data is already being loaded by providers on mount
      // This effect just marks that we've authenticated
    }
    
    // Reset on logout
    if (!isAuthenticated) {
      hasLoadedRef.current = false;
    }
  }, [isAuthenticated]);

  // Check if any data is currently loading
  const isLoading = patientsLoading || ordersLoading || testsLoading || samplesLoading;

  // Collect all errors
  const errors = [patientsError, ordersError, testsError, samplesError].filter(Boolean);

  // Retry loading all data
  const handleRetry = async () => {
    await Promise.all([
      refreshPatients(),
      refreshOrders(),
      refreshTests(),
      refreshSamples(),
    ]);
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
              <Button
                onClick={handleRetry}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw size={16} />
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
