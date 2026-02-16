/**
 * DistributionPieChart - Matches Portfolio Overview: donut + center total, segment labels, asset-style list.
 */

import React, { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { ChartContainer } from './ChartContainer';
import { Icon } from '@/shared/ui';
import { ICONS } from '@/utils/icons';

export interface DistributionDataPoint {
  name: string;
  value: number;
  color?: string;
  /** Optional change for trend (e.g. +0.37). When set, shows green/red with arrow. */
  change?: number;
}

interface DistributionPieChartProps {
  data: DistributionDataPoint[];
  title?: string;
  subTitle?: string;
  valueLabel?: string;
  showHeader?: boolean;
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
const CHART_DANGER = 'var(--chart-danger)';

/** Same icons as Laboratory tabs (Sample Collection, Result Entry, Validation, Escalation) */
const STAGE_ICONS: Record<string, (typeof ICONS.dataFields)['flask']> = {
  Sample: ICONS.dataFields.flask,
  Result: ICONS.dataFields.notebook,
  Validation: ICONS.ui.shieldCheck,
  Scalation: ICONS.actions.alertCircle,
};

function getStageIcon(stageName: string): (typeof ICONS.dataFields)['flask'] {
  return STAGE_ICONS[stageName] ?? ICONS.dataFields.flask;
}

interface TooltipPayloadItem {
  name: string;
  value: number;
  payload?: { fill?: string };
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (!active || !payload?.length) return null;
  const data = payload[0];
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
          style={{ backgroundColor: data.payload?.fill ?? 'var(--text)' }}
        />
        <p className="text-xs font-normal" style={{ color: TOOLTIP_FG_MUTED }}>
          {data.name}
        </p>
      </div>
      <p className="font-normal text-base ml-4">
        {data.value.toLocaleString()}
        <span className="text-xs font-normal text-text-tertiary ml-1">tests</span>
      </p>
    </div>
  );
};

interface ListItemWithPercent extends DistributionDataPoint {
  percent: number;
}

/** Minimal shape for pie segments (no percent required). */
type PieSegment = Pick<DistributionDataPoint, 'name' | 'value'> & { color?: string };

interface ChartSectionProps {
  pieData: PieSegment[];
  total: number;
  segmentLabels: ListItemWithPercent[];
  valueLabel: string;
  subTitle?: string;
  innerRadius: number | string;
  outerRadius: number | string;
}

function ChartSection({
  pieData,
  total,
  segmentLabels,
  valueLabel,
  subTitle,
  innerRadius,
  outerRadius,
}: ChartSectionProps) {
  return (
    <div className="shrink-0 flex flex-col min-w-0" style={{ width: '52%' }}>
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
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartContainer>
        </div>
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="absolute top-1/2 left-[45%] -translate-x-1/2 -translate-y-1/2 text-center z-10">
            <p className="text-2xl font-bold tabular-nums text-text-primary">{total.toLocaleString()}</p>
            <p className="text-xs mt-0.5 text-text-tertiary">Total {valueLabel}:</p>
            <p className="text-xs mt-0.5" style={{ color: CHART_SUCCESS }}>{subTitle ?? '—'}</p>
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
            <span className="text-xs font-medium truncate">{item.name}</span>
            <span className="text-xs text-text-tertiary shrink-0">{item.percent}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface AssetListRowProps {
  item: ListItemWithPercent;
  index: number;
  total: number;
}

function AssetListRow({ item, index, total }: AssetListRowProps) {
  const color = item.color ?? COLORS[index % COLORS.length];
  return (
    <div className="flex items-center gap-3 py-3 min-w-0 border-b border-border-default last:border-b-0">
      <div
        className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center"
        style={{
          backgroundColor: `color-mix(in srgb, ${color} 24%, transparent)`,
          color,
        }}
      >
        <Icon name={getStageIcon(item.name)} className="w-5 h-5 [&>svg]:shrink-0" />
      </div>
      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold truncate text-text-primary">{item.name}</span>
          {item.change != null ? (
            <span
              className="flex items-center gap-0.5 text-xs font-medium shrink-0"
              style={{ color: item.change >= 0 ? CHART_SUCCESS : CHART_DANGER }}
            >
              {item.change >= 0 ? '+' : ''}
              {item.change.toFixed(2)}
              <Icon name={item.change >= 0 ? 'up-trend' : 'down-trend'} className="w-3.5 h-3.5" />
            </span>
          ) : (
            <span className="text-xs shrink-0 text-text-tertiary">—</span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-text-tertiary tabular-nums">
          <span>{item.value.toLocaleString()}</span>
          <span>{total.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}

interface AssetListSectionProps {
  listItems: ListItemWithPercent[];
  total: number;
}

function AssetListSection({ listItems, total }: AssetListSectionProps) {
  return (
    <div className="flex-1 min-w-0 flex flex-col border-l border-border-default overflow-hidden">
      <div className="shrink-0 flex flex-col py-2 pr-3 pl-3 overflow-y-auto">
        {listItems.length === 0 ? (
          <p className="text-sm py-2 text-text-tertiary">No data</p>
        ) : (
          listItems.map((item, index) => (
            <AssetListRow key={item.name} item={item} index={index} total={total} />
          ))
        )}
      </div>
    </div>
  );
}

export const DistributionPieChart: React.FC<DistributionPieChartProps> = ({
  data,
  title = 'Distribution',
  subTitle,
  valueLabel = 'tests',
  showHeader = false,
  className = '',
  innerRadius = '55%',
  outerRadius = '85%',
}) => {
  const { pieData, total, listItems, segmentLabels } = useMemo(() => {
    const sum = data.reduce((a, b) => a + b.value, 0);
    const withColor = data.map((d, i) => ({
      ...d,
      color: d.color ?? COLORS[i % COLORS.length],
    }));
    const pieDataFiltered = withColor.filter((d) => d.value > 0);
    const listItems = withColor.map((d) => ({
      ...d,
      percent: sum > 0 ? Math.round((d.value / sum) * 100) : 0,
    }));
    const segmentLabels = withColor.map((d) => ({
      ...d,
      percent: sum > 0 ? Math.round((d.value / sum) * 100) : 0,
    }));
    return {
      pieData: pieDataFiltered,
      total: sum,
      listItems,
      segmentLabels,
    };
  }, [data]);

  return (
    <div
      className={`flex flex-col h-full w-full min-w-0 min-h-0 bg-surface rounded overflow-hidden shadow-sm ${className}`}
    >
      {showHeader && (
        <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="text-lg font-bold truncate text-text-primary">{title}</h3>
            <button
              type="button"
              className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium transition-opacity hover:opacity-80 bg-surface-hover text-text-tertiary"
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
          segmentLabels={segmentLabels}
          valueLabel={valueLabel}
          subTitle={subTitle}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
        />
        <AssetListSection listItems={listItems} total={total} />
      </div>
    </div>
  );
};
