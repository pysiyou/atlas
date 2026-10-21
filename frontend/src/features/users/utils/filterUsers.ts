import type { FilterValues } from '@/components/filters/types';
import type { UserRole } from '@/types';
import type { UserAdminRecord } from '../api/usersAdmin';
import type { UserAccountStatusFilter } from '../constants/userFilterConfig';
import { isUserActive } from './userAccountGuards';

export const usersListInitialFilters: FilterValues = {
  search: '',
  role: [] as UserRole[],
  accountStatus: [] as UserAccountStatusFilter[],
};

/** Client-side user directory filtering (search, role, account status). */
export function filterUsers(users: UserAdminRecord[], filters: FilterValues): UserAdminRecord[] {
  const searchQuery = (filters.search as string) ?? '';
  const roleFilters = (filters.role as UserRole[]) ?? [];
  const statusFilters = (filters.accountStatus as UserAccountStatusFilter[]) ?? [];

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
}
