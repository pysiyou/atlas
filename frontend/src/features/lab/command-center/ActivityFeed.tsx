/**
 * Activity feed — loading/error shell around the shared LabTimeline for command center.
 */

import React from 'react';
import { Skeleton } from '@/components/loaders/Skeleton';
import type { TimelineEvent } from '@/features/lab/api/commandCenter.api';
import { LabTimeline } from '@/features/lab/components/LabTimeline';
import { COMMAND_CENTER_TIMELINE } from '@/features/lab/timeline/timelineStyles';

export interface ActivityFeedProps {
  events: TimelineEvent[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  hasMore?: boolean;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
}

function FeedSkeleton() {
  return (
    <div className="space-y-3 py-1" aria-busy="true">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex gap-3">
          <Skeleton circle width={10} height={10} className="mt-1 shrink-0" />
          <div className="flex-1 space-y-1">
            <Skeleton height={14} width="70%" />
            <Skeleton height={12} width="85%" />
          </div>
        </div>
      ))}
    </div>
  );
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  events,
  isLoading = false,
  isError = false,
  onRetry,
  hasMore = false,
  onLoadMore,
  isLoadingMore = false,
}) => {
  if (isError) {
    return (
      <div className="text-sm text-text-secondary">
        Couldn&apos;t load activity feed.{' '}
        {onRetry && (
          <button type="button" onClick={onRetry} className={COMMAND_CENTER_TIMELINE.retryLink}>
            Retry
          </button>
        )}
      </div>
    );
  }

  if (isLoading) return <FeedSkeleton />;

  const loadMoreFooter =
    hasMore && onLoadMore ? (
      <div className={COMMAND_CENTER_TIMELINE.loadMore}>
        <button
          type="button"
          onClick={onLoadMore}
          disabled={isLoadingMore}
          className={COMMAND_CENTER_TIMELINE.retryLinkDisabled}
        >
          {isLoadingMore ? 'Loading…' : 'Load more'}
        </button>
      </div>
    ) : null;

  return (
    <LabTimeline
      events={events}
      variant="commandCenter"
      interactiveEntities
      emptyMessage="No recent activity"
      className="h-full"
      footer={loadMoreFooter}
    />
  );
};
