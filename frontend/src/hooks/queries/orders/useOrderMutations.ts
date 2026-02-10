/**
 * Order Mutation Hooks
 * Provides hooks for creating, updating, and deleting orders
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query';
import { orderAPI } from '@/services/api/orders';
import { getErrorMessage } from '@/utils/errorHelpers';
import { toast } from '@/shared/components/feedback';
import type { Order, TestStatus } from '@/types';

/**
 * Mutation hook to create a new order
 */
export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (order: Partial<Order>) => orderAPI.create(order),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.samples.all });
    },
  });
}

/**
 * Mutation hook to update an existing order with optimistic updates
 */
export function useUpdateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, updates }: { orderId: number | string; updates: Partial<Order> }) => {
      const orderIdStr = typeof orderId === 'string' ? orderId : orderId.toString();
      return orderAPI.update(orderIdStr, updates);
    },
    onMutate: async ({ orderId, updates }) => {
      const orderIdStr = typeof orderId === 'string' ? orderId : orderId.toString();

      await queryClient.cancelQueries({ queryKey: queryKeys.orders.byId(orderIdStr) });
      await queryClient.cancelQueries({ queryKey: queryKeys.orders.lists() });

      const previousOrder = queryClient.getQueryData<Order>(queryKeys.orders.byId(orderIdStr));

      if (previousOrder) {
        queryClient.setQueryData<Order>(queryKeys.orders.byId(orderIdStr), {
          ...previousOrder,
          ...updates,
          updatedAt: new Date().toISOString(),
        });
      }

      return { previousOrder };
    },
    onError: (error, variables, context) => {
      const orderIdStr =
        typeof variables.orderId === 'string' ? variables.orderId : variables.orderId.toString();
      if (context?.previousOrder) {
        queryClient.setQueryData(queryKeys.orders.byId(orderIdStr), context.previousOrder);
      }
      toast.error({
        title: 'Failed to update order',
        subtitle: getErrorMessage(error, 'The order could not be updated. Please try again.'),
      });
    },
    onSettled: (_, __, variables) => {
      const orderIdStr =
        typeof variables.orderId === 'string' ? variables.orderId : variables.orderId.toString();
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.byId(orderIdStr) });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.samples.all });
    },
  });
}

/**
 * Mutation hook to delete an order
 */
export function useDeleteOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: number | string) => {
      const orderIdStr = typeof orderId === 'string' ? orderId : orderId.toString();
      return orderAPI.delete(orderIdStr);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists() });
    },
    onError: (error) => {
      toast.error({
        title: 'Failed to delete order',
        subtitle: getErrorMessage(error, 'The order could not be deleted. Please try again.'),
      });
    },
  });
}

/**
 * Mutation hook to update test status within an order
 */
export function useUpdateTestStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderId,
      testCode,
      status,
      additionalData,
    }: {
      orderId: number | string;
      testCode: string;
      status: TestStatus;
      additionalData?: Record<string, unknown>;
    }) => {
      const orderIdStr = typeof orderId === 'string' ? orderId : orderId.toString();
      return orderAPI.updateTestStatus(orderIdStr, testCode, status, additionalData);
    },
    onSuccess: (_, variables) => {
      const orderIdStr =
        typeof variables.orderId === 'string' ? variables.orderId : variables.orderId.toString();
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.byId(orderIdStr) });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists() });
    },
  });
}

/**
 * Mutation hook to update payment status
 */
export function useUpdatePaymentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderId,
      paymentStatus,
      amountPaid,
    }: {
      orderId: number | string;
      paymentStatus: string;
      amountPaid?: number;
    }) => {
      const orderIdStr = typeof orderId === 'string' ? orderId : orderId.toString();
      return orderAPI.updatePaymentStatus(orderIdStr, paymentStatus, amountPaid);
    },
    onSuccess: (_, variables) => {
      const orderIdStr =
        typeof variables.orderId === 'string' ? variables.orderId : variables.orderId.toString();
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.byId(orderIdStr) });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.all });
    },
  });
}

/**
 * Mutation hook to mark a test as having critical values
 */
export function useMarkTestCritical() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderId,
      testCode,
      notifiedTo,
    }: {
      orderId: number | string;
      testCode: string;
      notifiedTo: string;
    }) => {
      const orderIdStr = typeof orderId === 'string' ? orderId : orderId.toString();
      return orderAPI.markTestCritical(orderIdStr, testCode, notifiedTo);
    },
    onSuccess: (_, variables) => {
      const orderIdStr =
        typeof variables.orderId === 'string' ? variables.orderId : variables.orderId.toString();
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.byId(orderIdStr) });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists() });
    },
  });
}
