/**
 * Auth Navigation Setup Component
 * Sets up navigation callbacks for API client to use React Router navigation
 * Must be rendered inside Router context
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/services/api/client';
import { useAuth } from '../useAuth';

/**
 * Component that sets up navigation and auth state change callbacks
 * This allows the API client to trigger navigation and auth state changes
 * without directly depending on React Router
 */
export const AuthNavigationSetup: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    // Set up navigation callback for API client
    apiClient.setAuthCallbacks({
      onAuthStateChange: action => {
        if (action === 'logout') {
          logout();
        }
        // 'refresh' action is handled by AuthProvider automatically
      },
      onNavigate: path => {
        navigate(path);
      },
    });
  }, [navigate, logout]);

  return null; // This component doesn't render anything
};
