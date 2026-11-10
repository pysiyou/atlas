/**
 * Shared order fetch + queue snapshot merge for lab workflow modals.
 */

import { useMemo } from 'react';
import { useOrder, useOrderTestDetailSamples } from '@/features/orders';
import type { Order, OrderTest, Patient, Sample } from '@/types';
import type { EntryWorklistItem, ValidationWorklistItem } from '@/types/labWorklist';
import { useOrderTestContext, type PendingEscalationItem } from '../../api/results';
import {
  labModalWorkItemFromDto,
  labModalWorkItemFromOrder,
  mergeLabModalWorkItem,
  type LabModalWorkItem,
} from '../../types/labQueueChrome';

export interface UseLabModalWorkItemModelInput {
  isOpen: boolean;
  orderTestId: number;
  order?: Order;
  orderTest?: OrderTest;
  patient?: Patient | null;
  /** Optional API row override (tests); otherwise fetched inside the hook. */
  orderTestSnapshot?: PendingEscalationItem;
  /** Worklist row snapshot when opening from lab queues (display-only until order loads). */
  worklistRow?: EntryWorklistItem | ValidationWorklistItem;
  /** Escalation queue row — instant chrome before context API returns. */
  escalationSnapshot?: PendingEscalationItem;
}

export interface UseLabModalWorkItemModelResult {
  isOrderLoading: boolean;
  isContextLoading: boolean;
  isContextError: boolean;
  contextError: unknown;
  refetchContext: () => void;
  orderTestSnapshot: PendingEscalationItem | undefined;
  order: Order | undefined;
  orderTest: OrderTest | undefined;
  patient: Patient | null | undefined;
  queueWorkItem: LabModalWorkItem | undefined;
  detailWorkItem: LabModalWorkItem | undefined;
  displayWorkItem: LabModalWorkItem | undefined;
  relatedSamples: ReturnType<typeof useOrderTestDetailSamples>['relatedSamples'];
  activeSample: Sample | undefined;
  patientName: string;
  ready: boolean;
}

