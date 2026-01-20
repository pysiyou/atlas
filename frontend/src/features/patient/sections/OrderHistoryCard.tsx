/**
 * OrderHistoryCard - Displays patient order history
 */

import React from 'react';
import { SectionContainer, Badge, Button } from '@/shared/ui';
import { Plus, Eye, FileText } from 'lucide-react';
import { formatDate, formatCurrency } from '@/utils';
import type { Order } from '@/types';

interface OrderHistoryCardProps {
  orders: Order[];
  onCreateOrder: () => void;
  onViewAllOrders: () => void;
  onOrderClick: (orderId: string) => void;
}

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
        <Eye size={14} />
        View All
      </Button>
      <Button
        size="sm"
        onClick={onCreateOrder}
        className="flex items-center gap-2 text-xs"
      >
        <Plus size={14} />
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
      <div className="text-xs text-gray-500 -mt-2 mb-2">
        {orders.length} order(s) found
      </div>

      {/* Orders List */}
      <div className="flex-1 overflow-y-auto min-h-0">
          {orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="text-gray-300 mb-4" size={48} />
              <p className="text-gray-600 font-medium mb-2">No orders found</p>
              <p className="text-sm text-gray-500 mb-4">Create a new order for this patient</p>
              <Button size="sm" onClick={onCreateOrder} className="flex items-center gap-2">
                <Plus size={14} />
                Create Order
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.slice(0, 10).map((order) => (
                <div
                  key={order.orderId}
                  onClick={() => onOrderClick(order.orderId)}
                  className="border border-gray-200 rounded-lg p-4 hover:border-sky-500 hover:bg-sky-50/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900 text-sm">{order.orderId}</span>
                        <Badge variant={order.overallStatus} size="sm" />
                      </div>
                      <div className="text-xs text-gray-600">
                        {formatDate(order.orderDate)} • {order.tests.length} test(s)
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-sky-600 text-sm">
                        {formatCurrency(order.totalPrice)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {order.paymentStatus.replace('-', ' ')}
                      </div>
                    </div>
                  </div>
                  {order.referringPhysician && (
                    <div className="text-xs text-gray-500 mt-2">
                      Referring Physician: {order.referringPhysician}
                    </div>
                  )}
                </div>
              ))}
              {orders.length > 10 && (
                <div className="text-center pt-2">
                  <Button variant="secondary" size="sm" onClick={onViewAllOrders}>
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
