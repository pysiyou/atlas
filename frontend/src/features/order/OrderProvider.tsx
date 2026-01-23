/**
 * Orders Provider Component
 *
 * @deprecated This provider delegates to TanStack Query hooks and is kept for backward compatibility.
 * New components should use TanStack Query hooks directly from @/hooks/queries:
 * - useOrdersList() for fetching orders
 * - useOrder(id) for single order
 * - useCreateOrder() for creating orders
 * - useUpdateOrder() for updating orders
 * - useUpdateTestStatus() for updating test status
 *
 * This provider will be removed once all consumers are migrated to TanStack Query hooks.
 */

import React, { type ReactNode, useCallback, useMemo } from 'react';
import type { Order, OrderStatus, TestStatus, OrderTest } from '@/types';
import {
  OrdersContext,
  type OrdersContextType,
  type OrderError,
  type TestStatusUpdateData,
  type CollectionData,
} from './OrderContext';
import {
  useOrdersList,
  useCreateOrder,
  useUpdateOrder,
  useDeleteOrder,
  useUpdateTestStatus,
  useUpdatePaymentStatus,
  useMarkTestCritical,
  useInvalidateOrders,
} from '@/hooks/queries';
import {
  createReflexTest,
  createRepeatTest,
  getOrdersNeedingCollection,
  getAllTestsNeedingCollection,
} from '@/utils/orderUtils';
import { logger } from '@/utils/logger';

interface OrdersProviderProps {
  children: ReactNode;
}

/**
 * OrdersProvider - Backward compatible wrapper around TanStack Query
 *
 * Delegates data fetching to useOrdersList() hook which provides:
 * - 30 second stale time with background refetching
 * - Request deduplication
 * - Optimistic updates for mutations
 */
