/**
 * OrderInfoSection Component
 * Displays order information
 */

import React from 'react';
import { Badge, EntityId } from '@/components';
import type { Order } from '@/types';
import { DetailField } from '@/components/display/DetailField';
import { formatDateTime } from '@/utils/date';
import { getDataFieldIcon, getPriorityIcon, getOrderStatusIcon } from '@/config/icons';

export interface OrderInfoSectionProps {
  order: Order;
  layout?: 'grid' | 'column';
}

export const OrderInfoSection: React.FC<OrderInfoSectionProps> = ({ order, layout = 'column' }) => {
  const containerClass =
    layout === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 gap-layout-stack' : 'flex flex-col gap-space-3';

  return (
    <div className={containerClass}>
      <DetailField
        icon={getDataFieldIcon('orderId')}
        label="Order ID"
        value={<EntityId type="order" value={order.orderId} />}
        orientation="vertical"
      />
      <DetailField
        icon={getDataFieldIcon('orderDate')}
        label="Order Date"
        value={
          <span className="whitespace-nowrap truncate">
            {formatDateTime(order.orderDate)}
          </span>
        }
        orientation="vertical"
      />
      <DetailField
        icon={getPriorityIcon(order.priority)}
        label="Priority"
        value={<Badge variant={order.priority} size="xs" />}
        orientation="vertical"
      />
      <DetailField
        icon={getOrderStatusIcon(order.overallStatus)}
        label="Status"
        value={<Badge variant={order.overallStatus} size="xs" />}
        orientation="vertical"
      />
      {order.referringPhysician && (
        <DetailField
          icon={getDataFieldIcon('referringPhysician')}
          label="Referring Physician"
          value={order.referringPhysician}
          orientation="vertical"
        />
      )}
      {order.clinicalNotes && (
        <DetailField
          icon={getDataFieldIcon('clinicalNotes')}
          label="Clinical Notes"
          value={<span className="line-clamp-3 wrap-break-word">{order.clinicalNotes}</span>}
          orientation="vertical"
        />
      )}
    </div>
  );
};
