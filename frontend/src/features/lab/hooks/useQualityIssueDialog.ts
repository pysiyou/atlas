/**
 * useQualityIssueDialog — quality issue popover state for result validation.
 */
import { useState, useMemo, useEffect } from 'react';
import type { QualityIssueResult, RemedyType } from '@/types/lab-operations';
import { useQualityIssueOptions, useReportQualityIssue } from '../api/quality-issues.api';
import {
  QUALITY_ISSUE_DIALOG_COPY,
  getValidationAlertCopy,
} from '../components/qualityIssueDialogConstants';
import { displayId } from '@/utils';
import {
  buildValidationRemedyOptions,
  resolveSuggestedRemedy,
} from '../components/remedyDestinationUtils';

function buildSubtitle(
  orderTestId: number,
  testName?: string,
  testCode?: string,
  patientName?: string
): string {
  const testLabel = [testName, testCode ? `(${testCode})` : ''].filter(Boolean).join(' ');
  const patient = patientName ? ` - ${patientName}` : '';
  return `${displayId.orderTest(orderTestId)} · ${testLabel}${patient}`;
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
    orderTestId
  );
  const reportMutation = useReportQualityIssue();

  const remedyOptions = useMemo(
    () =>
      buildValidationRemedyOptions(options?.allowedRemedies, {
        retestRemaining: options?.retestAttemptsRemaining,
      }),
    [options]
  );

  const suggestedRemedy = useMemo(
    () =>
      resolveSuggestedRemedy(
        options?.suggestedRemedy ?? options?.previewRemedy,
        remedyOptions
      ),
    [options?.previewRemedy, options?.suggestedRemedy, remedyOptions]
  );

  const effectivePreferredRemedy = preferredRemedy || suggestedRemedy;

  const allowedCriteria = options?.allowedCriteria ?? [];
  const hasReason = rejectionReason.length > 0;
  const hasCriteria = allowedCriteria.length > 0;
  const hasDestination = effectivePreferredRemedy !== '';
  const isConfirmDisabled = useMemo(
    () => !hasCriteria || !hasReason || !hasDestination,
    [hasCriteria, hasReason, hasDestination]
  );

  const alertCopy = useMemo(
    () => (options ? getValidationAlertCopy(options) : null),
    [options]
  );

  useEffect(() => {
    onSubmittingChange?.(reportMutation.isPending);
  }, [reportMutation.isPending, onSubmittingChange]);

  const handleConfirm = async () => {
    if (!rejectionReason || !effectivePreferredRemedy) return;
    const result = await reportMutation.mutateAsync({
      target: { type: 'test', id: orderTestId },
      reason: rejectionReason,
      notes: rejectionNotes.trim() || undefined,
      preferredRemedy: effectivePreferredRemedy,
    });
    onConfirm(result);
  };

  const handleRetry = () => {
    refetch();
  };

  const subtitle = buildSubtitle(orderTestId, testName, testCode, patientName);
  const copy = {
    title: QUALITY_ISSUE_DIALOG_COPY.reject.title,
    confirmLabel: alertCopy?.confirmLabel ?? QUALITY_ISSUE_DIALOG_COPY.reject.confirmLabel,
  };

  return {
    rejectionReason,
    setRejectionReason,
    rejectionNotes,
    setRejectionNotes,
    preferredRemedy: effectivePreferredRemedy,
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
