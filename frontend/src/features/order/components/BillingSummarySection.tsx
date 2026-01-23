/**
 * BillingSummarySection Component
 * Displays billing summary information
 */

import React from 'react';
import { Badge, Button, Icon } from '@/shared/ui';
import { formatCurrency } from '@/utils';
import type { Order } from '@/types';

export interface BillingSummarySectionProps {
  order: Order;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  invoice: any | null;
  onViewInvoice: () => void;
}

export const BillingSummarySection: React.FC<BillingSummarySectionProps> = ({
  order,
  invoice,
  onViewInvoice,
}) => {
  return (
    <div className="flex flex-col justify-between h-full">
      <div className="space-y-3">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-500">Subtotal</span>
          <span className="font-medium text-gray-900">{formatCurrency(order.totalPrice)}</span>
        </div>

        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-500">Discount</span>
          <span className="font-medium text-gray-900">-</span>
        </div>
      </div>

      <div className="border-t border-gray-200 my-3" />

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="font-semibold text-gray-900">Total</span>
          <span className="text-xl font-bold text-sky-600">{formatCurrency(order.totalPrice)}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">Payment Status</span>
          <Badge variant={order.paymentStatus} size="sm" />
        </div>
      </div>

      {invoice && (
        <Button
          variant="secondary"
          size="sm"
          className="w-full mt-4"
          icon={<Icon name="bill" className="w-4 h-4" />}
          onClick={onViewInvoice}
        >
          View Invoice
        </Button>
      )}
    </div>
  );
};
