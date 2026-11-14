/**
 * Main App Component
 * Sets up routing and context providers with error boundaries
 * Implements route-based code splitting for optimal performance
 */

import React, { lazy, Suspense, type ComponentType, type LazyExoticComponent } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import { AppProviders } from '@/app/AppProviders';
import { ToastHost, ErrorBoundary, TOAST_DEFAULT_DURATION_MS } from '@/feedback';
import { PageLoadingFallback } from '@/components/feedback';
import { InitialDataPreload } from '@/app/InitialDataPreload';
import { ProtectedLayout } from '@/app/ProtectedLayout';
import { PublicRoute } from '@/app/PublicRoute';
import { ModalRenderer } from '@/app/modals/ModalRenderer';
import { ROUTES } from '@/config';
import { isFeatureEnabled } from '@/config/clientConfig';

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

/** Login is code-split so its decorative SVGs stay off the authenticated bundle. */
const LoginPage = lazyNamed(() => import('@/features/auth'), 'LoginPage');
const Dashboard = lazyNamed(
  () => import('@/features/dashboard'),
  'DashboardPage'
);
const Patients = lazyNamed(() => import('@/features/patients'), 'PatientsPage');
const Orders = lazyNamed(() => import('@/features/orders'), 'OrdersPage');
const Catalog = lazyNamed(() => import('@/features/catalog'), 'CatalogPage');
const Laboratory = lazyNamed(() => import('@/features/lab/routes'), 'LaboratoryPage');
const LabAllTests = lazyNamed(() => import('@/features/lab/routes'), 'LabAllTestsPage');
const Payments = lazyNamed(() => import('@/features/payments'), 'PaymentListPage');
const Reports = lazyNamed(() => import('@/features/reports'), 'ReportsPage');
const EventLog = lazyNamed(() => import('@/features/audit'), 'EventLogPage');
const Users = lazyNamed(() => import('@/features/users'), 'UsersPage');
interface ProtectedRouteConfig {
  path: string;
  element: LazyPage;
  featureKey?: string; // Optional feature flag key
}

const PROTECTED_ROUTES: ProtectedRouteConfig[] = [
  { path: ROUTES.DASHBOARD, element: Dashboard, featureKey: 'dashboard' },
  { path: `${ROUTES.PATIENTS}/*`, element: Patients, featureKey: 'patients' },
  { path: `${ROUTES.ORDERS}/*`, element: Orders, featureKey: 'orders' },
  { path: `${ROUTES.CATALOG}/*`, element: Catalog, featureKey: 'catalog' },
  { path: ROUTES.LABORATORY, element: Laboratory, featureKey: 'laboratory' },
  { path: `${ROUTES.LABORATORY}/:tab`, element: Laboratory, featureKey: 'laboratory' },
  { path: ROUTES.LAB_ALL_TESTS, element: LabAllTests, featureKey: 'laboratory' },
  { path: ROUTES.PAYMENTS, element: Payments, featureKey: 'payments' },
  { path: `${ROUTES.REPORTS}/*`, element: Reports, featureKey: 'reports' },
  { path: ROUTES.EVENT_LOG, element: EventLog, featureKey: 'audit' },
  { path: ROUTES.USERS, element: Users, featureKey: 'users' },
];

const AppRoutes: React.FC = () => {
  // Filter routes based on feature flags
  const enabledRoutes = PROTECTED_ROUTES.filter(route => {
    if (!route.featureKey) return true; // No feature key means always enabled
    return isFeatureEnabled(route.featureKey);
  });

  return (
    <Routes>
      <Route
        path={ROUTES.LOGIN}
        element={
          <PublicRoute>
            <Suspense fallback={<PageLoadingFallback />}>
              <LoginPage />
            </Suspense>
          </PublicRoute>
        }
      />

      <Route element={<ProtectedLayout />}>
        {enabledRoutes.map(({ path, element: Page }) => (
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
            <ToastHost toastOptions={{ duration: TOAST_DEFAULT_DURATION_MS, removeDelay: 0 }} />
          </InitialDataPreload>
        </AppProviders>
      </Router>
    </ErrorBoundary>
  );
};

export { App };
