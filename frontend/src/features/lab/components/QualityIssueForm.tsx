import React from 'react';
/**
 * Unified quality issue form — used at collection (sample reject).
 */
import { text } from '@/theme/recipes';
import { Alert } from '@/components/display';

import { SpinnerLoader } from '@/components/feedback';
import { CatalogRejectionCriteriaFields } from './CatalogRejectionCriteriaFields';
import { useQualityIssueOptions } from '../api/qualityIssues';
import type { QualityIssueOptions } from '@/types';
import type { QualityIssueTargetType, RemedyType } from '@/types';
import {
  QUALITY_ISSUE_POPOVER_COPY,
  QUALITY_ISSUE_POPOVER_LAYOUT,
} from '../constants/qualityIssuePopoverCopy';
import { QualityIssueInlineWarning } from './QualityIssueInlineWarning';
import { useLabCopy } from '@/strings';
import { QualityIssueRemedyPicker } from './QualityIssueRemedyPicker';
import {
  buildSampleRemedyOptions,
  resolveSuggestedRemedy,
} from '../constants/qualityIssuePopoverCopy';
import { INSUFFICIENT_VOLUME_REJECTION } from '../utils/labSample';

type CollectionFormCopy = {
  alert: { message: string } | null;
  reasonLabel: string;
  notesLabel: string;
};

function getCollectionFormCopy(options: QualityIssueOptions): CollectionFormCopy {
  const hasResultedOrValidated =
    (options.resultedTestsCount ?? 0) > 0 || (options.validatedTestsCount ?? 0) > 0;
  const collection = QUALITY_ISSUE_POPOVER_COPY.collection;

  if (hasResultedOrValidated) {
    return {
      alert: {
        message: collection.resultedWarning,
      },
      reasonLabel: collection.reasonLabel,
      notesLabel: collection.notesLabel,
    };
  }

  return {
    alert: null,
    reasonLabel: collection.reasonLabel,
    notesLabel: collection.notesLabel,
  };
}

export interface QualityIssueFormProps {
  targetType: QualityIssueTargetType;
  targetId: string;
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
  /** Consolidated tube draw reference for volume-related rejection reasons. */
  volumeReferenceLine?: string | null;
}

type QualityIssueFormContentProps = Omit<
  QualityIssueFormProps,
  'targetId' | 'title' | 'onOptionsLoaded'
> & {
  options: QualityIssueOptions | undefined;
  isLoading: boolean;
  labCopy: ReturnType<typeof useLabCopy>;
};

function QualityIssueFormLoaded({
  targetType,
  error,
  onReasonChange,
  onNotesChange,
  preferredRemedy = '',
  onPreferredRemedyChange,
  reason,
  notes,
  options,
  isLoading,
  labCopy,
  volumeReferenceLine,
}: Omit<QualityIssueFormContentProps, 'subtitle' | 'isSubmitting'>) {
  const collectionCopy =
    targetType === 'sample' && options ? getCollectionFormCopy(options) : null;

  const sampleRemedyOptions = React.useMemo(
    () => (targetType === 'sample' ? buildSampleRemedyOptions(options?.allowedRemedies) : []),
    [targetType, options?.allowedRemedies]
  );

  const suggestedRemedy = React.useMemo(
    () => resolveSuggestedRemedy(options?.suggestedRemedy, sampleRemedyOptions),
    [options?.suggestedRemedy, sampleRemedyOptions]
  );

  const effectivePreferredRemedy = preferredRemedy || suggestedRemedy;
  const reasonLabel =
    collectionCopy?.reasonLabel ??
    (targetType === 'test'
      ? QUALITY_ISSUE_POPOVER_COPY.reject.reasonLabel
      : labCopy.quality.sampleIssue);
  const onReason = onReasonChange ?? (() => {});
  const onNotes = onNotesChange ?? (() => {});

  return (
    <>
      {error ? (
        <Alert variant="danger" className="py-space-2">
          <p className={text({ role: 'body' })}>{error}</p>
        </Alert>
      ) : null}

      {collectionCopy?.alert ? (
        <QualityIssueInlineWarning message={collectionCopy.alert.message} />
      ) : null}

      {targetType === 'sample' && volumeReferenceLine && reason === INSUFFICIENT_VOLUME_REJECTION ? (
        <p className={text({ role: 'body', intent: 'muted' })}>
          Required draw: {volumeReferenceLine}
        </p>
      ) : null}

      <CatalogRejectionCriteriaFields
        criteria={options?.allowedCriteria ?? []}
        criteriaLoading={isLoading}
        rejectionReason={reason}
        rejectionNotes={notes}
        onReasonChange={onReason}
        onNotesChange={onNotes}
        reasonLabel={reasonLabel}
        showNotes={false}
      />

      {targetType === 'sample' && sampleRemedyOptions.length > 0 ? (
        <QualityIssueRemedyPicker
          label={QUALITY_ISSUE_POPOVER_COPY.collection.followUpLabel}
          options={sampleRemedyOptions}
          value={effectivePreferredRemedy}
          onChange={remedy => onPreferredRemedyChange?.(remedy)}
        />
      ) : null}

      <CatalogRejectionCriteriaFields
        criteria={options?.allowedCriteria ?? []}
        rejectionReason={reason}
        rejectionNotes={notes}
        onReasonChange={onReason}
        onNotesChange={onNotes}
        notesLabel={collectionCopy?.notesLabel ?? QUALITY_ISSUE_POPOVER_COPY.reject.notesLabel}
        notesRows={QUALITY_ISSUE_POPOVER_LAYOUT.reasonTextareaRows}
        showReason={false}
      />
    </>
  );
}

function QualityIssueFormContent(props: QualityIssueFormContentProps) {
  const { subtitle, isLoading, isSubmitting } = props;

  return (
    <div className="space-y-space-3">
      {subtitle ? <p className={text({ role: 'body', intent: 'muted' })}>{subtitle}</p> : null}

      {isLoading || isSubmitting ? (
        <div className="flex justify-center py-space-4">
          <SpinnerLoader size="sm" />
        </div>
      ) : (
        <QualityIssueFormLoaded {...props} />
      )}
    </div>
  );
}

export function QualityIssueForm({
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
  volumeReferenceLine,
}: QualityIssueFormProps) {
  const labCopy = useLabCopy();
  const { data: options, isLoading } = useQualityIssueOptions(targetType, targetId);

  React.useEffect(() => {
    onOptionsLoaded?.(options);
  }, [options, onOptionsLoaded]);

  return (
    <QualityIssueFormContent
      targetType={targetType}
      subtitle={subtitle}
      error={error}
      isSubmitting={isSubmitting}
      onReasonChange={onReasonChange}
      onNotesChange={onNotesChange}
      preferredRemedy={preferredRemedy}
      onPreferredRemedyChange={onPreferredRemedyChange}
      reason={reason}
      notes={notes}
      options={options}
      isLoading={isLoading}
      labCopy={labCopy}
      volumeReferenceLine={volumeReferenceLine}
    />
  );
}
