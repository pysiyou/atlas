/**
 * OrderInfoSection Component
 * Displays order information
 */

import React from 'react';
import { Badge } from '@/shared/ui';
import { displayId } from '@/utils/id-display';
import type { Order } from '@/types';
import { OrderInfoField } from './OrderInfoField';
import { formatOrderDate } from '../../utils/orderDetailUtils';
import { getDataFieldIcon, getPriorityIcon, getOrderStatusIcon } from '@/utils/icon-helpers';

export interface OrderInfoSectionProps {
  order: Order;
  layout?: 'grid' | 'column';
}

export const OrderInfoSection: React.FC<OrderInfoSectionProps> = ({ order, layout = 'column' }) => {
  const containerClass =
    layout === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 gap-5' : 'flex flex-col gap-3';

  return (
    <div className={containerClass}>
      <OrderInfoField
        icon={getDataFieldIcon('orderId')}
        label="Order ID"
        value={<span className="font-mono text-brand">{displayId.order(order.orderId)}</span>}
      />
      <OrderInfoField
        icon={getDataFieldIcon('orderDate')}
        label="Order Date"
        value={
          <span className="whitespace-nowrap truncate">
            {formatOrderDate(order.orderDate, 'long')}
          </span>
        }
      />
      <OrderInfoField
        icon={getPriorityIcon(order.priority)}
        label="Priority"
        value={<Badge variant={order.priority} size="sm" />}
      />
      <OrderInfoField
        icon={getOrderStatusIcon(order.overallStatus)}
        label="Status"
        value={<Badge variant={order.overallStatus} size="sm" />}
      />
      {order.referringPhysician && (
        <OrderInfoField
          icon={getDataFieldIcon('referringPhysician')}
          label="Referring Physician"
          value={order.referringPhysician}
        />
      )}
      {order.clinicalNotes && (
        <OrderInfoField
          icon={getDataFieldIcon('clinicalNotes')}
          label="Clinical Notes"
          value={<span className="line-clamp-3 wrap-break-word">{order.clinicalNotes}</span>}
        />
      )}
    </div>
  );
};
