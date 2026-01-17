/**
 * Order Business Logic Utilities
 * Extracted from OrdersProvider for better testability and reuse
 */

import type { Order, OrderStatus, TestStatus, OrderTest } from '@/types';

/**
 * Determines the overall order status based on the status of all contained tests
 * Uses a precedence model: delivered > completed > in-progress > ordered
 */
export const calculateOrderStatus = (testStatuses: TestStatus[]): OrderStatus => {
  if (testStatuses.every(s => s === 'reported')) {
    return 'delivered';
  }
  if (testStatuses.some(s => s === 'validated' || s === 'completed')) {
    return 'completed';
  }
  if (testStatuses.some(s => s === 'in-progress' || s === 'collected')) {
    return 'in-progress';
  }
  return 'ordered';
};

/**
 * Updates a test within an order and recalculates the order status
 */
export const updateOrderTestStatus = (
  order: Order,
  testCode: string,
  status: TestStatus,
  additionalData?: Partial<OrderTest>
): Order => {
  const updatedTests = order.tests.map(test =>
    test.testCode === testCode
      ? { ...test, status, ...additionalData }
      : test
  );

  const testStatuses = updatedTests.map(t => t.status);
  const overallStatus = calculateOrderStatus(testStatuses);

  return {
    ...order,
    tests: updatedTests,
    overallStatus,
    updatedAt: new Date().toISOString(),
  };
};

/**
 * Creates a reflex test from a triggering test
 */
export const createReflexTest = (
  reflexTest: OrderTest,
  triggeredByTestCode: string,
  reflexRule: string
): OrderTest => ({
  ...reflexTest,
  isReflexTest: true,
  triggeredBy: triggeredByTestCode,
  reflexRule,
});

/**
 * Creates a repeat test from an original test
 */
export const createRepeatTest = (
  originalTest: OrderTest,
  repeatReason: string,
  existingRepeats: number,
  sampleId?: string
): OrderTest => ({
  ...originalTest,
  status: sampleId ? 'collected' : 'ordered',
  isRepeatTest: true,
  repeatReason,
  originalTestId: originalTest.testCode,
  repeatNumber: existingRepeats + 1,
  sampleId,
  results: null,
});

/**
 * Adds critical value metadata to a test
 */
export const markTestAsCritical = (
  test: OrderTest,
  notifiedTo: string,
  now: string
): OrderTest => ({
  ...test,
  hasCriticalValues: true,
  criticalNotificationSent: true,
  criticalNotifiedAt: now,
  criticalNotifiedTo: notifiedTo,
});

/**
 * Filters orders that have tests needing collection
 */
export const getOrdersNeedingCollection = (orders: Order[]): Order[] =>
  orders.filter(order => order.tests.some(test => test.status === 'ordered'));

/**
 * Gets all test-order pairs that need collection
 */
export const getAllTestsNeedingCollection = (
  orders: Order[]
): { order: Order; test: OrderTest }[] => {
  const result: { order: Order; test: OrderTest }[] = [];

  orders.forEach(order => {
    order.tests.forEach(test => {
      if (test.status === 'ordered') {
        result.push({ order, test });
      }
    });
  });

  return result;
};
