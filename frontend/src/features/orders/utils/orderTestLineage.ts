/**
 * Order test lineage — highlight superseded (prior) rows on order detail.
 */

import type { OrderTest } from '@/types';

/** Subtle row accent for embedded tables (no strikethrough / opacity). */
export function getOrderTestLineageRowClass(test: OrderTest): string {
  if (test.status !== 'superseded') return '';
  return 'border-l-2 border-l-danger-stroke/45 bg-danger-bg/35 hover:!bg-danger-bg/35';
}
