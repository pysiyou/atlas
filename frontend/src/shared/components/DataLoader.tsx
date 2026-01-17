/**
 * Data Loader Component
 * Loads initial data from backend after authentication
 */

import { useEffect } from 'react';
import { useAuth } from '@/features/auth/useAuth';
import { usePatients } from '@/features/patient/PatientContext';

export const DataLoader: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { refreshPatients } = usePatients();

  useEffect(() => {
    if (isAuthenticated) {
      // Load patients when user is authenticated
      refreshPatients();
    }
  }, [isAuthenticated, refreshPatients]);

  return <>{children}</>;
};
