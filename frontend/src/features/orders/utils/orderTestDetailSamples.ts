/**
 * Resolve order samples related to an order test row (for test detail modal).
 */

import type { OrderTest, Sample } from '@/types';
import { walkToLiveOrderTest } from './orderTestLineage';
import { getSampleRecollectionChain } from './orderTestRelations';

/** Samples on this test's accession chain — not every tube whose testCodes mention the mnemonic. */
export function getRelatedSamplesForOrderTest(
  orderTest: OrderTest,
  orderSamples: Sample[],
  orderTests: OrderTest[] = []
): Sample[] {
  const live =
    orderTests.length > 0 && (orderTest.status === 'superseded' || orderTest.status === 'removed')
      ? walkToLiveOrderTest(orderTests, orderTest)
      : orderTest;
  const startId = live.sampleId ?? orderTest.sampleId;
  if (startId == null) return [];
  const linked = orderSamples.find(s => s.sampleId === startId);
  if (!linked) return [];
  return getSampleRecollectionChain(linked.sampleId, orderSamples);
}
