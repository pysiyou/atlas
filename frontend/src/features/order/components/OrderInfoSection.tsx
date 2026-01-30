/**
 * OrderInfoSection Component
 * Displays order information
 */

import React from 'react';
import { Badge } from '@/shared/ui';
import { displayId } from '@/utils';
import type { Order } from '@/types';
import { InfoField } from '@/shared/components/sections/InfoField';
import { formatOrderDate } from '@/shared/utils/data/dateFormatters';
import { getDataFieldIcon, getPriorityIcon, getOrderStatusIcon } from '@/utils';

export interface OrderInfoSectionProps {
  order: Order;
  layout?: 'grid' | 'column';
}

export const OrderInfoSection: React.FC<OrderInfoSectionProps> = ({ order, layout = 'column' }) => {
  const containerClass =
    layout === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 gap-5' : 'flex flex-col gap-3';

  return (
    <div className={containerClass}>
      <InfoField
        icon={getDataFieldIcon('orderId')}
        label="Order ID"
        value={<span className="font-mono text-action-primary">{displayId.order(order.orderId)}</span>}
        orientation="vertical"
      />
      <InfoField
        icon={getDataFieldIcon('orderDate')}
        label="Order Date"
        value={
          <span className="whitespace-nowrap truncate">
            {formatOrderDate(order.orderDate, 'long')}
          </span>
        }
        orientation="vertical"
      />
      <InfoField
        icon={getPriorityIcon(order.priority)}
        label="Priority"
        value={<Badge variant={order.priority} size="sm" />}
        orientation="vertical"
      />
      <InfoField
        icon={getOrderStatusIcon(order.overallStatus)}
        label="Status"
        value={<Badge variant={order.overallStatus} size="sm" />}
        orientation="vertical"
      />
      {order.referringPhysician && (
        <InfoField
          icon={getDataFieldIcon('referringPhysician')}
          label="Referring Physician"
          value={order.referringPhysician}
          orientation="vertical"
        />
      )}
      {order.clinicalNotes && (
        <InfoField
          icon={getDataFieldIcon('clinicalNotes')}
          label="Clinical Notes"
          value={<span className="line-clamp-3 wrap-break-word">{order.clinicalNotes}</span>}
          orientation="vertical"
        />
      )}
    </div>
  );
};
