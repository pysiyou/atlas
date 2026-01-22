/**
 * OrderFilters Component
 * 
 * Provides comprehensive filtering controls for the orders list using the new filter architecture.
 * Uses config-driven approach with FilterBar component.
 * 
 * @module features/order
 */

import React, { useMemo } from 'react';
import { FilterBar } from '@/features/filters';
import { orderFilterConfig } from './orderFilterConfig';
import type { OrderStatus, PaymentStatus } from '@/types';
import type { FilterValues } from '@/features/filters';

/**
 * Props interface for OrderFilters component
 */
export interface OrderFiltersProps {
  /** Current search query string */
  searchQuery: string;
  /** Callback fired when search query changes */
  onSearchChange: (value: string) => void;
  /** Currently selected date range [start, end] or null */
  dateRange: [Date, Date] | null;
  /** Callback fired when date range changes */
  onDateRangeChange: (range: [Date, Date] | null) => void;
  /** Array of currently selected order statuses */
  statusFilters: OrderStatus[];
  /** Callback fired when order status filters change */
  onStatusFiltersChange: (values: OrderStatus[]) => void;
  /** Array of currently selected payment statuses */
  paymentFilters: PaymentStatus[];
  /** Callback fired when payment status filters change */
  onPaymentFiltersChange: (values: PaymentStatus[]) => void;
}

/**
 * OrderFilters Component
 * 
 * Composes FilterBar with order-specific configuration.
 * Maps between legacy prop interface and new filter value structure.
 * 
 * @component
 */
export const OrderFilters: React.FC<OrderFiltersProps> = ({
  searchQuery,
  onSearchChange,
  dateRange,
  onDateRangeChange,
  statusFilters,
  onStatusFiltersChange,
  paymentFilters,
  onPaymentFiltersChange,
}) => {
  /**
   * Convert props to filter values format
   */
  const filterValues = useMemo<FilterValues>(
    () => ({
      searchQuery,
      dateRange,
      status: statusFilters,
      payment: paymentFilters,
    }),
    [searchQuery, dateRange, statusFilters, paymentFilters]
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
      onStatusFiltersChange(filters.status as OrderStatus[]);
    }
    if (filters.payment !== undefined) {
      onPaymentFiltersChange(filters.payment as PaymentStatus[]);
    }
  };

  return (
    <FilterBar
      config={orderFilterConfig}
      value={filterValues}
      onChange={handleFilterChange}
    />
  );
};
