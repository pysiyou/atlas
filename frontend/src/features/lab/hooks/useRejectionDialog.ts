/**
 * useRejectionDialog — rejection popover state for result validation.
 */

import { useState, useEffect, useMemo } from 'react';
import type { RejectionResult } from '@/types/lab-operations';
import { useRejectionManager } from './useRejectionManager';
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
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionNotes, setRejectionNotes] = useState('');

  const manager = useRejectionManager({ orderId, testCode, autoFetch: true });
  const {
    options,
    isLoading,
    isRejecting,
    error,
    fetchOptions,
    rejectWithReason,
    escalationRequired,
    clearError,
  } = manager;

  const allowedCriteria = options?.allowedRejectionCriteria ?? [];
  const hasReason = rejectionReason.length > 0;
  const hasCriteria = allowedCriteria.length > 0;
  const isConfirmDisabled = useMemo(
    () => !hasCriteria || !hasReason,
    [hasCriteria, hasReason]
  );

  useEffect(() => {
    onSubmittingChange?.(isRejecting);
  }, [isRejecting, onSubmittingChange]);

  const handleConfirm = async () => {
    if (!rejectionReason) return;
    const result = await rejectWithReason(rejectionReason, rejectionNotes.trim() || undefined);
    if (result) onConfirm(result);
  };

  const handleRetry = () => {
    clearError();
    fetchOptions();
  };

  const subtitle = buildSubtitle(testName, testCode, patientName);
  const copy = escalationRequired ? REJECTION_DIALOG_COPY.escalation : REJECTION_DIALOG_COPY.reject;

  return {
    rejectionReason,
    setRejectionReason,
    rejectionNotes,
    setRejectionNotes,
    isConfirmDisabled,
    isLoading,
    isRejecting,
    error,
    options,
    escalationRequired,
    handleConfirm,
    handleRetry,
    subtitle,
    copy,
  };
}
