/**
 * Payment API service — pure HTTP, no React.
 */
import { apiClient } from '@/lib/api/client';
import { WORKFLOW_QUERY_LIMIT } from '@/lib/api/constants';
import { paymentResponseSchema, parseApiResponse } from '@/lib/api/schemas/responses.schema';
import type { ApiPaymentResponse } from '@/lib/api/types';
import type { Payment, PaymentMethod } from '@/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { DEFAULT_LIST_PAGE_SIZE } from '@/lib/api/constants';
import { queryKeys, cacheConfig, useAuthQueryEnabled } from '@/lib/query';
import {
  invalidateOrderQueries,
  useInvalidateQueryKey,
  invalidatePaymentDetailQueries,
  patchOrderSummaryInPaginatedCaches,
} from '@/lib/query/invalidate';
import {
  usePaginatedOrders,
  type OrdersFilters,
} from '@/features/orders/api/orders';
import { buildOrderPaymentViewsFromOrders } from '../utils/orderPaymentViews';

export interface PaymentCreate {
  orderId: number | string;
  amount: number;
  paymentMethod: PaymentMethod;
  notes?: string;
}

export interface PaymentFilters {
  orderId?: string;
  /** Comma-separated order IDs for a batched page join. */
  orderIds?: string;
  paymentMethod?: PaymentMethod;
  skip?: number;
  limit?: number;
}

function buildPaymentQueryParams(filters?: PaymentFilters): Record<string, string> {
  const params: Record<string, string> = {
    limit: String(filters?.limit ?? WORKFLOW_QUERY_LIMIT),
  };

  if (filters?.orderId) params.orderId = filters.orderId;
  if (filters?.orderIds) params.orderIds = filters.orderIds;
  if (filters?.paymentMethod) params.paymentMethod = filters.paymentMethod;
  if (filters?.skip !== undefined) params.skip = String(filters.skip);

  return params;
}

export function remainingPaymentAmount(
  totalPrice: number,
  payments: Array<{ amount: number }>
): number {
  const paid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  return Math.max(0, Math.round((totalPrice - paid) * 100) / 100);
}

export const paymentAPI = {
  getAll(filters?: PaymentFilters): Promise<Payment[]> {
    return apiClient.get<Payment[]>('/payments', buildPaymentQueryParams(filters));
  },

  getById(paymentId: string): Promise<Payment> {
    return apiClient.get<Payment>(`/payments/${paymentId}`);
  },

  getByOrder(orderId: string): Promise<Payment[]> {
    return apiClient.get<Payment[]>(`/payments/order/${orderId}`);
  },

  create(payment: PaymentCreate): Promise<Payment> {
    return apiClient
      .post<ApiPaymentResponse>('/payments', payment)
      .then(data => parseApiResponse(paymentResponseSchema, data, 'payment') as Payment);
  },
};

/**
 * Payment API hooks — React Query layer.
 */

export interface PaymentsFilters {
  orderId?: string;
  paymentMethod?: PaymentMethod;
  limit?: number;
}

export function usePaymentsList(filters?: PaymentsFilters) {
  const enabled = useAuthQueryEnabled();

  const query = useQuery({
    queryKey: queryKeys.payments.list(filters),
    queryFn: () => paymentAPI.getAll(filters),
    enabled,
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

/**
 * Server-paginated orders with `latestPayment` embed — single request for the payments list.
 */
export function usePaginatedPaymentOrders(
  filters?: OrdersFilters,
  initialPage = 1,
  pageSize = DEFAULT_LIST_PAGE_SIZE
) {
  const mergedFilters = useMemo(
    () => ({ ...filters, include: 'latestPayment' as const }),
    [filters]
  );
  const paginated = usePaginatedOrders(mergedFilters, initialPage, pageSize);

  const orderPaymentViews = useMemo(
    () => buildOrderPaymentViewsFromOrders(paginated.orders),
    [paginated.orders]
  );

  return {
    ...paginated,
    orderPaymentViews,
  };
}

/** Fetch payments only for the given order IDs (paginated list join). */
export function usePaymentsForOrderIds(orderIds: number[]) {
  const cacheKey = useMemo(
    () => [...orderIds].sort((a, b) => a - b).join(','),
    [orderIds]
  );
  const enabled = useAuthQueryEnabled(orderIds.length > 0);

  const query = useQuery({
    queryKey: queryKeys.payments.list({ orderIds: cacheKey }),
    queryFn: () =>
      paymentAPI.getAll({
        orderIds: cacheKey,
        limit: Math.max(orderIds.length * 4, 50),
      }),
    enabled,
    ...cacheConfig.dynamic,
  });

  return {
    payments: query.data ?? [],
    isLoading: query.isLoading,
  };
}

export function usePayment(paymentId: string | undefined) {
  const enabled = useAuthQueryEnabled(Boolean(paymentId));

  const query = useQuery({
    queryKey: queryKeys.payments.byId(paymentId ?? ''),
    queryFn: () => paymentAPI.getById(paymentId!),
    enabled,
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
  const enabled = useAuthQueryEnabled(Boolean(orderId));

  const query = useQuery({
    queryKey: queryKeys.payments.byOrder(orderId ?? ''),
    queryFn: () => paymentAPI.getByOrder(orderId!),
    enabled,
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

export function useOrderRemainingBalance(orderId: string | undefined, totalPrice: number) {
  const { payments, isLoading } = usePaymentsByOrder(orderId);
  return {
    remainingAmount: remainingPaymentAmount(totalPrice, payments),
    paymentsLoading: isLoading,
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
      const { paymentCreateSchema } = await import('@/features/payments/schemas/payment.schema');
      const validated = paymentCreateSchema.parse(data);
      return paymentAPI.create(validated);
    },
    onSuccess: (payment, variables) => {
      const orderIdStr =
        typeof variables.orderId === 'string' ? variables.orderId : String(variables.orderId);
      const orderIdNum = Number(orderIdStr);
      if (Number.isFinite(orderIdNum)) {
        patchOrderSummaryInPaginatedCaches(queryClient, orderIdNum, {
          latestPayment: {
            paymentId: payment.paymentId,
            paymentMethod: payment.paymentMethod,
            paidAt: payment.paidAt,
          },
        });
      }
      return invalidateOrderQueries(queryClient, {
        orderId: orderIdStr,
        payments: true,
        listsOnly: true,
      });
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
