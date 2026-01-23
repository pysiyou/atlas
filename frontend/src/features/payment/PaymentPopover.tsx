/**
 * PaymentPopover Component
 * Popover interface for processing payments on orders
 *
 * Uses the shared PopoverForm component for consistent styling with other lab popovers.
 * Payment methods are sourced from the centralized PAYMENT_METHOD_OPTIONS in types/billing.
 */
import React, { useState, useCallback, useEffect } from 'react';
import { Popover, Button, Icon, Alert, Badge } from '@/shared/ui';
import { PopoverForm } from '@/features/lab/components/PopoverForm';
import { formatCurrency } from '@/utils';
import { displayId } from '@/utils/id-display';
import type { Order } from '@/types';
import {
  getEnabledPaymentMethods,
  getDefaultPaymentMethod,
  type PaymentMethod,
} from '@/types/billing';
import { createPayment, type PaymentCreate } from '@/services/api/payments';
import type { IconName } from '@/shared/ui/Icon';

interface PaymentPopoverProps {
  /** Order to process payment for */
  order: Order;
  /** Callback invoked on successful payment */
  onSuccess?: () => void;
  /** Button size for the trigger */
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

/** Get enabled payment methods from the single source of truth */
const PAYMENT_METHODS = getEnabledPaymentMethods();

interface PaymentPopoverContentProps {
  order: Order;
  onConfirm: () => void;
  onCancel: () => void;
  onSuccess?: () => void;
}

/**
 * PaymentPopoverContent - Form content for payment processing
 *
 * Handles amount entry, payment method selection, and cash tendering logic.
 */
const PaymentPopoverContent: React.FC<PaymentPopoverContentProps> = ({
  order,
  onConfirm,
  onCancel,
  onSuccess,
}) => {
  // Form state - use default payment method from centralized config
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(getDefaultPaymentMethod());
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Amount is fixed to the order's total price
  const amount = order.totalPrice;
  const isValid = amount > 0;

  /**
   * Handles form submission and payment creation
   */
  const handleSubmit = useCallback(async () => {
    setError(null);

    // Validate amount
    if (amount <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    try {
      setSubmitting(true);

      // Build payment request
      const paymentData: PaymentCreate = {
        orderId: order.orderId, // number is fine, API will handle conversion
        amount,
        paymentMethod,
        notes: notes.trim() || undefined,
      };

      await createPayment(paymentData);

      // Invoke success callback and close popover
      onSuccess?.();
      onConfirm();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process payment';
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  }, [amount, paymentMethod, notes, order.orderId, onSuccess, onConfirm]);

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
      subtitle={`Order ${displayId.order(order.orderId)}`}
      onCancel={onCancel}
      onConfirm={handleSubmit}
      confirmLabel="Process Payment"
      confirmVariant="primary"
      isSubmitting={submitting}
      disabled={!isValid}
      footerInfo={
        <div className="flex items-center gap-1.5">
          <Icon name="dollar-sign" className="w-3.5 h-3.5" />
          <span>Processing payment</span>
        </div>
      }
    >
      {/* Order Summary */}
      <div className="bg-gray-50 rounded-lg p-3 space-y-2 border border-gray-100">
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">Total Price:</span>
          <span className="font-semibold text-gray-900">{formatCurrency(order.totalPrice)}</span>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-gray-500">Payment Status:</span>
          <Badge variant={order.paymentStatus} size="xs" />
        </div>
      </div>

      {/* Payment Method Selection */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">
          Payment Method <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          {PAYMENT_METHODS.map(method => {
            const isSelected = paymentMethod === method.value;
            return (
              <div
                key={method.value}
                className={`
                  relative flex items-center gap-2 p-3 rounded-lg border transition-all duration-200 cursor-pointer
                  ${
                    isSelected
                      ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-200'
                      : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }
                `}
                onClick={() => setPaymentMethod(method.value)}
              >
                <input
                  type="radio"
                  name="payment-method"
                  checked={isSelected}
                  onChange={() => setPaymentMethod(method.value)}
                  className="h-3.5 w-3.5 border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span
                  className={`flex-1 text-xs font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}
                >
                  {method.label}
                </span>
                <Icon
                  name={method.icon as IconName}
                  className={`w-5 h-5 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
        <textarea
          rows={2}
          placeholder="Add optional notes..."
          value={notes}
          onChange={e => setNotes(e.target.value)}
          className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
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

/**
 * PaymentPopover - Popover trigger and container for payment processing
 *
 * Wraps PaymentPopoverContent with a Popover trigger button.
 */
export const PaymentPopover: React.FC<PaymentPopoverProps> = ({
  order,
  onSuccess,
  size = 'sm',
}) => (
  <Popover
    placement="bottom-end"
    offsetValue={8}
    trigger={
      <Button size={size} variant="primary" icon={<Icon name="wallet" className="text-white" />}>
        PAY
      </Button>
    }
  >
    {({ close }) => (
      <div data-popover-content onClick={e => e.stopPropagation()}>
        <PaymentPopoverContent
          order={order}
          onConfirm={close}
          onCancel={close}
          onSuccess={onSuccess}
        />
      </div>
    )}
  </Popover>
);
