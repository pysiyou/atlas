/**
 * OrderFilters — FilterBar wrapper keeping the list-page prop interface.
 */

import React, { useMemo } from 'react';
import { FilterBar } from '@/components/filters';
import { useFilterBarBridge } from '@/hooks/filters';
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
  const value = useMemo(
    () => ({
      search: searchQuery,
      status: statusFilters,
      dateRange,
    }),
    [searchQuery, statusFilters, dateRange]
  );

  const { filterValues, handleFilterChange } = useFilterBarBridge(value, {
    search: onSearchChange,
    status: onStatusFiltersChange,
    dateRange: onDateRangeChange,
  });

  return <FilterBar config={orderFilterConfig} value={filterValues} onChange={handleFilterChange} />;
};
