/**
 * Report Table Configuration
 */

import type { NavigateFunction } from 'react-router-dom';
import type { TableViewConfig } from '@/components/data-table';
import { buildViews, TABLE_COLUMN_WIDTH } from '@/components/data-table';
import { ORDER_TABLE_COLUMN_HEADERS, renderOrderPatientName } from '@/features/orders';
import { renderDateTimeCell } from '@/utils/tableColumnRenders';
import {
  formatReportOrderTestsPreview,
  formatReportValidationStatus,
  renderNavigableOrderId,
  renderReportableOrderTestsCell,
} from '@/utils/presentation';
import type { ReportableOrder } from '../types';
import { ReportPreviewButton } from '../components/ReportPreviewButton';
import { ReportPrintButton } from '../components/ReportPrintButton';
import { ValidatedTestReportCard } from '../components/ValidatedTestReportCard';
import { TABLE_TYPE } from '@/theme/recipes';

const REPORT_VIEWS = {
  full: ['orderId', 'patientName', 'tests', 'orderDate', 'status', 'action'],
  medium: ['orderId', 'patientName', 'tests', 'status', 'action'],
  compact: ['patientName', 'tests', 'status', 'action'],
} as const;

export const createReportTableConfig = (
  navigate: NavigateFunction,
  onPreview: (order: ReportableOrder) => void,
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
      header: 'Status',
      width: TABLE_COLUMN_WIDTH.compact,
      sortable: true,
      accessor: (order: ReportableOrder) => order.validatedTestCount,
      render: (order: ReportableOrder) => (
        <span className={`${TABLE_TYPE.cell} tabular-nums font-normal`}>
          {formatReportValidationStatus(order.validatedTestCount, order.activeTestCount)}
        </span>
      ),
    },
    action: {
      key: 'action',
      header: 'Action',
      width: TABLE_COLUMN_WIDTH.actionDual,
      render: (order: ReportableOrder) => (
        <div
          className="flex items-center justify-start gap-space-1 font-normal"
          onClick={e => e.stopPropagation()}
        >
          <ReportPreviewButton order={order} onPreview={onPreview} />
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
      onPreview={onPreview}
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
