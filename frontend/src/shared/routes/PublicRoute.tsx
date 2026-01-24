/**
 * Public Route Component
 *
 * Redirects authenticated users away from public pages (like login).
 */
import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/useAuth';
import { ROUTES } from '@/config';
import { LoadingState } from '@/shared/components/LoadingState';

interface Props {
  children: ReactNode;
}

export const PublicRoute = ({ children }: Props) => {
  const { isAuthenticated, isLoading } = useAuth();

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
