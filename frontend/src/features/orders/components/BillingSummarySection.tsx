/**
 * BillingSummarySection Component
 * Displays billing summary information in receipt-style format matching PaymentPopover
 */

import React from 'react';
import { Button, Icon, EntityId } from '@/components';
import type { Order, Invoice } from '@/types';
import { ICONS } from '@/config/icons';
import { InsuranceClaimSection } from '@/features/billing';
import { OrderReceipt } from './OrderReceipt';

export interface BillingSummarySectionProps {
  order: Order;
  invoice: Invoice | null;
  onViewInvoice: () => void;
}

export const BillingSummarySection: React.FC<BillingSummarySectionProps> = ({
  order,
  invoice,
  onViewInvoice,
}) => (
  <div className="flex flex-col justify-between h-full">
    <OrderReceipt order={order} variant="panel" />
    {invoice && (
      <div className="px-4 pb-4">
        <Button
          variant="secondary"
          size="sm"
          className="w-full mt-4"
          icon={<Icon name={ICONS.dataFields.bill} className="w-4 h-4" />}
          onClick={onViewInvoice}
        >
          View Invoice (<EntityId type="invoice" value={invoice.invoiceId} />)
        </Button>
        <InsuranceClaimSection orderId={order.orderId} invoice={invoice} />
      </div>
    )}
  </div>
);
