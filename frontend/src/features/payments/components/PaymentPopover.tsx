/**
 * PaymentPopover Component
 * Popover interface for processing payments on orders
 *
 * Uses the shared PopoverForm component for consistent styling with other lab popovers.
 * Payment methods are sourced from the centralized PAYMENT_METHOD_OPTIONS in types/payments.
 */
import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Popover,
  Button,
  Icon,
  Alert,
  Badge,
  FooterInfo,
  PaymentMethodSelector,
  EntityId,
} from '@/components';
import { PopoverForm } from '@/features/lab';
import { cn, formatCurrency } from '@/utils';
import { OrderReceipt } from '@/features/orders';
import { inputBase, FORM_FIELD_LABEL } from '@/components/inputs/inputStyles';
import type { Order } from '@/types';
import {
  getEnabledPaymentMethods,
  getDefaultPaymentMethod,
  type PaymentMethod,
} from '@/types/payments';
import { useCreatePayment, useOrderRemainingBalance } from '../api/payments.api';
import { getFeedback, notify } from '@/utils/feedback';
import { feedbackTitle } from '@/utils/feedback/copy';
import { ICONS, MODULE_ICONS } from '@/config/icons';
import { getPaymentErrorMessage } from '@/utils/errors';

interface PaymentPopoverProps {
  /** Order to process payment for */
  order: Order;
  /** Callback invoked on successful payment */
  onSuccess?: () => void;
  /** Button size for the trigger (used only when trigger is not provided) */
  size?: 'sm' | 'md' | 'lg';
  /** Optional custom trigger element; when provided, used instead of the default PAY button */
  trigger?: React.ReactNode;
}

/** Get enabled payment methods from the single source of truth */
const PAYMENT_METHODS = getEnabledPaymentMethods();

interface PaymentPopoverContentProps {
  order: Order;
  remainingAmount: number;
  paymentsLoading: boolean;
  onCancel: () => void;
  /** Submitting state from parent (for preventClose). */
  submitting: boolean;
  /** Error message from parent (mutation onError). */
  error: string | null;
  /** Submit handler from parent (mutation runs in wrapper). */
  onSubmit: (paymentData: {
    orderId: string | number;
    amount: number;
    paymentMethod: PaymentMethod;
    notes?: string;
  }) => void;
}

/**
 * PaymentPopoverContent - Form content for payment processing
 *
 * Handles amount entry, payment method selection, and cash tendering logic.
 */
const PaymentPopoverContent: React.FC<PaymentPopoverContentProps> = ({
  order,
  remainingAmount,
  paymentsLoading,
  onCancel,
  submitting,
  error,
  onSubmit,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(getDefaultPaymentMethod());
  const [notes, setNotes] = useState<string>('');

  const amount = remainingAmount;
  const isValid = !paymentsLoading && amount > 0;

  const handleSubmit = useCallback(() => {
    if (amount <= 0) return;

    onSubmit({
      orderId: order.orderId,
      amount,
      paymentMethod,
      notes: notes.trim() || undefined,
    });
  }, [amount, paymentMethod, notes, order.orderId, onSubmit]);

  // Keyboard shortcuts for submit (Enter) and cancel (Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey && isValid && !submitting) {
        e.preventDefault();
        handleSubmit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSubmit, onCancel, isValid, submitting]);

  return (
    <PopoverForm
      title="Process Payment"
      subtitle={
        <span>
          Order <EntityId type="order" value={order.orderId} />
        </span>
      }
      onCancel={onCancel}
      onConfirm={handleSubmit}
      confirmLabel={amount > 0 ? `Pay ${formatCurrency(amount)}` : 'Fully Paid'}
      confirmVariant="primary"
      isSubmitting={submitting}
      disabled={!isValid}
      footerInfo={<FooterInfo icon={MODULE_ICONS.payments} label="Payments" />}
    >
      <OrderReceipt order={order} variant="compact" />

      {/* Payment Method Selection */}
      <div>
        <label className={`${FORM_FIELD_LABEL} mb-2`}>
          Payment Method <span className="text-danger-fg">*</span>
        </label>
        <PaymentMethodSelector
          methods={PAYMENT_METHODS}
          value={paymentMethod}
          onChange={setPaymentMethod}
        />
      </div>

      {/* Notes */}
      <div>
        <label className={`${FORM_FIELD_LABEL} mb-1`}>Notes</label>
        <textarea
          rows={2}
          placeholder="Add optional notes..."
          value={notes}
          onChange={e => setNotes(e.target.value)}
          className={cn(inputBase, 'resize-none')}
        />
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="danger" className="py-2">
          <p className="text-xs">{error}</p>
        </Alert>
      )}
    </PopoverForm>
  );
};

