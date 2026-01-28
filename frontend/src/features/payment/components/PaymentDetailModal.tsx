/**
 * PaymentDetailModal Component
 *
 * Modal that displays complete order payment information in a receipt-style layout.
 * Similar to PaymentPopover but larger - displays as a receipt with:
 * - Order details (ID, date, patient) in receipt header
 * - List of ordered tests with prices
 * - Total amount
 * - Payment method selection (if not paid)
 * - Notes field (if not paid)
 * - Cancel and Pay buttons in footer
 *
 * Payment methods are sourced from the centralized PAYMENT_METHOD_OPTIONS in types/billing.
 */
import React, { useState, useCallback } from 'react';
import { Modal, Icon, Badge, Button, Alert, FooterInfo } from '@/shared/ui';
import { PaymentErrorBoundary } from '@/shared/components';
import { formatDate, formatCurrency } from '@/utils';
import { displayId } from '@/utils/id-display';
import { useCreatePayment } from '@/hooks/queries/usePayments';
import {
  getEnabledPaymentMethods,
  getDefaultPaymentMethod,
  type PaymentMethod,
} from '@/types/billing';
import type { IconName } from '@/shared/ui';
// OrderPaymentDetails type
type OrderPaymentDetails = {
  orderId: number;
  orderDate: string;
  patientId: number;
  patientName: string;
  tests: Array<{
    testName: string;
    priceAtOrder: number;
    status?: string;
    testCode?: string;
  }>;
  totalPrice: number;
  paymentStatus: string;
  paymentMethod?: string;
  paymentDate?: string;
  order: any;
  payment?: {
    paymentId: number;
    paymentMethod: string;
    amount: number;
    paidAt: string;
  };
};
import { ICONS } from '@/utils/icon-mappings';

interface PaymentDetailModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Handler to close the modal */
  onClose: () => void;
  /** Order payment details to display and process payment for */
  order: OrderPaymentDetails | null;
  /** Callback invoked on successful payment */
  onPaymentSuccess?: () => void;
}

/** Get enabled payment methods from the single source of truth */
const PAYMENT_METHODS = getEnabledPaymentMethods();

/**
 * PaymentReceipt - Large receipt-style order summary with item list
 *
 * Renders order ID, patient, date, line items (tests with prices), and total
 * in a thermal-receipt inspired layout. Larger version for modal display.
 * Excludes superseded and removed tests; only active tests are shown and
 * included in the total.
 */
