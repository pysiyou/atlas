import type { NavigateFunction } from 'react-router-dom';
import { Badge } from '@/components';
import type { TableViewConfig } from '@/components';
import {
  createIdColumn,
  createBadgeColumn,
  renderOrderId,
  renderOrderPatientName,
  renderOrderTestsBlock,
  renderOrderTotalPrice,
  renderOrderDateCell,
} from '@/components/data-table';
import { getActiveTests } from '@/features/orders/utils';
import type { Order } from '@/types';
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
export const createOrderTableConfig = (
  _navigate: NavigateFunction,
  getPatientNameFn: (patientId: number | string) => string,
  _getTestNameFn: (testCode: string) => string
): TableViewConfig<Order> => {
  const renderPatientName = (order: Order) =>
    renderOrderPatientName(getPatientNameFn(order.patientId), order.patientId);

  const renderTests = (order: Order) =>
    renderOrderTestsBlock(getActiveTests(order.tests));

  const renderStatus = (order: Order) => <Badge variant={order.overallStatus} size="sm" />;

  const renderTotalPrice = (order: Order) => renderOrderTotalPrice(order.totalPrice);

  const renderPaymentStatus = (order: Order) => <Badge variant={order.paymentStatus} size="sm" />;

  const renderOrderDate = (order: Order) => renderOrderDateCell(order.orderDate);

  return {
    fullColumns: [
      createIdColumn<Order>('orderId', 'Order ID', order => renderOrderId(order.orderId), {
        sortable: true,
      }),
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
      createBadgeColumn<Order>('priority', 'Priority', order => (
        <Badge variant={order.priority} size="sm" className="border-none" />
      ), { sortable: true, width: 'sm' }),
      createBadgeColumn<Order>('overallStatus', 'Status', order => (
        <Badge variant={order.overallStatus} size="sm" />
      ), { sortable: true, width: 'md' }),
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
        width: 'lg',
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
        render: (order: Order) => renderOrderId(order.orderId),
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
        width: 'md',
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
        render: (order: Order) => renderOrderId(order.orderId),
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
        width: 'md',
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
