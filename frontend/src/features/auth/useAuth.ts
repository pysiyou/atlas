/**
 * Custom hook for authentication
 */

import { useContext } from 'react';
import { AuthContext, type AuthContextType } from './AuthContext';

/**
 * Hook to access authentication context
 * @returns AuthContextType with user state and auth methods
 * @throws Error if used outside of AuthProvider
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};
