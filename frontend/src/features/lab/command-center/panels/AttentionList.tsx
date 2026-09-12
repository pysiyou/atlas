/**
 * Top waiting/blocked items — scrollable list when content exceeds panel height.
 */

import React from 'react';
import { AttentionFeed } from '../AttentionFeed';
import { Panel, PanelBody } from '../components';
import type { AttentionItem } from '../boardTypes';

interface AttentionListProps {
  items: AttentionItem[];
  attentionTotal: number;
}

export const AttentionList: React.FC<AttentionListProps> = ({ items, attentionTotal }) => {
  return (
    <Panel
      title="Needs Attention"
      meta={
        items.length > 0
          ? `${items.length} orders · ${attentionTotal} tests`
          : 'Action queue · holds · STAT · TAT'
      }
    >
      <PanelBody>
        <AttentionFeed items={items} />
      </PanelBody>
    </Panel>
  );
};
