/**
 * User display hook
 * Returns helper functions to display user information
 * 
 * Uses the UsersContext to look up user names by ID.
 * Falls back gracefully if user data is not available.
 */

import { useUsers } from '@/features/user';

export const useUserDisplay = () => {
  const { getUserName, getUserInfo } = useUsers();

  return {
    /**
     * Get user's name by ID
     * @param userId - The user's ID
     * @returns User's name, or fallback string if not found
     */
    getUserName: (userId: string) => getUserName(userId),

    /**
     * Get full user info by ID (for more detailed displays)
     * @param userId - The user's ID
     * @returns User display info object, or undefined if not found
     */
    getUserInfo,
  };
};
