/**
 * Data + derived flags for {@link TestDetailModal}.
 */

import { useMemo } from 'react';
import type { TestDetailModalProps } from '@/lib/context/modalTypes';
import { buildCriticalValueRecord } from '../../criticalValues/criticalValues';
import type { LabModalWorkItem } from '../../types/labQueueChrome';
import { useSampleRejectionDisplay } from '../../hooks/useSampleRejectionDisplay';
import { useTestDetailModalActions } from './useTestDetailModalActions';
import { useTestDetailModel } from './useTestDetailModel';
import { useTestDetailModalDerived } from './useTestDetailModalDerived';

const EMPTY_QUEUE_ROW: LabModalWorkItem = {
  orderTestId: 0,
  orderId: 0,
  patientName: '',
  testName: '',
  testCode: '',
  priority: 'routine',
  status: 'pending',
};

/**
 * Loads the test-detail work item and derives chrome/body flags for the modal frame.
 */
export function useTestDetailModalView({
  isOpen,
  onClose,
  orderTestId,
  interaction = 'view',
  worklistRow,
}: Pick<TestDetailModalProps, 'isOpen' | 'onClose' | 'orderTestId' | 'interaction' | 'worklistRow'>) {
  const model = useTestDetailModel({
    isOpen,
    orderTestId,
    worklistRow,
  });

  const {
    order,
    orderTest,
    queueWorkItem,
    detailWorkItem,
    catalogTest,
    testDisplayName,
    relatedSamples,
    linked,
    modalStage,
    headerVariant,
    patientName,
    patient,
    ready,
    isOrderLoading,
    isCatalogLoading,
    orderTestSnapshot,
  } = model;

  const displayWorkItem = detailWorkItem ?? queueWorkItem;
  const sampleRejection = useSampleRejectionDisplay(displayWorkItem ?? EMPTY_QUEUE_ROW);
  const criticalRecord = useMemo(() => {
    if (!detailWorkItem) return undefined;
    return buildCriticalValueRecord(detailWorkItem) ?? undefined;
  }, [detailWorkItem]);

  const actions = useTestDetailModalActions({
    interaction,
    orderTestId,
    orderId: order?.orderId ?? orderTestSnapshot?.orderId,
    onClose,
  });

  const derived = useTestDetailModalDerived({
    order,
    orderTest,
    linked,
    catalogTest,
    openLinkedTest: actions.openLinkedTest,
    onClose,
    detailWorkItem,
    interaction,
    orderTestId,
  });

  const testCode = orderTest?.testCode ?? displayWorkItem?.testCode ?? '';
  const needsCatalog = Boolean(testCode);
  const catalogReady = !needsCatalog || (!isCatalogLoading && catalogTest !== undefined);
  const contentReady =
    ready && !isOrderLoading && catalogReady && Boolean(order && orderTest && displayWorkItem);

  return {
    order,
    orderTest,
    catalogTest,
    testDisplayName,
    relatedSamples,
    modalStage,
    headerVariant,
    patientName,
    patient,
    ready,
    displayWorkItem,
    sampleRejection,
    criticalRecord,
    contentReady,
    orderTestId,
    onClose,
    ...actions,
    ...derived,
  };
}
