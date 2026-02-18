/**
 * Main App Component
 * Sets up routing and context providers with error boundaries
 * Implements route-based code splitting for optimal performance
 */

import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Composed Providers
import { AppProviders } from '@/app/providers/AppProviders';
import { AppToastBar, DataLoader, ErrorBoundary, LoadingState } from '@/components';
import { AuthRehydrationGate } from '@/features/auth/AuthRehydrationGate';

// Eagerly loaded components (small, frequently accessed)
import { LoginForm } from '@/features/auth/LoginForm';
import { AppLayout as DashboardLayout } from '@/components/layout';
import { useAuthStore } from '@/app/store';
import { ModalRenderer } from '@/components/ui';
import { PublicRoute } from '@/app/PublicRoute';

// Utils & Config
import { ROUTES } from '@/config';

// Lazy-loaded Pages (code-split by route, imports directly from features)
const Dashboard = lazy(() =>
  import('@/features/dashboard/DashboardPage').then(m => ({ default: m.Dashboard }))
);
const Patients = lazy(() =>
  import('@/features/patients/pages/PatientsPage').then(m => ({ default: m.Patients }))
);
const Orders = lazy(() =>
  import('@/features/orders/pages/OrdersPage').then(m => ({ default: m.Orders }))
);
const Catalog = lazy(() =>
  import('@/features/catalog/pages/CatalogPage').then(m => ({ default: m.Catalog }))
);
const Laboratory = lazy(() =>
  import('@/features/lab/pages/LaboratoryPage').then(m => ({ default: m.Laboratory }))
);
const Appointments = lazy(() =>
  import('@/features/appointments/AppointmentsPage').then(m => ({ default: m.Appointments }))
);
const Payments = lazy(() =>
  import('@/features/billing/pages/PaymentsPage').then(m => ({ default: m.Payments }))
);
const Reports = lazy(() =>
  import('@/features/reports/pages/ReportsPage').then(m => ({ default: m.Reports }))
);
const Admin = lazy(() =>
  import('@/features/admin/AdminPage').then(m => ({ default: m.Admin }))
);

/**
 * Loading fallback for route transitions (lazy chunk load) and auth rehydration.
 */
const PageLoadingFallback: React.FC = () => (
  <LoadingState message="Loading..." fullScreen size="lg" />
);

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
                {t => <AppToastBar toast={t} />}
              </Toaster>
            </DataLoader>
          </AuthRehydrationGate>
        </AppProviders>
      </Router>
    </ErrorBoundary>
  );
};

export { App };
