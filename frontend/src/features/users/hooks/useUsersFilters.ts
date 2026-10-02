/**
 * Client-side search and filters for the administrator user directory.
 */
import { useMemo, useState } from 'react';
import type { UserRole } from '@/types';
import type { UserAdminRecord } from '../api/usersAdmin';
import type { UserAccountStatusFilter } from '../constants/userFilterConfig';
import { isUserActive } from '../utils/userAccountGuards';

interface UseUsersFiltersOptions {
  users: UserAdminRecord[];
}

/**
 * Filter users by search text, role, and active/disabled status.
 *
 * @returns Filtered list plus filter state setters
 */
export function useUsersFilters({ users }: UseUsersFiltersOptions) {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilters, setRoleFilters] = useState<UserRole[]>([]);
  const [statusFilters, setStatusFilters] = useState<UserAccountStatusFilter[]>([]);

  const filteredUsers = useMemo(() => {
    let filtered = users;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(user => {
        const fields = [user.name, user.username, user.email ?? '', user.phone ?? ''];
        return fields.some(field => field.toLowerCase().includes(query));
      });
    }

    if (roleFilters.length > 0) {
      filtered = filtered.filter(user => roleFilters.includes(user.role));
    }

    if (statusFilters.length === 1) {
      const wantActive = statusFilters[0] === 'active';
      filtered = filtered.filter(user => isUserActive(user) === wantActive);
    }

    return filtered;
  }, [users, searchQuery, roleFilters, statusFilters]);

  return {
    filteredUsers,
    searchQuery,
    setSearchQuery,
    roleFilters,
    setRoleFilters,
    statusFilters,
    setStatusFilters,
  };
}
