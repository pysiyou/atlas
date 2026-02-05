/**
 * OrderHistorySection Component
 * Displays patient order history with quick actions
 */

import React from 'react';
import { SectionContainer, Badge, Button, Icon } from '@/shared/ui';
import { formatDate, formatCurrency } from '@/utils';
import { displayId } from '@/utils';
import type { Order } from '@/types';
import { ICONS } from '@/utils';

interface OrderHistoryCardProps {
  orders: Order[];
  onCreateOrder: () => void;
  onViewAllOrders: () => void;
  onOrderClick: (orderId: number | string) => void;
}

/**
 * OrderHistoryCard - Displays recent orders with actions
 */
export const OrderHistoryCard: React.FC<OrderHistoryCardProps> = ({
  orders,
  onCreateOrder,
  onViewAllOrders,
  onOrderClick,
}) => {
  // Custom header content with buttons
  const headerContent = (
    <div className="flex items-center gap-2">
      <Button
        variant="secondary"
        size="sm"
        onClick={onViewAllOrders}
        className="flex items-center gap-2 text-xs"
      >
        <Icon name={ICONS.actions.view} className="w-3.5 h-3.5" />
        View All
      </Button>
      <Button size="sm" onClick={onCreateOrder} className="flex items-center gap-2 text-xs">
        <Icon name={ICONS.actions.add} className="w-3.5 h-3.5" />
        New Order
      </Button>
    </div>
  );

  return (
    <SectionContainer
      title="Order History"
      headerRight={headerContent}
      className="h-full flex flex-col"
      contentClassName="flex flex-col gap-4 flex-1 min-h-0 overflow-y-auto"
    >
      {/* Order count */}
      <div className="text-xs text-text-3 -mt-2 mb-2">{orders.length} order(s) found</div>

      {/* Orders List */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Icon name={ICONS.dataFields.document} className="w-12 h-12 text-text-disabled mb-4" />
            <p className="text-text-3 font-medium mb-2">No orders found</p>
            <p className="text-sm text-text-3 mb-4">Create a new order for this patient</p>
            <Button size="sm" variant="create" onClick={onCreateOrder}>
              Create Order
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.slice(0, 10).map(order => (
              <div
                key={order.orderId}
                onClick={() => onOrderClick(order.orderId)}
                className="border border-border rounded-lg p-4 hover:border-primary hover:bg-primary-muted transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-text text-sm font-mono">
                        {displayId.order(order.orderId)}
                      </span>
                      <Badge variant={order.overallStatus} size="sm" />
                    </div>
                    <div className="text-xs text-text-3">
                      {formatDate(order.orderDate)} • {order.tests.length} test(s)
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-primary text-sm">
                      {formatCurrency(order.totalPrice)}
                    </div>
                    <div className="text-xs text-text-3">
                      {order.paymentStatus.replace('-', ' ')}
                    </div>
                  </div>
                </div>
                {order.referringPhysician && (
                  <div className="text-xs text-text-3 mt-2">
                    Referring Physician: {order.referringPhysician}
                  </div>
                )}
              </div>
            ))}
            {orders.length > 10 && (
              <div className="text-center pt-2">
                <Button variant="view" size="sm" onClick={onViewAllOrders}>
                  View All {orders.length} Orders
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </SectionContainer>
  );
};
