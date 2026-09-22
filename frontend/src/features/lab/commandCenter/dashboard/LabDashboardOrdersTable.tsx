/**
 * Lab dashboard table — tests you collected, resulted, or validated today.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { EMPTY_COPY } from '@/components/display/emptyStateCopy';
import { EmptyState } from '@/components/display/EmptyState';
import { PANEL_EMPTY_STATE } from '@/components/display/emptyStatePresets';
import { DataTable } from '@/components/data-table';
import { Panel } from '@/components/surfaces/Panel';
import { DASHBOARD_ROW_INTERACTIVE } from '../dashboardStyles';
import type { LabDashboardOrderRow } from './dashboardOrders';
import { createLabDashboardOrdersTableConfig } from './LabDashboardOrdersTable.config';
import { useLabDashboardOrders } from './useLabDashboardOrders';

const viewConfig = createLabDashboardOrdersTableConfig();

const EMPTY_MESSAGE = (
  <EmptyState
    {...PANEL_EMPTY_STATE}
    title={EMPTY_COPY.dashboardWorklist.title}
    description={EMPTY_COPY.dashboardWorklist.description}
  />
);

export const LabDashboardOrdersTable: React.FC = () => {
  const navigate = useNavigate();
  const { rows, isLoading } = useLabDashboardOrders();

  return (
    <Panel hideHeader padding="none" className="h-full min-h-0">
      <DataTable<LabDashboardOrderRow>
        data={rows}
        viewConfig={viewConfig}
        embedded
        stickyHeader
        loading={isLoading}
        pagination={{ mode: 'none' }}
        getRowKey={row => row.id}
        onRowClick={row => navigate(row.href)}
        rowClassName={() => DASHBOARD_ROW_INTERACTIVE}
        emptyMessage={EMPTY_MESSAGE}
        ariaLabel="Today's laboratory work"
      />
    </Panel>
  );
};
