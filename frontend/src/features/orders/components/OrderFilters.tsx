/**
 * OrderFilters — FilterBar wrapper keeping the list-page prop interface.
 */

import React, { useMemo } from 'react';
import { FilterBar, type FilterValues } from '@/components/filters';
import { orderFilterConfig } from '../config/orderFilters.config';
import type { OrderStatus } from '@/types';

export interface OrderFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  dateRange: [Date, Date] | null;
  onDateRangeChange: (range: [Date, Date] | null) => void;
  statusFilters: OrderStatus[];
  onStatusFiltersChange: (values: OrderStatus[]) => void;
}

export const OrderFilters: React.FC<OrderFiltersProps> = ({
  searchQuery,
  onSearchChange,
  dateRange,
  onDateRangeChange,
  statusFilters,
  onStatusFiltersChange,
}) => {
  const filterValues = useMemo<FilterValues>(
    () => ({
      search: searchQuery,
      status: statusFilters,
      dateRange,
    }),
    [searchQuery, statusFilters, dateRange]
  );

  const handleFilterChange = (next: FilterValues) => {
    if (next.search !== undefined && next.search !== searchQuery) {
      onSearchChange((next.search as string) ?? '');
    }
    if (next.status !== undefined && next.status !== statusFilters) {
      onStatusFiltersChange((next.status as OrderStatus[]) ?? []);
    }
    if (next.dateRange !== undefined && next.dateRange !== dateRange) {
      onDateRangeChange((next.dateRange as [Date, Date] | null) ?? null);
    }
  };

  return <FilterBar config={orderFilterConfig} value={filterValues} onChange={handleFilterChange} />;
};
