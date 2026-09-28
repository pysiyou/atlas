/**
 * Entity timeline panel — placeholder shell; timeline UI will be rebuilt here.
 */

import React from 'react';
import { Panel } from '@/components/surfaces/Panel';
import { LAB_COPY } from '../constants/labConstants';

export type LabEntityTimelineEntityType = 'order_test' | 'sample';

interface LabEntityTimelinePanelProps {
  entityType: LabEntityTimelineEntityType;
  entityId: number;
}

export const LabEntityTimelinePanel: React.FC<LabEntityTimelinePanelProps> = () => {
  return (
    <Panel
      title={LAB_COPY.timeline.activityTitle}
      meta={LAB_COPY.timeline.activityMeta}
      padding="none"
      className="min-h-32"
    >
      {null}
    </Panel>
  );
};
