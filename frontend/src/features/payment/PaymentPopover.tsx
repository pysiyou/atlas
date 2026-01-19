/**
 * PaymentPopover Component
 * Popover interface for processing payments on orders
 * 
 * Uses the shared PopoverForm component for consistent styling with other lab popovers.
 */
import React, { useState, useCallback, useEffect } from 'react';
import { Popover, Button, Icon, Alert } from '@/shared/ui';
import { PopoverForm } from '@/features/lab/shared/PopoverForm';
import { formatCurrency } from '@/utils';
import type { Order, PaymentMethod } from '@/types';
import { createPayment, type PaymentCreate } from '@/services/api/payments';

interface PaymentPopoverProps {
  /** Order to process payment for */
  order: Order;
  /** Callback invoked on successful payment */
  onSuccess?: () => void;
  /** Button size for the trigger */
  size?: 'sm' | 'md' | 'lg';
}

/** Available payment method options */
const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: string }[] = [
  { value: 'cash', label: 'Cash', icon: 'dollar-sign' },
  { value: 'credit-card', label: 'Credit Card', icon: 'credit-card' },
  { value: 'debit-card', label: 'Debit Card', icon: 'credit-card' },
  { value: 'insurance', label: 'Insurance', icon: 'shield' },
  { value: 'bank-transfer', label: 'Bank Transfer', icon: 'wallet' },
  { value: 'mobile-money', label: 'Mobile Money', icon: 'phone' },
];

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
  // Form state
  const [amount, setAmount] = useState<string>(order.totalPrice.toString());
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Computed values for validation
  const amountNum = parseFloat(amount) || 0;
  const isValid = amountNum > 0;

  /**
   * Handles form submission and payment creation
   */
  const handleSubmit = useCallback(async () => {
    setError(null);

    // Validate amount
    if (amountNum <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    try {
      setSubmitting(true);

      // Build payment request
      const paymentData: PaymentCreate = {
        orderId: order.orderId,
        amount: amountNum,
        paymentMethod,
        notes: notes.trim() || undefined,
      };

      await createPayment(paymentData);

      // Invoke success callback and close popover
      onSuccess?.();
      onConfirm();
    } catch (err: any) {
      setError(err.message || 'Failed to process payment');
    } finally {
      setSubmitting(false);
    }
  }, [amountNum, paymentMethod, notes, order.orderId, onSuccess, onConfirm]);

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
      subtitle={`Order ${order.orderId}`}
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
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">Payment Status:</span>
          <span className="capitalize text-gray-900">{order.paymentStatus}</span>
        </div>
      </div>

      {/* Amount Input */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">
          Amount <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400 pointer-events-none">
            $
          </span>
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={`w-full pl-7 pr-3 py-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all placeholder-gray-400 ${
              amountNum <= 0 ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="0.00"
          />
        </div>
      </div>

      {/* Payment Method Selection */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">
          Payment Method <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          {PAYMENT_METHODS.map((method) => {
            const isSelected = paymentMethod === method.value;
            return (
              <button
                key={method.value}
                type="button"
                onClick={() => setPaymentMethod(method.value)}
                className={`flex items-center gap-2 py-2 px-3 rounded-sm border transition-all duration-200 text-xs font-medium ${
                  isSelected
                    ? 'bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-200'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
                }`}
              >
                <Icon
                  name={method.icon}
                  className={`w-4 h-4 ${isSelected ? 'text-blue-600' : 'text-gray-500'}`}
                />
                <span>{method.label}</span>
              </button>
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
          onChange={(e) => setNotes(e.target.value)}
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
      <Button
        size={size}
        variant="primary"
        icon={<Icon name="wallet" className="text-white" />}
      >
        PAY
      </Button>
    }
  >
    {({ close }) => (
      <div data-popover-content onClick={(e) => e.stopPropagation()}>
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

