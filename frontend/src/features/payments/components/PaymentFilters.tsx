/**
 * PaymentFilters — FilterBar wrapper keeping the list-page prop interface.
 */

import React, { useMemo } from 'react';
import { FilterBar, type FilterValues } from '@/components/filters';
import { paymentFilterConfig } from '../config/paymentFilters.config';
import type { PaymentStatus } from '@/types';

export interface PaymentFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  dateRange: [Date, Date] | null;
  onDateRangeChange: (range: [Date, Date] | null) => void;
  statusFilters: PaymentStatus[];
  onStatusFiltersChange: (values: PaymentStatus[]) => void;
}

export const PaymentFilters: React.FC<PaymentFiltersProps> = ({
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
      statusFilters,
      dateRange,
    }),
    [searchQuery, statusFilters, dateRange]
  );

  const handleFilterChange = (next: FilterValues) => {
    if (next.search !== undefined && next.search !== searchQuery) {
      onSearchChange((next.search as string) ?? '');
    }
    if (next.statusFilters !== undefined && next.statusFilters !== statusFilters) {
      onStatusFiltersChange((next.statusFilters as PaymentStatus[]) ?? []);
    }
    if (next.dateRange !== undefined && next.dateRange !== dateRange) {
      onDateRangeChange((next.dateRange as [Date, Date] | null) ?? null);
    }
  };

  return (
    <FilterBar config={paymentFilterConfig} value={filterValues} onChange={handleFilterChange} />
  );
};
