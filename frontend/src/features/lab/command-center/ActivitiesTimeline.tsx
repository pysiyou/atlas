/**
 * ActivitiesTimeline - Recent lab operations grouped by date.
 */

import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/primitives/Badge';
import { Skeleton } from '@/components/loaders/Skeleton';
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

function TimelineSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`flex flex-col h-full bg-surface ${className}`} aria-busy="true">
      <div className="flex-1 overflow-auto px-4 py-2 space-y-4">
        {Array.from({ length: 2 }).map((_, g) => (
          <div key={g} className="space-y-3">
            <Skeleton height={10} width={48} className="mx-auto" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton circle width={8} height={8} className="mt-1" />
                <div className="flex-1 space-y-1">
                  <Skeleton height={14} width="85%" />
                  <Skeleton height={10} width="50%" />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function TimelineError({
  className = '',
  error = null,
  onRetry,
}: {
  className?: string;
  error?: Error | null;
  onRetry?: () => void;
}) {
  return (
    <div className={`flex flex-col h-full bg-surface items-center justify-center gap-2 px-4 ${className}`}>
      <p className="text-sm text-text-secondary">Couldn&apos;t load activities</p>
      {error?.message && <p className="text-xxs text-text-tertiary text-center">{error.message}</p>}
      {onRetry && (
        <button type="button" onClick={onRetry} className="text-sm text-brand hover:underline">
          Retry
        </button>
      )}
    </div>
  );
}

function TimelineEmpty({ className = '' }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center justify-center h-full bg-surface ${className}`}>
      <p className="text-sm text-text-secondary">No recent activity</p>
    </div>
  );
}

function TimelineGroup({ label, items }: { label: string; items: ActivityItemResult[] }) {
  return (
    <section className="px-4 pb-4 first:pt-1">
      <div className="flex items-center gap-2 py-2 sticky top-0 z-1 bg-surface/95">
        <div className="flex-1 h-px bg-stroke/80" />
        <span className="text-xxs font-medium text-text-tertiary uppercase tracking-widest">{label}</span>
        <div className="flex-1 h-px bg-stroke/80" />
      </div>
      <ul className="space-y-0 list-none relative">
        <div
          className="absolute top-2 bottom-2 w-px bg-stroke/60 pointer-events-none"
          style={{ left: 4 }}
          aria-hidden
        />
        {items.map(item => (
          <li key={item.id} className="flex items-start gap-2.5 relative pl-0.5">
            <div
              className={`w-2 h-2 rounded-full border-2 border-surface shrink-0 mt-1.5 z-10 ${
                item.emphasis === 'critical'
                  ? 'bg-danger-fg'
                  : item.emphasis === 'warning'
                    ? 'bg-warning-fg'
                    : 'bg-brand'
              }`}
            />
            <div className="flex-1 min-w-0 pb-3">
              {item.lines.map((line, lineIdx) => (
                <p
                  key={lineIdx}
                  className={`text-sm leading-snug flex flex-wrap items-baseline gap-x-1 gap-y-0.5 ${
                    lineIdx === 0 ? 'text-text-primary' : 'text-text-secondary'
                  }`}
                >
                  {line.map((segment, idx) =>
                    segment.type === 'name' ? (
                      <span key={idx} className="font-medium text-brand">{segment.value}</span>
                    ) : segment.type === 'badge' ? (
                      segment.link ? (
                        <Link key={idx} to={segment.link} className="inline-flex">
                          <Badge variant={segment.variant} size="xs" className={segment.isId ? 'font-id' : undefined}>
                            {segment.value}
                          </Badge>
                        </Link>
                      ) : (
                        <Badge key={idx} variant={segment.variant} size="xs" className={segment.isId ? 'font-id' : undefined}>
                          {segment.value}
                        </Badge>
                      )
                    ) : (
                      <span key={idx}>{segment.value}</span>
                    )
                  )}
                </p>
              ))}
              <time className="text-xxs text-text-tertiary tabular-nums" dateTime={item.timestamp.toISOString()}>
                {formatRelativeDateTime(item.timestamp)}
              </time>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
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
  const grouped = useMemo(() => {
    const groups = new Map<string, ActivityItemResult[]>();
    for (const log of logs) {
      const item = buildActivityItem(log);
      const label = formatRelativeDateLabel(item.timestamp);
      const list = groups.get(label) ?? [];
      list.push(item);
      groups.set(label, list);
    }
    return Array.from(groups.entries()).map(([label, items]) => ({
      label,
      items: items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()),
    }));
  }, [logs]);

  if (isError) return <TimelineError className={className} error={error} onRetry={onRetry} />;
  if (isLoading) return <TimelineSkeleton className={className} />;
  if (grouped.length === 0) return <TimelineEmpty className={className} />;

  return (
    <div className={`flex flex-col h-full bg-surface ${className}`}>
      <div className="flex-1 overflow-auto min-h-0">
        {grouped.map(group => (
          <TimelineGroup key={group.label} label={group.label} items={group.items} />
        ))}
        {hasMore && onLoadMore && (
          <div className="px-4 py-2 flex justify-center border-t border-stroke/80">
            <button
              type="button"
              onClick={onLoadMore}
              disabled={isLoadingMore}
              className="text-sm text-brand hover:underline disabled:opacity-60"
            >
              {isLoadingMore ? 'Loading…' : 'Load more'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
