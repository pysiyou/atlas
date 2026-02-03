/**
 * WeeklyActivitiesChart - Modern redesigned chart with vibrant gradients and glassmorphism.
 * Displays 7 bars (one per day) with stacked sections for sampling, entry, and validation.
 */

import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useWeeklyActivities, type DayActivity } from '../hooks';

// Modern vibrant gradient colors
const COLORS = {
  sampling: {
    start: '#3B82F6', // Blue 500
    end: '#60A5FA',   // Blue 400
    gradient: 'url(#samplingGradient)',
  },
  entry: {
    start: '#8B5CF6', // Violet 500
    end: '#A78BFA',   // Violet 400
    gradient: 'url(#entryGradient)',
  },
  validation: {
    start: '#10B981', // Emerald 500
    end: '#34D399',   // Emerald 400
    gradient: 'url(#validationGradient)',
  },
};

const AXIS_COLOR = 'var(--chart-axis)';
const GRID_STROKE = 'var(--chart-grid)';
const TOOLTIP_BG = 'var(--chart-tooltip-bg)';
const TOOLTIP_BORDER = 'var(--chart-tooltip-border)';

const CARD_BASE =
  'rounded-2xl border border-border-subtle bg-gradient-to-br from-surface-default to-surface-hover shadow-2 flex flex-col h-full min-h-0 overflow-hidden items-center justify-center p-6';

interface WeeklyActivitiesChartProps {
  className?: string;
}

function ChartLegend() {
  return (
    <div className="flex items-center justify-center gap-3 flex-wrap">
      {(['sampling', 'entry', 'validation'] as const).map((key) => (
        <div
          key={key}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-hover border border-border-subtle shadow-1"
        >
          <div
            className="w-1 h-1 rounded shadow-sm"
            style={{
              background: `linear-gradient(135deg, ${COLORS[key].start}, ${COLORS[key].end})`,
            }}
          />
          <span className="text-xs font-semibold text-text-secondary">
            {key.charAt(0).toUpperCase() + key.slice(1)}
          </span>
        </div>
      ))}
    </div>
  );
}

function ChartGradients() {
  return (
    <defs>
      <linearGradient id="samplingGradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={COLORS.sampling.start} stopOpacity={0.9} />
        <stop offset="100%" stopColor={COLORS.sampling.end} stopOpacity={0.8} />
      </linearGradient>
      <linearGradient id="entryGradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={COLORS.entry.start} stopOpacity={0.9} />
        <stop offset="100%" stopColor={COLORS.entry.end} stopOpacity={0.8} />
      </linearGradient>
      <linearGradient id="validationGradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={COLORS.validation.start} stopOpacity={0.9} />
        <stop offset="100%" stopColor={COLORS.validation.end} stopOpacity={0.8} />
      </linearGradient>
    </defs>
  );
}

function ActivitiesBarChart({ data }: { data: DayActivity[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <ChartGradients />
        <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} strokeOpacity={0.5} vertical={false} />
        <XAxis
          dataKey="dayOfWeek"
          tick={{ fill: AXIS_COLOR, fontSize: 12, fontWeight: 600 }}
          tickLine={{ stroke: GRID_STROKE }}
          axisLine={{ stroke: GRID_STROKE }}
        />
        <YAxis
          tick={{ fill: AXIS_COLOR, fontSize: 12, fontWeight: 600 }}
          tickLine={{ stroke: GRID_STROKE }}
          axisLine={{ stroke: GRID_STROKE }}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: TOOLTIP_BG,
            border: `1px solid ${TOOLTIP_BORDER}`,
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: 600,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            padding: '8px 12px',
          }}
          cursor={{ fill: 'var(--surface-hover)', opacity: 0.3 }}
          formatter={(value: unknown, name?: string) => [
            typeof value === 'number' ? value : '—',
            name ? name.charAt(0).toUpperCase() + name.slice(1) : '',
          ]}
          labelFormatter={(label) => label}
          labelStyle={{ fontWeight: 700, marginBottom: '4px' }}
        />
        <Bar
          dataKey="sampling"
          stackId="activities"
          fill={COLORS.sampling.gradient}
          radius={[0, 0, 6, 6]}
          name="Sampling"
          animationDuration={800}
          animationBegin={0}
        />
        <Bar
          dataKey="entry"
          stackId="activities"
          fill={COLORS.entry.gradient}
          radius={0}
          name="Entry"
          animationDuration={800}
          animationBegin={100}
        />
        <Bar
          dataKey="validation"
          stackId="activities"
          fill={COLORS.validation.gradient}
          radius={[6, 6, 0, 0]}
          name="Validation"
          animationDuration={800}
          animationBegin={200}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

export const WeeklyActivitiesChart: React.FC<WeeklyActivitiesChartProps> = ({ className = '' }) => {
  const { days, isLoading } = useWeeklyActivities();
  const chartData = useMemo(() => days, [days]);
  const hasData = useMemo(
    () => days.some((d) => d.sampling + d.entry + d.validation > 0),
    [days]
  );

  if (isLoading) {
    return (
      <div className={`${CARD_BASE} ${className}`}>
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-action-primary border-t-transparent rounded-full animate-spin" />
          <h3 className="text-base font-bold text-text-primary">Loading Weekly Activities...</h3>
        </div>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className={`${CARD_BASE} ${className}`}>
        <h3 className="text-base font-bold text-text-primary mb-2">Weekly Activities</h3>
        <span className="text-text-tertiary text-sm">No activity this week</span>
      </div>
    );
  }

  return (
    <div
      className={`
        rounded-2xl border border-border-subtle
        bg-gradient-to-br from-surface-default via-surface-default to-surface-hover
        shadow-2 hover:shadow-3 flex flex-col h-full min-h-0 overflow-hidden
        transition-all duration-300 ease-out hover:border-border-hover
        ${className}
      `}
    >
      <div className="shrink-0 px-5 pt-5 pb-3">
        <h3 className="text-lg font-bold text-text-primary mb-4 tracking-tight">Weekly Activities</h3>
        <ChartLegend />
      </div>
      <div className="flex-1 min-h-0 w-full px-4 pb-4" style={{ minHeight: 200 }}>
        <ActivitiesBarChart data={chartData} />
      </div>
    </div>
  );
};
