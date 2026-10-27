/**
 * OrderInfoSection — order metadata in a two-column row grid (Tests spans full width last).
 */

import React, { useMemo } from 'react';
import { RecordId } from '@/features/shared';
import type { Order } from '@/types';
import { OrderPriorityBadge, OrderStatusBadge } from './OrderDomainBadges';
import { DescriptionItem, DETAIL_SECTION_GENERAL_INFO_GRID } from '@/components/display';
import { formatDateTime } from '@/utils/date';
import { getDataFieldIcon, getPriorityIcon, getOrderStatusIcon } from '@/config/icons';
import { useUserLookup } from '@/lib/api/users';
import { useTestNameLookup } from '@/features/catalog';
import { getActiveTests } from '../utils/orderCalculator';
import { renderOrderTestsBlock } from '@/utils/presentation';

export interface OrderInfoSectionProps {
  order: Order;
}

export const OrderInfoSection: React.FC<OrderInfoSectionProps> = ({ order }) => {
  const { getUserName } = useUserLookup();
  const { getTestName } = useTestNameLookup();
  const createdById = order.createdBy?.trim() || null;
  const createdByName = createdById ? getUserName(createdById) : null;
  const activeTests = useMemo(() => getActiveTests(order.tests ?? []), [order.tests]);
  const referentDoctorDisplay = useMemo(() => {
    const name = order.referentDoctorName?.trim();
    const hospital = order.referentDoctorHospital?.trim();
    if (!name) return 'N/A';
    return hospital ? `${name} (${hospital})` : name;
  }, [order.referentDoctorName, order.referentDoctorHospital]);

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
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className={DETAIL_SECTION_GENERAL_INFO_GRID}>
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
          <DescriptionItem
            icon={getDataFieldIcon('user')}
            label="Created by"
            value={createdByName ?? 'N/A'}
            orientation="vertical"
          />
          <DescriptionItem
            icon={getDataFieldIcon('referentDoctor')}
            label="Referent doctor"
            value={referentDoctorDisplay}
            orientation="vertical"
          />
          {testsDisplay != null ? (
            <DescriptionItem
              icon={getDataFieldIcon('medicalKit')}
              label="Tests"
              orientation="vertical"
              span="full"
              value={testsDisplay}
            />
          ) : null}
          {order.clinicalNotes ? (
            <DescriptionItem
              icon={getDataFieldIcon('clinicalNotes')}
              label="Clinical Notes"
              span="full"
              value={<span className="line-clamp-3 wrap-break-word">{order.clinicalNotes}</span>}
              orientation="vertical"
            />
          ) : null}
        </div>
      </div>
    </div>
  );
};
