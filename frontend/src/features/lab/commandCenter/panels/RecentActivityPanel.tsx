/**
 * Trimmed recent activity for lab techs — fixed 24h workflow events only.
 */

import React from 'react';
import { LabActivityFeed } from '../LabActivityFeed';
import { Panel } from '@/components/surfaces/Panel';
import { LAB_COPY } from '../../constants/labConstants';
import { useRecentLabActivityFeed } from '../useLabActivityFeed';

export const RecentActivityPanel: React.FC = () => {
  const { events, isLoading, isLoadingMore, isError, refetchFeed, hasMore, loadMore } =
    useRecentLabActivityFeed();

  return (
    <Panel
      title={LAB_COPY.timeline.activityTitle}
      meta={LAB_COPY.timeline.activityMeta}
      padding="none"
    >
      <LabActivityFeed
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
