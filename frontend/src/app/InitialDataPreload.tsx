/**
 * Prefetches the test catalog after login without unmounting the shell, modals, or toasts.
 * Blocks only when catalog fetch failed and there is no cached data.
 */

import React, { useEffect, useRef } from 'react';
import { useAuthStore } from '@/app/authStore';
import { useTestCatalog } from '@/features/catalog';
import { ErrorFallback, getFeedback, notify } from '@/feedback';
import { getErrorMessage } from '@/utils/errors';

interface AuthenticatedPreloadProps {
  children: React.ReactNode;
}

const AuthenticatedPreload: React.FC<AuthenticatedPreloadProps> = ({ children }) => {
  const testsQuery = useTestCatalog();
  const hasCachedCatalog = testsQuery.tests.length > 0;
  const catalogUnavailable = testsQuery.isError && !hasCachedCatalog;
  const lastNotifiedError = useRef<unknown>(null);

  const handleRetry = async () => {
    await testsQuery.refetch();
  };

  useEffect(() => {
    if (!catalogUnavailable || testsQuery.error == null) {
      lastNotifiedError.current = null;
      return;
    }
    if (lastNotifiedError.current === testsQuery.error) return;
    lastNotifiedError.current = testsQuery.error;
    notify.show('catalog.bootstrap.loadFailed', { error: testsQuery.error });
  }, [catalogUnavailable, testsQuery.error]);

  if (catalogUnavailable) {
    const message = getErrorMessage(
      testsQuery.error,
      getFeedback('catalog.bootstrap.loadFailed').title
    );
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
