/**
 * Analytics Dashboard
 * Comprehensive lab metrics and KPIs
 */

import React, { useState } from 'react';
import { useLabMetrics } from './hooks/useLabMetrics';
import { MetricsCard } from './components/MetricsCard';
import { TATChart } from './components/TATChart';
import { VolumeChart } from './components/VolumeChart';
import { RejectionChart } from './components/RejectionChart';
import { ProductivityTable } from './components/ProductivityTable';
import { Icon, Button } from '@/shared/ui';
import { ICONS } from '@/utils';
import { format, subDays } from 'date-fns';
import type { DateRangeFilter } from './types';

export const AnalyticsDashboard: React.FC = () => {
  // Default to last 30 days
  const [dateRange, setDateRange] = useState<DateRangeFilter>({
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
  });

  const { analytics, isLoading } = useLabMetrics(dateRange);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-text-tertiary">Loading analytics...</div>
      </div>
    );
  }

  const formatMinutes = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <div className="space-y-6">
      {/* Header with date range selector */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Lab Analytics</h1>
          <p className="text-sm text-text-tertiary mt-1">
            Performance metrics and insights
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setDateRange({
                startDate: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
                endDate: format(new Date(), 'yyyy-MM-dd'),
              });
            }}
          >
            Last 7 days
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setDateRange({
                startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
                endDate: format(new Date(), 'yyyy-MM-dd'),
              });
            }}
          >
            Last 30 days
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setDateRange({
                startDate: format(subDays(new Date(), 90), 'yyyy-MM-dd'),
                endDate: format(new Date(), 'yyyy-MM-dd'),
              });
            }}
          >
            Last 90 days
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricsCard
          title="Average TAT"
          value={formatMinutes(analytics.tat.averageTAT)}
          subtitle={`Target: ${formatMinutes(analytics.tat.targetTAT)}`}
          icon={ICONS.dataFields.hourglass}
          color={analytics.tat.averageTAT <= analytics.tat.targetTAT ? 'success' : 'warning'}
        />
        <MetricsCard
          title="TAT Compliance"
          value={`${analytics.tat.complianceRate}%`}
          subtitle="Tests within target"
          icon="check-circle"
          color={analytics.tat.complianceRate >= 80 ? 'success' : analytics.tat.complianceRate >= 60 ? 'warning' : 'danger'}
        />
        <MetricsCard
          title="Total Tests"
          value={analytics.volume.total.toLocaleString()}
          subtitle="In selected period"
          icon={ICONS.dataFields.flask}
          color="brand"
        />
        <MetricsCard
          title="Critical Values"
          value={analytics.criticalValues.total}
          subtitle={`${analytics.criticalValues.pending} pending`}
          icon="alert-circle"
          color={analytics.criticalValues.pending > 0 ? 'danger' : 'success'}
        />
      </div>

      {/* Backlog Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricsCard
          title="Pending Collection"
          value={analytics.backlog.pendingCollection}
          subtitle={analytics.backlog.oldestPending.collection 
            ? `Oldest: ${format(new Date(analytics.backlog.oldestPending.collection), 'MMM dd, HH:mm')}`
            : 'All current'
          }
          icon="sample-collection"
          color={analytics.backlog.pendingCollection > 10 ? 'warning' : 'success'}
        />
        <MetricsCard
          title="Pending Entry"
          value={analytics.backlog.pendingEntry}
          subtitle={analytics.backlog.oldestPending.entry 
            ? `Oldest: ${format(new Date(analytics.backlog.oldestPending.entry), 'MMM dd, HH:mm')}`
            : 'All current'
          }
          icon="pen"
          color={analytics.backlog.pendingEntry > 10 ? 'warning' : 'success'}
        />
        <MetricsCard
          title="Pending Validation"
          value={analytics.backlog.pendingValidation}
          subtitle={analytics.backlog.oldestPending.validation 
            ? `Oldest: ${format(new Date(analytics.backlog.oldestPending.validation), 'MMM dd, HH:mm')}`
            : 'All current'
          }
          icon="check-circle"
          color={analytics.backlog.pendingValidation > 10 ? 'warning' : 'success'}
        />
      </div>

      {/* Rejection Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MetricsCard
          title="Sample Rejection Rate"
          value={`${analytics.rejections.sampleRejections.rate.toFixed(1)}%`}
          subtitle={`${analytics.rejections.sampleRejections.total} samples rejected`}
          icon="warning"
          color={analytics.rejections.sampleRejections.rate < 5 ? 'success' : analytics.rejections.sampleRejections.rate < 10 ? 'warning' : 'danger'}
        />
        <MetricsCard
          title="Result Rejection Rate"
          value={`${analytics.rejections.resultRejections.rate.toFixed(1)}%`}
          subtitle={`${analytics.rejections.resultRejections.retestCount} retests, ${analytics.rejections.resultRejections.recollectCount} recollects`}
          icon="undo"
          color={analytics.rejections.resultRejections.rate < 5 ? 'success' : analytics.rejections.resultRejections.rate < 10 ? 'warning' : 'danger'}
        />
      </div>

      {/* Charts - First Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TATChart data={analytics.tat} />
        <VolumeChart data={analytics.volume} />
      </div>

      {/* Charts - Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RejectionChart data={analytics.rejections} />
        <ProductivityTable data={analytics.productivity} />
      </div>

      {/* Critical Values Detail */}
      {analytics.criticalValues.total > 0 && (
        <div className="bg-surface border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Critical Values by Test</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {analytics.criticalValues.byTest.slice(0, 6).map(test => (
              <div key={test.testCode} className="flex items-center justify-between p-3 bg-surface-hover rounded border border-border/50">
                <div>
                  <p className="text-sm font-medium text-text-primary">{test.testName}</p>
                  <p className="text-xs text-text-tertiary font-mono">{test.testCode}</p>
                </div>
                <span className="text-lg font-bold text-red-600">{test.count}</span>
              </div>
            ))}
          </div>
          {analytics.criticalValues.averageResponseTime > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-sm text-text-secondary">
                <span className="font-medium">Average Response Time:</span>{' '}
                {formatMinutes(analytics.criticalValues.averageResponseTime)}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Test Volume by Priority */}
      {Object.keys(analytics.volume.byPriority).length > 0 && (
        <div className="bg-surface border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Test Volume by Priority</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(analytics.volume.byPriority).map(([priority, count]) => (
              <div key={priority} className="flex items-center justify-between p-3 bg-surface-hover rounded border border-border/50">
                <div className="flex items-center gap-2">
                  <Icon name={ICONS.priority} className="w-4 h-4 text-text-tertiary" />
                  <span className="text-sm font-medium text-text-primary capitalize">{priority}</span>
                </div>
                <span className="text-lg font-bold text-brand">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
