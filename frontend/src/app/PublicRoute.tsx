/**
 * Public Route Component
 *
 * Redirects authenticated users away from public pages (like login).
 * Auth store persist middleware clears isLoading after rehydration.
 */

import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/app/store';
import { ROUTES } from '@/config';
import { PageLoadingFallback } from '@/components/loaders';

interface Props {
  children: ReactNode;
}

export const PublicRoute = ({ children }: Props) => {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return <PageLoadingFallback />;
  }

  if (isAuthenticated) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return <>{children}</>;
};
