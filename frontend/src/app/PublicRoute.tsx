/**
 * Public Route Component
 *
 * Redirects authenticated users away from public pages (like login).
 * Auth store persist middleware clears isLoading after rehydration.
 */

import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/app/store';
import { getDefaultRouteForRole } from '@/components/layout/sidebarMenu';
import { PageLoadingFallback } from '@/components/loaders';

interface Props {
  children: ReactNode;
}

export const PublicRoute = ({ children }: Props) => {
  const { isAuthenticated, isLoading, user } = useAuthStore();

  if (isLoading) {
    return <PageLoadingFallback />;
  }

  if (isAuthenticated) {
    return <Navigate to={getDefaultRouteForRole(user?.role)} replace />;
  }

  return <>{children}</>;
};
