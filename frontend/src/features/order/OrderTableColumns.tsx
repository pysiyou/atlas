/**
 * Order Table Column Definitions
 * Column configuration for the order list table
 * 
 * Follows the standard pattern used across all table column definitions:
 * - Uses preset widths ('xs', 'sm', 'md', 'lg', 'fill')
 * - Specifies visibility using presets ('always', 'tablet', 'desktop', 'wide')
 * - Includes priority for mobile card view (lower = more important)
 * - Action column is sticky right, always visible, with highest priority number
 */

import type { NavigateFunction } from 'react-router-dom';
import { Badge, TableActionMenu, TableActionItem, Icon } from '@/shared/ui';
import type { ColumnConfig } from '@/shared/ui';
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
): ColumnConfig<Order>[] => [
  {
    key: 'orderId',
    header: 'Order ID',
    width: 'sm',
    sortable: true,
    visible: 'always',
    priority: 1,
    render: (order: Order) => (
      <span className="text-xs text-sky-600 font-medium font-mono truncate block">{order.orderId}</span>
    ),
  },
  {
    key: 'patientName',
    header: 'Patient',
    width: 'md',
    sortable: true,
    visible: 'always',
    priority: 2,
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
    width: 'md',
    visible: 'tablet',
    priority: 3,
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
    width: 'sm',
    sortable: true,
    visible: 'tablet',
    priority: 4,
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
    width: 'sm',
    sortable: true,
    visible: 'always',
    priority: 5,
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
    width: 'sm',
    align: 'right',
    sortable: true,
    visible: 'tablet',
    priority: 6,
    render: (order: Order) => (
      <div className="font-medium text-sky-600 truncate">{formatCurrency(order.totalPrice)}</div>
    ),
  },
  {
    key: 'paymentStatus',
    header: 'Payment',
    width: 'sm',
    sortable: true,
    visible: 'desktop',
    priority: 7,
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
    width: 'sm',
    sortable: true,
    visible: 'desktop',
    priority: 8,
    render: (order: Order) => (
      <div className="text-xs text-gray-500 truncate">{formatDate(order.orderDate)}</div>
    ),
  },
  {
    key: 'actions',
    header: '',
    width: 'xs',
    visible: 'always',
    sticky: 'right',
    priority: 999,
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
