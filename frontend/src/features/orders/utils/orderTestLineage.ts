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

const TERMINAL_LINEAGE_STATUSES = new Set(['superseded', 'removed', 'cancelled']);

/** Walk `retestOrderTestId` until a non-superseded successor (or the last node). */
export function walkToLiveOrderTest(tests: OrderTest[], start: OrderTest): OrderTest {
  const byId = new Map(
    tests.filter((test): test is OrderTest & { id: number } => test.id != null).map(test => [test.id, test])
  );
  let current = start;
  const seen = new Set<number>();
  while (current.retestOrderTestId != null) {
    if (current.id != null) {
      if (seen.has(current.id)) break;
      seen.add(current.id);
    }
    const next = byId.get(current.retestOrderTestId);
    if (!next) break;
    current = next;
    if (!TERMINAL_LINEAGE_STATUSES.has(next.status)) {
      return next;
    }
  }
  return current;
}

/** Resolve retest lineage siblings on the same order. */
export function findLinkedOrderTests(
  order: Pick<Order, 'tests'>,
  orderTest: OrderTest
): LinkedOrderTests {
  const tests = order.tests ?? [];
  const byId = (id: number | undefined) =>
    id != null ? tests.find(t => t.id === id) : undefined;

  const replacementStart = byId(orderTest.retestOrderTestId);
  return {
    prior: byId(orderTest.retestOfTestId),
    replacement: replacementStart ? walkToLiveOrderTest(tests, replacementStart) : undefined,
  };
}
