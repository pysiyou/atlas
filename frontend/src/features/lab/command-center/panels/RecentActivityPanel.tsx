/**
 * Trimmed recent activity for lab techs — fixed 24h workflow events only.
 */

import React from 'react';
import { ActivityFeed } from '../ActivityFeed';
import { Panel } from '../components';
import { useRecentActivityFeed } from '../useRecentActivityFeed';

export const RecentActivityPanel: React.FC = () => {
  const { events, isLoading, isLoadingMore, isError, refetchFeed, hasMore, loadMore } =
    useRecentActivityFeed();

  return (
    <Panel title="Recent Activity" meta="Last 24 hours · workflow & order events" padding="none">
      <ActivityFeed
        events={events}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetchFeed}
        hasMore={hasMore}
        onLoadMore={loadMore}
        isLoadingMore={isLoadingMore}
      />
    </Panel>
  );
};
