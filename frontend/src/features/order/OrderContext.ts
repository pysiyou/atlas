/**
 * Orders Context Definition
 * Separate file for context to support Fast Refresh
 */

import { createContext, useContext } from 'react';
import type { Order, OrderStatus, TestStatus, OrderTest, TestResult } from '@/types';

/**
 * Error state for order operations
 */
export interface OrderError {
  message: string;
  code?: string;
  operation?: 'load' | 'create' | 'update' | 'delete' | 'search';
}

/**
 * Additional data for test status updates
 */
export interface TestStatusUpdateData {
  resultEnteredAt?: string;
  resultValidatedAt?: string;
  results?: Record<string, TestResult> | null;
  sampleId?: string;
  enteredBy?: string;
  validatedBy?: string;
  technicianNotes?: string;
  validationNotes?: string;
  flags?: string[];
}

/**
 * Collection data for sample collection
 */
export interface CollectionData {
  collectionDate: string;
  collectedBy: string;
  collectionNotes?: string;
}

/**
 * OrdersContext type definition
 */
export interface OrdersContextType {
  /** List of all orders */
  orders: Order[];
  /** Loading state for async operations */
  loading: boolean;
  /** Error state for failed operations */
  error: OrderError | null;
  /** Add a new order */
  addOrder: (order: Order) => void;
  /** Update an existing order */
  updateOrder: (orderId: string, updates: Partial<Order>) => void;
  /** Delete an order */
  deleteOrder: (orderId: string) => void;
  /** Get an order by ID */
  getOrder: (orderId: string) => Order | undefined;
  /** Update status of a specific test within an order */
  updateTestStatus: (
    orderId: string,
    testCode: string,
    status: TestStatus,
    additionalData?: Partial<TestStatusUpdateData>
  ) => void;
  /** Update overall order status */
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  /** Update payment status */
  updatePaymentStatus: (orderId: string, paymentStatus: string, amountPaid?: number) => Promise<void>;
  /** Get orders by status */
  getOrdersByStatus: (status: OrderStatus) => Order[];
  /** Get orders by patient ID */
  getOrdersByPatient: (patientId: string) => Order[];
  /** Search orders by order ID */
  searchOrders: (query: string) => Order[];
  /** Refresh orders from backend */
  refreshOrders: () => Promise<void>;
  /** Clear any error state */
  clearError: () => void;

  // Sample-based collection
  collectSampleForTests: (
    orderId: string,
    testCodes: string[],
    sampleId: string,
    collectionData: CollectionData
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

/**
 * React Context for Orders
 */
export const OrdersContext = createContext<OrdersContextType | undefined>(undefined);

/**
 * Hook to access the Orders context
 * @throws Error if used outside of OrdersProvider
 */
export function useOrders(): OrdersContextType {
  const context = useContext(OrdersContext);
  if (!context) {
    throw new Error('useOrders must be used within an OrdersProvider');
  }
  return context;
}
