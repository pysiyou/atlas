/**
 * Activity feed panel — wrapper for the scrollable lab audit trail.
 */

import React from 'react';
import { ActivityFeed } from './ActivityFeed';
import { Panel, PanelBody } from './components';
import { useActivityFeedQuery } from './useActivityFeedQuery';
import {
  useCommandCenterDashboardContext,
  usePanelTimeRangeHeader,
} from './useCommandCenterDashboard';

export const ActivityFeedPanel: React.FC = () => {
  const { hoursBack } = useCommandCenterDashboardContext();
  const { meta, headerActions } = usePanelTimeRangeHeader();
  const {
    events,
    isLoading,
    isError,
    refetchFeed,
    hasMore,
    loadMore,
    isLoadingMore,
  } = useActivityFeedQuery(hoursBack, 50);

  return (
    <Panel title="Lab Activity" meta={meta} headerActions={headerActions}>
      <PanelBody>
        <ActivityFeed
          events={events}
          isLoading={isLoading}
          isError={isError}
          onRetry={refetchFeed}
          hasMore={hasMore}
          onLoadMore={loadMore}
          isLoadingMore={isLoadingMore}
        />
      </PanelBody>
    </Panel>
  );
};
