/**
 * Prefetches shared lists after login so feature pages hit a warm cache.
 * Inactive while logged out (children render immediately).
 */

import React from 'react';
import { useAuthStore } from '@/app/store';
import { useTestCatalog } from '@/features/catalog';
import { usePatientsList } from '@/features/patients';
import { useOrdersList } from '@/features/orders';
import { useSamplesList } from '@/features/lab/api/samples.api';
import { ErrorFallback, PageLoadingFallback } from '@/components/loaders';

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

interface AuthenticatedPreloadProps {
  children: React.ReactNode;
  showLoadingSkeleton: boolean;
}

/**
 * Runs query hooks only when mounted under an authenticated session.
 * Separated so hooks are never called on the public login tree.
 */
const AuthenticatedPreload: React.FC<AuthenticatedPreloadProps> = ({
  children,
  showLoadingSkeleton,
}) => {
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

  if (isLoading && showLoadingSkeleton) {
    return <PageLoadingFallback />;
  }

  if (errors.length > 0 && !isLoading) {
    const message = errors.map(e => e.message).join('; ');
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

interface InitialDataPreloadProps {
  children: React.ReactNode;
  /** Full-screen loader while shared lists fetch; if false, children render immediately */
  showLoadingSkeleton?: boolean;
}

export const InitialDataPreload: React.FC<InitialDataPreloadProps> = ({
  children,
  showLoadingSkeleton = true,
}) => {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <AuthenticatedPreload showLoadingSkeleton={showLoadingSkeleton}>
      {children}
    </AuthenticatedPreload>
  );
};
