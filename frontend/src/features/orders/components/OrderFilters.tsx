/**
 * OrderFilters — FilterBar wrapper keeping the list-page prop interface.
 */

import { useMemo } from 'react';
import { FeatureFilterBar } from '@/components/filters';
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

export function OrderFilters({
  searchQuery,
  onSearchChange,
  dateRange,
  onDateRangeChange,
  statusFilters,
  onStatusFiltersChange,
}: OrderFiltersProps) {
  const value = useMemo(
    () => ({ search: searchQuery, status: statusFilters, dateRange }),
    [searchQuery, statusFilters, dateRange],
  );

  return (
    <FeatureFilterBar
      config={orderFilterConfig}
      value={value}
      handlers={{
        search: onSearchChange,
        status: onStatusFiltersChange,
        dateRange: onDateRangeChange,
      }}
    />
  );
}
