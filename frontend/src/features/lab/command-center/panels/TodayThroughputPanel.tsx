/**
 * Today's throughput — shift context for lab techs.
 */

import React from 'react';
import { Panel, PanelBody, StatLine } from '../components';
import type { TodayThroughput } from '../hooks/useLabTechBoard';

interface TodayThroughputPanelProps {
  throughput: TodayThroughput;
}

export const TodayThroughputPanel: React.FC<TodayThroughputPanelProps> = ({ throughput }) => {
  return (
    <Panel title="Today" meta="Since midnight">
      <PanelBody>
        <div className="flex min-h-0 flex-1 flex-col justify-center gap-2 px-3 py-2">
          <StatLine label="Tests validated" value={String(throughput.validated)} />
          <StatLine label="Samples collected" value={String(throughput.collected)} />
          <StatLine label="Orders completed" value={String(throughput.ordersCompleted)} />
        </div>
      </PanelBody>
    </Panel>
  );
};
