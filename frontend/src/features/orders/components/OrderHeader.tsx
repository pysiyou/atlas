/**
 * OrderHeader Component
 * Displays order header with badges and action buttons. Uses shared PageHeader for consistent layout.
 */

import React from 'react';
import { actionButtonPreset, Button, Icon, IconButton, PageHeader } from '@/components';
import type { Order, Invoice } from '@/types';
import { ICONS } from '@/config/icons';

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
  const actions = (
    <div
      className={`flex items-center gap-space-2 ${!isLarge ? 'w-full sm:w-auto sm:justify-end justify-end' : ''}`}
    >
      {isLarge ? (
        <>
          {onEdit != null && (
            <Button {...actionButtonPreset('edit')} size="sm" onClick={onEdit}>
              Edit
            </Button>
          )}
          <Button
            {...actionButtonPreset('print')}
            size="sm"
            onClick={() => {
              /* Print */
            }}
          >
            Print
          </Button>
          {invoice != null && (
            <Button {...actionButtonPreset('print')} size="sm" onClick={onViewInvoice}>
              Invoice
            </Button>
          )}
        </>
      ) : (
        <>
          {onEdit != null && (
            <IconButton
              {...actionButtonPreset('view')}
              size="sm"
              title="Edit Order"
              icon={<Icon name={ICONS.actions.edit} className="w-4 h-4" />}
              onClick={onEdit}
            />
          )}
          <IconButton
            {...actionButtonPreset('print')}
            size="sm"
            title="Print"
            onClick={() => {
              /* Print */
            }}
          />
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
    <PageHeader title={order.patientName} actions={actions} />
  );
};
