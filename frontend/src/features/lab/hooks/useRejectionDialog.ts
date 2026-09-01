/**
 * useRejectionDialog — facade over useRejectionManager with dialog UI state.
 * Single hook for RejectionDialogContent; keeps views presentational.
 */

import { useState, useEffect, useMemo } from 'react';
import type { ResultRejectionType } from '@/types';
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

function getIsConfirmDisabled(
  escalationRequired: boolean,
  hasReason: boolean,
  isRetestEnabled: boolean,
  hasCriteria: boolean
): boolean {
  if (!hasCriteria || !hasReason) return true;
  if (escalationRequired) return false;
  return !isRetestEnabled;
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
    rejectWithAction,
    isActionEnabled,
    getDisabledReason,
    retestAttemptsRemaining,
    escalationRequired,
    clearError,
  } = manager;

  const isRetestEnabled = isActionEnabled('re-test');
  const retestDisabledReason = getDisabledReason('re-test');
  const selectedType: ResultRejectionType = escalationRequired ? 'escalate' : 're-test';
  const allowedCriteria = options?.allowedRejectionCriteria ?? [];
  const hasReason = rejectionReason.length > 0;
  const hasCriteria = allowedCriteria.length > 0;
  const isConfirmDisabled = useMemo(
    () => getIsConfirmDisabled(escalationRequired, hasReason, isRetestEnabled, hasCriteria),
    [escalationRequired, hasReason, isRetestEnabled, hasCriteria]
  );

  useEffect(() => {
    onSubmittingChange?.(isRejecting);
  }, [isRejecting, onSubmittingChange]);

  const handleConfirm = async () => {
    if (!rejectionReason) return;
    const actionType: ResultRejectionType = escalationRequired ? 'escalate' : 're-test';
    const result = await rejectWithAction(
      actionType,
      rejectionReason,
      rejectionNotes.trim() || undefined
    );
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
    selectedType,
    isConfirmDisabled,
    isLoading,
    isRejecting,
    error,
    options,
    escalationRequired,
    retestAttemptsRemaining,
    isRetestEnabled,
    retestDisabledReason,
    handleConfirm,
    handleRetry,
    subtitle,
    copy,
  };
}
