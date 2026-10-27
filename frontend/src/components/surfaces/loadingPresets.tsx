/**
 * Reusable loading bodies for Panel/Card — feature components import these as `loadingContent`.
 */

import type { ReportPreviewResultsLayout } from '@/features/reports/types';
import { Skeleton } from '@/components/feedback';
import { DialogFooter, DialogHeader } from '@/components/overlays';
import { cn } from '@/utils';
import { QUALITY_ISSUE_POPOVER_LAYOUT, QUALITY_ISSUE_POPOVER_COPY } from '@/features/lab/constants/qualityIssuePopoverCopy';
import { RADIUS, SPACING } from '@/theme/recipes';

const REPORT_TABLE_ROWS = 4;

export function reportPreviewPanelLoadingContent(layout: ReportPreviewResultsLayout = 'table') {
  return (
    <div className="space-y-space-2-5">
      {layout === 'table' ? (
        <div className="space-y-0 border border-border-default rounded-md overflow-hidden">
          <div className="flex gap-space-3 px-space-3 py-space-2 border-b border-border-default bg-surface-hover/30">
            <Skeleton height={12} width="28%" />
            <Skeleton height={12} width="22%" />
            <Skeleton height={12} width="34%" />
          </div>
          {Array.from({ length: REPORT_TABLE_ROWS }).map((_, rowIndex) => (
            <div
              key={rowIndex}
              className="flex gap-space-3 px-space-3 py-space-2-5 border-b border-border-default last:border-b-0"
            >
              <Skeleton height={14} width="30%" />
              <Skeleton height={14} width="18%" />
              <Skeleton height={14} width="42%" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="space-y-space-1">
              <Skeleton height={10} width="70%" />
              <Skeleton height={14} width="55%" />
            </div>
          ))}
        </div>
      )}
      <Skeleton height={12} width="40%" />
    </div>
  );
}

export function criticalValuesPanelLoadingContent() {
  return (
    <div className={`${RADIUS.surface} p-panel space-y-space-3 border border-border-default`}>
      <div className="flex items-center justify-between gap-space-2">
        <div className="flex items-center gap-space-2 flex-1 min-w-0">
          <Skeleton className="h-4 w-4 shrink-0" />
          <Skeleton height={14} width="48%" />
        </div>
        <Skeleton height={14} width={72} />
      </div>
      <div className="flex gap-space-2">
        <Skeleton height={32} width={96} className={RADIUS.field} />
        <Skeleton height={32} width={88} className={RADIUS.field} />
      </div>
    </div>
  );
}

export function labPipelineCardLoadingContent() {
  return (
    <>
      <div className="flex items-center justify-between mb-space-4">
        <Skeleton height={16} width={120} />
        <Skeleton height={14} width={108} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-space-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className={`flex items-center justify-between p-space-3 ${RADIUS.field} border border-border-default`}
          >
            <div className="flex items-center gap-space-2 min-w-0 flex-1">
              <Skeleton className="h-4 w-4 shrink-0" />
              <Skeleton height={14} width="72%" />
            </div>
            <Skeleton className="h-5 w-8 shrink-0" />
          </div>
        ))}
      </div>
    </>
  );
}

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

export function eventLogFeedLoadingContent(rows = 4) {
  return (
    <div className={`flex flex-col gap-space-3 p-space-4 ${SPACING.stackRelaxed}`}>
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} height={56} className="w-full" />
      ))}
    </div>
  );
}

/** Mirrors QualityIssuePopover chrome while options load. */
export function QualityIssuePopoverLoadingView() {
  return (
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
