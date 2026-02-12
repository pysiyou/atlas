/**
 * Analytics Dashboard
 * Lab metrics in 3x2 widget grid with toolbar (date range, compare-to, export).
 */

import React, { useMemo, useState } from 'react';
import { useLabMetrics } from './hooks/useLabMetrics';
import { AnalyticsToolbar } from './components/AnalyticsToolbar';
import type { DateRangePreset, CompareToOption } from './components/AnalyticsToolbar';
import { WidgetCard } from './components/WidgetCard';
import { TestsOverTimeChart } from './components/TestsOverTimeChart';
import { TATTrendChart } from './components/TATTrendChart';
import { FunnelSteps } from './components/FunnelSteps';
import { TestsByDayBarChart } from './components/TestsByDayBarChart';
import { ProductivityTable } from './components/ProductivityTable';
import { LoadingState } from '@/shared/components';
import { ICONS } from '@/utils';
import { format, subDays } from 'date-fns';
import type { DateRangeFilter, PeriodChange } from './types';

function getDateRangeForPreset(preset: DateRangePreset): DateRangeFilter {
  const end = new Date();
  const start =
    preset === 'thisWeek' || preset === 'last7'
      ? subDays(end, 7)
      : preset === 'last30'
        ? subDays(end, 30)
        : subDays(end, 90);
  return {
    startDate: format(start, 'yyyy-MM-dd'),
    endDate: format(end, 'yyyy-MM-dd'),
  };
}

function getComparisonDateRange(
  dateRange: DateRangeFilter,
  option: CompareToOption
): DateRangeFilter | null {
  if (option === 'none') return null;
  const start = new Date(dateRange.startDate);
  const end = new Date(dateRange.endDate);
  const days = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  if (option === 'lastWeek') {
    return {
      startDate: format(subDays(start, 7), 'yyyy-MM-dd'),
      endDate: format(subDays(end, 7), 'yyyy-MM-dd'),
    };
  }
  return {
    startDate: format(subDays(start, days), 'yyyy-MM-dd'),
    endDate: format(subDays(start, 1), 'yyyy-MM-dd'),
  };
}

function computePeriodChange(
  current: { volume: { total: number }; tat: { averageTAT: number; complianceRate: number }; funnel: { validated: number }; volumeTotal: number },
  comparison: { volume: { total: number }; tat: { averageTAT: number; complianceRate: number }; funnel: { validated: number }; volumeTotal: number }
): PeriodChange {
  const pct = (a: number, b: number) =>
    b === 0 ? undefined : Math.round(((a - b) / b) * 100 * 100) / 100;
  const currValidPct = current.volumeTotal > 0 ? (current.funnel.validated / current.volumeTotal) * 100 : 0;
  const prevValidPct = comparison.volumeTotal > 0 ? (comparison.funnel.validated / comparison.volumeTotal) * 100 : 0;
  const tatDelta =
    comparison.tat.averageTAT > 0
      ? Math.round(((comparison.tat.averageTAT - current.tat.averageTAT) / comparison.tat.averageTAT) * 100 * 100) / 100
      : undefined;
  return {
    totalTests: pct(current.volume.total, comparison.volume.total),
    averageTAT: tatDelta,
    complianceRate: pct(current.tat.complianceRate, comparison.tat.complianceRate),
    validatedPercent: pct(currValidPct, prevValidPct),
  };
}

function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

const DATE_RANGE_LABELS: Record<DateRangePreset, string> = {
  thisWeek: 'This Week',
  last7: 'Last 7 days',
  last30: 'Last 30 days',
  last90: 'Last 90 days',
};

