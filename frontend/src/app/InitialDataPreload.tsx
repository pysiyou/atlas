/**
 * Prefetches the test catalog after login without unmounting the shell, modals, or toasts.
 * Blocks only when catalog fetch failed and there is no cached data.
 */

import React from 'react';
import { useAuthStore } from '@/app/authStore';
import { useTestCatalog } from '@/features/catalog';
import { ErrorFallback } from '@/components/loaders';
import { errorAlertMessage } from '@/utils/feedback';

interface AuthenticatedPreloadProps {
  children: React.ReactNode;
}

const AuthenticatedPreload: React.FC<AuthenticatedPreloadProps> = ({ children }) => {
  const testsQuery = useTestCatalog();
  const hasCachedCatalog = testsQuery.tests.length > 0;
  const catalogUnavailable = testsQuery.isError && !hasCachedCatalog;

  const handleRetry = async () => {
    await testsQuery.refetch();
  };

  if (catalogUnavailable) {
    const message = errorAlertMessage('catalog.bootstrap.loadFailed', testsQuery.error);
    return <ErrorFallback error={new Error(message)} onRetry={handleRetry} />;
  }

  return <>{children}</>;
};

interface InitialDataPreloadProps {
  children: React.ReactNode;
}

export const InitialDataPreload: React.FC<InitialDataPreloadProps> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <>{children}</>;
  }

  return <AuthenticatedPreload>{children}</AuthenticatedPreload>;
};
