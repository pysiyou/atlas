/**
 * OrderInfoSection Component
 * Displays order information
 */

import React from 'react';
import { EntityId } from '@/components';
import type { Order } from '@/types';
import { OrderPriorityBadge, OrderStatusBadge } from './OrderDomainBadges';
import { DetailField } from '@/components/display/DetailField';
import { formatDateTime } from '@/utils/date';
import { getDataFieldIcon, getPriorityIcon, getOrderStatusIcon } from '@/config/icons';
import { useUserLookup } from '@/lib/api/users';

/** Responsive field layout: two columns on narrow full-width panels, single column in multi-column grids. */
export const ORDER_DETAIL_INFO_FIELDS_LAYOUT =
  'grid grid-cols-1 gap-space-3 sm:grid-cols-2 sm:gap-layout-stack md:flex md:flex-col md:gap-space-3';

export interface OrderInfoSectionProps {
  order: Order;
}

export const OrderInfoSection: React.FC<OrderInfoSectionProps> = ({ order }) => {
  const { getUserName } = useUserLookup();
  const containerClass = ORDER_DETAIL_INFO_FIELDS_LAYOUT;
  const createdById = order.createdBy?.trim() || null;
  const createdByName = createdById ? getUserName(createdById) : null;

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
        value={<OrderPriorityBadge priority={order.priority} size="xs" />}
        orientation="vertical"
      />
      <DetailField
        icon={getOrderStatusIcon(order.overallStatus)}
        label="Status"
        value={<OrderStatusBadge status={order.overallStatus} size="xs" />}
        orientation="vertical"
      />
      {createdByName && (
        <DetailField
          icon={getDataFieldIcon('user')}
          label="Created By"
          value={createdByName}
          orientation="vertical"
        />
      )}
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
