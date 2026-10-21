/**
 * Lab dashboard table — order tests updated today (UTC), newest first.
 */
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { EMPTY_COPY } from '@/components/display/emptyStateCopy';
import { DataTable } from '@/components/data-table';
import { Panel } from '@/components/surfaces/Panel';
import type { DashboardWorklistItem } from '../api/worklists';
import { useDashboardWorklistToday } from '../api/worklists';
import { getLabQueueUrlForTest } from '../utils/labSearchAndLinks';
import type { LabPipelineStage } from './monitorModel';
import type { PriorityLevel, TestStatus } from '@/types';
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
  doctorName: string | null;
  department: string | null;
  sampleType: string;
  priority: PriorityLevel;
  status: TestStatus;
  date: string;
  orderId: number;
  href: string;
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
    doctorName: item.referringPhysician ?? null,
    department: item.testCategory ?? null,
    sampleType: item.sampleType,
    priority: item.priority,
    status: item.status,
    date: item.activityAt,
    orderId: item.orderId,
    href:
      getLabQueueUrlForTest(
        {
          id: item.orderTestId,
          status: item.status,
          testCode: item.testCode,
          sampleId: null,
        },
        item.orderId
      ) ?? '',
    statusPresentation: item.statusPresentation ?? null,
  };
}

const viewConfig = createLabOrdersTableConfig();

export const LabOrdersTable: React.FC = () => {
  const navigate = useNavigate();
  const workToday = useDashboardWorklistToday({ pageSize: 200 });

  const rows = useMemo(() => workToday.items.map(mapWorkTodayRow), [workToday.items]);

  return (
    <Panel preset="lab.monitor.ordersTable">
      <DataTable<LabOrderTableRow>
        data={rows}
        viewConfig={viewConfig}
        embedded
        stickyHeader
        loading={workToday.isLoading}
        pagination={{ mode: 'none' }}
        getRowKey={row => row.id}
        onRowClick={row => navigate(row.href)}
        rowClassName={row =>
          cn(SPLIT_ROW_INTERACTIVE, getOrderTestLineageRowClass({ status: row.status }))
        }
        emptyMessage={EMPTY_COPY.dashboardWorklist.title}
        emptyDescription={EMPTY_COPY.dashboardWorklist.description}
        emptyVariant="dense"
        ariaLabel="Today's laboratory work"
      />
    </Panel>
  );
};
