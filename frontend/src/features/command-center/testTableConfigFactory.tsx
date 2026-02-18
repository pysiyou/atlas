/**
 * Factory for Command Center test table config.
 * Uses TestWithContext — the canonical superset type for all lab workflow views.
 * Kept in a separate file so TestTableConfig.tsx only exports components (react-refresh).
 */
import type { NavigateFunction } from 'react-router-dom';
import { formatDate } from '@/utils';
import { displayId } from '@/utils';
import { Badge } from '@/components/ui';
import type { TableViewConfig } from '@/components/ui/Table';
import { DATA_ID_PRIMARY, DATA_ID_PRIMARY_CLICKABLE, DATA_ID_SECONDARY } from '@/utils/constants';
import type { TestWithContext } from '@/types';
import { TestTableCard } from './TestTableConfig';

export function createTestTableConfig(
  navigate: NavigateFunction,
  _getPatientName: (patientId: number | string) => string
): TableViewConfig<TestWithContext> {
  const renderTestId = (row: TestWithContext) => (
    <span className={`${DATA_ID_PRIMARY} font-normal`}>{displayId.orderTest(row.id as number)}</span>
  );

  const renderOrderId = (row: TestWithContext) => (
    <button
      type="button"
      onClick={e => {
        e.stopPropagation();
        navigate(`/orders/${row.orderId}`);
      }}
      className={`${DATA_ID_PRIMARY_CLICKABLE} font-normal`}
    >
      {displayId.order(row.orderId)}
    </button>
  );

  const renderPatientName = (row: TestWithContext) => (
    <div className="min-w-0 font-normal">
      <div className="text-text-primary truncate font-normal capitalize">{row.patientName}</div>
      <div className={`${DATA_ID_SECONDARY} font-normal`}>{displayId.patient(row.patientId)}</div>
    </div>
  );

  const renderTestName = (row: TestWithContext) => (
    <div className="min-w-0 font-normal">
      <div className="text-text-primary truncate font-normal">{row.testName}</div>
      <div className={`${DATA_ID_SECONDARY} font-normal`}>{row.testCode}</div>
    </div>
  );

  const renderOrderDate = (row: TestWithContext) => (
    <span className="text-xs text-text-tertiary truncate block font-normal">
      {formatDate(row.orderDate ?? '')}
    </span>
  );

  const renderStatus = (row: TestWithContext) => <Badge variant={row.status} size="sm" />;

  const renderPriority = (row: TestWithContext) => (
    <Badge variant={row.priority} size="sm" className="border-none" />
  );

  return {
    fullColumns: [
      { key: 'id', header: 'Test ID', width: 'sm', sortable: true, render: renderTestId },
      { key: 'orderId', header: 'Order ID', width: 'sm', sortable: true, render: renderOrderId },
      { key: 'testName', header: 'Test', width: 'fill', sortable: true, render: renderTestName },
      {
        key: 'patientName',
        header: 'Patient',
        width: 'fill',
        sortable: true,
        render: renderPatientName,
      },
      { key: 'priority', header: 'Priority', width: 'sm', sortable: true, render: renderPriority },
      { key: 'status', header: 'Status', width: 'md', sortable: true, render: renderStatus },
      { key: 'orderDate', header: 'Date', width: 'lg', sortable: true, render: renderOrderDate },
    ],
    mediumColumns: [
      { key: 'id', header: 'Test ID', width: 'sm', sortable: true, render: renderTestId },
      { key: 'testName', header: 'Test', width: 'fill', sortable: true, render: renderTestName },
      {
        key: 'patientName',
        header: 'Patient',
        width: 'fill',
        sortable: true,
        render: renderPatientName,
      },
      { key: 'priority', header: 'Priority', width: 'sm', sortable: true, render: renderPriority },
      { key: 'status', header: 'Status', width: 'sm', sortable: true, render: renderStatus },
      { key: 'orderDate', header: 'Date', width: 'lg', sortable: true, render: renderOrderDate },
    ],
    compactColumns: [
      { key: 'id', header: 'Test ID', width: 'sm', sortable: true, render: renderTestId },
      { key: 'testName', header: 'Test', width: 'fill', sortable: true, render: renderTestName },
      { key: 'priority', header: 'Priority', width: 'sm', sortable: true, render: renderPriority },
      { key: 'status', header: 'Status', width: 'sm', sortable: true, render: renderStatus },
      { key: 'orderDate', header: 'Date', width: 'md', sortable: true, render: renderOrderDate },
    ],
    CardComponent: TestTableCard,
  };
}
