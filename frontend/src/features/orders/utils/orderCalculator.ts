/**
 * Order Business Logic Utilities
 * Pure calculation functions for order and test status.
 */

import type { Order, OrderStatus, TestStatus, OrderTest } from '@/types';

/**
 * Calculate order status based on test statuses.
 *
 * Logic matches backend order_status_updater.py:
 * 1. All active tests validated -> completed
 * 2. Any active test started (not pending) -> in-progress
 * 3. All pending -> ordered
 *
 * Note: cancelled is set manually on the order and is not derived here.
 */
export const calculateOrderStatus = (testStatuses: TestStatus[]): OrderStatus => {
  const activeStatuses = testStatuses.filter(
    s => s !== 'superseded' && s !== 'removed'
  );

  if (activeStatuses.length === 0) {
    return 'ordered';
  }

  if (activeStatuses.every(s => s === 'validated')) {
    return 'completed';
  }

  const startedStatuses: TestStatus[] = [
    'sample-collected',
    'resulted',
    'validated',
    'cancelled',
    'escalated',
  ];
  if (activeStatuses.some(s => startedStatuses.includes(s))) {
    return 'in-progress';
  }

  return 'ordered';
};

export const updateOrderTestStatus = (
  order: Order,
  testCode: string,
  status: TestStatus,
  additionalData?: Partial<OrderTest>
): Order => {
  const updatedTests = (order.tests ?? []).map(test =>
    test.testCode === testCode ? { ...test, status, ...additionalData } : test
  );
  const overallStatus = calculateOrderStatus(updatedTests.map(t => t.status));
  return { ...order, tests: updatedTests, overallStatus, updatedAt: new Date().toISOString() };
};

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

export const isActiveTest = (test: OrderTest): boolean =>
  test.status !== 'superseded' &&
  test.status !== 'removed' &&
  test.status !== 'cancelled';

export const getActiveTests = (tests: OrderTest[]): OrderTest[] => tests.filter(isActiveTest);

export const getActiveTotal = (tests: OrderTest[]): number =>
  getActiveTests(tests).reduce(
    (sum, t) => sum + (typeof t.priceAtOrder === 'number' ? t.priceAtOrder : 0),
    0
  );

export const getOrdersNeedingCollection = (orders: Order[]): Order[] =>
  orders.filter(order => (order.tests ?? []).some(test => test.status === 'pending'));

export const getAllTestsNeedingCollection = (
  orders: Order[]
): { order: Order; test: OrderTest }[] => {
  const result: { order: Order; test: OrderTest }[] = [];
  orders.forEach(order => {
    (order.tests ?? []).forEach(test => {
      if (test.status === 'pending') result.push({ order, test });
    });
  });
  return result;
};
