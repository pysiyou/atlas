/**
 * Main App Component
 * Sets up routing and context providers
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Composed Providers
import { AppProviders } from '@/shared/providers';
import { DataLoader } from '@/shared/components/DataLoader';

// Components
import { LoginForm } from '@/features/auth/LoginForm';
import { AppLayout as DashboardLayout } from '@/shared/layout';
import { useAuth } from '@/features/auth/useAuth';
import { ModalRenderer } from '@/shared/ui';

// Pages
import {
  DashboardPage as Dashboard,
  PatientsPage as Patients,
  OrdersPage as Orders,
  LaboratoryPage as Laboratory,
  AppointmentsPage as Appointments,
  BillingPage as Billing,
  ReportsPage as Reports,
  AdminPage as Admin,
} from '@/pages';

// Utils & Config
import { ROUTES } from '@/config';

/**
 * Protected Route Component
 */
interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to={ROUTES.LOGIN} replace />;
};

/**
 * App Routes Component (needs to be inside AuthProvider to use useAuth)
 */
const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path={ROUTES.LOGIN} element={<LoginForm />} />

      {/* Protected Routes */}
      <Route
        path={ROUTES.DASHBOARD}
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Dashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path={`${ROUTES.PATIENTS}/*`}
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Patients />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path={`${ROUTES.ORDERS}/*`}
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Orders />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.LABORATORY}
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Laboratory />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.APPOINTMENTS}
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Appointments />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.BILLING}
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Billing />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.REPORTS}
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Reports />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.ADMIN}
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Admin />
            </DashboardLayout>
          </ProtectedRoute>
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
 */
const App: React.FC = () => {
  return (
    <Router>
      <AppProviders>
        <DataLoader>
          <AppRoutes />
        <ModalRenderer />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#fff',
              color: '#363636',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10B981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: '#EF4444',
                secondary: '#fff',
              },
            },
          }}
        />
        </DataLoader>
      </AppProviders>
    </Router>
  );
};

export default App;
