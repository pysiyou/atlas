/**
 * Resolves order, order test, and modal work item for TestDetailModal.
 */

import { useMemo } from 'react';
import { useTest } from '@/features/catalog';
import { findLinkedOrderTests } from '@/features/orders';
import type { Order, OrderTest, Patient, Test } from '@/types';
import type { LabModalWorkItem } from '../../types/labQueueChrome';
import {
  resolveTestDetailHeaderVariant,
  resolveTestDetailModalStage,
} from '../shared/testDetailHeader';
import {
  useLabModalWorkItemModel,
  type UseLabModalWorkItemModelInput,
} from './useLabModalWorkItemModel';

export type TestDetailInteraction = 'view' | 'validate';

export type UseTestDetailModelInput = UseLabModalWorkItemModelInput;

export interface UseTestDetailModelResult {
  isOrderLoading: boolean;
  isContextLoading: boolean;
  isContextError: boolean;
  contextError: unknown;
  refetchContext: () => void;
  orderTestSnapshot: import('../../api/results').PendingEscalationItem | undefined;
  order: Order | undefined;
  orderTest: OrderTest | undefined;
  patient: Patient | null | undefined;
  queueWorkItem: LabModalWorkItem | undefined;
  detailWorkItem: LabModalWorkItem | undefined;
  catalogTest: Test | undefined;
  testDisplayName: string;
  relatedSamples: ReturnType<typeof import('@/features/orders').useOrderTestDetailSamples>['relatedSamples'];
  activeSample: import('@/types').Sample | undefined;
  linked: ReturnType<typeof resolveLinkedOrderTests>;
  modalStage: ReturnType<typeof resolveModalPresentation>['modalStage'];
  headerVariant: ReturnType<typeof resolveModalPresentation>['headerVariant'];
  patientName: string;
  ready: boolean;
  isCatalogLoading: boolean;
}

export function useTestDetailModel(input: UseTestDetailModelInput): UseTestDetailModelResult {
  const { isOpen } = input;
  const { orderTest, queueWorkItem, detailWorkItem, ...base } = useLabModalWorkItemModel(input);

  const code = orderTest?.testCode ?? queueWorkItem?.testCode ?? '';
  const { test: catalogTest, isLoading: isCatalogLoading } = useTest(isOpen && code ? code : undefined);
  const testDisplayName =
    orderTest?.testName || queueWorkItem?.testName || catalogTest?.name || '';

  const linked = useMemo(
    () => resolveLinkedOrderTests(base.order, orderTest),
    [base.order, orderTest]
  );
  const presentationItem = detailWorkItem ?? queueWorkItem;
  const { modalStage, headerVariant } = resolveModalPresentation(orderTest, presentationItem);

  return {
    ...base,
    orderTest,
    queueWorkItem,
    detailWorkItem,
    catalogTest,
    testDisplayName,
    linked,
    modalStage,
    headerVariant,
    isCatalogLoading,
  };
}

export function resolveLinkedOrderTests(
  order: Order | undefined,
  orderTest: OrderTest | undefined
) {
  return order && orderTest
    ? findLinkedOrderTests(order, orderTest)
    : { prior: undefined, replacement: undefined };
}

export function resolveModalPresentation(
  orderTest: OrderTest | undefined,
  workItem: LabModalWorkItem | undefined
) {
  const modalStage = resolveTestDetailModalStage(
    (orderTest?.lab ?? workItem?.lab) as Parameters<typeof resolveTestDetailModalStage>[0]
  );
  const headerVariant = resolveTestDetailHeaderVariant(modalStage);
  return { modalStage, headerVariant };
}

export {
  findOrderTestOnOrder,
  resolveActiveSample,
  resolvePatientName,
  resolveOrderTest,
  resolveOrderIdForFetch,
  fallbackSamplesOrderTest,
} from './useLabModalWorkItemModel';
