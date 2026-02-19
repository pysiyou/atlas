/**
 * ActivitiesTimeline - Lab operations activity timeline matching the design.
 * Shows recent lab operations grouped by date with Badge components for entities.
 */
import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/primitives/Badge';
import { ActivitiesTimelineSkeleton } from './ActivitiesTimelineSkeleton';
import { formatRelativeDateLabel, formatRelativeDateTime } from '@/utils';
import type { LabOperationRecord } from '@/types/lab-operations';
import { buildActivityItem, type ActivityItemResult } from './activityFormatters';

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

  return Array.from(groups.entries()).map(([label, items]) => ({
    label,
    items: items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()),
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
    return (
      <div className={`flex flex-col h-full bg-surface ${className}`}>
        <div className="flex-1 flex flex-col items-center justify-center gap-3 px-4 py-8">
          <p className="text-sm text-text-secondary text-center">Couldn&apos;t load activities</p>
          {error?.message && (
            <p className="text-xxs text-text-tertiary text-center max-w-[200px]">{error.message}</p>
          )}
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="text-sm font-medium text-brand hover:underline focus:outline-none focus:ring-2 focus:ring-brand rounded px-2 py-1"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <ActivitiesTimelineSkeleton className={className} />;
  }

  if (groupedActivities.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center h-full bg-surface ${className}`}>
        <div className="w-10 h-10 rounded-full bg-surface-hover flex items-center justify-center mb-3">
          <span className="text-text-disabled text-lg" aria-hidden>
            ◇
          </span>
        </div>
        <p className="text-sm text-text-secondary font-medium">No recent activity</p>
        <p className="text-xxs text-text-tertiary mt-0.5">Activity will appear here</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full bg-surface ${className}`}>
      <div className="flex-1 overflow-auto scroll-smooth">
        {groupedActivities.map(group => (
          <section key={group.label} className="px-4 pb-6 first:pt-1">
            <div className="flex items-center gap-3 py-3 sticky top-0 z-1 bg-surface/95 backdrop-blur-[2px]">
              <div className="flex-1 h-px bg-stroke/80 min-w-0" />
              <span className="text-xxs font-medium text-text-tertiary uppercase tracking-widest shrink-0">
                {group.label}
              </span>
              <div className="flex-1 h-px bg-stroke/80 min-w-0" />
            </div>
            <div className="relative">
              {/* Vertical line centered under the dot column (10px wide, center at 5px) */}
              <div
                className="absolute top-4 bottom-4 w-px bg-gradient-to-b from-stroke via-stroke/60 to-stroke pointer-events-none"
                aria-hidden
                style={{ left: '5px', transform: 'translateX(-50%)' }}
              />
              <ul className="space-y-0 list-none">
                {group.items.map(item => (
                  <li key={item.id} className="flex items-start gap-3 relative">
                    <div className="w-[10px] flex justify-center shrink-0 z-10 pt-[7px]">
                      <div
                        className="w-2 h-2 rounded-full border-2 border-surface bg-brand shrink-0 ring-2 ring-surface"
                        aria-hidden
                      />
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5 pb-4">
                      <div className="space-y-1">
                        {item.lines.map((line, lineIdx) => (
                          <p
                            key={lineIdx}
                            className={`text-sm leading-[1.45] flex flex-wrap items-baseline gap-x-1.5 gap-y-1 ${lineIdx === 0 ? 'text-text-primary' : 'text-text-secondary'}`}
                          >
                            {line.map((segment, idx) =>
                              segment.type === 'name' ? (
                                <span key={idx} className="font-medium text-brand">
                                  {segment.value}
                                </span>
                              ) : segment.type === 'badge' ? (
                                segment.link ? (
                                  <Link
                                    key={idx}
                                    to={segment.link}
                                    className="inline-flex hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-brand rounded"
                                  >
                                    <Badge
                                      variant={segment.variant}
                                      size="xs"
                                      className={segment.isId ? 'font-mono' : undefined}
                                    >
                                      {segment.value}
                                    </Badge>
                                  </Link>
                                ) : (
                                  <Badge
                                    key={idx}
                                    variant={segment.variant}
                                    size="xs"
                                    className={segment.isId ? 'font-mono' : undefined}
                                  >
                                    {segment.value}
                                  </Badge>
                                )
                              ) : (
                                <span key={idx}>{segment.value}</span>
                              )
                            )}
                          </p>
                        ))}
                      </div>
                      <p className="text-xxs font-normal text-text-tertiary mt-1.5 tabular-nums">
                        <time dateTime={item.timestamp.toISOString()}>
                          {formatRelativeDateTime(item.timestamp)}
                        </time>
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>
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
