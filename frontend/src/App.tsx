/**
 * Main App Component
 * Sets up routing and context providers with error boundaries
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Composed Providers
import { AppProviders } from '@/shared/providers';
import { DataLoader } from '@/shared/components/DataLoader';
import { ErrorBoundary } from '@/shared/components/ErrorBoundary';
import { FeatureErrorBoundary } from '@/shared/components/FeatureErrorBoundary';

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
  PaymentsPage as Payments,
  ReportsPage as Reports,
  AdminPage as Admin,
} from '@/pages';

// Utils & Config
import { ROUTES } from '@/config';

/**
 * Wrapper component for protected routes with feature error boundary
 */
interface ProtectedFeatureRouteProps {
  children: React.ReactNode;
  featureName: string;
}

const ProtectedFeatureRoute: React.FC<ProtectedFeatureRouteProps> = ({ 
  children, 
  featureName 
}) => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }
  
  return (
    <DashboardLayout>
      <FeatureErrorBoundary featureName={featureName}>
        {children}
      </FeatureErrorBoundary>
    </DashboardLayout>
  );
};

/**
 * App Routes Component (needs to be inside AuthProvider to use useAuth)
 */
const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path={ROUTES.LOGIN} element={<LoginForm />} />

      {/* Protected Routes with Feature Error Boundaries */}
      <Route
        path={ROUTES.DASHBOARD}
        element={
          <ProtectedFeatureRoute featureName="Dashboard">
            <Dashboard />
          </ProtectedFeatureRoute>
        }
      />
      <Route
        path={`${ROUTES.PATIENTS}/*`}
        element={
          <ProtectedFeatureRoute featureName="Patients">
            <Patients />
          </ProtectedFeatureRoute>
        }
      />
      <Route
        path={`${ROUTES.ORDERS}/*`}
        element={
          <ProtectedFeatureRoute featureName="Orders">
            <Orders />
          </ProtectedFeatureRoute>
        }
      />
      <Route
        path={ROUTES.LABORATORY}
        element={
          <ProtectedFeatureRoute featureName="Laboratory">
            <Laboratory />
          </ProtectedFeatureRoute>
        }
      />
      <Route
        path={ROUTES.APPOINTMENTS}
        element={
          <ProtectedFeatureRoute featureName="Appointments">
            <Appointments />
          </ProtectedFeatureRoute>
        }
      />
      <Route
        path={ROUTES.PAYMENTS}
        element={
          <ProtectedFeatureRoute featureName="Payments">
            <Payments />
          </ProtectedFeatureRoute>
        }
      />
      <Route
        path={ROUTES.REPORTS}
        element={
          <ProtectedFeatureRoute featureName="Reports">
            <Reports />
          </ProtectedFeatureRoute>
        }
      />
      <Route
        path={ROUTES.ADMIN}
        element={
          <ProtectedFeatureRoute featureName="Admin">
            <Admin />
          </ProtectedFeatureRoute>
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
    </ErrorBoundary>
  );
};

export default App;
