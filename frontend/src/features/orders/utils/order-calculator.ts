/**
 * Order Business Logic Utilities
 * Pure calculation functions for order and test status.
 */

import type { Order, OrderStatus, TestStatus, OrderTest } from '@/types';

export const calculateOrderStatus = (testStatuses: TestStatus[]): OrderStatus => {
  if (testStatuses.every(s => s === 'rejected' || s === 'superseded' || s === 'removed')) {
    return 'cancelled';
  }
  if (testStatuses.some(s => s === 'validated')) return 'completed';
  if (testStatuses.some(s => s === 'in-progress' || s === 'sample-collected' || s === 'resulted')) {
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
