/**
 * ActivitiesTimeline - Lab operations activity timeline matching the design.
 * Shows recent lab operations grouped by date with Badge components for entities.
 */
import React, { useMemo } from 'react';
import { ActivitiesTimelineSkeleton } from './ActivitiesTimelineSkeleton';
import { formatRelativeDateLabel } from '@/utils';
import type { LabOperationRecord } from '@/types/lab-operations';
import { buildActivityItem, type ActivityItemResult } from '../formatters/activityFormatters';
import { ActivitiesTimelineError } from './ActivitiesTimelineError';
import { ActivitiesTimelineEmpty } from './ActivitiesTimelineEmpty';
import { ActivityTimelineGroup } from './ActivityTimelineGroup';

export interface ActivitiesTimelineProps {
  logs: LabOperationRecord[];
  isLoading?: boolean;
  isError?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  hasMore?: boolean;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
  className?: string;
}

interface GroupedActivities {
  label: string;
  items: ActivityItemResult[];
}

function groupByDate(items: ActivityItemResult[]): GroupedActivities[] {
  const groups = new Map<string, ActivityItemResult[]>();

  for (const item of items) {
    const label = formatRelativeDateLabel(item.timestamp);
    const existing = groups.get(label) || [];
    existing.push(item);
    groups.set(label, existing);
  }

  return Array.from(groups.entries()).map(([label, groupItems]) => ({
    label,
    items: groupItems.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()),
  }));
}

export const ActivitiesTimeline: React.FC<ActivitiesTimelineProps> = ({
  logs,
  isLoading = false,
  isError = false,
  error = null,
  onRetry,
  hasMore = false,
  onLoadMore,
  isLoadingMore = false,
  className = '',
}) => {
  const groupedActivities = useMemo(() => {
    const activities = logs.map(buildActivityItem);
    return groupByDate(activities);
  }, [logs]);

  if (isError) {
    return <ActivitiesTimelineError className={className} error={error} onRetry={onRetry} />;
  }

  if (isLoading) {
    return <ActivitiesTimelineSkeleton className={className} />;
  }

  if (groupedActivities.length === 0) {
    return <ActivitiesTimelineEmpty className={className} />;
  }

  return (
    <div className={`flex flex-col h-full bg-surface ${className}`}>
      <div className="flex-1 overflow-auto scroll-smooth">
        {groupedActivities.map(group => (
          <ActivityTimelineGroup key={group.label} label={group.label} items={group.items} />
        ))}
        {hasMore && onLoadMore && (
          <div className="px-4 py-3 flex justify-center border-t border-stroke/80">
            <button
              type="button"
              onClick={onLoadMore}
              disabled={isLoadingMore}
              className="text-sm font-medium text-brand hover:underline disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-brand rounded px-2 py-1"
            >
              {isLoadingMore ? 'Loading…' : 'Load more'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
