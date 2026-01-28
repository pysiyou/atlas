/**
 * PatientOrdersTable Component
 * Displays a table of patient orders
 */

import React from 'react';
import { Badge, EmptyState } from '@/shared/ui';
import { displayId } from '@/utils';
import type { Order } from '@/types/order';
import { formatDetailDate, formatOrderPrice } from '../utils/patient-formatters';
import { ICONS } from '@/utils';

export interface PatientOrdersTableProps {
  orders: Order[];
  onOrderClick: (orderId: string) => void;
  variant?: 'simple' | 'detailed';
}

export const PatientOrdersTable: React.FC<PatientOrdersTableProps> = ({
  orders,
  onOrderClick,
  variant = 'simple',
}) => {
  if (orders.length === 0) {
    return (
      <EmptyState
        icon={ICONS.dataFields.document}
        title="No Orders Found"
        description="This patient has no orders yet."
      />
    );
  }

  if (variant === 'simple') {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <tbody className="divide-y divide-gray-100">
            {orders.map(order => (
              <tr
                key={order.orderId}
                className="hover:bg-brand/5 transition-colors cursor-pointer"
                onClick={() => onOrderClick(String(order.orderId))}
              >
                <td className="px-3 py-3 text-brand font-medium font-mono">
                  {displayId.order(order.orderId)}
                </td>
                <td className="px-3 py-3 text-text-tertiary">
                  {formatDetailDate(order.orderDate, 'short')}
                </td>
                <td className="px-3 py-3">
                  <Badge variant={order.overallStatus} size="sm" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Detailed variant for large screens
  return (
    <table className="w-full text-left text-xs table-fixed">
      <colgroup>
        <col style={{ width: '10%' }} />
        <col style={{ width: '15%' }} />
        <col style={{ width: '25%' }} />
        <col style={{ width: '15%' }} />
        <col style={{ width: '15%' }} />
        <col style={{ width: '13%' }} />
      </colgroup>
      <tbody className="divide-y divide-gray-100">
        {orders.map(order => (
          <tr
            key={order.orderId}
            className="hover:bg-app-bg transition-colors cursor-pointer"
            onClick={() => onOrderClick(String(order.orderId))}
          >
            <td className="px-2 py-3 text-xs text-brand font-medium font-mono max-w-0">
              <span className="block truncate">{displayId.order(order.orderId)}</span>
            </td>
            <td className="px-2 py-3 text-xs text-text-tertiary max-w-0">
              <span className="block truncate">{formatDetailDate(order.orderDate, 'short')}</span>
            </td>
            <td className="px-2 py-3 max-w-0">
              <div className="min-w-0">
                <div className="font-medium truncate">
                  {order.tests.length} test{order.tests.length !== 1 ? 's' : ''}
                </div>
                <div className="text-xs text-text-tertiary truncate">
                  {order.tests
                    .slice(0, 2)
                    .map(t => t.testName || t.testCode)
                    .join(', ')}
                  {order.tests.length > 2 && ` +${order.tests.length - 2} more`}
                </div>
              </div>
            </td>
            <td className="px-2 py-3">
              <Badge variant={order.overallStatus} size="sm" />
            </td>
            <td className="px-2 py-3">
              <Badge variant={order.paymentStatus} size="sm" />
            </td>
            <td className="px-2 py-3 font-medium text-brand max-w-0">
              <span className="block truncate">{formatOrderPrice(order.totalPrice)}</span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
