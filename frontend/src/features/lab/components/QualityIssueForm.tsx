/**
 * Unified quality issue form — used at collection and validation.
 */
import React, { useState } from 'react';
import { Alert, SpinnerLoader } from '@/components';
import { CatalogRejectionFields } from './CatalogRejectionFields';
import { AttemptProgressBar } from './AttemptProgressBar';
import { useQualityIssueOptions } from '@/features/lab/api/quality-issues.api';
import type { QualityIssueOptions, QualityIssueTargetType } from '@/types/lab-operations';
import { GENERATED_LAB_CONSTANTS } from '@/types/generated/labConstants';
import { REJECTION_DIALOG_COPY } from './rejectionDialogConstants';

type CollectionAlertCopy = {
  variant: 'warning' | 'danger';
  warningTitle: string;
  warningBody: string;
  reasonLabel: string;
  notesLabel: string;
};

function getCollectionAlertCopy(options: QualityIssueOptions): CollectionAlertCopy {
  const hasResultedTests =
    (options.resultedTestsCount ?? 0) > 0 || (options.validatedTestsCount ?? 0) > 0;

  if (hasResultedTests) {
    return { variant: 'danger', ...REJECTION_DIALOG_COPY.collection.escalateResults };
  }
  const atLimit = (options.recollectionAttemptsRemaining ?? 0) === 0;
  return {
    variant: atLimit ? 'danger' : 'warning',
    warningTitle: REJECTION_DIALOG_COPY.collection.recollect.warningTitle,
    warningBody: options.previewMessage || REJECTION_DIALOG_COPY.collection.recollect.warningBody,
    reasonLabel: REJECTION_DIALOG_COPY.collection.recollect.reasonLabel,
    notesLabel: REJECTION_DIALOG_COPY.collection.recollect.notesLabel,
  };
}

export interface QualityIssueFormProps {
  targetType: QualityIssueTargetType;
  targetId: number;
  title: string;
  subtitle?: string;
  error?: string | null;
  isSubmitting?: boolean;
  onReasonChange?: (reason: string) => void;
  onNotesChange?: (notes: string) => void;
  reason: string;
  notes: string;
}

export const QualityIssueForm: React.FC<QualityIssueFormProps> = ({
  targetType,
  targetId,
  title,
  subtitle,
  error,
  isSubmitting,
  onReasonChange,
  onNotesChange,
  reason,
  notes,
}) => {
  const { data: options, isLoading } = useQualityIssueOptions(targetType, targetId);

  const attemptUsed =
    targetType === 'sample'
      ? (options?.recollectionAttemptsUsed ?? 0)
      : (options?.retestAttemptsUsed ?? 0);
  const attemptMax =
    targetType === 'sample'
      ? GENERATED_LAB_CONSTANTS.MAX_RECOLLECTION_ATTEMPTS
      : GENERATED_LAB_CONSTANTS.MAX_RETEST_ATTEMPTS;

  const alertCopy =
    targetType === 'sample' && options ? getCollectionAlertCopy(options) : null;

  return (
    <div className="space-y-3">
      {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}

      {isLoading || isSubmitting ? (
        <div className="flex justify-center py-4">
          <SpinnerLoader size="sm" />
        </div>
      ) : (
        <>
          {error && (
            <Alert variant="danger" className="py-2">
              <p className="text-xs">{error}</p>
            </Alert>
          )}

          {alertCopy && (
            <Alert variant={alertCopy.variant} className="py-2">
              <div className="space-y-0.5">
                <p className="font-normal text-xs">{alertCopy.warningTitle}</p>
                <p className="text-xxs opacity-90 leading-tight">{alertCopy.warningBody}</p>
              </div>
            </Alert>
          )}

          {attemptMax > 0 && (
            <AttemptProgressBar used={attemptUsed} total={attemptMax} label={targetType === 'sample' ? 'Recollection' : 'Re-test'} />
          )}

          <CatalogRejectionFields
            criteria={options?.allowedCriteria ?? []}
            criteriaLoading={isLoading}
            rejectionReason={reason}
            rejectionNotes={notes}
            onReasonChange={onReasonChange ?? (() => {})}
            onNotesChange={onNotesChange ?? (() => {})}
            reasonLabel={alertCopy?.reasonLabel ?? title}
            notesLabel={alertCopy?.notesLabel}
          />
        </>
      )}
    </div>
  );
};

export function useQualityIssueFormState() {
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const reset = () => {
    setReason('');
    setNotes('');
  };
  return { reason, notes, setReason, setNotes, reset };
}
