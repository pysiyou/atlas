import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface ActivityData {
  date: string;
  value: number;
}

interface ActivityTrendChartProps {
  data: ActivityData[];
  title?: string;
  subTitle?: string;
  className?: string;
  trendPercentage?: number;
}

const CHART_ACCENT = 'var(--chart-accent)';
const CHART_GRID = 'var(--chart-grid)';
const CHART_AXIS = 'var(--chart-axis)';
const TOOLTIP_BG = 'var(--chart-tooltip)';
const TOOLTIP_STROKE = 'var(--chart-tooltip-stroke)';
const TOOLTIP_FG = 'var(--fg)';
const TOOLTIP_FG_MUTED = 'var(--fg-subtle)';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="px-3 py-2 rounded-lg shadow-lg text-sm"
        style={{
          backgroundColor: TOOLTIP_BG,
          border: `1px solid ${TOOLTIP_STROKE}`,
          color: TOOLTIP_FG,
        }}
      >
        <p className="text-xs font-normal" style={{ color: TOOLTIP_FG_MUTED }}>{label}</p>
        <p className="font-bold text-base mt-0.5">{payload[0].value} activities</p>
      </div>
    );
  }
  return null;
};

export const ActivityTrendChart: React.FC<ActivityTrendChartProps> = ({
  data,
  title = 'Activity Over Time',
  subTitle = 'this week',
  className = '',
  trendPercentage,
}) => {
  return (
    <div className={`flex flex-col h-full bg-panel rounded overflow-hidden shadow-sm ${className}`}>
      <div className="p-4 flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex flex-col space-y-1">
          <h3 className="font-semibold leading-none tracking-tight text-fg">
            {title} <span className="ml-2 text-sm font-normal text-fg-subtle">| {subTitle}</span>
          </h3>
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
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: CHART_GRID, strokeWidth: 1, strokeDasharray: '4 4' }} />
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
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
