/**
 * Pure resolvers for useTestDetailModel (keeps hook complexity low).
 */
import { buildTestContextForLabMeta, findLinkedOrderTests } from '@/features/orders';
import type { Order, OrderTest, Patient, Sample, TestWithContext } from '@/types';
import {
  resolveTestDetailHeaderVariant,
  resolveTestDetailModalStage,
} from './testDetailHeader';

export function findOrderTestOnOrder(
  order: Order | undefined,
  orderTestId: number
): OrderTest | undefined {
  if (!order?.tests?.length) return undefined;
  return order.tests.find(t => t.id === orderTestId);
}

export function mergeLabContext(base: TestWithContext, enriched?: TestWithContext): TestWithContext {
  if (!enriched) return base;
  return {
    ...base,
    ...enriched,
    id: base.id ?? enriched.id,
    orderId: base.orderId ?? enriched.orderId,
    lab: enriched.lab ?? base.lab,
    denyMessage: enriched.denyMessage ?? base.denyMessage,
    denyReason: enriched.denyReason ?? base.denyReason,
  };
}

export function resolveActiveSample(
  orderTest: OrderTest | undefined,
  relatedSamples: Sample[]
): Sample | undefined {
  if (!orderTest) return undefined;
  return relatedSamples.find(s => s.sampleId === orderTest.sampleId) ?? relatedSamples[0];
}

export function resolveLabContextForTestDetail(
  order: Order | undefined,
  orderTest: OrderTest | undefined,
  patient: Patient | null | undefined,
  activeSample: Sample | undefined,
  test: TestWithContext | undefined,
  orderTestId: number
): TestWithContext | undefined {
  if (!order || !orderTest) {
    return test?.id === orderTestId ? test : undefined;
  }
  const base = buildTestContextForLabMeta(order, orderTest, patient, activeSample);
  return mergeLabContext(base, test?.id === orderTestId ? test : undefined);
}

export function resolveLinkedOrderTests(
  order: Order | undefined,
  orderTest: OrderTest | undefined
) {
  return order && orderTest
    ? findLinkedOrderTests(order, orderTest)
    : { prior: undefined, replacement: undefined };
}

export function resolvePatientName(
  patient: Patient | null | undefined,
  order: Order | undefined,
  labContext: TestWithContext | undefined,
  test: TestWithContext | undefined
): string {
  return patient?.fullName ?? order?.patientName ?? labContext?.patientName ?? test?.patientName ?? '';
}

export function resolveModalPresentation(orderTest: OrderTest | undefined, test: TestWithContext | undefined) {
  const modalStage = resolveTestDetailModalStage(orderTest?.lab ?? test?.lab);
  const headerVariant = resolveTestDetailHeaderVariant(modalStage);
  return { modalStage, headerVariant };
}

export function resolveOrderTest(
  orderTestProp: OrderTest | undefined,
  orderTestId: number,
  order: Order | undefined,
  test: TestWithContext | undefined
): OrderTest | undefined {
  if (orderTestProp?.id === orderTestId) return orderTestProp;
  const fromOrder = findOrderTestOnOrder(order, orderTestId);
  if (fromOrder) return fromOrder;
  if (test?.id === orderTestId && order) {
    return findOrderTestOnOrder(order, orderTestId);
  }
  return undefined;
}

export function resolveOrderIdForFetch(
  orderProp: Order | undefined,
  test: TestWithContext | undefined,
  _orderTestProp?: OrderTest | undefined
): string | undefined {
  if (orderProp?.orderId) return String(orderProp.orderId);
  if (test?.orderId) return String(test.orderId);
  return undefined;
}

export function fallbackSamplesOrderTest(
  orderTest: OrderTest | undefined,
  orderTestId: number,
  test: TestWithContext | undefined
): OrderTest {
  return (
    orderTest ??
    ({
      id: orderTestId,
      testCode: test?.testCode ?? '',
      testName: test?.testName ?? '',
    } as OrderTest)
  );
}
