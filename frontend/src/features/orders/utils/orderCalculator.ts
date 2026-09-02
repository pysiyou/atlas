/**
 * Order Business Logic Utilities
 * Pure calculation functions for order and test status.
 */

import type { Order, OrderStatus, TestStatus, OrderTest } from '@/types';

/**
 * Calculate order status based on test statuses.
 * 
 * Logic matches backend order_status_updater.py:
 * 1. All tests rejected/superseded/removed -> cancelled
 * 2. All ACTIVE tests validated -> completed
 * 3. Any active test started (not pending) -> in-progress
 * 4. All pending -> ordered
 */
export const calculateOrderStatus = (testStatuses: TestStatus[]): OrderStatus => {
  // Filter out superseded and removed tests - only consider active tests
  const activeStatuses = testStatuses.filter(
    s => s !== 'superseded' && s !== 'removed'
  );

  if (activeStatuses.length === 0) {
    return 'cancelled';
  }

  // Check if ALL active tests are validated -> COMPLETED (not just some)
  if (activeStatuses.every(s => s === 'validated')) {
    return 'completed';
  }

  // Check if any active test has started (not pending) -> IN_PROGRESS
  const startedStatuses: TestStatus[] = [
    'sample-collected',
    'resulted',
    'validated',
    'suspended',
    'cancelled',
    'escalated',
  ];
  if (activeStatuses.some(s => startedStatuses.includes(s))) {
    return 'in-progress';
  }

  // All tests are pending -> ORDERED
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

export const createRepeatTest = (
  originalTest: OrderTest,
  repeatReason: string,
  existingRepeats: number,
  sampleId?: number | string
): OrderTest => ({
  ...originalTest,
  status: sampleId ? 'sample-collected' : 'pending',
  isRepeatTest: true,
  repeatReason,
  originalTestId: originalTest.id,
  repeatNumber: existingRepeats + 1,
  sampleId: typeof sampleId === 'string' ? parseInt(sampleId, 10) : sampleId,
  results: null,
});

export const isActiveTest = (test: OrderTest): boolean =>
  test.status !== 'superseded' && test.status !== 'removed';

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
