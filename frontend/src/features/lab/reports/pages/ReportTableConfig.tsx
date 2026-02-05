/**
 * Report Table Configuration
 *
 * Multi-view table configuration for report list.
 * Defines separate column sets for full table, compact table, and mobile card view.
 * Each row represents a single validated test ready for reporting.
 */

import type { NavigateFunction } from 'react-router-dom';
import { formatDate } from '@/utils';
import { displayId } from '@/utils';
import { Badge } from '@/shared/ui';
import type { TableViewConfig } from '@/shared/ui/Table';
import type { ValidatedTest } from '../types';
import { DATA_ID_PRIMARY, DATA_ID_PRIMARY_CLICKABLE, DATA_ID_SECONDARY } from '@/shared/constants';
import { ReportPreviewButton } from '../components/ReportPreviewButton';
import { ReportCard } from '../components/ReportCard';

/**
 * Create report table configuration with full, compact, and card views
 *
 * @param navigate - React Router navigate function
 * @param getPatientName - Function to get patient name from patientId (unused, kept for compatibility)
 * @param onPreview - Callback to invoke when preview button is clicked
 * @returns TableViewConfig with fullColumns, compactColumns, and CardComponent
 */
// Large function is necessary to define multiple table column configurations (full, compact, card views) with render functions
// eslint-disable-next-line max-lines-per-function
export const createReportTableConfig = (
  navigate: NavigateFunction,
  _getPatientName: (patientId: number | string) => string,
  onPreview: (test: ValidatedTest) => void
): TableViewConfig<ValidatedTest> => {
  // Shared render functions
  const renderTestId = (test: ValidatedTest) => (
    <span className={DATA_ID_PRIMARY}>{displayId.orderTest(test.testId)}</span>
  );

  const renderOrderId = (test: ValidatedTest) => (
    <button
      onClick={e => {
        e.stopPropagation();
        navigate(`/orders/${test.orderId}`);
      }}
      className={DATA_ID_PRIMARY_CLICKABLE}
    >
      {displayId.order(test.orderId)}
    </button>
  );

  const renderPatientName = (test: ValidatedTest) => (
    <div className="min-w-0">
      <div className="text-text truncate">{test.patientName}</div>
      <div className={DATA_ID_SECONDARY}>{displayId.patient(test.patientId)}</div>
    </div>
  );

  const renderTestName = (test: ValidatedTest) => (
    <div className="min-w-0">
      <div className="text-text truncate">{test.testName}</div>
      <div className={DATA_ID_SECONDARY}>{test.testCode}</div>
    </div>
  );

  const renderOrderDate = (test: ValidatedTest) => (
    <span className="text-xs text-text-3 truncate block">{formatDate(test.orderDate)}</span>
  );

  const renderStatus = () => <Badge variant="validated" size="sm" />;

  const renderAction = (test: ValidatedTest) => (
    <div onClick={e => e.stopPropagation()}>
      <ReportPreviewButton test={test} onPreview={onPreview} />
    </div>
  );

  // Create custom card component with onPreview prop
  const CardComponent = (props: { item: ValidatedTest; index: number; onClick?: () => void }) => (
    <ReportCard {...props} onPreview={onPreview} />
  );

  return {
    fullColumns: [
      {
        key: 'testId',
        header: 'Test ID',
        width: 'sm',
        sortable: true,
        render: renderTestId,
      },
      {
        key: 'orderId',
        header: 'Order ID',
        width: 'sm',
        sortable: true,
        render: renderOrderId,
      },
      {
        key: 'patientName',
        header: 'Patient',
        width: 'fill',
        sortable: true,
        render: renderPatientName,
      },
      {
        key: 'testName',
        header: 'Test',
        width: 'fill',
        sortable: true,
        render: renderTestName,
      },
      {
        key: 'orderDate',
        header: 'Date',
        width: 'md',
        sortable: true,
        render: renderOrderDate,
      },
      {
        key: 'status',
        header: 'Status',
        width: 'md',
        sortable: true,
        render: renderStatus,
      },
      {
        key: 'action',
        header: 'Action',
        width: 'md',
        render: renderAction,
      },
    ],
    mediumColumns: [
      {
        key: 'testId',
        header: 'Test ID',
        width: 'sm',
        sortable: true,
        render: renderTestId,
      },
      {
        key: 'patientName',
        header: 'Patient',
        width: 'fill',
        sortable: true,
        render: renderPatientName,
      },
      {
        key: 'testName',
        header: 'Test',
        width: 'fill',
        sortable: true,
        render: renderTestName,
      },
      {
        key: 'status',
        header: 'Status',
        width: 'sm',
        sortable: true,
        render: renderStatus,
      },
      {
        key: 'action',
        header: 'Action',
        width: 'md',
        render: renderAction,
      },
    ],
    compactColumns: [
      {
        key: 'testId',
        header: 'Test ID',
        width: 'sm',
        sortable: true,
        render: renderTestId,
      },
      {
        key: 'patientName',
        header: 'Patient',
        width: 'fill',
        sortable: true,
        render: renderPatientName,
      },
      {
        key: 'status',
        header: 'Status',
        width: 'sm',
        sortable: true,
        render: renderStatus,
      },
      {
        key: 'action',
        header: 'Action',
        width: 'md',
        render: renderAction,
      },
    ],
    CardComponent,
  };
};
