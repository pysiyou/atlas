/**
 * PaymentFilters — FilterBar wrapper keeping the list-page prop interface.
 */

import React, { useMemo } from 'react';
import { FeatureFilterBar } from '@/hooks';
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
  const value = useMemo(
    () => ({ search: searchQuery, statusFilters, dateRange }),
    [searchQuery, statusFilters, dateRange],
  );

  return (
    <FeatureFilterBar
      config={paymentFilterConfig}
      value={value}
      handlers={{
        search: onSearchChange,
        statusFilters: onStatusFiltersChange,
        dateRange: onDateRangeChange,
      }}
    />
  );
};
