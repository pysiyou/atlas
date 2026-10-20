/**
 * Resolves order, order test, lab context, and samples for TestDetailModal.
 */

import { useMemo } from 'react';
import { useTest, useTestCatalog } from '@/features/catalog';
import { useOrder, useOrderTestDetailSamples } from '@/features/orders';
import type { Order, OrderTest, Patient, Test, TestWithContext } from '@/types';
import {
  fallbackSamplesOrderTest,
  resolveActiveSample,
  resolveLabContextForTestDetail,
  resolveLinkedOrderTests,
  resolveModalPresentation,
  resolveOrderIdForFetch,
  resolveOrderTest,
  resolvePatientName,
} from './useTestDetailModel.resolvers';

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
  const { getTestName } = useTestCatalog();
  const { test: catalogTest } = useTest(isOpen && code ? code : undefined);
  const testDisplayName =
    (code ? getTestName(code) : '') || orderTest?.testName || test?.testName || '';

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
