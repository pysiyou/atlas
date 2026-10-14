/**
 * Report Table Configuration
 */

import type { MouseEvent } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import { Badge } from '@/components/primitives';
import { EntityId } from '@/components/display';
import type { TableViewConfig } from '@/components/data-table';
import { buildViews, COLUMN_SIZE } from '@/components/data-table';
import { ORDER_TABLE_COLUMN_HEADERS, renderOrderPatientName } from '@/features/orders';
import { renderDateTimeCell } from '@/utils/tableColumnRenders';
import type { ReportableOrder } from '../types';
import { ReportPreviewButton } from '../components/ReportPreviewButton';
import { ValidatedTestReportCard } from '../components/ValidatedTestReportCard';
import { getActiveOrderTests } from '../utils/prepareReportData';

const REPORT_VIEWS = {
  full: ['orderId', 'patientName', 'tests', 'orderDate', 'status', 'action'],
  medium: ['orderId', 'patientName', 'tests', 'status', 'action'],
  compact: ['patientName', 'tests', 'status', 'action'],
} as const;

function testsSummary(order: ReportableOrder): { names: string; codes: string } {
  const tests = getActiveOrderTests(order.order);
  return {
    names: tests.map(test => test.testName).join(', ') || `${order.activeTestCount} test(s)`,
    codes: tests.map(test => test.testCode).join(', '),
  };
}

function validationBadge(order: ReportableOrder) {
  const label = `${order.activeTestCount} tests · ${order.validatedTestCount} validated`;
  const variant =
    order.activeTestCount > 0 && order.validatedTestCount === order.activeTestCount
      ? 'success'
      : order.validatedTestCount > 0
        ? 'warning'
        : 'neutral';
  return <Badge variant={variant} label={label} size="xs" />;
}

export const createReportTableConfig = (
  navigate: NavigateFunction,
  _getPatientName: (patientId: number | string) => string,
  onPreview: (order: ReportableOrder) => void
): TableViewConfig<ReportableOrder> => {
  const columnMap = {
    orderId: {
      key: 'orderId',
      header: ORDER_TABLE_COLUMN_HEADERS.orderId,
      width: COLUMN_SIZE.sm,
      sortable: true,
      accessor: (order: ReportableOrder) => order.orderId,
      render: (order: ReportableOrder) => (
        <EntityId
          type="order"
          value={order.orderId}
          variant="clickable"
          as="button"
          onClick={(e: MouseEvent<HTMLElement>) => {
            e.stopPropagation();
            navigate(`/orders/${order.orderId}`);
          }}
        />
      ),
    },
    patientName: {
      key: 'patientName',
      header: 'Patient',
      width: COLUMN_SIZE.fill,
      sortable: true,
      accessor: (order: ReportableOrder) => order.patientName,
      render: (order: ReportableOrder) =>
        renderOrderPatientName(order.patientName, order.patientId),
    },
    tests: {
      key: 'tests',
      header: 'Tests',
      width: COLUMN_SIZE.fill,
      sortable: true,
      accessor: (order: ReportableOrder) => testsSummary(order).names,
      render: (order: ReportableOrder) => {
        const summary = testsSummary(order);
        return (
          <div className="min-w-0 font-normal">
            <div className="text-text-primary truncate font-normal">{summary.names}</div>
            {summary.codes && (
              <EntityId variant="secondary" className="truncate">{summary.codes}</EntityId>
            )}
          </div>
        );
      },
    },
    orderDate: {
      key: 'orderDate',
      header: 'Date',
      width: COLUMN_SIZE.md,
      sortable: true,
      accessor: (order: ReportableOrder) => order.orderDate,
      render: (order: ReportableOrder) => renderDateTimeCell(order.orderDate),
    },
    status: {
      key: 'status',
      header: 'Status',
      width: COLUMN_SIZE.md,
      render: (order: ReportableOrder) => validationBadge(order),
    },
    action: {
      key: 'action',
      header: 'Action',
      width: COLUMN_SIZE.md,
      render: (order: ReportableOrder) => (
        <div className="font-normal" onClick={e => e.stopPropagation()}>
          <ReportPreviewButton order={order} onPreview={onPreview} />
        </div>
      ),
    },
  };

  const CardComponent = (props: { item: ReportableOrder; index: number; onClick?: () => void }) => (
    <ValidatedTestReportCard {...props} onPreview={onPreview} />
  );

  return {
    ...buildViews(columnMap, REPORT_VIEWS, {
      medium: { status: 'sm' },
      compact: { status: 'sm' },
    }),
    CardComponent,
  };
};
