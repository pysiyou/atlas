/**
 * DonutChart - Donut with center total, segment labels, optional detail list.
 * Use valueLabel for units (e.g. "tests", "orders"). Pass getItemIcon for list row icons when needed.
 */

import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartContainer } from './ChartContainer';
import { Icon, type IconName } from '@/shared/ui';

export interface DonutChartSegment {
  name: string;
  value: number;
  color?: string;
  /** Count of items that entered this state today (trend). */
  arrivedToday?: number;
  /** Average wait time in this stage (milliseconds). */
  avgWaitMs?: number;
  /** ISO datetime of the oldest item currently in this stage. */
  oldestEntryAt?: string;
}

/** Format a duration in ms to a compact human string. */
function formatDuration(ms: number): string {
  if (ms < 60_000) return '<1m';
  const totalMin = Math.floor(ms / 60_000);
  if (totalMin < 60) return `${totalMin}m`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h < 24) return m > 0 ? `${h}h ${m}m` : `${h}h`;
  const d = Math.floor(h / 24);
  const rh = h % 24;
  return rh > 0 ? `${d}d ${rh}h` : `${d}d`;
}

/** Format an ISO timestamp as a compact "time ago" string. */
function formatTimeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return 'just now';
  return `${formatDuration(ms)} ago`;
}

export interface DonutChartProps {
  data: DonutChartSegment[];
  title?: string;
  subTitle?: string;
  valueLabel?: string;
  showHeader?: boolean;
  /** When false, only pie + segment labels (no right-hand list). Default true. */
  showListSection?: boolean;
  /** Optional icon per item for list rows. Omit for no icon (colored dot only). */
  getItemIcon?: (item: DonutChartSegment) => IconName | undefined;
  className?: string;
  innerRadius?: number | string;
  outerRadius?: number | string;
}

const TOOLTIP_BG = 'var(--chart-tooltip)';
const TOOLTIP_STROKE = 'var(--chart-tooltip-stroke)';
const TOOLTIP_FG = 'var(--text)';
const TOOLTIP_FG_MUTED = 'var(--text-tertiary)';

const COLORS = [
  'var(--chart-brand)',
  'var(--chart-success)',
  'var(--chart-warning)',
  'var(--chart-danger)',
  'var(--chart-accent)',
];

const CHART_SUCCESS = 'var(--chart-success)';

interface CustomTooltipProps {
  active?: boolean;
  payload?: { name: string; value: number; payload?: { fill?: string } }[];
  valueLabel: string;
}

const CustomTooltip = ({ active, payload, valueLabel }: CustomTooltipProps) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div
      className="px-3 py-2 rounded shadow-lg text-sm min-w-[120px]"
      style={{
        backgroundColor: TOOLTIP_BG,
        border: `1px solid ${TOOLTIP_STROKE}`,
        color: TOOLTIP_FG,
      }}
    >
      <div className="flex items-center gap-2 mb-1">
        <span
          className="block w-2 h-2 rounded-full"
          style={{ backgroundColor: d.payload?.fill ?? 'var(--text)' }}
        />
        <p className="text-xs" style={{ color: TOOLTIP_FG_MUTED }}>
          {d.name}
        </p>
      </div>
      <p className="text-base ml-4">
        {d.value.toLocaleString()}{' '}
        <span className="text-xs text-text-tertiary ml-1">{valueLabel}</span>
      </p>
    </div>
  );
};

interface SegmentWithPercent extends DonutChartSegment {
  percent: number;
}

type PieSegment = Pick<DonutChartSegment, 'name' | 'value'> & { color?: string };

interface ChartSectionProps {
  pieData: PieSegment[];
  total: number;
  segmentLabels: SegmentWithPercent[];
  valueLabel: string;
  subTitle?: string;
  innerRadius: number | string;
  outerRadius: number | string;
  widthPercent?: number;
}

