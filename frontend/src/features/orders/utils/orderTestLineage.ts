/**
 * Order test lineage — highlight superseded (prior) rows on order detail.
 */

import type { Order, OrderTest } from '@/types';

/** Subtle row accent for embedded tables (no strikethrough / opacity). */
export function getOrderTestLineageRowClass(test: Pick<OrderTest, 'status'>): string {
  if (test.status !== 'superseded') return '';
  return 'border-l-2 border-l-danger-stroke/45 bg-danger-bg/35 hover:!bg-danger-bg/35';
}

export interface LinkedOrderTests {
  prior?: OrderTest;
  replacement?: OrderTest;
}

/** Resolve retest lineage siblings on the same order. */
export function findLinkedOrderTests(
  order: Pick<Order, 'tests'>,
  orderTest: OrderTest
): LinkedOrderTests {
  const tests = order.tests ?? [];
  const byId = (id: number | undefined) =>
    id != null ? tests.find(t => t.id === id) : undefined;

  return {
    prior: byId(orderTest.retestOfTestId),
    replacement: byId(orderTest.retestOrderTestId),
  };
}
