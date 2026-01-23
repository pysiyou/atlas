import React from 'react';
import { Badge } from '@/shared/ui';
import type { Order } from '@/types';

interface OrderCardProps {
  order: Order;
  onClick: () => void;
}

/**
 * OrderCard Component
 * 
 * Mobile-optimized card for displaying order information.
 * Used in PatientDetail on small screens as an alternative to the table view.
 */
export const OrderCard: React.FC<OrderCardProps> = ({ order, onClick }) => {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD' 
    }).format(amount);
  };

  return (
    <div 
      className="border border-gray-200 rounded-lg p-4 hover:border-sky-500 hover:bg-sky-50/50 transition-colors cursor-pointer active:scale-[0.98]"
      onClick={onClick}
    >
      {/* Order ID and Status */}
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-sm font-medium text-sky-600 truncate">
          {order.orderId}
        </span>
        <Badge variant={order.overallStatus} size="sm" />
      </div>
      
      {/* Date and Tests Count */}
      <div className="text-xs text-gray-600 mb-2">
        {formatDate(order.orderDate)} • {order.tests.length} test{order.tests.length !== 1 ? 's' : ''}
      </div>
      
      {/* Test Names */}
      <div className="text-xs text-gray-500 mb-3 line-clamp-2 leading-relaxed">
        {order.tests.slice(0, 3).map(t => t.testName || t.testCode).join(', ')}
        {order.tests.length > 3 && ` +${order.tests.length - 3} more`}
      </div>
      
      {/* Priority, Payment Status, and Amount */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <Badge variant={order.priority} size="sm" />
          <Badge variant={order.paymentStatus} size="sm" />
        </div>
        <span className="font-semibold text-sky-600 text-sm">
          {formatCurrency(order.totalPrice)}
        </span>
      </div>
    </div>
  );
};
