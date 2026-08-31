/**
 * Order Mutation Hooks
 * Provides hooks for creating, updating, and deleting orders
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query';
import { invalidateOrderQueries } from '@/lib/query/invalidate';
import { orderAPI } from '@/features/orders/api/orders';
import { getErrorMessage } from '@/utils/errors';
import { toast } from '@/app/AppToastBar';
import {
  orderCreateSchema,
  orderUpdateSchema,
  orderSchema,
} from '@/features/orders/schemas/order.schema';
import { formInputToPayload } from '@/features/orders/utils/form-transformers';
import type { Order, TestStatus } from '@/types';

/**
 * Mutation hook to create a new order with Zod validation.
 */
export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: unknown) => {
      const validated = orderCreateSchema.parse(input);
      const transformed = formInputToPayload(validated);
      const response = await orderAPI.create(transformed);
      return orderSchema.parse(response) as Order;
    },
    onSuccess: () => {
      invalidateOrderQueries(queryClient, { samples: true });
      toast.success('Order created successfully');
    },
    onError: error => {
      toast.error(`Failed to create order: ${getErrorMessage(error, 'Unknown error')}`);
    },
  });
}

/**
 * Mutation hook to update an existing order with Zod validation and optimistic updates.
 */
export function useUpdateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, data }: { orderId: number; data: unknown }) => {
      const validated = orderUpdateSchema.parse(data);
      const transformed = formInputToPayload(validated);
      const response = await orderAPI.update(orderId.toString(), transformed);
      return orderSchema.parse(response) as Order;
    },
    onMutate: async ({ orderId, data }) => {
      const orderIdStr = orderId.toString();

      await queryClient.cancelQueries({ queryKey: queryKeys.orders.all });

      const previousOrder = queryClient.getQueryData<Order>(queryKeys.orders.byId(orderIdStr));

      if (previousOrder) {
        queryClient.setQueryData<Order>(queryKeys.orders.byId(orderIdStr), {
          ...previousOrder,
          ...(typeof data === 'object' && data !== null ? data : {}),
          updatedAt: new Date().toISOString(),
        });
      }

      return { previousOrder };
    },
    onError: (error, variables, context) => {
      const orderIdStr = variables.orderId.toString();
      if (context?.previousOrder) {
        queryClient.setQueryData(queryKeys.orders.byId(orderIdStr), context.previousOrder);
      }
      toast.error({
        title: 'Failed to update order',
        subtitle: getErrorMessage(error, 'The order could not be updated. Please try again.'),
      });
    },
    onSuccess: (_, variables) => {
      invalidateOrderQueries(queryClient, { orderId: variables.orderId.toString(), samples: true });
      toast.success('Order updated successfully');
    },
    onSettled: (_, __, variables) => {
      const orderIdStr = variables.orderId.toString();
      invalidateOrderQueries(queryClient, { orderId: orderIdStr, samples: true });
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
      invalidateOrderQueries(queryClient, { samples: true });
    },
    onError: error => {
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
      invalidateOrderQueries(queryClient, { orderId: orderIdStr, samples: true });
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
      invalidateOrderQueries(queryClient, { orderId: orderIdStr, payments: true });
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
      invalidateOrderQueries(queryClient, { orderId: orderIdStr, samples: false });
    },
  });
}
