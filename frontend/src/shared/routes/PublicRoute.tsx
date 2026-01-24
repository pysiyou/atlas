/**
 * Public Route Component
 * Protects public routes (like login) from authenticated users
 * Redirects authenticated users to dashboard
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/useAuth';
import { ROUTES } from '@/config';
import { LoadingState } from '@/shared/components/LoadingState';

interface PublicRouteProps {
  children: React.ReactNode;
}

/**
 * PublicRoute Component
 * Wraps public routes and redirects authenticated users away
 * Shows loading state while auth is being restored
 */
export const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { isAuthenticated, isRestoring } = useAuth();

  // Show loading state while restoring auth from storage
  if (isRestoring) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingState message="Loading..." />
      </div>
    );
  }

  // Redirect authenticated users to dashboard
  if (isAuthenticated) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  // User is not authenticated, show public route
  return <>{children}</>;
};
