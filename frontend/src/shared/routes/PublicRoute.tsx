/**
 * Public Route Component
 *
 * Redirects authenticated users away from public pages (like login).
 * AuthRehydrationGate (mounted once in app) clears isLoading after one frame.
 */
import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/shared/stores/auth.store';
import { ROUTES } from '@/config';
import { LoadingState } from '@/shared/components';

interface Props {
  children: ReactNode;
}

export const PublicRoute = ({ children }: Props) => {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingState message="Loading..." />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return <>{children}</>;
};
