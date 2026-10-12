/**
 * Resolve order samples related to an order test row (for test detail modal).
 */

import type { Order, OrderTest, Patient, Sample, TestWithContext } from '@/types';

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
  return Array.from(byId.values()).sort((a, b) => {
    if (linkedId != null) {
      if (a.sampleId === linkedId) return -1;
      if (b.sampleId === linkedId) return 1;
    }
    return a.sampleId - b.sampleId;
  });
}

/** Partial TestWithContext for lab meta components on the order detail modal. */
export function buildTestContextForLabMeta(
  order: Order,
  orderTest: OrderTest,
  patient?: Patient | null,
  activeSample?: Sample | null
): TestWithContext {
  const collectedAt =
    activeSample && 'collectedAt' in activeSample ? activeSample.collectedAt : undefined;
  const collectedBy =
    activeSample && 'collectedBy' in activeSample ? activeSample.collectedBy : undefined;

  return {
    orderId: order.orderId,
    patientId: order.patientId,
    patientName: patient?.fullName ?? order.patientName,
    testName: orderTest.testName,
    testCode: orderTest.testCode,
    sampleType: orderTest.sampleType,
    sampleId: orderTest.sampleId ?? activeSample?.sampleId,
    collectedAt,
    collectedBy,
    sampleStatus: activeSample?.status,
    sampleIsRecollection: activeSample?.isRecollection,
    sampleOriginalSampleId: activeSample?.originalSampleId,
    sampleRecollectionReason: activeSample?.recollectionReason,
    sampleRecollectionAttempt: activeSample?.recollectionAttempt,
    priority: order.priority,
    status: orderTest.status,
    resultEnteredAt: orderTest.resultEnteredAt,
    enteredBy: orderTest.enteredBy,
    resultValidatedAt: orderTest.resultValidatedAt,
    validatedBy: orderTest.validatedBy,
    results: orderTest.results ?? undefined,
    flags: orderTest.flags,
    technicianNotes: orderTest.technicianNotes,
    validationNotes: orderTest.validationNotes,
    hasCriticalValues: orderTest.hasCriticalValues,
    id: orderTest.id,
    isRetest: orderTest.isRetest,
    retestOfTestId: orderTest.retestOfTestId,
    retestNumber: orderTest.retestNumber,
    referringPhysician: order.referringPhysician,
    orderDate: order.orderDate,
    lab: orderTest.lab,
    denyReason: orderTest.lab?.denyReason ?? null,
    denyMessage: orderTest.lab?.denyMessage ?? null,
  };
}
