/**
 * QualityIssuePopover loading and error views.
 */

import { actionButtonPreset, Button } from '@/components/primitives';
import { QualityIssuePopoverLoadingView as QualityIssuePopoverLoadingViewPreset } from '@/components/surfaces';
import { cn } from '@/utils';
import { getFeedback } from '@/feedback';
import { QUALITY_ISSUE_POPOVER_LAYOUT, QUALITY_ISSUE_POPOVER_COPY } from '../constants/qualityIssuePopoverCopy';
import { text } from '@/theme/recipes';

export function QualityIssuePopoverLoadingView() {
  return <QualityIssuePopoverLoadingViewPreset />;
}

export interface QualityIssuePopoverErrorViewProps {
  onRetry: () => void;
  onCancel: () => void;
}

export function QualityIssuePopoverErrorView({
  onRetry,
  onCancel,
}: QualityIssuePopoverErrorViewProps) {
  return (
    <div
      className={cn(QUALITY_ISSUE_POPOVER_LAYOUT.widthClass, 'flex flex-col gap-layout-section p-panel min-w-0')}
    >
      <p className={text({ role: 'body' })}>{getFeedback('lab.qualityIssue.options.loadFailed').title}</p>
      <p className={text({ role: 'caption', intent: 'muted' })}>
        Check the notification for details, or try again.
      </p>
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
}
