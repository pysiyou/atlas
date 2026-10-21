/**
 * Recent orders panel for the dashboard reception view.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { EmptyState, EMPTY_COPY, EntityId, PANEL_EMPTY_STATE } from '@/components/display';
import { Panel } from '@/components/surfaces';
import { OrderStatusBadge } from '@/features/orders';
import { ROUTES } from '@/config';
import type { Order } from '@/types';
import { INLINE_LINK, RADIUS, TYPE } from '@/theme/recipes';


export interface DashboardRecentOrdersProps {
  orders: Order[];
}

export const DashboardRecentOrders: React.FC<DashboardRecentOrdersProps> = ({
  orders,
}) => (
  <Panel
    preset="panel.page.standard" title="Recent Orders"
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
                {order.patientName || '—'}
              </p>
              <p className={TYPE.meta}>
                <EntityId type="order" value={order.orderId} /> •{' '}
                {order.testCount ?? order.tests?.length ?? 0} test(s)
              </p>
            </div>
            <OrderStatusBadge
              status={order.overallStatus}
              presentation={order.statusPresentation}
              size="xs"
            />
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
