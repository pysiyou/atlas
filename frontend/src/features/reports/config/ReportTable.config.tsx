/**
 * Report Table Configuration
 */

import type { MouseEvent } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import { Badge, EntityId } from '@/components';
import type { TableViewConfig } from '@/components';
import { buildViews, renderDateTimeCell, renderOrderPatientName } from '@/components/data-table';
import type { ValidatedTest } from '../types';
import { ReportPreviewButton } from '../components/ReportPreviewButton';
import { ValidatedTestReportCard } from '../components/ValidatedTestReportCard';

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
        <EntityId type="orderTest" value={test.testId} variant="block" />
      ),
    },
    orderId: {
      key: 'orderId',
      header: 'Order ID',
      width: 'id' as const,
      sortable: true,
      accessor: (test: ValidatedTest) => test.orderId,
      render: (test: ValidatedTest) => (
        <EntityId
          type="order"
          value={test.orderId}
          variant="clickable"
          as="button"
          onClick={(e: MouseEvent<HTMLElement>) => {
            e.stopPropagation();
            navigate(`/orders/${test.orderId}`);
          }}
        />
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
          <EntityId variant="secondary" className="truncate">{test.testCode}</EntityId>
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
      render: () => <Badge variant="validated" size="xs" />,
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
