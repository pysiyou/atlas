// src/features/lab/command-center/components/StackedBarChart.tsx

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

/** Single bar: one value per label. */
export interface BarChartDataPoint {
  label: string;
  value: number;
}

/** One segment in a stacked bar. Order in array = stack order (first = bottom). */
export interface StackedBarSegment {
  dataKey: string;
  color: string;
  name?: string;
}

/** Data row for stacked bars: label + one numeric field per segment dataKey. */
export interface StackedBarChartDataPoint {
  label: string;
  [segmentKey: string]: string | number;
}

interface StackedBarChartProps {
  /** Single bar: { label, value }[]. Stacked: { label, ...segmentValues }[] with `segments` defined. */
  data: BarChartDataPoint[] | StackedBarChartDataPoint[];
  /** When set, bars are stacked; each segment uses its dataKey and color. */
  segments?: StackedBarSegment[];
  title?: string;
  subTitle?: string;
  className?: string;
  valueLabel?: string;
  valueFormatter?: (value: number) => string;
}

const CHART_BRAND = 'var(--chart-brand)';
const CHART_GRID = 'var(--chart-grid)';
const CHART_AXIS = 'var(--chart-axis)';
const CHART_SUCCESS = 'var(--chart-success)';
const CHART_WARNING = 'var(--primitive-warning-500)';
const TOOLTIP_BG = 'var(--chart-tooltip)';
const TOOLTIP_STROKE = 'var(--chart-tooltip-stroke)';
const TOOLTIP_FG = 'var(--fg)';
const TOOLTIP_FG_MUTED = 'var(--fg-subtle)';

const SEGMENT_GAP = 2;
const BAR_RADIUS = 4;

/** Rounded rect per segment with small vertical gap; every segment fully rounded. */
function createStackedBarShape(_segmentIndex: number, totalSegments: number) {
  return (props: { x?: number; y?: number; width?: number; height?: number; fill?: string }) => {
    const { x = 0, y = 0, width = 0, height = 0, fill } = props;
    if (height <= 0) return null;
    const gap = totalSegments > 1 ? SEGMENT_GAP : 0;
    const off = gap / 2;
    const h = Math.max(0, height - gap);
    return (
      <rect
        x={x}
        y={y + off}
        width={width}
        height={h}
        fill={fill}
        rx={BAR_RADIUS}
        ry={BAR_RADIUS}
      />
    );
  };
}

interface TooltipProps {
  active?: boolean;
  payload?: readonly { name?: string; value: number; color?: string; dataKey: string }[];
  label?: string | number;
  valueFormatter?: (value: number) => string;
  valueLabel?: string;
  stacked?: boolean;
  [key: string]: unknown;
}

const CustomTooltip = ({
  active,
  payload,
  label,
  valueFormatter,
  valueLabel = 'value',
  stacked = false,
}: TooltipProps) => {
  if (!active || !payload?.length) return null;

  if (!stacked) {
    const value = valueFormatter ? valueFormatter(payload[0].value) : payload[0].value;
    return (
      <div
        className="px-3 py-2 rounded shadow-lg text-sm min-w-[100px]"
        style={{
          backgroundColor: TOOLTIP_BG,
          border: `1px solid ${TOOLTIP_STROKE}`,
          color: TOOLTIP_FG,
        }}
      >
        <p className="text-xs font-normal mb-1" style={{ color: TOOLTIP_FG_MUTED }}>{label}</p>
        <p className="font-normal text-base mt-0.5">{value} <span className="text-xs font-normal text-fg-subtle">{valueLabel}</span></p>
      </div>
    );
  }

  const total = payload.reduce((s, p) => s + (p.value ?? 0), 0);
  const fmt = (v: number) => (valueFormatter ? valueFormatter(v) : String(v));

  return (
    <div
      className="px-3 py-2 rounded shadow-lg text-sm min-w-[120px]"
      style={{
        backgroundColor: TOOLTIP_BG,
        border: `1px solid ${TOOLTIP_STROKE}`,
        color: TOOLTIP_FG,
      }}
    >
      <p className="text-xs font-normal mb-2" style={{ color: TOOLTIP_FG_MUTED }}>{label}</p>
      <ul className="space-y-1">
        {payload.map((p) => (
          <li key={p.dataKey} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color ?? CHART_BRAND }} />
              <span className="text-xs">{p.name || p.dataKey}</span>
            </span>
            <span className="font-normal text-sm">{fmt(p.value)}</span>
          </li>
        ))}
      </ul>
      <p className="text-xs font-normal mt-2 pt-2 border-t border-stroke">
        Total: {fmt(total)} <span className="text-fg-subtle font-normal">{valueLabel}</span>
      </p>
    </div>
  );
};

const DEFAULT_STACKED_COLORS = [CHART_BRAND, CHART_SUCCESS, CHART_WARNING];

export const StackedBarChart: React.FC<StackedBarChartProps> = ({
  data,
  segments,
  title = 'Chart',
  subTitle = '',
  className = '',
  valueLabel,
  valueFormatter,
}) => {
  const isStacked = segments && segments.length > 0;
  const chartData = isStacked
    ? (data as StackedBarChartDataPoint[])
    : (data as BarChartDataPoint[]);
  const effectiveSegments = isStacked
    ? segments.map((s, i) => ({ ...s, color: s.color || DEFAULT_STACKED_COLORS[i % DEFAULT_STACKED_COLORS.length] }))
    : [];

  return (
    <div className={`flex flex-col h-full w-full min-w-0 min-h-0 bg-panel rounded overflow-hidden shadow-sm ${className}`}>
      <div className="px-4 pt-4 pb-2 flex flex-row items-center justify-between shrink-0">
        <div className="flex items-baseline gap-2 min-w-0">
          <h3 className="text-base font-medium tracking-tight text-fg truncate">
            {title}
          </h3>
          {subTitle && (
            <span className="text-fg-subtle text-xs tracking-wider shrink-0 before:content-['·'] before:mr-2">
              {subTitle}
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0 min-w-0 relative" style={{ width: '100%' }}>
        <div className="absolute inset-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 12, right: 8, left: 4, bottom: 4 }}
            >
              <CartesianGrid stroke={CHART_GRID} strokeDasharray="3 3" opacity={0.6} vertical={false} />
              <XAxis
                dataKey="label"
                axisLine={{ stroke: CHART_GRID }}
                tickLine={false}
                tick={{ fontSize: 11, fill: CHART_AXIS }}
                interval="preserveStartEnd"
                dy={6}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: CHART_AXIS }}
                width={40}
                tickFormatter={(value) =>
                  new Intl.NumberFormat('en-US', {
                    notation: 'compact',
                    maximumFractionDigits: 1,
                  }).format(value)
                }
              />
              <Tooltip
                content={(props) => (
                  <CustomTooltip
                    {...props}
                    valueFormatter={valueFormatter}
                    valueLabel={valueLabel}
                    stacked={isStacked}
                  />
                )}
                cursor={{ fill: CHART_GRID, opacity: 0.1 }}
              />
              {isStacked ? (
                effectiveSegments.map((seg, i) => (
                  <Bar
                    key={seg.dataKey}
                    dataKey={seg.dataKey}
                    stackId="stack"
                    fill={seg.color}
                    name={seg.name ?? seg.dataKey}
                    shape={createStackedBarShape(i, effectiveSegments.length)}
                  />
                ))
              ) : (
                <Bar
                  dataKey="value"
                  fill={CHART_BRAND}
                  radius={[BAR_RADIUS, BAR_RADIUS, 0, 0]}
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
