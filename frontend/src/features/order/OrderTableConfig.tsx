/**
 * Order Table Configuration
 * 
 * Multi-view table configuration for order list.
 * Defines separate column sets for full table, compact table, and mobile card view.
 */

import type { NavigateFunction } from 'react-router-dom';
import { Badge, TableActionMenu, TableActionItem, Icon } from '@/shared/ui';
import type { TableViewConfig, ColumnConfig } from '@/shared/ui/Table';
import { formatDate, formatCurrency } from '@/utils';
import type { Order } from '@/types';
import { OrderTableCard } from './OrderTableCard';

/**
 * Create order table configuration with full, compact, and card views
 * 
 * @param navigate - React Router navigate function
 * @param getPatientNameFn - Function to get patient name from patientId
 * @param getTestNameFn - Function to get test name from testCode
 * @returns TableViewConfig with fullColumns, compactColumns, and CardComponent
 */
export const createOrderTableConfig = (
  navigate: NavigateFunction,
  getPatientNameFn: (patientId: string) => string,
  getTestNameFn: (testCode: string) => string
): TableViewConfig<Order> => {
  // Shared render functions
  const renderOrderId = (order: Order) => (
    <span className="text-xs text-sky-600 font-medium font-mono truncate block">
      {order.orderId}
    </span>
  );

  const renderPatientName = (order: Order) => (
    <div className="min-w-0">
      <div className="font-semibold text-gray-900 truncate">{getPatientNameFn(order.patientId)}</div>
      <div className="text-xxs text-gray-500 truncate">{order.patientId}</div>
    </div>
  );

  const renderTests = (order: Order) => {
    // Filter out superseded tests - only count active tests
    const activeTests = order.tests.filter(t => t.status !== 'superseded');
    const activeCount = activeTests.length;
    
    return (
      <div className="min-w-0">
        <div className="font-medium truncate">{activeCount} test{activeCount !== 1 ? 's' : ''}</div>
        <div className="text-xs text-gray-500 truncate">
          {activeTests.slice(0, 2).map(t => getTestNameFn(t.testCode)).join(', ')}
          {activeCount > 2 && ` +${activeCount - 2} more`}
        </div>
      </div>
    );
  };

  const renderPriority = (order: Order) => (
    <Badge
      variant={order.priority}
      size="sm"
      className="border-none font-medium"
    />
  );

  const renderStatus = (order: Order) => (
    <Badge
      variant={order.overallStatus}
      size="sm"
    />
  );

  const renderTotalPrice = (order: Order) => (
    <div className="font-medium text-sky-600 truncate">
      {formatCurrency(order.totalPrice)}
    </div>
  );

  const renderPaymentStatus = (order: Order) => (
    <Badge
      variant={order.paymentStatus}
      size="sm"
    />
  );

  const renderOrderDate = (order: Order) => (
    <div className="text-xs text-gray-500 truncate">
      {formatDate(order.orderDate)}
    </div>
  );

  const renderActions = (order: Order) => (
    <TableActionMenu>
      <TableActionItem
        label="View Details"
        icon={<Icon name="eye" className="w-4 h-4" />}
        onClick={() => navigate(`/orders/${order.orderId}`)}
      />
      <TableActionItem
        label="View Patient"
        icon={<Icon name="user" className="w-4 h-4" />}
        onClick={() => navigate(`/patients/${order.patientId}`)}
      />
    </TableActionMenu>
  );

  return {
    fullColumns: [
      {
        key: 'orderId',
        header: 'Order ID',
        width: 'fill',
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
        width: 'sm',
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
        width: 'sm',
        sortable: true,
        render: renderOrderDate,
      },
      {
        key: 'actions',
        header: '',
        width: 'xs',
        sticky: 'right',
        className: 'overflow-visible !px-1',
        headerClassName: '!px-1',
        render: renderActions,
      },
    ],
    mediumColumns: [
      {
        key: 'orderId',
        header: 'Order ID',
        width: 'fill',
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
        width: 'sm',
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
        key: 'actions',
        header: '',
        width: 'xs',
        sticky: 'right',
        className: 'overflow-visible !px-1',
        headerClassName: '!px-1',
        render: renderActions,
      },
    ],
    compactColumns: [
      {
        key: 'orderId',
        header: 'Order ID',
        width: 'fill',
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
        key: 'overallStatus',
        header: 'Status',
        width: 'sm',
        sortable: true,
        render: renderStatus,
      },
      {
        key: 'totalPrice',
        header: 'Amount',
        width: 'sm',
        sortable: true,
        render: renderTotalPrice,
      },
      {
        key: 'actions',
        header: '',
        width: 'xs',
        sticky: 'right',
        className: 'overflow-visible !px-1',
        headerClassName: '!px-1',
        render: renderActions,
      },
    ],
    CardComponent: OrderTableCard,
  };
};
