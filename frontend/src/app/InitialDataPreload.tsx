/**
 * Prefetches reference data after login (catalog only — dynamic lists use paginated hooks).
 */

import React from 'react';
import { useAuthStore } from '@/app/authStore';
import { useTestCatalog } from '@/features/catalog';
import { ErrorFallback, PageLoadingFallback } from '@/components/loaders';
import { errorAlertMessage } from '@/utils/feedback';

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

const AuthenticatedPreload: React.FC<AuthenticatedPreloadProps> = ({
  children,
  showLoadingSkeleton,
}) => {
  const testsQuery = useTestCatalog();

  const isLoading = testsQuery.isLoading;

  const errors = [
    toErrorEntry(testsQuery.isError, testsQuery.error, errorAlertMessage('catalog.bootstrap.loadFailed', testsQuery.error)),
  ].filter(Boolean) as { message: string }[];

  const handleRetry = async () => {
    await testsQuery.refetch();
  };

  if (errors.length > 0) {
    return (
      <ErrorFallback
        error={new Error(errors.map(entry => entry.message).join('; '))}
        onRetry={handleRetry}
      />
    );
  }

  if (isLoading && showLoadingSkeleton) {
    return <PageLoadingFallback />;
  }

  return <>{children}</>;
};

interface InitialDataPreloadProps {
  children: React.ReactNode;
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
