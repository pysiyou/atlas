/**
 * Payment API Service + React Query hooks
 */
import { apiClient } from '@/lib/api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { queryKeys, cacheConfig } from '@/lib/query';
import { invalidateOrderQueries } from '@/lib/query/invalidate';
import { useAuthStore } from '@/app/store';
import type { Payment, PaymentMethod } from '@/types';

export interface PaymentCreate {
  orderId: number | string;
  amount: number;
  paymentMethod: PaymentMethod;
  notes?: string;
}

export interface PaymentFilters {
  orderId?: string;
  paymentMethod?: PaymentMethod;
  skip?: number;
  limit?: number;
}

/**
 * Get all payments with optional filters (requests up to backend max so tables can show full list)
 */
export const getPayments = async (filters?: PaymentFilters): Promise<Payment[]> => {
  const params = new URLSearchParams();
  params.append('limit', String(filters?.limit ?? 10000));

  if (filters?.orderId) params.append('orderId', filters.orderId);
  if (filters?.paymentMethod) params.append('paymentMethod', filters.paymentMethod);
  if (filters?.skip !== undefined) params.append('skip', filters.skip.toString());

  return apiClient.get<Payment[]>(`/payments?${params.toString()}`);
};

/**
 * Get a specific payment by ID
 */
export const getPayment = async (paymentId: string): Promise<Payment> => {
  return apiClient.get<Payment>(`/payments/${paymentId}`);
};

/**
 * Get all payments for a specific order
 */
export const getPaymentsByOrder = async (orderId: string): Promise<Payment[]> => {
  return apiClient.get<Payment[]>(`/payments/order/${orderId}`);
};

/**
 * Create a new payment
 */
export const createPayment = async (payment: PaymentCreate): Promise<Payment> => {
  return apiClient.post<Payment>('/payments', payment);
};


/**
 * Payments Query Hook
 *
 * Provides access to payment data with dynamic caching (30s stale time).
 * Payments change frequently during billing operations.
 *
 *  */

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
  const { isAuthenticated, isLoading: isRestoring } = useAuthStore();

  const query = useQuery({
    queryKey: queryKeys.payments.list(filters),
    queryFn: () => getPayments(filters),
    enabled: isAuthenticated && !isRestoring, // Only fetch when authenticated and not restoring
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
  const { isAuthenticated, isLoading: isRestoring } = useAuthStore();

  const query = useQuery({
    queryKey: queryKeys.payments.byId(paymentId ?? ''),
    queryFn: () => getPayment(paymentId!),
    enabled: isAuthenticated && !isRestoring && !!paymentId, // Only fetch when authenticated and not restoring
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
  const { isAuthenticated, isLoading: isRestoring } = useAuthStore();

  const query = useQuery({
    queryKey: queryKeys.payments.byOrder(orderId ?? ''),
    queryFn: () => getPaymentsByOrder(orderId!),
    enabled: isAuthenticated && !isRestoring && !!orderId, // Only fetch when authenticated and not restoring
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
  orderId: string | number;
  amount: number;
  paymentMethod: PaymentMethod;
  notes?: string;
}

/**
 * Mutation hook to create a new payment.
 * Invalidates relevant caches on success.
 * Validates input with paymentFormSchema before API call.
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
    mutationFn: async (data: CreatePaymentData) => {
      // Import schema for validation
      const { paymentFormSchema } = await import('@/features/payments/schemas/payment.schema');
      const validated = paymentFormSchema.parse(data);
      return createPayment(validated);
    },
    onSuccess: (_, variables) => {
      const orderIdStr =
        typeof variables.orderId === 'string' ? variables.orderId : String(variables.orderId);
      invalidateOrderQueries(queryClient, { orderId: orderIdStr, payments: true });
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
