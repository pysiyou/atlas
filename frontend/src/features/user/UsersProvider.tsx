/**
 * Users Provider Component
 * 
 * MIGRATION NOTE: This provider now delegates to TanStack Query hooks.
 * It maintains backward compatibility for components still using the UsersContext.
 * 
 * New components should use the query hooks directly:
 * - useUsersList() for fetching users
 * - useUserLookup() for resolving user IDs to names
 * - useUsersMap() for the users map
 * 
 * This provider will be deprecated once all consumers are migrated.
 */

import React, { useMemo, useCallback, type ReactNode } from 'react';
import { UsersContext, type UsersContextType } from './UsersContext';
import { useUserLookup, useInvalidateUsers, useUsersList } from '@/hooks/queries';

interface UsersProviderProps {
  children: ReactNode;
}

/**
 * UsersProvider - Backward compatible wrapper around TanStack Query
 * 
 * Delegates data fetching to useUsersList() hook which provides:
 * - Infinity caching (users rarely change)
 * - Request deduplication
 * - Automatic error handling for permission issues
 */
export const UsersProvider: React.FC<UsersProviderProps> = ({ children }) => {
  // Delegate to TanStack Query hooks for data fetching
  const { isLoading, isError, error: queryError } = useUsersList();
  const { getUserName, getUserInfo, usersMap } = useUserLookup();
  const { invalidate } = useInvalidateUsers();

  // Format error for backward compatibility
  const error: string | null = useMemo(() => {
    if (!isError) return null;
    // Check if it's a permission error (expected for non-admin users)
    const apiError = queryError as { status?: number };
    if (apiError?.status === 401 || apiError?.status === 403) {
      return null; // Silently ignore permission errors
    }
    return queryError instanceof Error ? queryError.message : 'Failed to load users';
  }, [isError, queryError]);

  /**
   * Refresh users data
   */
  const refresh = useCallback(async () => {
    await invalidate();
  }, [invalidate]);

  const value: UsersContextType = useMemo(() => ({
    usersMap,
    getUserName,
    getUserInfo,
    isLoading,
    error,
    refresh,
  }), [usersMap, getUserName, getUserInfo, isLoading, error, refresh]);

  return <UsersContext.Provider value={value}>{children}</UsersContext.Provider>;
};
