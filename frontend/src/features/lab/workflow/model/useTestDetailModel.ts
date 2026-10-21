/**
 * Resolves order, order test, lab context, and samples for TestDetailModal.
 */

import { useMemo } from 'react';
import { useTest } from '@/features/catalog';
import { useOrder, useOrderTestDetailSamples } from '@/features/orders';
import { buildTestContextForLabMeta, findLinkedOrderTests } from '@/features/orders';
import type { Order, OrderTest, Patient, Sample, Test, TestWithContext } from '@/types';
import {
  resolveTestDetailHeaderVariant,
  resolveTestDetailModalStage,
} from '../shared/testDetailHeader';

export type TestDetailInteraction = 'view' | 'validate';

export interface UseTestDetailModelInput {
  isOpen: boolean;
  orderTestId: number;
  order?: Order;
  orderTest?: OrderTest;
  patient?: Patient | null;
  /** Lab worklist row when opened from validation (enriched). */
  test?: TestWithContext;
}

export interface UseTestDetailModelResult {
  isOrderLoading: boolean;
  order: Order | undefined;
  orderTest: OrderTest | undefined;
  patient: Patient | null | undefined;
  labContext: TestWithContext | undefined;
  catalogTest: Test | undefined;
  testDisplayName: string;
  relatedSamples: ReturnType<typeof useOrderTestDetailSamples>['relatedSamples'];
  activeSample: import('@/types').Sample | undefined;
  linked: ReturnType<typeof resolveLinkedOrderTests>;
  modalStage: ReturnType<typeof resolveModalPresentation>['modalStage'];
  headerVariant: ReturnType<typeof resolveModalPresentation>['headerVariant'];
  patientName: string;
  ready: boolean;
}

export function useTestDetailModel(input: UseTestDetailModelInput): UseTestDetailModelResult {
  const { isOpen, orderTestId, order: orderProp, orderTest: orderTestProp, patient: patientProp, test } =
    input;

  const orderIdForFetch = useMemo(
    () => resolveOrderIdForFetch(orderProp, test, orderTestProp),
    [orderProp, test, orderTestProp]
  );

  const shouldFetchOrder = isOpen && !orderProp && Boolean(orderIdForFetch);
  const { order: fetchedOrder, patient: fetchedPatient, isLoading: isOrderLoading } = useOrder(
    shouldFetchOrder ? orderIdForFetch : undefined
  );

  const order = orderProp ?? fetchedOrder;
  const patient = patientProp !== undefined ? patientProp : fetchedPatient;

  const orderTest = useMemo(
    () => resolveOrderTest(orderTestProp, orderTestId, order, test),
    [orderTestProp, orderTestId, order, test]
  );

  const samplesOrderTest = fallbackSamplesOrderTest(orderTest, orderTestId, test);

  const { relatedSamples } = useOrderTestDetailSamples(
    order?.orderId ?? 0,
    samplesOrderTest,
    isOpen && Boolean(order?.orderId && orderTest)
  );

  const activeSample = useMemo(
    () => resolveActiveSample(orderTest, relatedSamples),
    [orderTest, relatedSamples]
  );

  const labContext = useMemo(
    () => resolveLabContextForTestDetail(order, orderTest, patient, activeSample, test, orderTestId),
    [order, orderTest, patient, activeSample, test, orderTestId]
  );

  const code = orderTest?.testCode ?? test?.testCode ?? '';
  const { test: catalogTest } = useTest(isOpen && code ? code : undefined);
  const testDisplayName =
    orderTest?.testName || test?.testName || catalogTest?.name || '';

  const linked = useMemo(() => resolveLinkedOrderTests(order, orderTest), [order, orderTest]);
  const { modalStage, headerVariant } = resolveModalPresentation(orderTest, test);
  const patientName = resolvePatientName(patient, order, labContext, test);
  const ready = Boolean(order && orderTest && labContext);

  return {
    isOrderLoading,
    order,
    orderTest,
    patient,
    labContext,
    catalogTest,
    testDisplayName,
    relatedSamples,
    activeSample,
    linked,
    modalStage,
    headerVariant,
    patientName,
    ready,
  };
}

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
