/**
 * Protected layout route: auth gate + AppShell + error boundary.
 * Child routes render via <Outlet />; Suspense wraps lazy page chunks once.
 */

import { Suspense } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/app/authStore';
import { AppShell } from '@/components/layout';
import { PageContentLoadingFallback, PageLoadingFallback } from '@/components/feedback';
import { ErrorBoundary } from '@/feedback';
import { ROUTES } from '@/app/routes';

export function ProtectedLayout() {
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
}
