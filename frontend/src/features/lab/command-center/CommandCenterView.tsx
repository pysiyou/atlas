/**
 * CommandCenterView - Lab Command Center 2-row layout (charts + timeline, test table).
 * Uses TestWithContext via useLabTestsFromOrders — the canonical superset for all lab views.
 */

import React, { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTestCatalog } from '@/features/catalog';
import { usePatientNameLookup } from '@/features/patients';
import { useOrdersList } from '@/features/orders';
import { Table } from '@/components';
import { ICONS } from '@/config/icons';
import type { IconName } from '@/components';
import { useCommandCenterData } from './useCommandCenterData';
import { createTestTableConfig } from './TestTableConfigFactory';
import { ActivitiesTimeline } from './ActivitiesTimeline';
import { DonutChart } from './DonutChart';
import { DonutChartSkeleton } from './DonutChartSkeleton';
import type { DonutChartSegment } from './donutChartUtils';
import { useLabTestsFromOrders } from '@/features/lab/hooks';

/** Lab pipeline stage (active tests) → icon. */
const STAGE_ICONS: Record<string, IconName> = {
  Collection: ICONS.dataFields.clock,
  Results: ICONS.dataFields.flask,
  Validation: ICONS.dataFields.notebook,
  Escalation: ICONS.ui.shieldCheck,
};

const rowCellClass =
  'min-h-0 min-w-[180px] overflow-hidden border-border-default flex items-center justify-center border-r last:border-r-0';
const chartCellClass =
  'min-h-0 min-w-[240px] overflow-hidden border-border-default flex items-center justify-center border-r last:border-r-0';

const TEST_TABLE_LIMIT = 50;

// All statuses that represent active tests in the pipeline
const ALL_ACTIVE_STATUSES = [
  'pending',
  'sample-collected',
  'resulted',
  'escalated',
] as const;

export const CommandCenterView: React.FC = () => {
  const navigate = useNavigate();
  const { orders, isLoading: ordersLoading } = useOrdersList();
  const { tests: testCatalog } = useTestCatalog();
  const { getPatientName } = usePatientNameLookup();
  const {
    isLoading: commandCenterLoading,
    logs,
    distributionByStage,
    logsError,
    logsErrorDetail,
    refetchLogs,
    logsHasMore,
    logsLoadMore,
    logsLoadingMore,
  } = useCommandCenterData({ logsLimit: 50, logsHoursBack: 24 });

  // Build test rows using the canonical superset hook — no separate LabTestRow type needed
  const allLabTests = useLabTestsFromOrders({
    orders,
    testCatalog,
    statusFilter: ALL_ACTIVE_STATUSES as unknown as import('@/types').TestStatus[],
  });

  // Sort by orderDate desc, then orderId/id; limit to TEST_TABLE_LIMIT
  const labTestRows = useMemo(() => {
    return [...allLabTests]
      .sort((a, b) => {
        const d = new Date(b.orderDate ?? '').getTime() - new Date(a.orderDate ?? '').getTime();
        if (d !== 0) return d;
        if (a.orderId !== b.orderId) return b.orderId - a.orderId;
        return ((b.id as number) ?? 0) - ((a.id as number) ?? 0);
      })
      .slice(0, TEST_TABLE_LIMIT);
  }, [allLabTests]);

  const testTableConfig = useMemo(
    () => createTestTableConfig(navigate, getPatientName),
    [navigate, getPatientName]
  );

  const getItemIcon = useCallback((item: DonutChartSegment) => STAGE_ICONS[item.name], []);

  return (
    <div
      className="flex-1 min-h-0 min-w-[720px] overflow-hidden grid"
      style={{ gridTemplateRows: '4fr 6fr' }}
    >
      {/* Row 1: pie chart col 1, timeline col 2 */}
      <div
        className="min-h-0 min-w-0 overflow-hidden border-b border-border-default grid"
        style={{ gridTemplateColumns: '1fr 1fr' }}
      >
        <div
          className={`${chartCellClass} flex flex-col items-stretch justify-stretch p-2 min-w-0`}
        >
          {commandCenterLoading ? (
            <DonutChartSkeleton />
          ) : (
            <DonutChart
              title="Lab pipeline"
              subTitle="active"
              valueLabel="tests"
              data={distributionByStage}
              getItemIcon={getItemIcon}
            />
          )}
        </div>
        <div
          className={`${rowCellClass} flex min-w-0 flex-col items-stretch justify-stretch p-2 min-h-0`}
        >
          <div className="flex-1 min-h-0 min-w-0 flex flex-col">
            <ActivitiesTimeline
              logs={logs}
              isLoading={commandCenterLoading}
              isError={logsError}
              error={logsErrorDetail}
              onRetry={refetchLogs}
              hasMore={logsHasMore}
              onLoadMore={logsLoadMore}
              isLoadingMore={logsLoadingMore}
              className="w-full"
            />
          </div>
        </div>
      </div>
      {/* Row 2: single column - test table */}
      <div className="min-h-0 min-w-0 overflow-hidden flex flex-col">
        <div className="flex-1 min-h-0 min-w-0 flex flex-col p-2">
          <Table
            data={labTestRows}
            viewConfig={testTableConfig}
            getRowKey={row => `${row.orderId}-${row.testCode}-${row.id ?? ''}`}
            onRowClick={row => navigate(`/orders/${row.orderId}`)}
            embedded
            striped
            stickyHeader
            maxHeight="100%"
            loading={ordersLoading}
            emptyMessage="No tests"
            ariaLabel="Lab tests"
          />
        </div>
      </div>
    </div>
  );
};
