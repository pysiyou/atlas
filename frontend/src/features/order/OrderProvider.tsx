/**
 * Orders Provider Component
 * Manages test orders and operations with proper error handling
 */

import React, { type ReactNode, useCallback, useState, useEffect } from 'react';
import type { Order, OrderStatus, TestStatus, OrderTest } from '@/types';
import {
  OrdersContext,
  type OrdersContextType,
  type OrderError,
  type TestStatusUpdateData,
  type CollectionData,
} from './OrderContext';
import { orderAPI } from '@/services/api';
import {
  updateOrderTestStatus,
  createReflexTest,
  createRepeatTest,
  markTestAsCritical,
  getOrdersNeedingCollection,
  getAllTestsNeedingCollection,
} from '@/utils/orderUtils';

interface OrdersProviderProps {
  children: ReactNode;
}

/**
 * Orders Provider Component
 * Manages test orders and operations with comprehensive error handling
 */
export const OrdersProvider: React.FC<OrdersProviderProps> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<OrderError | null>(null);

  /**
   * Clear any error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Refresh orders from backend
   */
  const refreshOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await orderAPI.getAll();
      setOrders(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load orders';
      console.error('Failed to load orders:', err);
      setError({
        message: errorMessage,
        operation: 'load',
      });
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load orders on mount
  useEffect(() => {
    refreshOrders();
  }, [refreshOrders]);

  /**
   * Add a new order
   */
  const addOrder = useCallback(async (order: Order) => {
    try {
      setError(null);
      const created = await orderAPI.create(order);
      setOrders(prev => [...prev, created]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create order';
      console.error('Failed to create order:', err);
      setError({
        message: errorMessage,
        operation: 'create',
      });
      throw err;
    }
  }, [refreshOrders]);

  /**
   * Update an existing order
   */
  const updateOrder = useCallback(async (orderId: string, updates: Partial<Order>) => {
    try {
      setError(null);
      const updated = await orderAPI.update(orderId, updates);
      setOrders(prev =>
        prev.map(order =>
          order.orderId === orderId ? updated : order
        )
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update order';
      console.error('Failed to update order:', err);
      setError({
        message: errorMessage,
        operation: 'update',
      });
      throw err;
    }
  }, [refreshOrders]);

  /**
   * Delete an order
   */
  const deleteOrder = useCallback(async (orderId: string) => {
    try {
      setError(null);
      await orderAPI.delete(orderId);
      setOrders(prev => prev.filter(order => order.orderId !== orderId));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete order';
      console.error('Failed to delete order:', err);
      setError({
        message: errorMessage,
        operation: 'delete',
      });
      throw err;
    }
  }, []);

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
      setError(null);
      await orderAPI.updateTestStatus(orderId, testCode, status, additionalData as Record<string, unknown>);
      setOrders(prev =>
        prev.map(order =>
          order.orderId === orderId
            ? updateOrderTestStatus(order, testCode, status, additionalData)
            : order
        )
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update test status';
      console.error('Failed to update test status:', err);
      setError({
        message: errorMessage,
        operation: 'update',
      });
      throw err;
    }
  }, []);

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
      setError(null);
      const updated = await orderAPI.updatePaymentStatus(orderId, paymentStatus, amountPaid);
      setOrders(prev =>
        prev.map(order =>
          order.orderId === orderId ? updated : order
        )
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update payment status';
      console.error('Failed to update payment status:', err);
      setError({
        message: errorMessage,
        operation: 'update',
      });
      throw err;
    }
  }, []);

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
   * Note: Patient name search removed - use getOrdersByPatient with patient lookup instead
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
    setOrders(prev =>
      prev.map(order => {
        if (order.orderId === orderId) {
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

          // Update overall status
          const updates: Partial<Order> = {
            tests: updatedTests,
            updatedAt: new Date().toISOString(),
          };

          if (updatedTests.some(t => t.status === 'sample-collected' || t.status === 'in-progress')) {
            updates.overallStatus = 'in-progress';
          }

          return { ...order, ...updates };
        }
        return order;
      })
    );
  }, []);

  /**
   * Add reflex test to an order
   */
  const addReflexTest = useCallback((
    orderId: string,
    reflexTest: OrderTest,
    triggeredByTestCode: string,
    reflexRule: string
  ) => {
    setOrders(prev =>
      prev.map(order => {
        if (order.orderId !== orderId) return order;

        const newTest = createReflexTest(reflexTest, triggeredByTestCode, reflexRule);
        return {
          ...order,
          tests: [...order.tests, newTest],
          totalPrice: order.totalPrice + reflexTest.priceAtOrder,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  }, []);

  /**
   * Add repeat test
   */
  const addRepeatTest = useCallback((
    orderId: string,
    originalTestCode: string,
    repeatReason: string,
    sampleId?: string
  ) => {
    setOrders(prev =>
      prev.map(order => {
        if (order.orderId !== orderId) return order;

        const originalTest = order.tests.find(t => t.testCode === originalTestCode);
        if (!originalTest) return order;

        const existingRepeats = order.tests.filter(
          t => t.originalTestId === originalTestCode ||
               (t.testCode === originalTestCode && t.isRepeatTest)
        ).length;

        const repeatTest = createRepeatTest(originalTest, repeatReason, existingRepeats, sampleId);

        return {
          ...order,
          tests: [...order.tests, repeatTest],
          updatedAt: new Date().toISOString(),
        };
      })
    );
  }, []);

  /**
   * Mark test as having critical values
   */
  const markTestCritical = useCallback(async (
    orderId: string,
    testCode: string,
    notifiedTo: string
  ) => {
    try {
      setError(null);
      await orderAPI.markTestCritical(orderId, testCode, notifiedTo);
      const now = new Date().toISOString();

      setOrders(prev =>
        prev.map(order => {
          if (order.orderId !== orderId) return order;

          const updatedTests = order.tests.map(test =>
            test.testCode === testCode ? markTestAsCritical(test, notifiedTo, now) : test
          );

          return { ...order, tests: updatedTests, updatedAt: now };
        })
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark test as critical';
      console.error('Failed to mark test as critical:', err);
      setError({
        message: errorMessage,
        operation: 'update',
      });
      throw err;
    }
  }, []);

  /**
   * Acknowledge critical result
   */
  const acknowledgeCriticalResult = useCallback((orderId: string, testCode: string) => {
    const now = new Date().toISOString();

    setOrders(prev =>
      prev.map(order => {
        if (order.orderId === orderId) {
          const updatedTests = order.tests.map(test => {
            if (test.testCode === testCode) {
              return {
                ...test,
                criticalAcknowledgedAt: now,
              };
            }
            return test;
          });

          return {
            ...order,
            tests: updatedTests,
            updatedAt: now,
          };
        }
        return order;
      })
    );
  }, []);

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
