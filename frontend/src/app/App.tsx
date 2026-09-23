/**
 * Main App Component
 * Sets up routing and context providers with error boundaries
 * Implements route-based code splitting for optimal performance
 */

import React, { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { AppProviders } from '@/app/AppProviders';
import { ErrorBoundary } from '@/components';
import { AppToastBar } from '@/app/AppToastBar';
import { TOAST_DEFAULT_DURATION_MS } from '@/components/overlays/Toast';
import { InitialDataPreload } from '@/app/InitialDataPreload';
import { ProtectedLayout } from '@/app/ProtectedLayout';
import { PublicRoute } from '@/app/PublicRoute';
import { LoginPage } from '@/features/auth';
import { ModalRenderer } from '@/app/modals/ModalRenderer';
import { ROUTES } from '@/config';

type LazyPage = LazyExoticComponent<ComponentType>;

/** Lazy page loader that re-exports a named export as default for React.lazy */
function lazyNamed(
  factory: () => Promise<Record<string, unknown>>,
  exportName: string
): LazyPage {
  return lazy(() =>
    factory().then(m => {
      const Component = m[exportName];
      if (!Component || typeof Component !== 'function') {
        throw new Error(`Missing export "${exportName}" from lazy route module`);
      }
      return { default: Component as ComponentType };
    })
  );
}

const Dashboard = lazyNamed(
  () => import('@/features/dashboard'),
  'DashboardPage'
);
const Patients = lazyNamed(() => import('@/features/patients'), 'PatientsPage');
const Orders = lazyNamed(() => import('@/features/orders'), 'OrdersPage');
const Catalog = lazyNamed(() => import('@/features/catalog'), 'CatalogPage');
const Laboratory = lazyNamed(() => import('@/features/lab'), 'LaboratoryPage');
const Payments = lazyNamed(() => import('@/features/payments'), 'PaymentListPage');
const Reports = lazyNamed(() => import('@/features/reports'), 'ReportsPage');
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
                duration: TOAST_DEFAULT_DURATION_MS,
                removeDelay: 0,
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
