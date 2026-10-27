/**
 * Lab monitor table — union of tests updated today (UTC) and still-running pipeline tests.
 */
import React, { useCallback, useMemo } from 'react';
import { EMPTY_COPY } from '@/config/emptyStateCopy';
import { DataTable } from '@/components/data-table';
import { Panel } from '@/components/surfaces/Panel';
import type { DashboardWorklistItem } from '../api/worklists';
import { useDashboardWorklistToday } from '../api/worklists';
import { ModalType, useModal } from '@/lib/context/ModalContext';
import type { LabPipelineStage } from './monitorModel';
import type { Gender, PriorityLevel, TestStatus } from '@/types';
import type { StatusPresentation } from '@/types/labProjection';
import { cn } from '@/utils';
import { getOrderTestLineageRowClass } from '@/features/orders';
import { SPLIT_ROW_INTERACTIVE } from '@/theme/recipes';
import { createLabOrdersTableConfig } from './LabOrdersTable.config';

export interface LabOrderTableRow {
  id: string;
  stage: LabPipelineStage;
  testCode: string;
  testName: string;
  patientName: string;
  patientId: number;
  patientDob: string;
  patientGender: Gender;
  referentDoctorName: string | null;
  referentDoctorHospital: string | null;
  department: string | null;
  sampleType: string;
  priority: PriorityLevel;
  status: TestStatus;
  date: string;
  orderId: number;
  orderTestId: number;
  statusPresentation?: StatusPresentation | null;
}

function mapWorkTodayRow(item: DashboardWorklistItem): LabOrderTableRow {
  return {
    id: `today-${item.orderTestId}`,
    stage: item.stage,
    testCode: item.testCode,
    testName: item.testName,
    patientName: item.patientName,
    patientId: item.patientId,
    patientDob: item.patientDob,
    patientGender: item.patientGender,
    referentDoctorName: item.referentDoctorName ?? null,
    referentDoctorHospital: item.referentDoctorHospital ?? null,
    department: item.testCategory ?? null,
    sampleType: item.sampleType,
    priority: item.priority,
    status: item.status,
    date: item.activityAt,
    orderId: item.orderId,
    orderTestId: item.orderTestId,
    statusPresentation: item.statusPresentation ?? null,
  };
}

const viewConfig = createLabOrdersTableConfig();

const WORKLIST_LOADING_TABLE_ROWS = 8;
const WORKLIST_LOADING_TABLE_COLUMNS = 6;

export interface LabOrdersTableProps {
  /** Board snapshot loading — keeps worklist panel in sync with top row. */
  loading?: boolean;
}

export const LabOrdersTable: React.FC<LabOrdersTableProps> = ({ loading: boardLoading = false }) => {
  const { openModal } = useModal();
  const workToday = useDashboardWorklistToday({ pageSize: 200 });

  const rows = useMemo(() => workToday.items.map(mapWorkTodayRow), [workToday.items]);
  const worklistInitialLoad = workToday.isLoading && rows.length === 0;
  const panelLoading = boardLoading || worklistInitialLoad;

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
    <Panel
      preset="panel.pageEmbed.flushHeader"
      loading={panelLoading}
      loadingShape="table"
      loadingTableRows={WORKLIST_LOADING_TABLE_ROWS}
      loadingTableColumns={WORKLIST_LOADING_TABLE_COLUMNS}
    >
      <DataTable<LabOrderTableRow>
        data={rows}
        viewConfig={viewConfig}
        embedded
        stickyHeader
        loading={worklistInitialLoad && !boardLoading}
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
