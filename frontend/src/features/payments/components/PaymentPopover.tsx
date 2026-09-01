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
} from '@/components';
import { PopoverForm } from '@/features/lab';
import { cn, formatCurrency, displayId } from '@/utils';
import { getActiveTests, getActiveTotal } from '@/features/orders/utils';
import { inputBase } from '@/components/inputs/inputStyles';
import type { Order } from '@/types';
import {
  getEnabledPaymentMethods,
  getDefaultPaymentMethod,
  type PaymentMethod,
} from '@/types/payments';
import { useCreatePayment } from '../api/payments.api';
import { ICONS, MODULE_ICONS } from '@/config/icons';
import { getPaymentErrorMessage } from '@/utils/errors';

interface PaymentPopoverProps {
  /** Order to process payment for */
  order: Order;
  /** Callback invoked on successful payment */
  onSuccess?: () => void;
  /** Button size for the trigger (used only when trigger is not provided) */
  size?: 'xs' | 'sm' | 'md' | 'lg';
  /** Optional custom trigger element; when provided, used instead of the default PAY button */
  trigger?: React.ReactNode;
}

/** Get enabled payment methods from the single source of truth */
const PAYMENT_METHODS = getEnabledPaymentMethods();

/**
 * PaymentReceipt - Receipt-style order summary with item list
 *
 * Renders order ID, patient, line items (tests with prices), and total
 * in a thermal-receipt inspired layout. Excludes superseded and removed
 * tests; only active tests are shown and included in the total.
 */
const PaymentReceipt: React.FC<{ order: Order }> = ({ order }) => {
  const activeTests = getActiveTests(order.tests ?? []);
  const activeTotal = getActiveTotal(order.tests ?? []);

  return (
    <div className="rounded border border-border-default overflow-hidden">
      <div className="px-3 py-2.5 border-b border-dashed border-border-strong">
        <div className="flex justify-between items-center">
          <span className="text-xs font-normal text-text-secondary uppercase tracking-wider">
            Order <span className="entity-id">{displayId.order(order.orderId)}</span>
          </span>
          <Badge variant={order.paymentStatus} size="xs" />
        </div>
        {order.patientName && (
          <p className="text-[11px] text-text-tertiary mt-0.5 truncate">{order.patientName}</p>
        )}
      </div>
      <div className="px-3 py-2 max-h-32 overflow-y-auto">
        {activeTests.length > 0 ? (
          <ul className="space-y-1.5">
            {activeTests.map((test, idx) => (
              <li
                key={test.testCode ? `${test.testCode}-${idx}` : `item-${idx}`}
                className="flex justify-between gap-2 text-xs items-center"
              >
                <span className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="w-1 h-1 rounded-full bg-neutral-400 shrink-0" />
                  <span className="text-text-secondary truncate">
                    {test.testName || test.testCode || 'Test'}
                    {test.testCode && test.testName !== test.testCode && (
                      <span className="entity-id ml-1">({test.testCode})</span>
                    )}
                  </span>
                </span>
                <span className="font-normal text-text-primary tabular-nums shrink-0">
                  {formatCurrency(test.priceAtOrder)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-text-tertiary italic">No items</p>
        )}
      </div>
      <div className="border-t border-dashed border-border-strong" />
      <div className="px-3 py-2.5 flex justify-between items-center">
        <span className="text-xs font-normal text-text-secondary uppercase tracking-wider">
          Total
        </span>
        <span className="text-sm font-normal text-brand tabular-nums">
          {formatCurrency(activeTotal)}
        </span>
      </div>
    </div>
  );
};

interface PaymentPopoverContentProps {
  order: Order;
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
  onCancel,
  submitting,
  error,
  onSubmit,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(getDefaultPaymentMethod());
  const [notes, setNotes] = useState<string>('');

  // Amount is fixed to the order's total price
  const amount = order.totalPrice;
  const isValid = amount > 0;

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
          Order <span className="entity-id">{displayId.order(order.orderId)}</span>
        </span>
      }
      onCancel={onCancel}
      onConfirm={handleSubmit}
      confirmLabel="Process Payment"
      confirmVariant="primary"
      isSubmitting={submitting}
      disabled={!isValid}
      footerInfo={<FooterInfo icon={MODULE_ICONS.payments} label="Payments" />}
    >
      <PaymentReceipt order={order} />

      {/* Payment Method Selection */}
      <div>
        <label className="block text-xs font-normal text-text-tertiary mb-2">
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
        <label className="block text-xs font-normal text-text-tertiary mb-1">Notes</label>
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
  submitting: boolean;
  error: string | null;
  onSubmit: (data: {
    orderId: string | number;
    amount: number;
    paymentMethod: PaymentMethod;
    notes?: string;
  }) => void;
}> = ({ close, closeRef, order, submitting, error, onSubmit }) => {
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

  const closeRef = useRef<(() => void) | null>(null);

  const handleSubmit = useCallback(
    (paymentData: {
      orderId: string | number;
      amount: number;
      paymentMethod: PaymentMethod;
      notes?: string;
    }) => {
      if (paymentData.amount <= 0) {
        setError('Amount must be greater than 0');
        return;
      }
      setError(null);
      createPaymentMutation(paymentData, {
        onSuccess: () => {
          onSuccess?.();
          closeRef.current?.();
        },
        onError: (err: unknown) => {
          setError(getPaymentErrorMessage(err, 'Failed to process payment'));
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
        submitting={submitting}
        error={error}
        onSubmit={handleSubmit}
      />
    ),
    [order, submitting, error, handleSubmit]
  );

  const isPaid = order.paymentStatus === 'paid';
  if (isPaid && trigger == null) {
    return <Badge variant="paid" size="sm" />;
  }

  const defaultTrigger = (
    <Button
      size={size}
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