export const OrdersProvider: React.FC<OrdersProviderProps> = ({ children }) => {
  // Delegate to TanStack Query hooks for data fetching
  const { orders, isLoading: loading, isError, error: queryError, refetch } = useOrdersList();
  const { invalidateAll } = useInvalidateOrders();

  // Mutation hooks
  const createOrderMutation = useCreateOrder();
  const updateOrderMutation = useUpdateOrder();
  const deleteOrderMutation = useDeleteOrder();
  const updateTestStatusMutation = useUpdateTestStatus();
  const updatePaymentStatusMutation = useUpdatePaymentStatus();
  const markTestCriticalMutation = useMarkTestCritical();

  // Format error for backward compatibility
  const error: OrderError | null = useMemo(() => {
    if (!isError) return null;
    return {
      message: queryError instanceof Error ? queryError.message : 'Failed to load orders',
      operation: 'load',
    };
  }, [isError, queryError]);

  /**
   * Clear any error state
   */
  const clearError = useCallback(() => {
    // With TanStack Query, errors are cleared on successful refetch
  }, []);

  /**
   * Refresh orders from backend
   */
  const refreshOrders = useCallback(async () => {
    await invalidateAll();
    await refetch();
  }, [invalidateAll, refetch]);

  /**
   * Add a new order
   */
  const addOrder = useCallback(
    async (order: Order) => {
      try {
        await createOrderMutation.mutateAsync(order);
      } catch (err) {
        logger.error('Failed to create order', err instanceof Error ? err : undefined);
        throw err;
      }
    },
    [createOrderMutation]
  );

  /**
   * Update an existing order
   */
  const updateOrder = useCallback(
    async (orderId: number | string, updates: Partial<Order>) => {
      try {
        const numericId = typeof orderId === 'string' ? parseInt(orderId, 10) : orderId;
        await updateOrderMutation.mutateAsync({ orderId: numericId, updates });
      } catch (err) {
        logger.error('Failed to update order', err instanceof Error ? err : undefined);
        throw err;
      }
    },
    [updateOrderMutation]
  );

  /**
   * Delete an order
   */
  const deleteOrder = useCallback(
    async (orderId: number | string) => {
      try {
        const numericId = typeof orderId === 'string' ? parseInt(orderId, 10) : orderId;
        await deleteOrderMutation.mutateAsync(numericId);
      } catch (err) {
        logger.error('Failed to delete order', err instanceof Error ? err : undefined);
        throw err;
      }
    },
    [deleteOrderMutation]
  );

  /**
   * Get an order by ID (handles both number and string for URL compatibility)
   */
  const getOrder = useCallback(
    (orderId: number | string): Order | undefined => {
      const numericId = typeof orderId === 'string' ? parseInt(orderId, 10) : orderId;
      if (isNaN(numericId)) return undefined;
      return orders.find(order => order.orderId === numericId);
    },
    [orders]
  );

  /**
   * Update status of a specific test within an order
   */
  const updateTestStatus = useCallback(
    async (
      orderId: number | string,
      testCode: string,
      status: TestStatus,
      additionalData?: Partial<TestStatusUpdateData>
    ) => {
      try {
        const numericId = typeof orderId === 'string' ? parseInt(orderId, 10) : orderId;
        await updateTestStatusMutation.mutateAsync({
          orderId: numericId,
          testCode,
          status,
          additionalData: additionalData as Record<string, unknown>,
        });
      } catch (err) {
        logger.error('Failed to update test status', err instanceof Error ? err : undefined);
        throw err;
      }
    },
    [updateTestStatusMutation]
  );

  /**
   * Update overall order status
   */
  const updateOrderStatus = useCallback(
    (orderId: number | string, status: OrderStatus) => {
      updateOrder(orderId, { overallStatus: status });
    },
    [updateOrder]
  );

  /**
   * Update payment status
   */
  const updatePaymentStatus = useCallback(
    async (orderId: number | string, paymentStatus: string, amountPaid?: number) => {
      try {
        const numericId = typeof orderId === 'string' ? parseInt(orderId, 10) : orderId;
        await updatePaymentStatusMutation.mutateAsync({
          orderId: numericId,
          paymentStatus,
          amountPaid,
        });
      } catch (err) {
        logger.error('Failed to update payment status', err instanceof Error ? err : undefined);
        throw err;
      }
    },
    [updatePaymentStatusMutation]
  );

  /**
   * Get orders by status
   */
  const getOrdersByStatus = useCallback(
    (status: OrderStatus): Order[] => {
      return orders.filter(order => order.overallStatus === status);
    },
    [orders]
  );

  /**
   * Get orders by patient ID
   */
  const getOrdersByPatient = useCallback(
    (patientId: number | string): Order[] => {
      const numericId = typeof patientId === 'string' ? parseInt(patientId, 10) : patientId;
      if (isNaN(numericId)) return [];
      return orders.filter(order => order.patientId === numericId);
    },
    [orders]
  );

  /**
   * Search orders by order ID (supports both display format and numeric)
   */
  const searchOrders = useCallback(
    (query: string): Order[] => {
      if (!query.trim()) return orders;

      const lowerQuery = query.toLowerCase();
      // Try to parse as display ID (e.g., "ORD123") or numeric ID
      const parsedId = parseInt(
        lowerQuery.replace(/^(pat|ord|sam|tst|alq|inv|pay|clm|rpt|usr|aud|apt)/i, ''),
        10
      );

      return orders.filter(order => {
        const orderIdStr = order.orderId.toString();
        return (
          orderIdStr.includes(parsedId.toString()) || orderIdStr.toLowerCase().includes(lowerQuery)
        );
      });
    },
    [orders]
  );

  /**
   * Collect sample for multiple tests at once
   * Note: Collection data is now stored in Sample entity, not OrderTest
   */
  const collectSampleForTests = useCallback(
    (
      orderId: number | string,
      testCodes: string[],
      sampleId: number | string,

      _collectionData: CollectionData
    ) => {
      // This is handled by the samples mutation now
      // For backward compatibility, we invalidate to refresh
      const numericOrderId = typeof orderId === 'string' ? parseInt(orderId, 10) : orderId;
      const order = orders.find(o => o.orderId === numericOrderId);
      if (order) {
        const numericSampleId = typeof sampleId === 'string' ? parseInt(sampleId, 10) : sampleId;
        const updatedTests = order.tests.map(test => {
          if (testCodes.includes(test.testCode)) {
            return {
              ...test,
              status: 'sample-collected' as TestStatus,
              sampleId: numericSampleId,
            };
          }
          return test;
        });

        updateOrder(numericOrderId, {
          tests: updatedTests,
          overallStatus: 'in-progress',
          updatedAt: new Date().toISOString(),
        });
      }
    },
    [orders, updateOrder]
  );

  /**
   * Add reflex test to an order
   */
  const addReflexTest = useCallback(
    (
      orderId: number | string,
      reflexTest: OrderTest,
      triggeredByTestCode: string,
      reflexRule: string
    ) => {
      const numericId = typeof orderId === 'string' ? parseInt(orderId, 10) : orderId;
      const order = orders.find(o => o.orderId === numericId);
      if (!order) return;

      const newTest = createReflexTest(reflexTest, triggeredByTestCode, reflexRule);
      updateOrder(numericId, {
        tests: [...order.tests, newTest],
        totalPrice: order.totalPrice + reflexTest.priceAtOrder,
        updatedAt: new Date().toISOString(),
      });
    },
    [orders, updateOrder]
  );

  /**
   * Add repeat test
   */
  const addRepeatTest = useCallback(
    (
      orderId: number | string,
      originalTestCode: string,
      repeatReason: string,
      sampleId?: number | string
    ) => {
      const numericOrderId = typeof orderId === 'string' ? parseInt(orderId, 10) : orderId;
      const order = orders.find(o => o.orderId === numericOrderId);
      if (!order) return;

      const originalTest = order.tests.find(t => t.testCode === originalTestCode);
      if (!originalTest) return;

      const originalTestId = originalTest.id;
      const existingRepeats = order.tests.filter(
        t =>
          (t.originalTestId === originalTestId && t.isRepeatTest) ||
          (t.testCode === originalTestCode && t.isRepeatTest && !t.originalTestId)
      ).length;

      const numericSampleId = sampleId
        ? typeof sampleId === 'string'
          ? parseInt(sampleId, 10)
          : sampleId
        : undefined;
      const repeatTest = createRepeatTest(
        originalTest,
        repeatReason,
        existingRepeats,
        numericSampleId
      );

      updateOrder(numericOrderId, {
        tests: [...order.tests, repeatTest],
        updatedAt: new Date().toISOString(),
      });
    },
    [orders, updateOrder]
  );

  /**
   * Mark test as having critical values
   */
  const markTestCritical = useCallback(
    async (orderId: number | string, testCode: string, notifiedTo: string) => {
      try {
        const numericId = typeof orderId === 'string' ? parseInt(orderId, 10) : orderId;
        await markTestCriticalMutation.mutateAsync({ orderId: numericId, testCode, notifiedTo });
      } catch (err) {
        logger.error('Failed to mark test as critical', err instanceof Error ? err : undefined);
        throw err;
      }
    },
    [markTestCriticalMutation]
  );

  /**
   * Acknowledge critical result
   */
  const acknowledgeCriticalResult = useCallback(
    (orderId: number | string, testCode: string) => {
      const numericId = typeof orderId === 'string' ? parseInt(orderId, 10) : orderId;
      const order = orders.find(o => o.orderId === numericId);
      if (!order) return;

      const now = new Date().toISOString();
      const updatedTests = order.tests.map(test => {
        if (test.testCode === testCode) {
          return {
            ...test,
            criticalAcknowledgedAt: now,
          };
        }
        return test;
      });

      updateOrder(numericId, {
        tests: updatedTests,
        updatedAt: now,
      });
    },
    [orders, updateOrder]
  );

  /**
   * Get orders that need collection for a specific sample type
   */
  const getOrdersForBatchCollection = useCallback(
    (_sampleType: string): Order[] => getOrdersNeedingCollection(orders),
    [orders]
  );

  /**
   * Get all tests that need collection
   */
  const getTestsNeedingCollection = useCallback(
    (): { order: Order; test: OrderTest }[] => getAllTestsNeedingCollection(orders),
    [orders]
  );

  const value: OrdersContextType = {
    orders,
    loading,
    error,
    addOrder,
    updateOrder,
    deleteOrder,
    getOrder,
    updateTestStatus,
    updateOrderStatus,
    updatePaymentStatus,
    getOrdersByStatus,
    getOrdersByPatient,
    searchOrders,
    collectSampleForTests,
    addReflexTest,
    addRepeatTest,
    markTestCritical,
    acknowledgeCriticalResult,
    getOrdersForBatchCollection,
    getTestsNeedingCollection,
    refreshOrders,
    clearError,
  };

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
};
