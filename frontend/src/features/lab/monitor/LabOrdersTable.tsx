/**
 * Lab monitor table — union of tests updated today (UTC) and still-running pipeline tests.
 */
import React, { useCallback, useMemo } from 'react';
import { EMPTY_COPY } from '@/config/emptyStateCopy';
import { DataTable } from '@/components/data-table';
import { Panel } from '@/components/surfaces/Panel';
import { useDashboardWorklistToday } from '../api/worklists';
import { ModalType, useModal } from '@/lib/context/ModalContext';
import { cn } from '@/utils';
import { getOrderTestLineageRowClass } from '@/features/orders';
import { SPLIT_ROW_INTERACTIVE } from '@/theme/recipes';
import { createLabOrdersTableConfig } from './LabOrdersTable.config';
import { mapDashboardWorklistRow } from './labOrderTableRow';
import type { LabOrderTableRow } from './LabOrdersTable.types';

const viewConfig = createLabOrdersTableConfig();

export const LabOrdersTable: React.FC = () => {
  const { openModal } = useModal();
  const workToday = useDashboardWorklistToday({ pageSize: 200 });

  const rows = useMemo(() => workToday.items.map(mapDashboardWorklistRow), [workToday.items]);
  const tableReady = !workToday.isLoading || rows.length > 0;

  const handleRowClick = useCallback(
    (row: LabOrderTableRow) => {
      openModal({
        type: ModalType.TEST_DETAIL,
        orderTestId: row.orderTestId,
        interaction: 'view',
      });
    },
    [openModal],
  );

  return (
    <Panel preset="panel.pageEmbed.flushHeader">
      <DataTable<LabOrderTableRow>
        data={rows}
        viewConfig={viewConfig}
        embedded
        stickyHeader
        loading={!tableReady}
        pagination={{ mode: 'none' }}
        getRowKey={row => row.id}
        onRowClick={handleRowClick}
        rowClassName={row =>
          cn(SPLIT_ROW_INTERACTIVE, getOrderTestLineageRowClass({ status: row.status }))
        }
        emptyMessage={EMPTY_COPY.dashboardWorklist.title}
        emptyDescription={EMPTY_COPY.dashboardWorklist.description}
        emptyVariant="dense"
        ariaLabel="Lab monitor worklist"
      />
    </Panel>
  );
};
