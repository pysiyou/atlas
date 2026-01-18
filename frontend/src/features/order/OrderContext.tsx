/**
 * Orders Context, Provider, and Hook
 * Consolidates order state management into a single module:
 * - OrdersContext: React Context for order data
 * - OrdersProvider: Provider component managing order operations
 * - useOrders: Hook to consume order context
 */

import React, { type ReactNode, useCallback, useState, useEffect } from 'react';
import type { Order, OrderStatus, TestStatus, OrderTest, TestResult } from '@/types';
import { createFeatureContext } from '@/shared/context/createFeatureContext';
import { orderAPI } from '@/services/api';
import {
  updateOrderTestStatus,
  createReflexTest,
  createRepeatTest,
  markTestAsCritical,
  getOrdersNeedingCollection,
  getAllTestsNeedingCollection,
} from '@/utils/orderUtils';

// ============================================================================
// Context Type Definition
// ============================================================================

/**
 * OrdersContext type definition
 */
export interface OrdersContextType {
  orders: Order[];
  addOrder: (order: Order) => void;
  updateOrder: (orderId: string, updates: Partial<Order>) => void;
  deleteOrder: (orderId: string) => void;
  getOrder: (orderId: string) => Order | undefined;
  updateTestStatus: (orderId: string, testCode: string, status: TestStatus, additionalData?: Partial<{ resultEnteredAt?: string; resultValidatedAt?: string; results?: Record<string, TestResult> | null; sampleId?: string; enteredBy?: string; validatedBy?: string; technicianNotes?: string; validationNotes?: string; flags?: string[]; }>) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  getOrdersByStatus: (status: OrderStatus) => Order[];
  getOrdersByPatient: (patientId: string) => Order[];
  searchOrders: (query: string) => Order[];
  refreshOrders: () => Promise<void>;
  loading: boolean;

  // Sample-based collection
  collectSampleForTests: (
    orderId: string,
    testCodes: string[],
    sampleId: string,
    collectionData: {
      collectionDate: string;
      collectedBy: string;
      collectionNotes?: string;
    }
  ) => void;

  // Reflex testing
  addReflexTest: (
    orderId: string,
    reflexTest: OrderTest,
    triggeredByTestCode: string,
    reflexRule: string
  ) => void;

  // Repeat testing
  addRepeatTest: (
    orderId: string,
    originalTestCode: string,
    repeatReason: string,
    sampleId?: string
  ) => void;

  // Critical results
  markTestCritical: (
    orderId: string,
    testCode: string,
    notifiedTo: string
  ) => void;

  acknowledgeCriticalResult: (orderId: string, testCode: string) => void;

  // Batch operations
  getOrdersForBatchCollection: (sampleType: string) => Order[];

  // Utility
  getTestsNeedingCollection: () => { order: Order; test: OrderTest }[];
}

// ============================================================================
// Context Creation
// ============================================================================

/**
 * React Context for Orders using generic factory
 */
export const { Context: OrdersContext, useFeature: useOrders} = 
  createFeatureContext<OrdersContextType>('Orders');

// ============================================================================
// Provider Component
// ============================================================================

interface OrdersProviderProps {
  children: ReactNode;
}

/**
 * Orders Provider Component
 * Manages test orders and operations
 */
export const OrdersProvider: React.FC<OrdersProviderProps> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  /**
   * Refresh orders from backend
   */
  const refreshOrders = useCallback(async () => {
    try {
      setLoading(true);
      const data = await orderAPI.getAll();
      setOrders(data);
    } catch (error) {
      console.error('Failed to load orders:', error);
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
      const created = await orderAPI.create(order);
      setOrders(prev => [...prev, created]);
      await refreshOrders();
    } catch (error) {
      console.error('Failed to create order:', error);
      throw error;
    }
  }, [refreshOrders]);

  /**
   * Update an existing order
   */
  const updateOrder = useCallback(async (orderId: string, updates: Partial<Order>) => {
    try {
      const updated = await orderAPI.update(orderId, updates);
      setOrders(prev =>
        prev.map(order =>
          order.orderId === orderId ? updated : order
        )
      );
      await refreshOrders();
    } catch (error) {
      console.error('Failed to update order:', error);
      throw error;
    }
  }, [refreshOrders]);

  /**
   * Delete an order
   */
  const deleteOrder = useCallback((orderId: string) => {
    setOrders(prev => prev.filter(order => order.orderId !== orderId));
  }, [setOrders]);

  /**
   * Get an order by ID
   */
  const getOrder = useCallback((orderId: string): Order | undefined => {
    return orders.find(order => order.orderId === orderId);
  }, [orders]);

  /**
   * Update status of a specific test within an order
   */
  const updateTestStatus = useCallback((
    orderId: string,
    testCode: string,
    status: TestStatus,
    additionalData?: Partial<{ collectedAt?: string; resultEnteredAt?: string; resultValidatedAt?: string; results?: Record<string, TestResult> | null; sampleId?: string; enteredBy?: string; validatedBy?: string; technicianNotes?: string; validationNotes?: string; flags?: string[]; }>
  ) => {
    setOrders(prev =>
      prev.map(order =>
        order.orderId === orderId
          ? updateOrderTestStatus(order, testCode, status, additionalData)
          : order
      )
    );
  }, [setOrders]);

  /**
   * Update overall order status
   */
  const updateOrderStatus = useCallback((orderId: string, status: OrderStatus) => {
    updateOrder(orderId, { overallStatus: status });
  }, [updateOrder]);

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
    _collectionData: {
      collectionDate: string;
      collectedBy: string;
      collectionNotes?: string;
    }
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
  }, [setOrders]);

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
  }, [setOrders]);

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
  }, [setOrders]);

  /**
   * Mark test as having critical values
   */
  const markTestCritical = useCallback((
    orderId: string,
    testCode: string,
    notifiedTo: string
  ) => {
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
  }, [setOrders]);

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
  }, [setOrders]);

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
    addOrder,
    updateOrder,
    deleteOrder,
    getOrder,
    updateTestStatus,
    updateOrderStatus,
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
    loading,
  };

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
};
