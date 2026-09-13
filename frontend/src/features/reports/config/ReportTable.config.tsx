/**
 * Report Table Configuration
 */

import type { NavigateFunction } from 'react-router-dom';
import { Badge } from '@/components';
import type { TableViewConfig } from '@/components';
import { buildViews, renderDateTimeCell, renderOrderPatientName } from '@/components/data-table';
import { displayId } from '@/utils';
import type { ValidatedTest } from '../types';
import { ENTITY_ID_BLOCK, ENTITY_ID_CLICKABLE, ENTITY_ID_SECONDARY } from '@/utils/constants';
import { ReportPreviewButton } from '../components/ReportPreviewButton';
import { ReportCard } from '../components/ReportCard';

const REPORT_VIEWS = {
  full: ['testId', 'orderId', 'patientName', 'testName', 'orderDate', 'status', 'action'],
  medium: ['testId', 'patientName', 'testName', 'status', 'action'],
  compact: ['testId', 'patientName', 'status', 'action'],
} as const;

export const createReportTableConfig = (
  navigate: NavigateFunction,
  _getPatientName: (patientId: number | string) => string,
  onPreview: (test: ValidatedTest) => void
): TableViewConfig<ValidatedTest> => {
  const columnMap = {
    testId: {
      key: 'testId',
      header: 'Test ID',
      width: 'id' as const,
      sortable: true,
      accessor: (test: ValidatedTest) => test.testId,
      render: (test: ValidatedTest) => (
        <span className={`${ENTITY_ID_BLOCK} font-normal`}>{displayId.orderTest(test.testId)}</span>
      ),
    },
    orderId: {
      key: 'orderId',
      header: 'Order ID',
      width: 'id' as const,
      sortable: true,
      accessor: (test: ValidatedTest) => test.orderId,
      render: (test: ValidatedTest) => (
        <button
          onClick={e => {
            e.stopPropagation();
            navigate(`/orders/${test.orderId}`);
          }}
          className={`${ENTITY_ID_CLICKABLE} font-normal`}
        >
          {displayId.order(test.orderId)}
        </button>
      ),
    },
    patientName: {
      key: 'patientName',
      header: 'Patient',
      width: 'fill' as const,
      sortable: true,
      accessor: (test: ValidatedTest) => test.patientName,
      render: (test: ValidatedTest) => renderOrderPatientName(test.patientName, test.patientId),
    },
    testName: {
      key: 'testName',
      header: 'Test',
      width: 'fill' as const,
      sortable: true,
      accessor: (test: ValidatedTest) => test.testName,
      render: (test: ValidatedTest) => (
        <div className="min-w-0 font-normal">
          <div className="text-text-primary truncate font-normal">{test.testName}</div>
          <div className={`${ENTITY_ID_SECONDARY} truncate font-normal`}>{test.testCode}</div>
        </div>
      ),
    },
    orderDate: {
      key: 'orderDate',
      header: 'Date',
      width: 'lg' as const,
      sortable: true,
      accessor: (test: ValidatedTest) => test.orderDate,
      render: (test: ValidatedTest) => renderDateTimeCell(test.orderDate),
    },
    status: {
      key: 'status',
      header: 'Status',
      width: 'md' as const,
      render: () => <Badge variant="validated" size="sm" />,
    },
    action: {
      key: 'action',
      header: 'Action',
      width: 'md' as const,
      render: (test: ValidatedTest) => (
        <div className="font-normal" onClick={e => e.stopPropagation()}>
          <ReportPreviewButton test={test} onPreview={onPreview} />
        </div>
      ),
    },
  };

  const CardComponent = (props: { item: ValidatedTest; index: number; onClick?: () => void }) => (
    <ReportCard {...props} onPreview={onPreview} />
  );

  return {
    ...buildViews(columnMap, REPORT_VIEWS, {
      medium: { status: 'sm' },
      compact: { status: 'sm' },
    }),
    CardComponent,
  };
};