export function useLabModalWorkItemModel(
  input: UseLabModalWorkItemModelInput
): UseLabModalWorkItemModelResult {
  const {
    isOpen,
    orderTestId,
    order: orderProp,
    orderTest: orderTestProp,
    patient: patientProp,
    orderTestSnapshot: orderTestSnapshotOverride,
    worklistRow,
    escalationSnapshot,
  } = input;

  const {
    item: fetchedOrderTestSnapshot,
    isLoading: isContextLoading,
    isError: isContextError,
    error: contextError,
    refetch: refetchContext,
  } = useOrderTestContext(orderTestId, isOpen);

  const orderTestSnapshot = orderTestSnapshotOverride ?? fetchedOrderTestSnapshot;

  const queueWorkItem = useMemo(
    () => resolveQueueWorkItemSnapshot(worklistRow, escalationSnapshot, orderTestSnapshot),
    [worklistRow, escalationSnapshot, orderTestSnapshot]
  );

  const orderIdForFetch = useMemo(() => {
    const fromWorkItem = resolveOrderIdForFetch(orderProp, queueWorkItem, orderTestProp);
    if (fromWorkItem) return fromWorkItem;
    if (orderTestSnapshot?.orderId != null) {
      return String(orderTestSnapshot.orderId);
    }
    return undefined;
  }, [orderProp, queueWorkItem, orderTestProp, orderTestSnapshot]);

  const shouldFetchOrder = isOpen && !orderProp && Boolean(orderIdForFetch);
  const { order: fetchedOrder, patient: fetchedPatient, isLoading: isOrderLoading } = useOrder(
    shouldFetchOrder ? orderIdForFetch : undefined
  );

  const order = orderProp ?? fetchedOrder;
  const patient = patientProp !== undefined ? patientProp : fetchedPatient;

  const orderTest = useMemo(
    () => resolveOrderTest(orderTestProp, orderTestId, order, queueWorkItem),
    [orderTestProp, orderTestId, order, queueWorkItem]
  );

  const samplesOrderTest = fallbackSamplesOrderTest(orderTest, orderTestId, queueWorkItem);

  const { relatedSamples } = useOrderTestDetailSamples(
    order?.orderId ?? 0,
    samplesOrderTest,
    isOpen && Boolean(order?.orderId && orderTest)
  );

  const activeSample = useMemo(
    () => resolveActiveSample(orderTest, relatedSamples),
    [orderTest, relatedSamples]
  );

  const detailWorkItem = useMemo(
    () =>
      resolveDetailWorkItem(order, orderTest, patient, activeSample, queueWorkItem, orderTestId),
    [order, orderTest, patient, activeSample, queueWorkItem, orderTestId]
  );

  const displayWorkItem = detailWorkItem ?? queueWorkItem;
  const patientName = resolvePatientName(patient, order, detailWorkItem, queueWorkItem);
  const ready = Boolean(order && orderTest && detailWorkItem);

  return {
    isOrderLoading,
    isContextLoading,
    isContextError,
    contextError,
    refetchContext: () => {
      void refetchContext();
    },
    orderTestSnapshot,
    order,
    orderTest,
    patient,
    queueWorkItem,
    detailWorkItem,
    displayWorkItem,
    relatedSamples,
    activeSample,
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

export function resolveActiveSample(
  orderTest: OrderTest | undefined,
  relatedSamples: Sample[]
): Sample | undefined {
  if (!orderTest) return undefined;
  return relatedSamples.find(s => s.sampleId === orderTest.sampleId) ?? relatedSamples[0];
}

export function resolveDetailWorkItem(
  order: Order | undefined,
  orderTest: OrderTest | undefined,
  patient: Patient | null | undefined,
  activeSample: Sample | undefined,
  queueWorkItem: LabModalWorkItem | undefined,
  orderTestId: number
): LabModalWorkItem | undefined {
  if (!order || !orderTest) {
    return undefined;
  }
  const base = labModalWorkItemFromOrder(order, orderTest, patient, activeSample);
  if (!queueWorkItem || queueWorkItem.orderTestId !== orderTestId) {
    return base;
  }
  return mergeLabModalWorkItem(base, queueWorkItem);
}

export function resolvePatientName(
  patient: Patient | null | undefined,
  order: Order | undefined,
  detailWorkItem: LabModalWorkItem | undefined,
  workItem: LabModalWorkItem | undefined
): string {
  return (
    patient?.fullName ??
    order?.patientName ??
    detailWorkItem?.patientName ??
    workItem?.patientName ??
    ''
  );
}

export function resolveOrderTest(
  orderTestProp: OrderTest | undefined,
  orderTestId: number,
  order: Order | undefined,
  workItem: LabModalWorkItem | undefined
): OrderTest | undefined {
  if (orderTestProp?.id === orderTestId) return orderTestProp;
  const fromOrder = findOrderTestOnOrder(order, orderTestId);
  if (fromOrder) return fromOrder;
  if (workItem?.orderTestId === orderTestId && order) {
    return findOrderTestOnOrder(order, orderTestId);
  }
  return undefined;
}

export function resolveOrderIdForFetch(
  orderProp: Order | undefined,
  workItem: LabModalWorkItem | undefined,
  _orderTestProp?: OrderTest | undefined
): string | undefined {
  if (orderProp?.orderId) return String(orderProp.orderId);
  if (workItem?.orderId) return String(workItem.orderId);
  return undefined;
}

export function resolveQueueWorkItemSnapshot(
  worklistRow?: EntryWorklistItem | ValidationWorklistItem,
  escalationSnapshot?: PendingEscalationItem,
  orderTestSnapshot?: PendingEscalationItem
): LabModalWorkItem | undefined {
  if (worklistRow) {
    return labModalWorkItemFromDto(worklistRow);
  }
  if (escalationSnapshot) {
    return labModalWorkItemFromDto(escalationSnapshot);
  }
  if (orderTestSnapshot) {
    return labModalWorkItemFromDto(orderTestSnapshot);
  }
  return undefined;
}

export function fallbackSamplesOrderTest(
  orderTest: OrderTest | undefined,
  orderTestId: number,
  workItem: LabModalWorkItem | undefined
): OrderTest {
  return (
    orderTest ??
    ({
      id: orderTestId,
      testCode: workItem?.testCode ?? '',
      testName: workItem?.testName ?? '',
    } as OrderTest)
  );
}
