/**
 * Order business logic utilities (active tests, billing totals).
 * Order rollup status is computed only on the backend (`apply_order_status_rollup`).
 */

import type { OrderTest } from '@/types';

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
