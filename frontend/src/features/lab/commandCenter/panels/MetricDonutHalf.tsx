/**
 * Shared half-panel layout — section title, donut + legend, summary footer.
 */

import { EmptyState, EMPTY_COPY, PANEL_EMPTY_STATE } from '@/components';
import { SectionTitle, DonutChart, LegendRow, type DonutSegment } from '../LabCommandCenterUi';
import { COMMAND_CENTER_SECTION } from '../commandCenterStyles';

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
  const total = legend[0]?.total ?? 0;
  const isEmpty = total <= 0;

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col justify-between gap-space-2 px-space-3 py-space-2">
      <SectionTitle title={title} />

      {isEmpty ? (
        <EmptyState
          iconOnly
          icon={PANEL_EMPTY_STATE.icon}
          variant={PANEL_EMPTY_STATE.variant}
          fill={PANEL_EMPTY_STATE.fill}
          title={EMPTY_COPY.activeTests.title}
          description={EMPTY_COPY.activeTests.description}
        />
      ) : (
        <>
          <div className="flex min-h-0 flex-1 items-center gap-space-2-5">
            <DonutChart
              size={METRIC_DONUT_CHART_SIZE}
              centerSize="md"
              segments={segments}
              centerLabel={centerLabel}
              centerDetail={centerDetail}
              ariaLabel={`${title}: ${centerLabel} ${centerDetail}. ${legend
                .map(item => `${item.label} ${item.value}`)
                .join(', ')}`}
            />
            <div className="min-w-0 flex-1 space-y-space-1">
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
        </>
      )}
    </div>
  );
}

function share(value: number, total: number): string {
  if (total <= 0) return '0%';
  return `${Math.round((value / total) * 100)}%`;
}
