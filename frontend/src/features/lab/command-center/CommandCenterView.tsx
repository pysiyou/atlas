/**
 * CommandCenterView - Lab Command Center 2-row layout (charts + timeline, test table).
 */

import React, { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrdersList, usePatientNameLookup } from '@/hooks/queries';
import { Table } from '@/shared/ui/Table';
import { ICONS } from '@/utils/icons';
import type { IconName } from '@/shared/ui';
import { useCommandCenterData } from './hooks';
import { buildLabTestRows } from './types';
import { createTestTableConfig } from './TestTableConfig';
import { ActivitiesTimeline, DonutChart } from './components';
import type { DonutChartSegment } from './components';

/** Lab workflow stage → icon (Sample Collection, Result Entry, Validation, Escalation). */
const STAGE_ICONS: Record<string, IconName> = {
  Sample: ICONS.dataFields.flask,
  Result: ICONS.dataFields.notebook,
  Validation: ICONS.ui.shieldCheck,
  Scalation: ICONS.actions.alertCircle,
};

const rowCellClass =
  'min-h-0 min-w-[180px] overflow-hidden border-border-default flex items-center justify-center border-r last:border-r-0';
const chartCellClass =
  'min-h-0 min-w-[240px] overflow-hidden border-border-default flex items-center justify-center border-r last:border-r-0';

const TEST_TABLE_LIMIT = 50;

export const CommandCenterView: React.FC = () => {
  const navigate = useNavigate();
  const { orders, isLoading: ordersLoading } = useOrdersList();
  const { getPatientName } = usePatientNameLookup();
  const {
    isLoading: commandCenterLoading,
    logs,
    distributionByStage,
  } = useCommandCenterData({ lastDays: 10, logsLimit: 50, logsHoursBack: 24 });

  const labTestRows = useMemo(
    () => buildLabTestRows(orders, getPatientName, TEST_TABLE_LIMIT),
    [orders, getPatientName]
  );

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
        <div className={`${chartCellClass} flex flex-col items-stretch justify-stretch p-2 min-w-0`}>
          <DonutChart
            title="Distribution by stage"
            subTitle="this year"
            valueLabel="tests"
            data={commandCenterLoading ? [] : distributionByStage}
            getItemIcon={getItemIcon}
          />
        </div>
        <div className={`${rowCellClass} flex min-w-0 flex-col items-stretch justify-stretch p-2 min-h-0`}>
          <div className="flex-1 min-h-0 min-w-0 flex flex-col">
            <ActivitiesTimeline logs={logs} isLoading={commandCenterLoading} className="w-full" />
          </div>
        </div>
      </div>
      {/* Row 2: single column - test table */}
      <div className="min-h-0 min-w-0 overflow-hidden flex flex-col">
        <div className="flex-1 min-h-0 min-w-0 flex flex-col p-2">
          <Table
            data={labTestRows}
            viewConfig={testTableConfig}
            getRowKey={(row) => row.testId}
            onRowClick={(row) => navigate(`/orders/${row.orderId}`)}
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
