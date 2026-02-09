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

export interface BarChartDataPoint {
  label: string;
  value: number;
}

interface SimpleBarChartProps {
  data: BarChartDataPoint[];
  title?: string;
  subTitle?: string;
  className?: string;
  valueLabel?: string;
  valueFormatter?: (value: number) => string;
}

const CHART_BRAND = 'var(--chart-brand)';
const CHART_GRID = 'var(--chart-grid)';
const CHART_AXIS = 'var(--chart-axis)';
const TOOLTIP_BG = 'var(--chart-tooltip)';
const TOOLTIP_STROKE = 'var(--chart-tooltip-stroke)';
const TOOLTIP_FG = 'var(--fg)';
const TOOLTIP_FG_MUTED = 'var(--fg-subtle)';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label, valueFormatter, valueLabel = 'value' }: any) => {
  if (!active || !payload?.length) return null;
  
  const value = valueFormatter ? valueFormatter(payload[0].value) : payload[0].value;

  return (
    <div
      className="px-3 py-2 rounded-lg shadow-lg text-sm min-w-[100px]"
      style={{
        backgroundColor: TOOLTIP_BG,
        border: `1px solid ${TOOLTIP_STROKE}`,
        color: TOOLTIP_FG,
      }}
    >
      <p className="text-xs font-normal mb-1" style={{ color: TOOLTIP_FG_MUTED }}>{label}</p>
      <p className="font-bold text-base mt-0.5">{value} <span className="text-xs font-normal text-fg-subtle">{valueLabel}</span></p>
    </div>
  );
};

export const SimpleBarChart: React.FC<SimpleBarChartProps> = ({
  data,
  title = 'Chart',
  subTitle = '',
  className = '',
  valueLabel,
  valueFormatter,
}) => {
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
            data={data}
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
              content={(props) => <CustomTooltip {...props} valueFormatter={valueFormatter} valueLabel={valueLabel} />}
              cursor={{ fill: CHART_GRID, opacity: 0.1 }}
            />
            <Bar
              dataKey="value"
              fill={CHART_BRAND}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
