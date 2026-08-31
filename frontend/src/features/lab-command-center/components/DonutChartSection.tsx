import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartContainer } from './ChartContainer';
import { TOOLTIP_BG, TOOLTIP_STROKE, TOOLTIP_FG, TOOLTIP_FG_MUTED, COLORS, CHART_SUCCESS } from '../formatters/donutChartUtils';
import type { PieSegment, SegmentWithPercent } from '../formatters/donutChartUtils';

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

export interface ChartSectionProps {
  pieData: PieSegment[];
  total: number;
  segmentLabels: SegmentWithPercent[];
  valueLabel: string;
  subTitle?: string;
  innerRadius: number | string;
  outerRadius: number | string;
  widthPercent?: number;
}

export function ChartSection({
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
