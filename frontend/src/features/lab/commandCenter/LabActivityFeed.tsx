/**
 * Activity feed — loading/error shell around the shared LabAuditTimeline for command center.
 */

import React from 'react';
import { Skeleton } from '@/components/loaders/Skeleton';
import type { TimelineEvent } from '../api/labCommandCenter';
import { EMPTY_COPY } from '@/components';
import { Timeline, TIMELINE_STYLES } from '@/features/timeline';

export interface LabActivityFeedProps {
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
    <div className="space-y-space-3 px-space-3 py-space-1" aria-busy="true">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex gap-space-2">
          <Skeleton circle width={8} height={8} className="mt-space-1-5 shrink-0" />
          <div className="flex-1 space-y-space-1 pb-space-3">
            <Skeleton height={12} width="55%" />
            <Skeleton height={12} width="90%" />
            <Skeleton height={10} width="40%" />
          </div>
        </div>
      ))}
    </div>
  );
}

export const LabActivityFeed: React.FC<LabActivityFeedProps> = ({
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
      <div className="text-xs text-text-secondary">
        Couldn&apos;t load activity feed.{' '}
        {onRetry && (
          <button type="button" onClick={onRetry} className={TIMELINE_STYLES.retryLink}>
            Retry
          </button>
        )}
      </div>
    );
  }

  if (isLoading) return <FeedSkeleton />;

  const loadMoreFooter =
    hasMore && onLoadMore ? (
      <div className={TIMELINE_STYLES.loadMore}>
        <button
          type="button"
          onClick={onLoadMore}
          disabled={isLoadingMore}
          className={TIMELINE_STYLES.retryLinkDisabled}
        >
          {isLoadingMore ? 'Loading…' : 'Load more'}
        </button>
      </div>
    ) : null;

  return (
    <Timeline
      preset="commandCenter"
      events={events}
      interactiveEntities
      emptyMessage={EMPTY_COPY.recentActivity.title}
      emptyDescription={EMPTY_COPY.recentActivity.description}
      className="h-full px-space-3 py-space-1"
      footer={loadMoreFooter}
    />
  );
};
