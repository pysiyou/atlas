/**
 * Open read-only detail modals for historical samples and order tests from timeline links.
 */
import { useCallback } from 'react';
import { toast } from '@/app/AppToastBar';
import { useModal, ModalType } from '@/lib/context/ModalContext';
import { sampleAPI } from '@/features/lab/api/samples.api';
import { resultAPI } from '@/features/lab/api/results.api';
import { orderTestKey } from '@/features/lab/utils/orderTestKey';
import { hasTestResults } from '@/features/lab/utils/hasTestResults';
import type { TestWithContext } from '@/types';

const noop = () => undefined;

function openHistoricalValidationModal(
  openModal: ReturnType<typeof useModal>['openModal'],
  test: TestWithContext,
  orderTestId: number,
) {
  openModal(ModalType.VALIDATION_DETAIL, {
    test,
    commentKey: orderTestKey(orderTestId),
    comments: test.validationNotes ?? '',
    readOnly: true,
    onCommentsChange: noop,
    onApprove: noop,
    onReject: noop,
  });
}

function openHistoricalEntryModal(
  openModal: ReturnType<typeof useModal>['openModal'],
  test: TestWithContext,
  orderTestId: number,
) {
  const resultValues = hasTestResults(test)
    ? Object.fromEntries(
        Object.entries(test.results!).map(([key, value]) => [key, String(value ?? '')]),
      )
    : {};

  openModal(ModalType.RESULT_DETAIL, {
    test,
    testDef: undefined,
    resultKey: orderTestKey(orderTestId),
    results: resultValues,
    technicianNotes: test.technicianNotes ?? '',
    isComplete: hasTestResults(test),
    readOnly: true,
    onResultsChange: noop,
    onNotesChange: noop,
    onSave: noop,
  });
}

export function useOpenHistoricalEntity() {
  const { openModal } = useModal();

  const openSample = useCallback(
    async (sampleId: number) => {
      const sample = await sampleAPI.getById(String(sampleId));
      if (!sample) {
        toast.error({
          title: 'Sample not found',
          subtitle: `Could not load sample ${sampleId}. It may have been removed.`,
        });
        return;
      }
      openModal(ModalType.SAMPLE_DETAIL, { sampleId: String(sampleId), readOnly: true });
    },
    [openModal],
  );

  const openOrderTest = useCallback(
    async (orderTestId: number) => {
      let test: TestWithContext;
      try {
        test = await resultAPI.getOrderTestContext(orderTestId);
      } catch {
        toast.error({
          title: 'Test record not found',
          subtitle: `Could not load order test ${orderTestId}.`,
        });
        return;
      }

      if (test.status === 'escalated') {
        openModal(ModalType.ESCALATION_RESOLUTION_DETAIL, {
          test,
          readOnly: true,
          onResolved: noop,
        });
        return;
      }

      // Any persisted results (superseded, validated, cancelled, resulted) → review view.
      if (hasTestResults(test)) {
        openHistoricalValidationModal(openModal, test, orderTestId);
        return;
      }

      if (test.status === 'sample-collected' || test.status === 'pending') {
        openHistoricalEntryModal(openModal, test, orderTestId);
        return;
      }

      // Superseded / cancelled rows without results — still show metadata + history.
      openHistoricalValidationModal(openModal, test, orderTestId);
    },
    [openModal],
  );

  return { openSample, openOrderTest };
}
