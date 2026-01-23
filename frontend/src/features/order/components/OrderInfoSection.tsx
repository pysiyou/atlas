/**
 * OrderInfoSection Component
 * Displays order information
 */

import React from 'react';
import { Badge } from '@/shared/ui';
import { displayId } from '@/utils/id-display';
import type { Order } from '@/types';
import { OrderInfoField } from './OrderInfoField';
import { formatOrderDate } from '../utils/orderDetailUtils';

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
        icon="hashtag"
        label="Order ID"
        value={<span className="font-mono">{displayId.order(order.orderId)}</span>}
      />
      <OrderInfoField
        icon="calendar"
        label="Order Date"
        value={
          <span className="whitespace-nowrap truncate">
            {formatOrderDate(order.orderDate, 'long')}
          </span>
        }
      />
      <OrderInfoField
        icon="danger-square"
        label="Priority"
        value={<Badge variant={order.priority} size="sm" />}
      />
      <OrderInfoField
        icon="clock"
        label="Status"
        value={<Badge variant={order.overallStatus} size="sm" />}
      />
      {order.referringPhysician && (
        <OrderInfoField
          icon="stethoscope"
          label="Referring Physician"
          value={order.referringPhysician}
        />
      )}
      {order.clinicalNotes && (
        <OrderInfoField
          icon="pen"
          label="Clinical Notes"
          value={<span className="line-clamp-3 wrap-break-word">{order.clinicalNotes}</span>}
        />
      )}
    </div>
  );
};
