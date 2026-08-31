/**
 * useRejectionDialog — facade over useRejectionManager + useRejectionDialogState.
 * Single hook for RejectionDialogContent; keeps views presentational.
 */

import { useState, useEffect } from 'react';
import type { ResultRejectionType } from '@/types';
import type { RejectionResult } from '@/types/lab-operations';
import { useOrderHasValidatedTests } from '@/features/validation/hooks/useOrderHasValidatedTests';
import { useRejectionManager } from './useRejectionManager';
import { useRejectionDialogState } from './useRejectionDialogState';
import { REJECTION_DIALOG_COPY } from '../components/rejectionDialogConstants';

function buildSubtitle(
  testName?: string,
  testCode?: string,
  patientName?: string
): string {
  return [testName, testCode ? `(${testCode})` : '', patientName ? `- ${patientName}` : '']
    .filter(Boolean)
    .join(' ');
}

export interface UseRejectionDialogParams {
  orderId: string | number;
  testCode: string;
  testName?: string;
  patientName?: string;
  onConfirm: (result: RejectionResult) => void;
  onCancel: () => void;
  onSubmittingChange?: (submitting: boolean) => void;
}

export function useRejectionDialog({
  orderId,
  testCode,
  testName,
  patientName,
  onConfirm,
  onCancel: _onCancel,
  onSubmittingChange,
}: UseRejectionDialogParams) {
  const [reason, setReason] = useState('');
  const orderHasValidatedTests = useOrderHasValidatedTests(orderId);

  const manager = useRejectionManager({ orderId, testCode, autoFetch: true });
  const {
    options,
    isLoading,
    isRejecting,
    error,
    fetchOptions,
    rejectWithAction,
    isActionEnabled,
    getDisabledReason,
    retestAttemptsRemaining,
    recollectionAttemptsRemaining,
    escalationRequired,
    isEscalateEnabled,
    clearError,
  } = manager;

  const {
    selectedType,
    setUserOverride,
    isRecollectBlocked,
    recollectBlockedReason,
    isConfirmDisabled,
  } = useRejectionDialogState({
    manager: {
      options,
      isActionEnabled,
      getDisabledReason,
      escalationRequired,
      isEscalateEnabled,
    },
    orderHasValidatedTests,
    reason,
  });

  useEffect(() => {
    onSubmittingChange?.(isRejecting);
  }, [isRejecting, onSubmittingChange]);

  const handleConfirm = async () => {
    if (!reason.trim()) return;
    const actionType: ResultRejectionType = escalationRequired ? 'escalate' : selectedType;
    const result = await rejectWithAction(actionType, reason);
    if (result) onConfirm(result);
  };

  const handleRetry = () => {
    clearError();
    fetchOptions();
  };

  const subtitle = buildSubtitle(testName, testCode, patientName);
  const copy = escalationRequired ? REJECTION_DIALOG_COPY.escalation : REJECTION_DIALOG_COPY.reject;

  return {
    reason,
    setReason,
    selectedType,
    setUserOverride,
    isRecollectBlocked,
    recollectBlockedReason,
    isConfirmDisabled,
    isLoading,
    isRejecting,
    error,
    options,
    escalationRequired,
    isEscalateEnabled,
    retestAttemptsRemaining,
    recollectionAttemptsRemaining,
    orderHasValidatedTests,
    isActionEnabled,
    getDisabledReason,
    handleConfirm,
    handleRetry,
    subtitle,
    copy,
  };
}
