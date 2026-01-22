/**
 * PaymentFilters Component
 * 
 * Provides comprehensive filtering controls for the payments list using the new filter architecture.
 * Uses config-driven approach with FilterBar component.
 * 
 * @module features/payment
 */

import React, { useMemo } from 'react';
import { FilterBar } from '@/features/filters';
import { paymentFilterConfig } from './paymentFilterConfig';
import type { PaymentStatus, PaymentMethod } from '@/types';
import type { FilterValues } from '@/features/filters';

/**
 * Props interface for PaymentFilters component
 */
export interface PaymentFiltersProps {
  /** Current search query string */
  searchQuery: string;
  /** Callback fired when search query changes */
  onSearchChange: (value: string) => void;
  /** Currently selected date range [start, end] or null */
  dateRange: [Date, Date] | null;
  /** Callback fired when date range changes */
  onDateRangeChange: (range: [Date, Date] | null) => void;
  /** Array of currently selected payment statuses */
  statusFilters: PaymentStatus[];
  /** Callback fired when status filters change */
  onStatusFiltersChange: (values: PaymentStatus[]) => void;
  /** Array of currently selected payment methods */
  methodFilters: PaymentMethod[];
  /** Callback fired when method filters change */
  onMethodFiltersChange: (values: PaymentMethod[]) => void;
}

/**
 * PaymentFilters Component
 * 
 * Composes FilterBar with payment-specific configuration.
 * Maps between legacy prop interface and new filter value structure.
 * 
 * @component
 */
export const PaymentFilters: React.FC<PaymentFiltersProps> = ({
  searchQuery,
  onSearchChange,
  dateRange,
  onDateRangeChange,
  statusFilters,
  onStatusFiltersChange,
  methodFilters,
  onMethodFiltersChange,
}) => {
  /**
   * Convert props to filter values format
   */
  const filterValues = useMemo<FilterValues>(
    () => ({
      searchQuery,
      dateRange,
      status: statusFilters,
      method: methodFilters,
    }),
    [searchQuery, dateRange, statusFilters, methodFilters]
  );

  /**
   * Handle filter changes and map back to props
   */
  const handleFilterChange = (filters: FilterValues) => {
    if (filters.searchQuery !== undefined) {
      onSearchChange(filters.searchQuery as string);
    }
    if (filters.dateRange !== undefined) {
      onDateRangeChange(filters.dateRange as [Date, Date] | null);
    }
    if (filters.status !== undefined) {
      onStatusFiltersChange(filters.status as PaymentStatus[]);
    }
    if (filters.method !== undefined) {
      onMethodFiltersChange(filters.method as PaymentMethod[]);
    }
  };

  return (
    <FilterBar
      config={paymentFilterConfig}
      value={filterValues}
      onChange={handleFilterChange}
    />
  );
};
