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

type CollectionFormCopy = {
  alert: { title: string; description: string } | null;
  reasonLabel: string;
  notesLabel: string;
};

function getCollectionFormCopy(options: QualityIssueOptions): CollectionFormCopy {
  const hasResultedOrValidated =
    (options.resultedTestsCount ?? 0) > 0 || (options.validatedTestsCount ?? 0) > 0;
  const recollect = QUALITY_ISSUE_DIALOG_COPY.collection.recollect;
  const escalate = QUALITY_ISSUE_DIALOG_COPY.collection.escalateResults;

  if (hasResultedOrValidated) {
    return {
      alert: {
        title: escalate.warningTitle,
        description: options.previewMessage || escalate.warningBody,
      },
      reasonLabel: escalate.reasonLabel,
      notesLabel: escalate.notesLabel,
    };
  }

  return {
    alert: null,
    reasonLabel: recollect.reasonLabel,
    notesLabel: recollect.notesLabel,
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

  const collectionCopy =
    targetType === 'sample' && options ? getCollectionFormCopy(options) : null;

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

          {collectionCopy?.alert && (
            <Alert
              variant="warning"
              title={collectionCopy.alert.title}
              description={collectionCopy.alert.description}
              className="py-3"
            />
          )}

          <CatalogRejectionFields
            criteria={options?.allowedCriteria ?? []}
            criteriaLoading={isLoading}
            rejectionReason={reason}
            rejectionNotes={notes}
            onReasonChange={onReasonChange ?? (() => {})}
            onNotesChange={onNotesChange ?? (() => {})}
            reasonLabel={
              collectionCopy?.reasonLabel ??
              (targetType === 'test' ? 'Result rejection reason' : 'Specimen issue')
            }
            notesLabel={collectionCopy?.notesLabel}
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
