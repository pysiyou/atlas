/**
 * usePaymentFilters Hook
 * 
 * Manages payment filter state and filtering logic
 */

import { useState, useMemo } from 'react';
import { useFiltering } from '@/utils/filtering';
import type { Payment, PaymentStatus, PaymentMethod } from '@/types';

interface UsePaymentFiltersOptions {
  payments: Payment[];
}

/**
 * Hook for managing payment filters
 */
export function usePaymentFilters({ payments }: UsePaymentFiltersOptions) {
  const [dateRange, setDateRange] = useState<[Date, Date] | null>(null);
  const [methodFilters, setMethodFilters] = useState<PaymentMethod[]>([]);

  // Use shared filtering hook for search
  const {
    filteredItems: preFilteredPayments,
    searchQuery,
    setSearchQuery,
  } = useFiltering<Payment, never>(payments, {
    searchFields: payment => [
      payment.paymentId.toString(),
      payment.orderId.toString(),
      payment.amount.toString(),
    ],
    defaultSort: { field: 'paidAt', direction: 'desc' },
  });

  const [statusFilters, setStatusFilters] = useState<PaymentStatus[]>([]);

  // Apply date range, status, and method filters separately
  const filteredPayments = useMemo(() => {
    let filtered = preFilteredPayments;

    // Apply date range filter
    if (dateRange) {
      const [startDate, endDate] = dateRange;
      filtered = filtered.filter(payment => {
        const paymentDate = new Date(payment.paidAt);
        return paymentDate >= startDate && paymentDate <= endDate;
      });
    }

    // Apply payment method filter
    if (methodFilters.length > 0) {
      filtered = filtered.filter(payment => methodFilters.includes(payment.paymentMethod));
    }

    return filtered;
  }, [preFilteredPayments, dateRange, methodFilters]);

  return {
    // Filtered results
    filteredPayments,
    
    // Search
    searchQuery,
    setSearchQuery,
    
    // Date range
    dateRange,
    setDateRange,
    
    // Status filters
    statusFilters,
    setStatusFilters,
    
    // Method filters
    methodFilters,
    setMethodFilters,
  };
}
