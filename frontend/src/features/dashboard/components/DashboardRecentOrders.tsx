/**
 * Recent orders panel for the dashboard reception view.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { EmptyState, EMPTY_COPY, Panel, Badge, EntityId, PANEL_EMPTY_STATE } from '@/components';
import { ROUTES } from '@/config';
import type { Order } from '@/types';
import { INLINE_LINK, RADIUS, TYPE } from '@/components/theme/recipes';


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
      <Link to={ROUTES.ORDERS} className={INLINE_LINK}>
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
            className={`flex items-center justify-between p-panel border border-border-default ${RADIUS.surface} hover:bg-surface-page`}
          >
            <div>
              <p className={TYPE.amount}>
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
          {...PANEL_EMPTY_STATE}
          title={EMPTY_COPY.recentOrders.title}
          description={EMPTY_COPY.recentOrders.description}
        />
      )}
    </div>
  </Panel>
);
