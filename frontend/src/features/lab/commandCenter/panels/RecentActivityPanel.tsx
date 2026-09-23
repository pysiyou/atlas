/**
 * Trimmed recent activity for lab techs — placeholder until timeline is rebuilt.
 */

import React from 'react';
import { LabActivityFeed } from '../LabActivityFeed';
import { Panel } from '@/components/surfaces/Panel';
import { LAB_COPY } from '../../constants/labConstants';

export const RecentActivityPanel: React.FC = () => {
  return (
    <Panel
      title={LAB_COPY.timeline.activityTitle}
      meta={LAB_COPY.timeline.activityMeta}
      padding="none"
    >
      <LabActivityFeed />
    </Panel>
  );
};
