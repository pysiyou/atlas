/**
 * UserFilters — FilterBar wrapper for the user directory.
 */

import React, { useMemo } from 'react';
import { FilterBar, useFilterBarBridge } from '@/components/filters';
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
  const value = useMemo(
    () => ({
      search: searchQuery,
      role: roleFilters,
      accountStatus: statusFilters,
    }),
    [searchQuery, roleFilters, statusFilters]
  );

  const { filterValues, handleFilterChange } = useFilterBarBridge(value, {
    search: onSearchChange,
    role: onRoleFiltersChange,
    accountStatus: onStatusFiltersChange,
  });

  return <FilterBar config={userFilterConfig} value={filterValues} onChange={handleFilterChange} />;
};