function ChartSection({
  pieData,
  total,
  segmentLabels,
  valueLabel,
  subTitle,
  innerRadius,
  outerRadius,
  widthPercent = 52,
}: ChartSectionProps) {
  return (
    <div className="shrink-0 flex flex-col min-w-0" style={{ width: `${widthPercent}%` }}>
      <div className="flex-1 min-h-0 relative flex items-center">
        <div className="absolute inset-0">
          <ChartContainer className="h-full w-full">
            {({ width, height }) => (
              <ResponsiveContainer width={width} height={height}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="45%"
                    cy="50%"
                    innerRadius={innerRadius}
                    outerRadius={outerRadius}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="transparent"
                    cornerRadius={4}
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        stroke="var(--surface)"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={<CustomTooltip valueLabel={valueLabel} />}
                    cursor={{ fill: 'transparent' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartContainer>
        </div>
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="absolute top-1/2 left-[45%] -translate-x-1/2 -translate-y-1/2 text-center z-10">
            <p className="text-2xl tabular-nums text-text-primary">{total.toLocaleString()}</p>
            <p className="text-xs mt-0.5 text-text-tertiary">Total {valueLabel}:</p>
            {subTitle && (
              <p className="text-xs mt-0.5" style={{ color: CHART_SUCCESS }}>
                {subTitle}
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="shrink-0 px-2 pb-2 grid grid-cols-2 gap-x-4 gap-y-1.5 justify-items-start">
        {segmentLabels.map((item, index) => (
          <div
            key={item.name}
            className="flex items-center gap-1.5 text-text-primary w-full min-w-0 justify-start"
          >
            <span
              className="shrink-0 w-2 h-2 rounded-full"
              style={{ backgroundColor: item.color ?? COLORS[index % COLORS.length] }}
            />
            <span className="text-xs truncate">{item.name}</span>
            <span className="text-xs text-text-tertiary shrink-0">{item.percent}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface DetailListRowProps {
  item: SegmentWithPercent;
  index: number;
  total: number;
  getItemIcon?: (item: DonutChartSegment) => IconName | undefined;
}

function DetailListRow({ item, index, total: _total, getItemIcon }: DetailListRowProps) {
  const color = item.color ?? COLORS[index % COLORS.length];
  const iconName = getItemIcon?.(item);
  const hasArrivals = item.arrivedToday != null && item.arrivedToday > 0;

  return (
    <div className="flex items-center gap-3 py-3 min-w-0 border-b border-border-default last:border-b-0">
      <div
        className="shrink-0 w-9 h-9 rounded-md flex items-center justify-center"
        style={{
          backgroundColor: `color-mix(in srgb, ${color} 24%, transparent)`,
          color,
        }}
      >
        {iconName ? (
          <Icon name={iconName} className="w-5 h-5 [&>svg]:shrink-0" />
        ) : (
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
        )}
      </div>
      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <div className="flex items-center justify-between gap-2 min-w-0">
          <span className="text-sm truncate text-text-primary">{item.name}</span>
          {hasArrivals ? (
            <span
              className="flex items-center gap-0.5 text-xs shrink-0"
              style={{ color: CHART_SUCCESS }}
            >
              +{item.arrivedToday}
              <Icon name="up-trend" className="w-3.5 h-3.5" />
            </span>
          ) : (
            <span className="text-xs shrink-0 text-text-tertiary">&mdash;</span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 text-xs text-text-tertiary tabular-nums min-w-0">
          <span>{item.avgWaitMs != null ? `avg ${formatDuration(item.avgWaitMs)}` : '—'}</span>
          <span className="shrink-0 text-text-tertiary">
            {item.oldestEntryAt ? `oldest ${formatTimeAgo(item.oldestEntryAt)}` : '—'}
          </span>
        </div>
      </div>
    </div>
  );
}

interface DetailListSectionProps {
  listItems: SegmentWithPercent[];
  total: number;
  getItemIcon?: (item: DonutChartSegment) => IconName | undefined;
}

function DetailListSection({ listItems, total, getItemIcon }: DetailListSectionProps) {
  return (
    <div className="flex-1 min-w-0 flex flex-col border-l border-border-default overflow-hidden">
      <div className="shrink-0 flex flex-col py-2 pr-3 pl-3 overflow-y-auto">
        {listItems.length === 0 ? (
          <p className="text-sm py-2 text-text-tertiary">No data</p>
        ) : (
          listItems.map((item, index) => (
            <DetailListRow
              key={item.name}
              item={item}
              index={index}
              total={total}
              getItemIcon={getItemIcon}
            />
          ))
        )}
      </div>
    </div>
  );
}

export const DonutChart: React.FC<DonutChartProps> = ({
  data,
  title = 'Distribution',
  subTitle,
  valueLabel = 'items',
  showHeader = false,
  showListSection = true,
  getItemIcon,
  className = '',
  innerRadius = '55%',
  outerRadius = '85%',
}) => {
  const { pieData, total, listItems } = useMemo(() => {
    const sum = data.reduce((a, b) => a + b.value, 0);
    const withColor = data.map((d, i) => ({ ...d, color: d.color ?? COLORS[i % COLORS.length] }));
    const withPercent = withColor.map(d => ({
      ...d,
      percent: sum > 0 ? Math.round((d.value / sum) * 100) : 0,
    }));
    return { pieData: withColor.filter(d => d.value > 0), total: sum, listItems: withPercent };
  }, [data]);

  return (
    <div
      className={`flex flex-col h-full w-full min-w-0 min-h-0 bg-surface rounded overflow-hidden shadow-sm ${className}`}
    >
      {showHeader && (
        <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="text-lg truncate text-text-primary">{title}</h3>
            <button
              type="button"
              className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm transition-opacity hover:opacity-80 bg-surface-hover text-text-tertiary"
              aria-label="Help"
            >
              ?
            </button>
          </div>
        </div>
      )}
      <div className="flex-1 min-h-[200px] min-w-0 flex flex-row overflow-hidden">
        <ChartSection
          pieData={pieData}
          total={total}
          segmentLabels={listItems}
          valueLabel={valueLabel}
          subTitle={subTitle}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          widthPercent={showListSection ? 52 : 100}
        />
        {showListSection && (
          <DetailListSection listItems={listItems} total={total} getItemIcon={getItemIcon} />
        )}
      </div>
    </div>
  );
};
