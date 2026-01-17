/**
 * Custom hook for authentication
 */

import { useContext } from 'react';
import { AuthContext } from './AuthContext';

/**
 * Hook to access authentication context
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};
