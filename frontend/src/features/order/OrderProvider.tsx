/**
 * Orders Provider Component
 * 
 * MIGRATION NOTE: This provider now delegates to TanStack Query hooks.
 * It maintains backward compatibility for components still using useOrders() context.
 * 
 * New components should use the query hooks directly:
 * - useOrdersList() for fetching orders
 * - useOrder(id) for single order
 * - useCreateOrder() for creating orders
 * - useUpdateOrder() for updating orders
 * - useUpdateTestStatus() for updating test status
 * 
 * This provider will be deprecated once all consumers are migrated.
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
  const addOrder = useCallback(async (order: Order) => {
    try {
      await createOrderMutation.mutateAsync(order);
    } catch (err) {
      logger.error('Failed to create order', err instanceof Error ? err : undefined);
      throw err;
    }
  }, [createOrderMutation]);

  /**
   * Update an existing order
   */
  const updateOrder = useCallback(async (orderId: string, updates: Partial<Order>) => {
    try {
      await updateOrderMutation.mutateAsync({ orderId, updates });
    } catch (err) {
      logger.error('Failed to update order', err instanceof Error ? err : undefined);
      throw err;
    }
  }, [updateOrderMutation]);

  /**
   * Delete an order
   */
  const deleteOrder = useCallback(async (orderId: string) => {
    try {
      await deleteOrderMutation.mutateAsync(orderId);
    } catch (err) {
      logger.error('Failed to delete order', err instanceof Error ? err : undefined);
      throw err;
    }
  }, [deleteOrderMutation]);

  /**
   * Get an order by ID
   */
  const getOrder = useCallback((orderId: string): Order | undefined => {
    return orders.find(order => order.orderId === orderId);
  }, [orders]);

  /**
   * Update status of a specific test within an order
   */
  const updateTestStatus = useCallback(async (
    orderId: string,
    testCode: string,
    status: TestStatus,
    additionalData?: Partial<TestStatusUpdateData>
  ) => {
    try {
      await updateTestStatusMutation.mutateAsync({
        orderId,
        testCode,
        status,
        additionalData: additionalData as Record<string, unknown>,
      });
    } catch (err) {
      logger.error('Failed to update test status', err instanceof Error ? err : undefined);
      throw err;
    }
  }, [updateTestStatusMutation]);

  /**
   * Update overall order status
   */
  const updateOrderStatus = useCallback((orderId: string, status: OrderStatus) => {
    updateOrder(orderId, { overallStatus: status });
  }, [updateOrder]);

  /**
   * Update payment status
   */
  const updatePaymentStatus = useCallback(async (orderId: string, paymentStatus: string, amountPaid?: number) => {
    try {
      await updatePaymentStatusMutation.mutateAsync({ orderId, paymentStatus, amountPaid });
    } catch (err) {
      logger.error('Failed to update payment status', err instanceof Error ? err : undefined);
      throw err;
    }
  }, [updatePaymentStatusMutation]);

  /**
   * Get orders by status
   */
  const getOrdersByStatus = useCallback((status: OrderStatus): Order[] => {
    return orders.filter(order => order.overallStatus === status);
  }, [orders]);

  /**
   * Get orders by patient ID
   */
  const getOrdersByPatient = useCallback((patientId: string): Order[] => {
    return orders.filter(order => order.patientId === patientId);
  }, [orders]);

  /**
   * Search orders by order ID
   */
  const searchOrders = useCallback((query: string): Order[] => {
    if (!query.trim()) return orders;

    const lowerQuery = query.toLowerCase();
    return orders.filter(order =>
      order.orderId.toLowerCase().includes(lowerQuery)
    );
  }, [orders]);

  /**
   * Collect sample for multiple tests at once
   * Note: Collection data is now stored in Sample entity, not OrderTest
   */
  const collectSampleForTests = useCallback((
    orderId: string,
    testCodes: string[],
    sampleId: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _collectionData: CollectionData
  ) => {
    // This is handled by the samples mutation now
    // For backward compatibility, we invalidate to refresh
    const order = orders.find(o => o.orderId === orderId);
    if (order) {
      const updatedTests = order.tests.map(test => {
        if (testCodes.includes(test.testCode)) {
          return {
            ...test,
            status: 'sample-collected' as TestStatus,
            sampleId,
          };
        }
        return test;
      });

      updateOrder(orderId, {
        tests: updatedTests,
        overallStatus: 'in-progress',
        updatedAt: new Date().toISOString(),
      });
    }
  }, [orders, updateOrder]);

  /**
   * Add reflex test to an order
   */
  const addReflexTest = useCallback((
    orderId: string,
    reflexTest: OrderTest,
    triggeredByTestCode: string,
    reflexRule: string
  ) => {
    const order = orders.find(o => o.orderId === orderId);
    if (!order) return;

    const newTest = createReflexTest(reflexTest, triggeredByTestCode, reflexRule);
    updateOrder(orderId, {
      tests: [...order.tests, newTest],
      totalPrice: order.totalPrice + reflexTest.priceAtOrder,
      updatedAt: new Date().toISOString(),
    });
  }, [orders, updateOrder]);

  /**
   * Add repeat test
   */
  const addRepeatTest = useCallback((
    orderId: string,
    originalTestCode: string,
    repeatReason: string,
    sampleId?: string
  ) => {
    const order = orders.find(o => o.orderId === orderId);
    if (!order) return;

    const originalTest = order.tests.find(t => t.testCode === originalTestCode);
    if (!originalTest) return;

    const existingRepeats = order.tests.filter(
      t => t.originalTestId === originalTestCode ||
           (t.testCode === originalTestCode && t.isRepeatTest)
    ).length;

    const repeatTest = createRepeatTest(originalTest, repeatReason, existingRepeats, sampleId);

    updateOrder(orderId, {
      tests: [...order.tests, repeatTest],
      updatedAt: new Date().toISOString(),
    });
  }, [orders, updateOrder]);

  /**
   * Mark test as having critical values
   */
  const markTestCritical = useCallback(async (
    orderId: string,
    testCode: string,
    notifiedTo: string
  ) => {
    try {
      await markTestCriticalMutation.mutateAsync({ orderId, testCode, notifiedTo });
    } catch (err) {
      logger.error('Failed to mark test as critical', err instanceof Error ? err : undefined);
      throw err;
    }
  }, [markTestCriticalMutation]);

  /**
   * Acknowledge critical result
   */
  const acknowledgeCriticalResult = useCallback((orderId: string, testCode: string) => {
    const order = orders.find(o => o.orderId === orderId);
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

    updateOrder(orderId, {
      tests: updatedTests,
      updatedAt: now,
    });
  }, [orders, updateOrder]);

  /**
   * Get orders that need collection for a specific sample type
   */
  const getOrdersForBatchCollection = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
