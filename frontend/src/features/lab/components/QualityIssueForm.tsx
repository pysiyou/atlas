/**
 * Unified quality issue form — used at collection (sample reject).
 */
import React from 'react';
import { Alert, SpinnerLoader } from '@/components';
import { CatalogRejectionFields } from './CatalogRejectionFields';
import { useQualityIssueOptions } from '../api/quality-issues.api';
import type { QualityIssueOptions, QualityIssueTargetType, RemedyType } from '@/types/lab-operations';
import { QUALITY_ISSUE_DIALOG_COPY } from './qualityIssueDialogConstants';
import { RemedyDestinationPicker } from './RemedyDestinationPicker';
import {
  buildSampleRemedyOptions,
  resolveSuggestedRemedy,
} from './remedyDestinationUtils';

type CollectionAlertCopy = {
  variant: 'warning' | 'danger';
  warningTitle: string;
  warningBody: string;
  reasonLabel: string;
  notesLabel: string;
};

function getCollectionAlertCopy(options: QualityIssueOptions): CollectionAlertCopy {
  const hasResultedOrValidated =
    (options.resultedTestsCount ?? 0) > 0 || (options.validatedTestsCount ?? 0) > 0;

  if (hasResultedOrValidated) {
    return {
      variant: 'warning',
      ...QUALITY_ISSUE_DIALOG_COPY.collection.escalateResults,
      warningBody:
        options.previewMessage || QUALITY_ISSUE_DIALOG_COPY.collection.escalateResults.warningBody,
    };
  }
  return {
    variant: 'warning',
    warningTitle: QUALITY_ISSUE_DIALOG_COPY.collection.recollect.warningTitle,
    warningBody:
      options.previewMessage || QUALITY_ISSUE_DIALOG_COPY.collection.recollect.warningBody,
    reasonLabel: QUALITY_ISSUE_DIALOG_COPY.collection.recollect.reasonLabel,
    notesLabel: QUALITY_ISSUE_DIALOG_COPY.collection.recollect.notesLabel,
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
  preferredRemedy?: RemedyType | '';
  onPreferredRemedyChange?: (remedy: RemedyType) => void;
  reason: string;
  notes: string;
}

export const QualityIssueForm: React.FC<QualityIssueFormProps> = ({
  targetType,
  targetId,
  title: _title,
  subtitle,
  error,
  isSubmitting,
  onReasonChange,
  onNotesChange,
  preferredRemedy = '',
  onPreferredRemedyChange,
  reason,
  notes,
}) => {
  const { data: options, isLoading } = useQualityIssueOptions(targetType, targetId);

  const alertCopy = targetType === 'sample' && options ? getCollectionAlertCopy(options) : null;

  const sampleRemedyOptions = React.useMemo(
    () => (targetType === 'sample' ? buildSampleRemedyOptions(options?.allowedRemedies) : []),
    [targetType, options?.allowedRemedies]
  );

  const suggestedRemedy = React.useMemo(
    () =>
      resolveSuggestedRemedy(
        options?.suggestedRemedy ?? options?.previewRemedy,
        sampleRemedyOptions
      ),
    [options?.previewRemedy, options?.suggestedRemedy, sampleRemedyOptions]
  );

  const effectivePreferredRemedy = preferredRemedy || suggestedRemedy;

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

          <CatalogRejectionFields
            criteria={options?.allowedCriteria ?? []}
            criteriaLoading={isLoading}
            rejectionReason={reason}
            rejectionNotes={notes}
            onReasonChange={onReasonChange ?? (() => {})}
            onNotesChange={onNotesChange ?? (() => {})}
            reasonLabel={
              alertCopy?.reasonLabel ??
              (targetType === 'test' ? 'Result rejection reason' : 'Specimen issue')
            }
            notesLabel={alertCopy?.notesLabel}
          />

          {targetType === 'sample' && sampleRemedyOptions.length > 0 && (
            <RemedyDestinationPicker
              label={QUALITY_ISSUE_DIALOG_COPY.collection.actions.followUpLabel}
              options={sampleRemedyOptions}
              value={effectivePreferredRemedy}
              onChange={remedy => onPreferredRemedyChange?.(remedy)}
            />
          )}
        </>
      )}
    </div>
  );
};
