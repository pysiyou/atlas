/**
 * Order business logic utilities (active tests, billing totals).
 * Order rollup status is computed only on the backend (`apply_order_status_rollup`).
 */

import type { OrderTest } from '@/types';
import {
  INACTIVE_REPORTABLE_TEST_STATUSES,
  INACTIVE_TEST_STATUSES_FOR_ROLLUP,
} from '@/types/generated/labContract';

/** Billing / queue: aligns with contracts/lab.json reporting.inactiveTestStatusesForRollup. */
export const INACTIVE_BILLABLE_TEST_STATUSES = new Set<string>(INACTIVE_TEST_STATUSES_FOR_ROLLUP);

export { INACTIVE_REPORTABLE_TEST_STATUSES };

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
