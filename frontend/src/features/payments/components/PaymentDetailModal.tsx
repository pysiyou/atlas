/**
 * PaymentDetailModal Component
 *
 * Modal that uses the same BillingSummarySection as order details, plus payment actions when unpaid.
 */
import React, { useState, useCallback } from 'react';
import {
  Modal,
  Panel,
  Icon,
  Button,
  Alert,
  FooterInfo,
  PaymentMethodSelector,
  ErrorBoundary,
  DialogFooter,
  EntityId,
  SkeletonText,
} from '@/components';
import { cn, formatCurrency } from '@/utils';
import { BillingSummarySection } from '@/features/orders/components/BillingSummarySection';
import { useOrder } from '@/features/orders';
import { inputBase } from '@/components/inputs/inputStyles';
import { useCreatePayment, useOrderRemainingBalance } from '../api/payments';
import {
  getEnabledPaymentMethods,
  getDefaultPaymentMethod,
  type PaymentMethod,
} from '@/types/payments';
import { getPaymentErrorMessage } from '@/utils/errors';
import { getFeedback } from '@/utils/feedback';
import { feedbackTitle } from '@/utils/feedback/copy';
import type { OrderPaymentView } from '../types';
import { ICONS, MODULE_ICONS } from '@/config/icons';

interface PaymentDetailModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Handler to close the modal */
  onClose: () => void;
  /** Order payment view to display and process payment for */
  order: OrderPaymentView | null;
  /** Callback invoked on successful payment */
  onPaymentSuccess?: () => void;
}

/** Get enabled payment methods from the single source of truth */
const PAYMENT_METHODS = getEnabledPaymentMethods();

const PaymentDetailFooter: React.FC<{
  isPaid: boolean; submitting: boolean; paymentsLoading: boolean; remainingAmount: number;
  onClose: () => void; onPay: () => void;
}> = ({ isPaid, submitting, paymentsLoading, remainingAmount, onClose, onPay }) => (
  <DialogFooter
    start={<FooterInfo icon={MODULE_ICONS.payments} label="Payments" size="md" />}
    end={
      <>
        <Button
          variant="cancel"
          size="md"
          layout="icon-text"
          onClick={onClose}
          disabled={submitting}
        >
          {isPaid ? 'Close' : 'Cancel'}
        </Button>
        {!isPaid && (
          <Button
            variant="primary"
            size="md"
            layout="icon-text"
            onClick={onPay}
            disabled={submitting || paymentsLoading || remainingAmount <= 0}
            isLoading={submitting}
            icon={<Icon name={ICONS.dataFields.wallet} />}
          >
            {`Pay ${formatCurrency(remainingAmount)}`}
          </Button>
        )}
      </>
    }
  />
);

export const PaymentDetailModal: React.FC<PaymentDetailModalProps> = ({
  isOpen,
  onClose,
  order: view,
  onPaymentSuccess,
}) => {
  // Use mutation hook for payment creation
  const { mutate: createPaymentMutation, isPending: submitting } = useCreatePayment();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(getDefaultPaymentMethod());
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const sourceOrder = view?.order;
  const orderIdForFetch =
    isOpen && sourceOrder != null ? String(sourceOrder.orderId) : undefined;
  const { order: orderDetail, isLoading: orderDetailLoading, isError: orderDetailError } =
    useOrder(orderIdForFetch);
  const billingOrder = orderDetail ?? sourceOrder;

  const { remainingAmount, paymentsLoading } = useOrderRemainingBalance(
    sourceOrder ? String(sourceOrder.orderId) : undefined,
    sourceOrder?.totalPrice ?? 0
  );

  // Reset form state when modal opens or order changes
  React.useEffect(() => {
    if (isOpen) {
      setPaymentMethod(getDefaultPaymentMethod());
      setNotes('');
      setError(null);
    }
  }, [isOpen, sourceOrder?.orderId]);

  // Check if order is already paid
  const isPaid =
    sourceOrder?.paymentStatus === 'paid' || (!paymentsLoading && remainingAmount <= 0);

  const handlePayment = useCallback(() => {
    if (!sourceOrder || isPaid || paymentsLoading) return;

    setError(null);

    if (remainingAmount <= 0) {
      setError(feedbackTitle('payment.orderAmount.invalid'));
      return;
    }

    const paymentData = {
      orderId: sourceOrder.orderId,
      amount: remainingAmount,
      paymentMethod,
      notes: notes.trim() || undefined,
    };

    // Use mutation hook which handles cache invalidation automatically
    createPaymentMutation(paymentData, {
      onSuccess: () => {
        onPaymentSuccess?.();
        onClose();
      },
      onError: (err: unknown) => {
        setError(getPaymentErrorMessage(err, getFeedback('payment.process.error').title));
      },
    });
  }, [
    sourceOrder,
    isPaid,
    paymentsLoading,
    remainingAmount,
    paymentMethod,
    notes,
    createPaymentMutation,
    onPaymentSuccess,
    onClose,
  ]);

  // Don't render if no order
  if (!view || !sourceOrder) return null;

  return (
    <ErrorBoundary>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Process Payment"
        subtitle={
          <span>
            Order <EntityId type="order" value={sourceOrder.orderId} />
          </span>
        }
        size="xl"
        disableClose={submitting}
        closeOnBackdropClick={!submitting}
      >
        <div className="flex flex-col h-full bg-surface-page">
          {/* Scrollable content area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <Panel
              title="Billing Summary"
              padding="none"
              scroll="visible"
              bodyClassName="flex flex-col"
              className="h-auto shrink-0"
            >
              {orderDetailLoading ? (
                <div className="p-4">
                  <SkeletonText lines={6} />
                </div>
              ) : orderDetailError ? (
                <div className="p-4">
                  <Alert variant="danger" className="py-3">
                    <p className="text-sm">
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

            {/* Payment Method Selection - Only show if not paid */}
            {!isPaid && (
              <div>
                <label className="block text-sm font-normal text-text-secondary mb-3">
                  Payment Method <span className="text-danger-fg">*</span>
                </label>
                <PaymentMethodSelector
                  methods={PAYMENT_METHODS}
                  value={paymentMethod}
                  onChange={setPaymentMethod}
                  disabled={submitting}
                />
              </div>
            )}

            {/* Notes - Only show if not paid */}
            {!isPaid && (
              <div>
                <label className="block text-sm font-normal text-text-secondary mb-2">Notes</label>
                <textarea
                  rows={3}
                  placeholder="Add optional notes..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  disabled={submitting}
                  className={cn(
                    inputBase,
                    'resize-none disabled:opacity-50 disabled:bg-surface-page'
                  )}
                />
              </div>
            )}

            {/* Error Display */}
            {error && (
              <Alert variant="danger" className="py-3">
                <p className="text-sm">{error}</p>
              </Alert>
            )}
          </div>

          <PaymentDetailFooter
            isPaid={isPaid}
            submitting={submitting}
            paymentsLoading={paymentsLoading}
            remainingAmount={remainingAmount}
            onClose={onClose}
            onPay={handlePayment}
          />
        </div>
      </Modal>
    </ErrorBoundary>
  );
};
