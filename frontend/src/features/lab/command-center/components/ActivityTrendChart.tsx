import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

/** Single series: date + value. Dual series: date + received + validated. */
export type ActivityTrendDataPoint =
  | { date: string; value: number }
  | { date: string; received: number; validated: number };

interface ActivityTrendChartProps {
  data: ActivityTrendDataPoint[];
  title?: string;
  subTitle?: string;
  className?: string;
  trendPercentage?: number;
  /** Tooltip value suffix for single series. Default "activities". */
  valueLabel?: string;
}

const CHART_ACCENT = 'var(--chart-accent)';
const CHART_SUCCESS = 'var(--chart-success)';
const CHART_GRID = 'var(--chart-grid)';
const CHART_AXIS = 'var(--chart-axis)';
const TOOLTIP_BG = 'var(--chart-tooltip)';
const TOOLTIP_STROKE = 'var(--chart-tooltip-stroke)';
const TOOLTIP_FG = 'var(--fg)';
const TOOLTIP_FG_MUTED = 'var(--fg-subtle)';

function isDualSeries(data: ActivityTrendDataPoint[]): data is { date: string; received: number; validated: number }[] {
  return data.length > 0 && 'received' in data[0];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({
  active,
  payload,
  label,
  valueLabel = 'activities',
  dualSeries,
}: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="px-3 py-2 rounded-lg shadow-lg text-sm min-w-[120px]"
      style={{
        backgroundColor: TOOLTIP_BG,
        border: `1px solid ${TOOLTIP_STROKE}`,
        color: TOOLTIP_FG,
      }}
    >
      <p className="text-xs font-normal mb-1" style={{ color: TOOLTIP_FG_MUTED }}>{label}</p>
      {dualSeries ? (
        <>
          <p className="font-medium" style={{ color: CHART_ACCENT }}>Received: {payload.find((p: { dataKey: string }) => p.dataKey === 'received')?.value ?? 0}</p>
          <p className="font-medium" style={{ color: CHART_SUCCESS }}>Validated: {payload.find((p: { dataKey: string }) => p.dataKey === 'validated')?.value ?? 0}</p>
          <p className="text-xs mt-1" style={{ color: TOOLTIP_FG_MUTED }}>
            Gap: {(payload.find((p: { dataKey: string }) => p.dataKey === 'received')?.value ?? 0) -
              (payload.find((p: { dataKey: string }) => p.dataKey === 'validated')?.value ?? 0)}
          </p>
        </>
      ) : (
        <p className="font-bold text-base mt-0.5">{payload[0].value} {valueLabel}</p>
      )}
    </div>
  );
};

export const ActivityTrendChart: React.FC<ActivityTrendChartProps> = ({
  data,
  title = 'Activity Over Time',
  subTitle = 'this week',
  className = '',
  trendPercentage,
  valueLabel = 'activities',
}) => {
  const dual = isDualSeries(data);

  return (
    <div className={`flex flex-col h-full bg-panel rounded overflow-hidden shadow-sm ${className}`}>
      <div className="px-4 pt-4 pb-2 flex flex-row items-center justify-between">
        <div className="flex items-baseline gap-2">
          <h3 className="text-base font-medium tracking-tight text-fg">
            {title}
          </h3>
          <span className="text-fg-subtle text-xs tracking-wider before:content-['·'] before:mr-2">
            {subTitle}
          </span>
        </div>
      </div>

      <div className="flex-1 min-h-0 relative w-full">
        {trendPercentage !== undefined && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-panel border border-stroke text-fg px-2 py-1 rounded text-sm font-medium z-10 shadow-sm">
            {trendPercentage > 0 ? '+' : ''}{trendPercentage}%
          </div>
        )}
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 12, right: 8, left: 4, bottom: 4 }}
          >
            <defs>
              <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_ACCENT} stopOpacity={0.35} />
                <stop offset="95%" stopColor={CHART_ACCENT} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorValidated" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_SUCCESS} stopOpacity={0.35} />
                <stop offset="95%" stopColor={CHART_SUCCESS} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={CHART_GRID} strokeDasharray="3 3" opacity={0.6} vertical horizontal />
            <XAxis
              dataKey="date"
              axisLine={{ stroke: CHART_GRID }}
              tickLine={{ stroke: CHART_GRID }}
              tick={{ fontSize: 11, fill: CHART_AXIS }}
              interval="preserveStartEnd"
              dy={6}
            />
            <YAxis
              axisLine={{ stroke: CHART_GRID }}
              tickLine={{ stroke: CHART_GRID }}
              tick={{ fontSize: 11, fill: CHART_AXIS }}
              width={32}
              domain={['dataMin - 5', 'dataMax + 5']}
              tickFormatter={(v) => String(v)}
            />
            <Tooltip
              content={(p) => <CustomTooltip {...p} valueLabel={valueLabel} dualSeries={dual} />}
              cursor={{ stroke: CHART_GRID, strokeWidth: 1, strokeDasharray: '4 4' }}
            />
            {dual ? (
              <>
                <Legend
                  wrapperStyle={{ fontSize: 11 }}
                  formatter={(value) => <span style={{ color: 'var(--fg-subtle)' }}>{value}</span>}
                  iconType="circle"
                  iconSize={8}
                />
                <Area
                  type="monotone"
                  dataKey="validated"
                  name="Validated (delivered)"
                  stroke={CHART_SUCCESS}
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorValidated)"
                  dot={{ r: 0 }}
                  activeDot={{ fill: CHART_SUCCESS, stroke: TOOLTIP_BG, strokeWidth: 2, r: 5 }}
                />
                <Area
                  type="monotone"
                  dataKey="received"
                  name="Received"
                  stroke={CHART_ACCENT}
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorActivity)"
                  dot={{ r: 0 }}
                  activeDot={{ fill: CHART_ACCENT, stroke: TOOLTIP_BG, strokeWidth: 2, r: 5 }}
                />
              </>
            ) : (
              <Area
                type="monotone"
                dataKey="value"
                stroke={CHART_ACCENT}
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorActivity)"
                dot={{ fill: CHART_ACCENT, r: 0 }}
                activeDot={{ fill: CHART_ACCENT, stroke: TOOLTIP_BG, strokeWidth: 2, r: 5 }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
