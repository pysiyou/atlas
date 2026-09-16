/**
 * Top waiting/blocked items — scrollable list when content exceeds panel height.
 */

import React from 'react';
import { LabAttentionFeed } from '../LabAttentionFeed';
import { Panel } from '@/components/surfaces/Panel';
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
      title="Needs Attention"
      meta={
        items.length > 0
          ? capped
            ? `Top ${items.length} of ${attentionTotal} tests`
            : `${items.length} orders · ${attentionTotal} tests`
          : 'Action queue · holds · STAT · TAT'
      }
      padding="none"
    >
      <LabAttentionFeed items={items} />
    </Panel>
  );
};
