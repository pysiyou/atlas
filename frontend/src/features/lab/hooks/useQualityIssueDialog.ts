/**
 * useQualityIssueDialog — quality issue popover state for result validation.
 * Validator must choose reason + destination (preferredRemedy); no auto-routing.
 */
import { useState, useEffect, useMemo } from 'react';
import type { QualityIssueResult, RemedyType } from '@/types/lab-operations';
import { useQualityIssueOptions, useReportQualityIssue } from '@/features/lab/api/quality-issues.api';
import {
  QUALITY_ISSUE_DIALOG_COPY,
  getValidationAlertCopy,
} from '../components/qualityIssueDialogConstants';
import { buildValidationRemedyOptions } from '../components/RemedyDestinationPicker';

function buildSubtitle(testName?: string, testCode?: string, patientName?: string): string {
  return [testName, testCode ? `(${testCode})` : '', patientName ? `- ${patientName}` : '']
    .filter(Boolean)
    .join(' ');
}

export interface UseQualityIssueDialogParams {
  orderTestId: number;
  testName?: string;
  testCode?: string;
  patientName?: string;
  onConfirm: (result: QualityIssueResult) => void;
  onCancel: () => void;
  onSubmittingChange?: (submitting: boolean) => void;
}

export function useQualityIssueDialog({
  orderTestId,
  testName,
  testCode,
  patientName,
  onConfirm,
  onCancel: _onCancel,
  onSubmittingChange,
}: UseQualityIssueDialogParams) {
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [preferredRemedy, setPreferredRemedy] = useState<RemedyType | ''>('');

  const { data: options, isLoading, error: fetchError, refetch } = useQualityIssueOptions(
    'test',
    orderTestId,
  );
  const reportMutation = useReportQualityIssue();

  const remedyOptions = useMemo(
    () =>
      buildValidationRemedyOptions(options?.allowedRemedies, {
        retestRemaining: options?.retestAttemptsRemaining,
        recollectionRemaining: options?.recollectionAttemptsRemaining,
      }),
    [options],
  );

  // Pre-select soft suggestion when options load (still editable).
  useEffect(() => {
    if (!options || preferredRemedy) return;
    const suggested = options.suggestedRemedy ?? options.previewRemedy;
    if (suggested && remedyOptions.some(o => o.value === suggested)) {
      setPreferredRemedy(suggested);
    }
  }, [options, preferredRemedy, remedyOptions]);

  const allowedCriteria = options?.allowedCriteria ?? [];
  const hasReason = rejectionReason.length > 0;
  const hasCriteria = allowedCriteria.length > 0;
  const hasDestination = preferredRemedy !== '';
  const isConfirmDisabled = useMemo(
    () => !hasCriteria || !hasReason || !hasDestination,
    [hasCriteria, hasReason, hasDestination]
  );

  const alertCopy = useMemo(
    () => (options ? getValidationAlertCopy(options) : null),
    [options],
  );

  useEffect(() => {
    onSubmittingChange?.(reportMutation.isPending);
  }, [reportMutation.isPending, onSubmittingChange]);

  const handleConfirm = async () => {
    if (!rejectionReason || !preferredRemedy) return;
    const result = await reportMutation.mutateAsync({
      target: { type: 'test', id: orderTestId },
      reason: rejectionReason,
      notes: rejectionNotes.trim() || undefined,
      preferredRemedy,
    });
    onConfirm(result);
  };

  const handleRetry = () => {
    refetch();
  };

  const subtitle = buildSubtitle(testName, testCode, patientName);
  const copy = {
    title: QUALITY_ISSUE_DIALOG_COPY.reject.title,
    confirmLabel: alertCopy?.confirmLabel ?? QUALITY_ISSUE_DIALOG_COPY.reject.confirmLabel,
  };

  return {
    rejectionReason,
    setRejectionReason,
    rejectionNotes,
    setRejectionNotes,
    preferredRemedy,
    setPreferredRemedy,
    remedyOptions,
    isConfirmDisabled,
    isLoading,
    isRejecting: reportMutation.isPending,
    error: reportMutation.error?.message ?? (fetchError ? String(fetchError) : null),
    options,
    alertCopy,
    handleConfirm,
    handleRetry,
    subtitle,
    copy,
  };
}
