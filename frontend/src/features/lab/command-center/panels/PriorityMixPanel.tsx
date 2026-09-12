/**
 * Priority mix — urgency composition of the active pipeline.
 */

import React from 'react';
import { Panel, PanelBody } from '../components';
import type { DonutSegment } from '../components/DonutChart';
import type { PriorityMix } from '../hooks/useLabTechBoard';
import { MetricDonutHalf, type MetricDonutLegendItem } from './MetricDonutHalf';

interface PriorityMixPanelProps {
  priorityMix: PriorityMix;
  totalActive: number;
}

const PRIORITY_COLORS = {
  urgent: 'fill-danger-fg-emphasis',
  high: 'fill-warning-fg-emphasis',
  medium: 'fill-brand',
  low: 'fill-chart-axis',
} as const;

const PRIORITY_ROWS = [
  { key: 'urgent' as const, label: 'STAT / urgent' },
  { key: 'high' as const, label: 'High' },
  { key: 'medium' as const, label: 'Medium' },
  { key: 'low' as const, label: 'Low' },
] as const;

export const PriorityMixPanel: React.FC<PriorityMixPanelProps> = ({
  priorityMix,
  totalActive,
}) => {
  const segments: DonutSegment[] = PRIORITY_ROWS.map(row => ({
    value: priorityMix[row.key],
    colorClass: PRIORITY_COLORS[row.key],
  }));

  const elevated = priorityMix.urgent + priorityMix.high;
  const elevatedPct = totalActive > 0 ? Math.round((elevated / totalActive) * 100) : 0;

  const legend: MetricDonutLegendItem[] = PRIORITY_ROWS.map(row => ({
    colorClass: PRIORITY_COLORS[row.key],
    label: row.label,
    value: priorityMix[row.key],
    total: totalActive,
  }));

  const summary =
    totalActive === 0
      ? 'No active tests in pipeline.'
      : elevated > 0
        ? `${priorityMix.urgent > 0 ? `${priorityMix.urgent} STAT` : ''}${
            priorityMix.urgent > 0 && priorityMix.high > 0 ? ' · ' : ''
          }${priorityMix.high > 0 ? `${priorityMix.high} high` : ''} — see Needs Attention for order details`
        : 'No STAT or high-priority tests in the pipeline right now.';

  return (
    <Panel
      title="Priority Mix"
      meta={
        elevated > 0
          ? `${elevated} elevated · ${elevatedPct}% of pipeline`
          : 'Active pipeline · all routine'
      }
    >
      <PanelBody>
        <MetricDonutHalf
          title="By Priority"
          summary={summary}
          centerLabel={String(elevated)}
          centerDetail="elevated"
          segments={segments}
          legend={legend}
        />
      </PanelBody>
    </Panel>
  );
};
