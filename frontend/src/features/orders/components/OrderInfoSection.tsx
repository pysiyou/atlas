/**
 * OrderInfoSection Component
 * Displays order information
 */

import React, { useMemo } from 'react';
import { RecordId } from '@/features/shared/components';
import type { Order } from '@/types';
import { OrderPriorityBadge, OrderStatusBadge } from './OrderDomainBadges';
import { DescriptionItem } from '@/components/display';
import { formatDateTime } from '@/utils/date';
import { getDataFieldIcon, getPriorityIcon, getOrderStatusIcon } from '@/config/icons';
import { useUserLookup } from '@/lib/api/users';
import { useTestNameLookup } from '@/features/catalog';
import { getActiveTests } from '../utils/orderCalculator';
import { renderOrderTestsBlock } from '../utils/orderTableColumnRenders';

/** Responsive field layout: two columns on narrow full-width panels, single column in multi-column grids. */
export const ORDER_DETAIL_INFO_FIELDS_LAYOUT =
  'grid grid-cols-1 gap-space-3 sm:grid-cols-2 sm:gap-layout-stack md:flex md:flex-col md:gap-space-3';

export interface OrderInfoSectionProps {
  order: Order;
}

export const OrderInfoSection: React.FC<OrderInfoSectionProps> = ({ order }) => {
  const { getUserName } = useUserLookup();
  const { getTestName } = useTestNameLookup();
  const containerClass = ORDER_DETAIL_INFO_FIELDS_LAYOUT;
  const createdById = order.createdBy?.trim() || null;
  const createdByName = createdById ? getUserName(createdById) : null;
  const activeTests = useMemo(() => getActiveTests(order.tests ?? []), [order.tests]);
  const testsDisplay = useMemo(() => {
    const count = order.testCount ?? order.tests?.length;
    const testCodes = order.testCodes;
    return renderOrderTestsBlock(activeTests, {
      fallbackCount: count != null && activeTests.length === 0 ? count : undefined,
      testCodes: activeTests.length === 0 ? testCodes : undefined,
      getTestName,
      layout: 'namesFirst',
      showAllNames: true,
    });
  }, [activeTests, getTestName, order.testCodes, order.testCount, order.tests?.length]);

  return (
    <div className={containerClass}>
      <DescriptionItem
        icon={getDataFieldIcon('orderId')}
        label="Order ID"
        value={<RecordId type="order" value={order.orderId} />}
        orientation="vertical"
      />
      <DescriptionItem
        icon={getDataFieldIcon('orderDate')}
        label="Order Date"
        value={
          <span className="whitespace-nowrap truncate">
            {formatDateTime(order.orderDate)}
          </span>
        }
        orientation="vertical"
      />
      <DescriptionItem
        icon={getPriorityIcon(order.priority)}
        label="Priority"
        value={<OrderPriorityBadge priority={order.priority} size="xs" />}
        orientation="vertical"
      />
      <DescriptionItem
        icon={getOrderStatusIcon(order.overallStatus)}
        label="Status"
        value={<OrderStatusBadge status={order.overallStatus} size="xs" />}
        orientation="vertical"
      />
      {createdByName && (
        <DescriptionItem
          icon={getDataFieldIcon('user')}
          label="Created by"
          value={createdByName}
          orientation="vertical"
        />
      )}
      {order.referringPhysician && (
        <DescriptionItem
          icon={getDataFieldIcon('referringPhysician')}
          label="Referring physician"
          value={order.referringPhysician}
          orientation="vertical"
        />
      )}
      {testsDisplay != null && (
        <DescriptionItem
          icon={getDataFieldIcon('medicalKit')}
          label="Tests"
          className="sm:col-span-2"
          orientation="vertical"
          value={testsDisplay}
        />
      )}
      {order.clinicalNotes && (
        <DescriptionItem
          icon={getDataFieldIcon('clinicalNotes')}
          label="Clinical Notes"
          value={<span className="line-clamp-3 wrap-break-word">{order.clinicalNotes}</span>}
          orientation="vertical"
        />
      )}
    </div>
  );
};
