/**
 * OrderHeader Component
 * Displays order header with badges and action buttons. Uses shared DetailPageHeader for consistent layout.
 */

import React from 'react';
import { Badge, Button, Icon, IconButton } from '@/shared/ui';
import { DetailPageHeader } from '@/shared/components';
import { displayId } from '@/utils';
import type { Order, Invoice } from '@/types';
import { ICONS } from '@/utils';

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
  const badges = (
    <>
      <Badge variant={order.priority} size="sm" />
      <Badge variant={order.overallStatus} size="sm" />
    </>
  );
  const actions = (
    <div
      className={`flex items-center gap-2 ${!isLarge ? 'w-full sm:w-auto sm:justify-end justify-end' : ''}`}
    >
      {isLarge ? (
        <>
          {onEdit != null && (
            <Button variant="edit" size="sm" onClick={onEdit}>
              Edit
            </Button>
          )}
          <Button variant="print" size="sm" onClick={() => { /* Print */ }}>
            Print
          </Button>
          {invoice != null && (
            <Button variant="print" size="sm" onClick={onViewInvoice}>
              Invoice
            </Button>
          )}
        </>
      ) : (
        <>
          {onEdit != null && (
            <IconButton
              variant="view"
              size="sm"
              title="Edit Order"
              icon={<Icon name={ICONS.actions.edit} className="w-4 h-4" />}
              onClick={onEdit}
            />
          )}
          <IconButton variant="print" size="sm" title="Print" onClick={() => { /* Print */ }} />
          {invoice != null && (
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
  );
  return (
    <DetailPageHeader
      title={displayId.order(order.orderId)}
      badges={badges}
      actions={actions}
    />
  );
};
