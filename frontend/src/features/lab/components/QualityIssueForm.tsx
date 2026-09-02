/**
 * Unified quality issue form — used at collection and validation.
 */
import React, { useState } from 'react';
import { Alert, SpinnerLoader } from '@/components';
import { CatalogRejectionFields } from './CatalogRejectionFields';
import { AttemptProgressBar } from './AttemptProgressBar';
import { useQualityIssueOptions } from '@/features/lab/api/quality-issues.api';
import type { QualityIssueTargetType } from '@/types/lab-operations';
import { GENERATED_LAB_CONSTANTS } from '@/types/generated/labConstants';

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

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium">{title}</p>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>

      {isLoading || isSubmitting ? (
        <div className="flex justify-center py-4">
          <SpinnerLoader size="sm" />
        </div>
      ) : (
        <>
          {options?.previewMessage && (
            <Alert variant={options.willEscalate ? 'danger' : 'warning'} className="py-2">
              <p className="text-xs">{options.previewMessage}</p>
            </Alert>
          )}

          {attemptMax > 0 && (
            <AttemptProgressBar used={attemptUsed} total={attemptMax} label={targetType === 'sample' ? 'Recollection' : 'Re-test'} />
          )}

          {error && (
            <Alert variant="danger" className="py-2">
              <p className="text-xs">{error}</p>
            </Alert>
          )}

          <CatalogRejectionFields
            criteria={options?.allowedCriteria ?? []}
            criteriaLoading={isLoading}
            rejectionReason={reason}
            rejectionNotes={notes}
            onReasonChange={onReasonChange ?? (() => {})}
            onNotesChange={onNotesChange ?? (() => {})}
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
