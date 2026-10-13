/**
 * Related order tests and samples for detail modals (same tube, retest rows, recollection chain).
 */

import type { Order, OrderTest, Sample } from '@/types';

/** Other order test rows assigned to the same sample as the current row. */
export function getSiblingOrderTestsOnSample(
  order: Pick<Order, 'tests'>,
  orderTest: Pick<OrderTest, 'id' | 'sampleId'>
): OrderTest[] {
  const sampleId = orderTest.sampleId;
  if (sampleId == null) return [];
  return (order.tests ?? []).filter(t => t.sampleId === sampleId && t.id !== orderTest.id);
}

/** Same catalog test on a different sample (retests / superseded rows not on the current tube). */
export function getRelatedOrderTestEntries(
  order: Pick<Order, 'tests'>,
  orderTest: Pick<OrderTest, 'id' | 'testCode' | 'sampleId'>
): OrderTest[] {
  const sampleId = orderTest.sampleId;
  return (order.tests ?? [])
    .filter(
      t =>
        t.testCode === orderTest.testCode &&
        t.id !== orderTest.id &&
        (sampleId == null || t.sampleId !== sampleId)
    )
    .sort((a, b) => (a.id ?? 0) - (b.id ?? 0));
}

/** Original sample and recollections linked to a sample on the order. */
export function getSampleRecollectionChain(
  sampleId: number,
  orderSamples: Sample[]
): Sample[] {
  const byId = new Map(orderSamples.map(s => [s.sampleId, s]));
  const inChain = new Set<number>();
  const seed = byId.get(sampleId);
  if (!seed) return [];

  inChain.add(seed.sampleId);

  let walk: Sample | undefined = seed;
  while (walk?.originalSampleId != null && byId.has(walk.originalSampleId)) {
    walk = byId.get(walk.originalSampleId);
    if (walk) inChain.add(walk.sampleId);
  }

  for (const s of orderSamples) {
    if (s.originalSampleId != null && inChain.has(s.originalSampleId)) {
      inChain.add(s.sampleId);
    }
  }

  const linkedId = sampleId;
  return orderSamples
    .filter(s => inChain.has(s.sampleId))
    .sort((a, b) => {
      if (a.sampleId === linkedId) return -1;
      if (b.sampleId === linkedId) return 1;
      return a.sampleId - b.sampleId;
    });
}

/** Add recollection originals/successors to samples already tied to an order test. */
export function expandSamplesWithRecollectionChain(
  related: Sample[],
  orderSamples: Sample[],
  linkedSampleId?: number
): Sample[] {
  const byId = new Map<number, Sample>();
  for (const s of related) {
    byId.set(s.sampleId, s);
  }
  for (const s of related) {
    for (const chained of getSampleRecollectionChain(s.sampleId, orderSamples)) {
      byId.set(chained.sampleId, chained);
    }
  }

  const linkedId = linkedSampleId ?? related[0]?.sampleId;
  return Array.from(byId.values()).sort((a, b) => {
    if (linkedId != null) {
      if (a.sampleId === linkedId) return -1;
      if (b.sampleId === linkedId) return 1;
    }
    return a.sampleId - b.sampleId;
  });
}
