/**
 * Main App Component
 * Sets up routing and context providers with error boundaries
 * Implements route-based code splitting for optimal performance
 */

import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Composed Providers
import { AppProviders } from '@/shared/providers/AppProviders';
import {
  AppToastBar,
  DataLoader,
  ErrorBoundary,
  LoadingState,
} from '@/shared/components';
import { AuthRehydrationGate } from '@/shared/components/AuthRehydrationGate';

// Eagerly loaded components (small, frequently accessed)
import { LoginForm } from '@/features/auth/LoginForm';
import { AppLayout as DashboardLayout } from '@/shared/layout';
import { useAuthStore } from '@/shared/stores/auth.store';
import { ModalRenderer } from '@/shared/ui';
import { PublicRoute } from '@/shared/routes/PublicRoute';

// Lazy-loaded Pages (code-split by route)
const Dashboard = lazy(() => import('@/pages/DashboardPage').then(m => ({ default: m.Dashboard })));
const Patients = lazy(() => import('@/pages/PatientsPage').then(m => ({ default: m.Patients })));
const Orders = lazy(() => import('@/pages').then(m => ({ default: m.OrdersPage })));
const Catalog = lazy(() => import('@/pages/CatalogPage').then(m => ({ default: m.Catalog })));
const Laboratory = lazy(() =>
  import('@/pages/LaboratoryPage').then(m => ({ default: m.Laboratory }))
);
const Appointments = lazy(() =>
  import('@/pages/AppointmentsPage').then(m => ({ default: m.Appointments }))
);
const Payments = lazy(() => import('@/pages/PaymentsPage').then(m => ({ default: m.Payments })));
const Reports = lazy(() => import('@/pages/ReportsPage').then(m => ({ default: m.Reports })));
const Admin = lazy(() => import('@/pages/AdminPage').then(m => ({ default: m.Admin })));

// Utils & Config
import { ROUTES } from '@/config';

/**
 * Loading fallback component for route transitions
 */
const PageLoadingFallback: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center">
    <LoadingState message="Loading page..." />
  </div>
);

/**
 * Wrapper for protected routes. AuthRehydrationGate (mounted once in app) clears
 * isLoading after one frame so we never stick on "Loading page...".
 */
interface ProtectedFeatureRouteProps {
  children: React.ReactNode;
}

const ProtectedFeatureRoute: React.FC<ProtectedFeatureRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) return <PageLoadingFallback />;
  if (!isAuthenticated) return <Navigate to={ROUTES.LOGIN} replace />;

  return (
    <DashboardLayout>
      <ErrorBoundary homeHref="/dashboard">{children}</ErrorBoundary>
    </DashboardLayout>
  );
};

/**
 * App Routes Component (needs to be inside AuthProvider to use useAuth)
 * All protected routes are wrapped with Suspense for code splitting
 */
const AppRoutes: React.FC = () => {
  return (
    <Routes>
        {/* Public Routes */}
        <Route
          path={ROUTES.LOGIN}
          element={
            <PublicRoute>
              <LoginForm />
            </PublicRoute>
          }
        />

        {/* Protected Routes with Code Splitting */}
        <Route
          path={ROUTES.DASHBOARD}
          element={
            <Suspense fallback={<PageLoadingFallback />}>
              <ProtectedFeatureRoute>
                <Dashboard />
              </ProtectedFeatureRoute>
            </Suspense>
          }
        />
        <Route
          path={`${ROUTES.PATIENTS}/*`}
          element={
            <Suspense fallback={<PageLoadingFallback />}>
              <ProtectedFeatureRoute>
                <Patients />
              </ProtectedFeatureRoute>
            </Suspense>
          }
        />
        <Route
          path={`${ROUTES.ORDERS}/*`}
          element={
            <Suspense fallback={<PageLoadingFallback />}>
              <ProtectedFeatureRoute>
                <Orders />
              </ProtectedFeatureRoute>
            </Suspense>
          }
        />
        <Route
          path={`${ROUTES.CATALOG}/*`}
          element={
            <Suspense fallback={<PageLoadingFallback />}>
              <ProtectedFeatureRoute>
                <Catalog />
              </ProtectedFeatureRoute>
            </Suspense>
          }
        />
        <Route
          path={ROUTES.LABORATORY}
          element={
            <Suspense fallback={<PageLoadingFallback />}>
              <ProtectedFeatureRoute>
                <Laboratory />
              </ProtectedFeatureRoute>
            </Suspense>
          }
        />
        <Route
          path={ROUTES.APPOINTMENTS}
          element={
            <Suspense fallback={<PageLoadingFallback />}>
              <ProtectedFeatureRoute>
                <Appointments />
              </ProtectedFeatureRoute>
            </Suspense>
          }
        />
        <Route
          path={ROUTES.PAYMENTS}
          element={
            <Suspense fallback={<PageLoadingFallback />}>
              <ProtectedFeatureRoute>
                <Payments />
              </ProtectedFeatureRoute>
            </Suspense>
          }
        />
        <Route
          path={`${ROUTES.REPORTS}/*`}
          element={
            <Suspense fallback={<PageLoadingFallback />}>
              <ProtectedFeatureRoute>
                <Reports />
              </ProtectedFeatureRoute>
            </Suspense>
          }
        />
        <Route
          path={ROUTES.ADMIN}
          element={
            <Suspense fallback={<PageLoadingFallback />}>
              <ProtectedFeatureRoute>
                <Admin />
              </ProtectedFeatureRoute>
            </Suspense>
          }
        />

        {/* Default redirect */}
        <Route path={ROUTES.HOME} element={<Navigate to={ROUTES.LOGIN} replace />} />
        <Route path="*" element={<Navigate to={ROUTES.LOGIN} replace />} />
      </Routes>
  );
};

/**
 * Main App Component
 * Wrapped with global ErrorBoundary for catastrophic error handling
 */
const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <Router>
        <AppProviders>
          <AuthRehydrationGate>
            <DataLoader>
              <AppRoutes />
              <ModalRenderer />
            <Toaster
              position="bottom-right"
              containerClassName="app-toaster"
              toastOptions={{
                duration: 3000,
                success: {
                  duration: 3000,
                  iconTheme: { primary: 'var(--success)', secondary: 'var(--success-bg)' },
                },
                error: {
                  duration: 4000,
                  iconTheme: { primary: 'var(--danger)', secondary: 'var(--danger-bg)' },
                },
              }}
            >
              {(t) => <AppToastBar toast={t} />}
            </Toaster>
            </DataLoader>
          </AuthRehydrationGate>
        </AppProviders>
      </Router>
    </ErrorBoundary>
  );
};

export { App };
