/**
 * QualityIssuePopover view subcomponents: Loading, Error, and Action Cards.
 * Extracted to keep QualityIssuePopover.tsx focused on orchestration.
 */

import React from 'react';
import { actionButtonPreset, Button } from '@/components/primitives';
import { Alert } from '@/components/display';
import { QualityIssuePopoverLoadingView as QualityIssuePopoverLoadingViewPreset } from '@/components/surfaces';
import { RadioCard } from '@/components/overlays';
import { AttemptProgressBar } from './LabAttemptIndicators';
import type { ResultRejectionType } from '@/types';
import { cn } from '@/utils';
import { getFeedback } from '@/utils/feedback';
import { QUALITY_ISSUE_POPOVER_LAYOUT, QUALITY_ISSUE_POPOVER_COPY } from '../constants/qualityIssuePopoverCopy';
import { LAB_CONFIG } from '../constants';
import { text, FORM_FIELD_LABEL } from '@/theme/recipes';
/** Re-export preset so feature imports stay stable. */
export const QualityIssuePopoverLoadingView: React.FC = () => (
  <QualityIssuePopoverLoadingViewPreset />
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
      <p className={text({ role: 'body' })}>{getFeedback('lab.qualityIssue.options.loadFailed').title}</p>
      <p className={`${text({ role: 'caption' })} mt-space-1`}>{error}</p>
    </Alert>
    <div className="flex justify-end gap-space-2">
      <Button {...actionButtonPreset('cancel')} size="sm" layout="text" onClick={onCancel}>
        {QUALITY_ISSUE_POPOVER_COPY.error.cancel}
      </Button>
      <Button {...actionButtonPreset('retry')} size="sm" onClick={onRetry}>
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
              <p className={text({ role: 'caption' })}>
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