export const AnalyticsDashboard: React.FC = () => {
  const [dateRangePreset, setDateRangePreset] = useState<DateRangePreset>('last30');
  const [dateRange, setDateRange] = useState<DateRangeFilter>(() =>
    getDateRangeForPreset('last30')
  );
  const [compareTo, setCompareTo] = useState<CompareToOption>('none');

  const comparisonRange = useMemo(
    () => getComparisonDateRange(dateRange, compareTo),
    [dateRange, compareTo]
  );

  const { analytics, isLoading } = useLabMetrics(dateRange);
  const comparison = useLabMetrics(comparisonRange ?? undefined);

  const periodChange = useMemo((): PeriodChange | undefined => {
    if (!comparisonRange || !comparison.analytics) return undefined;
    return computePeriodChange(
      {
        volume: analytics.volume,
        tat: analytics.tat,
        funnel: analytics.funnel,
        volumeTotal: analytics.volume.total,
      },
      {
        volume: comparison.analytics.volume,
        tat: comparison.analytics.tat,
        funnel: comparison.analytics.funnel,
        volumeTotal: comparison.analytics.volume.total,
      }
    );
  }, [comparisonRange, analytics, comparison.analytics]);

  const dateRangeLabel = DATE_RANGE_LABELS[dateRangePreset];

  const handleDateRangePreset = (preset: DateRangePreset) => {
    setDateRangePreset(preset);
    setDateRange(getDateRangeForPreset(preset));
  };

  const handleExportData = () => {
    const payload = {
      dateRange,
      comparisonRange: comparisonRange ?? undefined,
      analytics,
      comparisonAnalytics: comparison.analytics ?? undefined,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lab-analytics-${format(new Date(), 'yyyy-MM-dd-HHmm')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingState message="Loading analytics..." size="md" />
      </div>
    );
  }

  const validatedPct =
    analytics.volume.total > 0
      ? Math.round((analytics.funnel.validated / analytics.volume.total) * 100 * 100) / 100
      : 0;

  return (
    <div className="space-y-6">
      <AnalyticsToolbar
        dateRange={dateRange}
        dateRangeLabel={dateRangeLabel}
        dateRangePreset={dateRangePreset}
        onDateRangePreset={handleDateRangePreset}
        compareTo={compareTo}
        onCompareToChange={setCompareTo}
        onExportData={handleExportData}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Row 1, Col 1: Total Tests */}
        <WidgetCard
          title="Total Tests"
          icon={ICONS.dataFields.flask}
          value={analytics.volume.total.toLocaleString()}
          change={
            periodChange?.totalTests !== undefined
              ? {
                  value: Math.abs(periodChange.totalTests),
                  isPositive: periodChange.totalTests > 0,
                }
              : undefined
          }
          chartTitle="Tests Over Time"
        >
          <TestsOverTimeChart
            trend={analytics.volume.trend}
            comparisonTrend={comparison.analytics?.volume.trend}
            height={200}
          />
        </WidgetCard>

        {/* Row 1, Col 2: Average TAT */}
        <WidgetCard
          title="Average TAT"
          icon={ICONS.dataFields.hourglass}
          value={formatMinutes(analytics.tat.averageTAT)}
          change={
            periodChange?.averageTAT !== undefined
              ? {
                  value: Math.abs(periodChange.averageTAT),
                  isPositive: periodChange.averageTAT > 0,
                }
              : undefined
          }
          chartTitle="TAT Over Time"
        >
          <TATTrendChart data={analytics.tat} mode="tat" height={200} />
        </WidgetCard>

        {/* Row 1, Col 3: TAT Compliance */}
        <WidgetCard
          title="TAT Compliance"
          icon="check-circle"
          value={`${analytics.tat.complianceRate}%`}
          change={
            periodChange?.complianceRate !== undefined
              ? {
                  value: Math.abs(periodChange.complianceRate),
                  isPositive: periodChange.complianceRate > 0,
                }
              : undefined
          }
          chartTitle="Compliance Over Time"
        >
          <TATTrendChart data={analytics.tat} mode="compliance" height={200} />
        </WidgetCard>

        {/* Row 2, Col 1: Lab Funnel */}
        <WidgetCard
          title="Lab Funnel"
          icon="checklist"
          value={`${validatedPct}%`}
          change={
            periodChange?.validatedPercent !== undefined
              ? {
                  value: Math.abs(periodChange.validatedPercent),
                  isPositive: periodChange.validatedPercent > 0,
                }
              : undefined
          }
          chartTitle="Conversion by stage"
        >
          <FunnelSteps funnel={analytics.funnel} />
        </WidgetCard>

        {/* Row 2, Col 2: Test Volume (bar) */}
        <WidgetCard
          title="Test Volume"
          icon="clock"
          value={analytics.volume.total.toLocaleString()}
          subtitle="Tests in period"
          chartTitle="Tests by Day"
        >
          <TestsByDayBarChart trend={analytics.volume.trend} height={200} />
        </WidgetCard>

        {/* Row 2, Col 3: Technician Productivity */}
        <WidgetCard
          title="Technician Productivity"
          icon="users-group"
          value={`${analytics.productivity.byTechnician.length} technicians`}
          chartTitle="Workload"
        >
          <ProductivityTable data={analytics.productivity} compact />
        </WidgetCard>
      </div>
    </div>
  );
};
