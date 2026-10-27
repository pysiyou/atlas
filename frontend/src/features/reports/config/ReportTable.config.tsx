/**
 * Report Table Configuration
 */

import type { NavigateFunction } from 'react-router-dom';
import type { TableViewConfig } from '@/components/data-table';
import { buildViews, TABLE_COLUMN_WIDTH } from '@/components/data-table';
import {
  ORDER_TABLE_COLUMN_HEADERS,
  OrderStatusBadge,
  renderOrderPatientName,
} from '@/features/orders';
import { renderDateTimeCell } from '@/utils/tableColumnRenders';
import {
  formatReportOrderTestsPreview,
  renderNavigableOrderId,
  renderReportableOrderTestsCell,
} from '@/utils/presentation';
import type { ReportableOrder } from '../types';
import { ReportPrintButton } from '../components/ReportPrintButton';
import { ValidatedTestReportCard } from '../components/ValidatedTestReportCard';

const REPORT_VIEWS = {
  full: ['orderId', 'patientName', 'tests', 'orderDate', 'status', 'action'],
  medium: ['orderId', 'patientName', 'tests', 'status', 'action'],
  compact: ['patientName', 'tests', 'status', 'action'],
} as const;

export const createReportTableConfig = (
  navigate: NavigateFunction,
  onPrint: (order: ReportableOrder) => void,
  generatingOrderId: number | null
): TableViewConfig<ReportableOrder> => {
  const columnMap = {
    orderId: {
      key: 'orderId',
      header: ORDER_TABLE_COLUMN_HEADERS.orderId,
      width: TABLE_COLUMN_WIDTH.id,
      sortable: true,
      accessor: (order: ReportableOrder) => order.orderId,
      render: (order: ReportableOrder) => renderNavigableOrderId(order.orderId, navigate),
    },
    patientName: {
      key: 'patientName',
      header: 'Patient',
      width: TABLE_COLUMN_WIDTH.patientName,
      sortable: true,
      accessor: (order: ReportableOrder) => order.patientName,
      render: (order: ReportableOrder) =>
        renderOrderPatientName(order.patientName, {
          gender: order.patientGender,
          dateOfBirth: order.patientDob,
        }),
    },
    tests: {
      key: 'tests',
      header: 'Tests',
      width: TABLE_COLUMN_WIDTH.flex,
      sortable: true,
      accessor: (order: ReportableOrder) => formatReportOrderTestsPreview(order).names,
      render: (order: ReportableOrder) => renderReportableOrderTestsCell(order),
    },
    orderDate: {
      key: 'orderDate',
      header: 'Date',
      width: TABLE_COLUMN_WIDTH.datetime,
      sortable: true,
      accessor: (order: ReportableOrder) => order.orderDate,
      render: (order: ReportableOrder) => renderDateTimeCell(order.orderDate),
    },
    status: {
      key: 'status',
      header: ORDER_TABLE_COLUMN_HEADERS.overallStatus,
      width: TABLE_COLUMN_WIDTH.badgeWide,
      sortable: true,
      accessor: (order: ReportableOrder) => order.overallStatus,
      render: (order: ReportableOrder) => (
        <OrderStatusBadge
          status={order.overallStatus}
          presentation={order.statusPresentation}
          layout="compact"
          size="xs"
        />
      ),
    },
    action: {
      key: 'action',
      header: 'Action',
      width: TABLE_COLUMN_WIDTH.action,
      render: (order: ReportableOrder) => (
        <div
          className="flex items-center justify-start gap-space-1 font-normal"
          onClick={e => e.stopPropagation()}
        >
          <ReportPrintButton
            order={order}
            onPrint={onPrint}
            disabled={generatingOrderId === order.orderId}
          />
        </div>
      ),
    },
  };

  const CardComponent = (props: { item: ReportableOrder; index: number; onClick?: () => void }) => (
    <ValidatedTestReportCard
      {...props}
      onPrint={onPrint}
      generatingOrderId={generatingOrderId}
    />
  );

  return {
    ...buildViews(columnMap, REPORT_VIEWS, {
      medium: { status: 'xs' },
      compact: { status: 'xs' },
    }),
    CardComponent,
  };
};
