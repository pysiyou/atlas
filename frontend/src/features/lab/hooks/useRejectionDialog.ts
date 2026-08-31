/**
 * useRejectionDialog — facade over useRejectionManager with dialog UI state.
 * Single hook for RejectionDialogContent; keeps views presentational.
 */

import { useState, useEffect, useMemo } from 'react';
import type { ResultRejectionType } from '@/types';
import type { RejectionResult, RejectionOptionsResponse } from '@/types/lab-operations';
import { useOrderHasValidatedTests } from '@/features/lab-validation/hooks/useOrderHasValidatedTests';
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

function getDefaultRejectionType(
  options: RejectionOptionsResponse | null,
  isActionEnabled: (action: 're-test' | 're-collect') => boolean,
  isRecollectBlocked: boolean,
  isEscalateEnabled: boolean
): ResultRejectionType {
  if (options && isActionEnabled('re-test')) return 're-test';
  if (!isRecollectBlocked) return 're-collect';
  if (isEscalateEnabled) return 'escalate';
  return 're-test';
}

function getIsConfirmDisabled(
  escalationRequired: boolean,
  hasReason: boolean,
  selectedType: ResultRejectionType,
  isActionEnabled: (action: 're-test' | 're-collect') => boolean,
  isRecollectBlocked: boolean,
  isEscalateEnabled: boolean
): boolean {
  if (escalationRequired) return !hasReason;
  if (!hasReason) return true;
  if (selectedType === 'escalate') return !isEscalateEnabled;
  if (selectedType === 're-test') return !isActionEnabled('re-test');
  if (selectedType === 're-collect') return isRecollectBlocked;
  return true;
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
  const [userOverride, setUserOverride] = useState<ResultRejectionType | null>(null);
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

  const isRecollectBlocked = orderHasValidatedTests || !isActionEnabled('re-collect');
  const recollectBlockedReason = orderHasValidatedTests
    ? REJECTION_DIALOG_COPY.recollectBlocked
    : getDisabledReason('re-collect');

  const defaultType = useMemo(
    () =>
      getDefaultRejectionType(options, isActionEnabled, isRecollectBlocked, isEscalateEnabled),
    [options, isActionEnabled, isRecollectBlocked, isEscalateEnabled]
  );

  const selectedType = userOverride ?? defaultType;
  const hasReason = reason.trim().length > 0;
  const isConfirmDisabled = useMemo(
    () =>
      getIsConfirmDisabled(
        escalationRequired,
        hasReason,
        selectedType,
        isActionEnabled,
        isRecollectBlocked,
        isEscalateEnabled
      ),
    [escalationRequired, hasReason, selectedType, isActionEnabled, isRecollectBlocked, isEscalateEnabled]
  );

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
