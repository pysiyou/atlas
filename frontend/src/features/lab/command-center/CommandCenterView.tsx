/**
 * CommandCenterView - Lab operational dashboard.
 */

import React, { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table } from '@/components';
import { FilterBar, type FilterValues } from '@/components/filters';
import { getLabTabPath } from '@/features/lab/constants/labTabs';
import { entryFilterConfig } from '@/features/lab/constants/workflow';
import { getTabForDistributionStage } from './pipeline';
import {
  useCommandCenterLogs,
  useCommandCenterOverview,
  useCommandCenterTests,
} from './useCommandCenter';
import { createCommandCenterTableConfig } from './config/CommandCenterTable.config';
import { ActivitiesTimeline } from './ActivitiesTimeline';
import { PipelineChart, PipelineChartSkeleton } from './PipelineChart';
import { PipelineQueueBar } from './PipelineQueueBar';

export const CommandCenterView: React.FC = () => {
  const navigate = useNavigate();
  const overview = useCommandCenterOverview();
  const { rows, searchQuery, setSearchQuery, isLoading: testsLoading } = useCommandCenterTests();
  const {
    logs,
    isLoading: logsLoading,
    isError: logsError,
    error: logsErrorDetail,
    refetchLogs,
    hasMore,
    loadMore,
    isLoadingMore,
  } = useCommandCenterLogs({ limit: 50, hoursBack: 24 });

  const testTableConfig = useMemo(() => createCommandCenterTableConfig(navigate), [navigate]);
  const filterValues = useMemo<FilterValues>(() => ({ searchQuery }), [searchQuery]);

  const handleStageClick = useCallback(
    (name: string) => {
      const tab = getTabForDistributionStage(name);
      if (tab) navigate(getLabTabPath(tab));
    },
    [navigate]
  );

  return (
    <div className="flex-1 min-h-0 min-w-0 overflow-hidden flex flex-col">
      <PipelineQueueBar overview={overview} />

      <div className="min-h-0 flex-1 overflow-hidden grid" style={{ gridTemplateRows: '2fr 3fr' }}>
        <div className="min-h-0 overflow-hidden border-b border-border-default grid grid-cols-1 lg:grid-cols-2">
          <div className="min-h-0 p-2 border-b lg:border-b-0 lg:border-r border-border-default">
            {overview.isLoading ? (
              <PipelineChartSkeleton />
            ) : (
              <PipelineChart
                data={overview.distribution}
                onStageClick={handleStageClick}
              />
            )}
          </div>
          <div className="min-h-0 p-2">
            <ActivitiesTimeline
              logs={logs}
              isLoading={logsLoading}
              isError={logsError}
              error={logsErrorDetail}
              onRetry={refetchLogs}
              hasMore={hasMore}
              onLoadMore={loadMore}
              isLoadingMore={isLoadingMore}
            />
          </div>
        </div>

        <div className="min-h-0 overflow-hidden flex flex-col">
          <FilterBar
            config={entryFilterConfig}
            value={filterValues}
            onChange={filters => {
              if (filters.searchQuery !== undefined) setSearchQuery(filters.searchQuery as string);
            }}
          />
          <div className="flex-1 min-h-0 p-2">
            <Table
              data={rows}
              viewConfig={testTableConfig}
              getRowKey={row => `${row.orderId}-${row.testCode}-${row.id ?? ''}`}
              onRowClick={row => navigate(`/orders/${row.orderId}`)}
              embedded
              striped
              pagination={false}
              loading={testsLoading}
              emptyMessage="No tests"
              ariaLabel="Lab tests"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
