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
import { useCreatePayment } from '@/hooks/queries/usePayments';
import type { IconName } from '@/shared/ui/Icon';
import { ICONS } from '@/utils/icon-mappings';
import { semanticColors, brandColors } from '@/shared/design-system/tokens/colors';

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
  const activeTests =
    order.tests?.filter(
      t => t.status !== 'superseded' && t.status !== 'removed'
    ) ?? [];
  const activeTotal = activeTests.reduce(
    (sum, t) => sum + (typeof t.priceAtOrder === 'number' ? t.priceAtOrder : 0),
    0
  );

  return (
    <div className="rounded border border-gray-200 overflow-hidden">
      <div className="px-3 py-2.5 border-b border-dashed border-gray-300">
        <div className="flex justify-between items-center">
          <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
            Order <span className="font-mono">{displayId.order(order.orderId)}</span>
          </span>
          <Badge variant={order.paymentStatus} size="xs" />
        </div>
        {order.patientName && (
          <p className="text-[11px] text-gray-500 mt-0.5 truncate">{order.patientName}</p>
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
                  <span className="w-1 h-1 rounded-full bg-gray-400 shrink-0" />
                  <span className="text-gray-700 truncate">
                    {test.testName || test.testCode || 'Test'}
                    {test.testCode && test.testName !== test.testCode && (
                      <span className="text-gray-500 ml-1">({test.testCode})</span>
                    )}
                  </span>
                </span>
                <span className="font-medium text-gray-800 tabular-nums shrink-0">
                  {formatCurrency(test.priceAtOrder)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-gray-500 italic">No items</p>
        )}
      </div>
      <div className="border-t border-dashed border-gray-300 mx-3" />
      <div className="px-3 py-2.5 flex justify-between items-center">
        <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
          Total
        </span>
        <span className={`text-sm font-bold ${brandColors.primary.iconLight} tabular-nums`}>
          {formatCurrency(activeTotal)}
        </span>
      </div>
    </div>
  );
};

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
  const [error, setError] = useState<string | null>(null);

  // Use mutation hook for payment creation
  const { mutate: createPaymentMutation, isPending: submitting } = useCreatePayment();

  // Amount is fixed to the order's total price
  const amount = order.totalPrice;
  const isValid = amount > 0;

  /**
   * Handles form submission and payment creation
   */
  const handleSubmit = useCallback(() => {
    setError(null);

    // Validate amount
    if (amount <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    // Build payment request
    const paymentData = {
      orderId: order.orderId.toString(), // Convert to string as expected by hook
      amount,
      paymentMethod,
      notes: notes.trim() || undefined,
    };

    // Use mutation hook which handles cache invalidation automatically
    createPaymentMutation(paymentData, {
      onSuccess: () => {
        // Invoke success callback and close popover
        onSuccess?.();
        onConfirm();
      },
      onError: (err: unknown) => {
        const errorMessage = err instanceof Error ? err.message : 'Failed to process payment';
        setError(errorMessage);
      },
    });
  }, [amount, paymentMethod, notes, order.orderId, createPaymentMutation, onSuccess, onConfirm]);

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
      subtitle={<span>Order <span className="font-mono">{displayId.order(order.orderId)}</span></span>}
      onCancel={onCancel}
      onConfirm={handleSubmit}
      confirmLabel="Process Payment"
      confirmVariant="primary"
      isSubmitting={submitting}
      disabled={!isValid}
      footerInfo={
        <div className="flex items-center gap-1.5">
          <Icon name={ICONS.dataFields.wallet} className="w-3.5 h-3.5" />
          <span>Processing payment</span>
        </div>
      }
    >
      <PaymentReceipt order={order} />

      {/* Payment Method Selection */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-2">
          Payment Method <span className={semanticColors.danger.requiredIndicator}>*</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          {PAYMENT_METHODS.map(method => {
            const isSelected = paymentMethod === method.value;
            return (
              <button
                key={method.value}
                type="button"
                onClick={() => setPaymentMethod(method.value)}
                className={`
                  relative flex items-center gap-2.5 p-3 rounded border transition-all duration-200
                  ${
                    isSelected
                      ? `bg-white ${brandColors.primary.borderMedium} border-2`
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                {/* Brand icon on the left */}
                <Icon
                  name={method.icon as IconName}
                  className={`w-7 h-7 shrink-0 ${isSelected ? brandColors.primary.icon : 'text-gray-400'}`}
                />
                {/* Brand label */}
                <span
                  className={`flex-1 text-xs font-medium text-left ${
                    isSelected ? 'text-gray-900' : 'text-gray-700'
                  }`}
                >
                  {method.label}
                </span>
                {/* Checkmark indicator in top-right */}
                <div
                  className={`
                    absolute top-1/2 -translate-y-1/2 right-2 w-5 h-5 rounded-full flex items-center justify-center transition-colors
                    ${isSelected ? semanticColors.success.backgroundMedium : 'bg-transparent border-2 border-gray-300'}
                  `}
                >
                  <Icon
                    name={ICONS.actions.check}
                    className={`w-3 h-3 ${isSelected ? 'text-white' : 'text-gray-300'}`}
                  />
                </div>
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
const DEFAULT_TRIGGER = (size: 'xs' | 'sm' | 'md' | 'lg') => (
  <Button size={size} variant="primary" icon={<Icon name={ICONS.dataFields.wallet} className="text-white" />}>
    PAY
  </Button>
);

export const PaymentPopover: React.FC<PaymentPopoverProps> = ({
  order,
  onSuccess,
  size = 'sm',
  trigger,
}) => (
  <Popover
    placement="bottom-end"
    offsetValue={8}
    trigger={trigger ?? DEFAULT_TRIGGER(size)}
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
