/**
 * PaymentDetailModal Component
 *
 * Modal that uses the same BillingSummarySection as order details, plus payment actions when unpaid.
 */
import React, { useState, useCallback } from 'react';
import { Icon, Button } from '@/components/primitives';
import { DialogFooter, Modal, ModalPageShell } from '@/components/overlays';
import { FooterInfo, ModalContextSubtitle } from '@/components/display';
import { ErrorBoundary } from '@/feedback';
import { PaymentDetailModalBody } from './PaymentDetailModalBody';
import { formatCurrency } from '@/utils';
import { useOrder } from '@/features/orders';
import { useCreatePayment, useOrderRemainingBalance } from '../api/payments';
import { isFullyPaid, roundMoney } from '../utils/paymentStatus';
import {
  getEnabledPaymentMethods,
  getDefaultPaymentMethod,
  type PaymentMethod } from '@/types/payments';
import { getPaymentErrorMessage } from '@/utils/errors';
import { feedbackTitle, getFeedback } from '@/feedback';
import type { OrderPaymentView } from '../types';
import { IconKeys } from '@/config/icons';

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
  isPaid: boolean;
  submitting: boolean;
  paymentsLoading: boolean;
  remainingAmount: number;
  amount: number;
  onPay: () => void;
}> = ({ isPaid, submitting, paymentsLoading, remainingAmount, amount, onPay }) => {
  const chargeAmount = roundMoney(amount);
  const remaining = roundMoney(remainingAmount);
  const canPay = !submitting && !paymentsLoading && chargeAmount > 0 && chargeAmount <= remaining;
  return (
    <DialogFooter
      start={<FooterInfo icon={IconKeys.modules.payments} label="Payments" size="md" />}
      end={
        !isPaid ? (
          <Button
            variant="primary"
            size="sm"
            layout="icon-text"
            onClick={onPay}
            disabled={!canPay}
            isLoading={submitting}
            icon={<Icon iconKey={IconKeys.dataFields.wallet} />}
          >
            {chargeAmount > 0 ? `Pay ${formatCurrency(chargeAmount)}` : 'Pay'}
          </Button>
        ) : null
      }
    />
  );
};

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
  const [amount, setAmount] = useState(0);

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

  React.useEffect(() => {
    setAmount(remainingAmount);
  }, [remainingAmount, sourceOrder?.orderId]);

  const remaining = roundMoney(remainingAmount);
  const chargeAmount = roundMoney(amount);

  // Check if order is already paid
  const isPaid =
    isFullyPaid(sourceOrder?.paymentStatus) || (!paymentsLoading && remaining <= 0);

  const handlePayment = useCallback(() => {
    if (!sourceOrder || isPaid || paymentsLoading) return;

    setError(null);

    if (remaining <= 0) {
      setError(feedbackTitle('payment.orderAmount.invalid'));
      return;
    }
    if (chargeAmount <= 0) {
      setError(feedbackTitle('payment.amount.mustBePositive'));
      return;
    }
    if (chargeAmount > remaining) {
      setError(feedbackTitle('payment.amount.exceedsRemaining'));
      return;
    }

    const paymentData = {
      orderId: sourceOrder.orderId,
      amount: chargeAmount,
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
    remaining,
    chargeAmount,
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
          <ModalContextSubtitle
            label={sourceOrder.patientName}
            orderId={sourceOrder.orderId}
          />
        }
        size="xl"
        disableClose={submitting}
        closeOnBackdropClick={!submitting}
      >
        <ModalPageShell
          bodyPadding="none"
          footer={
            <PaymentDetailFooter
              isPaid={isPaid}
              submitting={submitting}
              paymentsLoading={paymentsLoading}
              remainingAmount={remaining}
              amount={chargeAmount}
              onPay={handlePayment}
            />
          }
        >
          <PaymentDetailModalBody
            view={view}
            isPaid={isPaid}
            submitting={submitting}
            orderDetailLoading={orderDetailLoading}
            orderDetailError={orderDetailError}
            billingOrder={billingOrder ?? undefined}
            paymentMethod={paymentMethod}
            onPaymentMethodChange={setPaymentMethod}
            notes={notes}
            onNotesChange={setNotes}
            amount={chargeAmount}
            remainingAmount={remaining}
            onAmountChange={setAmount}
            error={error}
            paymentMethods={PAYMENT_METHODS}
          />
        </ModalPageShell>
      </Modal>
    </ErrorBoundary>
  );
};
