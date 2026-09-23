/**
 * Scrollable payment modal body (billing, method, notes, errors).
 */
import React from 'react';
import {
  Panel,
  Alert,
  SkeletonText,
} from '@/components';
import { PaymentMethodSelector } from './PaymentMethodSelector';
import { cn } from '@/utils';
import type { Order } from '@/types';
import { BillingSummarySection } from '@/features/orders';
import { inputBase } from '@/components/inputs/inputStyles';
import { TONE, TYPE } from '@/components/theme/recipes';
import type { PaymentMethod, PaymentMethodOption } from '@/types/payments';
import type { OrderPaymentView } from '../types';

export interface PaymentDetailModalBodyProps {
  view: OrderPaymentView;
  isPaid: boolean;
  submitting: boolean;
  orderDetailLoading: boolean;
  orderDetailError: boolean;
  billingOrder: Order | undefined;
  paymentMethod: PaymentMethod;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  notes: string;
  onNotesChange: (notes: string) => void;
  error: string | null;
  paymentMethods: PaymentMethodOption[];
}

export const PaymentDetailModalBody: React.FC<PaymentDetailModalBodyProps> = ({
  view,
  isPaid,
  submitting,
  orderDetailLoading,
  orderDetailError,
  billingOrder,
  paymentMethod,
  onPaymentMethodChange,
  notes,
  onNotesChange,
  error,
  paymentMethods,
}) => (
  <div className="flex-1 overflow-y-auto p-space-6 space-y-space-6">
    <Panel
      title="Billing Summary"
      padding="none"
      scroll="visible"
      bodyClassName="flex flex-col"
      className="h-auto shrink-0"
    >
      {orderDetailLoading ? (
        <div className="p-panel">
          <SkeletonText lines={6} />
        </div>
      ) : orderDetailError ? (
        <div className="p-panel">
          <Alert variant="danger" className="py-space-3">
            <p className={TYPE.amount}>
              Could not load order line items. Try closing and opening again.
            </p>
          </Alert>
        </div>
      ) : billingOrder ? (
        <BillingSummarySection
          order={billingOrder}
          fillHeight={false}
          paymentMethod={view.paymentMethod}
        />
      ) : null}
    </Panel>

    {!isPaid && (
      <div>
        <label className={`block ${TYPE.amount} text-text-secondary mb-space-3`}>
          Payment Method <span className={TONE.danger.fg}>*</span>
        </label>
        <PaymentMethodSelector
          methods={paymentMethods}
          value={paymentMethod}
          onChange={onPaymentMethodChange}
          disabled={submitting}
        />
      </div>
    )}

    {!isPaid && (
      <div>
        <label className={`block ${TYPE.amount} text-text-secondary mb-space-2`}>Notes</label>
        <textarea
          rows={3}
          placeholder="Add optional notes..."
          value={notes}
          onChange={e => onNotesChange(e.target.value)}
          disabled={submitting}
          className={cn(inputBase, 'resize-none disabled:opacity-50 disabled:bg-surface-page')}
        />
      </div>
    )}

    {error && (
      <Alert variant="danger" className="py-space-3">
        <p className={TYPE.amount}>{error}</p>
      </Alert>
    )}
  </div>
);
