/**
 * Lab dashboard table — tests you collected, resulted, or validated today.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { EMPTY_COPY } from '@/components/display/emptyStateCopy';
import { DataTable } from '@/components/data-table';
import { Panel } from '@/components/surfaces/Panel';
import { DASHBOARD_ROW_INTERACTIVE } from '../dashboardStyles';
import type { LabDashboardOrderRow } from './dashboardOrders';
import { createLabDashboardOrdersTableConfig } from './LabDashboardOrdersTable.config';
import { useLabDashboardOrders } from './useLabDashboardOrders';

const viewConfig = createLabDashboardOrdersTableConfig();

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
        emptyMessage={EMPTY_COPY.dashboardWorklist.title}
        emptyDescription={EMPTY_COPY.dashboardWorklist.description}
        emptyVariant="dense"
        ariaLabel="Today's laboratory work"
      />
    </Panel>
  );
};
