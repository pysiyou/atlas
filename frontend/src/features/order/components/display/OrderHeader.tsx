/**
 * OrderHeader Component
 * Displays order header with badges and action buttons
 */

import React from 'react';
import { Badge, Button, Icon, IconButton } from '@/shared/ui';
import { displayId } from '@/utils/id-display';
import type { Order, Invoice } from '@/types';
import { ICONS } from '@/utils/icon-mappings';

export interface OrderHeaderProps {
  order: Order;
  invoice: Invoice | null;
  isLarge: boolean;
  onViewInvoice: () => void;
  onEdit?: () => void;
}

export const OrderHeader: React.FC<OrderHeaderProps> = ({
  order,
  invoice,
  isLarge,
  onViewInvoice,
  onEdit,
}) => {
  return (
    <div className="flex items-center justify-between mb-4 shrink-0 flex-wrap gap-3">
      <div className="flex items-center gap-3 self-center">
        <h1 className="text-sm font-bold text-text-primary font-mono">{displayId.order(order.orderId)}</h1>
        <Badge variant={order.priority} size="sm" />
        <Badge variant={order.overallStatus} size="sm" />
      </div>

      <div
        className={`flex items-center gap-2 self-center ${!isLarge ? 'w-full sm:w-auto sm:justify-end justify-end' : ''}`}
      >
        {isLarge ? (
          <>
            {onEdit && (
              <Button
                variant="edit"
                size="sm"
                onClick={onEdit}
              >
                Edit
              </Button>
            )}
            <Button
              variant="print"
              size="sm"
              onClick={() => {
                /* Print functionality */
              }}
            >
              Print
            </Button>
            {invoice && (
              <Button
                variant="print"
                size="sm"
                onClick={onViewInvoice}
              >
                Invoice
              </Button>
            )}
          </>
        ) : (
          <>
            {onEdit && (
              <IconButton
                variant="view"
                size="sm"
                title="Edit Order"
                icon={<Icon name={ICONS.actions.edit} className="w-4 h-4" />}
                onClick={onEdit}
              />
            )}
            <IconButton
              variant="print"
              size="sm"
              title="Print"
              onClick={() => {
                /* Print functionality */
              }}
            />
            {invoice && (
              <IconButton
                variant="primary"
                size="sm"
                title="View Invoice"
                icon={<Icon name={ICONS.dataFields.bill} className="w-4 h-4" />}
                onClick={onViewInvoice}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};
