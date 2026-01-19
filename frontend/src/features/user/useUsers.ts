/**
 * Custom hook for accessing users context
 */

import { useContext } from 'react';
import { UsersContext } from './UsersContext';

/**
 * Hook to access users context
 * @throws Error if used outside of UsersProvider
 */
export const useUsers = () => {
  const context = useContext(UsersContext);

  if (context === undefined) {
    throw new Error('useUsers must be used within a UsersProvider');
  }

  return context;
};
