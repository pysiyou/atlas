/**
 * Recent orders panel for the dashboard reception view.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { EmptyState, EMPTY_COPY, Panel, Badge, EntityId } from '@/components';
import { ROUTES } from '@/config';
import type { Order } from '@/types';
import { TYPE, RADIUS } from '@/components/theme/recipes';


export interface DashboardRecentOrdersProps {
  orders: Order[];
  getPatientName: (patientId: string) => string;
}

export const DashboardRecentOrders: React.FC<DashboardRecentOrdersProps> = ({
  orders,
  getPatientName,
}) => (
  <Panel
    title="Recent Orders"
    headerEnd={
      <Link to={ROUTES.ORDERS} className="text-xs text-brand hover:underline">
        View all
      </Link>
    }
  >
    <div className="space-y-space-3">
      {orders.length > 0 ? (
        orders.map(order => (
          <Link
            key={order.orderId}
            to={`${ROUTES.ORDERS}/${order.orderId}`}
            className={`flex items-center justify-between p-panel border border-border-default ${RADIUS.card} hover:bg-surface-page`}
          >
            <div>
              <p className="text-sm font-normal text-text-primary">
                {getPatientName(String(order.patientId))}
              </p>
              <p className={TYPE.meta}>
                <EntityId type="order" value={order.orderId} /> •{' '}
                {order.testCount ?? order.tests?.length ?? 0} test(s)
              </p>
            </div>
            <Badge
              variant={
                order.overallStatus === 'completed'
                  ? 'success'
                  : order.overallStatus === 'running'
                    ? 'warning'
                    : 'info'
              }
              className="border-none font-normal"
            >
              {order.overallStatus}
            </Badge>
          </Link>
        ))
      ) : (
        <EmptyState
          variant="compact"
          title={EMPTY_COPY.recentOrders.title}
          description={EMPTY_COPY.recentOrders.description}
        />
      )}
    </div>
  </Panel>
);
