/**
 * BillingSummarySection Component
 * Displays billing summary information in receipt-style format matching PaymentPopover
 */

import React from 'react';
import type { Order } from '@/types';
import { cn } from '@/utils';
import { usePaymentsByOrder } from '@/features/payments/api/payments';
import { getActiveTotal } from '../utils/orderCalculator';
import { OrderReceipt, ReceiptTotal } from './OrderReceipt';

export interface BillingSummarySectionProps {
  order: Order;
  /** Stretch to fill parent panel height (order detail). Off in modals so all lines show. */
  fillHeight?: boolean;
  /** Latest payment method when known (e.g. payments list row). Falls back to payments API. */
  paymentMethod?: string;
}

export const BillingSummarySection: React.FC<BillingSummarySectionProps> = ({
  order,
  fillHeight = true,
  paymentMethod: paymentMethodProp,
}) => {
  const activeTotal = getActiveTotal(order.tests ?? []);
  const { payments } = usePaymentsByOrder(String(order.orderId));
  const paymentMethod =
    paymentMethodProp ??
    order.paymentMethod ??
    (order.paymentStatus !== 'unpaid' ? payments[0]?.paymentMethod : undefined);

  return (
    <div className={cn('flex flex-col min-h-0', fillHeight && 'h-full')}>
      <OrderReceipt
        order={order}
        variant="panel"
        showTotal={false}
        expandItems={!fillHeight}
        paymentMethod={paymentMethod}
      />
      <div className="mt-auto shrink-0">
        <ReceiptTotal total={activeTotal} variant="panel" pad="px-space-4" />
      </div>
    </div>
  );
};