const PaymentReceipt: React.FC<{ order: OrderPaymentDetails }> = ({ order }) => {
  const activeTests =
    order.tests?.filter(
      t => t.status !== 'superseded' && t.status !== 'removed'
    ) ?? [];
  const activeTotal = activeTests.reduce(
    (sum, t) => sum + (typeof t.priceAtOrder === 'number' ? t.priceAtOrder : 0),
    0
  );

  return (
    <div className="rounded-lg border border-border overflow-hidden bg-surface">
      {/* Receipt Header */}
      <div className="px-6 py-4 border-b border-dashed border-border-strong bg-app-bg">
        <div className="flex justify-between items-center mb-2">
          {order.patientName ? (
            <p className="text-sm font-semibold text-text-secondary">{order.patientName}</p>
          ) : (
            <p className="text-sm text-text-tertiary italic">No patient name</p>
          )}
          <div className="flex items-center gap-2">
            <Badge variant={order.paymentStatus} size="sm" />
            {order.paymentMethod && (
              <Badge variant={order.paymentMethod} size="sm" />
            )}
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center text-xs">
            <span className="text-text-tertiary w-28">Order Number:</span>
            <span className="text-brand font-medium font-mono">{displayId.order(order.orderId)}</span>
          </div>
          <div className="flex items-center text-xs">
            <span className="text-text-tertiary w-28">Patient Number:</span>
            <span className="text-brand font-medium font-mono">{displayId.patient(order.patientId)}</span>
          </div>
          <div className="flex items-center text-xs">
            <span className="text-text-tertiary w-28">Order Date:</span>
            <span className="text-text-secondary font-medium">{formatDate(order.orderDate)}</span>
          </div>
          {order.paymentDate && (
            <div className="flex items-center text-xs">
              <span className="text-text-tertiary w-28">Payment Date:</span>
              <span className="text-text-secondary font-medium">{formatDate(order.paymentDate)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Items List (active tests only) */}
      <div className="px-6 py-4 max-h-96 overflow-y-auto">
        {activeTests.length > 0 ? (
          <ul className="space-y-2.5">
            {activeTests.map((test, idx) => (
              <li
                key={test.testCode ? `${test.testCode}-${idx}` : `item-${idx}`}
                className="flex justify-between gap-3 text-sm items-start"
              >
                <span className="flex items-start gap-2.5 min-w-0 flex-1">
                  <span className="w-1 h-1 rounded-full bg-neutral-400 shrink-0 mt-1.5" />
                  <span className="flex flex-col min-w-0 flex-1">
                    <span className="text-text-secondary truncate">
                      {test.testName || test.testCode || 'Test'}
                    </span>
                    {test.testCode && test.testName !== test.testCode && (
                      <span className="text-xs text-brand font-mono mt-0.5">{test.testCode}</span>
                    )}
                  </span>
                </span>
                <span className="font-medium text-text-primary tabular-nums shrink-0">
                  {formatCurrency(test.priceAtOrder)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-text-tertiary italic">No items</p>
        )}
      </div>

      {/* Receipt Footer with Total (sum of active tests only) */}
      <div className="border-t border-dashed border-border-strong mx-6" />
      <div className="px-6 py-4 flex justify-between items-center bg-app-bg">
        <span className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
          Total
        </span>
        <span className="text-lg font-bold text-brand tabular-nums">
          {formatCurrency(activeTotal)}
        </span>
      </div>
    </div>
  );
};

/**
 * PaymentDetailModal - Full payment details with inline payment processing
 *
 * Shows complete order information with test list in receipt format and allows payment
 * method selection directly in the modal. Larger version of the payment popover.
 */
// Large component is necessary for comprehensive payment detail modal with order info, test list, payment method selection, and processing
// eslint-disable-next-line max-lines-per-function
export const PaymentDetailModal: React.FC<PaymentDetailModalProps> = ({
  isOpen,
  onClose,
  order,
  onPaymentSuccess,
}) => {
  // Use mutation hook for payment creation
  const { mutate: createPaymentMutation, isPending: submitting } = useCreatePayment();

  // Form state - use default payment method from centralized config
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(getDefaultPaymentMethod());
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Reset form state when modal opens or order changes
  // This is a common pattern for resetting form state when a modal opens
  React.useEffect(() => {
    if (isOpen) {
      setPaymentMethod(getDefaultPaymentMethod());
      setNotes('');
      setError(null);
    }
  }, [isOpen, order?.orderId]);

  // Check if order is already paid
  const isPaid = order?.paymentStatus === 'paid';

  /**
   * Handles payment submission
   */
  const handlePayment = useCallback(() => {
    if (!order || isPaid) return;

    setError(null);

    // Validate amount
    if (order.totalPrice <= 0) {
      setError('Invalid order amount');
      return;
    }

    // Build payment request
    const paymentData = {
      orderId: order.orderId.toString(), // Convert to string as expected by hook
      amount: order.totalPrice,
      paymentMethod,
      notes: notes.trim() || undefined,
    };

    // Use mutation hook which handles cache invalidation automatically
    createPaymentMutation(paymentData, {
      onSuccess: () => {
        // Invoke success callback and close modal
        onPaymentSuccess?.();
        onClose();
      },
      onError: (err: unknown) => {
        const errorMessage = err instanceof Error ? err.message : 'Failed to process payment';
        setError(errorMessage);
      },
    });
  }, [order, isPaid, paymentMethod, notes, createPaymentMutation, onPaymentSuccess, onClose]);

  // Don't render if no order
  if (!order) return null;

  return (
    <PaymentErrorBoundary>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Process Payment"
        subtitle={<span>Order <span className="font-mono text-brand">{displayId.order(order.orderId)}</span></span>}
        size="xl"
        disableClose={submitting}
        closeOnBackdropClick={!submitting}
      >
        <div className="flex flex-col h-full bg-app-bg">
          {/* Scrollable content area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Receipt-style Order Summary */}
            <PaymentReceipt order={order} />

            {/* Payment Method Selection - Only show if not paid */}
            {!isPaid && (
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-3">
                  Payment Method <span className="text-danger">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {PAYMENT_METHODS.map(method => {
                    const isSelected = paymentMethod === method.value;
                    return (
                      <button
                        key={method.value}
                        type="button"
                        disabled={submitting}
                        onClick={() => !submitting && setPaymentMethod(method.value)}
                        className={`
                          relative flex items-center gap-2.5 p-3 rounded border transition-all duration-200
                          ${
                            isSelected
                              ? 'bg-surface border-brand border-2'
                              : 'bg-surface border-border hover:border-border-strong'
                          }
                          ${submitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                        `}
                      >
                        {/* Brand icon on the left */}
                        <Icon
                          name={method.icon as IconName}
                          className={`w-7 h-7 shrink-0 ${isSelected ? 'text-brand' : 'text-text-disabled'}`}
                        />
                        {/* Brand label */}
                        <span
                          className={`flex-1 text-xs font-medium text-left ${
                            isSelected ? 'text-text-primary' : 'text-text-secondary'
                          }`}
                        >
                          {method.label}
                        </span>
                        {/* Checkmark indicator in top-right */}
                        <div
                          className={`
                            absolute top-1/2 -translate-y-1/2 right-2 w-5 h-5 rounded-full flex items-center justify-center transition-colors
                            ${isSelected ? 'bg-green-600' : 'bg-transparent border-2 border-border-strong'}
                          `}
                        >
                          <Icon
                            name={ICONS.actions.check}
                            className={`w-3 h-3 ${isSelected ? 'text-white' : 'text-text-disabled'}`}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Notes - Only show if not paid */}
            {!isPaid && (
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Notes</label>
                <textarea
                  rows={3}
                  placeholder="Add optional notes..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  disabled={submitting}
                  className="w-full px-4 py-3 text-sm border border-border-strong rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent resize-none disabled:opacity-50 disabled:bg-app-bg"
                />
              </div>
            )}

            {/* Error Display */}
            {error && (
              <Alert variant="danger" className="py-3">
                <p className="text-sm">{error}</p>
              </Alert>
            )}

            {/* Paid Success Message */}
            {isPaid && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                <Icon name={ICONS.actions.checkCircle} className="w-6 h-6 text-green-600 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-700">Payment Complete</p>
                  <p className="text-xs text-green-600 mt-0.5">This order has been fully paid.</p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-border bg-surface shrink-0">
            <FooterInfo icon={ICONS.dataFields.wallet} text={isPaid ? 'Payment complete' : 'Processing payment'} />
            <div className="flex items-center gap-3">
            <Button
              variant={isPaid ? 'close' : 'cancel'}
              size="md"
              showIcon={true}
              onClick={onClose}
              disabled={submitting}
            >
              {isPaid ? 'Close' : 'Cancel'}
            </Button>

            {!isPaid && (
              <Button
                variant="primary"
                size="md"
                onClick={handlePayment}
                disabled={submitting}
                isLoading={submitting}
                icon={!submitting ? <Icon name={ICONS.dataFields.wallet} /> : undefined}
              >
                {submitting ? 'Processing...' : `Pay ${formatCurrency(order.totalPrice)}`}
              </Button>
            )}
            </div>
          </div>
        </div>
      </Modal>
    </PaymentErrorBoundary>
  );
};
