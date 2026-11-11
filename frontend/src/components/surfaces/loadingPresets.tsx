/**
 * Dialog/popover form loading chrome (not a list/panel body skeleton).
 */

import { Skeleton } from '@/components/feedback';
import { DialogFooter, DialogHeader } from '@/components/overlays';
import { cn } from '@/utils';
import { feedbackTitle } from '@/feedback';
import { RADIUS } from '@/theme/recipes';

const QUALITY_ISSUE_POPOVER_WIDTH_CLASS = 'w-90 md:w-96';

/** Popover form chrome (quality issue, etc.). */
export function popoverFormLoadingContent() {
  return (
    <div className="space-y-space-4">
      <div className="space-y-space-1-5">
        <Skeleton height={14} width="100%" />
        <Skeleton height={12} width="85%" />
      </div>
      <div className="space-y-space-2">
        <Skeleton height={12} width="30%" />
        <Skeleton height={52} width="100%" className={RADIUS.field} />
      </div>
      <div>
        <Skeleton height={12} width="35%" className={`${RADIUS.field} mb-space-1`} />
        <Skeleton height={60} width="100%" className={RADIUS.field} />
      </div>
    </div>
  );
}

/** Mirrors QualityIssuePopover chrome while options load. */
export function QualityIssuePopoverLoadingView() {
  return (
    <div
      className={cn(
        QUALITY_ISSUE_POPOVER_WIDTH_CLASS,
        'flex max-h-[600px] min-w-0 flex-col overflow-hidden',
      )}
      aria-busy="true"
      aria-label={feedbackTitle('lab.qualityIssue.dialog.loading')}
    >
      <DialogHeader
        size="popover"
        title={<Skeleton height={20} width="60%" className={RADIUS.surface} />}
        subtitle={<Skeleton height={12} width="40%" className={RADIUS.surface} />}
        actions={<Skeleton width={32} height={32} className={`${RADIUS.surface} shrink-0`} />}
      />
      <div className="p-panel space-y-space-4 overflow-y-auto flex-1">{popoverFormLoadingContent()}</div>
      <DialogFooter
        density="popover"
        start={<Skeleton height={12} width="50%" className={RADIUS.surface} />}
        end={
          <>
            <Skeleton height={32} width={70} className={RADIUS.surface} />
            <Skeleton height={32} width={70} className={RADIUS.surface} />
          </>
        }
      />
    </div>
  );
}
