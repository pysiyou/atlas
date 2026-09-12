/**
 * Trimmed recent activity for lab techs — fixed 24h workflow events only.
 */

import React from 'react';
import { ActivityFeed } from '../ActivityFeed';
import { Panel, PanelBody } from '../components';
import { useRecentActivityFeed } from '../useRecentActivityFeed';

export const RecentActivityPanel: React.FC = () => {
  const { events, isLoading, isError, refetchFeed } = useRecentActivityFeed();

  return (
    <Panel title="Recent Activity" meta="Last 24 hours · workflow & order events">
      <PanelBody className="overflow-y-auto px-4 py-2">
        <ActivityFeed
          events={events}
          isLoading={isLoading}
          isError={isError}
          onRetry={refetchFeed}
        />
      </PanelBody>
    </Panel>
  );
};
