/**
 * Resolve order samples related to an order test row (for test detail modal).
 */

import type { OrderTest, Sample } from '@/types';
import { expandSamplesWithRecollectionChain } from './orderTestRelations';

/** Samples tied to this order test: linked id + any sample listing this test code. */
export function getRelatedSamplesForOrderTest(
  orderTest: OrderTest,
  orderSamples: Sample[]
): Sample[] {
  const byId = new Map<number, Sample>();

  for (const sample of orderSamples) {
    if (sample.testCodes?.includes(orderTest.testCode)) {
      byId.set(sample.sampleId, sample);
    }
  }

  if (orderTest.sampleId != null) {
    const linked = orderSamples.find(s => s.sampleId === orderTest.sampleId);
    if (linked) {
      byId.set(linked.sampleId, linked);
    }
  }

  const linkedId = orderTest.sampleId;
  const byTestCode = Array.from(byId.values()).sort((a, b) => {
    if (linkedId != null) {
      if (a.sampleId === linkedId) return -1;
      if (b.sampleId === linkedId) return 1;
    }
    return a.sampleId - b.sampleId;
  });

  return expandSamplesWithRecollectionChain(byTestCode, orderSamples, linkedId);
}
