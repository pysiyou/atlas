/**
 * useQualityIssuePopover — quality issue popover state for result validation.
 */
import { useState, useMemo, useEffect } from 'react';
import type { QualityIssueResult, RemedyType } from '@/types/lab-operations';
import { useQualityIssueOptions } from '../api/qualityIssues.api';
import { resultAPI } from '../api/results.api';
import {
  QUALITY_ISSUE_POPOVER_COPY,
  getValidationFormCopy,
} from '../components/qualityIssuePopoverCopy';
import { displayId } from '@/utils';
import { errorAlertMessage, inlineFeedbackMessage } from '@/utils/feedback';
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

export interface UseQualityIssuePopoverParams {
  orderTestId: number;
  testName?: string;
  testCode?: string;
  patientName?: string;
  onConfirm: (result: QualityIssueResult) => void;
  onCancel: () => void;
  onSubmittingChange?: (submitting: boolean) => void;
}

export function useQualityIssuePopover({
  orderTestId,
  testName,
  testCode,
  patientName,
  onConfirm,
  onCancel: _onCancel,
  onSubmittingChange,
}: UseQualityIssuePopoverParams) {
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [preferredRemedy, setPreferredRemedy] = useState<RemedyType | ''>('');

  const { data: options, isLoading, error: fetchError, refetch } = useQualityIssueOptions(
    'test',
    orderTestId
  );
  const [isRejecting, setIsRejecting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

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

  const formCopy = useMemo(
    () => (options ? getValidationFormCopy(options) : null),
    [options]
  );

  useEffect(() => {
    onSubmittingChange?.(isRejecting);
  }, [isRejecting, onSubmittingChange]);

  const handleConfirm = async () => {
    if (!rejectionReason || !effectivePreferredRemedy) return;
    setIsRejecting(true);
    setSubmitError(null);
    try {
      const result = await resultAPI.rejectResults({
        orderTestId,
        data: {
          rejectionReason,
          validationNotes: rejectionNotes.trim() || undefined,
          preferredRemedy: effectivePreferredRemedy,
        },
      });
      onConfirm(result);
    } catch (err) {
      setSubmitError(inlineFeedbackMessage('lab.qualityIssue.reject.error', err));
      throw err;
    } finally {
      setIsRejecting(false);
    }
  };

  const handleRetry = () => {
    refetch();
  };

  const subtitle = buildSubtitle(orderTestId, testName, testCode, patientName);
  const copy = {
    title: QUALITY_ISSUE_POPOVER_COPY.reject.title,
    confirmLabel: formCopy?.confirmLabel ?? QUALITY_ISSUE_POPOVER_COPY.reject.confirmLabel,
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
    isRejecting,
    error: submitError ?? (fetchError ? errorAlertMessage('lab.qualityIssue.options.loadFailed', fetchError) : null),
    options,
    formCopy,
    handleConfirm,
    handleRetry,
    subtitle,
    copy,
  };
}
