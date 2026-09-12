/**
 * Shared half-panel layout — section title, donut + legend, summary footer.
 */

import { ColumnHeader, DonutChart, LegendRow } from '../components';
import { COMMAND_CENTER_SECTION } from '../components/styles';
import type { DonutSegment } from '../components/DonutChart';

export const METRIC_DONUT_CHART_SIZE = 80;

export interface MetricDonutLegendItem {
  colorClass: string;
  label: string;
  value: number;
  total: number;
}

export function MetricDonutHalf({
  title,
  summary,
  centerLabel,
  centerDetail,
  segments,
  legend,
}: {
  title: string;
  summary: string;
  centerLabel: string;
  centerDetail: string;
  segments: DonutSegment[];
  legend: MetricDonutLegendItem[];
}) {
  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col justify-between gap-2 px-3 py-2">
      <ColumnHeader title={title} />

      <div className="flex min-h-0 flex-1 items-center gap-2.5">
        <DonutChart
          size={METRIC_DONUT_CHART_SIZE}
          centerSize="md"
          segments={segments}
          centerLabel={centerLabel}
          centerDetail={centerDetail}
        />
        <div className="min-w-0 flex-1 space-y-1">
          {legend.map(item => (
            <LegendRow
              key={item.label}
              size="md"
              colorClass={item.colorClass}
              label={item.label}
              value={String(item.value)}
              detail={share(item.value, item.total)}
            />
          ))}
        </div>
      </div>

      <p className={COMMAND_CENTER_SECTION.summary}>{summary}</p>
    </div>
  );
}

function share(value: number, total: number): string {
  if (total <= 0) return '0%';
  return `${Math.round((value / total) * 100)}%`;
}
