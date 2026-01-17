/**
 * Order Table Column Definitions
 * Column configuration for the order list table
 */

import type { NavigateFunction } from 'react-router-dom';
import { Badge, TableActionMenu, TableActionItem } from '@/shared/ui';
import { Eye, FileText } from 'lucide-react';
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
    sortable: true,
    render: (order: Order) => (
      <span className="text-xs text-sky-600 font-medium font-mono">{order.orderId}</span>
    ),
  },
  {
    key: 'patientName',
    header: 'Patient',
    sortable: true,
    render: (order: Order) => (
      <div>
        <div className="font-medium text-gray-900">{getPatientNameFn(order.patientId)}</div>
        <div className="text-xs text-gray-500">{order.patientId}</div>
      </div>
    ),
  },

  {
    key: 'tests',
    header: 'Tests',
    render: (order: Order) => (
      <div>
        <div className="font-medium">{order.tests.length} test{order.tests.length !== 1 ? 's' : ''}</div>
        <div className="text-xs text-gray-500">
          {order.tests.slice(0, 2).map(t => getTestNameFn(t.testCode)).join(', ')}
          {order.tests.length > 2 && ` +${order.tests.length - 2} more`}
        </div>
      </div>
    ),
  },
  {
    key: 'priority',
    header: 'Priority',
    width: 120,
    sortable: true,
    render: (order: Order) => (
      <Badge
        variant={order.priority}
        size="sm"
        className="border-none font-medium"
      >
        {order.priority.toUpperCase()}
      </Badge>
    ),
  },
  {
    key: 'overallStatus',
    header: 'Status',
    width: 150,
    sortable: true,
    render: (order: Order) => (
      <Badge
        variant={order.overallStatus}
        size="sm"
      >
        {order.overallStatus.replace('-', ' ').toUpperCase()}
      </Badge>
    ),
  },
  {
    key: 'totalPrice',
    header: 'Amount',
    width: 100,
    sortable: true,
    render: (order: Order) => (
      <div className="font-medium text-sky-600">{formatCurrency(order.totalPrice)}</div>
    ),
  },
  {
    key: 'paymentStatus',
    header: 'Payment',
    width: 120,
    sortable: true,
    render: (order: Order) => (
      <Badge
        variant={order.paymentStatus}
        size="sm"
      >
        {order.paymentStatus.toUpperCase()}
      </Badge>
    ),
  },
  {
    key: 'orderDate',
    header: 'Date',
    width: 100,
    sortable: true,
    render: (order: Order) => (
      <div className="text-xs text-gray-500">{formatDate(order.orderDate)}</div>
    ),
  },
  {
    key: 'actions',
    header: '',
    width: 50,
    className: 'overflow-visible !px-1',
    headerClassName: '!px-1',
    render: (order: Order) => (
      <TableActionMenu>
        <TableActionItem
          label="View Details"
          icon={<Eye size={16} />}
          onClick={() => navigate(`/orders/${order.orderId}`)}
        />
        <TableActionItem
          label="View Patient"
          icon={<FileText size={16} />}
          onClick={() => navigate(`/patients/${order.patientId}`)}
        />
      </TableActionMenu>
    ),
  },
];
