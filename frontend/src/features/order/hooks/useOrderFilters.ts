/**
 * useOrderFilters Hook
 * 
 * Manages order filter state and filtering logic
 */

import { useState, useMemo } from 'react';
import { useFiltering } from '@/utils/filtering';
import type { Order, OrderStatus, PaymentStatus } from '@/types';

interface UseOrderFiltersOptions {
  orders: Order[];
  patientIdFilter?: string | null;
  getPatientName: (patientId: number) => string;
}

/**
 * Hook for managing order filters
 */
export function useOrderFilters({ orders, patientIdFilter, getPatientName }: UseOrderFiltersOptions) {
  const [dateRange, setDateRange] = useState<[Date, Date] | null>(null);
  const [paymentFilters, setPaymentFilters] = useState<PaymentStatus[]>([]);

  // Use shared filtering hook for search and order status filters
  const {
    filteredItems: preFilteredOrders,
    searchQuery,
    setSearchQuery,
    statusFilters,
    setStatusFilters,
  } = useFiltering<Order, OrderStatus>(orders, {
    searchFields: order => [
      order.orderId.toString(),
      order.patientId.toString(),
      getPatientName(order.patientId),
    ],
    statusField: 'overallStatus',
    defaultSort: { field: 'orderDate', direction: 'desc' },
  });

  // Apply date range, patient filter, and payment filters separately
  const filteredOrders = useMemo(() => {
    let filtered = preFilteredOrders;

    // Apply patientIdFilter
    if (patientIdFilter) {
      const numericPatientId =
        typeof patientIdFilter === 'string' ? parseInt(patientIdFilter, 10) : patientIdFilter;
      filtered = filtered.filter(order => order.patientId === numericPatientId);
    }

    // Apply date range filter
    if (dateRange) {
      const [startDate, endDate] = dateRange;
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.orderDate);
        return orderDate >= startDate && orderDate <= endDate;
      });
    }

    // Apply payment status filter
    if (paymentFilters.length > 0) {
      filtered = filtered.filter(order => paymentFilters.includes(order.paymentStatus));
    }

    return filtered;
  }, [preFilteredOrders, patientIdFilter, dateRange, paymentFilters]);

  return {
    // Filtered results
    filteredOrders,
    
    // Search
    searchQuery,
    setSearchQuery,
    
    // Date range
    dateRange,
    setDateRange,
    
    // Status filters
    statusFilters,
    setStatusFilters,
    
    // Payment filters
    paymentFilters,
    setPaymentFilters,
  };
}
