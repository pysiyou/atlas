/**
 * useRejectionDialog — quality issue popover state for result validation.
 */
import { useState, useEffect, useMemo } from 'react';
import type { QualityIssueResult } from '@/types/lab-operations';
import { useQualityIssueOptions, useReportQualityIssue } from '@/features/lab/api/quality-issues.api';
import {
  REJECTION_DIALOG_COPY,
  getValidationAlertCopy,
} from '../components/rejectionDialogConstants';

function buildSubtitle(testName?: string, testCode?: string, patientName?: string): string {
  return [testName, testCode ? `(${testCode})` : '', patientName ? `- ${patientName}` : '']
    .filter(Boolean)
    .join(' ');
}

export interface UseRejectionDialogParams {
  orderTestId: number;
  testName?: string;
  testCode?: string;
  patientName?: string;
  onConfirm: (result: QualityIssueResult) => void;
  onCancel: () => void;
  onSubmittingChange?: (submitting: boolean) => void;
}

export function useRejectionDialog({
  orderTestId,
  testName,
  testCode,
  patientName,
  onConfirm,
  onCancel: _onCancel,
  onSubmittingChange,
}: UseRejectionDialogParams) {
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionNotes, setRejectionNotes] = useState('');

  const { data: options, isLoading, error: fetchError, refetch } = useQualityIssueOptions(
    'test',
    orderTestId,
  );
  const reportMutation = useReportQualityIssue();

  const allowedCriteria = options?.allowedCriteria ?? [];
  const escalationRequired = options?.willEscalate ?? false;
  const hasReason = rejectionReason.length > 0;
  const hasCriteria = allowedCriteria.length > 0;
  const isConfirmDisabled = useMemo(() => !hasCriteria || !hasReason, [hasCriteria, hasReason]);

  const alertCopy = useMemo(
    () => (options ? getValidationAlertCopy(options) : null),
    [options],
  );

  useEffect(() => {
    onSubmittingChange?.(reportMutation.isPending);
  }, [reportMutation.isPending, onSubmittingChange]);

  const handleConfirm = async () => {
    if (!rejectionReason) return;
    const result = await reportMutation.mutateAsync({
      target: { type: 'test', id: orderTestId },
      reason: rejectionReason,
      notes: rejectionNotes.trim() || undefined,
    });
    onConfirm(result);
  };

  const handleRetry = () => {
    refetch();
  };

  const subtitle = buildSubtitle(testName, testCode, patientName);
  const copy = {
    title: REJECTION_DIALOG_COPY.reject.title,
    confirmLabel: alertCopy?.confirmLabel ?? REJECTION_DIALOG_COPY.reject.confirmLabel,
  };

  return {
    rejectionReason,
    setRejectionReason,
    rejectionNotes,
    setRejectionNotes,
    isConfirmDisabled,
    isLoading,
    isRejecting: reportMutation.isPending,
    error: reportMutation.error?.message ?? (fetchError ? String(fetchError) : null),
    options,
    escalationRequired,
    alertCopy,
    handleConfirm,
    handleRetry,
    subtitle,
    copy,
  };
}
