/**
 * OrderHeader Component
 * Displays order header with badges and action buttons
 */

import React from 'react';
import { Badge, Button, Icon, IconButton } from '@/shared/ui';
import { displayId } from '@/utils/id-display';
import type { Order } from '@/types';

export interface OrderHeaderProps {
  order: Order;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  invoice: any | null;
  isLarge: boolean;
  onViewInvoice: () => void;
}

export const OrderHeader: React.FC<OrderHeaderProps> = ({
  order,
  invoice,
  isLarge,
  onViewInvoice,
}) => {
  return (
    <div className="flex items-center justify-between mb-4 shrink-0 flex-wrap gap-3">
      <div className="flex items-center gap-3 self-center">
        <h1 className="text-sm font-bold text-gray-900">
          {displayId.order(order.orderId)}
        </h1>
        <Badge variant={order.priority} size="sm" />
        <Badge variant={order.overallStatus} size="sm" />
      </div>

      <div className={`flex items-center gap-2 self-center ${!isLarge ? 'w-full sm:w-auto sm:justify-end justify-end' : ''}`}>
        {isLarge ? (
          <>
            <Button
              variant="print"
              size="sm"
              onClick={() => {/* Print functionality */}}
            >
              Print
            </Button>
            {invoice && (
              <Button
                variant="secondary"
                size="sm"
                icon={<Icon name="bill" className="w-4 h-4" />}
                onClick={onViewInvoice}
              >
                Invoice
              </Button>
            )}
          </>
        ) : (
          <>
            <IconButton
              variant="print"
              size="sm"
              title="Print"
              onClick={() => {/* Print functionality */}}
            />
            {invoice && (
              <IconButton
                variant="secondary"
                size="sm"
                title="View Invoice"
                icon={<Icon name="bill" className="w-4 h-4" />}
                onClick={onViewInvoice}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};
