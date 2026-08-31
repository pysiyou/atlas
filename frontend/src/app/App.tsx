/**
 * Main App Component
 * Sets up routing and context providers with error boundaries
 * Implements route-based code splitting for optimal performance
 */

import React, { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { AppProviders } from '@/app/providers/AppProviders';
import { ErrorBoundary } from '@/components';
import { AppToastBar } from '@/app/AppToastBar';
import { InitialDataPreload } from '@/app/InitialDataPreload';
import { ProtectedLayout } from '@/app/ProtectedLayout';
import { PublicRoute } from '@/app/PublicRoute';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { ModalRenderer } from '@/components';
import { ROUTES } from '@/config';

type LazyPage = LazyExoticComponent<ComponentType>;

/** Lazy page loader that re-exports a named export as default for React.lazy */
function lazyNamed(
  factory: () => Promise<Record<string, ComponentType>>,
  exportName: string
): LazyPage {
  return lazy(() =>
    factory().then(m => {
      const Component = m[exportName];
      if (!Component) {
        throw new Error(`Missing export "${exportName}" from lazy route module`);
      }
      return { default: Component };
    })
  );
}

const Dashboard = lazyNamed(
  () => import('@/features/dashboard/pages/DashboardPage'),
  'Dashboard'
);
const Patients = lazyNamed(
  () => import('@/features/patients/pages/PatientsPage'),
  'Patients'
);
const Orders = lazyNamed(() => import('@/features/orders/pages/OrdersPage'), 'Orders');
const Catalog = lazyNamed(() => import('@/features/catalog/pages/CatalogPage'), 'Catalog');
const Laboratory = lazyNamed(
  () => import('@/features/lab/pages/LaboratoryPage'),
  'Laboratory'
);
const Payments = lazyNamed(
  () => import('@/features/payments/pages/PaymentList'),
  'PaymentList'
);
const Reports = lazyNamed(() => import('@/features/reports/pages/ReportsPage'), 'Reports');
interface ProtectedRouteConfig {
  path: string;
  element: LazyPage;
}

const PROTECTED_ROUTES: ProtectedRouteConfig[] = [
  { path: ROUTES.DASHBOARD, element: Dashboard },
  { path: `${ROUTES.PATIENTS}/*`, element: Patients },
  { path: `${ROUTES.ORDERS}/*`, element: Orders },
  { path: `${ROUTES.CATALOG}/*`, element: Catalog },
  { path: ROUTES.LABORATORY, element: Laboratory },
  { path: `${ROUTES.LABORATORY}/:tab`, element: Laboratory },
  { path: ROUTES.PAYMENTS, element: Payments },
  { path: `${ROUTES.REPORTS}/*`, element: Reports },
];

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route
        path={ROUTES.LOGIN}
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />

      <Route element={<ProtectedLayout />}>
        {PROTECTED_ROUTES.map(({ path, element: Page }) => (
          <Route key={path} path={path} element={<Page />} />
        ))}
      </Route>

      <Route path={ROUTES.HOME} element={<Navigate to={ROUTES.LOGIN} replace />} />
      <Route path="*" element={<Navigate to={ROUTES.LOGIN} replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <Router>
        <AppProviders>
          <InitialDataPreload>
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
          </InitialDataPreload>
        </AppProviders>
      </Router>
    </ErrorBoundary>
  );
};

export { App };
