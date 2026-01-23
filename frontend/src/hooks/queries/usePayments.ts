/**
 * Payments Query Hook
 * 
 * Provides access to payment data with dynamic caching (30s stale time).
 * Payments change frequently during billing operations.
 * 
 * @module hooks/queries/usePayments
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { queryKeys, cacheConfig } from '@/lib/query';
import { getPayments, getPayment, getPaymentsByOrder, createPayment } from '@/services/api/payments';
import { useAuth } from '@/features/auth/useAuth';
import type { PaymentMethod } from '@/types';

/**
 * Filter options for payments list
 */
export interface PaymentsFilters {
  orderId?: string;
  paymentMethod?: PaymentMethod;
}

/**
 * Hook to fetch and cache all payments.
 * Uses dynamic cache - data is considered fresh for 30 seconds.
 * Only fetches when user is authenticated to prevent race conditions on login.
 * 
 * @param filters - Optional filters to apply
 * @returns Query result containing payments array and loading state
 * 
 * @example
 * ```tsx
 * const { payments, isLoading, error } = usePaymentsList();
 * ```
 */
export function usePaymentsList(filters?: PaymentsFilters) {
  const { isAuthenticated } = useAuth();

  const query = useQuery({
    queryKey: queryKeys.payments.list(filters),
    queryFn: () => getPayments(filters),
    enabled: isAuthenticated, // Only fetch when authenticated
    ...cacheConfig.dynamic, // 30s stale, 5 min gc
  });

  return {
    payments: query.data ?? [],
    isLoading: query.isLoading,
    isPending: query.isPending,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook to fetch a single payment by ID.
 * Only fetches when user is authenticated to prevent race conditions on login.
 * 
 * @param paymentId - The payment ID to fetch
 * @returns Query result with payment data
 * 
 * @example
 * ```tsx
 * const { payment, isLoading } = usePayment('PAY-001');
 * ```
 */
export function usePayment(paymentId: string | undefined) {
  const { isAuthenticated } = useAuth();

  const query = useQuery({
    queryKey: queryKeys.payments.byId(paymentId ?? ''),
    queryFn: () => getPayment(paymentId!),
    enabled: isAuthenticated && !!paymentId, // Only fetch when authenticated
    ...cacheConfig.dynamic,
  });

  return {
    payment: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook to get payments by order ID.
 * Only fetches when user is authenticated to prevent race conditions on login.
 * 
 * @param orderId - The order ID to filter by
 * @returns Array of payments for the order
 */
export function usePaymentsByOrder(orderId: string | undefined) {
  const { isAuthenticated } = useAuth();

  const query = useQuery({
    queryKey: queryKeys.payments.byOrder(orderId ?? ''),
    queryFn: () => getPaymentsByOrder(orderId!),
    enabled: isAuthenticated && !!orderId, // Only fetch when authenticated
    ...cacheConfig.dynamic,
  });

  return {
    payments: query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
  };
}

/**
 * Hook to get a map of order ID to most recent payment method.
 * Useful for displaying payment methods in order lists.
 * 
 * @returns Map of orderId to PaymentMethod
 */
export function usePaymentMethodByOrder() {
  const { payments, isLoading } = usePaymentsList();

  const paymentMethodMap = useMemo(() => {
    const map = new Map<number, PaymentMethod>();
    
    // Sort payments by date descending to get most recent first
    const sortedPayments = [...payments].sort(
      (a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime()
    );
    
    // Map each order to its most recent payment method
    for (const payment of sortedPayments) {
      if (!map.has(payment.orderId)) {
        map.set(payment.orderId, payment.paymentMethod);
      }
    }
    
    return map;
  }, [payments]);

  return {
    paymentMethodMap,
    isLoading,
    getPaymentMethod: (orderId: number | string) => {
      const numericId = typeof orderId === 'string' ? parseInt(orderId, 10) : orderId;
      if (isNaN(numericId)) return undefined;
      return paymentMethodMap.get(numericId);
    },
  };
}

/**
 * Create payment request data
 */
export interface CreatePaymentData {
  orderId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  notes?: string;
}

/**
 * Mutation hook to create a new payment.
 * Invalidates relevant caches on success.
 * 
 * @returns Mutation result with mutate function
 * 
 * @example
 * ```tsx
 * const { mutate: addPayment, isPending } = useCreatePayment();
 * addPayment({ orderId: 'ORD-001', amount: 100, paymentMethod: 'cash' });
 * ```
 */
export function useCreatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePaymentData) => createPayment(data),
    onSuccess: (_, variables) => {
      // Invalidate payments list and order-specific payments
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.byOrder(variables.orderId) });
      // Also invalidate orders since payment status may have changed
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
    },
  });
}

/**
 * Hook to invalidate payment caches.
 * 
 * @returns Object with invalidate functions
 */
export function useInvalidatePayments() {
  const queryClient = useQueryClient();

  const invalidateAll = () => {
    return queryClient.invalidateQueries({ queryKey: queryKeys.payments.all });
  };

  const invalidatePayment = (paymentId: string) => {
    return queryClient.invalidateQueries({ queryKey: queryKeys.payments.byId(paymentId) });
  };

  const invalidateByOrder = (orderId: string) => {
    return queryClient.invalidateQueries({ queryKey: queryKeys.payments.byOrder(orderId) });
  };

  return { invalidateAll, invalidatePayment, invalidateByOrder };
}
