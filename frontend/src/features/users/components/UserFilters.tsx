/**
 * UserFilters — FilterBar wrapper for the user directory.
 */

import React, { useMemo } from 'react';
import type { FilterValues } from '@/components/filters/types';
import { FilterBar } from '@/components/filters';
import { useFilterBarBridge } from '@/hooks/filters';
import type { UserRole } from '@/types';
import { userFilterConfig } from '../constants/userFilterBar.config';
import type { UserAccountStatusFilter } from '../constants/userFilterConfig';

export interface UserFiltersProps {
  filters: FilterValues;
  setFilter: (key: string, value: unknown) => void;
}

export const UserFilters: React.FC<UserFiltersProps> = ({ filters, setFilter }) => {
  const value = useMemo(
    () => ({
      search: (filters.search as string) ?? '',
      role: (filters.role as UserRole[]) ?? [],
      accountStatus: (filters.accountStatus as UserAccountStatusFilter[]) ?? [],
    }),
    [filters],
  );

  const { filterValues, handleFilterChange } = useFilterBarBridge(value, {
    search: v => setFilter('search', v),
    role: v => setFilter('role', v),
    accountStatus: v => setFilter('accountStatus', v),
  });

  return <FilterBar config={userFilterConfig} value={filterValues} onChange={handleFilterChange} />;
};
