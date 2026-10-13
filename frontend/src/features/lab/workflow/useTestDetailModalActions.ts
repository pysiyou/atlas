/**
 * Modal callbacks for TestDetailModal (keeps component under max-lines-per-function).
 */
import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { ModalType, useModal } from '@/lib/context/ModalContext';
import type { TestDetailProps } from '@/lib/context/modalTypes';
import type { Order, OrderTest, Patient } from '@/types';
import { invalidateLabWorkflowQueries } from '@/lib/query/invalidate';

export function useTestDetailModalActions({
  validation,
  onClose,
  order,
  patientProp,
  modelPatient,
}: {
  validation: TestDetailProps['validation'];
  onClose: () => void;
  order: Order | undefined;
  patientProp: Patient | null | undefined;
  modelPatient: Patient | null | undefined;
}) {
  const { openModal } = useModal();
  const queryClient = useQueryClient();

  const approveHandler = useCallback(
    async (_signal: AbortSignal) => {
      if (!validation?.onApprove) return;
      await validation.onApprove();
      onClose();
    },
    [validation, onClose]
  );
  const { execute: handleApprove, isPending: isApproving } = useAsyncAction(approveHandler, {
    minDisplayMs: 500,
    scope: 'inline',
  });

  const handleCriticalValueUpdated = useCallback(() => {
    invalidateLabWorkflowQueries(queryClient, { criticalValues: true });
  }, [queryClient]);

  const openLinkedTest = useCallback(
    (linkedTest: OrderTest) => {
      if (!order) return;
      openModal(ModalType.TEST_DETAIL, {
        orderTestId: linkedTest.id!,
        order,
        orderTest: linkedTest,
        patient: patientProp ?? modelPatient ?? null,
        interaction: 'view',
      });
    },
    [openModal, order, patientProp, modelPatient]
  );

  const handleViewFullSample = useCallback(
    (sampleId: number) => {
      openModal(ModalType.SAMPLE_DETAIL, { sampleId: String(sampleId), readOnly: true });
    },
    [openModal]
  );

  return {
    handleApprove,
    isApproving,
    handleCriticalValueUpdated,
    openLinkedTest,
    handleViewFullSample,
  };
}
