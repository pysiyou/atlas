/**
 * BillingSummarySection Component
 * Displays billing summary information in receipt-style format matching PaymentPopover
 */

import React from 'react';
import { Badge, Button, Icon } from '@/shared/ui';
import { formatCurrency } from '@/utils';
import { displayId } from '@/utils/id-display';
import type { Order, Invoice } from '@/types';
import { ICONS } from '@/utils/icon-mappings';
import { brandColors } from '@/shared/design-system/tokens/colors';

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
      {/* Receipt-style order summary matching PaymentPopover */}
      <div className="rounded  overflow-hidden flex-1 flex flex-col min-h-0">
        {/* Header with Order ID and Payment Status */}
        <div className="px-3 py-2.5 border-b border-dashed border-gray-300">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Order <span className="font-mono">{displayId.order(order.orderId)}</span>
            </span>
            <Badge variant={order.paymentStatus} size="xs" />
          </div>
          {order.patientName && (
            <p className="text-[11px] text-gray-500 mt-0.5 truncate">{order.patientName}</p>
          )}
        </div>

        {/* Items List - Scrollable (active tests only) */}
        <div className="px-3 py-2 flex-1 min-h-0 overflow-y-auto">
          {activeTests.length > 0 ? (
            <ul className="space-y-1.5">
              {activeTests.map((test, idx) => (
                <li
                  key={test.testCode ? `${test.testCode}-${idx}` : `item-${idx}`}
                  className="flex justify-between gap-2 text-xs items-center"
                >
                  <span className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="w-1 h-1 rounded-full bg-gray-400 shrink-0" />
                    <span className="text-gray-700 truncate">
                      {test.testName || test.testCode || 'Test'}
                      {test.testCode && test.testName !== test.testCode && (
                        <span className="text-gray-500 ml-1">({test.testCode})</span>
                      )}
                    </span>
                  </span>
                  <span className="font-medium text-gray-800 tabular-nums shrink-0">
                    {formatCurrency(test.priceAtOrder)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-gray-500 italic">No items</p>
          )}
        </div>

        {/* Total Footer (sum of active tests only) */}
        <div className="border-t border-dashed border-gray-300 mx-3" />
        <div className="px-3 py-2.5 flex justify-between items-center">
          <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
            Total
          </span>
          <span className={`text-sm font-bold ${brandColors.primary.icon} tabular-nums`}>
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
