/**
 * Order Table Configuration
 *
 * Multi-view table configuration for order list.
 * Defines separate column sets for full table, compact table, and mobile card view.
 */

import type { NavigateFunction } from 'react-router-dom';
import { Badge } from '@/shared/ui';
import type { TableViewConfig } from '@/shared/ui/Table';
import { formatDate, formatCurrency } from '@/utils';
import { displayId } from '@/utils';
import type { Order } from '@/types';
import { DATA_AMOUNT, DATA_ID_PRIMARY, DATA_ID_SECONDARY } from '@/shared/constants';
import { OrderTableCard } from '../components/OrderTableCard';

/**
 * Create order table configuration with full, compact, and card views
 *
 * @param navigate - React Router navigate function
 * @param getPatientNameFn - Function to get patient name from patientId
 * @param getTestNameFn - Function to get test name from testCode
 * @param openModalFn - Function to open modal (optional, for edit action)
 * @returns TableViewConfig with fullColumns, compactColumns, and CardComponent
 */
// Large function is necessary to define multiple table column configurations (full, compact, card views) with render functions
// eslint-disable-next-line max-lines-per-function
export const createOrderTableConfig = (
  _navigate: NavigateFunction,
  getPatientNameFn: (patientId: number | string) => string,
  _getTestNameFn: (testCode: string) => string
): TableViewConfig<Order> => {
  // Shared render functions
  const renderOrderId = (order: Order) => (
    <span className={DATA_ID_PRIMARY}>{displayId.order(order.orderId)}</span>
  );

  const renderPatientName = (order: Order) => (
    <div className="min-w-0">
      <div className="text-fg truncate">
        {getPatientNameFn(order.patientId)}
      </div>
      <div className={DATA_ID_SECONDARY}>{displayId.patient(order.patientId)}</div>
    </div>
  );

  const renderTests = (order: Order) => {
    // Filter out superseded and removed tests - only count active tests
    const activeTests = order.tests.filter(t => t.status !== 'superseded' && t.status !== 'removed');
    const activeCount = activeTests.length;

    return (
      <div className="min-w-0">
        <div className="truncate font-mono text-xs text-fg">
          {activeTests.map(t => t.testCode).join('/')}
        </div>
        <div className="text-xs text-fg-subtle truncate">
          {activeCount} test{activeCount !== 1 ? 's' : ''}
        </div>
      </div>
    );
  };

  const renderPriority = (order: Order) => (
    <Badge variant={order.priority} size="sm" className="border-none" />
  );

  const renderStatus = (order: Order) => <Badge variant={order.overallStatus} size="sm" />;

  const renderTotalPrice = (order: Order) => (
    <div className={`${DATA_AMOUNT} truncate`}>{formatCurrency(order.totalPrice)}</div>
  );

  const renderPaymentStatus = (order: Order) => <Badge variant={order.paymentStatus} size="sm" />;

  const renderOrderDate = (order: Order) => (
    <div className="text-xs text-fg-subtle truncate">{formatDate(order.orderDate)}</div>
  );

  return {
    fullColumns: [
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
        key: 'tests',
        header: 'Tests',
        width: 'fill',
        render: renderTests,
      },
      {
        key: 'priority',
        header: 'Priority',
        width: 'sm',
        sortable: true,
        render: renderPriority,
      },
      {
        key: 'overallStatus',
        header: 'Status',
        width: 'sm',
        sortable: true,
        render: renderStatus,
      },
      {
        key: 'totalPrice',
        header: 'Amount',
        width: 'md',
        sortable: true,
        render: renderTotalPrice,
      },
      {
        key: 'paymentStatus',
        header: 'Payment',
        width: 'sm',
        sortable: true,
        render: renderPaymentStatus,
      },
      {
        key: 'orderDate',
        header: 'Date',
        width: 'md',
        sortable: true,
        render: renderOrderDate,
      },
    ],
    mediumColumns: [
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
        key: 'tests',
        header: 'Tests',
        width: 'fill',
        render: renderTests,
      },
      {
        key: 'overallStatus',
        header: 'Status',
        width: 'sm',
        sortable: true,
        render: renderStatus,
      },
      {
        key: 'totalPrice',
        header: 'Amount',
        width: 'md',
        sortable: true,
        render: renderTotalPrice,
      },
      {
        key: 'paymentStatus',
        header: 'Payment',
        width: 'sm',
        sortable: true,
        render: renderPaymentStatus,
      },
    ],
    compactColumns: [
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
        key: 'tests',
        header: 'Tests',
        width: 'fill',
        render: renderTests,
      },
      {
        key: 'overallStatus',
        header: 'Status',
        width: 'sm',
        sortable: true,
        render: renderStatus,
      },
      {
        key: 'totalPrice',
        header: 'Amount',
        width: 'md',
        sortable: true,
        render: renderTotalPrice,
      },
    ],
    CardComponent: OrderTableCard,
  };
};
