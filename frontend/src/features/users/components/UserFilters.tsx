/**
 * UserFilters — FilterBar wrapper for the user directory.
 */

import React, { useMemo } from 'react';
import { FilterBar, type FilterValues } from '@/components/filters';
import type { UserRole } from '@/types';
import { userFilterConfig } from '../constants/userFilterBar.config';
import type { UserAccountStatusFilter } from '../constants/userFilterConfig';

export interface UserFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  roleFilters: UserRole[];
  onRoleFiltersChange: (values: UserRole[]) => void;
  statusFilters: UserAccountStatusFilter[];
  onStatusFiltersChange: (values: UserAccountStatusFilter[]) => void;
}

export const UserFilters: React.FC<UserFiltersProps> = ({
  searchQuery,
  onSearchChange,
  roleFilters,
  onRoleFiltersChange,
  statusFilters,
  onStatusFiltersChange,
}) => {
  const filterValues = useMemo<FilterValues>(
    () => ({
      search: searchQuery,
      role: roleFilters,
      accountStatus: statusFilters,
    }),
    [searchQuery, roleFilters, statusFilters]
  );

  const handleFilterChange = (next: FilterValues) => {
    if (next.search !== undefined && next.search !== searchQuery) {
      onSearchChange((next.search as string) ?? '');
    }
    if (next.role !== undefined && next.role !== roleFilters) {
      onRoleFiltersChange((next.role as UserRole[]) ?? []);
    }
    if (next.accountStatus !== undefined && next.accountStatus !== statusFilters) {
      onStatusFiltersChange((next.accountStatus as UserAccountStatusFilter[]) ?? []);
    }
  };

  return <FilterBar config={userFilterConfig} value={filterValues} onChange={handleFilterChange} />;
};
