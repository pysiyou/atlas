/**
 * Top waiting/blocked items — scrollable list when content exceeds panel height.
 */

import React from 'react';
import { LabAttentionFeed } from '../LabAttentionFeed';
import { Panel } from '@/components/surfaces/Panel';
import { LAB_COPY } from '../../constants/labConstants';
import type { LabAttentionQueueItem } from '../commandCenterModel';

interface LabAttentionQueueProps {
  items: LabAttentionQueueItem[];
  attentionTotal: number;
}

export const LabAttentionQueue: React.FC<LabAttentionQueueProps> = ({ items, attentionTotal }) => {
  const shownTests = items.reduce((sum, item) => sum + item.workItemCount, 0);
  const capped = attentionTotal > shownTests;

  return (
    <Panel
      title={LAB_COPY.attention.panelTitle}
      meta={
        items.length > 0
          ? capped
            ? `Prioritized view · ${shownTests} of ${attentionTotal} tests`
            : `${items.length} accessions · ${attentionTotal} tests`
          : LAB_COPY.attention.panelMetaEmpty
      }
      padding="none"
    >
      <LabAttentionFeed items={items} />
    </Panel>
  );
};
