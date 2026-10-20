/**
 * Order business logic utilities (active tests, billing totals).
 * Order rollup status is computed only on the backend (`apply_order_status_rollup`).
 */

import type { OrderTest } from '@/types';

/** Billing / queue: cancelled lines are inactive. */
export const INACTIVE_BILLABLE_TEST_STATUSES = new Set(['removed', 'superseded', 'cancelled']);

/** Reports: cancelled lines can still appear. Matches backend eligibility. */
export const INACTIVE_REPORTABLE_TEST_STATUSES = new Set(['removed', 'superseded']);

export const isActiveTest = (test: OrderTest): boolean =>
  !INACTIVE_BILLABLE_TEST_STATUSES.has(test.status);

export const isReportableTest = (test: Pick<OrderTest, 'status'>): boolean =>
  !INACTIVE_REPORTABLE_TEST_STATUSES.has(test.status);

export const getActiveTests = (tests: OrderTest[]): OrderTest[] => tests.filter(isActiveTest);

export const getActiveTotal = (tests: OrderTest[]): number =>
  getActiveTests(tests).reduce(
    (sum, t) => sum + (typeof t.priceAtOrder === 'number' ? t.priceAtOrder : 0),
    0
  );
