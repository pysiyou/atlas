/**
 * BillingSummarySection Component
 * Displays billing summary information in receipt-style format matching PaymentPopover
 */

import React from 'react';
import { Badge, Button, Icon } from '@/shared/ui';
import { formatCurrency } from '@/utils';
import { displayId } from '@/utils';
import type { Order, Invoice } from '@/types';
import { ICONS } from '@/utils';

export interface BillingSummarySectionProps {
  order: Order;
  invoice: Invoice | null;
  onViewInvoice: () => void;
}

/**
 * BillingSummarySection - Receipt-style order summary matching PaymentPopover content
 *
 * Renders order ID, patient, line items (tests with prices), and total
 * in a thermal-receipt inspired layout consistent with the payment popover.
 * Excludes superseded and removed tests from the list and total; only active
 * tests are billed.
 */
export const BillingSummarySection: React.FC<BillingSummarySectionProps> = ({
  order,
  invoice,
  onViewInvoice,
}) => {
  // Exclude superseded and removed tests - only active tests count toward billing
  const activeTests =
    order.tests?.filter(
      t => t.status !== 'superseded' && t.status !== 'removed'
    ) ?? [];
  const activeTotal = activeTests.reduce(
    (sum, t) => sum + (typeof t.priceAtOrder === 'number' ? t.priceAtOrder : 0),
    0
  );

  return (
    <div className="flex flex-col justify-between h-full">
      {/* Receipt-style order summary; -mx-4 so dashed borders touch section container edge (counteracts SectionContainer p-4) */}
      <div className="rounded overflow-hidden flex-1 flex flex-col min-h-0 -mx-4">
        {/* Header with Order ID and Payment Status */}
        <div className="px-4 py-2.5 border-b border-dashed border-stroke-strong">
          <div className="flex justify-between items-center">
            <span className="text-xs font-normal text-fg-muted uppercase tracking-wider">
              Order <span className="font-mono text-brand">{displayId.order(order.orderId)}</span>
            </span>
            <Badge variant={order.paymentStatus} size="xs" />
          </div>
          {order.patientName && (
            <p className="text-[11px] text-fg-subtle mt-0.5 truncate">{order.patientName}</p>
          )}
        </div>

        {/* Items List - Scrollable (active tests only) */}
        <div className="px-4 py-2 flex-1 min-h-0 overflow-y-auto">
          {activeTests.length > 0 ? (
            <ul className="space-y-1.5">
              {activeTests.map((test, idx) => (
                <li
                  key={test.testCode ? `${test.testCode}-${idx}` : `item-${idx}`}
                  className="flex justify-between gap-2 text-xs items-center"
                >
                  <span className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="w-1 h-1 rounded-full bg-neutral-400 shrink-0" />
                    <span className="text-fg-muted truncate">
                      {test.testName || test.testCode || 'Test'}
                      {test.testCode && test.testName !== test.testCode && (
                        <span className="text-brand font-mono ml-1">({test.testCode})</span>
                      )}
                    </span>
                  </span>
                  <span className="font-normal text-fg tabular-nums shrink-0">
                    {formatCurrency(test.priceAtOrder)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-fg-subtle italic">No items</p>
          )}
        </div>

        {/* Total Footer: pt compensates for items list py-2 (8px) + divider so total above = SectionContainer pb (16px) + footer pb */}
        <div className="border-t border-dashed border-stroke-strong shrink-0" />
        <div className="shrink-0 flex justify-between items-center px-4 pt-4">
          <span className="text-xs font-normal text-fg-muted uppercase tracking-wider">
            Total
          </span>
          <span className="text-sm font-normal text-brand tabular-nums">
            {formatCurrency(activeTotal)}
          </span>
        </div>
      </div>

      {/* View Invoice Button */}
      {invoice && (
        <Button
          variant="secondary"
          size="sm"
          className="w-full mt-4"
          icon={<Icon name={ICONS.dataFields.bill} className="w-4 h-4" />}
          onClick={onViewInvoice}
        >
          View Invoice
        </Button>
      )}
    </div>
  );
};
