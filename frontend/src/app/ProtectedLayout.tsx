/**
 * Protected layout route: auth gate + AppShell + error boundary.
 * Child routes render via <Outlet />; Suspense wraps lazy page chunks once.
 */

import React, { Suspense } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/app/authStore';
import { AppShell } from '@/components/layout';
import { ErrorBoundary, PageContentLoadingFallback, PageLoadingFallback } from '@/components/feedback';
import { ROUTES } from '@/config';

export const ProtectedLayout: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) return <PageLoadingFallback />;
  if (!isAuthenticated) return <Navigate to={ROUTES.LOGIN} replace />;

  return (
    <AppShell>
      <ErrorBoundary homeHref={ROUTES.DASHBOARD}>
        <Suspense fallback={<PageContentLoadingFallback />}>
          <Outlet />
        </Suspense>
      </ErrorBoundary>
    </AppShell>
  );
};
