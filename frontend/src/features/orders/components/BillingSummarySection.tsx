/**
 * BillingSummarySection Component
 * Displays billing summary information in receipt-style format matching PaymentPopover
 */

import React from 'react';
import type { Order } from '@/types';
import { getActiveTotal } from '../utils/orderCalculator';
import { OrderReceipt, ReceiptTotal } from './OrderReceipt';

export interface BillingSummarySectionProps {
  order: Order;
}

export const BillingSummarySection: React.FC<BillingSummarySectionProps> = ({ order }) => {
  const activeTotal = getActiveTotal(order.tests ?? []);

  return (
    <div className="flex flex-col min-h-0 h-full">
      <OrderReceipt order={order} variant="panel" showTotal={false} />
      <div className="mt-auto shrink-0">
        <ReceiptTotal total={activeTotal} variant="panel" pad="px-4" />
      </div>
    </div>
  );
};
