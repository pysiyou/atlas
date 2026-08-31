/**
 * Recent orders panel for the dashboard reception view.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { SectionPanel, Badge } from '@/components';
import { displayId } from '@/utils';
import { ROUTES } from '@/config';
import type { Order } from '@/types';

export interface DashboardRecentOrdersProps {
  orders: Order[];
  getPatientName: (patientId: string) => string;
}

export const DashboardRecentOrders: React.FC<DashboardRecentOrdersProps> = ({
  orders,
  getPatientName,
}) => (
  <SectionPanel
    title="Recent Orders"
    headerRight={
      <Link to={ROUTES.ORDERS} className="text-xs text-brand hover:underline">
        View all
      </Link>
    }
  >
    <div className="space-y-3">
      {orders.length > 0 ? (
        orders.map(order => (
          <Link
            key={order.orderId}
            to={`${ROUTES.ORDERS}/${order.orderId}`}
            className="flex items-center justify-between p-4 border border-border-default rounded-md hover:bg-surface-page"
          >
            <div>
              <p className="text-sm font-normal text-text-primary">
                {getPatientName(String(order.patientId))}
              </p>
              <p className="text-xs text-text-tertiary">
                <span className="font-mono">{displayId.order(order.orderId)}</span> •{' '}
                {order.tests.length} test(s)
              </p>
            </div>
            <Badge
              variant={
                order.overallStatus === 'completed'
                  ? 'success'
                  : order.overallStatus === 'in-progress'
                    ? 'warning'
                    : 'info'
              }
              size="sm"
              className="border-none font-normal"
            >
              {order.overallStatus}
            </Badge>
          </Link>
        ))
      ) : (
        <p className="text-center text-sm text-text-tertiary py-8">No recent orders</p>
      )}
    </div>
  </SectionPanel>
);