/** Inner content wrapper: syncs close to closeRef in an effect to satisfy react-hooks/immutability. */
const PaymentPopoverContentInner: React.FC<{
  close: () => void;
  closeRef: React.MutableRefObject<(() => void) | null>;
  order: Order;
  remainingAmount: number;
  paymentsLoading: boolean;
  submitting: boolean;
  error: string | null;
  onSubmit: (data: {
    orderId: string | number;
    amount: number;
    paymentMethod: PaymentMethod;
    notes?: string;
  }) => void;
}> = ({ close, closeRef, order, remainingAmount, paymentsLoading, submitting, error, onSubmit }) => {
  useEffect(() => {
    closeRef.current = close;
    return () => {
      closeRef.current = null;
    };
  }, [close, closeRef]);
  return (
    <div data-popover-content onClick={e => e.stopPropagation()}>
      <PaymentPopoverContent
        order={order}
        remainingAmount={remainingAmount}
        paymentsLoading={paymentsLoading}
        onCancel={close}
        submitting={submitting}
        error={error}
        onSubmit={onSubmit}
      />
    </div>
  );
};

/**
 * PaymentPopover - Popover trigger and container for payment processing
 *
 * Wraps PaymentPopoverContent with a Popover trigger. Shows PAY button when unpaid,
 * or a Paid badge when order is already paid.
 */
export const PaymentPopover: React.FC<PaymentPopoverProps> = ({
  order,
  onSuccess,
  size = 'sm',
  trigger,
}) => {
  const [error, setError] = useState<string | null>(null);
  const { mutate: createPaymentMutation, isPending: submitting } = useCreatePayment();
  const { remainingAmount, paymentsLoading } = useOrderRemainingBalance(
    String(order.orderId),
    order.totalPrice
  );

  const closeRef = useRef<(() => void) | null>(null);

  const handleSubmit = useCallback(
    (paymentData: {
      orderId: string | number;
      amount: number;
      paymentMethod: PaymentMethod;
      notes?: string;
    }) => {
      if (paymentData.amount <= 0) {
        setError(feedbackTitle('payment.amount.mustBePositive'));
        return;
      }
      setError(null);
      createPaymentMutation(paymentData, {
        onSuccess: () => {
          notify.toast('payment.record.success');
          onSuccess?.();
          closeRef.current?.();
        },
        onError: (err: unknown) => {
          setError(getPaymentErrorMessage(err, getFeedback('payment.process.error').title));
        },
      });
    },
    [createPaymentMutation, onSuccess]
  );

  const renderContent = useCallback(
    (close: () => void) => (
      <PaymentPopoverContentInner
        close={close}
        closeRef={closeRef}
        order={order}
        remainingAmount={remainingAmount}
        paymentsLoading={paymentsLoading}
        submitting={submitting}
        error={error}
        onSubmit={handleSubmit}
      />
    ),
    [order, remainingAmount, paymentsLoading, submitting, error, handleSubmit]
  );

  const isPaid = order.paymentStatus === 'paid' || (!paymentsLoading && remainingAmount <= 0);
  if (isPaid && trigger == null) {
    return <Badge variant="paid" size="sm" />;
  }

  const defaultTrigger = (
    <Button
      size={size}
      layout="icon-text"
      variant="primary"
      icon={<Icon name={ICONS.dataFields.wallet} className="text-on-brand" />}
    >
      PAY
    </Button>
  );

  return (
    <Popover
      placement="bottom-end"
      offsetValue={8}
      trigger={trigger ?? defaultTrigger}
      preventClose={submitting}
    >
      {({ close }) => renderContent(close)}
    </Popover>
  );
};
