/**
 * Payment API hooks — React Query layer.
 */
import { WORKFLOW_QUERY_LIMIT } from '@/lib/api/constants';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { queryKeys, cacheConfig } from '@/lib/query';
import { invalidateOrderQueries, useInvalidateQueryKey, invalidatePaymentDetailQueries } from '@/lib/query/invalidate';
import { useAuthStore } from '@/app/store';
import type { PaymentMethod } from '@/types';
import { paymentAPI } from './payments.service';

export {
  paymentAPI,
  type PaymentCreate,
  type PaymentFilters,
} from './payments.service';

export interface PaymentsFilters {
  orderId?: string;
  paymentMethod?: PaymentMethod;
  limit?: number;
}

export function usePaymentsList(filters?: PaymentsFilters) {
  const { isAuthenticated, isLoading: isRestoring } = useAuthStore();

  const query = useQuery({
    queryKey: queryKeys.payments.list(filters),
    queryFn: () => paymentAPI.getAll(filters),
    enabled: isAuthenticated && !isRestoring,
    ...cacheConfig.dynamic,
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

/** Fetch payments only for the given order IDs (paginated list join). */
export function usePaymentsForOrderIds(orderIds: number[]) {
  const { isAuthenticated, isLoading: isRestoring } = useAuthStore();
  const cacheKey = useMemo(
    () => [...orderIds].sort((a, b) => a - b).join(','),
    [orderIds]
  );

  const query = useQuery({
    queryKey: [...queryKeys.payments.all, 'for-orders', cacheKey] as const,
    queryFn: async () => {
      const batches = await Promise.all(orderIds.map(id => paymentAPI.getByOrder(String(id))));
      return batches.flat();
    },
    enabled: isAuthenticated && !isRestoring && orderIds.length > 0,
    ...cacheConfig.dynamic,
  });

  return {
    payments: query.data ?? [],
    isLoading: query.isLoading,
  };
}

export function usePayment(paymentId: string | undefined) {
  const { isAuthenticated, isLoading: isRestoring } = useAuthStore();

  const query = useQuery({
    queryKey: queryKeys.payments.byId(paymentId ?? ''),
    queryFn: () => paymentAPI.getById(paymentId!),
    enabled: isAuthenticated && !isRestoring && !!paymentId,
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

export function usePaymentsByOrder(orderId: string | undefined) {
  const { isAuthenticated, isLoading: isRestoring } = useAuthStore();

  const query = useQuery({
    queryKey: queryKeys.payments.byOrder(orderId ?? ''),
    queryFn: () => paymentAPI.getByOrder(orderId!),
    enabled: isAuthenticated && !isRestoring && !!orderId,
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

export function usePaymentMethodByOrder() {
  const { payments, isLoading } = usePaymentsList({ limit: WORKFLOW_QUERY_LIMIT });

  const paymentMethodMap = useMemo(() => {
    const map = new Map<number, PaymentMethod>();
    const sortedPayments = [...payments].sort(
      (a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime()
    );

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

export interface CreatePaymentData {
  orderId: string | number;
  amount: number;
  paymentMethod: PaymentMethod;
  notes?: string;
}

export function useCreatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreatePaymentData) => {
      const { paymentFormSchema } = await import('@/features/payments/schemas/payment.schema');
      const validated = paymentFormSchema.parse(data);
      return paymentAPI.create(validated);
    },
    onSuccess: (_, variables) => {
      const orderIdStr =
        typeof variables.orderId === 'string' ? variables.orderId : String(variables.orderId);
      invalidateOrderQueries(queryClient, { orderId: orderIdStr, payments: true });
    },
  });
}

export function useInvalidatePayments() {
  const queryClient = useQueryClient();
  const { invalidateAll } = useInvalidateQueryKey(queryKeys.payments.all);

  const invalidatePayment = (paymentId: string) => {
    return invalidatePaymentDetailQueries(queryClient, { paymentId });
  };

  const invalidateByOrder = (orderId: string) => {
    return invalidatePaymentDetailQueries(queryClient, { orderId });
  };

  return { invalidateAll, invalidatePayment, invalidateByOrder };
}
