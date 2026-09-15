/**
 * Top waiting/blocked items — scrollable list when content exceeds panel height.
 */

import React from 'react';
import { AttentionFeed } from '../AttentionFeed';
import { Panel } from '@/components/surfaces/Panel';
import type { AttentionItem } from '../boardTypes';

interface AttentionListProps {
  items: AttentionItem[];
  attentionTotal: number;
}

export const AttentionList: React.FC<AttentionListProps> = ({ items, attentionTotal }) => {
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
      <AttentionFeed items={items} />
    </Panel>
  );
};
