/**
 * CommandCenterChartCard - Combo chart: volume (bars) + compliance/TAT (line) over time.
 * Time-range selector: All | Weekly | Monthly | Yearly. Uses useLabMetrics.
 */

import React, { useMemo, useState } from 'react';
import { format, subDays } from 'date-fns';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card, CardHeader } from '@/shared/ui';
import { useLabMetrics } from '@/features/lab/analytics/hooks/useLabMetrics';
import type { DateRangeFilter } from '@/features/lab/analytics/types';

const BAR_FILL = 'var(--chart-series-primary)';
const LINE_STROKE = 'var(--chart-series-success)';
const AXIS_COLOR = 'var(--chart-axis)';
const GRID_STROKE = 'var(--chart-grid)';

type TimeRangeKey = 'all' | 'weekly' | 'monthly' | 'yearly';

const TIME_RANGES: Array<{ key: TimeRangeKey; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'yearly', label: 'Yearly' },
];

function getDateRangeForKey(key: TimeRangeKey): DateRangeFilter {
  const end = new Date();
  const start =
    key === 'yearly'
      ? subDays(end, 365)
      : key === 'monthly'
        ? subDays(end, 30)
        : key === 'weekly'
          ? subDays(end, 7)
          : subDays(end, 90);
  return {
    startDate: format(start, 'yyyy-MM-dd'),
    endDate: format(end, 'yyyy-MM-dd'),
  };
}

export const CommandCenterChartCard: React.FC = () => {
  const [timeRange, setTimeRange] = useState<TimeRangeKey>('monthly');
  const dateRange = useMemo(() => getDateRangeForKey(timeRange), [timeRange]);
  const { analytics, isLoading } = useLabMetrics(dateRange);

  const chartData = useMemo(() => {
    if (!analytics?.volume?.trend?.length) return [];
    const volByDate = new Map(analytics.volume.trend.map(t => [t.date, t.count]));
    const tatTrend = analytics.tat?.trend ?? [];
    const dateSet = new Set(analytics.volume.trend.map(t => t.date));
    tatTrend.forEach(t => dateSet.add(t.date));
    const sortedDates = Array.from(dateSet).sort();
    return sortedDates.map(date => {
      const tatPoint = tatTrend.find(t => t.date === date);
      return {
        date: format(new Date(date), 'MMM d'),
        fullDate: date,
        tests: volByDate.get(date) ?? 0,
        complianceRate: tatPoint?.complianceRate ?? undefined,
      };
    });
  }, [analytics]);

  const action = (
    <div className="flex items-center gap-1">
      {TIME_RANGES.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          onClick={() => setTimeRange(key)}
          className={`px-2 py-1 rounded text-xs font-medium ${
            timeRange === key
              ? 'bg-action-primary-muted-bg text-action-primary'
              : 'text-text-tertiary hover:bg-surface-hover'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );

  return (
    <Card className="rounded-xl flex flex-col overflow-hidden min-w-0 flex-1 min-h-0 h-full" padding="none" variant="default">
      <div className="shrink-0 px-4 pt-4">
        <CardHeader
          title="Volume & Compliance"
          subtitle="Tests over time and validation compliance"
          action={action}
        />
      </div>
      <div className="flex-1 min-h-[160px] px-4 pb-4 flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center text-text-tertiary text-sm min-h-[160px]">
            Loading…
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-text-tertiary text-sm min-h-[160px]">
            No data for selected range
          </div>
        ) : (
          <div className="flex-1 min-h-0 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
              <XAxis
                dataKey="date"
                tick={{ fill: AXIS_COLOR, fontSize: 11 }}
                tickLine={{ stroke: GRID_STROKE }}
              />
              <YAxis
                yAxisId="left"
                tick={{ fill: AXIS_COLOR, fontSize: 11 }}
                tickLine={{ stroke: GRID_STROKE }}
                label={{
                  value: 'Tests',
                  angle: -90,
                  position: 'insideLeft',
                  style: { fill: AXIS_COLOR, fontSize: 11 },
                }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fill: AXIS_COLOR, fontSize: 11 }}
                tickFormatter={v => `${v}%`}
                tickLine={{ stroke: GRID_STROKE }}
                label={{
                  value: 'Compliance %',
                  angle: 90,
                  position: 'insideRight',
                  style: { fill: AXIS_COLOR, fontSize: 11 },
                }}
              />
              <Tooltip
                content={({ payload }) =>
                  payload?.[0] ? (
                    <div className="bg-surface-overlay border border-border-default rounded px-2 py-1 text-xs shadow-lg">
                      <div>{payload[0].payload.fullDate}</div>
                      <div>Tests: {payload[0].payload.tests}</div>
                      {payload[0].payload.complianceRate != null && (
                        <div>Compliance: {payload[0].payload.complianceRate}%</div>
                      )}
                    </div>
                  ) : null
                }
              />
              <Legend
                wrapperStyle={{ fontSize: 11 }}
                formatter={value => (value === 'tests' ? 'Tests' : 'Compliance %')}
              />
              <Bar
                yAxisId="left"
                dataKey="tests"
                name="tests"
                fill={BAR_FILL}
                radius={[2, 2, 0, 0]}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="complianceRate"
                name="complianceRate"
                stroke={LINE_STROKE}
                strokeWidth={2}
                dot={{ r: 3, fill: LINE_STROKE }}
                connectNulls
              />
            </ComposedChart>
          </ResponsiveContainer>
          </div>
        )}
      </div>
    </Card>
  );
};
