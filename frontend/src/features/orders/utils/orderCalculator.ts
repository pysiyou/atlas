/**
 * Order Business Logic Utilities
 * Pure calculation functions for order and test status.
 */

import type { Order, OrderStatus, TestStatus, OrderTest } from '@/types';

/**
 * Calculate order status based on test statuses and optional sample context.
 *
 * Logic matches backend order_status_updater.py:
 * 1. All active tests are validated or cancelled -> completed
 * 2. Any active test started (including pending on rejected/recollection tubes) -> in-progress
 * 3. All pending -> ordered
 *
 * Note: cancelled is set manually on the order and is not derived here.
 */
export const calculateOrderStatus = (
  testStatuses: TestStatus[],
  options?: {
    tests?: Array<Pick<OrderTest, 'status' | 'sampleId'>>;
    samplesById?: Record<number, { status?: string; isRecollection?: boolean }>;
  }
): OrderStatus => {
  const activeStatuses = testStatuses.filter(
    s => s !== 'superseded' && s !== 'removed'
  );

  if (activeStatuses.length === 0) {
    return 'ordered';
  }

  // Order is completed when all active tests are in terminal states (validated or cancelled)
  // This includes scenarios like:
  // - All tests validated (normal completion)
  // - Some tests validated, others cancelled (specimen rejection + cancellation)
  // - All tests cancelled (complete cancellation of work)
  const allTerminal = activeStatuses.every(s => s === 'validated' || s === 'cancelled');
  if (allTerminal) {
    return 'completed';
  }

  // Tests in these statuses count as "started" work
  // Note: cancelled is NOT included here - it's a terminal state
  const startedStatuses: TestStatus[] = [
    'sample-collected',
    'resulted',
    'validated',
    'escalated',
  ];
  if (activeStatuses.some(s => startedStatuses.includes(s))) {
    return 'in-progress';
  }

  // Mirror backend: pending on rejected or recollection samples counts as started.
  const { tests, samplesById } = options ?? {};
  if (tests && samplesById) {
    const pendingRework = tests.some(test => {
      if (test.status !== 'pending' || !test.sampleId) return false;
      const sample = samplesById[test.sampleId];
      if (!sample) return false;
      return sample.status === 'rejected' || sample.isRecollection === true;
    });
    if (pendingRework) return 'in-progress';
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
  
  // Build samples map for accurate order status calculation
  const samplesById: Record<number, { status?: string; isRecollection?: boolean }> = {};
  if (order.samples) {
    order.samples.forEach(sample => {
      samplesById[sample.sampleId] = {
        status: sample.status,
        isRecollection: sample.isRecollection
      };
    });
  }
  
  const overallStatus = calculateOrderStatus(
    updatedTests.map(t => t.status),
    { tests: updatedTests, samplesById }
  );
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
