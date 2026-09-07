/**
 * PipelineChart - Donut distribution with per-stage detail list for Command Center.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Icon, type IconName } from '@/components';
import { Skeleton } from '@/components/loaders/Skeleton';
import { ICONS } from '@/config/icons';
import { formatRelativeDateLabel } from '@/utils/date';
import {
  CHART_SUCCESS,
  DISTRIBUTION_SHORT_LABELS,
  formatDuration,
  type DistributionByStagePoint,
} from './pipeline';

const COLORS = [
  'var(--chart-brand)',
  'var(--chart-success)',
  'var(--chart-warning)',
  'var(--chart-danger)',
  'var(--chart-accent)',
];

const STAGE_ICONS: Record<string, IconName> = {
  Collection: ICONS.dataFields.clock,
  Results: ICONS.dataFields.flask,
  Validation: ICONS.dataFields.notebook,
  Escalation: ICONS.ui.shieldCheck,
};

interface SegmentWithPercent extends DistributionByStagePoint {
  percent: number;
}

interface ChartSize {
  width: number;
  height: number;
}

function ChartContainer({
  className = '',
  children,
}: {
  className?: string;
  children: (size: ChartSize) => React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<ChartSize>({ width: 0, height: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setSize(prev => (prev.width === width && prev.height === height ? prev : { width, height }));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const ready = size.width > 0 && size.height > 0;
  return <div ref={ref} className={className}>{ready ? children(size) : null}</div>;
}

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { name: string; value: number; payload?: { fill?: string } }[];
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  const label = DISTRIBUTION_SHORT_LABELS[d.name] ?? d.name;
  return (
    <div
      className="px-3 py-2 rounded shadow-lg text-sm min-w-[120px] border"
      style={{
        backgroundColor: 'var(--chart-tooltip)',
        borderColor: 'var(--chart-tooltip-stroke)',
        color: 'var(--text)',
      }}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.payload?.fill }} />
        <p className="text-xs text-text-tertiary">{label}</p>
      </div>
      <p className="text-base ml-4 tabular-nums">
        {d.value.toLocaleString()} <span className="text-xs text-text-tertiary">tests</span>
      </p>
    </div>
  );
}

function DetailRow({ item, index }: { item: SegmentWithPercent; index: number }) {
  const color = item.color ?? COLORS[index % COLORS.length];
  const icon = STAGE_ICONS[item.name];
  const hasArrivals = item.arrivedToday > 0;

  return (
    <div className="flex items-center gap-3 py-2.5 min-w-0 border-b border-border-default last:border-b-0">
      <div
        className="shrink-0 w-8 h-8 rounded-md flex items-center justify-center"
        style={{
          backgroundColor: `color-mix(in srgb, ${color} 24%, transparent)`,
          color,
        }}
      >
        {icon ? (
          <Icon name={icon} className="w-4 h-4 [&>svg]:shrink-0" />
        ) : (
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
        )}
      </div>
      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <div className="flex items-center justify-between gap-2 min-w-0">
          <span className="text-sm truncate text-text-primary">
            {DISTRIBUTION_SHORT_LABELS[item.name] ?? item.name}
          </span>
          <span className="text-sm font-medium tabular-nums text-text-primary shrink-0">
            {item.value}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 text-xs text-text-tertiary tabular-nums">
          <span>{item.avgWaitMs != null ? `Avg ${formatDuration(item.avgWaitMs)}` : '—'}</span>
          {hasArrivals ? (
            <span className="flex items-center gap-0.5 shrink-0" style={{ color: CHART_SUCCESS }}>
              +{item.arrivedToday}
              <Icon name="up-trend" className="w-3.5 h-3.5" />
            </span>
          ) : (
            <span className="shrink-0">
              {item.oldestEntryAt ? formatRelativeDateLabel(item.oldestEntryAt) : '—'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function PipelineChartSkeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`flex flex-col h-full w-full min-w-0 min-h-0 bg-surface rounded overflow-hidden shadow-sm ${className}`}
      aria-busy="true"
      aria-label="Loading chart"
    >
      <div className="px-4 pt-3 pb-1 shrink-0">
        <Skeleton height={14} width={96} />
      </div>
      <div className="flex-1 min-h-[200px] min-w-0 flex flex-row overflow-hidden">
        <div className="shrink-0 flex flex-col min-w-0" style={{ width: '52%' }}>
          <div className="flex-1 min-h-0 flex items-center justify-center">
            <div className="relative">
              <Skeleton circle width={120} height={120} className="opacity-90" />
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-surface"
                style={{ width: '44%', height: '44%', minWidth: 40, minHeight: 40 }}
                aria-hidden
              />
            </div>
          </div>
          <div className="shrink-0 px-2 pb-2 grid grid-cols-2 gap-x-3 gap-y-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <Skeleton circle width={8} height={8} />
                <Skeleton height={12} width={64} />
              </div>
            ))}
          </div>
        </div>
        <div className="flex-1 min-w-0 border-l border-border-default p-3 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton width={32} height={32} className="rounded-md shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton height={14} width="70%" />
                <Skeleton height={12} width="90%" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export interface PipelineChartProps {
  data: DistributionByStagePoint[];
  title?: string;
  onStageClick?: (stageName: string) => void;
  className?: string;
}

export const PipelineChart: React.FC<PipelineChartProps> = ({
  data,
  title = 'Lab pipeline',
  onStageClick,
  className = '',
}) => {
  const { pieData, total, listItems } = useMemo(() => {
    const sum = data.reduce((a, b) => a + b.value, 0);
    const withColor = data.map((d, i) => ({ ...d, color: d.color ?? COLORS[i % COLORS.length] }));
    const withPercent: SegmentWithPercent[] = withColor.map(d => ({
      ...d,
      percent: sum > 0 ? Math.round((d.value / sum) * 100) : 0,
    }));
    return { pieData: withColor.filter(d => d.value > 0), total: sum, listItems: withPercent };
  }, [data]);

  return (
    <div
      className={`flex flex-col h-full w-full min-w-0 min-h-0 bg-surface rounded overflow-hidden shadow-sm ${className}`}
    >
      <div className="flex items-center justify-between px-4 pt-3 pb-1 shrink-0">
        <h3 className="text-sm text-text-primary">{title}</h3>
        <span className="text-xs text-text-tertiary tabular-nums">
          <span className="font-medium text-text-primary">{total}</span> active
        </span>
      </div>

      <div className="flex-1 min-h-[200px] min-w-0 flex flex-row overflow-hidden">
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
                        innerRadius="55%"
                        outerRadius="85%"
                        paddingAngle={2}
                        dataKey="value"
                        stroke="transparent"
                        cornerRadius={4}
                      >
                        {pieData.map(entry => (
                          <Cell
                            key={entry.name}
                            fill={entry.color}
                            stroke="var(--surface)"
                            strokeWidth={2}
                            className={onStageClick ? 'cursor-pointer' : undefined}
                            onClick={() => onStageClick?.(entry.name)}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<ChartTooltip />} cursor={{ fill: 'transparent' }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </ChartContainer>
            </div>
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="absolute top-1/2 left-[45%] -translate-x-1/2 -translate-y-1/2 text-center z-10">
                <p className="text-2xl tabular-nums text-text-primary">{total.toLocaleString()}</p>
                <p className="text-xs mt-0.5 text-text-tertiary">active tests</p>
              </div>
            </div>
          </div>
          <div className="shrink-0 px-2 pb-2 grid grid-cols-2 gap-x-3 gap-y-1">
            {listItems.map((item, index) => (
              <button
                key={item.name}
                type="button"
                onClick={() => onStageClick?.(item.name)}
                className="flex items-center gap-1.5 text-text-primary w-full min-w-0 text-left hover:opacity-80 transition-opacity"
              >
                <span
                  className="shrink-0 w-2 h-2 rounded-full"
                  style={{ backgroundColor: item.color ?? COLORS[index % COLORS.length] }}
                />
                <span className="text-xs truncate">
                  {DISTRIBUTION_SHORT_LABELS[item.name] ?? item.name}
                </span>
                <span className="text-xs text-text-tertiary shrink-0 tabular-nums">
                  {item.percent}%
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 min-w-0 flex flex-col border-l border-border-default overflow-hidden">
          <div className="shrink-0 flex flex-col py-1 pr-3 pl-3 overflow-y-auto">
            {listItems.length === 0 ? (
              <p className="text-sm py-4 text-text-tertiary text-center">No active tests</p>
            ) : (
              listItems.map((item, index) => (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => onStageClick?.(item.name)}
                  className="w-full text-left hover:bg-surface-hover rounded transition-colors"
                >
                  <DetailRow item={item} index={index} />
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
