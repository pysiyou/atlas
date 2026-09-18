/**
 * QualityIssuePopover view subcomponents: Loading, Error, and Action Cards.
 * Extracted to keep QualityIssuePopover.tsx focused on orchestration.
 */

import React from 'react';
import { Alert, Button, Skeleton, DialogHeader, DialogFooter } from '@/components';
import { RadioCard } from './LabWorkflowPopoverChrome';
import { AttemptProgressBar } from './LabAttemptIndicators';
import type { ResultRejectionType } from '@/types';
import { cn } from '@/utils';
import { getFeedback } from '@/utils/feedback';
import { QUALITY_ISSUE_POPOVER_LAYOUT, QUALITY_ISSUE_POPOVER_COPY } from '../constants/qualityIssuePopoverCopy';
import { LAB_CONFIG } from '@/features/lab/constants';
import { FORM_FIELD_LABEL } from '@/components/inputs/inputStyles';
import { TYPE, RADIUS } from '@/components/theme/recipes';


/** Skeleton that mirrors LabWorkflowPopoverChrome layout (header, body, footer) to avoid layout shift when options load. */
export const QualityIssuePopoverLoadingView: React.FC = () => (
  <div
    className={cn(
      QUALITY_ISSUE_POPOVER_LAYOUT.widthClass,
      'flex max-h-[600px] min-w-0 flex-col overflow-hidden',
    )}
    aria-busy="true"
    aria-label={QUALITY_ISSUE_POPOVER_COPY.loading.message}
  >
    <DialogHeader
      size="popover"
      title={<Skeleton height={20} width="60%" className={`${RADIUS.card}`} />}
      subtitle={<Skeleton height={12} width="40%" className={`${RADIUS.card}`} />}
      actions={<Skeleton width={32} height={32} className={`${RADIUS.card} shrink-0`} />}
    />
    <div className="p-panel space-y-space-4 overflow-y-auto flex-1">
      <div className="space-y-space-1-5">
        <Skeleton height={14} width="100%" className={`${RADIUS.card}`} />
        <Skeleton height={12} width="85%" className={`${RADIUS.card}`} />
      </div>
      <div className="space-y-space-2">
        <Skeleton height={12} width="30%" className={`${RADIUS.card}`} />
        <Skeleton height={52} width="100%" className={`${RADIUS.card}`} />
      </div>
      <div>
        <Skeleton height={12} width="35%" className={`${RADIUS.card} mb-space-1`} />
        <Skeleton height={60} width="100%" className={`${RADIUS.card}`} />
      </div>
    </div>
    <DialogFooter
      density="popover"
      start={<Skeleton height={12} width="50%" className={`${RADIUS.card}`} />}
      end={
        <>
          <Skeleton height={32} width={70} className={`${RADIUS.card}`} />
          <Skeleton height={32} width={70} className={`${RADIUS.card}`} />
        </>
      }
    />
  </div>
);

export interface QualityIssuePopoverErrorViewProps {
  error: string;
  onRetry: () => void;
  onCancel: () => void;
}

export const QualityIssuePopoverErrorView: React.FC<QualityIssuePopoverErrorViewProps> = ({
  error,
  onRetry,
  onCancel,
}) => (
  <div
    className={cn(QUALITY_ISSUE_POPOVER_LAYOUT.widthClass, 'flex flex-col gap-layout-section p-panel min-w-0')}
  >
    <Alert variant="danger" className="py-space-2">
      <p className="font-normal text-xs">{getFeedback('lab.qualityIssue.options.loadFailed').title}</p>
      <p className="text-xxs mt-space-1">{error}</p>
    </Alert>
    <div className="flex justify-end gap-space-2">
      <Button variant="cancel" size="sm" layout="text" onClick={onCancel}>
        {QUALITY_ISSUE_POPOVER_COPY.error.cancel}
      </Button>
      <Button variant="retry" size="sm" onClick={onRetry}>
        {QUALITY_ISSUE_POPOVER_COPY.error.retry}
      </Button>
    </div>
  </div>
);

export interface RejectionActionCardsProps {
  selectedType: ResultRejectionType;
  onSelect: (type: ResultRejectionType) => void;
  isRetestEnabled: boolean;
  retestDisabledReason: string | null;
  retestAttemptsRemaining: number;
}

export const RejectionActionCards: React.FC<RejectionActionCardsProps> = ({
  selectedType,
  onSelect,
  isRetestEnabled,
  retestDisabledReason,
  retestAttemptsRemaining,
}) => {
  const retestTotal = LAB_CONFIG.MAX_RETEST_ATTEMPTS;
  const retestUsed = retestTotal - retestAttemptsRemaining;

  return (
    <div>
      <label className={`${FORM_FIELD_LABEL} mb-space-1`}>
        {QUALITY_ISSUE_POPOVER_COPY.actions.followUpLabel}
      </label>
      <div className="grid grid-cols-1 gap-space-2">
        <RadioCard
          name="rejection-type"
          selected={selectedType === 're-test'}
          onClick={() => isRetestEnabled && onSelect('re-test')}
          label={QUALITY_ISSUE_POPOVER_COPY.actions.retestLabel}
          description={
            <div className="space-y-space-2">
              <p className={TYPE.caption}>
                {QUALITY_ISSUE_POPOVER_COPY.actions.retestDescription}
              </p>
              {retestAttemptsRemaining > 0 && (
                <AttemptProgressBar
                  used={retestUsed}
                  total={retestTotal}
                  label="Attempts"
                  variant="sky"
                />
              )}
            </div>
          }
          variant="sky"
          disabled={!isRetestEnabled}
          disabledReason={retestDisabledReason || undefined}
        />
      </div>
    </div>
  );
};
