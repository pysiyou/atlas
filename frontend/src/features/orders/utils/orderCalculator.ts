/**
 * Order business logic utilities (billing lines vs lab rollup visibility).
 * Order rollup status is computed only on the backend (`apply_order_status_rollup`).
 */

import type { OrderTest } from '@/types';
import {
  INACTIVE_BILLING_TEST_STATUSES,
  INACTIVE_REPORTABLE_TEST_STATUSES,
  INACTIVE_TEST_STATUSES_FOR_ROLLUP,
} from '@/types/generated/labContract';

/** Lab rollup / progress: excludes cancelled lines from active work counts. */
export const INACTIVE_ROLLUP_TEST_STATUSES = new Set<string>(INACTIVE_TEST_STATUSES_FOR_ROLLUP);

export { INACTIVE_REPORTABLE_TEST_STATUSES };

export const isActiveTest = (test: OrderTest): boolean =>
  !INACTIVE_ROLLUP_TEST_STATUSES.has(test.status);

export const isBillableTest = (test: OrderTest): boolean =>
  !INACTIVE_BILLING_TEST_STATUSES.has(test.status);

export const isReportableTest = (test: Pick<OrderTest, 'status'>): boolean =>
  !INACTIVE_REPORTABLE_TEST_STATUSES.has(test.status);

export const getActiveTests = (tests: OrderTest[]): OrderTest[] => tests.filter(isActiveTest);

/** Tests charged on the order — unchanged by lab cancel; only explicit order edits remove lines. */
export const getBillableTests = (tests: OrderTest[]): OrderTest[] => tests.filter(isBillableTest);

export const getBillableTotal = (tests: OrderTest[]): number =>
  getBillableTests(tests).reduce(
    (sum, t) => sum + (typeof t.priceAtOrder === 'number' ? t.priceAtOrder : 0),
    0
  );
