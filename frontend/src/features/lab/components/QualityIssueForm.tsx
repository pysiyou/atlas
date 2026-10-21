/**
 * Unified quality issue form — used at collection (sample reject).
 */
import React from 'react';
import { TYPE } from '@/theme/recipes';
import { Alert } from '@/components/display';
import { SpinnerLoader } from '@/components/loaders';
import { CatalogRejectionCriteriaFields } from './CatalogRejectionCriteriaFields';
import { useQualityIssueOptions } from '../api/qualityIssues';
import type { QualityIssueOptions, QualityIssueTargetType, RemedyType } from '@/types/lab-operations';
import { QUALITY_ISSUE_POPOVER_COPY } from '../constants/qualityIssuePopoverCopy';
import { QualityIssueInlineWarning } from './QualityIssueInlineWarning';
import { LAB_COPY } from '../constants/labConstants';
import { QualityIssueRemedyPicker } from './QualityIssueRemedyPicker';
import {
  buildSampleRemedyOptions,
  resolveSuggestedRemedy,
} from '../constants/qualityIssuePopoverCopy';

type CollectionFormCopy = {
  alert: { message: string } | null;
  reasonLabel: string;
  notesLabel: string;
};

function getCollectionFormCopy(options: QualityIssueOptions): CollectionFormCopy {
  const hasResultedOrValidated =
    (options.resultedTestsCount ?? 0) > 0 || (options.validatedTestsCount ?? 0) > 0;
  const recollect = QUALITY_ISSUE_POPOVER_COPY.collection.recollect;
  const escalate = QUALITY_ISSUE_POPOVER_COPY.collection.escalateResults;

  if (hasResultedOrValidated) {
    return {
      alert: {
        message: escalate.warningTitle,
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
  onOptionsLoaded?: (options: QualityIssueOptions | undefined) => void;
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
  onOptionsLoaded,
}) => {
  const { data: options, isLoading } = useQualityIssueOptions(targetType, targetId);

  React.useEffect(() => {
    onOptionsLoaded?.(options);
  }, [options, onOptionsLoaded]);

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
    <div className="space-y-space-3">
      {subtitle && <p className={TYPE.meta}>{subtitle}</p>}

      {isLoading || isSubmitting ? (
        <div className="flex justify-center py-space-4">
          <SpinnerLoader size="sm" />
        </div>
      ) : (
        <>
          {error && (
            <Alert variant="danger" className="py-space-2">
              <p className={TYPE.value}>{error}</p>
            </Alert>
          )}

          {collectionCopy?.alert && (
            <QualityIssueInlineWarning message={collectionCopy.alert.message} />
          )}

          <CatalogRejectionCriteriaFields
            criteria={options?.allowedCriteria ?? []}
            criteriaLoading={isLoading}
            rejectionReason={reason}
            rejectionNotes={notes}
            onReasonChange={onReasonChange ?? (() => {})}
            onNotesChange={onNotesChange ?? (() => {})}
            reasonLabel={
              collectionCopy?.reasonLabel ??
              (targetType === 'test' ? 'Result rejection reason' : LAB_COPY.quality.sampleIssue)
            }
            notesLabel={collectionCopy?.notesLabel}
          />

          {targetType === 'sample' && sampleRemedyOptions.length > 0 && (
            <QualityIssueRemedyPicker
              label={QUALITY_ISSUE_POPOVER_COPY.collection.actions.followUpLabel}
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
