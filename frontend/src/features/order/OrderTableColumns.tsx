/**
 * Order Table Column Definitions
 * Column configuration for the order list table
 */

import type { NavigateFunction } from 'react-router-dom';
import { Badge, TableActionMenu, TableActionItem, Icon } from '@/shared/ui';
import { formatDate, formatCurrency } from '@/utils';
import type { Order } from '@/types';

/**
 * Generate table column definitions for order list
 * @param navigate - React Router navigate function
 * @param getPatientNameFn - Function to get patient name from patientId
 * @param getTestNameFn - Function to get test name from testCode
 * @returns Array of column definitions
 */
export const getOrderTableColumns = (
  navigate: NavigateFunction,
  getPatientNameFn: (patientId: string) => string,
  getTestNameFn: (testCode: string) => string
) => [
  {
    key: 'orderId',
    header: 'Order ID',
    width: '14%',
    sortable: true,
    render: (order: Order) => (
      <span className="text-xs text-sky-600 font-medium font-mono truncate block">{order.orderId}</span>
    ),
  },
  {
    key: 'patientName',
    header: 'Patient',
    width: '17%',
    sortable: true,
    render: (order: Order) => (
      <div className="min-w-0">
        <div className="font-semibold text-gray-900 truncate">{getPatientNameFn(order.patientId)}</div>
        <div className="text-xxs text-gray-500 truncate">{order.patientId}</div>
      </div>
    ),
  },
  {
    key: 'tests',
    header: 'Tests',
    width: '14%',
    render: (order: Order) => {
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
    },
  },
  {
    key: 'priority',
    header: 'Priority',
    width: '10%',
    sortable: true,
    render: (order: Order) => (
      <Badge
        variant={order.priority}
        size="sm"
        className="border-none font-medium"
      />
    ),
  },
  {
    key: 'overallStatus',
    header: 'Status',
    width: '10%',
    sortable: true,
    render: (order: Order) => (
      <Badge
        variant={order.overallStatus}
        size="sm"
      />
    ),
  },
  {
    key: 'totalPrice',
    header: 'Amount',
    width: '10%',
    sortable: true,
    render: (order: Order) => (
      <div className="font-medium text-sky-600 truncate">{formatCurrency(order.totalPrice)}</div>
    ),
  },
  {
    key: 'paymentStatus',
    header: 'Payment',
    width: '10%',
    sortable: true,
    render: (order: Order) => (
      <Badge
        variant={order.paymentStatus}
        size="sm"
      />
    ),
  },
  {
    key: 'orderDate',
    header: 'Date',
    width: '10%',
    sortable: true,
    render: (order: Order) => (
      <div className="text-xs text-gray-500 truncate">{formatDate(order.orderDate)}</div>
    ),
  },
  {
    key: 'actions',
    header: '',
    width: '3%',
    className: 'overflow-visible !px-1',
    headerClassName: '!px-1',
    render: (order: Order) => (
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
    ),
  },
];
