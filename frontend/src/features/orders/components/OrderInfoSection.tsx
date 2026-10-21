/**
 * OrderInfoSection — order metadata in the same DescriptionColumns layout as patient detail panels.
 */

import React, { useMemo } from 'react';
import { RecordId } from '@/features/shared/components';
import type { Order } from '@/types';
import { OrderPriorityBadge, OrderStatusBadge } from './OrderDomainBadges';
import { DescriptionColumns, DescriptionItem } from '@/components/display';
import { formatDateTime } from '@/utils/date';
import { getDataFieldIcon, getPriorityIcon, getOrderStatusIcon } from '@/config/icons';
import { useUserLookup } from '@/lib/api/users';
import { useTestNameLookup } from '@/features/catalog';
import { getActiveTests } from '../utils/orderCalculator';
import { renderOrderTestsBlock } from '../utils/orderTableColumnRenders';

export interface OrderInfoSectionProps {
  order: Order;
}

export const OrderInfoSection: React.FC<OrderInfoSectionProps> = ({ order }) => {
  const { getUserName } = useUserLookup();
  const { getTestName } = useTestNameLookup();
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
    <div className="flex min-h-0 h-full flex-col">
      <DescriptionColumns>
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
            <span className="whitespace-nowrap truncate">{formatDateTime(order.orderDate)}</span>
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
        {createdByName ? (
          <DescriptionItem
            icon={getDataFieldIcon('user')}
            label="Created by"
            value={createdByName}
            orientation="vertical"
          />
        ) : null}
        {order.referringPhysician ? (
          <DescriptionItem
            icon={getDataFieldIcon('referringPhysician')}
            label="Referring physician"
            value={order.referringPhysician}
            orientation="vertical"
          />
        ) : null}
        {testsDisplay != null ? (
          <DescriptionItem
            icon={getDataFieldIcon('medicalKit')}
            label="Tests"
            orientation="vertical"
            value={testsDisplay}
          />
        ) : null}
        {order.clinicalNotes ? (
          <DescriptionItem
            icon={getDataFieldIcon('clinicalNotes')}
            label="Clinical Notes"
            value={<span className="line-clamp-3 wrap-break-word">{order.clinicalNotes}</span>}
            orientation="vertical"
          />
        ) : null}
      </DescriptionColumns>
    </div>
  );
};
