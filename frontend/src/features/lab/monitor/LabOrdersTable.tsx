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
import { getLabQueueUrl } from '../constants/labConstants';
import type { LabPipelineStage } from './monitorModel';
import type { PriorityLevel, TestStatus } from '@/types';
import { displayId } from '@/utils';
import { MONITOR_ROW_INTERACTIVE } from './monitorStyles';
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
  blockedLabel?: string | null;
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
    href: getLabQueueUrl(item.stage, { search: displayId.order(item.orderId) }),
    blockedLabel: item.blockedLabel,
  };
}

const viewConfig = createLabOrdersTableConfig();

export const LabOrdersTable: React.FC = () => {
  const navigate = useNavigate();
  const workToday = useDashboardWorklistToday({ pageSize: 200 });

  const rows = useMemo(
    () => workToday.items.map(mapWorkTodayRow),
    [workToday.items],
  );

  return (
    <Panel
      hideHeader
      padding="none"
      className="h-full min-h-0"
      bodyClassName="flex min-h-0 flex-1 flex-col"
    >
      <DataTable<LabOrderTableRow>
        data={rows}
        viewConfig={viewConfig}
        embedded
        stickyHeader
        loading={workToday.isLoading}
        pagination={{ mode: 'none' }}
        getRowKey={row => row.id}
        onRowClick={row => navigate(row.href)}
        rowClassName={() => MONITOR_ROW_INTERACTIVE}
        emptyMessage={EMPTY_COPY.dashboardWorklist.title}
        emptyDescription={EMPTY_COPY.dashboardWorklist.description}
        emptyVariant="dense"
        ariaLabel="Today's laboratory work"
      />
    </Panel>
  );
};
