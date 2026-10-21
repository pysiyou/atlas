/**
 * OrderFilters — FilterBar wrapper keeping the list-page prop interface.
 */

import React, { useMemo } from 'react';
import { FeatureFilterBar } from '@/hooks';
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
};
