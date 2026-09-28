/**
 * Command center activity panel — placeholder shell; timeline UI will be rebuilt here.
 */

import React from 'react';
import { Panel } from '@/components/surfaces/Panel';
import { LAB_COPY } from '../../constants/labConstants';

export const RecentActivityPanel: React.FC = () => {
  return (
    <Panel
      title={LAB_COPY.timeline.activityTitle}
      meta={LAB_COPY.timeline.activityMeta}
      padding="none"
      className="min-h-0 h-full"
    >
      {null}
    </Panel>
  );
};
