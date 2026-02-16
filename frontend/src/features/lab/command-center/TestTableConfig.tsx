/**
 * Test Table Configuration - Multi-view table for Command Center test table.
 * Columns: Test ID, Order ID, Patient, Test, Priority, Status, Date (no report action).
 */
import type { NavigateFunction } from 'react-router-dom';
import { formatDate } from '@/utils';
import { displayId } from '@/utils';
import { Badge, Card, Avatar } from '@/shared/ui';
import type { TableViewConfig, CardComponentProps } from '@/shared/ui/Table';
import { DATA_ID_PRIMARY, DATA_ID_PRIMARY_CLICKABLE, DATA_ID_SECONDARY } from '@/shared/constants';
import type { LabTestRow } from './types';

function TestTableCard({ item: test, onClick }: CardComponentProps<LabTestRow>) {
  return (
    <Card padding="list" hover className="flex flex-col h-full" onClick={onClick}>
      <div className="flex justify-between items-start mb-3 pb-3 border-b border-border-default">
        <Avatar
          primaryText={test.patientName}
          primaryTextClassName="capitalize"
          secondaryText={displayId.orderTest(test.testId)}
          secondaryTextClassName="font-mono text-brand"
          size="xs"
        />
        <div className="flex items-center gap-1.5">
          <Badge variant={test.order.priority} size="xs" className="border-none" />
          <Badge variant={test.test.status} size="xs" />
        </div>
      </div>
      <div className="grow space-y-2">
        <div>
          <div className="text-text-primary text-sm">{test.testName}</div>
          <div className="text-xs text-brand font-mono">{test.testCode}</div>
        </div>
        <div className="text-xs text-text-tertiary">
          Order: <span className="font-mono">{displayId.order(test.orderId)}</span>
        </div>
      </div>
      <div className="mt-auto pt-3 text-xs text-text-tertiary">
        {formatDate(test.orderDate)}
      </div>
    </Card>
  );
}

export function createTestTableConfig(
  navigate: NavigateFunction,
  _getPatientName: (patientId: number | string) => string
): TableViewConfig<LabTestRow> {
  const renderTestId = (row: LabTestRow) => (
    <span className={`${DATA_ID_PRIMARY} font-normal`}>{displayId.orderTest(row.testId)}</span>
  );

  const renderOrderId = (row: LabTestRow) => (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        navigate(`/orders/${row.orderId}`);
      }}
      className={`${DATA_ID_PRIMARY_CLICKABLE} font-normal`}
    >
      {displayId.order(row.orderId)}
    </button>
  );

  const renderPatientName = (row: LabTestRow) => (
    <div className="min-w-0 font-normal">
      <div className="text-text-primary truncate font-normal capitalize">{row.patientName}</div>
      <div className={`${DATA_ID_SECONDARY} font-normal`}>{displayId.patient(row.patientId)}</div>
    </div>
  );

  const renderTestName = (row: LabTestRow) => (
    <div className="min-w-0 font-normal">
      <div className="text-text-primary truncate font-normal">{row.testName}</div>
      <div className={`${DATA_ID_SECONDARY} font-normal`}>{row.testCode}</div>
    </div>
  );

  const renderOrderDate = (row: LabTestRow) => (
    <span className="text-xs text-text-tertiary truncate block font-normal">
      {formatDate(row.orderDate)}
    </span>
  );

  const renderStatus = (row: LabTestRow) => (
    <Badge variant={row.test.status} size="sm" />
  );

  const renderPriority = (row: LabTestRow) => (
    <Badge variant={row.order.priority} size="sm" className="border-none" />
  );

  return {
    fullColumns: [
      { key: 'testId', header: 'Test ID', width: 'sm', sortable: true, render: renderTestId },
      { key: 'orderId', header: 'Order ID', width: 'sm', sortable: true, render: renderOrderId },
      { key: 'patientName', header: 'Patient', width: 'fill', sortable: true, render: renderPatientName },
      { key: 'testName', header: 'Test', width: 'fill', sortable: true, render: renderTestName },
      { key: 'priority', header: 'Priority', width: 'sm', sortable: true, render: renderPriority },
      { key: 'status', header: 'Status', width: 'md', sortable: true, render: renderStatus },
      { key: 'orderDate', header: 'Date', width: 'lg', sortable: true, render: renderOrderDate },
    ],
    mediumColumns: [
      { key: 'testId', header: 'Test ID', width: 'sm', sortable: true, render: renderTestId },
      { key: 'patientName', header: 'Patient', width: 'fill', sortable: true, render: renderPatientName },
      { key: 'testName', header: 'Test', width: 'fill', sortable: true, render: renderTestName },
      { key: 'priority', header: 'Priority', width: 'sm', sortable: true, render: renderPriority },
      { key: 'status', header: 'Status', width: 'sm', sortable: true, render: renderStatus },
      { key: 'orderDate', header: 'Date', width: 'lg', sortable: true, render: renderOrderDate },
    ],
    compactColumns: [
      { key: 'testId', header: 'Test ID', width: 'sm', sortable: true, render: renderTestId },
      { key: 'testName', header: 'Test', width: 'fill', sortable: true, render: renderTestName },
      { key: 'priority', header: 'Priority', width: 'sm', sortable: true, render: renderPriority },
      { key: 'status', header: 'Status', width: 'sm', sortable: true, render: renderStatus },
      { key: 'orderDate', header: 'Date', width: 'md', sortable: true, render: renderOrderDate },
    ],
    CardComponent: TestTableCard,
  };
}
