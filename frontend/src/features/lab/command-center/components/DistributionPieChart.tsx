import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export interface DistributionDataPoint {
  name: string;
  value: number;
  color?: string;
}

interface DistributionPieChartProps {
  data: DistributionDataPoint[];
  title?: string;
  subTitle?: string;
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
      className="px-3 py-2 rounded-lg shadow-lg text-sm min-w-[120px]"
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

const renderLegendText = (value: string, _entry: { payload?: unknown }) => {
  return <span style={{ color: 'var(--text)', fontSize: '13px', marginLeft: '4px' }}>{value}</span>;
};

export const DistributionPieChart: React.FC<DistributionPieChartProps> = ({
  data,
  title = 'Distribution',
  subTitle = 'this year',
  className = '',
  innerRadius = '60%',
  outerRadius = '80%',
}) => {
  return (
    <div className={`flex flex-col h-full w-full min-w-0 min-h-0 bg-surface rounded overflow-hidden shadow-sm ${className}`}>
      <div className="px-4 pt-4 pb-2 flex flex-row items-center justify-between shrink-0">
        <div className="flex items-baseline gap-2 min-w-0">
          <h3 className="text-base font-medium tracking-tight text-text-primary truncate">
            {title}
          </h3>
          {subTitle && (
            <span className="text-text-tertiary text-xs tracking-wider shrink-0 before:content-['·'] before:mr-2">
              {subTitle}
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0 min-w-0 relative" style={{ width: '100%' }}>
        <div className="absolute inset-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="40%"
                cy="50%"
                innerRadius={innerRadius}
                outerRadius={outerRadius}
                paddingAngle={4}
                dataKey="value"
                stroke="none"
                cornerRadius={4}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color || COLORS[index % COLORS.length]}
                    stroke="var(--surface)"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
              <Legend
                layout="vertical"
                verticalAlign="middle"
                align="right"
                iconType="circle"
                iconSize={10}
                formatter={renderLegendText}
                wrapperStyle={{ right: 0, paddingRight: '16px' }}
              />
              <text x="40%" y="50%" textAnchor="middle" dominantBaseline="middle">
                <tspan x="40%" dy="-0.5em" fontSize="24" fill="var(--text)" fontWeight="bold" />
              </text>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="absolute left-[40%] top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
          {/* Center text overlay placeholder */}
        </div>
      </div>
    </div>
  );
};
